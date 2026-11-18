package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.NhaCungCap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NhaCungCapRepository extends JpaRepository<NhaCungCap, Long> {
    Optional<NhaCungCap> findByMaSoThue(String maSoThue);
    boolean existsByMaSoThue(String maSoThue);
    boolean existsByMaSoThueAndMaNhaCungCapNot(String maSoThue, Long maNhaCungCap);
}
