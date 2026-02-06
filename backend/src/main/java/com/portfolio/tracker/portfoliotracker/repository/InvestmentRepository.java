package com.portfolio.tracker.portfoliotracker.repository;

import com.portfolio.tracker.portfoliotracker.entity.Investment;
import com.portfolio.tracker.portfoliotracker.entity.InvestmentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {

    List<Investment> findByTypeIn(List<InvestmentType> types);
}
