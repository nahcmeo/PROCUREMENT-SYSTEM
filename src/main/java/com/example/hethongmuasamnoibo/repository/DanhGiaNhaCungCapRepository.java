package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.DanhGiaNhaCungCap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DanhGiaNhaCungCapRepository extends JpaRepository<DanhGiaNhaCungCap, Long> {
    List<DanhGiaNhaCungCap> findByNhaCungCap_MaNhaCungCap(Long maNhaCungCap);
    List<DanhGiaNhaCungCap> findByNhaCungCap_MaNhaCungCapOrderByNgayDanhGiaDesc(Long maNhaCungCap);
    boolean existsByNhaCungCap_MaNhaCungCap(Long maNhaCungCap);
}
