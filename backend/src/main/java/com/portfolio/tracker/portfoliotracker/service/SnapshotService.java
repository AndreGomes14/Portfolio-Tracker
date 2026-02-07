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

/**
 * Service responsible for taking portfolio snapshots.
 * Scheduled job runs every hour for ALL users.
 * Manual trigger and queries are scoped to the authenticated user.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SnapshotService {

    private final PriceService priceService;
    private final InvestmentService investmentService;
    private final PortfolioSnapshotRepository snapshotRepository;
    private final PortfolioSnapshotMapper snapshotMapper;
    private final UserRepository userRepository;

    /**
     * Hourly scheduled job — takes snapshots for ALL users.
     * No SecurityContext available here (system job), so we iterate all users.
     */
    @Scheduled(cron = "${portfolio.snapshot.cron:0 0 * * * *}")
    @Transactional
    public void takeScheduledSnapshot() {
        log.info("Starting scheduled hourly portfolio snapshots for all users...");

        // Refresh prices globally first (shared price data)
        priceService.refreshAllPrices();

        // Take a snapshot for each user
        List<User> users = userRepository.findAll();
        for (User user : users) {
            try {
                takeSnapshotForUser(user);
            } catch (Exception e) {
                log.error("Failed to take snapshot for user {}: {}", user.getEmail(), e.getMessage());
            }
        }
    }

    /**
     * Manual snapshot trigger — scoped to the authenticated user.
     */
    @Transactional
    public void takeSnapshot() {
        User owner = getAuthenticatedUser();
        priceService.refreshPricesForUser(owner);
        takeSnapshotForUser(owner);
    }

    /**
     * Take a snapshot for a specific user. Replaces any snapshot in the current hour.
     */
    @Transactional
    public void takeSnapshotForUser(User owner) {
        try {
            PortfolioSummaryResponse summary = investmentService.calculateSummaryForUser(owner);

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime hourStart = now.truncatedTo(ChronoUnit.HOURS);
            LocalDateTime hourEnd = hourStart.plusHours(1);

            // Replace existing snapshot in the current hour for this user
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

    /**
     * Retrieve portfolio history for the last N days — scoped to authenticated user.
     */
    @Transactional(readOnly = true)
    public List<PortfolioHistoryResponse> getHistory(int days) {
        User owner = getAuthenticatedUser();
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<PortfolioSnapshot> snapshots = snapshotRepository
                .findByOwnerAndSnapshotDateAfterOrderBySnapshotDateAsc(owner, since);
        return snapshotMapper.toResponseList(snapshots);
    }

    /**
     * Retrieve portfolio history between two dates — scoped to authenticated user.
     */
    @Transactional(readOnly = true)
    public List<PortfolioHistoryResponse> getHistoryByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        User owner = getAuthenticatedUser();
        List<PortfolioSnapshot> snapshots = snapshotRepository
                .findByOwnerAndSnapshotDateBetweenOrderBySnapshotDateAsc(owner, startDate, endDate);
        return snapshotMapper.toResponseList(snapshots);
    }

    /**
     * Retrieve all portfolio history — scoped to authenticated user.
     */
    @Transactional(readOnly = true)
    public List<PortfolioHistoryResponse> getAllHistory() {
        User owner = getAuthenticatedUser();
        List<PortfolioSnapshot> snapshots = snapshotRepository.findByOwnerOrderBySnapshotDateAsc(owner);
        return snapshotMapper.toResponseList(snapshots);
    }

    // --- Private helpers ---

    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
