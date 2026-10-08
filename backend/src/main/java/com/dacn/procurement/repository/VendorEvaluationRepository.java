package com.dacn.procurement.repository;

import com.dacn.procurement.entity.VendorEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface VendorEvaluationRepository extends JpaRepository<VendorEvaluation, Long> {
    Optional<VendorEvaluation> findByPurchaseOrderId(Long poId);
    List<VendorEvaluation> findByVendorId(Long vendorId);

    @Query("SELECT AVG(v.averageScore) FROM VendorEvaluation v WHERE v.vendor.id = :vendorId")
    BigDecimal calculateAverageRating(Long vendorId);
}
