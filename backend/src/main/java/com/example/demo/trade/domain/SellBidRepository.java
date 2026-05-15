package com.example.demo.trade.domain;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface SellBidRepository extends JpaRepository<SellBid, Long> {
    @Query("SELECT s FROM SellBid s WHERE s.item.id = :itemId AND s.itemOption.id = :optionId AND s.price = :price AND s.status = 'PENDING' ORDER BY s.createdAt ASC")
    List<SellBid> findFirstMatchingPendingBid(@Param("itemId") Long itemId, @Param("optionId") Long optionId, @Param("price") Integer price);

    @Query("SELECT s FROM SellBid s WHERE s.item.id = :itemId AND s.status = 'PENDING' AND s.itemOption IS NULL AND s.price = :price ORDER BY s.createdAt ASC")
    List<SellBid> findFirstMatchingPendingBidNoOption(@Param("itemId") Long itemId, @Param("price") Integer price);

    @Query("SELECT s FROM SellBid s WHERE s.item.id = :itemId AND (:optionId IS NULL OR s.itemOption.id = :optionId) AND s.status = 'PENDING' ORDER BY s.price ASC")
    Page<SellBid> findPendingByItemAndOptionPaged(@Param("itemId") Long itemId, @Param("optionId") Long optionId, Pageable pageable);

    @Query("SELECT s FROM SellBid s WHERE s.seller.id = :memberId ORDER BY s.createdAt DESC")
    Page<SellBid> findBySellerIdPaged(@Param("memberId") Long memberId, Pageable pageable);
}
