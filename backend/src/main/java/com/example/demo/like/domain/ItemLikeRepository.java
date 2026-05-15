package com.example.demo.like.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemLikeRepository extends JpaRepository<ItemLike, Long> {

    Optional<ItemLike> findByMemberIdAndItemId(Long memberId, Long itemId);

    boolean existsByMemberIdAndItemId(Long memberId, Long itemId);

    void deleteByMemberIdAndItemId(Long memberId, Long itemId);

    void deleteByItemId(Long itemId);

    long countByItemId(Long itemId);

    @Query("SELECT il FROM ItemLike il JOIN FETCH il.item i JOIN FETCH i.brand WHERE il.member.id = :memberId ORDER BY il.createdAt DESC")
    List<ItemLike> findByMemberIdWithItem(@Param("memberId") Long memberId);
}
