package com.dacn.procurement.repository;

import com.dacn.procurement.entity.RFQ;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RFQRepository extends JpaRepository<RFQ, Long> {
    List<RFQ> findAllByOrderByCreatedAtDesc();
}
