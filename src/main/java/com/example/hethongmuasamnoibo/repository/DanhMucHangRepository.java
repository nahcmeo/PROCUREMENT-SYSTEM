package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.DanhMucHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DanhMucHangRepository extends JpaRepository<DanhMucHang, Long> {
}
