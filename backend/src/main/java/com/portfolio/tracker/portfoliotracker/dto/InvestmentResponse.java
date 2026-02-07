package com.portfolio.tracker.portfoliotracker.dto;

import com.portfolio.tracker.portfoliotracker.entity.InvestmentType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentResponse {

    private Long id;
    private String name;
    private String ticker;
    private InvestmentType type;
    private Double quantity;
    private Double averagePurchasePrice;
    private Double currentPrice;

    // Calculated fields
    private Double currentValue;
    private Double totalInvested;
    private Double profitAndLoss;
    private Double profitAndLossPercentage;

    private String broker;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
