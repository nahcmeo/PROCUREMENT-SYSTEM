package com.example.hethongmuasamnoibo.entity;

import jakarta.persistence.*;
import java.io.Serializable;

@Entity
@Table(name = "SAN_PHAM")
public class SanPham implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_san_pham")
    private Long maSanPham;

    @Column(name = "ten_san_pham", nullable = false, length = 150)
    private String tenSanPham;

    @Column(name = "don_vi_tinh", nullable = false, length = 50)
    private String donViTinh;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_danh_muc", nullable = false)
    private DanhMucHang danhMuc;

    public SanPham() {}

    public SanPham(String tenSanPham, String donViTinh, DanhMucHang danhMuc) {
        this.tenSanPham = tenSanPham;
        this.donViTinh = donViTinh;
        this.danhMuc = danhMuc;
    }

    public Long getMaSanPham() {
        return maSanPham;
    }

    public void setMaSanPham(Long maSanPham) {
        this.maSanPham = maSanPham;
    }

    public String getTenSanPham() {
        return tenSanPham;
    }

    public void setTenSanPham(String tenSanPham) {
        this.tenSanPham = tenSanPham;
    }

    public String getDonViTinh() {
        return donViTinh;
    }

    public void setDonViTinh(String donViTinh) {
        this.donViTinh = donViTinh;
    }

    public DanhMucHang getDanhMuc() {
        return danhMuc;
    }

    public void setDanhMuc(DanhMucHang danhMuc) {
        this.danhMuc = danhMuc;
    }
}
