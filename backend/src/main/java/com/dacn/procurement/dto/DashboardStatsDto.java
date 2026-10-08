package com.dacn.procurement.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class DashboardStatsDto {
    private long pendingPRCount;
    private BigDecimal pendingPRAmount;
    private long deliveringPOCount;
    private long activeVendorCount;
    private BigDecimal avgVendorRating;
    private double receiptSuccessRate;
    private List<PRResponseDto> recentPRs;
    private List<DepartmentBudgetDto> departmentBudgets;

    @Data
    @Builder
    public static class DepartmentBudgetDto {
        private Long departmentId;
        private String departmentName;
        private BigDecimal budgetLimit;
        private BigDecimal usedAmount;
        private double usedPercent;
    }
}
