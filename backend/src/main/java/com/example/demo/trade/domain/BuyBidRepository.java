package com.example.demo.trade.domain;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface BuyBidRepository extends JpaRepository<BuyBid, Long> {
    @Query("SELECT b FROM BuyBid b WHERE b.item.id = :itemId AND (:optionId IS NULL OR b.itemOption.id = :optionId) AND b.status = 'PENDING' ORDER BY b.price DESC, b.createdAt ASC")
    List<BuyBid> findPendingByItemAndOption(@Param("itemId") Long itemId, @Param("optionId") Long optionId);

    @Query("SELECT b FROM BuyBid b WHERE b.item.id = :itemId AND b.itemOption.id = :optionId AND b.price = :price AND b.status = 'PENDING' ORDER BY b.createdAt ASC")
    List<BuyBid> findFirstMatchingPendingBid(@Param("itemId") Long itemId, @Param("optionId") Long optionId, @Param("price") Integer price);

    @Query("SELECT b FROM BuyBid b WHERE b.item.id = :itemId AND b.status = 'PENDING' AND b.itemOption IS NULL AND b.price = :price ORDER BY b.createdAt ASC")
    List<BuyBid> findFirstMatchingPendingBidNoOption(@Param("itemId") Long itemId, @Param("price") Integer price);

    @Query("SELECT b FROM BuyBid b WHERE b.item.id = :itemId AND (:optionId IS NULL OR b.itemOption.id = :optionId) AND b.status = 'PENDING' ORDER BY b.price DESC")
    Page<BuyBid> findPendingByItemAndOptionPaged(@Param("itemId") Long itemId, @Param("optionId") Long optionId, Pageable pageable);

    @Query("SELECT b FROM BuyBid b WHERE b.buyer.id = :memberId ORDER BY b.createdAt DESC")
    Page<BuyBid> findByBuyerIdPaged(@Param("memberId") Long memberId, Pageable pageable);
}
