package com.portfolio.tracker.portfoliotracker.service;

import com.portfolio.tracker.portfoliotracker.entity.Investment;
import com.portfolio.tracker.portfoliotracker.entity.InvestmentType;
import com.portfolio.tracker.portfoliotracker.entity.User;
import com.portfolio.tracker.portfoliotracker.repository.InvestmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.*;

/**
 * Service responsible for fetching live prices from external APIs.
 * Uses CoinGecko for CRYPTO and a Yahoo Finance proxy for STOCK/ETF.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PriceService {

    private final InvestmentRepository investmentRepository;
    private final WebClient.Builder webClientBuilder;

    private static final String COINGECKO_API = "https://api.coingecko.com/api/v3";
    private static final String YAHOO_FINANCE_API = "https://query1.finance.yahoo.com/v8/finance/chart";
    private static final String EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/USD";

    // Cache for USD to EUR exchange rate (refresh every 24h in production)
    private Double usdToEurRate = null;

    /**
     * Refresh prices for all auto-updatable investments (STOCK, CRYPTO, ETF).
     * Returns the list of updated investments.
     */
    public void refreshAllPrices() {
        List<Investment> autoUpdatable = investmentRepository.findByTypeIn(
                List.of(InvestmentType.STOCK, InvestmentType.CRYPTO, InvestmentType.ETF)
        );

        if (autoUpdatable.isEmpty()) {
            log.info("No auto-updatable investments found.");
            return;
        }

        // Fetch exchange rate for USD to EUR conversion
        fetchUsdToEurRate();

        // Separate crypto from stock/etf
        List<Investment> cryptos = autoUpdatable.stream()
                .filter(i -> i.getType() == InvestmentType.CRYPTO)
                .toList();
        List<Investment> stocksAndEtfs = autoUpdatable.stream()
                .filter(i -> i.getType() != InvestmentType.CRYPTO)
                .toList();

        if (!cryptos.isEmpty()) {
            refreshCryptoPrices(cryptos);
        }
        if (!stocksAndEtfs.isEmpty()) {
            refreshStockPrices(stocksAndEtfs);
        }

        investmentRepository.saveAll(autoUpdatable);
        log.info("Refreshed prices for {} investments.", autoUpdatable.size());
    }

    /**
     * Refresh prices only for a specific user's investments (STOCK, CRYPTO, ETF).
     * Used by the manual "Refresh Prices" button scoped to the authenticated user.
     */
    public List<Investment> refreshPricesForUser(User owner) {
        List<Investment> autoUpdatable = investmentRepository.findByOwnerAndTypeIn(
                owner, List.of(InvestmentType.STOCK, InvestmentType.CRYPTO, InvestmentType.ETF)
        );

        if (autoUpdatable.isEmpty()) {
            log.info("No auto-updatable investments found for user {}.", owner.getEmail());
            return List.of();
        }

        fetchUsdToEurRate();

        List<Investment> cryptos = autoUpdatable.stream()
                .filter(i -> i.getType() == InvestmentType.CRYPTO)
                .toList();
        List<Investment> stocksAndEtfs = autoUpdatable.stream()
                .filter(i -> i.getType() != InvestmentType.CRYPTO)
                .toList();

        if (!cryptos.isEmpty()) refreshCryptoPrices(cryptos);
        if (!stocksAndEtfs.isEmpty()) refreshStockPrices(stocksAndEtfs);

        investmentRepository.saveAll(autoUpdatable);
        log.info("Refreshed prices for {} investments (user: {}).", autoUpdatable.size(), owner.getEmail());
        return autoUpdatable;
    }

    /**
     * Fetch USD to EUR exchange rate from external API.
     */
    private void fetchUsdToEurRate() {
        try {
            WebClient client = webClientBuilder.baseUrl(EXCHANGE_RATE_API).build();

            @SuppressWarnings("unchecked")
            Map<String, Object> response = client.get()
                    .uri("")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> rates = (Map<String, Object>) response.get("rates");
                if (rates != null && rates.get("EUR") != null) {
                    usdToEurRate = ((Number) rates.get("EUR")).doubleValue();
                    log.debug("Fetched USD to EUR rate: {}", usdToEurRate);
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch USD to EUR exchange rate: {}", e.getMessage());
            // Fallback to approximate rate if API fails
            if (usdToEurRate == null) {
                usdToEurRate = 0.92; // Approximate fallback
                log.warn("Using fallback USD to EUR rate: {}", usdToEurRate);
            }
        }
    }

    /**
     * Fetch crypto prices from CoinGecko in USD, then convert to EUR.
     * Ticker is expected to be the CoinGecko ID (e.g., "bitcoin", "ethereum").
     */
    private void refreshCryptoPrices(List<Investment> cryptos) {
        try {
            String ids = cryptos.stream()
                    .map(Investment::getTicker)
                    .filter(Objects::nonNull)
                    .map(String::toLowerCase)
                    .reduce((a, b) -> a + "," + b)
                    .orElse("");

            if (ids.isEmpty()) return;

            WebClient client = webClientBuilder.baseUrl(COINGECKO_API).build();

            @SuppressWarnings("unchecked")
            Map<String, Map<String, Object>> response = client.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/simple/price")
                            .queryParam("ids", ids)
                            .queryParam("vs_currencies", "usd")
                            .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null) {
                for (Investment crypto : cryptos) {
                    String tickerLower = crypto.getTicker() != null ? crypto.getTicker().toLowerCase() : "";
                    Map<String, Object> priceData = response.get(tickerLower);
                    if (priceData != null && priceData.get("usd") != null) {
                        double priceUsd = ((Number) priceData.get("usd")).doubleValue();
                        
                        // Convert USD to EUR
                        Double priceEur = priceUsd * (usdToEurRate != null ? usdToEurRate : 0.92);
                        crypto.setCurrentPrice(priceEur);
                        
                        log.debug("Updated {} price: ${} USD → €{}", crypto.getName(), priceUsd, priceEur);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch crypto prices from CoinGecko: {}", e.getMessage());
        }
    }

    /**
     * Fetch stock/ETF prices from Yahoo Finance.
     * Ticker is expected to be the market symbol (e.g., "AAPL", "SPY").
     */
    private void refreshStockPrices(List<Investment> stocks) {
        WebClient client = webClientBuilder.baseUrl(YAHOO_FINANCE_API).build();

        for (Investment stock : stocks) {
            try {
                if (stock.getTicker() == null || stock.getTicker().isBlank()) continue;

                @SuppressWarnings("unchecked")
                Map<String, Object> response = client.get()
                        .uri("/{ticker}?interval=1d&range=1d", stock.getTicker().toUpperCase())
                        .header("User-Agent", "Mozilla/5.0")
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();

                if (response != null) {
                    Double price = extractYahooPrice(response);
                    if (price != null) {
                        stock.setCurrentPrice(price);
                        log.debug("Updated {} ({}) price: {}€", stock.getName(), stock.getTicker(), price);
                    }
                }
            } catch (Exception e) {
                log.error("Failed to fetch price for {}: {}", stock.getTicker(), e.getMessage());
            }
        }
    }

    /**
     * Extract the regular market price from the Yahoo Finance API response.
     */
    @SuppressWarnings("unchecked")
    private Double extractYahooPrice(Map<String, Object> response) {
        try {
            Map<String, Object> chart = (Map<String, Object>) response.get("chart");
            if (chart == null) return null;

            List<Map<String, Object>> results = (List<Map<String, Object>>) chart.get("result");
            if (results == null || results.isEmpty()) return null;

            Map<String, Object> meta = (Map<String, Object>) results.getFirst().get("meta");
            if (meta == null) return null;

            Object price = meta.get("regularMarketPrice");
            return price != null ? ((Number) price).doubleValue() : null;
        } catch (Exception e) {
            log.error("Error parsing Yahoo Finance response: {}", e.getMessage());
            return null;
        }
    }
}
