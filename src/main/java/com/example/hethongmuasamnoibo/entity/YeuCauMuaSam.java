package com.example.hethongmuasamnoibo.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "YEU_CAU_MUA_SAM")
public class YeuCauMuaSam implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_yeu_cau")
    private Long maYeuCau;

    @Column(name = "tieu_de", length = 255)
    private String tieuDe;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    private NguoiDung nguoiYeuCau;

    @Column(name = "tong_tien_du_kien", precision = 15, scale = 2)
    private BigDecimal tongTienDuKien = BigDecimal.ZERO;

    @Column(name = "trang_thai", nullable = false, length = 50)
    private String trangThai = "CHO_DUYET"; // CHO_DUYET, DA_DUYET, TU_CHOI, CHO_BAO_GIA, DA_CHON_NCC, DA_HOAN_THANH

    @Column(name = "ngay_tao")
    private LocalDateTime ngayTao = LocalDateTime.now();

    @OneToMany(mappedBy = "yeuCauMuaSam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ChiTietYeuCau> chiTietList = new ArrayList<>();

    public YeuCauMuaSam() {}

    public Long getMaYeuCau() {
        return maYeuCau;
    }

    public void setMaYeuCau(Long maYeuCau) {
        this.maYeuCau = maYeuCau;
    }

    public String getTieuDe() {
        return tieuDe;
    }

    public void setTieuDe(String tieuDe) {
        this.tieuDe = tieuDe;
    }

    public NguoiDung getNguoiYeuCau() {
        return nguoiYeuCau;
    }

    public void setNguoiYeuCau(NguoiDung nguoiYeuCau) {
        this.nguoiYeuCau = nguoiYeuCau;
    }

    public BigDecimal getTongTienDuKien() {
        return tongTienDuKien;
    }

    public void setTongTienDuKien(BigDecimal tongTienDuKien) {
        this.tongTienDuKien = tongTienDuKien;
    }

    public String getTrangThai() {
        return trangThai;
    }

    public void setTrangThai(String trangThai) {
        this.trangThai = trangThai;
    }

    public LocalDateTime getNgayTao() {
        return ngayTao;
    }

    public void setNgayTao(LocalDateTime ngayTao) {
        this.ngayTao = ngayTao;
    }

    public List<ChiTietYeuCau> getChiTietList() {
        return chiTietList;
    }

    public void setChiTietList(List<ChiTietYeuCau> chiTietList) {
        this.chiTietList = chiTietList;
    }
}
