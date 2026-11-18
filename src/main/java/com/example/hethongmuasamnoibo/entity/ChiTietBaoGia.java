package com.example.hethongmuasamnoibo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "CHI_TIET_BAO_GIA")
public class ChiTietBaoGia implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_chi_tiet_bao_gia")
    private Long maChiTietBaoGia;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "don_gia_chao", nullable = false, precision = 15, scale = 2)
    private BigDecimal donGiaChao;

    @Column(name = "thanh_tien", nullable = false, precision = 15, scale = 2)
    private BigDecimal thanhTien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_bao_gia", nullable = false)
    @JsonIgnore
    private BaoGia baoGia;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_san_pham", nullable = false)
    private SanPham sanPham;

    public ChiTietBaoGia() {}

    public Long getMaChiTietBaoGia() {
        return maChiTietBaoGia;
    }

    public void setMaChiTietBaoGia(Long maChiTietBaoGia) {
        this.maChiTietBaoGia = maChiTietBaoGia;
    }

    public Integer getSoLuong() {
        return soLuong;
    }

    public void setSoLuong(Integer soLuong) {
        this.soLuong = soLuong;
    }

    public BigDecimal getDonGiaChao() {
        return donGiaChao;
    }

    public void setDonGiaChao(BigDecimal donGiaChao) {
        this.donGiaChao = donGiaChao;
    }

    public BigDecimal getThanhTien() {
        return thanhTien;
    }

    public void setThanhTien(BigDecimal thanhTien) {
        this.thanhTien = thanhTien;
    }

    public BaoGia getBaoGia() {
        return baoGia;
    }

    public void setBaoGia(BaoGia baoGia) {
        this.baoGia = baoGia;
    }

    public SanPham getSanPham() {
        return sanPham;
    }

    public void setSanPham(SanPham sanPham) {
        this.sanPham = sanPham;
    }
}
