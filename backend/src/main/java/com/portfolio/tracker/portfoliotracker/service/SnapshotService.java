package com.portfolio.tracker.portfoliotracker.service;

import com.portfolio.tracker.portfoliotracker.dto.PortfolioHistoryResponse;
import com.portfolio.tracker.portfoliotracker.dto.PortfolioSummaryResponse;
import com.portfolio.tracker.portfoliotracker.entity.PortfolioSnapshot;
import com.portfolio.tracker.portfoliotracker.mapper.PortfolioSnapshotMapper;
import com.portfolio.tracker.portfoliotracker.repository.PortfolioSnapshotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Service responsible for taking portfolio snapshots.
 * Scheduled job runs every hour. Manual trigger replaces any snapshot in the current hour.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SnapshotService {

    private final PriceService priceService;
    private final InvestmentService investmentService;
    private final PortfolioSnapshotRepository snapshotRepository;
    private final PortfolioSnapshotMapper snapshotMapper;

    /**
     * Hourly scheduled job - runs at minute 0 of every hour while the app is running.
     * Cron: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "${portfolio.snapshot.cron:0 0 * * * *}")
    @Transactional
    public void takeScheduledSnapshot() {
        log.info("Starting scheduled hourly portfolio snapshot...");
        takeSnapshot();
    }

    /**
     * Take a snapshot now. If a snapshot already exists for the current hour, it is replaced.
     * Used by both the scheduler and the manual "Take snapshot" API.
     */
    @Transactional
    public void takeSnapshot() {
        try {
            // Step 1: Refresh all asset prices
            priceService.refreshAllPrices();

            // Step 2: Calculate portfolio totals
            PortfolioSummaryResponse summary = investmentService.getPortfolioSummary();

            // Step 3: Replace any snapshot in the current hour
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime hourStart = now.truncatedTo(ChronoUnit.HOURS);
            LocalDateTime hourEnd = hourStart.plusHours(1);
            List<PortfolioSnapshot> existingInHour = snapshotRepository
                    .findBySnapshotDateGreaterThanEqualAndSnapshotDateLessThan(hourStart, hourEnd);
            if (!existingInHour.isEmpty()) {
                snapshotRepository.deleteAll(existingInHour);
                log.debug("Replaced {} snapshot(s) in current hour", existingInHour.size());
            }

            // Step 4: Save new snapshot with all three values
            PortfolioSnapshot snapshot = PortfolioSnapshot.builder()
                    .snapshotDate(now)
                    .totalPortfolioValue(summary.getTotalPortfolioValue())
                    .totalInvestedAmount(summary.getTotalInvestedAmount())
                    .totalCurrentValue(summary.getTotalCurrentValue())
                    .totalProfitAndLoss(summary.getTotalProfitAndLoss())
                    .build();
            snapshotRepository.save(snapshot);
            log.info("Snapshot saved. Portfolio value (all): {}, Current value (excl. cash): {}, Invested: {}, P&L: {}",
                    summary.getTotalPortfolioValue(),
                    summary.getTotalCurrentValue(),
                    summary.getTotalInvestedAmount(),
                    summary.getTotalProfitAndLoss());
        } catch (Exception e) {
            log.error("Failed to take snapshot: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Retrieve portfolio history for the last N days.
     */
    @Transactional(readOnly = true)
    public List<PortfolioHistoryResponse> getHistory(int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<PortfolioSnapshot> snapshots = snapshotRepository
                .findBySnapshotDateAfterOrderBySnapshotDateAsc(since);
        return snapshotMapper.toResponseList(snapshots);
    }
    
    /**
     * Retrieve portfolio history between two dates.
     */
    @Transactional(readOnly = true)
    public List<PortfolioHistoryResponse> getHistoryByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        List<PortfolioSnapshot> snapshots = snapshotRepository
                .findBySnapshotDateBetweenOrderBySnapshotDateAsc(startDate, endDate);
        return snapshotMapper.toResponseList(snapshots);
    }
    
    /**
     * Retrieve all portfolio history.
     */
    @Transactional(readOnly = true)
    public List<PortfolioHistoryResponse> getAllHistory() {
        List<PortfolioSnapshot> snapshots = snapshotRepository.findAllByOrderBySnapshotDateAsc();
        return snapshotMapper.toResponseList(snapshots);
    }
}
