package com.dacn.procurement.service;

import com.dacn.procurement.dto.EvaluationRequest;
import com.dacn.procurement.dto.GoodsReceiptRequest;
import com.dacn.procurement.dto.POResponseDto;
import com.dacn.procurement.entity.*;
import com.dacn.procurement.model.enums.POStatus;
import com.dacn.procurement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final GoodsReceiptRepository grRepository;
    private final VendorEvaluationRepository evaluationRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;

    public List<POResponseDto> getAllPOs() {
        return poRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public POResponseDto getPOById(Long id) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy PO #" + id));
        return mapToDto(po);
    }

    @Transactional
    public PurchaseOrder createPOFromQuotation(Quotation quotation) {
        Department dept = null;
        if (quotation.getRfq().getPurchaseRequest() != null) {
            dept = quotation.getRfq().getPurchaseRequest().getDepartment();
        }

        String poCode = "PO-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        LocalDate expectedDate = LocalDate.now().plusDays(quotation.getDeliveryDays() != null ? quotation.getDeliveryDays() : 7);

        PurchaseOrder po = PurchaseOrder.builder()
                .poCode(poCode)
                .quotation(quotation)
                .vendor(quotation.getVendor())
                .purchaser(quotation.getRfq().getCreatedBy())
                .department(dept)
                .totalAmount(quotation.getTotalAmount())
                .status(POStatus.CREATED)
                .expectedDeliveryDate(expectedDate)
                .items(new ArrayList<>())
                .build();

        for (QuotationItem qi : quotation.getItems()) {
            POItem pi = POItem.builder()
                    .purchaseOrder(po)
                    .itemName(qi.getItemName())
                    .orderedQuantity(qi.getQuantity())
                    .unit("Cái")
                    .unitPrice(qi.getUnitPrice())
                    .totalPrice(qi.getTotalPrice())
                    .build();
            po.getItems().add(pi);
        }

        return poRepository.save(po);
    }

    @Transactional
    public POResponseDto updatePOStatus(Long id, POStatus newStatus) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy PO #" + id));
        po.setStatus(newStatus);
        return mapToDto(poRepository.save(po));
    }

    @Transactional
    public POResponseDto confirmGoodsReceipt(Long id, GoodsReceiptRequest request, String username) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy PO #" + id));

        User receiver = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String grCode = "GR-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        GoodsReceipt gr = GoodsReceipt.builder()
                .grCode(grCode)
                .purchaseOrder(po)
                .receivedBy(receiver)
                .receiptDate(LocalDateTime.now())
                .status(request.getStatus())
                .note(request.getNote())
                .build();

        grRepository.save(gr);

        po.setStatus(POStatus.RECEIVED);
        return mapToDto(poRepository.save(po));
    }

    @Transactional
    public POResponseDto evaluateVendor(Long id, EvaluationRequest request, String username) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy PO #" + id));

        User evaluator = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal sum = BigDecimal.valueOf(request.getPriceScore() + request.getQualityScore() + request.getDeliveryScore());
        BigDecimal avgScore = sum.divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);

        VendorEvaluation eval = VendorEvaluation.builder()
                .vendor(po.getVendor())
                .purchaseOrder(po)
                .evaluator(evaluator)
                .priceScore(request.getPriceScore())
                .qualityScore(request.getQualityScore())
                .deliveryScore(request.getDeliveryScore())
                .averageScore(avgScore)
                .comment(request.getComment())
                .build();

        evaluationRepository.save(eval);

        // Cập nhật rating_avg của Vendor trong database
        BigDecimal overallAvg = evaluationRepository.calculateAverageRating(po.getVendor().getId());
        if (overallAvg != null) {
            Vendor v = po.getVendor();
            v.setRatingAvg(overallAvg.setScale(2, RoundingMode.HALF_UP));
            vendorRepository.save(v);
        }

        return mapToDto(po);
    }

    private POResponseDto mapToDto(PurchaseOrder po) {
        List<POResponseDto.ItemDto> itemDtos = po.getItems().stream().map(i ->
                POResponseDto.ItemDto.builder()
                        .id(i.getId())
                        .itemName(i.getItemName())
                        .orderedQuantity(i.getOrderedQuantity())
                        .unit(i.getUnit())
                        .unitPrice(i.getUnitPrice())
                        .totalPrice(i.getTotalPrice())
                        .build()
        ).collect(Collectors.toList());

        POResponseDto.ReceiptInfoDto receiptDto = null;
        var optGr = grRepository.findByPurchaseOrderId(po.getId());
        if (optGr.isPresent()) {
            GoodsReceipt gr = optGr.get();
            receiptDto = POResponseDto.ReceiptInfoDto.builder()
                    .id(gr.getId())
                    .grCode(gr.getGrCode())
                    .receivedByName(gr.getReceivedBy().getFullName())
                    .status(gr.getStatus())
                    .note(gr.getNote())
                    .receiptDate(gr.getReceiptDate())
                    .build();
        }

        POResponseDto.EvaluationInfoDto evalDto = null;
        var optEval = evaluationRepository.findByPurchaseOrderId(po.getId());
        if (optEval.isPresent()) {
            VendorEvaluation eval = optEval.get();
            evalDto = POResponseDto.EvaluationInfoDto.builder()
                    .id(eval.getId())
                    .priceScore(eval.getPriceScore())
                    .qualityScore(eval.getQualityScore())
                    .deliveryScore(eval.getDeliveryScore())
                    .averageScore(eval.getAverageScore())
                    .comment(eval.getComment())
                    .build();
        }

        return POResponseDto.builder()
                .id(po.getId())
                .poCode(po.getPoCode())
                .quotationId(po.getQuotation().getId())
                .quotationCode(po.getQuotation().getQuotationCode())
                .vendorId(po.getVendor().getId())
                .vendorName(po.getVendor().getName())
                .purchaserId(po.getPurchaser().getId())
                .purchaserName(po.getPurchaser().getFullName())
                .departmentId(po.getDepartment() != null ? po.getDepartment().getId() : null)
                .departmentName(po.getDepartment() != null ? po.getDepartment().getName() : null)
                .totalAmount(po.getTotalAmount())
                .status(po.getStatus())
                .expectedDeliveryDate(po.getExpectedDeliveryDate())
                .items(itemDtos)
                .receipt(receiptDto)
                .evaluation(evalDto)
                .createdAt(po.getCreatedAt())
                .build();
    }
}
