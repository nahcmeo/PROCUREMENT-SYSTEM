package com.example.hethongmuasamnoibo.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "HAN_MUC_PHE_DUYET")
public class HanMucPheDuyet implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_han_muc")
    private Long maHanMuc;

    @Column(name = "so_tien_toi_thieu", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTienToiThieu = BigDecimal.ZERO;

    @Column(name = "so_tien_toi_da", nullable = false, precision = 15, scale = 2)
    private BigDecimal soTienToiDa;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_vai_tro", nullable = false)
    private VaiTro vaiTro;

    public HanMucPheDuyet() {}

    public Long getMaHanMuc() {
        return maHanMuc;
    }

    public void setMaHanMuc(Long maHanMuc) {
        this.maHanMuc = maHanMuc;
    }

    public BigDecimal getSoTienToiThieu() {
        return soTienToiThieu;
    }

    public void setSoTienToiThieu(BigDecimal soTienToiThieu) {
        this.soTienToiThieu = soTienToiThieu;
    }

    public BigDecimal getSoTienToiDa() {
        return soTienToiDa;
    }

    public void setSoTienToiDa(BigDecimal soTienToiDa) {
        this.soTienToiDa = soTienToiDa;
    }

    public VaiTro getVaiTro() {
        return vaiTro;
    }

    public void setVaiTro(VaiTro vaiTro) {
        this.vaiTro = vaiTro;
    }
}
