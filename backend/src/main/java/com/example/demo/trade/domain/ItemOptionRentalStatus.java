package com.example.demo.trade.domain;

/** SKU 단위 렌탈 가용 상태 */
public enum ItemOptionRentalStatus {
    AVAILABLE,   // 대여 가능
    RENTING,     // 대여 중
    INSPECTING,  // 검수 중
    WASHING      // 세탁 중
}
