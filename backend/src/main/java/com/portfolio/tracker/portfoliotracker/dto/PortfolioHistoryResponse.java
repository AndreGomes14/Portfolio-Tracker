package com.portfolio.tracker.portfoliotracker.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioHistoryResponse {

    private Long id;
    private LocalDateTime snapshotDate;
    private Double totalInvestedAmount;
    private Double totalCurrentValue;
    private Double totalProfitAndLoss;
}
