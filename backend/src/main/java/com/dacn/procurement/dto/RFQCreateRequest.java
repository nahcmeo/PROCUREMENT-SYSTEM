package com.dacn.procurement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RFQCreateRequest {
    @NotBlank(message = "Tiêu đề yêu cầu báo giá không được để trống")
    private String title;

    private Long prId; // ID của phiếu PR đã duyệt được chọn (nếu có)

    private String note;
}
