package com.portfolio.tracker.portfoliotracker.repository;

import com.portfolio.tracker.portfoliotracker.entity.PortfolioSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot, Long> {

    List<PortfolioSnapshot> findBySnapshotDateAfterOrderBySnapshotDateAsc(LocalDateTime date);
    
    List<PortfolioSnapshot> findBySnapshotDateBetweenOrderBySnapshotDateAsc(LocalDateTime startDate, LocalDateTime endDate);
    
    List<PortfolioSnapshot> findAllByOrderBySnapshotDateAsc();
    
    /** Snapshots within the same hour (startInclusive <= snapshot_date < endExclusive) */
    List<PortfolioSnapshot> findBySnapshotDateGreaterThanEqualAndSnapshotDateLessThan(
            LocalDateTime startInclusive, LocalDateTime endExclusive);
}
