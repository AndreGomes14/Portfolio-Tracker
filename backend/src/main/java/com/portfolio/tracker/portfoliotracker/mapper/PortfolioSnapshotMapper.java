package com.portfolio.tracker.portfoliotracker.mapper;

import com.portfolio.tracker.portfoliotracker.dto.PortfolioHistoryResponse;
import com.portfolio.tracker.portfoliotracker.entity.PortfolioSnapshot;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PortfolioSnapshotMapper {

    PortfolioHistoryResponse toResponse(PortfolioSnapshot snapshot);

    List<PortfolioHistoryResponse> toResponseList(List<PortfolioSnapshot> snapshots);
}
