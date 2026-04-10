export type InvestmentType = 'STOCK' | 'CRYPTO' | 'ETF' | 'CASH' | 'OTHER';

export interface InvestmentRequest {
  name: string;
  ticker?: string;
  type: InvestmentType;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice?: number;
  broker?: string;
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
  broker: string | null;
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

// --- Auth types ---

export interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  displayName: string;
  password: string;
}

export interface AuthUser {
  userId: number;
  email: string;
  displayName: string;
}
