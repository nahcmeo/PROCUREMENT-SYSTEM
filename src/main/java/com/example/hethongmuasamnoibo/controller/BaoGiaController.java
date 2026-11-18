package com.example.hethongmuasamnoibo.controller;

import com.example.hethongmuasamnoibo.entity.*;
import com.example.hethongmuasamnoibo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/bao-gia")
public class BaoGiaController {

    @Autowired
    private BaoGiaRepository baoGiaRepository;

    @Autowired
    private ChiTietBaoGiaRepository chiTietBaoGiaRepository;

    @Autowired
    private YeuCauMuaSamRepository yeuCauMuaSamRepository;

    @Autowired
    private NhaCungCapRepository nhaCungCapRepository;

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Autowired
    private SanPhamRepository sanPhamRepository;

    @Autowired
    private DonMuaHangRepository donMuaHangRepository;

    @Autowired
    private DanhGiaNhaCungCapRepository danhGiaNhaCungCapRepository;

    // 1. Danh sách báo giá (tìm kiếm & lọc)
    @GetMapping
    public ResponseEntity<List<BaoGia>> getAll(
            @RequestParam(required = false) Long maYeuCau,
            @RequestParam(required = false) Long maNhaCungCap,
            @RequestParam(required = false) Boolean duocLuaChon,
            @RequestParam(required = false) String tuNgay,
            @RequestParam(required = false) String denNgay,
            @RequestParam(required = false) String search) {

        List<BaoGia> list = baoGiaRepository.findAll();

        if (maYeuCau != null) {
            list = list.stream().filter(bg -> bg.getYeuCauMuaSam() != null && bg.getYeuCauMuaSam().getMaYeuCau().equals(maYeuCau)).toList();
        }
        if (maNhaCungCap != null) {
            list = list.stream().filter(bg -> bg.getNhaCungCap() != null && bg.getNhaCungCap().getMaNhaCungCap().equals(maNhaCungCap)).toList();
        }
        if (duocLuaChon != null) {
            list = list.stream().filter(bg -> Objects.equals(bg.getDuocLuaChon(), duocLuaChon)).toList();
        }
        if (tuNgay != null && !tuNgay.trim().isEmpty()) {
            LocalDate from = LocalDate.parse(tuNgay.trim());
            list = list.stream().filter(bg -> bg.getNgayBaoGia() != null && !bg.getNgayBaoGia().toLocalDate().isBefore(from)).toList();
        }
        if (denNgay != null && !denNgay.trim().isEmpty()) {
            LocalDate to = LocalDate.parse(denNgay.trim());
            list = list.stream().filter(bg -> bg.getNgayBaoGia() != null && !bg.getNgayBaoGia().toLocalDate().isAfter(to)).toList();
        }
        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream().filter(bg ->
                ("BG-" + String.format("%04d", bg.getMaBaoGia())).toLowerCase().contains(q) ||
                (bg.getNhaCungCap() != null && bg.getNhaCungCap().getTenNhaCungCap().toLowerCase().contains(q)) ||
                (bg.getYeuCauMuaSam() != null && ("PR-" + String.format("%04d", bg.getYeuCauMuaSam().getMaYeuCau())).toLowerCase().contains(q))
            ).toList();
        }

        // Tải chi tiết cho mỗi báo giá
        for (BaoGia bg : list) {
            bg.setChiTietList(chiTietBaoGiaRepository.findByBaoGia_MaBaoGia(bg.getMaBaoGia()));
        }

