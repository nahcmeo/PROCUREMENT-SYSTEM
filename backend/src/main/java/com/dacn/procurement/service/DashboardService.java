package com.dacn.procurement.service;

import com.dacn.procurement.dto.DashboardStatsDto;
import com.dacn.procurement.dto.PRResponseDto;
import com.dacn.procurement.entity.Department;
import com.dacn.procurement.entity.PurchaseOrder;
import com.dacn.procurement.entity.PurchaseRequest;
import com.dacn.procurement.model.enums.GRStatus;
import com.dacn.procurement.model.enums.POStatus;
import com.dacn.procurement.model.enums.PRStatus;
import com.dacn.procurement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final PurchaseRequestRepository prRepository;
    private final PurchaseOrderRepository poRepository;
    private final VendorRepository vendorRepository;
    private final GoodsReceiptRepository grRepository;
    private final DepartmentRepository departmentRepository;
    private final PurchaseRequestService prService;

    public DashboardStatsDto getDashboardStats() {
        List<PurchaseRequest> allPRs = prRepository.findAll();
        List<PurchaseOrder> allPOs = poRepository.findAll();
        List<Department> allDepts = departmentRepository.findAll();

        // 1. Thống kê PR chờ duyệt
        long pendingPRCount = allPRs.stream()
                .filter(p -> p.getStatus() == PRStatus.PENDING_APPROVAL)
                .count();

        BigDecimal pendingPRAmount = allPRs.stream()
                .filter(p -> p.getStatus() == PRStatus.PENDING_APPROVAL)
                .map(PurchaseRequest::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Thống kê PO đang giao
        long deliveringPOCount = allPOs.stream()
                .filter(p -> p.getStatus() == POStatus.DELIVERING || p.getStatus() == POStatus.SENT_TO_VENDOR || p.getStatus() == POStatus.CREATED)
                .count();

        // 3. Nhà cung cấp đang hoạt động
        long activeVendors = vendorRepository.count();
        double avgRating = vendorRepository.findAll().stream()
                .filter(v -> v.getRatingAvg() != null)
                .mapToDouble(v -> v.getRatingAvg().doubleValue())
                .average()
                .orElse(4.5);

        // 4. Tỷ lệ nghiệm thu thành công
        long totalGRs = grRepository.count();
        long completedGRs = grRepository.findAll().stream()
                .filter(g -> g.getStatus() == GRStatus.COMPLETED)
                .count();
        double receiptRate = totalGRs > 0 ? ((double) completedGRs / totalGRs) * 100 : 98.5;

        // 5. Recent PRs (5 mới nhất)
        List<PRResponseDto> recentPRs = prService.getAllPRs().stream()
                .limit(5)
                .collect(Collectors.toList());

        // 6. Thống kê ngân sách từng phòng ban
        List<DashboardStatsDto.DepartmentBudgetDto> budgetDtos = new ArrayList<>();
        for (Department dept : allDepts) {
            BigDecimal used = allPOs.stream()
                    .filter(po -> po.getDepartment() != null && po.getDepartment().getId().equals(dept.getId()))
                    .map(PurchaseOrder::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            double pct = 0;
            if (dept.getBudgetLimit() != null && dept.getBudgetLimit().compareTo(BigDecimal.ZERO) > 0) {
                pct = used.divide(dept.getBudgetLimit(), 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100)).doubleValue();
            }

            budgetDtos.add(DashboardStatsDto.DepartmentBudgetDto.builder()
                    .departmentId(dept.getId())
                    .departmentName(dept.getName())
                    .budgetLimit(dept.getBudgetLimit() != null ? dept.getBudgetLimit() : BigDecimal.ZERO)
                    .usedAmount(used)
                    .usedPercent(Math.min(pct, 100))
                    .build());
        }

        return DashboardStatsDto.builder()
                .pendingPRCount(pendingPRCount)
                .pendingPRAmount(pendingPRAmount)
                .deliveringPOCount(deliveringPOCount)
                .activeVendorCount(activeVendors)
                .avgVendorRating(BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP))
                .receiptSuccessRate(Math.round(receiptRate * 10.0) / 10.0)
                .recentPRs(recentPRs)
                .departmentBudgets(budgetDtos)
                .build();
    }
}
