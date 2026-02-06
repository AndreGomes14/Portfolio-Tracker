export type InvestmentType = 'STOCK' | 'CRYPTO' | 'ETF' | 'CASH' | 'OTHER';

export interface InvestmentRequest {
  name: string;
  ticker?: string;
  type: InvestmentType;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice?: number;
  notes?: string;
}

export interface InvestmentResponse {
  id: number;
  name: string;
  ticker: string | null;
  type: InvestmentType;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  currentValue: number;
  totalInvested: number;
  profitAndLoss: number;
  profitAndLossPercentage: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSummaryResponse {
  totalPortfolioValue: number;
  totalCashAmount: number;
  totalInvestedAmount: number;
  totalCurrentValue: number;
  totalProfitAndLoss: number;
  totalProfitAndLossPercentage: number;
  investmentCount: number;
}
