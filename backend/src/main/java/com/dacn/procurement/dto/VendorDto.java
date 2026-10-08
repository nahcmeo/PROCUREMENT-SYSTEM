package com.dacn.procurement.dto;

import com.dacn.procurement.model.enums.VendorStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class VendorDto {
    private Long id;
    private String name;
    private String taxCode;
    private String contactPerson;
    private String email;
    private String phone;
    private String address;
    private VendorStatus status;
    private BigDecimal ratingAvg;
    private LocalDateTime createdAt;
}
