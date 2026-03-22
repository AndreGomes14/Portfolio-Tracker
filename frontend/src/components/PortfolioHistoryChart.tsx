import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { investmentApi } from '../api/investmentApi';

interface HistoryDataPoint {
  snapshotDate: string;
  totalPortfolioValue: number;
  totalCurrentValue: number;
  totalInvestedAmount: number;
  totalProfitAndLoss: number;
}

type TimeRange = '1W' | '1M' | 'YTD' | '1Y' | 'ALL';

export default function PortfolioHistoryChart() {
  const [data, setData] = useState<HistoryDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1M');
  const [error, setError] = useState<string | null>(null);
  const [snapshotting, setSnapshotting] = useState(false);

  const fetchHistory = async (range: TimeRange) => {
    setLoading(true);
    setError(null);

    try {
      let params = '';
      const now = new Date();

      if (range === '1W') {
        params = 'days=7';
      } else if (range === '1M') {
        params = 'days=30';
      } else if (range === 'YTD') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const startDate = startOfYear.toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];
        params = `startDate=${startDate}&endDate=${endDate}`;
      } else if (range === '1Y') {
        params = 'days=365';
      }
      // 'ALL' → no params

      const historyData: HistoryDataPoint[] = await investmentApi.getHistory(params);
      setData(historyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chart data');
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(selectedRange);
  }, [selectedRange]);

  const handleTakeSnapshot = async () => {
    setSnapshotting(true);
    setError(null);
    try {
      await investmentApi.takeSnapshot();
      await fetchHistory(selectedRange);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to take snapshot');
      console.error('Failed to take snapshot:', err);
    } finally {
      setSnapshotting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: selectedRange === 'ALL' || selectedRange === '1Y' ? '2-digit' : undefined,
    });
  };

  const chartData = data.map((point) => ({
    date: formatDate(point.snapshotDate),
    portfolioValue: point.totalPortfolioValue,
    currentValue: point.totalCurrentValue,
    invested: point.totalInvestedAmount,
  }));

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '1W', label: '1W' },
    { value: '1M', label: '1M' },
    { value: 'YTD', label: 'YTD' },
    { value: '1Y', label: '1Y' },
    { value: 'ALL', label: 'ALL' },
  ];

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Failed to load chart</h3>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => fetchHistory(selectedRange)}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Portfolio Value Over Time</h2>
          <p className="text-sm text-gray-500 mt-0.5">Historical performance tracking</p>
        </div>

        {/* Time Range Filter Buttons + Take Snapshot */}
        <div className="flex flex-wrap gap-2 mt-4 sm:mt-0 items-center">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedRange(range.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedRange === range.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={handleTakeSnapshot}
            disabled={snapshotting}
            className="ml-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Save current portfolio value to history (replaces snapshot for this hour)"
          >
            {snapshotting ? (
              <>Saving…</>
            ) : (
              <>
                <span aria-hidden>📸</span>
                Take snapshot
              </>
            )}
          </button>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto" />
            <div className="h-64 bg-gray-100 rounded" />
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No history data yet</h3>
          <p className="text-sm text-gray-500">
            Portfolio snapshots are taken daily. Check back tomorrow to see your history chart.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tickMargin={10}
            />
            <YAxis
              stroke="#6B7280"
              style={{ fontSize: '12px' }}
              tickFormatter={formatCurrency}
              tickMargin={10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  portfolioValue: 'Total Portfolio Value',
                  currentValue: 'Current Value (excl. cash)',
                  invested: 'Total Invested',
                };
                return [formatCurrency(value), labels[name] || name];
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
              formatter={(value: string) => {
                const labels: Record<string, string> = {
                  portfolioValue: 'Total Portfolio Value',
                  currentValue: 'Current Value (excl. cash)',
                  invested: 'Total Invested',
                };
                return labels[value] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="portfolioValue"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
              name="portfolioValue"
            />
            <Line
              type="monotone"
              dataKey="currentValue"
              stroke="#8B5CF6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
              name="currentValue"
            />
            <Line
              type="monotone"
              dataKey="invested"
              stroke="#9CA3AF"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 4 }}
              name="invested"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Stats Summary */}
      {!loading && data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500 mb-1">First Value</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(data[0].totalPortfolioValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Latest Value</p>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(data[data.length - 1].totalPortfolioValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Change</p>
              <p
                className={`text-sm font-semibold ${
                  data[data.length - 1].totalPortfolioValue - data[0].totalPortfolioValue >= 0
                    ? 'text-emerald-600'
                    : 'text-red-600'
                }`}
              >
                {formatCurrency(
                  data[data.length - 1].totalPortfolioValue - data[0].totalPortfolioValue
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Data Points</p>
              <p className="text-sm font-semibold text-gray-900">{data.length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
