package com.portfolio.tracker.portfoliotracker.service;

import com.portfolio.tracker.portfoliotracker.dto.PortfolioHistoryResponse;
import com.portfolio.tracker.portfoliotracker.dto.PortfolioSummaryResponse;
import com.portfolio.tracker.portfoliotracker.entity.PortfolioSnapshot;
import com.portfolio.tracker.portfoliotracker.entity.User;
import com.portfolio.tracker.portfoliotracker.mapper.PortfolioSnapshotMapper;
import com.portfolio.tracker.portfoliotracker.repository.PortfolioSnapshotRepository;
import com.portfolio.tracker.portfoliotracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class SnapshotService {

    private final PriceService priceService;
    private final InvestmentService investmentService;
    private final PortfolioSnapshotRepository snapshotRepository;
    private final PortfolioSnapshotMapper snapshotMapper;

    @Transactional
    public void takeSnapshot() {
        User owner = getAuthenticatedUser();
        priceService.refreshPricesForUser(owner);
        takeSnapshotForUser(owner);
    }

    @Transactional
    public void takeSnapshotForUser(User owner) {
        try {
            PortfolioSummaryResponse summary = investmentService.calculateSummaryForUser(owner);

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime hourStart = now.truncatedTo(ChronoUnit.HOURS);
            LocalDateTime hourEnd = hourStart.plusHours(1);

            List<PortfolioSnapshot> existingInHour = snapshotRepository
                    .findByOwnerAndSnapshotDateGreaterThanEqualAndSnapshotDateLessThan(owner, hourStart, hourEnd);
            if (!existingInHour.isEmpty()) {
                snapshotRepository.deleteAll(existingInHour);
                log.debug("Replaced {} snapshot(s) in current hour for user {}", existingInHour.size(), owner.getEmail());
            }

            PortfolioSnapshot snapshot = PortfolioSnapshot.builder()
                    .owner(owner)
                    .snapshotDate(now)
                    .totalPortfolioValue(summary.getTotalPortfolioValue())
                    .totalInvestedAmount(summary.getTotalInvestedAmount())
                    .totalCurrentValue(summary.getTotalCurrentValue())
                    .totalProfitAndLoss(summary.getTotalProfitAndLoss())
                    .build();
            snapshotRepository.save(snapshot);

            log.info("Snapshot saved for user {}. Value: {}, Invested: {}, P&L: {}",
                    owner.getEmail(),
                    summary.getTotalPortfolioValue(),
                    summary.getTotalInvestedAmount(),
                    summary.getTotalProfitAndLoss());
        } catch (Exception e) {
            log.error("Failed to take snapshot for user {}: {}", owner.getEmail(), e.getMessage(), e);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<PortfolioHistoryResponse> getHistory(int days) {
        User owner = getAuthenticatedUser();
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<PortfolioSnapshot> snapshots = snapshotRepository
                .findByOwnerAndSnapshotDateAfterOrderBySnapshotDateAsc(owner, since);
        return snapshotMapper.toResponseList(snapshots);
    }

    @Transactional(readOnly = true)
    public List<PortfolioHistoryResponse> getHistoryByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        User owner = getAuthenticatedUser();
        List<PortfolioSnapshot> snapshots = snapshotRepository
                .findByOwnerAndSnapshotDateBetweenOrderBySnapshotDateAsc(owner, startDate, endDate);
        return snapshotMapper.toResponseList(snapshots);
    }

    @Transactional(readOnly = true)
    public List<PortfolioHistoryResponse> getAllHistory() {
        User owner = getAuthenticatedUser();
        List<PortfolioSnapshot> snapshots = snapshotRepository.findByOwnerOrderBySnapshotDateAsc(owner);
        return snapshotMapper.toResponseList(snapshots);
    }

    private User getAuthenticatedUser() {
        return (User) Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getPrincipal();
    }
}
