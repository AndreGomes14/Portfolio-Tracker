import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { InvestmentResponse, InvestmentType } from '../types';

interface Props {
  investments: InvestmentResponse[];
  loading: boolean;
}

interface AllocationData {
  type: InvestmentType;
  value: number;
  percentage: number;
  count: number;
}

// Static colors for each investment type
const TYPE_COLORS: Record<InvestmentType, string> = {
  STOCK: '#3B82F6',    // Blue
  CRYPTO: '#F59E0B',   // Orange
  ETF: '#6366F1',      // Indigo
  CASH: '#10B981',     // Green
  OTHER: '#6B7280',    // Gray
};

const TYPE_LABELS: Record<InvestmentType, string> = {
  STOCK: 'Stocks',
  CRYPTO: 'Crypto',
  ETF: 'ETFs',
  CASH: 'Cash',
  OTHER: 'Other',
};

/**
 * Helper function to aggregate investments by type.
 * Groups by type, sums currentValue, and calculates percentages.
 */
function aggregateByType(investments: InvestmentResponse[]): AllocationData[] {
  const typeMap = new Map<InvestmentType, { value: number; count: number }>();

  // Group and sum by type
  investments.forEach((inv) => {
    const existing = typeMap.get(inv.type);
    if (existing) {
      existing.value += inv.currentValue;
      existing.count += 1;
    } else {
      typeMap.set(inv.type, { value: inv.currentValue, count: 1 });
    }
  });

  // Calculate total portfolio value
  const totalValue = Array.from(typeMap.values()).reduce((sum, item) => sum + item.value, 0);

  // Build result with percentages
  const result: AllocationData[] = [];
  typeMap.forEach((data, type) => {
    result.push({
      type,
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      count: data.count,
    });
  });

  // Sort by value descending
  result.sort((a, b) => b.value - a.value);

  return result;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function AllocationDonutChart({ investments, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (investments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h2>
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-sm text-gray-500">No data to display</p>
        </div>
      </div>
    );
  }

  const allocationData = aggregateByType(investments);

  // Custom label for the donut chart
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(1)}%`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Portfolio Allocation</h2>
        <p className="text-sm text-gray-500 mt-0.5">Distribution by asset type</p>
      </div>

      {/* Donut Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={allocationData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
          >
            {allocationData.map((entry) => (
              <Cell key={entry.type} fill={TYPE_COLORS[entry.type]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              padding: '12px',
            }}
            formatter={(value: number, name: string, props: any) => {
              const data = props.payload as AllocationData;
              return [
                <div key="tooltip" className="space-y-1">
                  <div className="font-semibold">{TYPE_LABELS[data.type]}</div>
                  <div className="text-sm">{formatCurrency(data.value)}</div>
                  <div className="text-xs text-gray-500">
                    {data.percentage.toFixed(2)}% • {data.count} asset{data.count !== 1 ? 's' : ''}
                  </div>
                </div>,
                '',
              ];
            }}
            labelFormatter={() => ''}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value: string, entry: any) => {
              const data = entry.payload as AllocationData;
              return `${TYPE_LABELS[data.type]} (${data.percentage.toFixed(1)}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Detailed Breakdown Table */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="space-y-2">
          {allocationData.map((item) => (
            <div key={item.type} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: TYPE_COLORS[item.type] }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {TYPE_LABELS[item.type]}
                </span>
                <span className="text-xs text-gray-400">
                  ({item.count} asset{item.count !== 1 ? 's' : ''})
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.value)}
                </span>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
