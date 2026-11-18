package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.HanMucPheDuyet;
import com.example.hethongmuasamnoibo.entity.VaiTro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HanMucPheDuyetRepository extends JpaRepository<HanMucPheDuyet, Long> {
    Optional<HanMucPheDuyet> findByVaiTro(VaiTro vaiTro);
}
