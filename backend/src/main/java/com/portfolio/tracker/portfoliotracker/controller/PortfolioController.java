package com.portfolio.tracker.portfoliotracker.controller;

import com.portfolio.tracker.portfoliotracker.dto.InvestmentResponse;
import com.portfolio.tracker.portfoliotracker.dto.PortfolioHistoryResponse;
import com.portfolio.tracker.portfoliotracker.dto.PortfolioSummaryResponse;
import com.portfolio.tracker.portfoliotracker.service.InvestmentService;
import com.portfolio.tracker.portfoliotracker.service.SnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Portfolio summary, history, and price refresh.
 * Strictly delegates all logic to InvestmentService and SnapshotService.
 */
@RestController
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PortfolioController {

    private final InvestmentService investmentService;
    private final SnapshotService snapshotService;

    @GetMapping("/summary")
    public ResponseEntity<PortfolioSummaryResponse> getPortfolioSummary() {
        return ResponseEntity.ok(investmentService.getPortfolioSummary());
    }

    @GetMapping("/history")
    public ResponseEntity<List<PortfolioHistoryResponse>> getPortfolioHistory(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(snapshotService.getHistory(days));
    }

    @PostMapping("/refresh-prices")
    public ResponseEntity<List<InvestmentResponse>> refreshPrices() {
        return ResponseEntity.ok(investmentService.refreshPrices());
    }
}
