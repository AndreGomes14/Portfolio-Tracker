package com.portfolio.tracker.portfoliotracker.repository;

import com.portfolio.tracker.portfoliotracker.entity.Investment;
import com.portfolio.tracker.portfoliotracker.entity.InvestmentType;
import com.portfolio.tracker.portfoliotracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InvestmentRepository extends JpaRepository<Investment, Long> {

    // --- Ownership-scoped queries ---

    List<Investment> findAllByOwner(User owner);

    List<Investment> findByOwnerAndTypeIn(User owner, List<InvestmentType> types);

    // --- Legacy (kept for scheduled jobs that refresh ALL prices across users) ---

    List<Investment> findByTypeIn(List<InvestmentType> types);
}
