package com.example.hethongmuasamnoibo.controller;

import com.example.hethongmuasamnoibo.entity.*;
import com.example.hethongmuasamnoibo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/bao-cao")
public class BaoCaoController {

    @Autowired
    private YeuCauMuaSamRepository yeuCauMuaSamRepository;

    @Autowired
    private DonMuaHangRepository donMuaHangRepository;

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @GetMapping("/thong-ke")
    public ResponseEntity<?> getStatistics(
            @RequestParam(required = false) String tuNgay,
            @RequestParam(required = false) String denNgay,
            @RequestParam(required = false) String phongBan,
            @RequestParam(required = false) String status) {

        LocalDate from = null;
        LocalDate to = null;

        if (tuNgay != null && !tuNgay.trim().isEmpty()) {
            from = LocalDate.parse(tuNgay.trim());
        }
        if (denNgay != null && !denNgay.trim().isEmpty()) {
            to = LocalDate.parse(denNgay.trim());
        }

        if (from != null && to != null && from.isAfter(to)) {
            return ResponseEntity.badRequest().body("Khoảng thời gian thống kê không hợp lệ (ngày bắt đầu lớn hơn ngày kết thúc)");
        }

        List<YeuCauMuaSam> prs = yeuCauMuaSamRepository.findAll();
        List<DonMuaHang> pos = donMuaHangRepository.findAll();

        // 1. Lọc theo ngày
        if (from != null) {
            final LocalDate f = from;
            prs = prs.stream().filter(p -> p.getNgayTao() != null && !p.getNgayTao().toLocalDate().isBefore(f)).toList();
            pos = pos.stream().filter(p -> p.getNgayDatHang() != null && !p.getNgayDatHang().toLocalDate().isBefore(f)).toList();
        }
        if (to != null) {
            final LocalDate t = to;
            prs = prs.stream().filter(p -> p.getNgayTao() != null && !p.getNgayTao().toLocalDate().isAfter(t)).toList();
            pos = pos.stream().filter(p -> p.getNgayDatHang() != null && !p.getNgayDatHang().toLocalDate().isAfter(t)).toList();
        }

        // 2. Lọc theo phòng ban
        if (phongBan != null && !phongBan.trim().isEmpty() && !phongBan.equalsIgnoreCase("all")) {
            final String pb = phongBan.trim().toLowerCase();
            prs = prs.stream().filter(p -> p.getNguoiYeuCau() != null && p.getNguoiYeuCau().getPhongBan() != null && p.getNguoiYeuCau().getPhongBan().toLowerCase().contains(pb)).toList();
            pos = pos.stream().filter(p -> p.getYeuCauMuaSam() != null && p.getYeuCauMuaSam().getNguoiYeuCau() != null && 
                    p.getYeuCauMuaSam().getNguoiYeuCau().getPhongBan() != null && p.getYeuCauMuaSam().getNguoiYeuCau().getPhongBan().toLowerCase().contains(pb)).toList();
        }

        // 3. Lọc theo trạng thái
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("all")) {
            final String st = status.trim().toUpperCase();
            prs = prs.stream().filter(p -> p.getTrangThai().equalsIgnoreCase(st)).toList();
        }

        // 4. Tính toán số liệu
        BigDecimal totalEstimated = prs.stream()
                .map(p -> p.getTongTienDuKien() != null ? p.getTongTienDuKien() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalActual = pos.stream()
                .map(p -> p.getTongTien() != null ? p.getTongTien() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal difference = totalEstimated.subtract(totalActual);

        // Số lượng PR theo trạng thái
        long countPending = prs.stream().filter(p -> "CHO_DUYET".equalsIgnoreCase(p.getTrangThai()) || "CHO_DUYET_CAP_2".equalsIgnoreCase(p.getTrangThai())).count();
        long countApproved = prs.stream().filter(p -> "DA_DUYET".equalsIgnoreCase(p.getTrangThai())).count();
        long countBuying = prs.stream().filter(p -> "CHO_BAO_GIA".equalsIgnoreCase(p.getTrangThai()) || "DA_CHON_NCC".equalsIgnoreCase(p.getTrangThai())).count();
        long countCompleted = prs.stream().filter(p -> "DA_HOAN_THANH".equalsIgnoreCase(p.getTrangThai())).count();
        long countRejected = prs.stream().filter(p -> "TU_CHOI".equalsIgnoreCase(p.getTrangThai())).count();

        // Số lượng PO theo trạng thái
        long poNew = pos.stream().filter(p -> "MOI_TAO".equalsIgnoreCase(p.getTrangThai())).count();
        long poSent = pos.stream().filter(p -> "DA_GUI_NCC".equalsIgnoreCase(p.getTrangThai())).count();
        long poShipping = pos.stream().filter(p -> "DANG_GIAO_HANG".equalsIgnoreCase(p.getTrangThai())).count();
        long poDone = pos.stream().filter(p -> "DA_NHAN_DU".equalsIgnoreCase(p.getTrangThai())).count();
        long poCanceled = pos.stream().filter(p -> "DA_HUY".equalsIgnoreCase(p.getTrangThai())).count();

        Map<String, Object> res = new HashMap<>();
        res.put("tongTienDuKien", totalEstimated);
        res.put("tongTienThucTe", totalActual);
        res.put("chenhLechTietKiem", difference);
        res.put("tongSoPR", prs.size());
        res.put("tongSoPO", pos.size());

        Map<String, Long> prStatusMap = new HashMap<>();
        prStatusMap.put("CHO_DUYET", countPending);
        prStatusMap.put("DA_DUYET", countApproved);
        prStatusMap.put("DANG_MUA", countBuying);
        prStatusMap.put("DA_HOAN_THANH", countCompleted);
        prStatusMap.put("TU_CHOI", countRejected);
        res.put("prTheoTrangThai", prStatusMap);

        Map<String, Long> poStatusMap = new HashMap<>();
        poStatusMap.put("MOI_TAO", poNew);
        poStatusMap.put("DA_GUI_NCC", poSent);
        poStatusMap.put("DANG_GIAO_HANG", poShipping);
        poStatusMap.put("DA_NHAN_DU", poDone);
        poStatusMap.put("DA_HUY", poCanceled);
        res.put("poTheoTrangThai", poStatusMap);

        res.put("danhSachPR", prs);
        res.put("danhSachPO", pos);

        return ResponseEntity.ok(res);
    }
}
