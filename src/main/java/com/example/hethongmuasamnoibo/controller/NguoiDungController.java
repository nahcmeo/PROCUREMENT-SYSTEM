package com.example.hethongmuasamnoibo.controller;

import com.example.hethongmuasamnoibo.entity.NguoiDung;
import com.example.hethongmuasamnoibo.entity.VaiTro;
import com.example.hethongmuasamnoibo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/nguoi-dung")
public class NguoiDungController {

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Autowired
    private VaiTroRepository vaiTroRepository;

    @Autowired
    private YeuCauMuaSamRepository yeuCauMuaSamRepository;

    @Autowired
    private DonMuaHangRepository donMuaHangRepository;

    @Autowired
    private BaoGiaRepository baoGiaRepository;

    @Autowired
    private NhatKyPheDuyetRepository nhatKyPheDuyetRepository;

    // 1. Danh sách người dùng (tìm kiếm & lọc)
    @GetMapping
    public ResponseEntity<List<NguoiDung>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean status) {

        List<NguoiDung> list = nguoiDungRepository.findAll();

        if (status != null) {
            list = list.stream().filter(u -> Objects.equals(u.getTrangThai(), status)).toList();
        }

        if (role != null && !role.trim().isEmpty() && !role.equalsIgnoreCase("all")) {
            list = list.stream().filter(u -> 
                u.getVaiTros().stream().anyMatch(v -> v.getMaVaiTro().equalsIgnoreCase(role.trim()))
            ).toList();
        }

        if (search != null && !search.trim().isEmpty()) {
            String q = search.trim().toLowerCase();
            list = list.stream().filter(u ->
                u.getTenDangNhap().toLowerCase().contains(q) ||
                (u.getHoVaTen() != null && u.getHoVaTen().toLowerCase().contains(q)) ||
                (u.getEmail() != null && u.getEmail().toLowerCase().contains(q)) ||
                (u.getSoDienThoai() != null && u.getSoDienThoai().contains(q)) ||
                (u.getPhongBan() != null && u.getPhongBan().toLowerCase().contains(q))
            ).toList();
        }

        return ResponseEntity.ok(list);
    }

    // 2. Chi tiết người dùng
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        Optional<NguoiDung> opt = nguoiDungRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(opt.get());
    }

    // 3. Thêm mới tài khoản
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> req) {
        String tenDangNhap = (String) req.get("tenDangNhap");
        String matKhau = (String) req.get("matKhau");
        String hoVaTen = (String) req.get("hoVaTen");
        String email = (String) req.get("email");
        String soDienThoai = (String) req.get("soDienThoai");
        String phongBan = (String) req.get("phongBan");

        if (tenDangNhap == null || tenDangNhap.trim().isEmpty() ||
            matKhau == null || matKhau.trim().isEmpty() ||
            hoVaTen == null || hoVaTen.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng nhập đầy đủ các trường thông tin bắt buộc");
        }

        if (nguoiDungRepository.existsByTenDangNhap(tenDangNhap.trim())) {
            return ResponseEntity.badRequest().body("Tên đăng nhập đã tồn tại");
        }

        // Validate email và số điện thoại
        if (email != null && !email.trim().isEmpty() && !email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
            return ResponseEntity.badRequest().body("Định dạng email không hợp lệ");
        }
        if (soDienThoai != null && !soDienThoai.trim().isEmpty() && !soDienThoai.matches("^\\d{9,11}$")) {
            return ResponseEntity.badRequest().body("Định dạng số điện thoại không hợp lệ (cần 9-11 chữ số)");
        }

        NguoiDung user = new NguoiDung();
        user.setTenDangNhap(tenDangNhap.trim());
        user.setMatKhau(matKhau.trim());
        user.setHoVaTen(hoVaTen.trim());
        user.setEmail(email != null ? email.trim() : null);
        user.setSoDienThoai(soDienThoai != null ? soDienThoai.trim() : null);
        user.setPhongBan(phongBan != null ? phongBan.trim() : "Phòng Mua Sắm");
        user.setTrangThai(true);

        // Gán vai trò
        Set<VaiTro> roles = new HashSet<>();
        if (req.containsKey("maVaiTroList")) {
            List<String> roleCodes = (List<String>) req.get("maVaiTroList");
            if (roleCodes != null) {
                for (String code : roleCodes) {
                    vaiTroRepository.findById(code).ifPresent(roles::add);
                }
            }
        } else if (req.containsKey("maVaiTro")) {
            String code = (String) req.get("maVaiTro");
            if (code != null) {
                vaiTroRepository.findById(code).ifPresent(roles::add);
            }
        }

        if (roles.isEmpty()) {
            // Mặc định nhân viên yêu cầu nếu chưa chọn
            vaiTroRepository.findById("NHAN_VIEN_YEU_CAU").ifPresent(roles::add);
        }
        user.setVaiTros(roles);

        return ResponseEntity.ok(nguoiDungRepository.save(user));
    }

    // 4. Sửa thông tin tài khoản
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Optional<NguoiDung> opt = nguoiDungRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        NguoiDung user = opt.get();

        if (req.containsKey("hoVaTen")) {
            String hoTen = (String) req.get("hoVaTen");
            if (hoTen == null || hoTen.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Họ và tên không được để trống");
            }
            user.setHoVaTen(hoTen.trim());
        }

        if (req.containsKey("email")) {
            String email = (String) req.get("email");
            if (email != null && !email.trim().isEmpty() && !email.matches("^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$")) {
                return ResponseEntity.badRequest().body("Định dạng email không hợp lệ");
            }
            user.setEmail(email != null ? email.trim() : null);
        }

        if (req.containsKey("soDienThoai")) {
            String phone = (String) req.get("soDienThoai");
            if (phone != null && !phone.trim().isEmpty() && !phone.matches("^\\d{9,11}$")) {
                return ResponseEntity.badRequest().body("Định dạng số điện thoại không hợp lệ");
            }
            user.setSoDienThoai(phone != null ? phone.trim() : null);
        }

        if (req.containsKey("phongBan")) {
            user.setPhongBan((String) req.get("phongBan"));
        }

        if (req.containsKey("matKhau")) {
            String pass = (String) req.get("matKhau");
            if (pass != null && !pass.trim().isEmpty()) {
                user.setMatKhau(pass.trim());
            }
        }

        return ResponseEntity.ok(nguoiDungRepository.save(user));
    }

    // 5. Gán vai trò (Phân quyền)
    @PutMapping("/{id}/vai-tro")
    public ResponseEntity<?> assignRoles(@PathVariable Long id, @RequestBody Map<String, Object> req) {
        Optional<NguoiDung> opt = nguoiDungRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        NguoiDung user = opt.get();
        List<String> roleCodes = (List<String>) req.get("maVaiTroList");

        if (roleCodes == null || roleCodes.isEmpty()) {
            return ResponseEntity.badRequest().body("Vui lòng lựa chọn ít nhất một vai trò cho người dùng");
        }

        // Kiểm tra nếu đang gỡ quyền ADMIN của ADMIN cuối cùng
        boolean currentlyAdmin = user.getVaiTros().stream().anyMatch(v -> "ADMIN".equalsIgnoreCase(v.getMaVaiTro()));
        boolean willBeAdmin = roleCodes.stream().anyMatch(c -> "ADMIN".equalsIgnoreCase(c));
        if (currentlyAdmin && !willBeAdmin) {
            long activeAdmins = nguoiDungRepository.countByVaiTros_MaVaiTroAndTrangThaiTrue("ADMIN");
            if (activeAdmins <= 1) {
                return ResponseEntity.badRequest().body("Không thể bỏ quyền quản trị của tài khoản quản trị viên cuối cùng");
            }
        }

        Set<VaiTro> newRoles = new HashSet<>();
        for (String c : roleCodes) {
            vaiTroRepository.findById(c).ifPresent(newRoles::add);
        }
        user.setVaiTros(newRoles);

        return ResponseEntity.ok(nguoiDungRepository.save(user));
    }

    // 6. Khóa / Mở khóa tài khoản
    @PutMapping("/{id}/trang-thai")
    public ResponseEntity<?> toggleStatus(@PathVariable Long id) {
        Optional<NguoiDung> opt = nguoiDungRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        NguoiDung user = opt.get();
        boolean newStatus = !Boolean.TRUE.equals(user.getTrangThai());

        // Chặn khóa admin cuối cùng
        if (!newStatus) {
            boolean isAdmin = user.getVaiTros().stream().anyMatch(v -> "ADMIN".equalsIgnoreCase(v.getMaVaiTro()));
            if (isAdmin) {
                long activeAdmins = nguoiDungRepository.countByVaiTros_MaVaiTroAndTrangThaiTrue("ADMIN");
                if (activeAdmins <= 1) {
                    return ResponseEntity.badRequest().body("Không thể khóa tài khoản quản trị viên cuối cùng");
                }
            }
        }

        user.setTrangThai(newStatus);
        return ResponseEntity.ok(nguoiDungRepository.save(user));
    }

    // 7. Xóa tài khoản
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        Optional<NguoiDung> opt = nguoiDungRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        NguoiDung user = opt.get();

        // Chặn xóa admin cuối cùng
        boolean isAdmin = user.getVaiTros().stream().anyMatch(v -> "ADMIN".equalsIgnoreCase(v.getMaVaiTro()));
        if (isAdmin) {
            long activeAdmins = nguoiDungRepository.countByVaiTros_MaVaiTroAndTrangThaiTrue("ADMIN");
            if (activeAdmins <= 1) {
                return ResponseEntity.badRequest().body("Không thể xóa tài khoản quản trị viên cuối cùng");
            }
        }

        // Chặn xóa tài khoản đã có dữ liệu nghiệp vụ
        boolean hasPR = yeuCauMuaSamRepository.findAll().stream().anyMatch(pr -> pr.getNguoiYeuCau() != null && pr.getNguoiYeuCau().getMaNguoiDung().equals(id));
        boolean hasPO = donMuaHangRepository.findAll().stream().anyMatch(po -> po.getNguoiLapDon() != null && po.getNguoiLapDon().getMaNguoiDung().equals(id));
        boolean hasQuote = baoGiaRepository.findAll().stream().anyMatch(bg -> bg.getNguoiNhap() != null && bg.getNguoiNhap().getMaNguoiDung().equals(id));
        boolean hasAudit = nhatKyPheDuyetRepository.findAll().stream().anyMatch(nk -> nk.getNguoiPheDuyet() != null && nk.getNguoiPheDuyet().getMaNguoiDung().equals(id));

        if (hasPR || hasPO || hasQuote || hasAudit) {
            return ResponseEntity.badRequest().body("Không thể xóa tài khoản đang được sử dụng (đã có yêu cầu mua sắm, báo giá hoặc đơn hàng liên kết)");
        }

        nguoiDungRepository.delete(user);
        return ResponseEntity.ok("Xóa tài khoản thành công");
    }

    // 8. Lấy toàn bộ danh sách vai trò hệ thống
    @GetMapping("/vai-tro")
    public ResponseEntity<List<VaiTro>> getAllRoles() {
        return ResponseEntity.ok(vaiTroRepository.findAll());
    }
}
