package com.example.hethongmuasamnoibo.controller;

import com.example.hethongmuasamnoibo.entity.HanMucPheDuyet;
import com.example.hethongmuasamnoibo.repository.HanMucPheDuyetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/han-muc")
public class HanMucController {

    @Autowired
    private HanMucPheDuyetRepository hanMucPheDuyetRepository;

    @GetMapping
    public ResponseEntity<List<HanMucPheDuyet>> getAll() {
        return ResponseEntity.ok(hanMucPheDuyetRepository.findAll());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Optional<HanMucPheDuyet> opt = hanMucPheDuyetRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        HanMucPheDuyet hm = opt.get();

        if (!req.containsKey("soTienToiDa")) {
            return ResponseEntity.badRequest().body("Vui lòng nhập số tiền tối đa");
        }

        try {
            BigDecimal min = req.get("soTienToiThieu") != null 
                    ? new BigDecimal(req.get("soTienToiThieu").toString()) 
                    : hm.getSoTienToiThieu();
            BigDecimal max = new BigDecimal(req.get("soTienToiDa").toString());

            if (min.compareTo(BigDecimal.ZERO) < 0 || max.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body("Số tiền phải là số dương lớn hơn 0");
            }

            if (max.compareTo(min) < 0) {
                return ResponseEntity.badRequest().body("Số tiền tối đa phải lớn hơn hoặc bằng số tiền tối thiểu");
            }

            hm.setSoTienToiThieu(min);
            hm.setSoTienToiDa(max);

            return ResponseEntity.ok(hanMucPheDuyetRepository.save(hm));
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("Định dạng số tiền không hợp lệ");
        }
    }
}
