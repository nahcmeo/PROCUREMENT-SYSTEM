package com.dacn.procurement.dto;

import com.dacn.procurement.model.enums.RFQStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class RFQResponseDto {
    private Long id;
    private String rfqCode;
    private String title;
    private Long prId;
    private String prCode;
    private String departmentName;
    private Long createdById;
    private String createdByName;
    private RFQStatus status;
    private String note;
    private List<PRItemDto> items;
    private List<QuotationResponseDto> quotations;
    private LocalDateTime createdAt;
}
