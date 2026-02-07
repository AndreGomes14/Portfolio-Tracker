package com.portfolio.tracker.portfoliotracker.service;

import com.portfolio.tracker.portfoliotracker.dto.*;
import com.portfolio.tracker.portfoliotracker.entity.Investment;
import com.portfolio.tracker.portfoliotracker.entity.InvestmentType;
import com.portfolio.tracker.portfoliotracker.entity.User;
import com.portfolio.tracker.portfoliotracker.exception.ResourceNotFoundException;
import com.portfolio.tracker.portfoliotracker.exception.ResourceOwnershipException;
import com.portfolio.tracker.portfoliotracker.mapper.InvestmentMapper;
import com.portfolio.tracker.portfoliotracker.repository.InvestmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Business logic for Investment CRUD.
 * Every operation is scoped to the authenticated user ("Strict Resource Ownership").
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final InvestmentMapper investmentMapper;
    private final PriceService priceService;

    /**
     * Retrieve all investments owned by the authenticated user.
     */
    @Transactional(readOnly = true)
    public List<InvestmentResponse> getAllInvestments() {
        User owner = getAuthenticatedUser();
        List<Investment> investments = investmentRepository.findAllByOwner(owner);
        return investmentMapper.toResponseList(investments);
    }

    /**
     * Get a single investment by ID — verifies ownership.
     */
    @Transactional(readOnly = true)
    public InvestmentResponse getInvestmentById(Long id) {
        Investment investment = findOwnedInvestmentOrThrow(id);
        return investmentMapper.toResponse(investment);
    }

    /**
     * Create a new investment owned by the authenticated user.
     * For CASH/OTHER types, currentPrice defaults to averagePurchasePrice if not provided.
     */
    @Transactional
    public InvestmentResponse createInvestment(InvestmentRequest request) {
        User owner = getAuthenticatedUser();
        Investment investment = investmentMapper.toEntity(request);
        investment.setOwner(owner);

        // Default currentPrice for manual types
        if (investment.getCurrentPrice() == null || investment.getCurrentPrice() == 0.0) {
            investment.setCurrentPrice(investment.getAveragePurchasePrice());
        }

        Investment saved = investmentRepository.save(investment);
        log.info("Created investment: {} ({}) for user {}", saved.getName(), saved.getType(), owner.getEmail());
        return investmentMapper.toResponse(saved);
    }

    /**
     * Update an existing investment — verifies ownership.
     */
    @Transactional
    public InvestmentResponse updateInvestment(Long id, InvestmentRequest request) {
        Investment existing = findOwnedInvestmentOrThrow(id);
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
     * Delete an investment by ID — verifies ownership.
     */
    @Transactional
    public void deleteInvestment(Long id) {
        Investment investment = findOwnedInvestmentOrThrow(id);
        investmentRepository.delete(investment);
        log.info("Deleted investment: {} (id={})", investment.getName(), id);
    }

    /**
     * Manually trigger price refresh for the authenticated user's investments.
     */
    @Transactional
    public List<InvestmentResponse> refreshPrices() {
        User owner = getAuthenticatedUser();
        priceService.refreshPricesForUser(owner);
        return getAllInvestments();
    }

    /**
     * Calculate the portfolio summary from the authenticated user's investments.
     * Total portfolio value = all investments. Total invested and return % exclude CASH and OTHER.
     */
    @Transactional(readOnly = true)
    public PortfolioSummaryResponse getPortfolioSummary() {
        User owner = getAuthenticatedUser();
        return calculateSummaryForUser(owner);
    }

    /**
     * Calculate summary for a specific user — used by SnapshotService during scheduled jobs.
     */
    @Transactional(readOnly = true)
    public PortfolioSummaryResponse calculateSummaryForUser(User owner) {
        List<Investment> investments = investmentRepository.findAllByOwner(owner);

        double totalPortfolioValue = 0.0;
        double totalCash = 0.0;
        double totalInvested = 0.0;
        double totalCurrentValue = 0.0;

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

    /**
     * Find an investment by ID scoped to the authenticated user.
     * Throws 404 if not found, 403 if found but not owned.
     */
    private Investment findOwnedInvestmentOrThrow(Long id) {
        User owner = getAuthenticatedUser();
        Investment investment = investmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investment", id));

        if (!investment.getOwner().getId().equals(owner.getId())) {
            throw new ResourceOwnershipException("Investment", id, owner.getId());
        }
        return investment;
    }

    /**
     * Extract the authenticated User from the SecurityContext.
     */
    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
