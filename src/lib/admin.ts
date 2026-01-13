/**
 * Serviço de administração
 * Gerencia acesso admin e dados de usuários
 */

import type { AuthUser } from '@/types/auth';

const ADMIN_STORAGE_KEY = 'amparo_admin_auth';
const USERS_STORAGE_KEY = 'amparo_users';

// Credenciais do admin
const ADMIN_EMAIL = 'amancio277@gmail.com';
const ADMIN_PASSWORD = '@Yuri030423';

export interface AdminAuthResponse {
  success: boolean;
  error?: string;
}

export interface UserMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  usersWithLastLogin: number;
  totalTokensUsed: number;
  inputTokensUsed: number;
  outputTokensUsed: number;
  averageTokensPerUser: number;
  totalCost: number;
  inputCost: number;
  outputCost: number;
  averageCostPerUser: number;
}

export interface AdminUser {
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
  registrationDate: string;
  lastAccess?: string;
  subscriptionStatus: 'active' | 'inactive' | 'expired';
}

/**
 * Faz login como administrador
 */
export function adminLogin(email: string, password: string): AdminAuthResponse {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = `admin_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify({ 
      email: ADMIN_EMAIL, 
      token,
      loggedInAt: new Date().toISOString()
    }));
    return { success: true };
  }
  return { success: false, error: 'Credenciais inválidas' };
}

/**
 * Verifica se está autenticado como admin
 */
export function isAdminAuthenticated(): boolean {
  const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!stored) return false;
  
  try {
    const { token } = JSON.parse(stored);
    return !!token;
  } catch {
    return false;
  }
}

/**
 * Faz logout do admin
 */
export function adminLogout(): void {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
}

/**
 * Obtém todos os usuários cadastrados
 */
export function getAllUsers(): AdminUser[] {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const usersMap = new Map(JSON.parse(stored));
    const users: AdminUser[] = [];
    
    usersMap.forEach((userData) => {
      const user = userData.user;
      const now = new Date();
      const expiresAt = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
      
      let subscriptionStatus: 'active' | 'inactive' | 'expired' = 'inactive';
      if (user.subscriptionActive) {
        if (expiresAt && expiresAt > now) {
          subscriptionStatus = 'active';
        } else if (expiresAt && expiresAt <= now) {
          subscriptionStatus = 'expired';
        } else if (!expiresAt) {
          subscriptionStatus = 'active';
        }
      }
      
      users.push({
        ...user,
        registrationDate: user.createdAt,
        lastAccess: user.lastLoginAt,
        subscriptionStatus,
        totalTokensUsed: user.totalTokensUsed || 0,
        inputTokensUsed: user.inputTokensUsed || 0,
        outputTokensUsed: user.outputTokensUsed || 0,
        tokenLimit: user.tokenLimit,
      });
    });
    
    // Ordena por data de criação (mais recentes primeiro)
    return users.sort((a, b) => 
      new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Obtém métricas dos usuários
 */
export function getUserMetrics(): UserMetrics {
  const users = getAllUsers();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const newUsersToday = users.filter(u => 
    new Date(u.registrationDate) >= today
  ).length;
  
  const newUsersThisWeek = users.filter(u => 
    new Date(u.registrationDate) >= weekAgo
  ).length;
  
  const newUsersThisMonth = users.filter(u => 
    new Date(u.registrationDate) >= monthAgo
  ).length;
  
  const activeSubscriptions = users.filter(u => 
    u.subscriptionStatus === 'active'
  ).length;
  
  const usersWithLastLogin = users.filter(u => 
    u.lastAccess && new Date(u.lastAccess) >= monthAgo
  ).length;
  
  const totalTokensUsed = users.reduce((sum, u) => sum + (u.totalTokensUsed || 0), 0);
  const inputTokensUsed = users.reduce((sum, u) => sum + (u.inputTokensUsed || 0), 0);
  const outputTokensUsed = users.reduce((sum, u) => sum + (u.outputTokensUsed || 0), 0);
  const averageTokensPerUser = users.length > 0 ? Math.round(totalTokensUsed / users.length) : 0;
  
  // Cálculo de custo baseado no preço do GPT-4o-mini
  // Input: $0.15 por 1M tokens, Output: $0.60 por 1M tokens
  const GPT4O_MINI_INPUT_COST_PER_MILLION = 0.15;
  const GPT4O_MINI_OUTPUT_COST_PER_MILLION = 0.60;
  
  const inputCost = (inputTokensUsed / 1_000_000) * GPT4O_MINI_INPUT_COST_PER_MILLION;
  const outputCost = (outputTokensUsed / 1_000_000) * GPT4O_MINI_OUTPUT_COST_PER_MILLION;
  const totalCost = inputCost + outputCost;
  const averageCostPerUser = users.length > 0 ? totalCost / users.length : 0;
  
  return {
    totalUsers: users.length,
    activeSubscriptions,
    newUsersToday,
    newUsersThisWeek,
    newUsersThisMonth,
    usersWithLastLogin,
    totalTokensUsed,
    inputTokensUsed,
    outputTokensUsed,
    averageTokensPerUser,
    totalCost,
    inputCost,
    outputCost,
    averageCostPerUser,
  };
}

/**
 * Atualiza status de assinatura de um usuário
 */
export function updateUserSubscription(
  userId: string, 
  active: boolean, 
  expiresAt?: string
): boolean {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) return false;
  
  try {
    const usersMap = new Map(JSON.parse(stored));
    let updated = false;
    
    usersMap.forEach((userData, email) => {
      if (userData.user.id === userId) {
        userData.user.subscriptionActive = active;
        if (expiresAt) {
          userData.user.subscriptionExpiresAt = expiresAt;
        }
        usersMap.set(email, userData);
        updated = true;
      }
    });
    
    if (updated) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(Array.from(usersMap.entries())));
      
      // Atualiza também no auth storage se o usuário estiver logado
      const authStored = localStorage.getItem('amparo_auth');
      if (authStored) {
        try {
          const authData = JSON.parse(authStored);
          if (authData.user && authData.user.id === userId) {
            authData.user.subscriptionActive = active;
            if (expiresAt) {
              authData.user.subscriptionExpiresAt = expiresAt;
            }
            localStorage.setItem('amparo_auth', JSON.stringify(authData));
          }
        } catch {}
      }
    }
    
    return updated;
  } catch {
    return false;
  }
}

/**
 * Formata data para exibição
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'Nunca';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata data completa
 */
export function formatFullDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Atualiza informações do perfil de um usuário
 */
export function updateUserProfile(
  userId: string,
  data: { name?: string; email?: string }
): { success: boolean; error?: string } {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) return { success: false, error: 'Nenhum usuário encontrado' };

  try {
    const usersMap = new Map(JSON.parse(stored));
    let updated = false;
    let oldEmail: string | null = null;

    usersMap.forEach((userData, email) => {
      if (userData.user.id === userId) {
        oldEmail = email;
        
        if (data.name) {
          userData.user.name = data.name.trim();
        }
        
        if (data.email && data.email.toLowerCase() !== email) {
          // Verifica se o novo email já existe
          if (usersMap.has(data.email.toLowerCase())) {
            return { success: false, error: 'Este email já está em uso' };
          }
          
          userData.user.email = data.email.toLowerCase();
          // Move o usuário para a nova chave de email
          usersMap.delete(email);
          usersMap.set(data.email.toLowerCase(), userData);
        }
        
        updated = true;
      }
    });

    if (!updated) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    // Salva as alterações
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(Array.from(usersMap.entries())));

    // Atualiza também no auth storage se o usuário estiver logado
    const authStored = localStorage.getItem('amparo_auth');
    if (authStored) {
      try {
        const authData = JSON.parse(authStored);
        if (authData.user && authData.user.id === userId) {
          if (data.name) authData.user.name = data.name.trim();
          if (data.email) authData.user.email = data.email.toLowerCase();
          localStorage.setItem('amparo_auth', JSON.stringify(authData));
        }
      } catch {}
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao atualizar perfil' };
  }
}

/**
 * Altera a senha de um usuário
 */
export function changeUserPassword(
  userId: string,
  newPassword: string
): { success: boolean; error?: string } {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'A senha deve ter pelo menos 6 caracteres' };
  }

  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) return { success: false, error: 'Nenhum usuário encontrado' };

  try {
    const usersMap = new Map(JSON.parse(stored));
    let updated = false;

    usersMap.forEach((userData, email) => {
      if (userData.user.id === userId) {
        userData.password = newPassword; // ⚠️ Em produção, isso seria hasheado no backend
        usersMap.set(email, userData);
        updated = true;
      }
    });

    if (!updated) {
      return { success: false, error: 'Usuário não encontrado' };
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(Array.from(usersMap.entries())));
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Erro ao alterar senha' };
  }
}

/**
 * Obtém um usuário por ID
 */
export function getUserById(userId: string): AdminUser | null {
  const users = getAllUsers();
  return users.find(u => u.id === userId) || null;
}

/**
 * Define limite de tokens para um usuário (0 = ilimitado)
 */
export function setUserTokenLimit(userId: string, limit: number | undefined): boolean {
  if (limit === undefined || limit === 0) {
    limit = 0; // 0 significa ilimitado
  }

  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) return false;

  try {
    const usersMap = new Map(JSON.parse(stored));
    let updated = false;

    usersMap.forEach((userData, email) => {
      if (userData.user.id === userId) {
        userData.user.tokenLimit = limit === 0 ? undefined : limit;
        usersMap.set(email, userData);
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(Array.from(usersMap.entries())));
      
      // Atualiza também no auth storage se o usuário estiver logado
      const authStored = localStorage.getItem('amparo_auth');
      if (authStored) {
        try {
          const authData = JSON.parse(authStored);
          if (authData.user && authData.user.id === userId) {
            authData.user.tokenLimit = limit === 0 ? undefined : limit;
            localStorage.setItem('amparo_auth', JSON.stringify(authData));
          }
        } catch {}
      }
    }

    return updated;
  } catch {
    return false;
  }
}

/**
 * Define limite de tokens para múltiplos usuários
 */
export function setBulkTokenLimits(userIds: string[], limit: number | undefined): { success: number; failed: number } {
  let success = 0;
  let failed = 0;

  userIds.forEach(userId => {
    if (setUserTokenLimit(userId, limit)) {
      success++;
    } else {
      failed++;
    }
  });

  return { success, failed };
}

/**
 * Reseta contador de tokens de um usuário
 */
export function resetUserTokens(userId: string): boolean {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) return false;

  try {
    const usersMap = new Map(JSON.parse(stored));
    let updated = false;

    usersMap.forEach((userData, email) => {
      if (userData.user.id === userId) {
        userData.user.totalTokensUsed = 0;
        userData.user.inputTokensUsed = 0;
        userData.user.outputTokensUsed = 0;
        usersMap.set(email, userData);
        updated = true;
      }
    });

    if (updated) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(Array.from(usersMap.entries())));
      
      // Atualiza também no token usage storage
      const TOKEN_USAGE_KEY = 'amparo_token_usage';
      const tokenStored = localStorage.getItem(TOKEN_USAGE_KEY);
      if (tokenStored) {
        try {
          const usage: Record<string, { input: number; output: number; total: number }> = JSON.parse(tokenStored);
          delete usage[userId];
          localStorage.setItem(TOKEN_USAGE_KEY, JSON.stringify(usage));
        } catch {}
      }

      // Atualiza no auth storage
      const authStored = localStorage.getItem('amparo_auth');
      if (authStored) {
        try {
          const authData = JSON.parse(authStored);
          if (authData.user && authData.user.id === userId) {
            authData.user.totalTokensUsed = 0;
            authData.user.inputTokensUsed = 0;
            authData.user.outputTokensUsed = 0;
            localStorage.setItem('amparo_auth', JSON.stringify(authData));
          }
        } catch {}
      }
    }

    return updated;
  } catch {
    return false;
  }
}

/**
 * Formata número de tokens para exibição
 */
export function formatTokens(tokens: number | undefined): string {
  if (!tokens) return '0';
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

/**
 * Calcula o custo estimado baseado nos tokens (input e output separados)
 */
export function calculateTokenCost(inputTokens: number, outputTokens: number): number {
  const GPT4O_MINI_INPUT_COST_PER_MILLION = 0.15;
  const GPT4O_MINI_OUTPUT_COST_PER_MILLION = 0.60;
  
  const inputCost = (inputTokens / 1_000_000) * GPT4O_MINI_INPUT_COST_PER_MILLION;
  const outputCost = (outputTokens / 1_000_000) * GPT4O_MINI_OUTPUT_COST_PER_MILLION;
  
  return inputCost + outputCost;
}

/**
 * Formata valor monetário em USD
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) return '$0.00';
  if (cost < 1) return `$${cost.toFixed(2)}`;
  if (cost < 1000) return `$${cost.toFixed(2)}`;
  return `$${(cost / 1000).toFixed(2)}K`;
}
