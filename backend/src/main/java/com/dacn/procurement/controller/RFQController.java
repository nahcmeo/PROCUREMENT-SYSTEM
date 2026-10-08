package com.dacn.procurement.controller;

import com.dacn.procurement.dto.QuotationCreateRequest;
import com.dacn.procurement.dto.QuotationResponseDto;
import com.dacn.procurement.dto.RFQCreateRequest;
import com.dacn.procurement.dto.RFQResponseDto;
import com.dacn.procurement.service.RFQService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rfq")
@RequiredArgsConstructor
public class RFQController {

    private final RFQService rfqService;

    @GetMapping
    public ResponseEntity<List<RFQResponseDto>> getAllRFQs() {
        return ResponseEntity.ok(rfqService.getAllRFQs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RFQResponseDto> getRFQById(@PathVariable Long id) {
        return ResponseEntity.ok(rfqService.getRFQById(id));
    }

    @PostMapping
    public ResponseEntity<RFQResponseDto> createRFQ(@Valid @RequestBody RFQCreateRequest request, Authentication authentication) {
        return ResponseEntity.ok(rfqService.createRFQ(request, authentication.getName()));
    }

    @PostMapping("/{id}/quotations")
    public ResponseEntity<QuotationResponseDto> addQuotation(
            @PathVariable Long id,
            @Valid @RequestBody QuotationCreateRequest request) {
        return ResponseEntity.ok(rfqService.addQuotation(id, request));
    }

    @PutMapping("/{id}/quotations/{quotationId}/select")
    public ResponseEntity<Void> selectWinningQuotation(
            @PathVariable Long id,
            @PathVariable Long quotationId) {
        rfqService.selectWinningQuotation(id, quotationId);
        return ResponseEntity.ok().build();
    }
}
