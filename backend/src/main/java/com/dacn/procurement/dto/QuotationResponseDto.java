package com.dacn.procurement.dto;

import com.dacn.procurement.model.enums.QuotationStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class QuotationResponseDto {
    private Long id;
    private Long rfqId;
    private Long vendorId;
    private String vendorName;
    private BigDecimal vendorRatingAvg;
    private String quotationCode;
    private LocalDate validUntil;
    private Integer deliveryDays;
    private BigDecimal totalAmount;
    private QuotationStatus status;
    private String note;
    private List<ItemDto> items;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class ItemDto {
        private Long id;
        private Long prItemId;
        private String itemName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }
}
