package com.example.demo.trade.application;

import com.example.demo.catalog.filter.domain.Filter;
import com.example.demo.catalog.filter.domain.FilterRepository;
import com.example.demo.catalog.item.domain.Item;
import com.example.demo.catalog.item.domain.ItemImage;
import com.example.demo.catalog.item.domain.ItemImageRepository;
import com.example.demo.catalog.item.domain.ItemImageType;
import com.example.demo.catalog.item.domain.ItemRepository;
import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.member.domain.Member;
import com.example.demo.member.domain.MemberRepository;
import com.example.demo.trade.domain.BidStatus;
import com.example.demo.trade.domain.BuyBid;
import com.example.demo.trade.domain.BuyBidRepository;
import com.example.demo.trade.domain.ConcludedTrade;
import com.example.demo.trade.domain.ConcludedTradeRepository;
import com.example.demo.trade.domain.ItemOption;
import com.example.demo.trade.domain.ItemOptionRepository;
import com.example.demo.trade.domain.SellBid;
import com.example.demo.trade.domain.SellBidRepository;
import com.example.demo.trade.dto.TradeDtos;
import com.example.demo.trade.infra.PortOneClient;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TradeService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy/MM/dd");
    private static final DateTimeFormatter TRADE_NO_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");

    private final ItemOptionRepository itemOptionRepository;
    private final BuyBidRepository buyBidRepository;
    private final SellBidRepository sellBidRepository;
    private final ConcludedTradeRepository concludedTradeRepository;
    private final ItemRepository itemRepository;
    private final ItemImageRepository itemImageRepository;
    private final MemberRepository memberRepository;
    private final FilterRepository filterRepository;
    private final PortOneClient portOneClient;

    @Transactional(readOnly = true)
    public List<TradeDtos.ItemOptionResponse> getItemOptions(Long itemId) {
        return itemOptionRepository.findByItemIdOrderBySortOrderAscIdAsc(itemId)
                .stream()
                .map(this::toOptionResponse)
                .toList();
    }

    @Transactional
    public TradeDtos.ItemOptionResponse addItemOption(
            Long itemId,
            String optionValue,
            Integer sortOrder,
            Integer quantity,
            Long sourceTagId
    ) {
        Item item = findItem(itemId);
        ItemOption option = new ItemOption();
        option.setItem(item);
        option.setOptionValue(optionValue);
        option.setSortOrder(sortOrder != null ? sortOrder : 0);
        option.setQuantity(quantity != null && quantity > 0 ? quantity : 1);
        option.setSourceTag(resolveSourceTag(sourceTagId));
        return toOptionResponse(itemOptionRepository.save(option));
    }

    @Transactional
    public void deleteItemOption(Long optionId) {
        itemOptionRepository.deleteById(optionId);
    }

    @Transactional(readOnly = true)
    public TradeDtos.TradeDrawerResponse getTradeDrawer(Long itemId, Long optionId) {
        List<TradeDtos.ItemOptionResponse> options = getItemOptions(itemId);

        Page<SellBid> sellPage = sellBidRepository.findPendingByItemAndOptionPaged(
                itemId, optionId, PageRequest.of(0, 1));
        Integer instantBuyPrice = sellPage.isEmpty() ? null : sellPage.getContent().get(0).getPrice();

        Page<BuyBid> buyPage = buyBidRepository.findPendingByItemAndOptionPaged(
                itemId, optionId, PageRequest.of(0, 1));
        Integer instantSellPrice = buyPage.isEmpty() ? null : buyPage.getContent().get(0).getPrice();

        LocalDateTime since = ApiDateTimeConverter.nowKst().minusDays(90);
        List<TradeDtos.PriceHistoryPoint> priceHistory = concludedTradeRepository
                .findByItemAndOptionSince(itemId, optionId, since)
                .stream()
                .map(c -> new TradeDtos.PriceHistoryPoint(
                        c.getCreatedAt().format(DATE_FORMATTER),
                        c.getTradePrice()))
                .toList();

        return new TradeDtos.TradeDrawerResponse(options, instantBuyPrice, instantSellPrice, priceHistory);
    }

    @Transactional
    public TradeDtos.PlaceBidResult verifyAndPlaceBuyBid(
            String paymentId,
            Long itemId,
            Long optionId,
            Integer price,
            String buyerEmail
    ) {
        PortOneClient.PaymentResponse payment;
        try {
            payment = portOneClient.getPayment(paymentId);
        } catch (Exception e) {
            throw new IllegalStateException("결제 정보를 조회할 수 없습니다: " + e.getMessage());
        }

        if (!"PAID".equals(payment.status())) {
            throw new IllegalStateException("결제가 완료되지 않았습니다. 상태: " + payment.status());
        }

        long paid = payment.amount() != null && payment.amount().total() != null
                ? payment.amount().total()
                : -1L;
        if (paid != price.longValue()) {
            throw new IllegalStateException("결제 금액이 일치하지 않습니다. 요청=" + price + ", 실제=" + paid);
        }

        return placeBuyBid(itemId, optionId, price, buyerEmail, paymentId);
    }

    @Transactional
    public TradeDtos.PlaceBidResult placeBuyBid(Long itemId, Long optionId, Integer price, String buyerEmail) {
        return placeBuyBid(itemId, optionId, price, buyerEmail, null);
    }

    private TradeDtos.PlaceBidResult placeBuyBid(Long itemId, Long optionId, Integer price, String buyerEmail, String paymentId) {
        Item item = findItem(itemId);
        Member buyer = findMember(buyerEmail);
        ItemOption itemOption = resolveOption(optionId);

        BuyBid buyBid = new BuyBid();
        buyBid.setItem(item);
        buyBid.setItemOption(itemOption);
        buyBid.setBuyer(buyer);
        buyBid.setPrice(price);
        buyBid.setPaymentAmount(price);
        buyBid.setStatus(BidStatus.PENDING);
        buyBid.setPaymentId(paymentId);
        buyBidRepository.save(buyBid);

        Optional<SellBid> matchOpt = (optionId == null || optionId == 0)
                ? sellBidRepository.findFirstMatchingPendingBidNoOption(itemId, price).stream().findFirst()
                : sellBidRepository.findFirstMatchingPendingBid(itemId, optionId, price).stream().findFirst();

        if (matchOpt.isPresent()) {
            SellBid sellBid = matchOpt.get();
            buyBid.setStatus(BidStatus.MATCHED);
            sellBid.setStatus(BidStatus.MATCHED);
            sellBidRepository.save(sellBid);

            ConcludedTrade trade = new ConcludedTrade();
            trade.setTradeNo(generateTradeNo());
            trade.setItem(item);
            trade.setItemOption(itemOption);
            trade.setBuyer(buyer);
            trade.setSeller(sellBid.getSeller());
            trade.setTradePrice(price);
            ConcludedTrade saved = concludedTradeRepository.save(trade);

            return new TradeDtos.PlaceBidResult("MATCHED", saved.getId(), "즉시 체결되었습니다.");
        }

        return new TradeDtos.PlaceBidResult("BID_PLACED", null, "구매 입찰이 등록되었습니다.");
    }

    @Transactional
    public TradeDtos.PlaceBidResult placeSellBid(Long itemId, Long optionId, Integer price, String sellerEmail) {
        Item item = findItem(itemId);
        Member seller = findMember(sellerEmail);
        ItemOption itemOption = resolveOption(optionId);

        SellBid sellBid = new SellBid();
        sellBid.setItem(item);
        sellBid.setItemOption(itemOption);
        sellBid.setSeller(seller);
        sellBid.setPrice(price);
        sellBid.setStatus(BidStatus.PENDING);
        sellBidRepository.save(sellBid);

        Optional<BuyBid> matchOpt = (optionId == null || optionId == 0)
                ? buyBidRepository.findFirstMatchingPendingBidNoOption(itemId, price).stream().findFirst()
                : buyBidRepository.findFirstMatchingPendingBid(itemId, optionId, price).stream().findFirst();

        if (matchOpt.isPresent()) {
            BuyBid buyBid = matchOpt.get();
            sellBid.setStatus(BidStatus.MATCHED);
            buyBid.setStatus(BidStatus.MATCHED);
            buyBidRepository.save(buyBid);

            ConcludedTrade trade = new ConcludedTrade();
            trade.setTradeNo(generateTradeNo());
            trade.setItem(item);
            trade.setItemOption(itemOption);
            trade.setBuyer(buyBid.getBuyer());
            trade.setSeller(seller);
            trade.setTradePrice(price);
            ConcludedTrade saved = concludedTradeRepository.save(trade);

            return new TradeDtos.PlaceBidResult("MATCHED", saved.getId(), "즉시 체결되었습니다.");
        }

        return new TradeDtos.PlaceBidResult("BID_PLACED", null, "판매 입찰이 등록되었습니다.");
    }

    @Transactional(readOnly = true)
    public PageResponse<TradeDtos.ConcludedTradeResponse> getConcludedTrades(
            Long itemId,
            Long optionId,
            int page,
            int size
    ) {
        Page<ConcludedTrade> result = concludedTradeRepository.findByItemAndOption(
                itemId, optionId, PageRequest.of(page, size));
        return toPageResponse(result.map(this::toConcludedResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<TradeDtos.SellBidResponse> getPendingSellBids(
            Long itemId,
            Long optionId,
            int page,
            int size
    ) {
        Page<SellBid> result = sellBidRepository.findPendingByItemAndOptionPaged(
                itemId, optionId, PageRequest.of(page, size));
        return toPageResponse(result.map(this::toSellBidResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<TradeDtos.BuyBidResponse> getPendingBuyBids(
            Long itemId,
            Long optionId,
            int page,
            int size
    ) {
        Page<BuyBid> result = buyBidRepository.findPendingByItemAndOptionPaged(
                itemId, optionId, PageRequest.of(page, size));
        return toPageResponse(result.map(this::toBuyBidResponse));
    }

    @Transactional(readOnly = true)
    public List<TradeDtos.PriceHistoryPoint> getPriceHistory(Long itemId, Long optionId, String range) {
        LocalDateTime now = ApiDateTimeConverter.nowKst();
        LocalDateTime since;

        switch (range == null ? "3개월" : range) {
            case "1개월" -> since = now.minusDays(28);
            case "6개월" -> since = now.minusDays(180);
            case "1년" -> since = now.minusDays(365);
            case "전체" -> since = LocalDateTime.of(2000, 1, 1, 0, 0);
            default -> since = now.minusDays(90);
        }

        return concludedTradeRepository.findByItemAndOptionSince(itemId, optionId, since)
                .stream()
                .map(c -> new TradeDtos.PriceHistoryPoint(
                        c.getCreatedAt().format(DATE_FORMATTER),
                        c.getTradePrice()))
                .toList();
    }

    @Transactional
    public void cancelBuyBid(Long bidId, String email) {
        BuyBid bid = buyBidRepository.findById(bidId)
                .orElseThrow(() -> new IllegalArgumentException("입찰을 찾을 수 없습니다. id=" + bidId));

        if (!bid.getBuyer().getEmail().equals(email)) {
            throw new IllegalStateException("취소 권한이 없습니다.");
        }
        if (bid.getStatus() != BidStatus.PENDING) {
            throw new IllegalStateException("PENDING 상태의 입찰만 취소할 수 있습니다.");
        }

        if (bid.getPaymentId() != null) {
            try {
                portOneClient.cancelPayment(bid.getPaymentId(), "구매 입찰 취소");
            } catch (Exception e) {
                throw new IllegalStateException("환불 처리 중 오류가 발생했습니다: " + e.getMessage());
            }
        }

        bid.setStatus(BidStatus.CANCELLED);
    }

    @Transactional
    public void cancelSellBid(Long bidId, String email) {
        SellBid bid = sellBidRepository.findById(bidId)
                .orElseThrow(() -> new IllegalArgumentException("입찰을 찾을 수 없습니다. id=" + bidId));

        if (!bid.getSeller().getEmail().equals(email)) {
            throw new IllegalStateException("취소 권한이 없습니다.");
        }
        if (bid.getStatus() != BidStatus.PENDING) {
            throw new IllegalStateException("PENDING 상태의 입찰만 취소할 수 있습니다.");
        }

        bid.setStatus(BidStatus.CANCELLED);
    }

    @Transactional(readOnly = true)
    public PageResponse<TradeDtos.BuyBidResponse> getMyBuyBids(String email, int page, int size) {
        Member member = findMember(email);
        Page<BuyBid> result = buyBidRepository.findByBuyerIdPaged(member.getId(), PageRequest.of(page, size));
        return toPageResponse(result.map(this::toBuyBidResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<TradeDtos.SellBidResponse> getMySellBids(String email, int page, int size) {
        Member member = findMember(email);
        Page<SellBid> result = sellBidRepository.findBySellerIdPaged(member.getId(), PageRequest.of(page, size));
        return toPageResponse(result.map(this::toSellBidResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<TradeDtos.ConcludedTradeResponse> getMyConcludedBuyTrades(String email, int page, int size) {
        Member member = findMember(email);
        Page<ConcludedTrade> result = concludedTradeRepository.findByBuyerIdPaged(member.getId(), PageRequest.of(page, size));
        return toPageResponse(result.map(this::toConcludedResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<TradeDtos.ConcludedTradeResponse> getMyConcludedSellTrades(String email, int page, int size) {
        Member member = findMember(email);
        Page<ConcludedTrade> result = concludedTradeRepository.findBySellerIdPaged(member.getId(), PageRequest.of(page, size));
        return toPageResponse(result.map(this::toConcludedResponse));
    }

    private Item findItem(Long itemId) {
        return itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. id=" + itemId));
    }

    private Member findMember(String email) {
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("회원을 찾을 수 없습니다. email=" + email));
    }

    private ItemOption resolveOption(Long optionId) {
        if (optionId == null || optionId == 0) {
            return null;
        }
        return itemOptionRepository.findById(optionId)
                .orElseThrow(() -> new IllegalArgumentException("옵션을 찾을 수 없습니다. id=" + optionId));
    }

    private Filter resolveSourceTag(Long sourceTagId) {
        if (sourceTagId == null || sourceTagId == 0) {
            return null;
        }
        return filterRepository.findById(sourceTagId)
                .orElseThrow(() -> new IllegalArgumentException("필터를 찾을 수 없습니다. id=" + sourceTagId));
    }

    private TradeDtos.ItemOptionResponse toOptionResponse(ItemOption option) {
        return new TradeDtos.ItemOptionResponse(
                option.getId(),
                option.getOptionValue(),
                option.getQuantity(),
                option.getSortOrder(),
                option.getSourceTag() != null ? option.getSourceTag().getId() : null
        );
    }

    private String fetchMainImageUrl(Long itemId) {
        return itemImageRepository.findByItemIdAndImageType(itemId, ItemImageType.MAIN)
                .map(ItemImage::getImageUrl)
                .orElse(null);
    }

    private TradeDtos.BuyBidResponse toBuyBidResponse(BuyBid bid) {
        return new TradeDtos.BuyBidResponse(
                bid.getId(),
                bid.getItem().getId(),
                bid.getItem().getName(),
                fetchMainImageUrl(bid.getItem().getId()),
                bid.getItemOption() != null ? bid.getItemOption().getOptionValue() : null,
                bid.getPrice(),
                bid.getStatus().name(),
                bid.getPaymentAmount(),
                bid.getCreatedAt() != null ? bid.getCreatedAt().format(DATE_FORMATTER) : null
        );
    }

    private TradeDtos.SellBidResponse toSellBidResponse(SellBid bid) {
        return new TradeDtos.SellBidResponse(
                bid.getId(),
                bid.getItem().getId(),
                bid.getItem().getName(),
                fetchMainImageUrl(bid.getItem().getId()),
                bid.getItemOption() != null ? bid.getItemOption().getOptionValue() : null,
                bid.getPrice(),
                bid.getStatus().name(),
                bid.getCreatedAt() != null ? bid.getCreatedAt().format(DATE_FORMATTER) : null
        );
    }

    @Transactional
    public void adminRegisterShipping(Long tradeId, TradeDtos.AdminRegisterTradeShippingRequest req) {
        ConcludedTrade trade = concludedTradeRepository.findById(tradeId)
                .orElseThrow(() -> new IllegalArgumentException("체결 거래를 찾을 수 없습니다. id=" + tradeId));
        trade.setCourier(req.courier());
        trade.setTrackingNumber(req.trackingNumber());
        if (req.receiverName() != null) trade.setReceiverName(req.receiverName());
        if (req.receiverPhone() != null) trade.setReceiverPhone(req.receiverPhone());
        if (req.zipCode() != null) trade.setZipCode(req.zipCode());
        if (req.roadAddress() != null) trade.setRoadAddress(req.roadAddress());
        if (req.detailAddress() != null) trade.setDetailAddress(req.detailAddress());
    }

    private TradeDtos.ConcludedTradeResponse toConcludedResponse(ConcludedTrade trade) {
        return new TradeDtos.ConcludedTradeResponse(
                trade.getId(),
                trade.getTradeNo(),
                trade.getItem().getId(),
                trade.getItem().getName(),
                fetchMainImageUrl(trade.getItem().getId()),
                trade.getItemOption() != null ? trade.getItemOption().getOptionValue() : null,
                trade.getTradePrice(),
                trade.getBuyer().getEmail(),
                trade.getSeller().getEmail(),
                trade.getCourier(),
                trade.getTrackingNumber(),
                trade.getCreatedAt() != null ? trade.getCreatedAt().format(DATE_FORMATTER) : null
        );
    }

    private String generateTradeNo() {
        String date = ApiDateTimeConverter.nowKst().format(TRADE_NO_FORMATTER);
        String suffix = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        return "T" + date + suffix;
    }

    private <T> PageResponse<T> toPageResponse(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }
}
