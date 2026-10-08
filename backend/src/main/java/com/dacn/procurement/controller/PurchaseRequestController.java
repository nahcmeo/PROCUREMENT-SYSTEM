package com.dacn.procurement.controller;

import com.dacn.procurement.dto.PRCreateRequest;
import com.dacn.procurement.dto.PRResponseDto;
import com.dacn.procurement.service.PurchaseRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pr")
@RequiredArgsConstructor
public class PurchaseRequestController {

    private final PurchaseRequestService prService;

    @GetMapping
    public ResponseEntity<List<PRResponseDto>> getAllPRs() {
        return ResponseEntity.ok(prService.getAllPRs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PRResponseDto> getPRById(@PathVariable Long id) {
        return ResponseEntity.ok(prService.getPRById(id));
    }

    @PostMapping
    public ResponseEntity<PRResponseDto> createPR(@Valid @RequestBody PRCreateRequest request, Authentication authentication) {
        return ResponseEntity.ok(prService.createPR(request, authentication.getName()));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'APPROVER')")
    public ResponseEntity<PRResponseDto> approvePR(@PathVariable Long id) {
        return ResponseEntity.ok(prService.approvePR(id));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'APPROVER')")
    public ResponseEntity<PRResponseDto> rejectPR(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "Không phù hợp nhu cầu");
        return ResponseEntity.ok(prService.rejectPR(id, reason));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePR(@PathVariable Long id) {
        prService.deletePR(id);
        return ResponseEntity.ok().build();
    }
}
