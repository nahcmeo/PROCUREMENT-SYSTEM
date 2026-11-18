-- ==============================================================
-- KỊCH BẢN TẠO CSDL VÀ DỮ LIỆU MẪU (MODULE 00 - SEED DATA)
-- Đề tài: Quản lý mua sắm nội bộ và đánh giá nhà cung cấp
-- ==============================================================

CREATE DATABASE IF NOT EXISTS he_thong_mua_sam_noi_bo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE he_thong_mua_sam_noi_bo;

-- 1. BẢNG VAI TRÒ
CREATE TABLE IF NOT EXISTS VAI_TRO (
    ma_vai_tro VARCHAR(50) PRIMARY KEY,
    ten_vai_tro VARCHAR(100) NOT NULL,
    mo_ta VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. BẢNG NGƯỜI DÙNG
CREATE TABLE IF NOT EXISTS NGUOI_DUNG (
    ma_nguoi_dung BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau VARCHAR(100) NOT NULL,
    ho_va_ten VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    so_dien_thoai VARCHAR(20),
    phong_ban VARCHAR(100),
    trang_thai BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. BẢNG LIÊN KẾT NGƯỜI DÙNG - VAI TRÒ
CREATE TABLE IF NOT EXISTS NGUOI_DUNG_VAI_TRO (
    ma_nguoi_dung BIGINT NOT NULL,
    ma_vai_tro VARCHAR(50) NOT NULL,
    PRIMARY KEY (ma_nguoi_dung, ma_vai_tro),
    CONSTRAINT fk_ndvt_nguoidung FOREIGN KEY (ma_nguoi_dung) REFERENCES NGUOI_DUNG(ma_nguoi_dung) ON DELETE CASCADE,
    CONSTRAINT fk_ndvt_vaitro FOREIGN KEY (ma_vai_tro) REFERENCES VAI_TRO(ma_vai_tro) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. BẢNG HẠN MỨC PHÊ DUYỆT
CREATE TABLE IF NOT EXISTS HAN_MUC_PHE_DUYET (
    ma_han_muc BIGINT AUTO_INCREMENT PRIMARY KEY,
    so_tien_toi_thieu DECIMAL(15,2) NOT NULL DEFAULT 0,
    so_tien_toi_da DECIMAL(15,2) NOT NULL,
    ma_vai_tro VARCHAR(50) NOT NULL,
    CONSTRAINT fk_hanmuc_vaitro FOREIGN KEY (ma_vai_tro) REFERENCES VAI_TRO(ma_vai_tro) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. BẢNG DANH MỤC HÀNG
CREATE TABLE IF NOT EXISTS DANH_MUC_HANG (
    ma_danh_muc BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL,
    mo_ta VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. BẢNG SẢN PHẨM
CREATE TABLE IF NOT EXISTS SAN_PHAM (
    ma_san_pham BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_san_pham VARCHAR(150) NOT NULL,
    don_vi_tinh VARCHAR(50) NOT NULL,
    ma_danh_muc BIGINT NOT NULL,
    CONSTRAINT fk_sanpham_danhmuc FOREIGN KEY (ma_danh_muc) REFERENCES DANH_MUC_HANG(ma_danh_muc)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. BẢNG NHÀ CUNG CẤP
CREATE TABLE IF NOT EXISTS NHA_CUNG_CAP (
    ma_nha_cung_cap BIGINT AUTO_INCREMENT PRIMARY KEY,
    ten_nha_cung_cap VARCHAR(150) NOT NULL,
    ma_so_thue VARCHAR(50) NOT NULL UNIQUE,
    so_dien_thoai VARCHAR(20),
    email VARCHAR(100),
    dia_chi VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. BẢNG ĐÁNH GIÁ NHÀ CUNG CẤP
CREATE TABLE IF NOT EXISTS DANH_GIA_NHA_CUNG_CAP (
    ma_danh_gia BIGINT AUTO_INCREMENT PRIMARY KEY,
    diem_chat_luong DECIMAL(4,2) NOT NULL, -- thang điểm 10
    diem_gia_ca DECIMAL(4,2) NOT NULL,
    diem_tien_do DECIMAL(4,2) NOT NULL,
    tong_diem DECIMAL(4,2) NOT NULL,
    ngay_danh_gia DATETIME DEFAULT CURRENT_TIMESTAMP,
    ma_nha_cung_cap BIGINT NOT NULL,
    CONSTRAINT fk_danhgia_ncc FOREIGN KEY (ma_nha_cung_cap) REFERENCES NHA_CUNG_CAP(ma_nha_cung_cap)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. BẢNG YÊU CẦU MUA SẮM (PR)
CREATE TABLE IF NOT EXISTS YEU_CAU_MUA_SAM (
    ma_yeu_cau BIGINT AUTO_INCREMENT PRIMARY KEY,
    tieu_de VARCHAR(255) NOT NULL,
    ma_nguoi_dung BIGINT NOT NULL,
    tong_tien_du_kien DECIMAL(15,2) DEFAULT 0,
    trang_thai VARCHAR(50) NOT NULL DEFAULT 'CHO_DUYET', -- CHO_DUYET, DA_DUYET, TU_CHOI, CHO_BAO_GIA, DA_CHON_NCC, DA_HOAN_THANH
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pr_nguoidung FOREIGN KEY (ma_nguoi_dung) REFERENCES NGUOI_DUNG(ma_nguoi_dung)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. BẢNG CHI TIẾT YÊU CẦU
CREATE TABLE IF NOT EXISTS CHI_TIET_YEU_CAU (
    ma_chi_tiet_yeu_cau BIGINT AUTO_INCREMENT PRIMARY KEY,
    so_luong INT NOT NULL,
    don_gia_du_kien DECIMAL(15,2) NOT NULL,
    ma_yeu_cau BIGINT NOT NULL,
    ma_san_pham BIGINT NOT NULL,
    CONSTRAINT fk_ctyc_yeucau FOREIGN KEY (ma_yeu_cau) REFERENCES YEU_CAU_MUA_SAM(ma_yeu_cau) ON DELETE CASCADE,
    CONSTRAINT fk_ctyc_sanpham FOREIGN KEY (ma_san_pham) REFERENCES SAN_PHAM(ma_san_pham)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. BẢNG NHẬT KÝ PHÊ DUYỆT
CREATE TABLE IF NOT EXISTS NHAT_KY_PHE_DUYET (
    ma_nhat_ky BIGINT AUTO_INCREMENT PRIMARY KEY,
    ma_yeu_cau BIGINT NOT NULL,
    ma_nguoi_dung BIGINT NOT NULL,
    y_kien_phe_duyet VARCHAR(255),
    quyet_dinh VARCHAR(50) NOT NULL, -- PHE_DUYET, TU_CHOI
    ngay_duyet DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_nkpd_yeucau FOREIGN KEY (ma_yeu_cau) REFERENCES YEU_CAU_MUA_SAM(ma_yeu_cau),
    CONSTRAINT fk_nkpd_nguoidung FOREIGN KEY (ma_nguoi_dung) REFERENCES NGUOI_DUNG(ma_nguoi_dung)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. BẢNG BÁO GIÁ
CREATE TABLE IF NOT EXISTS BAO_GIA (
    ma_bao_gia BIGINT AUTO_INCREMENT PRIMARY KEY,
    ngay_bao_gia DATETIME DEFAULT CURRENT_TIMESTAMP,
    tong_tien_bao_gia DECIMAL(15,2) DEFAULT 0,
    duoc_lua_chon BOOLEAN DEFAULT FALSE,
    ma_nha_cung_cap BIGINT NOT NULL,
    ma_nguoi_dung BIGINT NOT NULL,
    ma_yeu_cau BIGINT NOT NULL,
    CONSTRAINT fk_baogia_ncc FOREIGN KEY (ma_nha_cung_cap) REFERENCES NHA_CUNG_CAP(ma_nha_cung_cap),
    CONSTRAINT fk_baogia_nguoidung FOREIGN KEY (ma_nguoi_dung) REFERENCES NGUOI_DUNG(ma_nguoi_dung),
    CONSTRAINT fk_baogia_yeucau FOREIGN KEY (ma_yeu_cau) REFERENCES YEU_CAU_MUA_SAM(ma_yeu_cau)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. BẢNG CHI TIẾT BÁO GIÁ
CREATE TABLE IF NOT EXISTS CHI_TIET_BAO_GIA (
    ma_chi_tiet_bao_gia BIGINT AUTO_INCREMENT PRIMARY KEY,
    so_luong INT NOT NULL,
    don_gia_chao DECIMAL(15,2) NOT NULL,
    thanh_tien DECIMAL(15,2) NOT NULL,
    ma_bao_gia BIGINT NOT NULL,
    ma_san_pham BIGINT NOT NULL,
    CONSTRAINT fk_ctbg_baogia FOREIGN KEY (ma_bao_gia) REFERENCES BAO_GIA(ma_bao_gia) ON DELETE CASCADE,
    CONSTRAINT fk_ctbg_sanpham FOREIGN KEY (ma_san_pham) REFERENCES SAN_PHAM(ma_san_pham)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. BẢNG ĐƠN MUA HÀNG (PO)
CREATE TABLE IF NOT EXISTS DON_MUA_HANG (
    ma_don_hang BIGINT AUTO_INCREMENT PRIMARY KEY,
    so_don_hang VARCHAR(50) NOT NULL UNIQUE,
    ngay_dat_hang DATETIME DEFAULT CURRENT_TIMESTAMP,
    tong_tien DECIMAL(15,2) NOT NULL,
    trang_thai VARCHAR(50) NOT NULL DEFAULT 'MOI_TAO', -- MOI_TAO, DA_GUI_NCC, DANG_GIAO_HANG, DA_NHAN_DU, DA_HUY
    ma_nha_cung_cap BIGINT NOT NULL,
    ma_nguoi_dung BIGINT NOT NULL,
    ma_yeu_cau BIGINT,
    ma_bao_gia BIGINT,
    CONSTRAINT fk_po_ncc FOREIGN KEY (ma_nha_cung_cap) REFERENCES NHA_CUNG_CAP(ma_nha_cung_cap),
    CONSTRAINT fk_po_nguoidung FOREIGN KEY (ma_nguoi_dung) REFERENCES NGUOI_DUNG(ma_nguoi_dung),
    CONSTRAINT fk_po_yeucau FOREIGN KEY (ma_yeu_cau) REFERENCES YEU_CAU_MUA_SAM(ma_yeu_cau),
    CONSTRAINT fk_po_baogia FOREIGN KEY (ma_bao_gia) REFERENCES BAO_GIA(ma_bao_gia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. BẢNG CHI TIẾT ĐƠN MUA HÀNG
CREATE TABLE IF NOT EXISTS CHI_TIET_DON_MUA_HANG (
    ma_chi_tiet_don_hang BIGINT AUTO_INCREMENT PRIMARY KEY,
    so_luong_mua INT NOT NULL,
    so_luong_thuc_nhan INT DEFAULT 0,
    don_gia_chot DECIMAL(15,2) NOT NULL,
    thanh_tien DECIMAL(15,2) NOT NULL,
    ma_don_hang BIGINT NOT NULL,
    ma_san_pham BIGINT NOT NULL,
    CONSTRAINT fk_ctpo_donhang FOREIGN KEY (ma_don_hang) REFERENCES DON_MUA_HANG(ma_don_hang) ON DELETE CASCADE,
    CONSTRAINT fk_ctpo_sanpham FOREIGN KEY (ma_san_pham) REFERENCES SAN_PHAM(ma_san_pham)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ==============================================================
-- DỮ LIỆU MẪU HẠT GIỐNG (SEED DATA SẴN SÀNG ĐỂ CHẠY CÁC MODULE)
-- ==============================================================

-- 1. Nạp vai trò
INSERT IGNORE INTO VAI_TRO (ma_vai_tro, ten_vai_tro, mo_ta) VALUES
('ADMIN', 'Quản trị viên', 'Toàn quyền cấu hình người dùng, hạn mức và danh mục'),
('NHAN_VIEN_YEU_CAU', 'Nhân viên yêu cầu', 'Lập và theo dõi phiếu yêu cầu mua sắm PR'),
('TRUONG_PHONG', 'Trưởng phòng (Người duyệt cấp 1)', 'Phê duyệt yêu cầu mua sắm dưới 50 triệu đồng'),
('GIAM_DOC', 'Giám đốc (Người duyệt cấp 2)', 'Phê duyệt yêu cầu mua sắm từ 50 triệu đồng trở lên'),
('NHAN_VIEN_MUA_HANG', 'Nhân viên Mua hàng', 'Phụ trách RFQ, quản lý báo giá, chốt NCC, lập PO và nghiệm thu');

-- 2. Nạp người dùng mẫu
INSERT IGNORE INTO NGUOI_DUNG (ma_nguoi_dung, ten_dang_nhap, mat_khau, ho_va_ten, email, phong_ban, trang_thai) VALUES
(1, 'admin', '123456', 'Quản Trị Viên Hệ Thống', 'admin@company.com', 'Phòng CNTT', TRUE),
(2, 'nv_an', '123456', 'Nguyễn Văn An', 'an.nv@company.com', 'Phòng Marketing', TRUE),
(3, 'tp_binh', '123456', 'Trần Thị Bình', 'binh.tt@company.com', 'Phòng Marketing', TRUE),
(4, 'gd_cuong', '123456', 'Lê Hoàng Cường', 'cuong.lh@company.com', 'Ban Giám Đốc', TRUE),
(5, 'mh_dung', '123456', 'Phạm Quốc Dũng', 'dung.pq@company.com', 'Phòng Mua Sắm', TRUE);

-- 3. Gán vai trò cho người dùng
INSERT IGNORE INTO NGUOI_DUNG_VAI_TRO (ma_nguoi_dung, ma_vai_tro) VALUES
(1, 'ADMIN'),
(2, 'NHAN_VIEN_YEU_CAU'),
(3, 'TRUONG_PHONG'),
(4, 'GIAM_DOC'),
(5, 'NHAN_VIEN_MUA_HANG');

-- 4. Hạn mức phê duyệt theo vai trò
INSERT IGNORE INTO HAN_MUC_PHE_DUYET (ma_han_muc, so_tien_toi_thieu, so_tien_toi_da, ma_vai_tro) VALUES
(1, 0.00, 50000000.00, 'TRUONG_PHONG'),
(2, 50000000.01, 1000000000.00, 'GIAM_DOC');

-- 5. Danh mục hàng
INSERT IGNORE INTO DANH_MUC_HANG (ma_danh_muc, ten_danh_muc, mo_ta) VALUES
(1, 'Thiết bị công nghệ', 'Máy tính, màn hình, máy in và phụ kiện IT'),
(2, 'Văn phòng phẩm', 'Giấy in, bút bi, cặp file, sổ tay'),
(3, 'Nội thất văn phòng', 'Bàn làm việc, ghế công thái học, tủ tài liệu');

-- 6. Sản phẩm mẫu
INSERT IGNORE INTO SAN_PHAM (ma_san_pham, ten_san_pham, don_vi_tinh, ma_danh_muc) VALUES
(1, 'Laptop Dell Vostro 3520 i5', 'Chiếc', 1),
(2, 'Màn hình Dell 24 inch FHD IPS', 'Chiếc', 1),
(3, 'Máy in Laser đa năng Canon LBP 2900', 'Chiếc', 1),
(4, 'Bàn phím cơ không dây Logitech', 'Chiếc', 1),
(5, 'Giấy in A4 Double A 70gsm (Ram)', 'Ram', 2),
(6, 'Bút bi Thiên Long 0.5mm (Hộp 20 cây)', 'Hộp', 2),
(7, 'File còng bật KingJim 7cm A4', 'Chiếc', 2),
(8, 'Ghế xoay văn phòng công thái học Ergonomic', 'Chiếc', 3),
(9, 'Bàn làm việc nhân viên 1.2m vân gỗ', 'Chiếc', 3);

-- 7. Nhà cung cấp mẫu
INSERT IGNORE INTO NHA_CUNG_CAP (ma_nha_cung_cap, ten_nha_cung_cap, ma_so_thue, so_dien_thoai, email, dia_chi) VALUES
(1, 'Công ty TNHH Thiết Bị Tin Học An Phát', '0102030405', '0243123456', 'contact@anphatpc.com.vn', 'Số 49 Thái Hà, Đống Đa, Hà Nội'),
(2, 'Công ty Cổ Phần TM-DV Phúc Anh Smart World', '0103040506', '0243888999', 'kinhdoanh@phucanh.vn', 'Số 15 Xã Đàn, Đống Đa, Hà Nội'),
(3, 'Công ty Cổ Phần Văn Phòng Phẩm Hồng Hà', '0104050607', '0243777888', 'banhang@vpphongha.vn', '25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội');

-- 8. Điểm đánh giá lịch sử mẫu cho nhà cung cấp (Scorecard)
INSERT IGNORE INTO DANH_GIA_NHA_CUNG_CAP (ma_danh_gia, diem_chat_luong, diem_gia_ca, diem_tien_do, tong_diem, ngay_danh_gia, ma_nha_cung_cap) VALUES
(1, 9.0, 8.5, 9.5, 9.0, NOW() - INTERVAL 30 DAY, 1),
(2, 8.5, 9.0, 8.5, 8.67, NOW() - INTERVAL 15 DAY, 2),
(3, 9.5, 9.0, 9.0, 9.17, NOW() - INTERVAL 10 DAY, 3);
