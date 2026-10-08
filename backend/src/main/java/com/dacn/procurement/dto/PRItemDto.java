package com.dacn.procurement.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PRItemDto {
    private Long id;

    @NotBlank(message = "Tên mặt hàng không được để trống")
    private String itemName;

    private String specification;

    @NotNull(message = "Số lượng không được để trống")
    @Min(value = 1, message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    @NotBlank(message = "Đơn tính không được để trống")
    private String unit;

    @NotNull(message = "Đơn giá ước tính không được để trống")
    private BigDecimal estimatedUnitPrice;

    private BigDecimal estimatedTotalPrice;
}
