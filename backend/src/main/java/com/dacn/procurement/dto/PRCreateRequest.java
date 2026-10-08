package com.dacn.procurement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class PRCreateRequest {
    @NotBlank(message = "Tiêu đề yêu cầu mua sắm không được để trống")
    private String title;

    @NotEmpty(message = "Danh sách mặt hàng không được để trống")
    private List<PRItemDto> items;
}
