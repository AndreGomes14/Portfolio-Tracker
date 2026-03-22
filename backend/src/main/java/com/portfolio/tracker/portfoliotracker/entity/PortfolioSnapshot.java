package com.portfolio.tracker.portfoliotracker.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "portfolio_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDateTime snapshotDate;

    @Column(name = "total_portfolio_value", nullable = false)
    @Builder.Default
    private Double totalPortfolioValue = 0.0;

    @Column(name = "total_invested_amount", nullable = false)
    @Builder.Default
    private Double totalInvestedAmount = 0.0;

    @Column(name = "total_current_value", nullable = false)
    @Builder.Default
    private Double totalCurrentValue = 0.0;

    @Column(name = "total_profit_and_loss", nullable = false)
    @Builder.Default
    private Double totalProfitAndLoss = 0.0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
