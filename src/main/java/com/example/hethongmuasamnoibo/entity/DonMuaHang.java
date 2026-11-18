package com.example.hethongmuasamnoibo.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "DON_MUA_HANG")
public class DonMuaHang implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_don_hang")
    private Long maDonHang;

    @Column(name = "so_don_hang", nullable = false, unique = true, length = 50)
    private String soDonHang;

    @Column(name = "ngay_dat_hang")
    private LocalDateTime ngayDatHang = LocalDateTime.now();

    @Column(name = "tong_tien", nullable = false, precision = 15, scale = 2)
    private BigDecimal tongTien = BigDecimal.ZERO;

    @Column(name = "trang_thai", nullable = false, length = 50)
    private String trangThai = "MOI_TAO"; // MOI_TAO, DA_GUI_NCC, DANG_GIAO_HANG, DA_NHAN_DU, DA_HUY

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_nha_cung_cap", nullable = false)
    private NhaCungCap nhaCungCap;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    private NguoiDung nguoiLapDon;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_yeu_cau")
    private YeuCauMuaSam yeuCauMuaSam;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_bao_gia")
    private BaoGia baoGia;

    @OneToMany(mappedBy = "donMuaHang", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ChiTietDonMuaHang> chiTietList = new ArrayList<>();

    public DonMuaHang() {}

    public Long getMaDonHang() {
        return maDonHang;
    }

    public void setMaDonHang(Long maDonHang) {
        this.maDonHang = maDonHang;
    }

    public String getSoDonHang() {
        return soDonHang;
    }

    public void setSoDonHang(String soDonHang) {
        this.soDonHang = soDonHang;
    }

    public LocalDateTime getNgayDatHang() {
        return ngayDatHang;
    }

    public void setNgayDatHang(LocalDateTime ngayDatHang) {
        this.ngayDatHang = ngayDatHang;
    }

    public BigDecimal getTongTien() {
        return tongTien;
    }

    public void setTongTien(BigDecimal tongTien) {
        this.tongTien = tongTien;
    }

    public String getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(String trangThai) {
        this.trangThai = trangThai;
    }

    public NhaCungCap getNhaCungCap() {
        return nhaCungCap;
    }

    public void setNhaCungCap(NhaCungCap nhaCungCap) {
        this.nhaCungCap = nhaCungCap;
    }

    public NguoiDung getNguoiLapDon() {
        return nguoiLapDon;
    }

    public void setNguoiLapDon(NguoiDung nguoiLapDon) {
        this.nguoiLapDon = nguoiLapDon;
    }

    public YeuCauMuaSam getYeuCauMuaSam() {
        return yeuCauMuaSam;
    }

    public void setYeuCauMuaSam(YeuCauMuaSam yeuCauMuaSam) {
        this.yeuCauMuaSam = yeuCauMuaSam;
    }

    public BaoGia getBaoGia() {
        return baoGia;
    }

    public void setBaoGia(BaoGia baoGia) {
        this.baoGia = baoGia;
    }

    public List<ChiTietDonMuaHang> getChiTietList() {
        return chiTietList;
    }

    public void setChiTietList(List<ChiTietDonMuaHang> chiTietList) {
        this.chiTietList = chiTietList;
    }
}
