package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.YeuCauMuaSam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface YeuCauMuaSamRepository extends JpaRepository<YeuCauMuaSam, Long> {
    List<YeuCauMuaSam> findByNguoiYeuCau_MaNguoiDungOrderByNgayTaoDesc(Long maNguoiDung);
    List<YeuCauMuaSam> findByTrangThaiOrderByNgayTaoDesc(String trangThai);
    List<YeuCauMuaSam> findAllByOrderByNgayTaoDesc();
}
