package com.dacn.procurement.dto;

import com.dacn.procurement.model.enums.PRStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PRResponseDto {
    private Long id;
    private String prCode;
    private String title;
    private Long requesterId;
    private String requesterName;
    private Long departmentId;
    private String departmentName;
    private BigDecimal departmentBudgetLimit;
    private BigDecimal totalAmount;
    private PRStatus status;
    private String rejectionReason;
    private List<PRItemDto> items;
    private LocalDateTime createdAt;
}
