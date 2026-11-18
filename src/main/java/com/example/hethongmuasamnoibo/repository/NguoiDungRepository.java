package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NguoiDungRepository extends JpaRepository<NguoiDung, Long> {
    Optional<NguoiDung> findByTenDangNhap(String tenDangNhap);
    boolean existsByTenDangNhap(String tenDangNhap);
    long countByVaiTros_MaVaiTroAndTrangThaiTrue(String maVaiTro);
}
