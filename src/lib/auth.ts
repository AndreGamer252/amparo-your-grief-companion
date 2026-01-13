/**
 * Serviço de autenticação
 * Usa Supabase quando disponível, com fallback para localStorage
 */

import type { AuthUser, LoginCredentials, RegisterData, AuthResponse, AccountSettings } from '@/types/auth';
import { supabase } from './supabase';

const AUTH_STORAGE_KEY = 'amparo_auth';
const USERS_STORAGE_KEY = 'amparo_users';
const SETTINGS_STORAGE_KEY = 'amparo_settings';

// ============================================
// Funções auxiliares para hash de senha
// ============================================
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// ============================================
// Fallback: localStorage (quando Supabase não está disponível)
// ============================================
function getStoredUsers(): Map<string, { password: string; user: AuthUser }> {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) return new Map();
  
  try {
    const data = JSON.parse(stored);
    return new Map(data);
  } catch {
    return new Map();
  }
}

function saveUsers(users: Map<string, { password: string; user: AuthUser }>) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(Array.from(users.entries())));
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isStrongPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'A senha deve ter pelo menos 6 caracteres' };
  }
  return { valid: true };
}

// ============================================
// Funções principais com Supabase
// ============================================

/**
 * Registra um novo usuário
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  // Validações
  if (!data.name.trim()) {
    return { success: false, error: 'Nome é obrigatório' };
  }

  if (!isValidEmail(data.email)) {
    return { success: false, error: 'Email inválido' };
  }

  const passwordCheck = isStrongPassword(data.password);
  if (!passwordCheck.valid) {
    return { success: false, error: passwordCheck.error };
  }

  if (data.password !== data.confirmPassword) {
    return { success: false, error: 'As senhas não coincidem' };
  }

  // Usa Supabase se disponível
  if (supabase) {
    try {
      // Hash da senha
      const passwordHash = await hashPassword(data.password);

      // Verifica se o email já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', data.email.toLowerCase())
        .single();

      if (existingUser) {
        return { success: false, error: 'Este email já está cadastrado' };
      }

      // Cria novo usuário no Supabase
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email: data.email.toLowerCase(),
          name: data.name.trim(),
          password_hash: passwordHash,
          subscription_active: false,
          input_tokens_used: 0,
          output_tokens_used: 0,
          profile_data: {},
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao registrar no Supabase:', error);
        return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
      }

      const authUser: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: newUser.created_at,
        subscriptionActive: newUser.subscription_active,
        subscriptionExpiresAt: newUser.subscription_expires_at || undefined,
        inputTokensUsed: newUser.input_tokens_used,
        outputTokensUsed: newUser.output_tokens_used,
        tokenLimit: newUser.token_limit || undefined,
      };

      // Salva no localStorage para sessão
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: authUser, token }));

      return {
        success: true,
        user: authUser,
        token,
      };
    } catch (error) {
      console.error('Erro ao registrar:', error);
      // Fallback para localStorage
    }
  }

  // Fallback: localStorage
  const users = getStoredUsers();
  if (users.has(data.email.toLowerCase())) {
    return { success: false, error: 'Este email já está cadastrado' };
  }

  const newUser: AuthUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: data.email.toLowerCase(),
    name: data.name.trim(),
    createdAt: new Date().toISOString(),
    subscriptionActive: false,
  };

  users.set(data.email.toLowerCase(), {
    password: data.password,
    user: newUser,
  });
  saveUsers(users);

  const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: newUser, token }));

  return {
    success: true,
    user: newUser,
    token,
  };
}

/**
 * Faz login
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  if (!isValidEmail(credentials.email)) {
    return { success: false, error: 'Email inválido' };
  }

  if (!credentials.password) {
    return { success: false, error: 'Senha é obrigatória' };
  }

  // Usa Supabase se disponível
  if (supabase) {
    try {
      // Busca usuário no Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email.toLowerCase())
        .single();

      if (error || !user) {
        return { success: false, error: 'Email ou senha incorretos' };
      }

      // Verifica senha
      const isValid = await verifyPassword(credentials.password, user.password_hash);
      if (!isValid) {
        return { success: false, error: 'Email ou senha incorretos' };
      }

      // Atualiza último login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      const authUser: AuthUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
        lastLoginAt: user.last_login_at || undefined,
        subscriptionActive: user.subscription_active,
        subscriptionExpiresAt: user.subscription_expires_at || undefined,
        inputTokensUsed: user.input_tokens_used,
        outputTokensUsed: user.output_tokens_used,
        tokenLimit: user.token_limit || undefined,
      };

      // Salva no localStorage para sessão
      const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: authUser, token }));

      return {
        success: true,
        user: authUser,
        token,
      };
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      // Fallback para localStorage
    }
  }

  // Fallback: localStorage
  const users = getStoredUsers();
  const userData = users.get(credentials.email.toLowerCase());

  if (!userData) {
    return { success: false, error: 'Email ou senha incorretos' };
  }

  if (userData.password !== credentials.password) {
    return { success: false, error: 'Email ou senha incorretos' };
  }

  const updatedUser: AuthUser = {
    ...userData.user,
    lastLoginAt: new Date().toISOString(),
  };

  userData.user = updatedUser;
  users.set(credentials.email.toLowerCase(), userData);
  saveUsers(users);

  const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: updatedUser, token }));

  return {
    success: true,
    user: updatedUser,
    token,
  };
}

/**
 * Faz logout
 */
