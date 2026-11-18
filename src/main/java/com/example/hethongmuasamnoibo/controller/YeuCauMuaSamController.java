package com.example.hethongmuasamnoibo.controller;

import com.example.hethongmuasamnoibo.entity.*;
import com.example.hethongmuasamnoibo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/yeu-cau-mua-sam")
public class YeuCauMuaSamController {

    @Autowired
    private YeuCauMuaSamRepository yeuCauMuaSamRepository;

    @Autowired
    private ChiTietYeuCauRepository chiTietYeuCauRepository;

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Autowired
    private SanPhamRepository sanPhamRepository;

    @Autowired
    private DanhMucHangRepository danhMucHangRepository;

    @Autowired
    private NhatKyPheDuyetRepository nhatKyPheDuyetRepository;

    @Autowired
    private HanMucPheDuyetRepository hanMucPheDuyetRepository;

    // Helper: Tìm hoặc tạo sản phẩm từ dữ liệu nhập tay
    private SanPham findOrCreateSanPham(Map<String, Object> itemData) {
        SanPham sp = null;
        if (itemData.get("maSanPham") != null) {
            try {
                Long productId = Long.valueOf(itemData.get("maSanPham").toString());
                sp = sanPhamRepository.findById(productId).orElse(null);
            } catch (Exception ignored) {}
        }

        String tenSp = itemData.get("tenSanPham") != null ? itemData.get("tenSanPham").toString().trim() : "";
        String donViTinh = itemData.get("donViTinh") != null ? itemData.get("donViTinh").toString().trim() : "Chiếc";
        if (donViTinh.isEmpty()) donViTinh = "Chiếc";

        if (sp == null && !tenSp.isEmpty()) {
            sp = sanPhamRepository.findFirstByTenSanPhamIgnoreCase(tenSp).orElse(null);
            if (sp == null) {
                DanhMucHang defaultDm = danhMucHangRepository.findAll().stream().findFirst().orElse(null);
                sp = sanPhamRepository.save(new SanPham(tenSp, donViTinh, defaultDm));
            }
        }
        return sp;
    }

