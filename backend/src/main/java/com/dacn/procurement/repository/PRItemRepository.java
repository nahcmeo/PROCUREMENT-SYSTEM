package com.dacn.procurement.repository;

import com.dacn.procurement.entity.PRItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PRItemRepository extends JpaRepository<PRItem, Long> {
}
