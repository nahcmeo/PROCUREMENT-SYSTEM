package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.ChiTietDonMuaHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietDonMuaHangRepository extends JpaRepository<ChiTietDonMuaHang, Long> {
    List<ChiTietDonMuaHang> findByDonMuaHang_MaDonHang(Long maDonHang);
}
