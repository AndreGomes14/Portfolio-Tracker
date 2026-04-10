import axios from 'axios';
import type { AxiosError } from 'axios';
import type {
  InvestmentRequest,
  InvestmentResponse,
  PortfolioSummaryResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../types';

// --- Centralized Axios instance ---

const TOKEN_KEY = 'pt_token';
const USER_KEY = 'pt_user';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: inject Bearer token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: clear session on 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      // Redirect to login — triggers React re-render via storage event or next render cycle
      window.location.href = '/';
    }
    // Extract backend error message for cleaner UI display
    const data = error.response?.data as { message?: string } | undefined;
    const message = data?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

// --- Auth API (public endpoints — no token needed) ---

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data).then((res) => res.data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data).then((res) => res.data),
};

// --- Investment API (protected endpoints) ---

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

  getHistory: (params?: string) =>
    api.get(`/portfolio/history${params ? `?${params}` : ''}`).then((res) => res.data),
};
