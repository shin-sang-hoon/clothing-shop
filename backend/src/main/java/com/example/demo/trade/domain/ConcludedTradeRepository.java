package com.example.demo.trade.domain;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
public interface ConcludedTradeRepository extends JpaRepository<ConcludedTrade, Long> {

    Optional<ConcludedTrade> findByTradeNo(String tradeNo);
    @Query("SELECT c FROM ConcludedTrade c WHERE c.item.id = :itemId AND (:optionId IS NULL OR c.itemOption.id = :optionId) ORDER BY c.createdAt DESC")
    Page<ConcludedTrade> findByItemAndOption(@Param("itemId") Long itemId, @Param("optionId") Long optionId, Pageable pageable);

    @Query("SELECT c FROM ConcludedTrade c WHERE c.item.id = :itemId AND (:optionId IS NULL OR c.itemOption.id = :optionId) AND c.createdAt >= :since ORDER BY c.createdAt ASC")
    List<ConcludedTrade> findByItemAndOptionSince(@Param("itemId") Long itemId, @Param("optionId") Long optionId, @Param("since") LocalDateTime since);

    @Query("SELECT c FROM ConcludedTrade c WHERE c.buyer.id = :memberId ORDER BY c.createdAt DESC")
    Page<ConcludedTrade> findByBuyerIdPaged(@Param("memberId") Long memberId, Pageable pageable);

    @Query("SELECT c FROM ConcludedTrade c WHERE c.seller.id = :memberId ORDER BY c.createdAt DESC")
    Page<ConcludedTrade> findBySellerIdPaged(@Param("memberId") Long memberId, Pageable pageable);
}
