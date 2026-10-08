package com.dacn.procurement.controller;

import com.dacn.procurement.dto.VendorDto;
import com.dacn.procurement.service.VendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    @GetMapping
    public ResponseEntity<List<VendorDto>> getAllVendors() {
        return ResponseEntity.ok(vendorService.getAllVendors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendorDto> getVendorById(@PathVariable Long id) {
        return ResponseEntity.ok(vendorService.getVendorById(id));
    }

    @PostMapping
    public ResponseEntity<VendorDto> createVendor(@RequestBody VendorDto dto) {
        return ResponseEntity.ok(vendorService.createVendor(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VendorDto> updateVendor(@PathVariable Long id, @RequestBody VendorDto dto) {
        return ResponseEntity.ok(vendorService.updateVendor(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVendor(@PathVariable Long id) {
        vendorService.deleteVendor(id);
        return ResponseEntity.ok().build();
    }
}
