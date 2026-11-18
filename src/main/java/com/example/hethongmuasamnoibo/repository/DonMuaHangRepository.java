package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.DonMuaHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DonMuaHangRepository extends JpaRepository<DonMuaHang, Long> {
    List<DonMuaHang> findAllByOrderByNgayDatHangDesc();
    boolean existsByYeuCauMuaSam_MaYeuCau(Long maYeuCau);
    boolean existsByNhaCungCap_MaNhaCungCap(Long maNhaCungCap);
    boolean existsByBaoGia_MaBaoGia(Long maBaoGia);
}
