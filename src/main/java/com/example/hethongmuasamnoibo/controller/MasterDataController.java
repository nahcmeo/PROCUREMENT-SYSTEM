package com.example.hethongmuasamnoibo.controller;

import com.example.hethongmuasamnoibo.entity.*;
import com.example.hethongmuasamnoibo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class MasterDataController {

    @Autowired
    private DanhMucHangRepository danhMucHangRepository;

    @Autowired
    private SanPhamRepository sanPhamRepository;

    @GetMapping("/danh-muc")
    public ResponseEntity<List<DanhMucHang>> getDanhMuc() {
        return ResponseEntity.ok(danhMucHangRepository.findAll());
    }

    @PostMapping("/danh-muc")
    public ResponseEntity<?> createDanhMuc(@RequestBody Map<String, String> req) {
        String ten = req.get("tenDanhMuc");
        if (ten == null || ten.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Tên danh mục không được để trống");
        }
        DanhMucHang dm = new DanhMucHang();
        dm.setTenDanhMuc(ten.trim());
        dm.setMoTa(req.get("moTa"));
        return ResponseEntity.ok(danhMucHangRepository.save(dm));
    }

    @PutMapping("/danh-muc/{id}")
    public ResponseEntity<?> updateDanhMuc(@PathVariable Long id, @RequestBody Map<String, String> req) {
        Optional<DanhMucHang> opt = danhMucHangRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        DanhMucHang dm = opt.get();
        if (req.containsKey("tenDanhMuc")) {
            String ten = req.get("tenDanhMuc");
            if (ten == null || ten.trim().isEmpty()) return ResponseEntity.badRequest().body("Tên danh mục không được để trống");
            dm.setTenDanhMuc(ten.trim());
        }
        if (req.containsKey("moTa")) dm.setMoTa(req.get("moTa"));
        return ResponseEntity.ok(danhMucHangRepository.save(dm));
    }

    @DeleteMapping("/danh-muc/{id}")
    public ResponseEntity<?> deleteDanhMuc(@PathVariable Long id) {
        Optional<DanhMucHang> opt = danhMucHangRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        boolean hasProducts = sanPhamRepository.findAll().stream().anyMatch(sp -> sp.getDanhMuc() != null && sp.getDanhMuc().getMaDanhMuc().equals(id));
        if (hasProducts) {
            return ResponseEntity.badRequest().body("Không thể xóa danh mục đã chứa sản phẩm");
        }
        danhMucHangRepository.delete(opt.get());
        return ResponseEntity.ok("Xóa danh mục thành công");
    }

    @GetMapping("/san-pham")
    public ResponseEntity<List<SanPham>> getSanPham() {
        return ResponseEntity.ok(sanPhamRepository.findAll());
    }

    @PostMapping("/san-pham")
    public ResponseEntity<?> createSanPham(@RequestBody Map<String, Object> req) {
        String ten = (String) req.get("tenSanPham");
        String dvt = (String) req.get("donViTinh");
        Long dmId = req.get("maDanhMuc") != null ? Long.valueOf(req.get("maDanhMuc").toString()) : null;

        if (ten == null || ten.trim().isEmpty() || dvt == null || dvt.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng nhập tên sản phẩm và đơn vị tính");
        }

        DanhMucHang dm = null;
        if (dmId != null) {
            dm = danhMucHangRepository.findById(dmId).orElse(null);
        }
        if (dm == null) {
            dm = danhMucHangRepository.findAll().stream().findFirst().orElse(null);
        }

        SanPham sp = new SanPham(ten.trim(), dvt.trim(), dm);
        return ResponseEntity.ok(sanPhamRepository.save(sp));
    }

    @PutMapping("/san-pham/{id}")
    public ResponseEntity<?> updateSanPham(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Optional<SanPham> opt = sanPhamRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        SanPham sp = opt.get();
        if (req.containsKey("tenSanPham")) {
            String ten = (String) req.get("tenSanPham");
            if (ten == null || ten.trim().isEmpty()) return ResponseEntity.badRequest().body("Tên sản phẩm không được để trống");
            sp.setTenSanPham(ten.trim());
        }
        if (req.containsKey("donViTinh")) {
            String dvt = (String) req.get("donViTinh");
            if (dvt == null || dvt.trim().isEmpty()) return ResponseEntity.badRequest().body("Đơn vị tính không được để trống");
            sp.setDonViTinh(dvt.trim());
        }
        if (req.containsKey("maDanhMuc")) {
            Long dmId = Long.valueOf(req.get("maDanhMuc").toString());
            danhMucHangRepository.findById(dmId).ifPresent(sp::setDanhMuc);
        }

        return ResponseEntity.ok(sanPhamRepository.save(sp));
    }

    @DeleteMapping("/san-pham/{id}")
    public ResponseEntity<?> deleteSanPham(@PathVariable Long id) {
        Optional<SanPham> opt = sanPhamRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        sanPhamRepository.delete(opt.get());
        return ResponseEntity.ok("Xóa sản phẩm thành công");
    }
}
