type PriceChange = {
  id: number;
  name: string;
  ticker: string | null;
  oldValue: number;
  newValue: number;
  change: number;
};

interface RefreshPriceChangesModalProps {
  open: boolean;
  changes: PriceChange[];
  oldPortfolioValue: number;
  newPortfolioValue: number;
  onClose: () => void;
}

export type { PriceChange };

export default function RefreshPriceChangesModal({
  open,
  changes,
  oldPortfolioValue,
  newPortfolioValue,
  onClose,
}: RefreshPriceChangesModalProps) {
  if (!open) return null;

  const totalChange = Math.round((newPortfolioValue - oldPortfolioValue) * 100) / 100;
  const totalChangeClass = totalChange > 0 ? 'text-emerald-600' : 'text-rose-600';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-auto transform transition-all">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900">Price refresh summary</h3>
            <p className="text-sm text-gray-500 mt-2">
              The list below shows assets whose value changed after refreshing prices.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Old portfolio value</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">€{oldPortfolioValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">New portfolio value</p>
                <p className="mt-2 text-lg font-semibold text-gray-900">€{newPortfolioValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Portfolio change</p>
                <p className={`mt-2 text-lg font-semibold ${totalChangeClass}`}>
                  {totalChange > 0 ? '+' : ''}€{Math.abs(totalChange).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {changes.length === 0 ? (
                <div className="rounded-xl border border-gray-200 p-6 bg-gray-50 text-center text-sm text-gray-700">
                  No asset values changed during this refresh.
                </div>
              ) : (
                changes.map((change) => (
                  <div
                    key={change.id}
                    className="rounded-xl border border-gray-200 p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{change.name}</p>
                        {change.ticker && <p className="text-xs text-gray-500">{change.ticker}</p>}
                      </div>
                      <span
                        className={`text-sm font-semibold ${change.change > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                      >
                        {change.change > 0 ? '+' : ''}€{Math.abs(change.change).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm text-gray-700">
                      <div className="rounded-xl bg-white p-3 border border-gray-200">
                        <p className="text-xs uppercase tracking-wide text-gray-500">Before</p>
                        <p className="mt-1 font-medium text-gray-900">€{change.oldValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}</p>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-gray-200">
                        <p className="text-xs uppercase tracking-wide text-gray-500">After</p>
                        <p className="mt-1 font-medium text-gray-900">€{change.newValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 text-right">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
