package com.example.hethongmuasamnoibo.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "BAO_GIA")
public class BaoGia implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_bao_gia")
    private Long maBaoGia;

    @Column(name = "ngay_bao_gia")
    private LocalDateTime ngayBaoGia = LocalDateTime.now();

    @Column(name = "tong_tien_bao_gia", precision = 15, scale = 2)
    private BigDecimal tongTienBaoGia = BigDecimal.ZERO;

    @Column(name = "duoc_lua_chon")
    private Boolean duocLuaChon = false;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_nha_cung_cap", nullable = false)
    private NhaCungCap nhaCungCap;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    private NguoiDung nguoiNhap;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_yeu_cau", nullable = false)
    private YeuCauMuaSam yeuCauMuaSam;

    @OneToMany(mappedBy = "baoGia", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ChiTietBaoGia> chiTietList = new ArrayList<>();

    public BaoGia() {}

    public Long getMaBaoGia() {
        return maBaoGia;
    }

    public void setMaBaoGia(Long maBaoGia) {
        this.maBaoGia = maBaoGia;
    }

    public LocalDateTime getNgayBaoGia() {
        return ngayBaoGia;
    }

    public void setNgayBaoGia(LocalDateTime ngayBaoGia) {
        this.ngayBaoGia = ngayBaoGia;
    }

    public BigDecimal getTongTienBaoGia() {
        return tongTienBaoGia;
    }

    public void setTongTienBaoGia(BigDecimal tongTienBaoGia) {
        this.tongTienBaoGia = tongTienBaoGia;
    }

    public Boolean getDuocLuaChon() {
        return duocLuaChon;
    }

    public void setDuocLuaChon(Boolean duocLuaChon) {
        this.duocLuaChon = duocLuaChon;
    }

    public NhaCungCap getNhaCungCap() {
        return nhaCungCap;
    }

    public void setNhaCungCap(NhaCungCap nhaCungCap) {
        this.nhaCungCap = nhaCungCap;
    }

    public NguoiDung getNguoiNhap() {
        return nguoiNhap;
    }

    public void setNguoiNhap(NguoiDung nguoiNhap) {
        this.nguoiNhap = nguoiNhap;
    }

    public YeuCauMuaSam getYeuCauMuaSam() {
        return yeuCauMuaSam;
    }

    public void setYeuCauMuaSam(YeuCauMuaSam yeuCauMuaSam) {
        this.yeuCauMuaSam = yeuCauMuaSam;
    }

    public List<ChiTietBaoGia> getChiTietList() {
        return chiTietList;
    }

    public void setChiTietList(List<ChiTietBaoGia> chiTietList) {
        this.chiTietList = chiTietList;
    }
}
