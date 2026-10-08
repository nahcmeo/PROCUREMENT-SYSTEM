package com.dacn.procurement.dto;

import com.dacn.procurement.model.enums.GRStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class GoodsReceiptRequest {
    @NotNull(message = "Trạng thái nghiệm thu không được để trống")
    private GRStatus status; // COMPLETED (Đã nhận đủ) hoặc DISCREPANCY (Giao thiếu/Lỗi hàng)

    private String note;
}
