package com.example.hethongmuasamnoibo.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "DANH_GIA_NHA_CUNG_CAP")
public class DanhGiaNhaCungCap implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_danh_gia")
    private Long maDanhGia;

    @Column(name = "diem_chat_luong", nullable = false, precision = 4, scale = 2)
    private BigDecimal diemChatLuong;

    @Column(name = "diem_gia_ca", nullable = false, precision = 4, scale = 2)
    private BigDecimal diemGiaCa;

    @Column(name = "diem_tien_do", nullable = false, precision = 4, scale = 2)
    private BigDecimal diemTienDo;

    @Column(name = "tong_diem", nullable = false, precision = 4, scale = 2)
    private BigDecimal tongDiem;

    @Column(name = "ngay_danh_gia")
    private LocalDateTime ngayDanhGia = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_nha_cung_cap", nullable = false)
    private NhaCungCap nhaCungCap;

    public DanhGiaNhaCungCap() {}

    public Long getMaDanhGia() {
        return maDanhGia;
    }

    public void setMaDanhGia(Long maDanhGia) {
        this.maDanhGia = maDanhGia;
    }

    public BigDecimal getDiemChatLuong() {
        return diemChatLuong;
    }

    public void setDiemChatLuong(BigDecimal diemChatLuong) {
        this.diemChatLuong = diemChatLuong;
    }

    public BigDecimal getDiemGiaCa() {
        return diemGiaCa;
    }

    public void setDiemGiaCa(BigDecimal diemGiaCa) {
        this.diemGiaCa = diemGiaCa;
    }

    public BigDecimal getDiemTienDo() {
        return diemTienDo;
    }

    public void setDiemTienDo(BigDecimal diemTienDo) {
        this.diemTienDo = diemTienDo;
    }

    public BigDecimal getTongDiem() {
        return tongDiem;
    }

    public void setTongDiem(BigDecimal tongDiem) {
        this.tongDiem = tongDiem;
    }

    public LocalDateTime getNgayDanhGia() {
        return ngayDanhGia;
    }

    public void setNgayDanhGia(LocalDateTime ngayDanhGia) {
        this.ngayDanhGia = ngayDanhGia;
    }

    public NhaCungCap getNhaCungCap() {
        return nhaCungCap;
    }

    public void setNhaCungCap(NhaCungCap nhaCungCap) {
        this.nhaCungCap = nhaCungCap;
    }
}
