import { useState, useEffect } from 'react';
import type { InvestmentRequest, InvestmentResponse, InvestmentType } from '../types';

interface Props {
  onSubmit: (data: InvestmentRequest) => Promise<void>;
  onCancel: () => void;
  editingInvestment?: InvestmentResponse | null;
}

const investmentTypes: { value: InvestmentType; label: string }[] = [
  { value: 'STOCK', label: 'Stock' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'ETF', label: 'ETF' },
  { value: 'CASH', label: 'Cash' },
  { value: 'OTHER', label: 'Other' },
];

// Keep numeric fields as strings so user can type "0.0", "0.0001" without input collapsing
type FormState = Omit<InvestmentRequest, 'quantity' | 'averagePurchasePrice' | 'currentPrice'> & {
  quantity: string;
  averagePurchasePrice: string;
  currentPrice: string;
};

function numberToString(n: number): string {
  if (n === 0) return '';
  return n.toString();
}

const initialForm: FormState = {
  name: '',
  ticker: '',
  type: 'STOCK',
  quantity: '',
  averagePurchasePrice: '',
  currentPrice: '',
  broker: '',
  notes: '',
};

export default function AddInvestmentForm({ onSubmit, onCancel, editingInvestment }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isManualType = form.type === 'CASH' || form.type === 'OTHER';

  // Pre-fill form when editing
  useEffect(() => {
    if (editingInvestment) {
      setForm({
        name: editingInvestment.name,
        ticker: editingInvestment.ticker || '',
        type: editingInvestment.type,
        quantity: numberToString(editingInvestment.quantity),
        averagePurchasePrice: numberToString(editingInvestment.averagePurchasePrice),
        currentPrice: numberToString(editingInvestment.currentPrice),
        broker: editingInvestment.broker || '',
        notes: editingInvestment.notes || '',
      });
    } else {
      setForm(initialForm);
    }
  }, [editingInvestment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const quantityNum = parseFloat(form.quantity);
      const averagePurchasePriceNum = parseFloat(form.averagePurchasePrice);
      const currentPriceNum = form.currentPrice.trim() === '' ? undefined : parseFloat(form.currentPrice);

      const payload: InvestmentRequest = {
        name: form.name,
        ticker: form.ticker,
        type: form.type,
        broker: form.broker?.trim() || undefined,
        notes: form.notes,
        quantity: Number.isNaN(quantityNum) ? 0 : quantityNum,
        averagePurchasePrice: Number.isNaN(averagePurchasePriceNum) ? 0 : averagePurchasePriceNum,
        currentPrice: currentPriceNum !== undefined && !Number.isNaN(currentPriceNum) ? currentPriceNum : undefined,
      };
      await onSubmit(payload);
      setForm(initialForm);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add investment';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        {editingInvestment ? 'Edit Investment' : 'Add New Investment'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="e.g. Apple Inc."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Ticker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticker {!isManualType && '*'}
            </label>
            <input
              type="text"
              name="ticker"
              value={form.ticker}
              onChange={handleChange}
              placeholder={form.type === 'CRYPTO' ? 'e.g. bitcoin' : 'e.g. AAPL'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            {form.type === 'CRYPTO' && (
              <p className="text-xs text-gray-400 mt-1">
                CoinGecko ID - <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline">Search here</a>
              </p>
            )}
            {(form.type === 'STOCK' || form.type === 'ETF') && (
              <p className="text-xs text-gray-400 mt-1">
                Market symbol - <a href="https://finance.yahoo.com/lookup" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 underline">Search Yahoo Finance</a>
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
            >
              {investmentTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Broker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Broker</label>
            <input
              type="text"
              name="broker"
              value={form.broker}
              onChange={handleChange}
              placeholder="e.g. Interactive Brokers"
              maxLength={80}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              required
              min="0.0001"
              step="0.00000001"
              placeholder="e.g. 20.20"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Minimum: 0.0001 — up to 8 decimals</p>
          </div>

          {/* Avg Purchase Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Avg Purchase Price (€) *</label>
            <input
              type="number"
              name="averagePurchasePrice"
              value={form.averagePurchasePrice}
              onChange={handleChange}
              required
              min="0.0001"
              step="0.00000001"
              placeholder="e.g. 0.01 or 12345.678"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            <p className="text-xs text-gray-400 mt-1">Price per unit when bought — up to 8 decimals</p>
          </div>

          {/* Current Price (for manual types) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Price (€) {isManualType ? '*' : '(optional)'}
            </label>
            <input
              type="number"
              name="currentPrice"
              value={form.currentPrice}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              placeholder={isManualType ? '0.01' : 'Auto-fetched'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            />
            {!isManualType && (
              <p className="text-xs text-gray-400 mt-1">Auto-fetched & converted to EUR</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            placeholder="Optional notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {submitting ? (editingInvestment ? 'Updating...' : 'Adding...') : (editingInvestment ? 'Update Investment' : 'Add Investment')}
          </button>
        </div>
      </form>
    </div>
  );
}
