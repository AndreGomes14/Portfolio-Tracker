import type { PortfolioSummaryResponse } from '../types';

interface Props {
  summary: PortfolioSummaryResponse | null;
  loading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function SummaryCards({ summary, loading }: Props) {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-32" />
          </div>
        ))}
      </div>
    );
  }

  const pnlColor = summary.totalProfitAndLoss >= 0 ? 'text-emerald-600' : 'text-red-600';
  const pnlBg = summary.totalProfitAndLoss >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';

  const cards = [
    {
      label: 'Total portfolio value',
      value: formatCurrency(summary.totalPortfolioValue),
      className: 'bg-white border-gray-200',
      valueColor: 'text-gray-900',
      extra: 'All investments (incl. cash)',
    },
    {
      label: 'Total in cash',
      value: formatCurrency(summary.totalCashAmount),
      className: 'bg-white border-gray-200',
      valueColor: 'text-gray-900',
      extra: 'CASH type only',
    },
    {
      label: 'Total invested',
      value: formatCurrency(summary.totalInvestedAmount),
      className: 'bg-white border-gray-200',
      valueColor: 'text-gray-900',
      extra: 'Stocks, crypto, ETF only',
    },
    {
      label: 'Profit / Loss',
      value: formatCurrency(summary.totalProfitAndLoss),
      className: pnlBg,
      valueColor: pnlColor,
      extra: 'On invested (excl. cash)',
    },
    {
      label: 'Return',
      value: `${summary.totalProfitAndLossPercentage >= 0 ? '+' : ''}${summary.totalProfitAndLossPercentage.toFixed(2)}%`,
      className: pnlBg,
      valueColor: pnlColor,
      extra: `${summary.investmentCount} investment${summary.investmentCount !== 1 ? 's' : ''}`,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl shadow-sm border p-6 transition-all hover:shadow-md ${card.className}`}
        >
          <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
          <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
          {card.extra && (
            <p className="text-xs text-gray-400 mt-1">{card.extra}</p>
          )}
        </div>
      ))}
    </div>
  );
}
