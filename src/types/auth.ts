/**
 * Tipos relacionados à autenticação e conta do usuário
 */

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLoginAt?: string;
  subscriptionActive?: boolean;
  subscriptionExpiresAt?: string;
  totalTokensUsed?: number;
  inputTokensUsed?: number;
  outputTokensUsed?: number;
  tokenLimit?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

export interface AccountSettings {
  name: string;
  email: string;
  notifications: {
    dailyCheckIn: boolean;
    memoryReminders: boolean;
    weeklySummary: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
  };
  theme?: 'light' | 'dark' | 'auto';
}