export function logout(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * Verifica se o usuário está autenticado
 */
export function getCurrentUser(): AuthUser | null {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  try {
    const { user } = JSON.parse(stored);
    return user;
  } catch {
    return null;
  }
}

/**
 * Obtém o token de autenticação
 */
export function getAuthToken(): string | null {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  try {
    const { token } = JSON.parse(stored);
    return token;
  } catch {
    return null;
  }
}

/**
 * Salva configurações da conta
 */
export function saveAccountSettings(settings: AccountSettings): void {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Obtém configurações da conta
 */
export function getAccountSettings(): AccountSettings | null {
  const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Atualiza informações do perfil
 */
export async function updateProfile(data: { name: string; email: string }): Promise<AuthResponse> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  if (!data.name.trim()) {
    return { success: false, error: 'Nome é obrigatório' };
  }

  if (!isValidEmail(data.email)) {
    return { success: false, error: 'Email inválido' };
  }

  // Usa Supabase se disponível
  if (supabase) {
    try {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          name: data.name.trim(),
          email: data.email.toLowerCase(),
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar perfil:', error);
        return { success: false, error: 'Erro ao atualizar perfil' };
      }

      const authUser: AuthUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        createdAt: updatedUser.created_at,
        lastLoginAt: updatedUser.last_login_at || undefined,
        subscriptionActive: updatedUser.subscription_active,
        subscriptionExpiresAt: updatedUser.subscription_expires_at || undefined,
        inputTokensUsed: updatedUser.input_tokens_used,
        outputTokensUsed: updatedUser.output_tokens_used,
        tokenLimit: updatedUser.token_limit || undefined,
      };

      // Atualiza no localStorage
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const authData = JSON.parse(stored);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          ...authData,
          user: authUser,
        }));
      }

      return {
        success: true,
        user: authUser,
      };
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      // Fallback para localStorage
    }
  }

  // Fallback: localStorage
  const updatedUser: AuthUser = {
    ...currentUser,
    name: data.name.trim(),
    email: data.email.toLowerCase(),
  };

  if (data.email.toLowerCase() !== currentUser.email) {
    const users = getStoredUsers();
    const userData = users.get(currentUser.email);
    
    if (userData) {
      users.delete(currentUser.email);
      users.set(data.email.toLowerCase(), {
        ...userData,
        user: updatedUser,
      });
      saveUsers(users);
    }
  }

  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (stored) {
    const authData = JSON.parse(stored);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      ...authData,
      user: updatedUser,
    }));
  }

  return {
    success: true,
    user: updatedUser,
  };
}

/**
 * Altera a senha
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthResponse> {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  const passwordCheck = isStrongPassword(data.newPassword);
  if (!passwordCheck.valid) {
    return { success: false, error: passwordCheck.error };
  }

  if (data.newPassword !== data.confirmPassword) {
    return { success: false, error: 'As senhas não coincidem' };
  }

  // Usa Supabase se disponível
  if (supabase) {
    try {
      // Busca usuário para verificar senha atual
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', currentUser.id)
        .single();

      if (fetchError || !user) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      // Verifica senha atual
      const isValid = await verifyPassword(data.currentPassword, user.password_hash);
      if (!isValid) {
        return { success: false, error: 'Senha atual incorreta' };
      }

      // Atualiza senha
      const newPasswordHash = await hashPassword(data.newPassword);
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: newPasswordHash })
        .eq('id', currentUser.id);

      if (updateError) {
        console.error('Erro ao alterar senha:', updateError);
        return { success: false, error: 'Erro ao alterar senha' };
      }

      return { success: true };
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      // Fallback para localStorage
    }
  }

  // Fallback: localStorage
  const users = getStoredUsers();
  const userData = users.get(currentUser.email);

  if (!userData) {
    return { success: false, error: 'Usuário não encontrado' };
  }

  if (userData.password !== data.currentPassword) {
    return { success: false, error: 'Senha atual incorreta' };
  }

  userData.password = data.newPassword;
  users.set(currentUser.email, userData);
  saveUsers(users);

  return { success: true };
}
