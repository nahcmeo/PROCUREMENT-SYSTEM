package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.NhatKyPheDuyet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NhatKyPheDuyetRepository extends JpaRepository<NhatKyPheDuyet, Long> {
    List<NhatKyPheDuyet> findByYeuCauMuaSam_MaYeuCauOrderByNgayDuyetDesc(Long maYeuCau);
}
