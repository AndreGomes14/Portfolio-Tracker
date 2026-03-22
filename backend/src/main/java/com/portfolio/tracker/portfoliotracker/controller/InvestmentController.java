package com.portfolio.tracker.portfoliotracker.controller;

import com.portfolio.tracker.portfoliotracker.dto.InvestmentRequest;
import com.portfolio.tracker.portfoliotracker.dto.InvestmentResponse;
import com.portfolio.tracker.portfoliotracker.service.InvestmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investments")
@RequiredArgsConstructor
public class InvestmentController {

    private final InvestmentService investmentService;

    @GetMapping
    public ResponseEntity<List<InvestmentResponse>> getAllInvestments() {
        return ResponseEntity.ok(investmentService.getAllInvestments());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvestmentResponse> getInvestmentById(@PathVariable Long id) {
        return ResponseEntity.ok(investmentService.getInvestmentById(id));
    }

    @PostMapping
    public ResponseEntity<InvestmentResponse> createInvestment(@Valid @RequestBody InvestmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(investmentService.createInvestment(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<InvestmentResponse> updateInvestment(
            @PathVariable Long id,
            @Valid @RequestBody InvestmentRequest request) {
        return ResponseEntity.ok(investmentService.updateInvestment(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvestment(@PathVariable Long id) {
        investmentService.deleteInvestment(id);
        return ResponseEntity.noContent().build();
    }
}
