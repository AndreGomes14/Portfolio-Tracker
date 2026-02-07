import * as XLSX from 'xlsx';
import type { InvestmentResponse, PortfolioSummaryResponse } from '../types';

export function exportToExcel(
  investments: InvestmentResponse[],
  summary: PortfolioSummaryResponse | null
) {
  const workbook = XLSX.utils.book_new();

  // === SUMMARY SHEET ===
  if (summary) {
    const summaryData = [
      ['Portfolio Summary', '', '', ''],
      ['Generated on:', new Date().toLocaleString('de-DE')],
      [],
      ['Metric', 'Value', '', ''],
      ['Total Portfolio Value', summary.totalPortfolioValue, '€', ''],
      ['Total in Cash', summary.totalCashAmount, '€', ''],
      ['Total Invested (excl. cash)', summary.totalInvestedAmount, '€', ''],
      ['Current Value (excl. cash)', summary.totalCurrentValue, '€', ''],
      ['Profit / Loss', summary.totalProfitAndLoss, '€', summary.totalProfitAndLoss >= 0 ? '✓' : '✗'],
      ['Return %', summary.totalProfitAndLossPercentage, '%', summary.totalProfitAndLossPercentage >= 0 ? '✓' : '✗'],
      ['Total Investments', summary.investmentCount, '', ''],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Column widths
    summarySheet['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 5 },
      { wch: 5 },
    ];

    // Styling for summary
    const summaryRange = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1');
    for (let R = summaryRange.s.r; R <= summaryRange.e.r; ++R) {
      for (let C = summaryRange.s.c; C <= summaryRange.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!summarySheet[cellAddress]) continue;

        // Title row
        if (R === 0) {
          summarySheet[cellAddress].s = {
            font: { bold: true, sz: 16, color: { rgb: '1F2937' } },
            fill: { fgColor: { rgb: 'E5E7EB' } },
            alignment: { horizontal: 'left', vertical: 'center' },
          };
        }
        // Header row
        else if (R === 3) {
          summarySheet[cellAddress].s = {
            font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '3B82F6' } },
            alignment: { horizontal: 'center', vertical: 'center' },
          };
        }
        // Data rows
        else if (R > 3) {
          summarySheet[cellAddress].s = {
            alignment: { horizontal: C === 0 ? 'left' : 'right', vertical: 'center' },
            font: { sz: 10 },
          };
          // Highlight P&L rows
          if (R === 8 || R === 9) {
            const isPositive = summary.totalProfitAndLoss >= 0;
            summarySheet[cellAddress].s.fill = {
              fgColor: { rgb: isPositive ? 'D1FAE5' : 'FEE2E2' },
            };
            if (C === 1) {
              summarySheet[cellAddress].s.font = {
                ...summarySheet[cellAddress].s.font,
                bold: true,
                color: { rgb: isPositive ? '059669' : 'DC2626' },
              };
            }
          }
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }

  // === INVESTMENTS OVERVIEW (GROUPED) ===
  // Group investments by ticker+type
  const groupedMap = new Map<string, InvestmentResponse[]>();
  investments.forEach((inv) => {
    const key = inv.ticker 
      ? `${inv.ticker.toLowerCase()}-${inv.type}` 
      : `${inv.name.toLowerCase()}-${inv.type}`;
    if (!groupedMap.has(key)) {
      groupedMap.set(key, []);
    }
    groupedMap.get(key)!.push(inv);
  });

  const groupedData: any[][] = [
    [
      'Name',
      'Ticker',
      'Type',
      'Broker',
      'Total Quantity',
      'Weighted Avg Price (€)',
      'Current Price (€)',
      'Total Invested (€)',
      'Current Value (€)',
      'P&L (€)',
      'P&L (%)',
      '# of Buys',
    ],
  ];

  const groupedList: any[] = [];
  groupedMap.forEach((invList) => {
    const first = invList[0];
    const totalQuantity = invList.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalInvested = invList.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const totalCurrentValue = totalQuantity * first.currentPrice;
    const totalProfitAndLoss = totalCurrentValue - totalInvested;
    const totalProfitAndLossPercentage = totalInvested > 0 ? (totalProfitAndLoss / totalInvested) * 100 : 0;
    const weightedAvgPrice = totalInvested / totalQuantity;

    groupedList.push({
      name: first.name,
      ticker: first.ticker || '',
      type: first.type,
      broker: first.broker || '',
      totalQuantity,
      weightedAvgPrice,
      currentPrice: first.currentPrice,
      totalInvested,
      totalCurrentValue,
      totalProfitAndLoss,
      totalProfitAndLossPercentage,
      numBuys: invList.length,
    });
  });

  // Sort by P&L descending
  groupedList.sort((a, b) => b.totalProfitAndLoss - a.totalProfitAndLoss);

  groupedList.forEach((group) => {
    groupedData.push([
      group.name,
      group.ticker,
      group.type,
      group.broker,
      group.totalQuantity,
      group.weightedAvgPrice,
      group.currentPrice,
      group.totalInvested,
      group.totalCurrentValue,
      group.totalProfitAndLoss,
      group.totalProfitAndLossPercentage,
      group.numBuys,
    ]);
  });

  const groupedSheet = XLSX.utils.aoa_to_sheet(groupedData);

  // Column widths
  groupedSheet['!cols'] = [
    { wch: 25 }, // Name
    { wch: 12 }, // Ticker
    { wch: 10 }, // Type
    { wch: 18 }, // Broker
    { wch: 14 }, // Total Quantity
    { wch: 18 }, // Weighted Avg Price
    { wch: 18 }, // Current Price
    { wch: 18 }, // Total Invested
    { wch: 18 }, // Current Value
    { wch: 15 }, // P&L
    { wch: 12 }, // P&L %
    { wch: 10 }, // # of Buys
  ];

  // Styling for grouped sheet
  const groupedRange = XLSX.utils.decode_range(groupedSheet['!ref'] || 'A1');
  for (let R = groupedRange.s.r; R <= groupedRange.e.r; ++R) {
    for (let C = groupedRange.s.c; C <= groupedRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!groupedSheet[cellAddress]) continue;

      // Header row
      if (R === 0) {
        groupedSheet[cellAddress].s = {
          font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '3B82F6' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        };
      }
      // Data rows
      else {
        groupedSheet[cellAddress].s = {
          alignment: {
            horizontal: C >= 4 && C <= 10 ? 'right' : 'left',
            vertical: 'center',
          },
          font: { sz: 10 },
          border: {
            top: { style: 'thin', color: { rgb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
          },
        };

        // Alternate row colors
        if (R % 2 === 0) {
          groupedSheet[cellAddress].s.fill = { fgColor: { rgb: 'F9FAFB' } };
        }

        // Highlight P&L columns (I and J = index 9 and 10)
        if (C === 9 || C === 10) {
          const pnl = groupedList[R - 1]?.totalProfitAndLoss || 0;
          const isPositive = pnl >= 0;
          groupedSheet[cellAddress].s.fill = {
            fgColor: { rgb: isPositive ? 'D1FAE5' : 'FEE2E2' },
          };
          groupedSheet[cellAddress].s.font = {
            ...groupedSheet[cellAddress].s.font,
            bold: true,
            color: { rgb: isPositive ? '059669' : 'DC2626' },
          };
        }

        // Format numeric columns
        if (C >= 4 && C <= 11 && groupedSheet[cellAddress].v !== '') {
          groupedSheet[cellAddress].t = 'n';
          if (C === 10) {
            // P&L % - 2 decimals
            groupedSheet[cellAddress].z = '0.00';
          } else if (C === 4) {
            // Quantity - up to 8 decimals
            groupedSheet[cellAddress].z = '0.00000000';
          } else if (C === 11) {
            // # of Buys - integer
            groupedSheet[cellAddress].z = '0';
          } else {
            // Currency - 2 decimals
            groupedSheet[cellAddress].z = '#,##0.00';
          }
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, groupedSheet, 'Investments Overview');

  // === ALL TRANSACTIONS (INDIVIDUAL BUYS) ===
  const transactionsData = [
    [
      'ID',
      'Name',
      'Ticker',
      'Type',
      'Broker',
      'Quantity',
      'Avg Purchase Price (€)',
      'Current Price (€)',
      'Total Invested (€)',
      'Current Value (€)',
      'P&L (€)',
      'P&L (%)',
      'Notes',
      'Created',
      'Updated',
    ],
  ];

  // Sort by creation date (oldest first) for chronological view
  const sortedByDate = [...investments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  sortedByDate.forEach((inv) => {
    transactionsData.push([
      inv.id,
      inv.name,
      inv.ticker || '',
      inv.type,
      inv.broker || '',
      inv.quantity,
      inv.averagePurchasePrice,
      inv.currentPrice,
      inv.totalInvested,
      inv.currentValue,
      inv.profitAndLoss,
      inv.profitAndLossPercentage,
      inv.notes || '',
      new Date(inv.createdAt).toLocaleString('de-DE'),
      new Date(inv.updatedAt).toLocaleString('de-DE'),
    ]);
  });

  const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);

  // Column widths
  transactionsSheet['!cols'] = [
    { wch: 8 },  // ID
    { wch: 25 }, // Name
    { wch: 12 }, // Ticker
    { wch: 10 }, // Type
    { wch: 18 }, // Broker
    { wch: 12 }, // Quantity
    { wch: 18 }, // Avg Price
    { wch: 18 }, // Current Price
    { wch: 18 }, // Total Invested
    { wch: 18 }, // Current Value
    { wch: 15 }, // P&L
    { wch: 12 }, // P&L %
    { wch: 30 }, // Notes
    { wch: 18 }, // Created
    { wch: 18 }, // Updated
  ];

  // Styling for transactions
  const transRange = XLSX.utils.decode_range(transactionsSheet['!ref'] || 'A1');
  for (let R = transRange.s.r; R <= transRange.e.r; ++R) {
    for (let C = transRange.s.c; C <= transRange.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (!transactionsSheet[cellAddress]) continue;

      // Header row
      if (R === 0) {
        transactionsSheet[cellAddress].s = {
          font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '3B82F6' } },
          alignment: { horizontal: 'center', vertical: 'center' },
          border: {
            top: { style: 'thin', color: { rgb: '000000' } },
            bottom: { style: 'thin', color: { rgb: '000000' } },
            left: { style: 'thin', color: { rgb: '000000' } },
            right: { style: 'thin', color: { rgb: '000000' } },
          },
        };
      }
      // Data rows
      else {
        transactionsSheet[cellAddress].s = {
          alignment: {
            horizontal: C >= 5 && C <= 11 ? 'right' : 'left',
            vertical: 'center',
          },
          font: { sz: 10 },
          border: {
            top: { style: 'thin', color: { rgb: 'E5E7EB' } },
            bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
          },
        };

        // Alternate row colors
        if (R % 2 === 0) {
          transactionsSheet[cellAddress].s.fill = { fgColor: { rgb: 'F9FAFB' } };
        }

        // Highlight P&L columns (J and K = index 10 and 11)
        if (C === 10 || C === 11) {
          const pnl = sortedByDate[R - 1]?.profitAndLoss || 0;
          const isPositive = pnl >= 0;
          transactionsSheet[cellAddress].s.fill = {
            fgColor: { rgb: isPositive ? 'D1FAE5' : 'FEE2E2' },
          };
          transactionsSheet[cellAddress].s.font = {
            ...transactionsSheet[cellAddress].s.font,
            bold: true,
            color: { rgb: isPositive ? '059669' : 'DC2626' },
          };
        }

        // Format numeric columns
        if (C >= 5 && C <= 11 && transactionsSheet[cellAddress].v !== '') {
          transactionsSheet[cellAddress].t = 'n';
          if (C === 11) {
            // P&L % - 2 decimals
            transactionsSheet[cellAddress].z = '0.00';
          } else if (C === 5) {
            // Quantity - up to 8 decimals
            transactionsSheet[cellAddress].z = '0.00000000';
          } else {
            // Currency - 2 decimals
            transactionsSheet[cellAddress].z = '#,##0.00';
          }
        }
      }
    }
  }

  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'All Transactions');

  // === EXPORT ===
  const fileName = `portfolio-tracker-${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
