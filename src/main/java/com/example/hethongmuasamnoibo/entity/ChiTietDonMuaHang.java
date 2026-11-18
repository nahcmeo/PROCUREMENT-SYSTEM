package com.example.hethongmuasamnoibo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "CHI_TIET_DON_MUA_HANG")
public class ChiTietDonMuaHang implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_chi_tiet_don_hang")
    private Long maChiTietDonHang;

    @Column(name = "so_luong_mua", nullable = false)
    private Integer soLuongMua;

    @Column(name = "so_luong_thuc_nhan")
    private Integer soLuongThucNhan = 0;

    @Column(name = "don_gia_chot", nullable = false, precision = 15, scale = 2)
    private BigDecimal donGiaChot;

    @Column(name = "thanh_tien", nullable = false, precision = 15, scale = 2)
    private BigDecimal thanhTien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_don_hang", nullable = false)
    @JsonIgnore
    private DonMuaHang donMuaHang;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_san_pham", nullable = false)
    private SanPham sanPham;

    public ChiTietDonMuaHang() {}

    public Long getMaChiTietDonHang() {
        return maChiTietDonHang;
    }

    public void setMaChiTietDonHang(Long maChiTietDonHang) {
        this.maChiTietDonHang = maChiTietDonHang;
    }

    public Integer getSoLuongMua() {
        return soLuongMua;
    }

    public void setSoLuongMua(Integer soLuongMua) {
        this.soLuongMua = soLuongMua;
    }

    public Integer getSoLuongThucNhan() {
        return soLuongThucNhan;
    }

    public void setSoLuongThucNhan(Integer soLuongThucNhan) {
        this.soLuongThucNhan = soLuongThucNhan;
    }

    public BigDecimal getDonGiaChot() {
        return donGiaChot;
    }

    public void setDonGiaChot(BigDecimal donGiaChot) {
        this.donGiaChot = donGiaChot;
    }

    public BigDecimal getThanhTien() {
        return thanhTien;
    }

    public void setThanhTien(BigDecimal thanhTien) {
        this.thanhTien = thanhTien;
    }

    public DonMuaHang getDonMuaHang() {
        return donMuaHang;
    }

    public void setDonMuaHang(DonMuaHang donMuaHang) {
        this.donMuaHang = donMuaHang;
    }

    public SanPham getSanPham() {
        return sanPham;
    }

    public void setSanPham(SanPham sanPham) {
        this.sanPham = sanPham;
    }
}
