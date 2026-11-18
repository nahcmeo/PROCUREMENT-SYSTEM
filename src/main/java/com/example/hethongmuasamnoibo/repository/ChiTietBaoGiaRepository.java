package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.ChiTietBaoGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietBaoGiaRepository extends JpaRepository<ChiTietBaoGia, Long> {
    List<ChiTietBaoGia> findByBaoGia_MaBaoGia(Long maBaoGia);
}
