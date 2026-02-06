package com.portfolio.tracker.portfoliotracker.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioSummaryResponse {

    private Double totalPortfolioValue;
    private Double totalCashAmount;
    private Double totalInvestedAmount;
    private Double totalCurrentValue;
    private Double totalProfitAndLoss;
    private Double totalProfitAndLossPercentage;
    private Integer investmentCount;
}
