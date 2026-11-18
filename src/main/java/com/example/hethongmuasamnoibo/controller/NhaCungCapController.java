package com.example.hethongmuasamnoibo.controller;

import com.example.hethongmuasamnoibo.entity.NhaCungCap;
import com.example.hethongmuasamnoibo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/nha-cung-cap")
public class NhaCungCapController {

    @Autowired
    private NhaCungCapRepository nhaCungCapRepository;

    @Autowired
    private BaoGiaRepository baoGiaRepository;

    @Autowired
    private DonMuaHangRepository donMuaHangRepository;

    @Autowired
    private DanhGiaNhaCungCapRepository danhGiaNhaCungCapRepository;

    // 1. Danh sách NCC (hỗ trợ tìm kiếm)
    @GetMapping
    public ResponseEntity<List<NhaCungCap>> getAll(@RequestParam(required = false) String search) {
        List<NhaCungCap> list = nhaCungCapRepository.findAll();
        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream().filter(ncc ->
                ncc.getTenNhaCungCap().toLowerCase().contains(q) ||
                (ncc.getMaSoThue() != null && ncc.getMaSoThue().toLowerCase().contains(q)) ||
                (ncc.getSoDienThoai() != null && ncc.getSoDienThoai().contains(q)) ||
                (ncc.getEmail() != null && ncc.getEmail().toLowerCase().contains(q)) ||
                (ncc.getDiaChi() != null && ncc.getDiaChi().toLowerCase().contains(q))
            ).toList();
        }
        return ResponseEntity.ok(list);
    }

    // 2. Chi tiết một NCC
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<NhaCungCap> opt = nhaCungCapRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(opt.get());
    }

    // 3. Thêm mới NCC
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req) {
        String ten = (String) req.get("tenNhaCungCap");
        String mst = (String) req.get("maSoThue");
        String sdt = (String) req.get("soDienThoai");
        String email = (String) req.get("email");
        String diaChi = (String) req.get("diaChi");

        if (ten == null || ten.trim().isEmpty() ||
            mst == null || mst.trim().isEmpty() ||
            sdt == null || sdt.trim().isEmpty() ||
            email == null || email.trim().isEmpty() ||
            diaChi == null || diaChi.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng nhập đầy đủ thông tin bắt buộc của nhà cung cấp");
        }

        if (nhaCungCapRepository.existsByMaSoThue(mst.trim())) {
            return ResponseEntity.badRequest().body("Mã số thuế đã tồn tại");
        }

        if (!email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
            return ResponseEntity.badRequest().body("Định dạng email không hợp lệ");
        }
        if (!sdt.matches("^\\d{9,11}$")) {
            return ResponseEntity.badRequest().body("Định dạng số điện thoại không hợp lệ (cần 9-11 chữ số)");
        }

        NhaCungCap ncc = new NhaCungCap();
        ncc.setTenNhaCungCap(ten.trim());
        ncc.setMaSoThue(mst.trim());
        ncc.setSoDienThoai(sdt.trim());
        ncc.setEmail(email.trim());
        ncc.setDiaChi(diaChi.trim());

        return ResponseEntity.ok(nhaCungCapRepository.save(ncc));
    }

    // 4. Sửa NCC
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Optional<NhaCungCap> opt = nhaCungCapRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        NhaCungCap ncc = opt.get();

        if (req.containsKey("tenNhaCungCap")) {
            String ten = (String) req.get("tenNhaCungCap");
            if (ten == null || ten.trim().isEmpty()) return ResponseEntity.badRequest().body("Tên nhà cung cấp không được để trống");
            ncc.setTenNhaCungCap(ten.trim());
        }

        if (req.containsKey("maSoThue")) {
            String mst = (String) req.get("maSoThue");
            if (mst == null || mst.trim().isEmpty()) return ResponseEntity.badRequest().body("Mã số thuế không được để trống");
            if (nhaCungCapRepository.existsByMaSoThueAndMaNhaCungCapNot(mst.trim(), id)) {
                return ResponseEntity.badRequest().body("Mã số thuế đã tồn tại ở nhà cung cấp khác");
            }
            ncc.setMaSoThue(mst.trim());
        }

        if (req.containsKey("soDienThoai")) {
            String sdt = (String) req.get("soDienThoai");
            if (sdt != null && !sdt.trim().isEmpty() && !sdt.matches("^\\d{9,11}$")) {
                return ResponseEntity.badRequest().body("Định dạng số điện thoại không hợp lệ");
            }
            ncc.setSoDienThoai(sdt != null ? sdt.trim() : null);
        }

        if (req.containsKey("email")) {
            String email = (String) req.get("email");
            if (email != null && !email.trim().isEmpty() && !email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
                return ResponseEntity.badRequest().body("Định dạng email không hợp lệ");
            }
            ncc.setEmail(email != null ? email.trim() : null);
        }

        if (req.containsKey("diaChi")) {
            ncc.setDiaChi((String) req.get("diaChi"));
        }

        return ResponseEntity.ok(nhaCungCapRepository.save(ncc));
    }

    // 5. Xóa NCC (chặn nếu đã có dữ liệu liên quan)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Optional<NhaCungCap> opt = nhaCungCapRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        boolean hasQuotes = baoGiaRepository.existsByNhaCungCap_MaNhaCungCap(id);
        boolean hasPOs = donMuaHangRepository.existsByNhaCungCap_MaNhaCungCap(id);
        boolean hasScores = danhGiaNhaCungCapRepository.existsByNhaCungCap_MaNhaCungCap(id);

        if (hasQuotes || hasPOs || hasScores) {
            return ResponseEntity.badRequest().body("Không thể xóa nhà cung cấp đã phát sinh dữ liệu (đã có báo giá, đơn hàng hoặc đánh giá)");
        }

        nhaCungCapRepository.delete(opt.get());
        return ResponseEntity.ok("Xóa nhà cung cấp thành công");
    }
}
