import { useState } from 'react';
import type { InvestmentResponse } from '../types';

interface Props {
  investments: InvestmentResponse[];
  loading: boolean;
  onDelete: (id: number) => void;
  onEdit: (investment: InvestmentResponse) => void;
}

interface GroupedInvestment {
  groupKey: string;
  name: string;
  ticker: string | null;
  type: string;
  investments: InvestmentResponse[];
  // Aggregated values
  totalQuantity: number;
  weightedAvgPrice: number;
  currentPrice: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitAndLoss: number;
  totalProfitAndLossPercentage: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const typeBadgeColors: Record<string, string> = {
  STOCK: 'bg-blue-100 text-blue-700',
  CRYPTO: 'bg-purple-100 text-purple-700',
  ETF: 'bg-indigo-100 text-indigo-700',
  CASH: 'bg-green-100 text-green-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

function groupInvestments(investments: InvestmentResponse[]): GroupedInvestment[] {
  const groups = new Map<string, InvestmentResponse[]>();

  // Group by ticker+type OR name+type if no ticker
  investments.forEach((inv) => {
    const key = inv.ticker 
      ? `${inv.ticker.toLowerCase()}-${inv.type}` 
      : `${inv.name.toLowerCase()}-${inv.type}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(inv);
  });

  // Calculate aggregates for each group
  const result: GroupedInvestment[] = [];

  groups.forEach((invList, groupKey) => {
    // Sort by creation date (oldest first)
    invList.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const first = invList[0];
    const totalQuantity = invList.reduce((sum, inv) => sum + inv.quantity, 0);
    const totalInvested = invList.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const totalCurrentValue = totalQuantity * first.currentPrice;
    const totalProfitAndLoss = totalCurrentValue - totalInvested;
    const totalProfitAndLossPercentage = totalInvested > 0 ? (totalProfitAndLoss / totalInvested) * 100 : 0;
    const weightedAvgPrice = totalInvested / totalQuantity;

    result.push({
      groupKey,
      name: first.name,
      ticker: first.ticker,
      type: first.type,
      investments: invList,
      totalQuantity,
      weightedAvgPrice,
      currentPrice: first.currentPrice,
      totalInvested,
      totalCurrentValue,
      totalProfitAndLoss,
      totalProfitAndLossPercentage,
    });
  });

  return result;
}

export default function InvestmentTable({ investments, loading, onDelete, onEdit }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <div className="text-gray-400 text-5xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No investments yet</h3>
        <p className="text-gray-500">Add your first investment to start tracking your portfolio.</p>
      </div>
    );
  }

  const groupedInvestments = groupInvestments(investments);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8"></th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ticker</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Broker</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Price</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Price</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Value</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">P&L</th>
              <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groupedInvestments.map((group) => {
              const isExpanded = expandedGroups.has(group.groupKey);
              const pnlColor = group.totalProfitAndLoss >= 0 ? 'text-emerald-600' : 'text-red-600';
              const pnlBg = group.totalProfitAndLoss >= 0 ? 'bg-emerald-50' : 'bg-red-50';
              const hasMultipleBuys = group.investments.length > 1;

              return (
                <>
                  {/* Aggregated Row */}
                  <tr
                    key={group.groupKey}
                    className={`hover:bg-gray-50 transition-colors ${hasMultipleBuys ? 'cursor-pointer' : ''} ${isExpanded ? 'bg-blue-50' : ''}`}
                    onClick={hasMultipleBuys ? () => toggleGroup(group.groupKey) : undefined}
                  >
                    <td className="px-6 py-4">
                      {hasMultipleBuys && (
                        <span className="text-gray-400 text-lg">
                          {isExpanded ? '▼' : '▶'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{group.name}</div>
                      {hasMultipleBuys && (
                        <div className="text-xs text-gray-400 mt-0.5">{group.investments.length} buys</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600">{group.ticker || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeBadgeColors[group.type] || typeBadgeColors.OTHER}`}>
                        {group.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{group.investments[0]?.broker || '—'}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-semibold">{group.totalQuantity}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm">{formatCurrency(group.weightedAvgPrice)}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm">{formatCurrency(group.currentPrice)}</td>
                    <td className="px-6 py-4 text-right font-mono text-sm font-semibold">{formatCurrency(group.totalCurrentValue)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className={`inline-flex flex-col items-end px-2 py-1 rounded-md ${pnlBg}`}>
                        <span className={`font-mono text-sm font-semibold ${pnlColor}`}>
                          {group.totalProfitAndLoss >= 0 ? '+' : ''}{formatCurrency(group.totalProfitAndLoss)}
                        </span>
                        <span className={`font-mono text-xs ${pnlColor}`}>
                          {group.totalProfitAndLossPercentage >= 0 ? '+' : ''}{group.totalProfitAndLossPercentage.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {/* Show Edit/Delete if only one buy, otherwise only on expanded rows */}
                      {!hasMultipleBuys && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(group.investments[0]);
                            }}
                            className="text-blue-500 hover:text-blue-700 transition-colors text-sm font-medium cursor-pointer"
                            title="Edit investment"
                          >
                            Edit
                          </button>
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(group.investments[0].id);
                            }}
                            className="text-red-400 hover:text-red-600 transition-colors text-sm font-medium cursor-pointer"
                            title="Delete investment"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Expanded Individual Rows */}
                  {isExpanded && group.investments.map((inv, idx) => {
                    const invPnlColor = inv.profitAndLoss >= 0 ? 'text-emerald-600' : 'text-red-600';
                    const invPnlBg = inv.profitAndLoss >= 0 ? 'bg-emerald-50' : 'bg-red-50';

                    return (
                      <tr key={inv.id} className="bg-gray-50/50 hover:bg-gray-100 transition-colors">
                        <td className="px-6 py-3"></td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span className="text-gray-400">↳</span>
                            <span>Buy #{idx + 1}</span>
                            <span className="text-xs text-gray-400">({formatDate(inv.createdAt)})</span>
                          </div>
                          {inv.notes && (
                            <div className="text-xs text-gray-400 ml-6 mt-0.5 truncate max-w-[200px]">{inv.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className="font-mono text-xs text-gray-500">{inv.ticker || '—'}</span>
                        </td>
                        <td className="px-6 py-3">
                          <span className="text-xs text-gray-500">{inv.type}</span>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-600">{inv.broker || '—'}</td>
                        <td className="px-6 py-3 text-right font-mono text-sm">{inv.quantity}</td>
                        <td className="px-6 py-3 text-right font-mono text-sm">{formatCurrency(inv.averagePurchasePrice)}</td>
                        <td className="px-6 py-3 text-right font-mono text-sm">{formatCurrency(inv.currentPrice)}</td>
                        <td className="px-6 py-3 text-right font-mono text-sm">{formatCurrency(inv.currentValue)}</td>
                        <td className="px-6 py-3 text-right">
                          <div className={`inline-flex flex-col items-end px-2 py-1 rounded-md ${invPnlBg}`}>
                            <span className={`font-mono text-xs font-medium ${invPnlColor}`}>
                              {inv.profitAndLoss >= 0 ? '+' : ''}{formatCurrency(inv.profitAndLoss)}
                            </span>
                            <span className={`font-mono text-xs ${invPnlColor}`}>
                              {inv.profitAndLossPercentage >= 0 ? '+' : ''}{inv.profitAndLossPercentage.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(inv);
                              }}
                              className="text-blue-500 hover:text-blue-700 transition-colors text-xs font-medium cursor-pointer"
                              title="Edit investment"
                            >
                              Edit
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(inv.id);
                              }}
                              className="text-red-400 hover:text-red-600 transition-colors text-xs font-medium cursor-pointer"
                              title="Delete investment"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <span className="font-medium">Tip:</span> Rows with multiple buys can be expanded to see individual purchases. Edit/Delete available on all investments.
      </div>
    </div>
  );
}