    // 1. Danh sách Yêu cầu mua sắm (hỗ trợ tìm kiếm, lọc trạng thái & lọc theo nhân viên)
    @GetMapping
    public ResponseEntity<List<YeuCauMuaSam>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long maNguoiDung) {

        List<YeuCauMuaSam> list = yeuCauMuaSamRepository.findAllByOrderByNgayTaoDesc();

        if (maNguoiDung != null) {
            list = list.stream().filter(pr -> pr.getNguoiYeuCau() != null && pr.getNguoiYeuCau().getMaNguoiDung().equals(maNguoiDung)).toList();
        }

        if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("all")) {
            list = list.stream().filter(pr -> pr.getTrangThai().equalsIgnoreCase(status)).toList();
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream().filter(pr -> 
                (pr.getTieuDe() != null && pr.getTieuDe().toLowerCase().contains(q)) ||
                ("PR-" + String.format("%04d", pr.getMaYeuCau())).toLowerCase().contains(q) ||
                (pr.getNguoiYeuCau() != null && pr.getNguoiYeuCau().getHoVaTen().toLowerCase().contains(q))
            ).toList();
        }

        return ResponseEntity.ok(list);
    }

    // 2. Thống kê 4 chỉ số KPI cho Header theo đúng wireframe Figma
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        List<YeuCauMuaSam> all = yeuCauMuaSamRepository.findAll();

        long totalCount = all.size();
        long pendingCount = all.stream().filter(pr -> "CHO_DUYET".equalsIgnoreCase(pr.getTrangThai())).count();
        // TODO: Thẻ "Hoàn tất phê duyệt" đang đếm cả NPD1 và NPD2 đã duyệt. Cần quyết định tách riêng hay gộp.
        long approvedCount = all.stream().filter(pr -> "DA_DUYET".equalsIgnoreCase(pr.getTrangThai())).count();
        long processingCount = all.stream().filter(pr -> "CHO_BAO_GIA".equalsIgnoreCase(pr.getTrangThai()) || "DANG_MUA".equalsIgnoreCase(pr.getTrangThai())).count();

        BigDecimal pendingAmount = all.stream()
                .filter(pr -> "CHO_DUYET".equalsIgnoreCase(pr.getTrangThai()))
                .map(YeuCauMuaSam::getTongTienDuKien)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal approvedAmount = all.stream()
                .filter(pr -> "DA_DUYET".equalsIgnoreCase(pr.getTrangThai()))
                .map(YeuCauMuaSam::getTongTienDuKien)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal processingAmount = all.stream()
                .filter(pr -> "CHO_BAO_GIA".equalsIgnoreCase(pr.getTrangThai()) || "DANG_MUA".equalsIgnoreCase(pr.getTrangThai()))
                .map(YeuCauMuaSam::getTongTienDuKien)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalCount", totalCount);
        stats.put("pendingCount", pendingCount);
        stats.put("pendingAmount", pendingAmount);
        stats.put("approvedCount", approvedCount);
        stats.put("approvedAmount", approvedAmount);
        stats.put("processingCount", processingCount);
        stats.put("processingAmount", processingAmount);

        return ResponseEntity.ok(stats);
    }

    // 3. Chi tiết một phiếu PR
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<YeuCauMuaSam> opt = yeuCauMuaSamRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        YeuCauMuaSam pr = opt.get();
        List<ChiTietYeuCau> items = chiTietYeuCauRepository.findByYeuCauMuaSam_MaYeuCau(id);
        pr.setChiTietList(items);
        return ResponseEntity.ok(pr);
    }

    // 4. Tạo mới phiếu PR
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req) {
        String tieuDe = (String) req.get("tieuDe");
        Long userId = Long.valueOf(req.get("maNguoiDung").toString());

        Optional<NguoiDung> userOpt = nguoiDungRepository.findById(userId);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Người dùng không tồn tại");
        }

        YeuCauMuaSam pr = new YeuCauMuaSam();
        pr.setTieuDe(tieuDe);
        pr.setNguoiYeuCau(userOpt.get());
        pr.setTrangThai("CHO_DUYET");
        pr.setNgayTao(LocalDateTime.now());
        pr.setTongTienDuKien(BigDecimal.ZERO);

        YeuCauMuaSam saved = yeuCauMuaSamRepository.save(pr);

        BigDecimal total = BigDecimal.ZERO;
        List<Map<String, Object>> items = (List<Map<String, Object>>) req.get("chiTietList");
        if (items != null) {
            for (Map<String, Object> it : items) {
                Integer qty = Integer.valueOf(it.get("soLuong").toString());
                BigDecimal price = new BigDecimal(it.get("donGiaDuKien").toString());

                SanPham sp = findOrCreateSanPham(it);
                if (sp != null) {
                    ChiTietYeuCau ct = new ChiTietYeuCau();
                    ct.setYeuCauMuaSam(saved);
                    ct.setSanPham(sp);
                    ct.setSoLuong(qty);
                    ct.setDonGiaDuKien(price);
                    chiTietYeuCauRepository.save(ct);

                    total = total.add(price.multiply(BigDecimal.valueOf(qty)));
                }
            }
        }

        saved.setTongTienDuKien(total);
        yeuCauMuaSamRepository.save(saved);

        return ResponseEntity.ok(saved);
    }

    // 5. Cập nhật phiếu PR
    @PutMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Optional<YeuCauMuaSam> opt = yeuCauMuaSamRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        YeuCauMuaSam pr = opt.get();
        if (!"CHO_DUYET".equalsIgnoreCase(pr.getTrangThai()) && 
            !"TU_CHOI".equalsIgnoreCase(pr.getTrangThai()) && 
            !"TU_CHOI_DUYET".equalsIgnoreCase(pr.getTrangThai())) {
            return ResponseEntity.badRequest().body("Chỉ có thể chỉnh sửa phiếu đang chờ duyệt hoặc từ chối duyệt");
        }

        // Nếu phiếu từng bị từ chối duyệt, khi sửa xong chuyển lại thành chờ duyệt
        if ("TU_CHOI".equalsIgnoreCase(pr.getTrangThai()) || "TU_CHOI_DUYET".equalsIgnoreCase(pr.getTrangThai())) {
            pr.setTrangThai("CHO_DUYET");
        }

        if (req.containsKey("tieuDe")) {
            pr.setTieuDe((String) req.get("tieuDe"));
        }

        if (req.containsKey("chiTietList")) {
            List<Map<String, Object>> items = (List<Map<String, Object>>) req.get("chiTietList");
            List<ChiTietYeuCau> oldItems = chiTietYeuCauRepository.findByYeuCauMuaSam_MaYeuCau(id);
            chiTietYeuCauRepository.deleteAll(oldItems);

            BigDecimal total = BigDecimal.ZERO;
            if (items != null) {
                for (Map<String, Object> it : items) {
                    Integer qty = Integer.valueOf(it.get("soLuong").toString());
                    BigDecimal price = new BigDecimal(it.get("donGiaDuKien").toString());

                    SanPham sp = findOrCreateSanPham(it);
                    if (sp != null) {
                        ChiTietYeuCau ct = new ChiTietYeuCau();
                        ct.setYeuCauMuaSam(pr);
                        ct.setSanPham(sp);
                        ct.setSoLuong(qty);
                        ct.setDonGiaDuKien(price);
                        chiTietYeuCauRepository.save(ct);

                        total = total.add(price.multiply(BigDecimal.valueOf(qty)));
                    }
                }
            }
            pr.setTongTienDuKien(total);
        }

        return ResponseEntity.ok(yeuCauMuaSamRepository.save(pr));
    }

    // 6. Xóa phiếu PR
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Optional<YeuCauMuaSam> opt = yeuCauMuaSamRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        YeuCauMuaSam pr = opt.get();
        if (!"CHO_DUYET".equalsIgnoreCase(pr.getTrangThai())) {
            return ResponseEntity.badRequest().body("Không thể xóa phiếu đã được xử lý");
        }

        List<ChiTietYeuCau> items = chiTietYeuCauRepository.findByYeuCauMuaSam_MaYeuCau(id);
        if (items != null && !items.isEmpty()) {
            chiTietYeuCauRepository.deleteAll(items);
        }

        yeuCauMuaSamRepository.delete(pr);
        return ResponseEntity.ok("Xóa thành công");
    }

    // 7. Phê duyệt hoặc Từ chối yêu cầu mua sắm (hỗ trợ quy trình 2 cấp tuần tự theo hạn mức động)
    @PostMapping("/{id}/phe-duyet")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> pheDuyet(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {

        Optional<YeuCauMuaSam> opt = yeuCauMuaSamRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        YeuCauMuaSam pr = opt.get();
        if (!"CHO_DUYET".equalsIgnoreCase(pr.getTrangThai()) && !"CHO_DUYET_CAP_2".equalsIgnoreCase(pr.getTrangThai())) {
            return ResponseEntity.badRequest().body("Phiếu không ở trạng thái chờ duyệt");
        }

        Long userId = body.get("maNguoiDung") != null ? Long.valueOf(body.get("maNguoiDung").toString()) : null;
        String quyetDinh = body.get("quyetDinh") != null ? body.get("quyetDinh").toString().toUpperCase() : "PHE_DUYET";
        String yKien = body.get("yKien") != null ? body.get("yKien").toString().trim() : "";

        NguoiDung user = null;
        if (userId != null) {
            user = nguoiDungRepository.findById(userId).orElse(null);
        }
        if (user == null) {
            user = nguoiDungRepository.findAll().stream().findFirst().orElse(null);
        }

        // Lấy hạn mức động từ DB
        List<HanMucPheDuyet> limits = hanMucPheDuyetRepository.findAll();
        BigDecimal npd1Max = limits.stream()
                .filter(h -> h.getVaiTro() != null && "TRUONG_PHONG".equalsIgnoreCase(h.getVaiTro().getMaVaiTro()))
                .map(HanMucPheDuyet::getSoTienToiDa)
                .findFirst().orElse(new BigDecimal("50000000.00"));
        BigDecimal npd2Max = limits.stream()
                .filter(h -> h.getVaiTro() != null && "GIAM_DOC".equalsIgnoreCase(h.getVaiTro().getMaVaiTro()))
                .map(HanMucPheDuyet::getSoTienToiDa)
                .findFirst().orElse(new BigDecimal("1000000000.00"));

        boolean isDirector = user != null && user.getVaiTros().stream().anyMatch(v -> "GIAM_DOC".equalsIgnoreCase(v.getMaVaiTro()));
        BigDecimal amount = pr.getTongTienDuKien() != null ? pr.getTongTienDuKien() : BigDecimal.ZERO;

        if ("TU_CHOI".equalsIgnoreCase(quyetDinh)) {
            pr.setTrangThai("TU_CHOI");
        } else {
            // Phê duyệt
            if (isDirector) {
                // Giám đốc duyệt (NPD2)
                if (amount.compareTo(npd2Max) > 0) {
                    return ResponseEntity.badRequest().body("Số tiền yêu cầu vượt quá hạn mức tối đa của Ban Giám Đốc");
                }
                pr.setTrangThai("DA_DUYET");
            } else {
                // Trưởng phòng duyệt (NPD1)
                if (amount.compareTo(npd1Max) <= 0) {
                    pr.setTrangThai("DA_DUYET");
                } else {
                    // Vượt hạn mức Trưởng phòng -> Chuyển tuần tự bước 2 lên Giám đốc
                    pr.setTrangThai("CHO_DUYET_CAP_2");
                }
            }
        }
        YeuCauMuaSam updatedPr = yeuCauMuaSamRepository.save(pr);

        // Lưu nhật ký phê duyệt
        if (user != null) {
            NhatKyPheDuyet nk = new NhatKyPheDuyet();
            nk.setYeuCauMuaSam(updatedPr);
            nk.setNguoiPheDuyet(user);
            nk.setQuyetDinh(quyetDinh);
            String defaultComment = quyetDinh.equals("PHE_DUYET") 
                    ? (pr.getTrangThai().equals("CHO_DUYET_CAP_2") ? "Đồng ý chuyển Ban Giám Đốc (NPD2) phê duyệt" : "Đồng ý phê duyệt yêu cầu")
                    : "Từ chối yêu cầu";
            nk.setYKienPheDuyet(yKien.isEmpty() ? defaultComment : yKien);
            nk.setNgayDuyet(LocalDateTime.now());
            nhatKyPheDuyetRepository.save(nk);
        }

        return ResponseEntity.ok(updatedPr);
    }

    // 8. Lập yêu cầu báo giá (RFQ) - Chuyển PR đã duyệt sang Chờ báo giá
    @PostMapping("/{id}/rfq")
    public ResponseEntity<?> lapRfq(@PathVariable Long id) {
        Optional<YeuCauMuaSam> opt = yeuCauMuaSamRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        YeuCauMuaSam pr = opt.get();
        if (!"DA_DUYET".equalsIgnoreCase(pr.getTrangThai())) {
            return ResponseEntity.badRequest().body("Chỉ có thể lập RFQ cho yêu cầu đã được phê duyệt");
        }

        pr.setTrangThai("CHO_BAO_GIA");
        return ResponseEntity.ok(yeuCauMuaSamRepository.save(pr));
    }

    // 9. Lấy nhật ký phê duyệt của phiếu
    @GetMapping("/{id}/nhat-ky")
    public ResponseEntity<List<NhatKyPheDuyet>> getNhatKy(@PathVariable Long id) {
        List<NhatKyPheDuyet> list = nhatKyPheDuyetRepository.findByYeuCauMuaSam_MaYeuCauOrderByNgayDuyetDesc(id);
        return ResponseEntity.ok(list);
    }
}
