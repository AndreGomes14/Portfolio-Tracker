import axios from 'axios';
import type { InvestmentRequest, InvestmentResponse, PortfolioSummaryResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

export const investmentApi = {
  getAll: () =>
    api.get<InvestmentResponse[]>('/investments').then((res) => res.data),

  getById: (id: number) =>
    api.get<InvestmentResponse>(`/investments/${id}`).then((res) => res.data),

  create: (data: InvestmentRequest) =>
    api.post<InvestmentResponse>('/investments', data).then((res) => res.data),

  update: (id: number, data: InvestmentRequest) =>
    api.put<InvestmentResponse>(`/investments/${id}`, data).then((res) => res.data),

  delete: (id: number) =>
    api.delete(`/investments/${id}`),

  getSummary: () =>
    api.get<PortfolioSummaryResponse>('/portfolio/summary').then((res) => res.data),

  refreshPrices: () =>
    api.post<InvestmentResponse[]>('/portfolio/refresh-prices').then((res) => res.data),

  takeSnapshot: () =>
    api.post('/portfolio/snapshot').then((res) => res.data),
};
