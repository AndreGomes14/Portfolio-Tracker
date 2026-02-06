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
import java.util.List;

/**
 * Service responsible for taking daily portfolio snapshots.
 * The scheduled job runs once daily to:
 * 1. Refresh all asset prices via PriceService.
 * 2. Calculate global portfolio totals.
 * 3. Save a PortfolioSnapshot record.
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
     * Daily scheduled job - runs at midnight every day.
     * Cron: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "${portfolio.snapshot.cron:0 0 0 * * *}")
    @Transactional
    public void takeDailySnapshot() {
        log.info("Starting daily portfolio snapshot job...");

        try {
            // Step 1: Refresh all asset prices
            priceService.refreshAllPrices();

            // Step 2: Calculate portfolio totals
            PortfolioSummaryResponse summary = investmentService.getPortfolioSummary();

            // Step 3: Save snapshot
            PortfolioSnapshot snapshot = PortfolioSnapshot.builder()
                    .snapshotDate(LocalDateTime.now())
                    .totalInvestedAmount(summary.getTotalInvestedAmount())
                    .totalCurrentValue(summary.getTotalCurrentValue())
                    .totalProfitAndLoss(summary.getTotalProfitAndLoss())
                    .build();

            snapshotRepository.save(snapshot);
            log.info("Daily snapshot saved. Invested: ${}, Value: ${}, P&L: ${}",
                    summary.getTotalInvestedAmount(),
                    summary.getTotalCurrentValue(),
                    summary.getTotalProfitAndLoss());
        } catch (Exception e) {
            log.error("Failed to take daily snapshot: {}", e.getMessage(), e);
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
}
