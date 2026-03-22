package com.portfolio.tracker.portfoliotracker.repository;

import com.portfolio.tracker.portfoliotracker.entity.PortfolioSnapshot;
import com.portfolio.tracker.portfoliotracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot, Long> {
    List<PortfolioSnapshot> findByOwnerAndSnapshotDateAfterOrderBySnapshotDateAsc(User owner, LocalDateTime date);

    List<PortfolioSnapshot> findByOwnerAndSnapshotDateBetweenOrderBySnapshotDateAsc(
            User owner, LocalDateTime startDate, LocalDateTime endDate);

    List<PortfolioSnapshot> findByOwnerOrderBySnapshotDateAsc(User owner);

    List<PortfolioSnapshot> findByOwnerAndSnapshotDateGreaterThanEqualAndSnapshotDateLessThan(
            User owner, LocalDateTime startInclusive, LocalDateTime endExclusive);

}
