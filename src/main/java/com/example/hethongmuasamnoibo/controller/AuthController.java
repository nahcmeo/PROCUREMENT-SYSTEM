package com.example.hethongmuasamnoibo.controller;

import com.example.hethongmuasamnoibo.entity.NguoiDung;
import com.example.hethongmuasamnoibo.repository.NguoiDungRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @GetMapping("/users")
    public ResponseEntity<List<NguoiDung>> getAllUsers() {
        return ResponseEntity.ok(nguoiDungRepository.findAll());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String tenDangNhap = loginRequest.get("tenDangNhap");
        String matKhau = loginRequest.get("matKhau");

        Optional<NguoiDung> userOpt = nguoiDungRepository.findByTenDangNhap(tenDangNhap);
        if (userOpt.isEmpty()) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Tên đăng nhập hoặc mật khẩu không chính xác");
            return ResponseEntity.badRequest().body(err);
        }

        NguoiDung user = userOpt.get();
        if (Boolean.FALSE.equals(user.getTrangThai())) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên");
            return ResponseEntity.badRequest().body(err);
        }

        if (!user.getMatKhau().equals(matKhau)) {
            Map<String, String> err = new HashMap<>();
            err.put("message", "Tên đăng nhập hoặc mật khẩu không chính xác");
            return ResponseEntity.badRequest().body(err);
        }

        return ResponseEntity.ok(user);
    }
}
