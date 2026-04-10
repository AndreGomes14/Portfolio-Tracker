import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useTransition,
} from 'react';
import type { ReactNode } from 'react';
import type { AuthUser, LoginRequest, RegisterRequest } from '../types';
import { authApi } from '../api/investmentApi';

// --- Auth state shape ---

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPending: boolean;
  error: string | null;
  login: (data: LoginRequest) => void;
  register: (data: RegisterRequest) => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'pt_token';
const USER_KEY = 'pt_user';

// --- Provider ---

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Hydrate on mount — check if stored token is still valid
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const persistSession = useCallback((tk: string, u: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, tk);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(tk);
    setUser(u);
    setError(null);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback(
    (data: LoginRequest) => {
      setError(null);
      startTransition(async () => {
        try {
          const res = await authApi.login(data);
          persistSession(res.token, {
            userId: res.userId,
            email: res.email,
            displayName: res.displayName,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Login failed';
          setError(message);
        }
      });
    },
    [persistSession],
  );

  const register = useCallback(
    (data: RegisterRequest) => {
      setError(null);
      startTransition(async () => {
        try {
          const res = await authApi.register(data);
          persistSession(res.token, {
            userId: res.userId,
            email: res.email,
            displayName: res.displayName,
          });
        } catch (err: unknown) {
          const message =
            err instanceof Error ? err.message : 'Registration failed';
          setError(message);
        }
      });
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        isPending,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// --- Hook ---

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
