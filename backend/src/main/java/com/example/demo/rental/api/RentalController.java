package com.example.demo.rental.api;

import com.example.demo.global.dto.PageResponse;
import com.example.demo.rental.application.RentalService;
import com.example.demo.rental.dto.RentalDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RentalController {

    private final RentalService rentalService;

    @PostMapping("/api/rentals")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RentalDtos.RentalOrderResponse> createRental(
            @AuthenticationPrincipal String email,
            @RequestBody RentalDtos.CreateRentalRequest req) {
        return ResponseEntity.ok(rentalService.createRental(email, req));
    }

    @PostMapping("/api/rentals/verify")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<RentalDtos.RentalOrderResponse> verifyAndCreateRental(
            @AuthenticationPrincipal String email,
            @RequestBody RentalDtos.VerifyAndCreateRentalRequest req) {
        return ResponseEntity.ok(rentalService.verifyAndCreateRental(email, req));
    }

    @GetMapping("/api/rentals/my/renting")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RentalDtos.RentalOrderResponse>> getMyRenting(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(rentalService.getMyRenting(email));
    }

    @GetMapping("/api/rentals/my/lending")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<RentalDtos.RentalOrderResponse>> getMyLending(
            @AuthenticationPrincipal String email) {
        return ResponseEntity.ok(rentalService.getMyLending(email));
    }

    @GetMapping("/api/admin/rentals")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<PageResponse<RentalDtos.AdminRentalListResponse>> getAdminRentalList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(rentalService.getAdminRentalList(page, size));
    }

    /** 관리자: 상태 변경 */
    @PatchMapping("/api/admin/rentals/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<RentalDtos.RentalOrderResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody RentalDtos.AdminUpdateStatusRequest req) {
        return ResponseEntity.ok(rentalService.adminUpdateStatus(id, req.status()));
    }

    /** 관리자: 배송 정보 등록 */
    @PatchMapping("/api/admin/rentals/{id}/shipping")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<RentalDtos.RentalOrderResponse> registerShipping(
            @PathVariable Long id,
            @RequestBody RentalDtos.AdminRegisterShippingRequest req) {
        return ResponseEntity.ok(rentalService.adminRegisterShipping(id, req.courier(), req.trackingNumber()));
    }

    /** 관리자: 배송 진행 상태 변경 */
    @PatchMapping("/api/admin/rentals/{id}/delivery-status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> updateDeliveryStatus(
            @PathVariable Long id,
            @RequestBody RentalDtos.AdminUpdateDeliveryStatusRequest req) {
        rentalService.adminUpdateDeliveryStatus(id, req.deliveryStatus());
        return ResponseEntity.ok().build();
    }

    /** SKU 렌탈 가용성 조회 */
    @GetMapping("/api/items/{itemId}/options/availability")
    public ResponseEntity<List<RentalDtos.RentalAvailabilityResponse>> getAvailability(
            @PathVariable Long itemId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(rentalService.getOptionAvailability(itemId, startDate, endDate));
    }
}
