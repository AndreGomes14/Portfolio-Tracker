import { useState, useEffect, useCallback, useRef } from 'react';
import type { InvestmentResponse, InvestmentRequest, PortfolioSummaryResponse } from '../types';
import { investmentApi } from '../api/investmentApi';
import { exportToExcel } from '../utils/excelExport';
import { useAuth } from '../context/AuthContext';
import SummaryCards from './SummaryCards';
import PortfolioHistoryChart from './PortfolioHistoryChart';
import AllocationDonutChart from './AllocationDonutChart';
import InvestmentTable from './InvestmentTable';
import AddInvestmentForm from './AddInvestmentForm';
import RefreshPriceChangesModal, { type PriceChange } from './RefreshPriceChangesModal';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [investments, setInvestments] = useState<InvestmentResponse[]>([]);
  const [summary, setSummary] = useState<PortfolioSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<InvestmentResponse | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRefreshChangesModal, setShowRefreshChangesModal] = useState(false);
  const [priceChanges, setPriceChanges] = useState<PriceChange[]>([]);
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
    const previousInvestments = investments;
    setRefreshing(true);

    try {
      const updatedInvestments = await investmentApi.refreshPrices();

      const changes = updatedInvestments
        .map((updated) => {
          const previous = previousInvestments.find((item) => item.id === updated.id);
          if (!previous) return null;

          const oldValue = previous.currentValue;
          const newValue = updated.currentValue;
          const change = Math.round((newValue - oldValue) * 100) / 100;

          if (change === 0) return null;

          return {
            id: updated.id,
            name: updated.name,
            ticker: updated.ticker,
            oldValue,
            newValue,
            change,
          };
        })
        .filter((item): item is PriceChange => item !== null)
        .sort((a, b) => b.change - a.change);

      setInvestments(updatedInvestments);
      setSummary(await investmentApi.getSummary());
      setPriceChanges(changes);
      setShowRefreshChangesModal(true);
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
              <p className="text-sm text-gray-500 mt-0.5">
                {user ? `Welcome, ${user.displayName}` : 'Track your investments in real time'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                  onClick={() => {
                    setEditingInvestment(null);
                    setShowForm(!showForm);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                {showForm && !editingInvestment ? 'Close Form' : '+ Add Investment'}
              </button>
              <button
                  onClick={handleRefreshPrices}
                  disabled={refreshing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {refreshing ? 'Refreshing...' : 'Refresh Prices'}
              </button>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-2"
                title="View Portfolio History"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                History
              </button>
              <button
                onClick={() => setShowAllocationModal(true)}
                disabled={investments.length === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2"
                title="View Portfolio Allocation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                Allocation
              </button>
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
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-2"
                title="Sign Out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
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

      <RefreshPriceChangesModal
        open={showRefreshChangesModal}
        changes={priceChanges}
        onClose={() => setShowRefreshChangesModal(false)}
      />

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowHistoryModal(false)}
          />
          
          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-auto transform transition-all">
              {/* Close Button */}
              <button
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Content */}
              <div className="p-6">
                <PortfolioHistoryChart />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setShowAllocationModal(false)}
          />
          
          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-auto transform transition-all">
              {/* Close Button */}
              <button
                onClick={() => setShowAllocationModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
                title="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal Content */}
              <div className="p-6">
                <AllocationDonutChart investments={investments} loading={loading} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
