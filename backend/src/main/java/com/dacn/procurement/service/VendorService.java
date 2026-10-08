package com.dacn.procurement.service;

import com.dacn.procurement.dto.VendorDto;
import com.dacn.procurement.entity.Vendor;
import com.dacn.procurement.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;

    public List<VendorDto> getAllVendors() {
        return vendorRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public VendorDto getVendorById(Long id) {
        Vendor v = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Vendor #" + id));
        return mapToDto(v);
    }

    public VendorDto createVendor(VendorDto dto) {
        Vendor v = Vendor.builder()
                .name(dto.getName())
                .taxCode(dto.getTaxCode())
                .contactPerson(dto.getContactPerson())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .address(dto.getAddress())
                .status(dto.getStatus() != null ? dto.getStatus() : com.dacn.procurement.model.enums.VendorStatus.ACTIVE)
                .ratingAvg(java.math.BigDecimal.ZERO)
                .build();
        return mapToDto(vendorRepository.save(v));
    }

    public VendorDto updateVendor(Long id, VendorDto dto) {
        Vendor v = vendorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Vendor #" + id));
        v.setName(dto.getName());
        v.setTaxCode(dto.getTaxCode());
        v.setContactPerson(dto.getContactPerson());
        v.setEmail(dto.getEmail());
        v.setPhone(dto.getPhone());
        v.setAddress(dto.getAddress());
        return mapToDto(vendorRepository.save(v));
    }

    public void deleteVendor(Long id) {
        vendorRepository.deleteById(id);
    }

    private VendorDto mapToDto(Vendor v) {
        return VendorDto.builder()
                .id(v.getId())
                .name(v.getName())
                .taxCode(v.getTaxCode())
                .contactPerson(v.getContactPerson())
                .email(v.getEmail())
                .phone(v.getPhone())
                .address(v.getAddress())
                .status(v.getStatus())
                .ratingAvg(v.getRatingAvg())
                .createdAt(v.getCreatedAt())
                .build();
    }
}
