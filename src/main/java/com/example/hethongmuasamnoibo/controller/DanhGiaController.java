package com.example.hethongmuasamnoibo.controller;

import com.example.hethongmuasamnoibo.entity.DanhGiaNhaCungCap;
import com.example.hethongmuasamnoibo.entity.NhaCungCap;
import com.example.hethongmuasamnoibo.repository.BaoGiaRepository;
import com.example.hethongmuasamnoibo.repository.DanhGiaNhaCungCapRepository;
import com.example.hethongmuasamnoibo.repository.NhaCungCapRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/danh-gia")
public class DanhGiaController {

    @Autowired
    private DanhGiaNhaCungCapRepository danhGiaNhaCungCapRepository;

    @Autowired
    private NhaCungCapRepository nhaCungCapRepository;

    @Autowired
    private BaoGiaRepository baoGiaRepository;

    // 1. Bảng xếp hạng NCC (tính điểm trung bình sắp xếp giảm dần)
    @GetMapping("/xep-hang")
    public ResponseEntity<List<Map<String, Object>>> getRanking() {
        List<NhaCungCap> allNcc = nhaCungCapRepository.findAll();
        List<Map<String, Object>> ranking = new ArrayList<>();

        for (NhaCungCap ncc : allNcc) {
            List<DanhGiaNhaCungCap> scores = danhGiaNhaCungCapRepository.findByNhaCungCap_MaNhaCungCap(ncc.getMaNhaCungCap());
            long count = scores.size();
            long quoteCount = baoGiaRepository.findByNhaCungCap_MaNhaCungCap(ncc.getMaNhaCungCap()).size();

            BigDecimal avgCl = BigDecimal.ZERO;
            BigDecimal avgGc = BigDecimal.ZERO;
            BigDecimal avgTd = BigDecimal.ZERO;
            BigDecimal avgTotal = BigDecimal.ZERO;

            if (count > 0) {
                BigDecimal sumCl = scores.stream().map(DanhGiaNhaCungCap::getDiemChatLuong).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal sumGc = scores.stream().map(DanhGiaNhaCungCap::getDiemGiaCa).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal sumTd = scores.stream().map(DanhGiaNhaCungCap::getDiemTienDo).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal sumTotal = scores.stream().map(DanhGiaNhaCungCap::getTongDiem).reduce(BigDecimal.ZERO, BigDecimal::add);

                avgCl = sumCl.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
                avgGc = sumGc.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
                avgTd = sumTd.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
                avgTotal = sumTotal.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP);
            }

            Map<String, Object> row = new HashMap<>();
            row.put("maNhaCungCap", ncc.getMaNhaCungCap());
            row.put("tenNhaCungCap", ncc.getTenNhaCungCap());
            row.put("maSoThue", ncc.getMaSoThue());
            row.put("diemChatLuong", avgCl);
            row.put("diemGiaCa", avgGc);
            row.put("diemTienDo", avgTd);
            row.put("tongDiem", avgTotal);
            row.put("soLanDanhGia", count);
            row.put("soLanBaoGia", quoteCount);

            ranking.add(row);
        }

        // Sắp xếp thứ hạng theo tổng điểm giảm dần
        ranking.sort((a, b) -> ((BigDecimal) b.get("tongDiem")).compareTo((BigDecimal) a.get("tongDiem")));

        // Gán thứ hạng 1, 2, 3...
        for (int i = 0; i < ranking.size(); i++) {
            ranking.get(i).put("thuHang", i + 1);
        }

        return ResponseEntity.ok(ranking);
    }

    // 2. Chi tiết lịch sử đánh giá của 1 NCC
    @GetMapping("/nha-cung-cap/{id}")
    public ResponseEntity<?> getHistoryBySupplier(@PathVariable Long id) {
        Optional<NhaCungCap> opt = nhaCungCapRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        List<DanhGiaNhaCungCap> list = danhGiaNhaCungCapRepository.findByNhaCungCap_MaNhaCungCapOrderByNgayDanhGiaDesc(id);
        return ResponseEntity.ok(list);
    }

    // 3. Tạo đánh giá mới cho NCC
    @PostMapping
    public ResponseEntity<?> createScore(@RequestBody Map<String, Object> req) {
        if (!req.containsKey("maNhaCungCap") || !req.containsKey("diemChatLuong") ||
            !req.containsKey("diemGiaCa") || !req.containsKey("diemTienDo")) {
            return ResponseEntity.badRequest().body("Vui lòng nhập đầy đủ thang điểm đánh giá");
        }

        Long nccId = Long.valueOf(req.get("maNhaCungCap").toString());
        Optional<NhaCungCap> opt = nhaCungCapRepository.findById(nccId);
        if (opt.isEmpty()) return ResponseEntity.badRequest().body("Nhà cung cấp không tồn tại");

        BigDecimal cl = new BigDecimal(req.get("diemChatLuong").toString());
        BigDecimal gc = new BigDecimal(req.get("diemGiaCa").toString());
        BigDecimal td = new BigDecimal(req.get("diemTienDo").toString());

        if (cl.compareTo(BigDecimal.ZERO) < 0 || cl.compareTo(BigDecimal.TEN) > 0 ||
            gc.compareTo(BigDecimal.ZERO) < 0 || gc.compareTo(BigDecimal.TEN) > 0 ||
            td.compareTo(BigDecimal.ZERO) < 0 || td.compareTo(BigDecimal.TEN) > 0) {
            return ResponseEntity.badRequest().body("Điểm đánh giá phải thuộc thang điểm từ 0 đến 10");
        }

        BigDecimal total = cl.add(gc).add(td).divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP);

        DanhGiaNhaCungCap dg = new DanhGiaNhaCungCap();
        dg.setNhaCungCap(opt.get());
        dg.setDiemChatLuong(cl);
        dg.setDiemGiaCa(gc);
        dg.setDiemTienDo(td);
        dg.setTongDiem(total);
        dg.setNgayDanhGia(LocalDateTime.now());

        return ResponseEntity.ok(danhGiaNhaCungCapRepository.save(dg));
    }
}
