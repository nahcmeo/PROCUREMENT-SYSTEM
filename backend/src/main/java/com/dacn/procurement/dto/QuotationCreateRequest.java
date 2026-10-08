package com.dacn.procurement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class QuotationCreateRequest {
    @NotNull(message = "Nhà cung cấp không được để trống")
    private Long vendorId;

    private LocalDate validUntil;

    private Integer deliveryDays = 7; // Số ngày cam kết giao hàng

    private String note;

    @NotNull(message = "Danh sách đơn giá mặt hàng không được để trống")
    private List<QuotationItemDto> items;

    @Data
    public static class QuotationItemDto {
        private Long prItemId;
        private String itemName;
        private Integer quantity;
        private BigDecimal unitPrice;
    }
}