        return ResponseEntity.ok(list);
    }

    // 2. Chi tiết 1 báo giá
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<BaoGia> opt = baoGiaRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        BaoGia bg = opt.get();
        bg.setChiTietList(chiTietBaoGiaRepository.findByBaoGia_MaBaoGia(id));
        return ResponseEntity.ok(bg);
    }

    // 3. Thêm mới báo giá cho PR
    @PostMapping
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req) {
        if (!req.containsKey("maYeuCau") || !req.containsKey("maNhaCungCap") || !req.containsKey("chiTietList")) {
            return ResponseEntity.badRequest().body("Vui lòng điền đầy đủ phiếu PR, nhà cung cấp và danh sách giá");
        }

        Long prId = Long.valueOf(req.get("maYeuCau").toString());
        Long nccId = Long.valueOf(req.get("maNhaCungCap").toString());
        Long userId = req.get("maNguoiDung") != null ? Long.valueOf(req.get("maNguoiDung").toString()) : 5L; // default mh_dung

        Optional<YeuCauMuaSam> prOpt = yeuCauMuaSamRepository.findById(prId);
        if (prOpt.isEmpty()) return ResponseEntity.badRequest().body("Phiếu yêu cầu mua sắm không tồn tại");
        YeuCauMuaSam pr = prOpt.get();

        if (!"DA_DUYET".equalsIgnoreCase(pr.getTrangThai()) && 
            !"CHO_BAO_GIA".equalsIgnoreCase(pr.getTrangThai()) && 
            !"DA_CHON_NCC".equalsIgnoreCase(pr.getTrangThai())) {
            return ResponseEntity.badRequest().body("Phiếu đề nghị mua sắm phải ở trạng thái đã được phê duyệt");
        }

        Optional<NhaCungCap> nccOpt = nhaCungCapRepository.findById(nccId);
        if (nccOpt.isEmpty()) return ResponseEntity.badRequest().body("Nhà cung cấp không tồn tại");

        if (baoGiaRepository.existsByYeuCauMuaSam_MaYeuCauAndNhaCungCap_MaNhaCungCap(prId, nccId)) {
            return ResponseEntity.badRequest().body("Nhà cung cấp đã có báo giá cho yêu cầu này");
        }

        NguoiDung user = nguoiDungRepository.findById(userId).orElse(null);
        if (user == null) user = nguoiDungRepository.findAll().stream().findFirst().orElse(null);

        BaoGia bg = new BaoGia();
        bg.setYeuCauMuaSam(pr);
        bg.setNhaCungCap(nccOpt.get());
        bg.setNguoiNhap(user);
        bg.setNgayBaoGia(LocalDateTime.now());
        bg.setDuocLuaChon(false);
        bg.setTongTienBaoGia(BigDecimal.ZERO);

        BaoGia savedBg = baoGiaRepository.save(bg);

        BigDecimal total = BigDecimal.ZERO;
        List<Map<String, Object>> items = (List<Map<String, Object>>) req.get("chiTietList");
        if (items != null) {
            for (Map<String, Object> it : items) {
                Long prodId = Long.valueOf(it.get("maSanPham").toString());
                Integer qty = Integer.valueOf(it.get("soLuong").toString());
                BigDecimal price = new BigDecimal(it.get("donGiaChao").toString());

                if (qty <= 0 || price.compareTo(BigDecimal.ZERO) <= 0) {
                    return ResponseEntity.badRequest().body("Số lượng và đơn giá chào phải lớn hơn 0");
                }

                SanPham sp = sanPhamRepository.findById(prodId).orElse(null);
                if (sp != null) {
                    ChiTietBaoGia ct = new ChiTietBaoGia();
                    ct.setBaoGia(savedBg);
                    ct.setSanPham(sp);
                    ct.setSoLuong(qty);
                    ct.setDonGiaChao(price);
                    BigDecimal subtotal = price.multiply(BigDecimal.valueOf(qty));
                    ct.setThanhTien(subtotal);
                    chiTietBaoGiaRepository.save(ct);

                    total = total.add(subtotal);
                }
            }
        }

        savedBg.setTongTienBaoGia(total);
        baoGiaRepository.save(savedBg);

        // Nếu PR đang DA_DUYET thì chuyển sang CHO_BAO_GIA
        if ("DA_DUYET".equalsIgnoreCase(pr.getTrangThai())) {
            pr.setTrangThai("CHO_BAO_GIA");
            yeuCauMuaSamRepository.save(pr);
        }

        return ResponseEntity.ok(savedBg);
    }

    // 4. Sửa báo giá
    @PutMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Optional<BaoGia> opt = baoGiaRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        BaoGia bg = opt.get();
        if (Boolean.TRUE.equals(bg.getDuocLuaChon()) || donMuaHangRepository.existsByBaoGia_MaBaoGia(id)) {
            return ResponseEntity.badRequest().body("Không thể chỉnh sửa báo giá đã được lựa chọn");
        }

        if (req.containsKey("chiTietList")) {
            List<Map<String, Object>> items = (List<Map<String, Object>>) req.get("chiTietList");
            List<ChiTietBaoGia> old = chiTietBaoGiaRepository.findByBaoGia_MaBaoGia(id);
            chiTietBaoGiaRepository.deleteAll(old);

            BigDecimal total = BigDecimal.ZERO;
            if (items != null) {
                for (Map<String, Object> it : items) {
                    Long prodId = Long.valueOf(it.get("maSanPham").toString());
                    Integer qty = Integer.valueOf(it.get("soLuong").toString());
                    BigDecimal price = new BigDecimal(it.get("donGiaChao").toString());

                    if (qty <= 0 || price.compareTo(BigDecimal.ZERO) <= 0) {
                        return ResponseEntity.badRequest().body("Số lượng và đơn giá chào phải lớn hơn 0");
                    }

                    SanPham sp = sanPhamRepository.findById(prodId).orElse(null);
                    if (sp != null) {
                        ChiTietBaoGia ct = new ChiTietBaoGia();
                        ct.setBaoGia(bg);
                        ct.setSanPham(sp);
                        ct.setSoLuong(qty);
                        ct.setDonGiaChao(price);
                        BigDecimal subtotal = price.multiply(BigDecimal.valueOf(qty));
                        ct.setThanhTien(subtotal);
                        chiTietBaoGiaRepository.save(ct);

                        total = total.add(subtotal);
                    }
                }
            }
            bg.setTongTienBaoGia(total);
        }

        return ResponseEntity.ok(baoGiaRepository.save(bg));
    }

    // 5. Xóa báo giá
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Optional<BaoGia> opt = baoGiaRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        BaoGia bg = opt.get();
        if (Boolean.TRUE.equals(bg.getDuocLuaChon()) || donMuaHangRepository.existsByBaoGia_MaBaoGia(id)) {
            return ResponseEntity.badRequest().body("Không thể xóa báo giá đã được xử lý hoặc đã được lựa chọn");
        }

        List<ChiTietBaoGia> items = chiTietBaoGiaRepository.findByBaoGia_MaBaoGia(id);
        chiTietBaoGiaRepository.deleteAll(items);
        baoGiaRepository.delete(bg);
        return ResponseEntity.ok("Xóa báo giá thành công");
    }

    // 6. Lựa chọn nhà cung cấp (Chốt báo giá - UC 3.3.12)
    @PostMapping("/{id}/chon")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> chooseQuote(@PathVariable Long id) {
        Optional<BaoGia> opt = baoGiaRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        BaoGia target = opt.get();
        Long prId = target.getYeuCauMuaSam().getMaYeuCau();

        // Bỏ chọn tất cả báo giá khác của cùng PR
        List<BaoGia> allQuotesOfPr = baoGiaRepository.findByYeuCauMuaSam_MaYeuCau(prId);
        for (BaoGia bg : allQuotesOfPr) {
            bg.setDuocLuaChon(bg.getMaBaoGia().equals(id));
            baoGiaRepository.save(bg);
        }

        // Cập nhật trạng thái PR thành DA_CHON_NCC
        YeuCauMuaSam pr = target.getYeuCauMuaSam();
        pr.setTrangThai("DA_CHON_NCC");
        yeuCauMuaSamRepository.save(pr);

        return ResponseEntity.ok(target);
    }

    // 7. Bảng so sánh báo giá theo PR (UC 3.3.10)
    @GetMapping("/so-sanh/{maYeuCau}")
    public ResponseEntity<?> compareQuotes(@PathVariable Long maYeuCau) {
        Optional<YeuCauMuaSam> prOpt = yeuCauMuaSamRepository.findById(maYeuCau);
        if (prOpt.isEmpty()) return ResponseEntity.notFound().build();

        List<BaoGia> quotes = baoGiaRepository.findByYeuCauMuaSam_MaYeuCau(maYeuCau);
        for (BaoGia bg : quotes) {
            bg.setChiTietList(chiTietBaoGiaRepository.findByBaoGia_MaBaoGia(bg.getMaBaoGia()));
        }

        Map<String, Object> res = new HashMap<>();
        res.put("yeuCau", prOpt.get());
        res.put("baoGiaList", quotes);

        return ResponseEntity.ok(res);
    }
}
