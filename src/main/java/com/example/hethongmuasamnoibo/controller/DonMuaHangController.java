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
@RequestMapping("/api/don-mua-hang")
public class DonMuaHangController {

    @Autowired
    private DonMuaHangRepository donMuaHangRepository;

    @Autowired
    private ChiTietDonMuaHangRepository chiTietDonMuaHangRepository;

    @Autowired
    private YeuCauMuaSamRepository yeuCauMuaSamRepository;

    @Autowired
    private BaoGiaRepository baoGiaRepository;

    @Autowired
    private ChiTietBaoGiaRepository chiTietBaoGiaRepository;

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Autowired
    private SanPhamRepository sanPhamRepository;

    // 1. Danh sách đơn mua hàng PO
    @GetMapping
    public ResponseEntity<List<DonMuaHang>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status) {

        List<DonMuaHang> list = donMuaHangRepository.findAllByOrderByNgayDatHangDesc();

        if (status != null && !status.isEmpty() && !status.equalsIgnoreCase("all")) {
            list = list.stream().filter(po -> po.getTrangThai().equalsIgnoreCase(status)).toList();
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream().filter(po ->
                po.getSoDonHang().toLowerCase().contains(q) ||
                (po.getNhaCungCap() != null && po.getNhaCungCap().getTenNhaCungCap().toLowerCase().contains(q)) ||
                (po.getYeuCauMuaSam() != null && ("PR-" + String.format("%04d", po.getYeuCauMuaSam().getMaYeuCau())).toLowerCase().contains(q))
            ).toList();
        }

        for (DonMuaHang po : list) {
            po.setChiTietList(chiTietDonMuaHangRepository.findByDonMuaHang_MaDonHang(po.getMaDonHang()));
        }

        return ResponseEntity.ok(list);
    }

    // 2. Chi tiết 1 đơn hàng PO
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<DonMuaHang> opt = donMuaHangRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        DonMuaHang po = opt.get();
        po.setChiTietList(chiTietDonMuaHangRepository.findByDonMuaHang_MaDonHang(id));
        return ResponseEntity.ok(po);
    }

    // 3. Danh sách các PR đủ điều kiện lập PO (Đã chọn NCC & chưa có PO)
    @GetMapping("/eligible-prs")
    public ResponseEntity<List<Map<String, Object>>> getEligiblePrs() {
        List<YeuCauMuaSam> allPrs = yeuCauMuaSamRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (YeuCauMuaSam pr : allPrs) {
            if ("DA_CHON_NCC".equalsIgnoreCase(pr.getTrangThai()) || "DA_DUYET".equalsIgnoreCase(pr.getTrangThai())) {
                boolean hasPo = donMuaHangRepository.existsByYeuCauMuaSam_MaYeuCau(pr.getMaYeuCau());
                if (!hasPo) {
                    List<BaoGia> quotes = baoGiaRepository.findByYeuCauMuaSam_MaYeuCau(pr.getMaYeuCau());
                    BaoGia chosenQuote = quotes.stream().filter(bg -> Boolean.TRUE.equals(bg.getDuocLuaChon())).findFirst().orElse(null);

                    if (chosenQuote != null) {
                        Map<String, Object> item = new HashMap<>();
                        item.put("yeuCau", pr);
                        item.put("baoGia", chosenQuote);
                        item.put("nhaCungCap", chosenQuote.getNhaCungCap());
                        result.add(item);
                    }
                }
            }
        }

        return ResponseEntity.ok(result);
    }

    // 4. Lập đơn đặt hàng PO mới (UC 3.3.13)
    @PostMapping
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req) {
        if (!req.containsKey("maYeuCau")) {
            return ResponseEntity.badRequest().body("Vui lòng chọn phiếu đề nghị mua sắm đã chốt nhà cung cấp");
        }

        Long prId = Long.valueOf(req.get("maYeuCau").toString());
        Optional<YeuCauMuaSam> prOpt = yeuCauMuaSamRepository.findById(prId);
        if (prOpt.isEmpty()) return ResponseEntity.badRequest().body("Phiếu yêu cầu mua sắm không tồn tại");
        YeuCauMuaSam pr = prOpt.get();

        if (donMuaHangRepository.existsByYeuCauMuaSam_MaYeuCau(prId)) {
            return ResponseEntity.badRequest().body("Phiếu đề nghị mua sắm này đã được lập đơn đặt hàng");
        }

        // Tìm báo giá được chọn
        List<BaoGia> quotes = baoGiaRepository.findByYeuCauMuaSam_MaYeuCau(prId);
        BaoGia chosenQuote = quotes.stream().filter(bg -> Boolean.TRUE.equals(bg.getDuocLuaChon())).findFirst().orElse(null);
        if (chosenQuote == null) {
            return ResponseEntity.badRequest().body("Yêu cầu mua sắm chưa có báo giá được lựa chọn để lập đơn đặt hàng");
        }

        Long userId = req.get("maNguoiDung") != null ? Long.valueOf(req.get("maNguoiDung").toString()) : 5L; // default mh_dung
        NguoiDung user = nguoiDungRepository.findById(userId).orElse(null);
        if (user == null) user = nguoiDungRepository.findAll().stream().findFirst().orElse(null);

        // Sinh số đơn hàng tự động
        long nextId = donMuaHangRepository.count() + 1;
        String soDonHang = "PO-2026-" + String.format("%04d", nextId);

        DonMuaHang po = new DonMuaHang();
        po.setSoDonHang(soDonHang);
        po.setYeuCauMuaSam(pr);
        po.setBaoGia(chosenQuote);
        po.setNhaCungCap(chosenQuote.getNhaCungCap());
        po.setNguoiLapDon(user);
        po.setNgayDatHang(LocalDateTime.now());
        po.setTrangThai("MOI_TAO");
        po.setTongTien(BigDecimal.ZERO);

        DonMuaHang savedPo = donMuaHangRepository.save(po);

        // Lấy chi tiết sản phẩm từ báo giá chốt
        List<ChiTietBaoGia> quoteItems = chiTietBaoGiaRepository.findByBaoGia_MaBaoGia(chosenQuote.getMaBaoGia());
        BigDecimal total = BigDecimal.ZERO;

        for (ChiTietBaoGia it : quoteItems) {
            ChiTietDonMuaHang ct = new ChiTietDonMuaHang();
            ct.setDonMuaHang(savedPo);
            ct.setSanPham(it.getSanPham());
            ct.setSoLuongMua(it.getSoLuong());
            ct.setSoLuongThucNhan(0);
            ct.setDonGiaChot(it.getDonGiaChao());
            BigDecimal subtotal = it.getDonGiaChao().multiply(BigDecimal.valueOf(it.getSoLuong()));
            ct.setThanhTien(subtotal);
            chiTietDonMuaHangRepository.save(ct);

            total = total.add(subtotal);
        }

        savedPo.setTongTien(total);
        return ResponseEntity.ok(donMuaHangRepository.save(savedPo));
    }

    // 5. Sửa đơn hàng (chỉ khi MOI_TAO)
    @PutMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Optional<DonMuaHang> opt = donMuaHangRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        DonMuaHang po = opt.get();
        if (!"MOI_TAO".equalsIgnoreCase(po.getTrangThai())) {
            return ResponseEntity.badRequest().body("Không thể chỉnh sửa đơn hàng đã được xử lý (chỉ được sửa khi Mới tạo)");
        }

        if (req.containsKey("chiTietList")) {
            List<Map<String, Object>> items = (List<Map<String, Object>>) req.get("chiTietList");
            List<ChiTietDonMuaHang> old = chiTietDonMuaHangRepository.findByDonMuaHang_MaDonHang(id);
            chiTietDonMuaHangRepository.deleteAll(old);

            BigDecimal total = BigDecimal.ZERO;
            if (items != null) {
                for (Map<String, Object> it : items) {
                    Long prodId = Long.valueOf(it.get("maSanPham").toString());
                    Integer qty = Integer.valueOf(it.get("soLuongMua").toString());
                    BigDecimal price = new BigDecimal(it.get("donGiaChot").toString());

                    if (qty <= 0 || price.compareTo(BigDecimal.ZERO) <= 0) {
                        return ResponseEntity.badRequest().body("Số lượng và đơn giá chốt phải lớn hơn 0");
                    }

                    SanPham sp = sanPhamRepository.findById(prodId).orElse(null);
                    if (sp != null) {
                        ChiTietDonMuaHang ct = new ChiTietDonMuaHang();
                        ct.setDonMuaHang(po);
                        ct.setSanPham(sp);
                        ct.setSoLuongMua(qty);
                        ct.setSoLuongThucNhan(0);
                        ct.setDonGiaChot(price);
                        BigDecimal subtotal = price.multiply(BigDecimal.valueOf(qty));
                        ct.setThanhTien(subtotal);
                        chiTietDonMuaHangRepository.save(ct);

                        total = total.add(subtotal);
                    }
                }
            }
            po.setTongTien(total);
        }

        return ResponseEntity.ok(donMuaHangRepository.save(po));
    }

    // 6. Xóa đơn hàng (chỉ khi MOI_TAO)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Optional<DonMuaHang> opt = donMuaHangRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        DonMuaHang po = opt.get();
        if (!"MOI_TAO".equalsIgnoreCase(po.getTrangThai())) {
            return ResponseEntity.badRequest().body("Không thể xóa đơn hàng đã được xử lý (chỉ được xóa khi Mới tạo)");
        }

        List<ChiTietDonMuaHang> items = chiTietDonMuaHangRepository.findByDonMuaHang_MaDonHang(id);
        chiTietDonMuaHangRepository.deleteAll(items);
        donMuaHangRepository.delete(po);
        return ResponseEntity.ok("Xóa đơn đặt hàng thành công");
    }

    // 7. Cập nhật trạng thái đơn hàng & ghi nhận số lượng thực nhận (UC 3.3.14)
    @PutMapping("/{id}/trang-thai")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Optional<DonMuaHang> opt = donMuaHangRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        DonMuaHang po = opt.get();

        if ("DA_NHAN_DU".equalsIgnoreCase(po.getTrangThai()) || "DA_HUY".equalsIgnoreCase(po.getTrangThai())) {
            return ResponseEntity.badRequest().body("Không thể cập nhật trạng thái đơn hàng đã hoàn tất (Đã nhận đủ hoặc Đã hủy)");
        }

        String newStatus = req.get("trangThai") != null ? req.get("trangThai").toString().toUpperCase() : null;
        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng lựa chọn trạng thái mới cho đơn hàng");
        }

        // Cập nhật số lượng thực nhận nếu gửi lên
        if (req.containsKey("chiTietList")) {
            List<Map<String, Object>> items = (List<Map<String, Object>>) req.get("chiTietList");
            for (Map<String, Object> it : items) {
                if (it.containsKey("maChiTietDonHang") && it.containsKey("soLuongThucNhan")) {
                    Long ctId = Long.valueOf(it.get("maChiTietDonHang").toString());
                    Integer receivedQty = Integer.valueOf(it.get("soLuongThucNhan").toString());

                    chiTietDonMuaHangRepository.findById(ctId).ifPresent(ct -> {
                        ct.setSoLuongThucNhan(receivedQty);
                        chiTietDonMuaHangRepository.save(ct);
                    });
                }
            }
        }

        // Nếu chuyển sang ĐÃ NHẬN ĐỦ -> Kiểm tra số lượng thực nhận
        if ("DA_NHAN_DU".equalsIgnoreCase(newStatus)) {
            List<ChiTietDonMuaHang> items = chiTietDonMuaHangRepository.findByDonMuaHang_MaDonHang(id);
            for (ChiTietDonMuaHang it : items) {
                if (it.getSoLuongThucNhan() == null || it.getSoLuongThucNhan() < it.getSoLuongMua()) {
                    return ResponseEntity.badRequest().body("Số lượng thực nhận chưa đủ so với số lượng mua, không thể chuyển sang trạng thái Đã nhận đủ");
                }
            }

            // Tự động chuyển PR liên kết sang DA_HOAN_THANH
            if (po.getYeuCauMuaSam() != null) {
                YeuCauMuaSam pr = po.getYeuCauMuaSam();
                pr.setTrangThai("DA_HOAN_THANH");
                yeuCauMuaSamRepository.save(pr);
            }
        }

        po.setTrangThai(newStatus);
        return ResponseEntity.ok(donMuaHangRepository.save(po));
    }
}
