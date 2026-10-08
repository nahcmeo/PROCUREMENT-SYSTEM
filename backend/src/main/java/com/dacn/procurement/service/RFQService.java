package com.dacn.procurement.service;

import com.dacn.procurement.dto.*;
import com.dacn.procurement.entity.*;
import com.dacn.procurement.model.enums.QuotationStatus;
import com.dacn.procurement.model.enums.RFQStatus;
import com.dacn.procurement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RFQService {

    private final RFQRepository rfqRepository;
    private final QuotationRepository quotationRepository;
    private final PurchaseRequestRepository prRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final PurchaseOrderService poService;
    private final PRItemRepository prItemRepository;

    public List<RFQResponseDto> getAllRFQs() {
        return rfqRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public RFQResponseDto getRFQById(Long id) {
        RFQ rfq = rfqRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy RFQ #" + id));
        return mapToDto(rfq);
    }

    @Transactional
    public RFQResponseDto createRFQ(RFQCreateRequest request, String username) {
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        PurchaseRequest pr = null;
        if (request.getPrId() != null) {
            pr = prRepository.findById(request.getPrId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy PR #" + request.getPrId()));
        }

        String rfqCode = "RFQ-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        RFQ rfq = RFQ.builder()
                .rfqCode(rfqCode)
                .title(request.getTitle())
                .purchaseRequest(pr)
                .createdBy(creator)
                .status(RFQStatus.SENT)
                .note(request.getNote())
                .quotations(new ArrayList<>())
                .build();

        RFQ saved = rfqRepository.save(rfq);
        return mapToDto(saved);
    }

    @Transactional
    public QuotationResponseDto addQuotation(Long rfqId, QuotationCreateRequest request) {
        RFQ rfq = rfqRepository.findById(rfqId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy RFQ #" + rfqId));

        Vendor vendor = vendorRepository.findById(request.getVendorId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp #" + request.getVendorId()));

        String qCode = "QUO-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Quotation quotation = Quotation.builder()
                .rfq(rfq)
                .vendor(vendor)
                .quotationCode(qCode)
                .validUntil(request.getValidUntil())
                .deliveryDays(request.getDeliveryDays() != null ? request.getDeliveryDays() : 7)
                .note(request.getNote())
                .status(QuotationStatus.SUBMITTED)
                .items(new ArrayList<>())
                .build();

        BigDecimal grandTotal = BigDecimal.ZERO;
        for (QuotationCreateRequest.QuotationItemDto itemDto : request.getItems()) {
            BigDecimal totalPrice = itemDto.getUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            grandTotal = grandTotal.add(totalPrice);

            PRItem prItem = null;
            if (itemDto.getPrItemId() != null) {
                prItem = prItemRepository.findById(itemDto.getPrItemId()).orElse(null);
            }
            if (prItem == null && rfq.getPurchaseRequest() != null && !rfq.getPurchaseRequest().getItems().isEmpty()) {
                prItem = rfq.getPurchaseRequest().getItems().stream()
                        .filter(i -> i.getItemName().equalsIgnoreCase(itemDto.getItemName()))
                        .findFirst()
                        .orElse(rfq.getPurchaseRequest().getItems().get(0));
            }
            if (prItem == null) {
                prItem = prItemRepository.findAll().stream().findFirst().orElse(null);
            }

            QuotationItem item = QuotationItem.builder()
                    .quotation(quotation)
                    .prItem(prItem)
                    .itemName(itemDto.getItemName())
                    .quantity(itemDto.getQuantity())
                    .unitPrice(itemDto.getUnitPrice())
                    .totalPrice(totalPrice)
                    .build();

            quotation.getItems().add(item);
        }

        quotation.setTotalAmount(grandTotal);
        Quotation saved = quotationRepository.save(quotation);
        return mapQuotationToDto(saved);
    }

    @Transactional
    public void selectWinningQuotation(Long rfqId, Long quotationId) {
        RFQ rfq = rfqRepository.findById(rfqId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy RFQ #" + rfqId));

        List<Quotation> quotations = quotationRepository.findByRfqId(rfqId);
        Quotation winningQuote = null;
        for (Quotation q : quotations) {
            if (q.getId().equals(quotationId)) {
                q.setStatus(QuotationStatus.SELECTED);
                winningQuote = q;
            } else {
                q.setStatus(QuotationStatus.REJECTED);
            }
            quotationRepository.save(q);
        }

        if (winningQuote != null) {
            poService.createPOFromQuotation(winningQuote);
        }

        rfq.setStatus(RFQStatus.CLOSED);
        rfqRepository.save(rfq);
    }

    private RFQResponseDto mapToDto(RFQ rfq) {
        List<PRItemDto> prItemDtos = new ArrayList<>();
        if (rfq.getPurchaseRequest() != null) {
            prItemDtos = rfq.getPurchaseRequest().getItems().stream().map(item -> {
                PRItemDto dto = new PRItemDto();
                dto.setId(item.getId());
                dto.setItemName(item.getItemName());
                dto.setSpecification(item.getSpecification());
                dto.setQuantity(item.getQuantity());
                dto.setUnit(item.getUnit());
                dto.setEstimatedUnitPrice(item.getEstimatedUnitPrice());
                dto.setEstimatedTotalPrice(item.getEstimatedTotalPrice());
                return dto;
            }).collect(Collectors.toList());
        }

        List<QuotationResponseDto> quotationDtos = rfq.getQuotations().stream()
                .map(this::mapQuotationToDto)
                .collect(Collectors.toList());

        return RFQResponseDto.builder()
                .id(rfq.getId())
                .rfqCode(rfq.getRfqCode())
                .title(rfq.getTitle())
                .prId(rfq.getPurchaseRequest() != null ? rfq.getPurchaseRequest().getId() : null)
                .prCode(rfq.getPurchaseRequest() != null ? rfq.getPurchaseRequest().getPrCode() : null)
                .departmentName(rfq.getPurchaseRequest() != null ? rfq.getPurchaseRequest().getDepartment().getName() : null)
                .createdById(rfq.getCreatedBy().getId())
                .createdByName(rfq.getCreatedBy().getFullName())
                .status(rfq.getStatus())
                .note(rfq.getNote())
                .items(prItemDtos)
                .quotations(quotationDtos)
                .createdAt(rfq.getCreatedAt())
                .build();
    }

    private QuotationResponseDto mapQuotationToDto(Quotation q) {
        List<QuotationResponseDto.ItemDto> items = q.getItems().stream().map(i ->
                QuotationResponseDto.ItemDto.builder()
                        .id(i.getId())
                        .prItemId(i.getPrItem() != null ? i.getPrItem().getId() : null)
                        .itemName(i.getItemName())
                        .quantity(i.getQuantity())
                        .unitPrice(i.getUnitPrice())
                        .totalPrice(i.getTotalPrice())
                        .build()
        ).collect(Collectors.toList());

        return QuotationResponseDto.builder()
                .id(q.getId())
                .rfqId(q.getRfq().getId())
                .vendorId(q.getVendor().getId())
                .vendorName(q.getVendor().getName())
                .vendorRatingAvg(q.getVendor().getRatingAvg())
                .quotationCode(q.getQuotationCode())
                .validUntil(q.getValidUntil())
                .deliveryDays(q.getDeliveryDays())
                .totalAmount(q.getTotalAmount())
                .status(q.getStatus())
                .note(q.getNote())
                .items(items)
                .createdAt(q.getCreatedAt())
                .build();
    }
}
