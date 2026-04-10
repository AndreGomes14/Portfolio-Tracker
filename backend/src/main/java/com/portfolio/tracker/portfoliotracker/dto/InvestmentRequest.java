package com.portfolio.tracker.portfoliotracker.dto;

import com.portfolio.tracker.portfoliotracker.entity.InvestmentType;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvestmentRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 1, max = 100)
    private String name;

    @Size(max = 20)
    private String ticker;

    @NotNull(message = "Investment type is required")
    private InvestmentType type;

    @NotNull(message = "Quantity is required")
    @Min(value = 0, message = "Quantity must be >= 0")
    private Double quantity;

    @NotNull(message = "Average purchase price is required")
    @Min(value = 0, message = "Average purchase price must be >= 0")
    private Double averagePurchasePrice;

    @Min(value = 0, message = "Current price must be >= 0")
    private Double currentPrice;

    @Size(max = 80)
    private String broker;

    @Size(max = 500)
    private String notes;
}
