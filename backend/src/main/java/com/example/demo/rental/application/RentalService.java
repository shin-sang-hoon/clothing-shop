package com.example.demo.rental.application;

import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemImage;
import com.example.demo.catalog.item.domain.ItemImageRepository;
import com.example.demo.catalog.item.domain.ItemImageType;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.application.MemberStatusService;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import com.example.demo.rental.domain.RentalOrder;
import com.example.demo.rental.domain.RentalOrderRepository;
import com.example.demo.rental.dto.RentalDtos;
import com.example.demo.trade.domain.ItemOption;
import com.example.demo.trade.domain.ItemOptionRentalStatus;
import com.example.demo.trade.domain.ItemOptionRepository;
import com.example.demo.trade.infra.PortOneClient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RentalService {

    private final MemberRepository memberRepository;
    private final ItemRepository itemRepository;
    private final RentalOrderRepository rentalOrderRepository;
    private final MemberStatusService memberStatusService;
    private final ItemOptionRepository itemOptionRepository;
    private final ItemImageRepository itemImageRepository;
    private final PortOneClient portOneClient;
    private final SimpMessagingTemplate messagingTemplate;

    /** 연체료율: 1일 렌탈가의 50% */
    private static final double OVERDUE_FEE_RATE = 0.5;
    /** 보증금: 총 렌탈금액의 20%, 최소 10,000원 */
    private static final double DEPOSIT_RATE = 0.20;
    private static final int MIN_DEPOSIT = 10_000;

    /**
     * 포트원 결제 검증 후 렌탈 신청
     * 결제 금액 = (rentalPrice * days) + 보증금(rentalPrice * days * 20%)
     */
    @Transactional
    public RentalDtos.RentalOrderResponse verifyAndCreateRental(
            String renterEmail, RentalDtos.VerifyAndCreateRentalRequest req) {

        PortOneClient.PaymentResponse payment;
        try {
            payment = portOneClient.getPayment(req.paymentId());
        } catch (Exception e) {
            throw new IllegalStateException("결제 정보를 조회할 수 없습니다: " + e.getMessage());
        }

        if (!"PAID".equals(payment.status())) {
            throw new IllegalStateException("결제가 완료되지 않았습니다. 상태: " + payment.status());
        }

        // 기대 결제금액 계산: (rentalPrice * days) + 보증금
        LocalDate startDate = LocalDate.parse(req.startDate(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        LocalDate endDate   = LocalDate.parse(req.endDate(),   DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        Item item = itemRepository.findById(req.itemId())
                .orElseThrow(() -> new IllegalArgumentException("아이템을 찾을 수 없습니다."));
        int totalRental = (int) (item.getRentalPrice() * days);
        int deposit     = Math.max((int) (totalRental * DEPOSIT_RATE), MIN_DEPOSIT);
        long expectedAmount = (long) totalRental + deposit;

        long paid = payment.amount() != null && payment.amount().total() != null
                ? payment.amount().total() : -1L;
        if (paid != expectedAmount) {
            throw new IllegalStateException("결제 금액이 일치하지 않습니다. 요청=" + expectedAmount + ", 실제=" + paid);
        }

        RentalDtos.CreateRentalRequest createReq = new RentalDtos.CreateRentalRequest(
                req.itemId(), req.itemOptionId(), null,
                req.startDate(), req.endDate(),
                req.receiverName(), req.receiverPhone(),
                req.zipCode(), req.roadAddress(), req.detailAddress(),
                req.sizeInfo()
        );
        return createRental(renterEmail, createReq);
    }

    @Transactional
    public RentalDtos.RentalOrderResponse createRental(String renterEmail, RentalDtos.CreateRentalRequest req) {
        Member renter = memberStatusService.getActiveMemberByEmail(renterEmail);
        Member seller;
        if (req.sellerId() != null) {
            seller = memberRepository.findById(req.sellerId())
                    .orElseThrow(() -> new IllegalArgumentException("판매자를 찾을 수 없습니다."));
            memberStatusService.validateActive(seller);
        } else {
            // sellerId 미지정 시 SUPER_ADMIN 계정을 seller로 사용
            seller = memberRepository.findByRoleName("SUPER_ADMIN").stream()
                    .findFirst()
                    .orElse(renter);
        }

        Item item = itemRepository.findById(req.itemId())
                .orElseThrow(() -> new IllegalArgumentException("아이템을 찾을 수 없습니다."));

        LocalDate startDate = LocalDate.parse(req.startDate(), DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        LocalDate endDate   = LocalDate.parse(req.endDate(),   DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        if (!endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("종료일은 시작일 이후여야 합니다.");
        }
        long days = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        // SKU 처리
        ItemOption itemOption = null;
        if (req.itemOptionId() != null) {
            itemOption = itemOptionRepository.findById(req.itemOptionId())
                    .orElseThrow(() -> new IllegalArgumentException("옵션을 찾을 수 없습니다."));

            // 상태 체크
            if (itemOption.getRentalStatus() != ItemOptionRentalStatus.AVAILABLE) {
                throw new IllegalStateException("현재 대여 불가능한 상품입니다. (상태: " + itemOption.getRentalStatus() + ")");
            }

            // 기간 중복 체크
            if (rentalOrderRepository.existsOverlappingRental(itemOption.getId(), startDate, endDate)) {
                throw new IllegalStateException("해당 기간에 이미 예약된 렌탈이 있습니다.");
            }

            // 옵션 상태 변경 → 대여중
            itemOption.setRentalStatus(ItemOptionRentalStatus.RENTING);
        }

        Integer rentalPrice = item.getRentalPrice();
        int totalRental  = (int) (rentalPrice * days);
        int deposit      = Math.max((int) (totalRental * DEPOSIT_RATE), MIN_DEPOSIT);
        int paidAmount   = totalRental + deposit;

        String orderNo = generateOrderNo();

        RentalOrder order = new RentalOrder();
        order.setOrderNo(orderNo);
        order.setSeller(seller);
        order.setRenter(renter);
        order.setItem(item);
        order.setItemOption(itemOption);
        order.setStartDate(startDate);
        order.setEndDate(endDate);
        order.setRentalPrice(rentalPrice);
        order.setDeposit(deposit);
        order.setPaidAmount(paidAmount);
        order.setOverdueFee(0);
        order.setReceiverName(req.receiverName());
        order.setReceiverPhone(req.receiverPhone());
        order.setZipCode(req.zipCode());
        order.setRoadAddress(req.roadAddress());
        order.setDetailAddress(req.detailAddress());
        order.setSizeInfo(req.sizeInfo());

        return toResponse(rentalOrderRepository.save(order));
    }

    /** 관리자: 렌탈 상태 변경 */
    @Transactional
    public RentalDtos.RentalOrderResponse adminUpdateStatus(Long rentalId, String newStatus) {
        RentalOrder order = rentalOrderRepository.findById(rentalId)
                .orElseThrow(() -> new IllegalArgumentException("렌탈을 찾을 수 없습니다."));
        order.setStatus(newStatus);

        // SKU 상태 연동
        if (order.getItemOption() != null) {
            switch (newStatus) {
                case "렌탈중"   -> order.getItemOption().setRentalStatus(ItemOptionRentalStatus.RENTING);
                case "반납완료" -> order.getItemOption().setRentalStatus(ItemOptionRentalStatus.INSPECTING);
                case "취소"     -> order.getItemOption().setRentalStatus(ItemOptionRentalStatus.AVAILABLE);
            }
        }

        // 연체료 계산 (반납완료 시)
        if ("반납완료".equals(newStatus)) {
            LocalDate today = LocalDate.now();
            if (order.getEndDate() != null && today.isAfter(order.getEndDate())) {
                long overdueDays = ChronoUnit.DAYS.between(order.getEndDate(), today);
                int overdueFee = (int) (order.getRentalPrice() * OVERDUE_FEE_RATE * overdueDays);
                order.setOverdueFee(overdueFee);
            }
        }

        return toResponse(rentalOrderRepository.save(order));
    }

    /** 관리자: 배송 정보 등록 → deliveryStatus 자동으로 SHIPPING 변경 + WebSocket 푸시 */
    @Transactional
    public RentalDtos.RentalOrderResponse adminRegisterShipping(Long rentalId, String courier, String trackingNumber) {
        RentalOrder order = rentalOrderRepository.findById(rentalId)
                .orElseThrow(() -> new IllegalArgumentException("렌탈을 찾을 수 없습니다."));
        order.setCourier(courier);
        order.setTrackingNumber(trackingNumber);
        order.setDeliveryStatus("SHIPPING");
        RentalOrder saved = rentalOrderRepository.save(order);

        messagingTemplate.convertAndSend(
                "/topic/rental/delivery/" + saved.getOrderNo(),
                "SHIPPING"
        );

        return toResponse(saved);
    }

    /** 관리자: 배송 진행 상태 변경 (NONE/READY/SHIPPING/DELIVERED) + WebSocket 푸시
     *  DELIVERED 시 렌탈 상태를 자동으로 렌탈중으로 변경 */
    @Transactional
    public void adminUpdateDeliveryStatus(Long rentalId, String deliveryStatus) {
        RentalOrder order = rentalOrderRepository.findById(rentalId)
                .orElseThrow(() -> new IllegalArgumentException("렌탈을 찾을 수 없습니다."));
        order.setDeliveryStatus(deliveryStatus);

        // 상품 도착 시 렌탈 상태 자동으로 렌탈중 전환
        if ("DELIVERED".equals(deliveryStatus)) {
            order.setStatus("렌탈중");
            if (order.getItemOption() != null) {
                order.getItemOption().setRentalStatus(ItemOptionRentalStatus.RENTING);
            }
        }

        rentalOrderRepository.save(order);

        // 실시간 반영: 배송 상태가 NONE이 아닐 때만 푸시
        if (!"NONE".equals(deliveryStatus)) {
            messagingTemplate.convertAndSend(
                    "/topic/rental/delivery/" + order.getOrderNo(),
                    deliveryStatus
            );
        }
    }

    /** 특정 아이템의 SKU별 렌탈 가용성 조회 */
    @Transactional(readOnly = true)
    public List<RentalDtos.RentalAvailabilityResponse> getOptionAvailability(
            Long itemId, String startDateStr, String endDateStr) {

        List<ItemOption> options = itemOptionRepository.findByItemId(itemId);
        LocalDate startDate = LocalDate.parse(startDateStr);
        LocalDate endDate   = LocalDate.parse(endDateStr);

        return options.stream().map(opt -> {
            boolean availableForDates =
                    opt.getRentalStatus() == ItemOptionRentalStatus.AVAILABLE &&
                    !rentalOrderRepository.existsOverlappingRental(opt.getId(), startDate, endDate);
            return new RentalDtos.RentalAvailabilityResponse(
                    opt.getId(),
                    opt.getOptionValue(),
                    opt.getRentalStatus() != null ? opt.getRentalStatus().name() : "AVAILABLE",
                    availableForDates
            );
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<RentalDtos.RentalOrderResponse> getMyRenting(String email) {
        Member member = memberStatusService.getActiveMemberByEmail(email);
        return rentalOrderRepository.findByRenterIdWithDetails(member.getId()).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RentalDtos.RentalOrderResponse> getMyLending(String email) {
        Member member = memberStatusService.getActiveMemberByEmail(email);
        return rentalOrderRepository.findBySellerIdWithDetails(member.getId()).stream()
                .map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<RentalDtos.AdminRentalListResponse> getAdminRentalList(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<RentalOrder> pageResult = rentalOrderRepository.findAllWithDetails(pageable);
        List<RentalDtos.AdminRentalListResponse> content = pageResult.getContent().stream()
                .map(this::toAdminListResponse).toList();
        return new PageResponse<>(content, pageResult.getNumber(), pageResult.getSize(),
                pageResult.getTotalElements(), pageResult.getTotalPages(),
                pageResult.isFirst(), pageResult.isLast());
    }

    private String generateOrderNo() {
        String date = LocalDate.now().toString().replace("-", "");
        String candidate;
        do {
            String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
            candidate = "R" + date + uuid;
        } while (rentalOrderRepository.existsByOrderNo(candidate));
        return candidate;
    }

    private RentalDtos.RentalOrderResponse toResponse(RentalOrder order) {
        String itemImageUrl = itemImageRepository
                .findByItemIdAndImageType(order.getItem().getId(), ItemImageType.MAIN)
                .map(ItemImage::getImageUrl)
                .orElse(null);
        return new RentalDtos.RentalOrderResponse(
                order.getId(),
                order.getOrderNo(),
                order.getItem().getId(),
                order.getItem().getName(),
                order.getItem().getBrand().getNameKo(),
                order.getItemOption() != null ? order.getItemOption().getId() : null,
                order.getItemOption() != null ? order.getItemOption().getOptionValue() : null,
                order.getSeller().getEmail(),
                order.getSeller().getName(),
                order.getSeller().getPhoneNumber(),
                order.getRenter().getEmail(),
                order.getRenter().getName(),
                order.getRenter().getPhoneNumber(),
                order.getStartDate() != null ? order.getStartDate().toString() : null,
                order.getEndDate()   != null ? order.getEndDate().toString()   : null,
                order.getRentalPrice(),
                order.getDeposit(),
                order.getPaidAmount(),
                order.getOverdueFee(),
                order.getCourier(),
                order.getTrackingNumber(),
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getZipCode(),
                order.getRoadAddress(),
                order.getDetailAddress(),
                order.getSizeInfo(),
                itemImageUrl,
                order.getStatus(),
                ApiDateTimeConverter.toUtcString(order.getCreatedAt())
        );
    }

    private RentalDtos.AdminRentalListResponse toAdminListResponse(RentalOrder order) {
        return new RentalDtos.AdminRentalListResponse(
                order.getId(),
                order.getOrderNo(),
                order.getRenter().getEmail(),
                order.getRenter().getName(),
                order.getRenter().getPhoneNumber(),
                order.getSeller().getEmail(),
                order.getSeller().getName(),
                order.getSeller().getPhoneNumber(),
                order.getItem().getName(),
                order.getItem().getBrand().getNameKo(),
                order.getItemOption() != null ? order.getItemOption().getOptionValue() : null,
                order.getReceiverName(),
                order.getReceiverPhone(),
                order.getPaidAmount(),
                order.getOverdueFee(),
                order.getCourier(),
                order.getTrackingNumber(),
                order.getStartDate() != null ? order.getStartDate().toString() : null,
                order.getEndDate()   != null ? order.getEndDate().toString()   : null,
                order.getStatus(),
                order.getDeliveryStatus() != null ? order.getDeliveryStatus() : "NONE",
                ApiDateTimeConverter.toUtcString(order.getCreatedAt())
        );
    }
}
