package com.dacn.procurement.controller;

import com.dacn.procurement.dto.EvaluationRequest;
import com.dacn.procurement.dto.GoodsReceiptRequest;
import com.dacn.procurement.dto.POResponseDto;
import com.dacn.procurement.model.enums.POStatus;
import com.dacn.procurement.service.PurchaseOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/po")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService poService;

    @GetMapping
    public ResponseEntity<List<POResponseDto>> getAllPOs() {
        return ResponseEntity.ok(poService.getAllPOs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<POResponseDto> getPOById(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getPOById(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<POResponseDto> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        POStatus status = POStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(poService.updatePOStatus(id, status));
    }

    @PostMapping("/{id}/receipt")
    public ResponseEntity<POResponseDto> confirmGoodsReceipt(
            @PathVariable Long id,
            @Valid @RequestBody GoodsReceiptRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(poService.confirmGoodsReceipt(id, request, authentication.getName()));
    }

    @PostMapping("/{id}/evaluate")
    public ResponseEntity<POResponseDto> evaluateVendor(
            @PathVariable Long id,
            @Valid @RequestBody EvaluationRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(poService.evaluateVendor(id, request, authentication.getName()));
    }
}
