package com.example.demo.rental.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RentalOrderRepository extends JpaRepository<RentalOrder, Long> {

    @Query("SELECT r FROM RentalOrder r JOIN FETCH r.seller JOIN FETCH r.item i JOIN FETCH i.brand WHERE r.renter.id = :renterId ORDER BY r.createdAt DESC")
    List<RentalOrder> findByRenterIdWithDetails(@Param("renterId") Long renterId);

    @Query("SELECT r FROM RentalOrder r JOIN FETCH r.renter JOIN FETCH r.item i JOIN FETCH i.brand WHERE r.seller.id = :sellerId ORDER BY r.createdAt DESC")
    List<RentalOrder> findBySellerIdWithDetails(@Param("sellerId") Long sellerId);

    @Query("SELECT r FROM RentalOrder r JOIN FETCH r.seller JOIN FETCH r.renter JOIN FETCH r.item i JOIN FETCH i.brand ORDER BY r.createdAt DESC")
    Page<RentalOrder> findAllWithDetails(Pageable pageable);

    boolean existsByOrderNo(String orderNo);

    Optional<RentalOrder> findByOrderNo(String orderNo);

    // 특정 옵션의 기간 중복 체크 (취소/반납완료 제외)
    @Query("SELECT COUNT(r) > 0 FROM RentalOrder r WHERE r.itemOption.id = :optionId AND r.status NOT IN ('취소', '반납완료') AND r.startDate < :endDate AND r.endDate > :startDate")
    boolean existsOverlappingRental(@Param("optionId") Long optionId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // 연체 렌탈 조회 (렌탈중 & 종료일 < today)
    @Query("SELECT r FROM RentalOrder r JOIN FETCH r.renter JOIN FETCH r.item i JOIN FETCH i.brand WHERE r.status = '렌탈중' AND r.endDate < :today")
    List<RentalOrder> findOverdueRentals(@Param("today") LocalDate today);
}
