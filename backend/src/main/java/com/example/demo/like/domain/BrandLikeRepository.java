package com.example.demo.like.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BrandLikeRepository extends JpaRepository<BrandLike, Long> {

    Optional<BrandLike> findByMemberIdAndBrandId(Long memberId, Long brandId);

    boolean existsByMemberIdAndBrandId(Long memberId, Long brandId);

    long countByBrandId(Long brandId);

    void deleteByMemberIdAndBrandId(Long memberId, Long brandId);

    void deleteByBrandIdIn(List<Long> brandIds);

    @Query("SELECT bl FROM BrandLike bl JOIN FETCH bl.brand WHERE bl.member.id = :memberId ORDER BY bl.createdAt DESC")
    List<BrandLike> findByMemberIdWithBrand(@Param("memberId") Long memberId);
}
