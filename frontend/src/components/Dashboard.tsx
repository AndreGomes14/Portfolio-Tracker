import { useState, useEffect, useCallback, useRef } from 'react';
import type { InvestmentResponse, InvestmentRequest, PortfolioSummaryResponse } from '../types';
import { investmentApi } from '../api/investmentApi';
import { exportToExcel } from '../utils/excelExport';
import SummaryCards from './SummaryCards';
import InvestmentTable from './InvestmentTable';
import AddInvestmentForm from './AddInvestmentForm';

export default function Dashboard() {
  const [investments, setInvestments] = useState<InvestmentResponse[]>([]);
  const [summary, setSummary] = useState<PortfolioSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [investmentsData, summaryData] = await Promise.all([
        investmentApi.getAll(),
        investmentApi.getSummary(),
      ]);
      setInvestments(investmentsData);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddInvestment = async (data: InvestmentRequest) => {
    await investmentApi.create(data);
    setShowForm(false);
    await fetchData();
  };

  const handleEditInvestment = async (data: InvestmentRequest) => {
    if (!editingInvestment) return;
    await investmentApi.update(editingInvestment.id, data);
    setEditingInvestment(null);
    setShowForm(false);
    await fetchData();
  };

  const handleEdit = (investment: InvestmentResponse) => {
    setEditingInvestment(investment);
    setShowForm(true);
  };

  // Scroll to the edit form when user clicks Edit
  useEffect(() => {
    if (editingInvestment && showForm && formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [editingInvestment, showForm]);

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingInvestment(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this investment?')) return;
    try {
      await investmentApi.delete(id);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      await investmentApi.refreshPrices();
      await fetchData();
    } catch (err) {
      console.error('Failed to refresh prices:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    exportToExcel(investments, summary);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portfolio Tracker</h1>
              <p className="text-sm text-gray-500 mt-0.5">Track your investments in real time</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={investments.length === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
                title="Export to Excel"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
              <button
                onClick={handleRefreshPrices}
                disabled={refreshing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Prices'}
              </button>
              <button
                onClick={() => {
                  setEditingInvestment(null);
                  setShowForm(!showForm);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                {showForm && !editingInvestment ? 'Close Form' : '+ Add Investment'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <SummaryCards summary={summary} loading={loading} />

        {/* Add/Edit Investment Form */}
        {showForm && (
          <div ref={formSectionRef}>
          <AddInvestmentForm
            onSubmit={editingInvestment ? handleEditInvestment : handleAddInvestment}
            onCancel={handleCancelForm}
            editingInvestment={editingInvestment}
          />
          </div>
        )}

        {/* Investments Table */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Investments</h2>
          {investments.length > 0 && (
            <span className="text-sm text-gray-500">{investments.length} asset{investments.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        <InvestmentTable
          investments={investments}
          loading={loading}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </main>
    </div>
  );
}
