package com.portfolio.tracker.portfoliotracker.service;

import com.portfolio.tracker.portfoliotracker.dto.*;
import com.portfolio.tracker.portfoliotracker.entity.Investment;
import com.portfolio.tracker.portfoliotracker.entity.InvestmentType;
import com.portfolio.tracker.portfoliotracker.exception.ResourceNotFoundException;
import com.portfolio.tracker.portfoliotracker.mapper.InvestmentMapper;
import com.portfolio.tracker.portfoliotracker.repository.InvestmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final InvestmentMapper investmentMapper;
    private final PriceService priceService;

    /**
     * Retrieve all investments as DTOs.
     */
    @Transactional(readOnly = true)
    public List<InvestmentResponse> getAllInvestments() {
        List<Investment> investments = investmentRepository.findAll();
        return investmentMapper.toResponseList(investments);
    }

    /**
     * Get a single investment by ID.
     */
    @Transactional(readOnly = true)
    public InvestmentResponse getInvestmentById(Long id) {
        Investment investment = findInvestmentOrThrow(id);
        return investmentMapper.toResponse(investment);
    }

    /**
     * Create a new investment.
     * For CASH/OTHER types, currentPrice defaults to averagePurchasePrice if not provided.
     */
    @Transactional
    public InvestmentResponse createInvestment(InvestmentRequest request) {
        Investment investment = investmentMapper.toEntity(request);

        // Default currentPrice for manual types
        if (investment.getCurrentPrice() == null || investment.getCurrentPrice() == 0.0) {
            investment.setCurrentPrice(investment.getAveragePurchasePrice());
        }

        Investment saved = investmentRepository.save(investment);
        log.info("Created investment: {} ({})", saved.getName(), saved.getType());
        return investmentMapper.toResponse(saved);
    }

    /**
     * Update an existing investment.
     */
    @Transactional
    public InvestmentResponse updateInvestment(Long id, InvestmentRequest request) {
        Investment existing = findInvestmentOrThrow(id);
        investmentMapper.updateEntityFromRequest(request, existing);

        // Default currentPrice for manual types if not set
        if (existing.getCurrentPrice() == null || existing.getCurrentPrice() == 0.0) {
            existing.setCurrentPrice(existing.getAveragePurchasePrice());
        }

        Investment saved = investmentRepository.save(existing);
        log.info("Updated investment: {} (id={})", saved.getName(), saved.getId());
        return investmentMapper.toResponse(saved);
    }

    /**
     * Delete an investment by ID.
     */
    @Transactional
    public void deleteInvestment(Long id) {
        Investment investment = findInvestmentOrThrow(id);
        investmentRepository.delete(investment);
        log.info("Deleted investment: {} (id={})", investment.getName(), id);
    }

    /**
     * Manually trigger price refresh and return updated list.
     */
    @Transactional
    public List<InvestmentResponse> refreshPrices() {
        priceService.refreshAllPrices();
        return getAllInvestments();
    }

    /**
     * Calculate the portfolio summary from all investments.
     * Total portfolio value = all investments. Total invested and return % exclude CASH and OTHER.
     */
    @Transactional(readOnly = true)
    public PortfolioSummaryResponse getPortfolioSummary() {
        List<Investment> investments = investmentRepository.findAll();

        double totalPortfolioValue = 0.0;
        double totalCash = 0.0;
        double totalInvested = 0.0;   // STOCK, CRYPTO, ETF only
        double totalCurrentValue = 0.0; // STOCK, CRYPTO, ETF only (for return %)

        for (Investment inv : investments) {
            double currentVal = inv.getQuantity() * inv.getCurrentPrice();
            totalPortfolioValue += currentVal;

            if (inv.getType() == InvestmentType.CASH) {
                totalCash += currentVal;
            } else if (inv.getType() != InvestmentType.OTHER) {
                double invested = inv.getQuantity() * inv.getAveragePurchasePrice();
                totalInvested += invested;
                totalCurrentValue += currentVal;
            }
        }

        double totalPnL = totalCurrentValue - totalInvested;
        double totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0.0;

        return PortfolioSummaryResponse.builder()
                .totalPortfolioValue(Math.round(totalPortfolioValue * 100.0) / 100.0)
                .totalCashAmount(Math.round(totalCash * 100.0) / 100.0)
                .totalInvestedAmount(Math.round(totalInvested * 100.0) / 100.0)
                .totalCurrentValue(Math.round(totalCurrentValue * 100.0) / 100.0)
                .totalProfitAndLoss(Math.round(totalPnL * 100.0) / 100.0)
                .totalProfitAndLossPercentage(Math.round(totalPnLPercentage * 100.0) / 100.0)
                .investmentCount(investments.size())
                .build();
    }

    // --- Private helpers ---

    private Investment findInvestmentOrThrow(Long id) {
        return investmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investment", id));
    }
}
