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

  // Usa Supabase Auth se disponível
  if (supabase) {
    try {
      // Cria usuário no Supabase Auth (auth.users)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: data.email.toLowerCase(),
        password: data.password,
        options: {
          data: {
            name: data.name.trim(),
          },
        },
      });

      if (signUpError || !signUpData.user) {
        console.error('Erro ao registrar no Supabase Auth:', signUpError);
        return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
      }

      const authUserRaw = signUpData.user;

      // Cria/atualiza registro na tabela public.users vinculada ao auth.users
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .upsert(
          {
            id: authUserRaw.id,
            email: authUserRaw.email?.toLowerCase() || data.email.toLowerCase(),
            name: data.name.trim(),
            subscription_active: false,
            total_tokens_used: 0,
            input_tokens_used: 0,
            output_tokens_used: 0,
            profile_data: {},
          },
          { onConflict: 'id' },
        )
        .select()
        .single();

      if (userError || !userRow) {
        console.error('Erro ao criar usuário em public.users:', userError);
        return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
      }

      const authUser: AuthUser = {
        id: userRow.id,
        email: userRow.email,
        name: userRow.name,
        createdAt: userRow.created_at,
        lastLoginAt: userRow.last_login_at || undefined,
        subscriptionActive: userRow.subscription_active,
        subscriptionExpiresAt: userRow.subscription_expires_at || undefined,
        totalTokensUsed: userRow.total_tokens_used || 0,
        inputTokensUsed: userRow.input_tokens_used || 0,
        outputTokensUsed: userRow.output_tokens_used || 0,
        tokenLimit: userRow.token_limit || undefined,
      };

      // Salva no localStorage para sessão (espelha o usuário autenticado)
      const token = signUpData.session?.access_token || '';
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

  // Usa Supabase Auth se disponível
  if (supabase) {
    try {
      // Faz login no Supabase Auth
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email.toLowerCase(),
        password: credentials.password,
      });

      if (signInError || !signInData.user) {
        return { success: false, error: 'Email ou senha incorretos' };
      }

      const authUserRaw = signInData.user;

      // Garante que exista um registro correspondente em public.users
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .upsert(
          {
            id: authUserRaw.id,
            email: authUserRaw.email?.toLowerCase() || credentials.email.toLowerCase(),
            name: (authUserRaw.user_metadata as any)?.name || authUserRaw.email || credentials.email,
          },
          { onConflict: 'id' },
        )
        .select()
        .single();

      if (userError || !userRow) {
        console.error('Erro ao sincronizar usuário em public.users:', userError);
        return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
      }

      // Atualiza last_login_at
      const { data: updatedUser } = await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', userRow.id)
        .select()
        .single();

      const finalUser = updatedUser || userRow;

      const authUser: AuthUser = {
        id: finalUser.id,
        email: finalUser.email,
        name: finalUser.name,
        createdAt: finalUser.created_at,
        lastLoginAt: finalUser.last_login_at || undefined,
        subscriptionActive: finalUser.subscription_active,
        subscriptionExpiresAt: finalUser.subscription_expires_at || undefined,
        totalTokensUsed: finalUser.total_tokens_used || 0,
        inputTokensUsed: finalUser.input_tokens_used || 0,
        outputTokensUsed: finalUser.output_tokens_used || 0,
        tokenLimit: finalUser.token_limit || undefined,
      };

      // Salva no localStorage para sessão
      const token = signInData.session?.access_token || '';
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
  if (supabase) {
    supabase.auth.signOut().catch((error) => {
      console.error('Erro ao fazer logout do Supabase Auth:', error);
    });
  }
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

  // Usa Supabase Auth se disponível
  if (supabase) {
    try {
      // Atualiza dados básicos no Supabase Auth (email, metadata)
      const { error: authError } = await supabase.auth.updateUser({
        email: data.email.toLowerCase(),
        data: {
          name: data.name.trim(),
        },
      });

      if (authError) {
        console.error('Erro ao atualizar usuário no Supabase Auth:', authError);
        return { success: false, error: 'Erro ao atualizar perfil' };
      }

      // Atualiza registro em public.users
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({
          name: data.name.trim(),
          email: data.email.toLowerCase(),
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error || !updatedUser) {
        console.error('Erro ao atualizar perfil em public.users:', error);
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
        totalTokensUsed: updatedUser.total_tokens_used || 0,
        inputTokensUsed: updatedUser.input_tokens_used || 0,
        outputTokensUsed: updatedUser.output_tokens_used || 0,
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

  // Usa Supabase Auth se disponível
  if (supabase) {
    try {
      // Primeiro, valida a senha atual tentando um login silencioso
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.email,
        password: data.currentPassword,
      });

      if (signInError) {
        return { success: false, error: 'Senha atual incorreta' };
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });

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
