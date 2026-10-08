package com.dacn.procurement.service;

import com.dacn.procurement.dto.PRCreateRequest;
import com.dacn.procurement.dto.PRItemDto;
import com.dacn.procurement.dto.PRResponseDto;
import com.dacn.procurement.entity.PRItem;
import com.dacn.procurement.entity.PurchaseRequest;
import com.dacn.procurement.entity.User;
import com.dacn.procurement.model.enums.PRStatus;
import com.dacn.procurement.repository.PurchaseRequestRepository;
import com.dacn.procurement.repository.UserRepository;
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
public class PurchaseRequestService {

    private final PurchaseRequestRepository prRepository;
    private final UserRepository userRepository;

    public List<PRResponseDto> getAllPRs() {
        return prRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<PRResponseDto> getPRsByRequester(Long requesterId) {
        return prRepository.findByRequesterId(requesterId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public PRResponseDto getPRById(Long id) {
        PurchaseRequest pr = prRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Phiếu PR #" + id));
        return mapToDto(pr);
    }

    @Transactional
    public PRResponseDto createPR(PRCreateRequest request, String username) {
        User requester = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (requester.getDepartment() == null) {
            throw new RuntimeException("Người dùng chưa thuộc phòng ban nào!");
        }

        String prCode = "PR-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        PurchaseRequest pr = PurchaseRequest.builder()
                .prCode(prCode)
                .title(request.getTitle())
                .requester(requester)
                .department(requester.getDepartment())
                .status(PRStatus.PENDING_APPROVAL)
                .totalAmount(BigDecimal.ZERO)
                .items(new ArrayList<>())
                .build();

        BigDecimal grandTotal = BigDecimal.ZERO;
        for (PRItemDto itemDto : request.getItems()) {
            BigDecimal totalPrice = itemDto.getEstimatedUnitPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            grandTotal = grandTotal.add(totalPrice);

            PRItem item = PRItem.builder()
                    .purchaseRequest(pr)
                    .itemName(itemDto.getItemName())
                    .specification(itemDto.getSpecification())
                    .quantity(itemDto.getQuantity())
                    .unit(itemDto.getUnit())
                    .estimatedUnitPrice(itemDto.getEstimatedUnitPrice())
                    .estimatedTotalPrice(totalPrice)
                    .build();

            pr.getItems().add(item);
        }

        pr.setTotalAmount(grandTotal);
        PurchaseRequest savedPr = prRepository.save(pr);
        return mapToDto(savedPr);
    }

    @Transactional
    public PRResponseDto approvePR(Long id) {
        PurchaseRequest pr = prRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Phiếu PR #" + id));

        if (pr.getStatus() != PRStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Phiếu PR không ở trạng thái Chờ phê duyệt!");
        }

        pr.setStatus(PRStatus.APPROVED);
        return mapToDto(prRepository.save(pr));
    }

    @Transactional
    public PRResponseDto rejectPR(Long id, String reason) {
        PurchaseRequest pr = prRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Phiếu PR #" + id));

        if (pr.getStatus() != PRStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Phiếu PR không ở trạng thái Chờ phê duyệt!");
        }

        pr.setStatus(PRStatus.REJECTED);
        pr.setRejectionReason(reason);
        return mapToDto(prRepository.save(pr));
    }

    public void deletePR(Long id) {
        PurchaseRequest pr = prRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Phiếu PR #" + id));
        prRepository.delete(pr);
    }

    private PRResponseDto mapToDto(PurchaseRequest pr) {
        List<PRItemDto> itemDtos = pr.getItems().stream().map(item -> {
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

        return PRResponseDto.builder()
                .id(pr.getId())
                .prCode(pr.getPrCode())
                .title(pr.getTitle())
                .requesterId(pr.getRequester().getId())
                .requesterName(pr.getRequester().getFullName())
                .departmentId(pr.getDepartment().getId())
                .departmentName(pr.getDepartment().getName())
                .departmentBudgetLimit(pr.getDepartment().getBudgetLimit())
                .totalAmount(pr.getTotalAmount())
                .status(pr.getStatus())
                .rejectionReason(pr.getRejectionReason())
                .items(itemDtos)
                .createdAt(pr.getCreatedAt())
                .build();
    }
}
