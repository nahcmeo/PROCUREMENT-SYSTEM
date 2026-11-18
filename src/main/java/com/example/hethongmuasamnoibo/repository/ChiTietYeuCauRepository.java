package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.ChiTietYeuCau;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChiTietYeuCauRepository extends JpaRepository<ChiTietYeuCau, Long> {
    List<ChiTietYeuCau> findByYeuCauMuaSam_MaYeuCau(Long maYeuCau);
}
