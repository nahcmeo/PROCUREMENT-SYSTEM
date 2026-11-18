package com.example.hethongmuasamnoibo.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "NHAT_KY_PHE_DUYET")
public class NhatKyPheDuyet implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_nhat_ky")
    private Long maNhatKy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_yeu_cau", nullable = false)
    private YeuCauMuaSam yeuCauMuaSam;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ma_nguoi_dung", nullable = false)
    private NguoiDung nguoiPheDuyet;

    @Column(name = "y_kien_phe_duyet", length = 255)
    private String yKienPheDuyet;

    @Column(name = "quyet_dinh", nullable = false, length = 50)
    private String quyetDinh; // PHE_DUYET, TU_CHOI

    @Column(name = "ngay_duyet")
    private LocalDateTime ngayDuyet = LocalDateTime.now();

    public NhatKyPheDuyet() {}

    public Long getMaNhatKy() {
        return maNhatKy;
    }

    public void setMaNhatKy(Long maNhatKy) {
        this.maNhatKy = maNhatKy;
    }

    public YeuCauMuaSam getYeuCauMuaSam() {
        return yeuCauMuaSam;
    }

    public void setYeuCauMuaSam(YeuCauMuaSam yeuCauMuaSam) {
        this.yeuCauMuaSam = yeuCauMuaSam;
    }

    public NguoiDung getNguoiPheDuyet() {
        return nguoiPheDuyet;
    }

    public void setNguoiPheDuyet(NguoiDung nguoiPheDuyet) {
        this.nguoiPheDuyet = nguoiPheDuyet;
    }

    public String getYKienPheDuyet() {
        return yKienPheDuyet;
    }

    public void setYKienPheDuyet(String yKienPheDuyet) {
        this.yKienPheDuyet = yKienPheDuyet;
    }

    public String getQuyetDinh() {
        return quyetDinh;
    }

    public void setQuyetDinh(String quyetDinh) {
        this.quyetDinh = quyetDinh;
    }

    public LocalDateTime getNgayDuyet() {
        return ngayDuyet;
    }

    public void setNgayDuyet(LocalDateTime ngayDuyet) {
        this.ngayDuyet = ngayDuyet;
    }
}
