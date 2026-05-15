package com.example.demo.trade.application;

import com.example.demo.global.dto.PageResponse;
import com.example.demo.global.time.ApiDateTimeConverter;
import com.example.demo.trade.domain.*;
import com.example.demo.trade.dto.AdminTradeDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminTradeService {

    private final ConcludedTradeRepository concludedTradeRepository;
    private final BuyBidRepository buyBidRepository;
    private final SellBidRepository sellBidRepository;

    public PageResponse<AdminTradeDtos.AdminConcludedTradeRow> getConcludedTrades(int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<ConcludedTrade> result = concludedTradeRepository.findAll(pageable);
        Page<AdminTradeDtos.AdminConcludedTradeRow> mapped = result.map(t ->
                new AdminTradeDtos.AdminConcludedTradeRow(
                        t.getId(),
                        t.getTradeNo(),
                        t.getItem().getId(),
                        t.getItem().getName(),
                        t.getItem().getBrand() != null ? t.getItem().getBrand().getNameKo() : null,
                        t.getItemOption() != null ? t.getItemOption().getOptionValue() : null,
                        t.getTradePrice(),
                        t.getBuyer().getEmail(),
                        t.getBuyer().getName(),
                        t.getSeller().getEmail(),
                        t.getSeller().getName(),
                        t.getCourier(),
                        t.getTrackingNumber(),
                        ApiDateTimeConverter.toUtcString(t.getCreatedAt())
                ));
        return toPageResponse(mapped);
    }

    public PageResponse<AdminTradeDtos.AdminBuyBidRow> getBuyBids(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<BuyBid> result = buyBidRepository.findAll(pageable);
        Page<AdminTradeDtos.AdminBuyBidRow> mapped = result.map(b ->
                new AdminTradeDtos.AdminBuyBidRow(
                        b.getId(),
                        b.getItem().getId(),
                        b.getItem().getName(),
                        b.getItem().getBrand() != null ? b.getItem().getBrand().getNameKo() : null,
                        b.getItemOption() != null ? b.getItemOption().getOptionValue() : null,
                        b.getPrice(),
                        b.getStatus().name(),
                        b.getBuyer().getEmail(),
                        b.getBuyer().getName(),
                        ApiDateTimeConverter.toUtcString(b.getCreatedAt())
                ));

        return toPageResponse(mapped);
    }

    public PageResponse<AdminTradeDtos.AdminSellBidRow> getSellBids(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SellBid> result = sellBidRepository.findAll(pageable);
        Page<AdminTradeDtos.AdminSellBidRow> mapped = result.map(s ->
                new AdminTradeDtos.AdminSellBidRow(
                        s.getId(),
                        s.getItem().getId(),
                        s.getItem().getName(),
                        s.getItem().getBrand() != null ? s.getItem().getBrand().getNameKo() : null,
                        s.getItemOption() != null ? s.getItemOption().getOptionValue() : null,
                        s.getPrice(),
                        s.getStatus().name(),
                        s.getSeller().getEmail(),
                        s.getSeller().getName(),
                        ApiDateTimeConverter.toUtcString(s.getCreatedAt())
                ));
        return toPageResponse(mapped);
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
