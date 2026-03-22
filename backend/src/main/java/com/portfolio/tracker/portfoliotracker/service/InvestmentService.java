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
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvestmentService {

    private final InvestmentRepository investmentRepository;
    private final InvestmentMapper investmentMapper;
    private final PriceService priceService;

    @Transactional(readOnly = true)
    public List<InvestmentResponse> getAllInvestments() {
        User owner = getAuthenticatedUser();
        List<Investment> investments = investmentRepository.findAllByOwner(owner);
        return investmentMapper.toResponseList(investments);
    }

    @Transactional(readOnly = true)
    public InvestmentResponse getInvestmentById(Long id) {
        Investment investment = findOwnedInvestmentOrThrow(id);
        return investmentMapper.toResponse(investment);
    }

    @Transactional
    public InvestmentResponse createInvestment(InvestmentRequest request) {
        User owner = getAuthenticatedUser();
        Investment investment = investmentMapper.toEntity(request);
        investment.setOwner(owner);

        if (investment.getCurrentPrice() == null || investment.getCurrentPrice() == 0.0) {
            investment.setCurrentPrice(investment.getAveragePurchasePrice());
        }

        Investment saved = investmentRepository.save(investment);
        log.info("Created investment: {} ({}) for user {}", saved.getName(), saved.getType(), owner.getEmail());
        return investmentMapper.toResponse(saved);
    }

    @Transactional
    public InvestmentResponse updateInvestment(Long id, InvestmentRequest request) {
        Investment existing = findOwnedInvestmentOrThrow(id);
        investmentMapper.updateEntityFromRequest(request, existing);

        if (existing.getCurrentPrice() == null || existing.getCurrentPrice() == 0.0) {
            existing.setCurrentPrice(existing.getAveragePurchasePrice());
        }

        Investment saved = investmentRepository.save(existing);
        log.info("Updated investment: {} (id={})", saved.getName(), saved.getId());
        return investmentMapper.toResponse(saved);
    }

    @Transactional
    public void deleteInvestment(Long id) {
        Investment investment = findOwnedInvestmentOrThrow(id);
        investmentRepository.delete(investment);
        log.info("Deleted investment: {} (id={})", investment.getName(), id);
    }

    @Transactional
    public List<InvestmentResponse> refreshPrices() {
        User owner = getAuthenticatedUser();
        priceService.refreshPricesForUser(owner);
        return getAllInvestments();
    }

    @Transactional(readOnly = true)
    public PortfolioSummaryResponse getPortfolioSummary() {
        User owner = getAuthenticatedUser();
        return calculateSummaryForUser(owner);
    }

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

    private Investment findOwnedInvestmentOrThrow(Long id) {
        User owner = getAuthenticatedUser();
        Investment investment = investmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Investment", id));

        if (!investment.getOwner().getId().equals(owner.getId())) {
            throw new ResourceOwnershipException("Investment", id, owner.getId());
        }
        return investment;
    }

    private User getAuthenticatedUser() {
        return (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
    }
}
