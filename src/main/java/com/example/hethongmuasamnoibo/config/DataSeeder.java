package com.example.hethongmuasamnoibo.config;

import com.example.hethongmuasamnoibo.entity.*;
import com.example.hethongmuasamnoibo.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashSet;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private VaiTroRepository vaiTroRepository;

    @Autowired
    private NguoiDungRepository nguoiDungRepository;

    @Autowired
    private HanMucPheDuyetRepository hanMucPheDuyetRepository;

    @Autowired
    private DanhMucHangRepository danhMucHangRepository;

    @Autowired
    private SanPhamRepository sanPhamRepository;

    @Autowired
    private NhaCungCapRepository nhaCungCapRepository;

    @Autowired
    private DanhGiaNhaCungCapRepository danhGiaNhaCungCapRepository;

    @Autowired
    private YeuCauMuaSamRepository yeuCauMuaSamRepository;

    @Autowired
    private ChiTietYeuCauRepository chiTietYeuCauRepository;

    @Autowired
    private BaoGiaRepository baoGiaRepository;

    @Autowired
    private ChiTietBaoGiaRepository chiTietBaoGiaRepository;

    @Autowired
    private DonMuaHangRepository donMuaHangRepository;

    @Autowired
    private ChiTietDonMuaHangRepository chiTietDonMuaHangRepository;

    @Autowired
    private NhatKyPheDuyetRepository nhatKyPheDuyetRepository;

    @Override
    public void run(String... args) throws Exception {
        if (vaiTroRepository.count() == 0) {
            seedRolesAndUsers();
            seedCategoriesAndProducts();
            seedSuppliers();
        }
        if (yeuCauMuaSamRepository.count() == 0) {
            seedPurchaseRequests();
            System.out.println(">>> [DATA SEEDER] Nạp yêu cầu mua sắm mẫu thành công!");
        }
    }

    private void seedRolesAndUsers() {
        // 1. Vai trò
        VaiTro rAdmin = vaiTroRepository.save(new VaiTro("ADMIN", "Quản trị viên", "Toàn quyền hệ thống"));
        VaiTro rYeuCau = vaiTroRepository.save(new VaiTro("NHAN_VIEN_YEU_CAU", "Nhân viên yêu cầu", "Lập và theo dõi PR"));
        VaiTro rTruongPhong = vaiTroRepository.save(new VaiTro("TRUONG_PHONG", "Trưởng phòng (Người duyệt cấp 1)", "Duyệt yêu cầu dưới 50 triệu"));
        VaiTro rGiamDoc = vaiTroRepository.save(new VaiTro("GIAM_DOC", "Giám đốc (Người duyệt cấp 2)", "Duyệt yêu cầu từ 50 triệu trở lên"));
        VaiTro rMuaHang = vaiTroRepository.save(new VaiTro("NHAN_VIEN_MUA_HANG", "Nhân viên Mua hàng", "RFQ, Báo giá, Chốt NCC, Lập PO"));

        // 2. Hạn mức
        HanMucPheDuyet hm1 = new HanMucPheDuyet();
        hm1.setSoTienToiThieu(BigDecimal.ZERO);
        hm1.setSoTienToiDa(new BigDecimal("50000000.00"));
        hm1.setVaiTro(rTruongPhong);
        hanMucPheDuyetRepository.save(hm1);

        HanMucPheDuyet hm2 = new HanMucPheDuyet();
        hm2.setSoTienToiThieu(new BigDecimal("50000000.01"));
        hm2.setSoTienToiDa(new BigDecimal("1000000000.00"));
        hm2.setVaiTro(rGiamDoc);
        hanMucPheDuyetRepository.save(hm2);

        // 3. Người dùng mẫu
        createUser("admin", "123456", "Quản Trị Viên Hệ Thống", "admin@company.com", "0912345678", "Phòng CNTT", rAdmin);
        createUser("nv_an", "123456", "Nguyễn Văn An", "an.nv@company.com", "0923456789", "Phòng Marketing", rYeuCau);
        createUser("tp_binh", "123456", "Trần Thị Bình", "binh.tt@company.com", "0934567890", "Phòng Marketing", rTruongPhong);
        createUser("gd_cuong", "123456", "Lê Hoàng Cường", "cuong.lh@company.com", "0945678901", "Ban Giám Đốc", rGiamDoc);
        createUser("mh_dung", "123456", "Phạm Quốc Dũng", "dung.pq@company.com", "0956789012", "Phòng Mua Sắm", rMuaHang);
    }

    private void createUser(String username, String pass, String fullname, String email, String phone, String dept, VaiTro role) {
        NguoiDung u = new NguoiDung();
        u.setTenDangNhap(username);
        u.setMatKhau(pass);
        u.setHoVaTen(fullname);
        u.setEmail(email);
        u.setSoDienThoai(phone);
        u.setPhongBan(dept);
        u.setTrangThai(true);
        u.setVaiTros(new HashSet<>(Collections.singletonList(role)));
        nguoiDungRepository.save(u);
    }

    private void seedCategoriesAndProducts() {
        DanhMucHang c1 = new DanhMucHang();
        c1.setTenDanhMuc("Thiết bị công nghệ");
        c1.setMoTa("Máy tính, màn hình, máy in và phụ kiện IT");
        c1 = danhMucHangRepository.save(c1);

        DanhMucHang c2 = new DanhMucHang();
        c2.setTenDanhMuc("Văn phòng phẩm");
        c2.setMoTa("Giấy in, bút bi, cặp file, sổ tay");
        c2 = danhMucHangRepository.save(c2);

        DanhMucHang c3 = new DanhMucHang();
        c3.setTenDanhMuc("Nội thất văn phòng");
        c3.setMoTa("Bàn làm việc, ghế công thái học, tủ tài liệu");
        c3 = danhMucHangRepository.save(c3);

        sanPhamRepository.save(new SanPham("Laptop Dell Vostro 3520 i5", "Chiếc", c1));
        sanPhamRepository.save(new SanPham("Màn hình Dell 24 inch FHD IPS", "Chiếc", c1));
        sanPhamRepository.save(new SanPham("Máy in Laser đa năng Canon LBP 2900", "Chiếc", c1));
        sanPhamRepository.save(new SanPham("Bàn phím cơ không dây Logitech", "Chiếc", c1));

        sanPhamRepository.save(new SanPham("Giấy in A4 Double A 70gsm (Ram)", "Ram", c2));
        sanPhamRepository.save(new SanPham("Bút bi Thiên Long 0.5mm (Hộp 20 cây)", "Hộp", c2));
        sanPhamRepository.save(new SanPham("File còng bật KingJim 7cm A4", "Chiếc", c2));

        sanPhamRepository.save(new SanPham("Ghế xoay văn phòng công thái học Ergonomic", "Chiếc", c3));
        sanPhamRepository.save(new SanPham("Bàn làm việc nhân viên 1.2m vân gỗ", "Chiếc", c3));
    }

    private void seedSuppliers() {
        NhaCungCap s1 = new NhaCungCap();
        s1.setTenNhaCungCap("Công ty TNHH Thiết Bị Tin Học An Phát");
        s1.setMaSoThue("0102030405");
        s1.setSoDienThoai("0243123456");
        s1.setEmail("contact@anphatpc.com.vn");
        s1.setDiaChi("Số 49 Thái Hà, Đống Đa, Hà Nội");
        s1 = nhaCungCapRepository.save(s1);

        NhaCungCap s2 = new NhaCungCap();
        s2.setTenNhaCungCap("Công ty Cổ Phần TM-DV Phúc Anh Smart World");
        s2.setMaSoThue("0103040506");
        s2.setSoDienThoai("0243888999");
        s2.setEmail("kinhdoanh@phucanh.vn");
        s2.setDiaChi("Số 15 Xã Đàn, Đống Đa, Hà Nội");
        s2 = nhaCungCapRepository.save(s2);

        NhaCungCap s3 = new NhaCungCap();
        s3.setTenNhaCungCap("Công ty Cổ Phần Văn Phòng Phẩm Hồng Hà");
        s3.setMaSoThue("0104050607");
        s3.setSoDienThoai("0243777888");
        s3.setEmail("banhang@vpphongha.vn");
        s3.setDiaChi("25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội");
        s3 = nhaCungCapRepository.save(s3);

        // Đánh giá mẫu
        createScore(s1, new BigDecimal("9.0"), new BigDecimal("8.5"), new BigDecimal("9.5"), new BigDecimal("9.0"));
        createScore(s2, new BigDecimal("8.5"), new BigDecimal("9.0"), new BigDecimal("8.5"), new BigDecimal("8.67"));
        createScore(s3, new BigDecimal("9.5"), new BigDecimal("9.0"), new BigDecimal("9.0"), new BigDecimal("9.17"));
    }

    private void createScore(NhaCungCap ncc, BigDecimal cl, BigDecimal gc, BigDecimal td, BigDecimal tong) {
        DanhGiaNhaCungCap dg = new DanhGiaNhaCungCap();
        dg.setNhaCungCap(ncc);
        dg.setDiemChatLuong(cl);
        dg.setDiemGiaCa(gc);
        dg.setDiemTienDo(td);
        dg.setTongDiem(tong);
        dg.setNgayDanhGia(LocalDateTime.now().minusDays(10));
        danhGiaNhaCungCapRepository.save(dg);
    }

    private void seedPurchaseRequests() {
        NguoiDung nv = nguoiDungRepository.findByTenDangNhap("nv_an").orElse(null);
        NguoiDung tp = nguoiDungRepository.findByTenDangNhap("tp_binh").orElse(null);
        NguoiDung gd = nguoiDungRepository.findByTenDangNhap("gd_cuong").orElse(null);
        NguoiDung mh = nguoiDungRepository.findByTenDangNhap("mh_dung").orElse(null);
        if (nv == null) return;

        java.util.List<SanPham> prods = sanPhamRepository.findAll();
        java.util.List<NhaCungCap> nccs = nhaCungCapRepository.findAll();

        // PR 1: Chờ duyệt (Laptop & màn hình, < 50tr)
        YeuCauMuaSam pr1 = createPR(nv, "Laptop và màn hình văn phòng", "CHO_DUYET", new BigDecimal("45600000.00"), LocalDateTime.now().minusDays(2));
        if (prods.size() >= 2) {
            createItem(pr1, prods.get(0), 2, new BigDecimal("18000000.00"));
            createItem(pr1, prods.get(1), 2, new BigDecimal("4800000.00"));
        }

        // PR 2: Chờ duyệt (Ghế làm việc, < 50tr)
        YeuCauMuaSam pr2 = createPR(nv, "Ghế làm việc văn phòng", "CHO_DUYET", new BigDecimal("15000000.00"), LocalDateTime.now().minusDays(4));
        if (prods.size() >= 8) {
            createItem(pr2, prods.get(7), 5, new BigDecimal("3000000.00"));
        }

        // PR 3: Đã chọn NCC (05 Laptop, 90tr - Giám đốc duyệt)
        YeuCauMuaSam pr3 = createPR(nv, "Trang bị 05 laptop văn phòng", "DA_CHON_NCC", new BigDecimal("90000000.00"), LocalDateTime.now().minusDays(8));
        if (prods.size() >= 1) {
            createItem(pr3, prods.get(0), 5, new BigDecimal("18000000.00"));
        }
        if (gd != null) {
            createLog(pr3, gd, "PHE_DUYET", "Ban Giám Đốc đồng ý phê duyệt gói trang bị laptop");
        }

        // PR 4: Chờ báo giá (Văn phòng phẩm quý IV, 8.4tr - Trưởng phòng duyệt)
        YeuCauMuaSam pr4 = createPR(nv, "Văn phòng phẩm quý IV", "CHO_BAO_GIA", new BigDecimal("8400000.00"), LocalDateTime.now().minusDays(9));
        if (prods.size() >= 7) {
            createItem(pr4, prods.get(4), 100, new BigDecimal("65000.00"));
            createItem(pr4, prods.get(5), 20, new BigDecimal("95000.00"));
        }
        if (tp != null) {
            createLog(pr4, tp, "PHE_DUYET", "Trưởng phòng duyệt mua VPP");
        }

        // Tạo báo giá cho PR 4 từ các NCC
        if (nccs.size() >= 2 && prods.size() >= 7 && mh != null) {
            // Báo giá 1 từ Hồng Hà (thấp hơn)
            BaoGia bg1 = new BaoGia();
            bg1.setYeuCauMuaSam(pr4);
            bg1.setNhaCungCap(nccs.get(2)); // Hồng Hà
            bg1.setNguoiNhap(mh);
            bg1.setNgayBaoGia(LocalDateTime.now().minusDays(6));
            bg1.setTongTienBaoGia(new BigDecimal("8200000.00"));
            bg1.setDuocLuaChon(false);
            bg1 = baoGiaRepository.save(bg1);
            createQuoteItem(bg1, prods.get(4), 100, new BigDecimal("63000.00"));
            createQuoteItem(bg1, prods.get(5), 20, new BigDecimal("95000.00"));

            // Báo giá 2 từ An Phát
            BaoGia bg2 = new BaoGia();
            bg2.setYeuCauMuaSam(pr4);
            bg2.setNhaCungCap(nccs.get(0)); // An Phát
            bg2.setNguoiNhap(mh);
            bg2.setNgayBaoGia(LocalDateTime.now().minusDays(5));
            bg2.setTongTienBaoGia(new BigDecimal("8500000.00"));
            bg2.setDuocLuaChon(false);
            bg2 = baoGiaRepository.save(bg2);
            createQuoteItem(bg2, prods.get(4), 100, new BigDecimal("66000.00"));
            createQuoteItem(bg2, prods.get(5), 20, new BigDecimal("95000.00"));
        }

        // Tạo báo giá chốt & PO cho PR 3
        if (nccs.size() >= 1 && prods.size() >= 1 && mh != null) {
            BaoGia bg3 = new BaoGia();
            bg3.setYeuCauMuaSam(pr3);
            bg3.setNhaCungCap(nccs.get(0)); // An Phát
            bg3.setNguoiNhap(mh);
            bg3.setNgayBaoGia(LocalDateTime.now().minusDays(6));
            bg3.setTongTienBaoGia(new BigDecimal("88000000.00"));
            bg3.setDuocLuaChon(true);
            bg3 = baoGiaRepository.save(bg3);
            createQuoteItem(bg3, prods.get(0), 5, new BigDecimal("17600000.00"));

            // Đơn mua hàng PO
            DonMuaHang po = new DonMuaHang();
            po.setSoDonHang("PO-2026-0001");
            po.setYeuCauMuaSam(pr3);
            po.setBaoGia(bg3);
            po.setNhaCungCap(nccs.get(0));
            po.setNguoiLapDon(mh);
            po.setNgayDatHang(LocalDateTime.now().minusDays(4));
            po.setTongTien(new BigDecimal("88000000.00"));
            po.setTrangThai("DANG_GIAO_HANG");
            po = donMuaHangRepository.save(po);

            ChiTietDonMuaHang ctpo = new ChiTietDonMuaHang();
            ctpo.setDonMuaHang(po);
            ctpo.setSanPham(prods.get(0));
            ctpo.setSoLuongMua(5);
            ctpo.setSoLuongThucNhan(3);
            ctpo.setDonGiaChot(new BigDecimal("17600000.00"));
            ctpo.setThanhTien(new BigDecimal("88000000.00"));
            chiTietDonMuaHangRepository.save(ctpo);
        }

        // PR 5: Đã duyệt (Máy in đa năng, 12tr - Trưởng phòng duyệt)
        YeuCauMuaSam pr5 = createPR(nv, "Máy in đa năng phòng kế toán", "DA_DUYET", new BigDecimal("12000000.00"), LocalDateTime.now().minusDays(10));
        if (prods.size() >= 3) {
            createItem(pr5, prods.get(2), 2, new BigDecimal("6000000.00"));
        }
        if (tp != null) {
            createLog(pr5, tp, "PHE_DUYET", "Đã duyệt trang bị máy in cho kế toán");
        }

        // PR 6: Từ chối (Thiết bị hội nghị, 24tr)
        YeuCauMuaSam pr6 = createPR(nv, "Thiết bị hội nghị trực tuyến", "TU_CHOI", new BigDecimal("24000000.00"), LocalDateTime.now().minusDays(12));
        if (prods.size() >= 4) {
            createItem(pr6, prods.get(3), 4, new BigDecimal("6000000.00"));
        }
        if (tp != null) {
            createLog(pr6, tp, "TU_CHOI", "Chưa có dự toán cho hạng mục này trong quý IV, đề nghị chuyển quý I năm sau");
        }
    }

    private YeuCauMuaSam createPR(NguoiDung user, String title, String status, BigDecimal amount, LocalDateTime date) {
        YeuCauMuaSam pr = new YeuCauMuaSam();
        pr.setTieuDe(title);
        pr.setNguoiYeuCau(user);
        pr.setTrangThai(status);
        pr.setTongTienDuKien(amount);
        pr.setNgayTao(date);
        return yeuCauMuaSamRepository.save(pr);
    }

    private void createItem(YeuCauMuaSam pr, SanPham sp, int qty, BigDecimal price) {
        ChiTietYeuCau ct = new ChiTietYeuCau();
        ct.setYeuCauMuaSam(pr);
        ct.setSanPham(sp);
        ct.setSoLuong(qty);
        ct.setDonGiaDuKien(price);
        chiTietYeuCauRepository.save(ct);
    }

    private void createQuoteItem(BaoGia bg, SanPham sp, int qty, BigDecimal price) {
        ChiTietBaoGia ct = new ChiTietBaoGia();
        ct.setBaoGia(bg);
        ct.setSanPham(sp);
        ct.setSoLuong(qty);
        ct.setDonGiaChao(price);
        ct.setThanhTien(price.multiply(BigDecimal.valueOf(qty)));
        chiTietBaoGiaRepository.save(ct);
    }

    private void createLog(YeuCauMuaSam pr, NguoiDung user, String decision, String comment) {
        NhatKyPheDuyet nk = new NhatKyPheDuyet();
        nk.setYeuCauMuaSam(pr);
        nk.setNguoiPheDuyet(user);
        nk.setQuyetDinh(decision);
        nk.setYKienPheDuyet(comment);
        nk.setNgayDuyet(LocalDateTime.now().minusDays(5));
        nhatKyPheDuyetRepository.save(nk);
    }
}
