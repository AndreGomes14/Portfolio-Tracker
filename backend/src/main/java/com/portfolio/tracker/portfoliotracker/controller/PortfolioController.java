package com.portfolio.tracker.portfoliotracker.controller;

import com.portfolio.tracker.portfoliotracker.dto.InvestmentResponse;
import com.portfolio.tracker.portfoliotracker.dto.PortfolioHistoryResponse;
import com.portfolio.tracker.portfoliotracker.dto.PortfolioSummaryResponse;
import com.portfolio.tracker.portfoliotracker.service.InvestmentService;
import com.portfolio.tracker.portfoliotracker.service.SnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST Controller for Portfolio summary, history, and price refresh.
 * Strictly delegates all logic to InvestmentService and SnapshotService.
 */
@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
public class PortfolioController {

    private final InvestmentService investmentService;
    private final SnapshotService snapshotService;

    @GetMapping("/summary")
    public ResponseEntity<PortfolioSummaryResponse> getPortfolioSummary() {
        return ResponseEntity.ok(investmentService.getPortfolioSummary());
    }

    @GetMapping("/history")
    public ResponseEntity<List<PortfolioHistoryResponse>> getPortfolioHistory(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer days) {
        
        // If startDate and endDate are provided, use date range
        if (startDate != null && endDate != null) {
            LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00");
            LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59");
            return ResponseEntity.ok(snapshotService.getHistoryByDateRange(start, end));
        }
        
        // If days is provided, use days filter
        if (days != null) {
            return ResponseEntity.ok(snapshotService.getHistory(days));
        }
        
        // Otherwise return all history
        return ResponseEntity.ok(snapshotService.getAllHistory());
    }

    @PostMapping("/refresh-prices")
    public ResponseEntity<List<InvestmentResponse>> refreshPrices() {
        return ResponseEntity.ok(investmentService.refreshPrices());
    }

    @PostMapping("/snapshot")
    public ResponseEntity<Void> takeSnapshot() {
        snapshotService.takeSnapshot();
        return ResponseEntity.ok().build();
    }
}
