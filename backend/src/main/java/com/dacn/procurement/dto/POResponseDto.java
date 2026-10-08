package com.dacn.procurement.dto;

import com.dacn.procurement.model.enums.GRStatus;
import com.dacn.procurement.model.enums.POStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class POResponseDto {
    private Long id;
    private String poCode;
    private Long quotationId;
    private String quotationCode;
    private Long vendorId;
    private String vendorName;
    private Long purchaserId;
    private String purchaserName;
    private Long departmentId;
    private String departmentName;
    private BigDecimal totalAmount;
    private POStatus status;
    private LocalDate expectedDeliveryDate;
    private List<ItemDto> items;
    private ReceiptInfoDto receipt;
    private EvaluationInfoDto evaluation;
    private LocalDateTime createdAt;

    @Data
    @Builder
    public static class ItemDto {
        private Long id;
        private String itemName;
        private Integer orderedQuantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;
    }

    @Data
    @Builder
    public static class ReceiptInfoDto {
        private Long id;
        private String grCode;
        private String receivedByName;
        private GRStatus status;
        private String note;
        private LocalDateTime receiptDate;
    }

    @Data
    @Builder
    public static class EvaluationInfoDto {
        private Long id;
        private Integer priceScore;
        private Integer qualityScore;
        private Integer deliveryScore;
        private BigDecimal averageScore;
        private String comment;
    }
}
