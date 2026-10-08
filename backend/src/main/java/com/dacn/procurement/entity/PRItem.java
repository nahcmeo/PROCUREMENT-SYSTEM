package com.dacn.procurement.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "pr_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PRItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pr_id", nullable = false)
    @JsonIgnore
    private PurchaseRequest purchaseRequest;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Column(columnDefinition = "TEXT")
    private String specification;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(name = "estimated_unit_price", nullable = false)
    private BigDecimal estimatedUnitPrice;

    @Column(name = "estimated_total_price", nullable = false)
    private BigDecimal estimatedTotalPrice;
}
