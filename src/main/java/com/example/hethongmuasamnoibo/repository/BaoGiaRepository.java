package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.BaoGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BaoGiaRepository extends JpaRepository<BaoGia, Long> {
    List<BaoGia> findByYeuCauMuaSam_MaYeuCau(Long maYeuCau);
    List<BaoGia> findByNhaCungCap_MaNhaCungCap(Long maNhaCungCap);
    boolean existsByYeuCauMuaSam_MaYeuCauAndNhaCungCap_MaNhaCungCap(Long maYeuCau, Long maNhaCungCap);
    Optional<BaoGia> findByYeuCauMuaSam_MaYeuCauAndNhaCungCap_MaNhaCungCap(Long maYeuCau, Long maNhaCungCap);
    boolean existsByNhaCungCap_MaNhaCungCap(Long maNhaCungCap);
}
