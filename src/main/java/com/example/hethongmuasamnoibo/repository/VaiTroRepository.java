package com.example.hethongmuasamnoibo.repository;

import com.example.hethongmuasamnoibo.entity.VaiTro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface VaiTroRepository extends JpaRepository<VaiTro, String> {
}
