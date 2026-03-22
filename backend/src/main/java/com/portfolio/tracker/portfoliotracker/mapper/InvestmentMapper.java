package com.portfolio.tracker.portfoliotracker.mapper;

import com.portfolio.tracker.portfoliotracker.dto.InvestmentRequest;
import com.portfolio.tracker.portfoliotracker.dto.InvestmentResponse;
import com.portfolio.tracker.portfoliotracker.entity.Investment;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring")
public interface InvestmentMapper {
    @Mapping(target = "currentValue", expression = "java(calculateCurrentValue(investment))")
    @Mapping(target = "totalInvested", expression = "java(calculateTotalInvested(investment))")
    @Mapping(target = "profitAndLoss", expression = "java(calculateProfitAndLoss(investment))")
    @Mapping(target = "profitAndLossPercentage", expression = "java(calculateProfitAndLossPercentage(investment))")
    InvestmentResponse toResponse(Investment investment);

    List<InvestmentResponse> toResponseList(List<Investment> investments);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Investment toEntity(InvestmentRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "owner", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(InvestmentRequest request, @MappingTarget Investment investment);

    default Double calculateCurrentValue(Investment investment) {
        if (investment.getQuantity() == null || investment.getCurrentPrice() == null) return 0.0;
        return investment.getQuantity() * investment.getCurrentPrice();
    }

    default Double calculateTotalInvested(Investment investment) {
        if (investment.getQuantity() == null || investment.getAveragePurchasePrice() == null) return 0.0;
        return investment.getQuantity() * investment.getAveragePurchasePrice();
    }

    default Double calculateProfitAndLoss(Investment investment) {
        return calculateCurrentValue(investment) - calculateTotalInvested(investment);
    }

    default Double calculateProfitAndLossPercentage(Investment investment) {
        Double totalInvested = calculateTotalInvested(investment);
        if (totalInvested == 0.0) return 0.0;
        return (calculateProfitAndLoss(investment) / totalInvested) * 100;
    }
}
