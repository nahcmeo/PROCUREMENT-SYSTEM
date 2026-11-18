package com.example.hethongmuasamnoibo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "CHI_TIET_YEU_CAU")
public class ChiTietYeuCau implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_chi_tiet_yeu_cau")
    private Long maChiTietYeuCau;

    @Column(name = "so_luong", nullable = false)
    private Integer soLuong;

    @Column(name = "don_gia_du_kien", nullable = false, precision = 15, scale = 2)
    private BigDecimal donGiaDuKien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_yeu_cau", nullable = false)
    @JsonIgnore
    private YeuCauMuaSam yeuCauMuaSam;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_san_pham", nullable = false)
    private SanPham sanPham;

    public ChiTietYeuCau() {}

    public Long getMaChiTietYeuCau() {
        return maChiTietYeuCau;
    }

    public void setMaChiTietYeuCau(Long maChiTietYeuCau) {
        this.maChiTietYeuCau = maChiTietYeuCau;
    }

    public Integer getSoLuong() {
        return soLuong;
    }

    public void setSoLuong(Integer soLuong) {
        this.soLuong = soLuong;
    }

    public BigDecimal getDonGiaDuKien() {
        return donGiaDuKien;
    }

    public void setDonGiaDuKien(BigDecimal donGiaDuKien) {
        this.donGiaDuKien = donGiaDuKien;
    }

    public YeuCauMuaSam getYeuCauMuaSam() {
        return yeuCauMuaSam;
    }

    public void setYeuCauMuaSam(YeuCauMuaSam yeuCauMuaSam) {
        this.yeuCauMuaSam = yeuCauMuaSam;
    }

    public SanPham getSanPham() {
        return sanPham;
    }

    public void setSanPham(SanPham sanPham) {
        this.sanPham = sanPham;
    }
}
