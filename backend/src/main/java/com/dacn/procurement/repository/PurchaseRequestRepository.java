package com.dacn.procurement.repository;

import com.dacn.procurement.entity.PurchaseRequest;
import com.dacn.procurement.model.enums.PRStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseRequestRepository extends JpaRepository<PurchaseRequest, Long> {
    List<PurchaseRequest> findByRequesterId(Long requesterId);
    List<PurchaseRequest> findByDepartmentId(Long departmentId);
    List<PurchaseRequest> findByStatus(PRStatus status);
}
