package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.SanPham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SanPhamRepository extends JpaRepository<SanPham, Long> {
    List<SanPham> findByDanhMuc_MaDanhMuc(Long maDanhMuc);
    Optional<SanPham> findFirstByTenSanPhamIgnoreCase(String tenSanPham);
}
