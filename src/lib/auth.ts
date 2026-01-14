/**
 * Serviço de autenticação
 * Usa exclusivamente Supabase Auth e Database
 */

import type { AuthUser, LoginCredentials, RegisterData, AuthResponse, AccountSettings } from '@/types/auth';
import { supabase } from './supabase';

const SETTINGS_STORAGE_KEY = 'amparo_settings';

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

  if (!supabase) {
    return { success: false, error: 'Supabase não está configurado' };
  }

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
      return { 
        success: false, 
        error: signUpError?.message || 'Erro ao criar conta. Tente novamente.' 
      };
    }

    const authUserRaw = signUpData.user;

    // Cria/atualiza registro na tabela public.users vinculada ao auth.users
    // NOTA: Se as colunas de tokens não existirem, execute MIGRACAO_COLUNAS_USERS.sql no Supabase
    const userData: any = {
      id: authUserRaw.id,
      email: authUserRaw.email?.toLowerCase() || data.email.toLowerCase(),
      name: data.name.trim(),
      subscription_active: false,
      profile_data: {},
    };

    const { data: userRow, error: userError } = await supabase
      .from('users')
      .upsert(userData, { onConflict: 'id' })
      .select()
      .single();

    if (userError || !userRow) {
      console.error('Erro ao criar usuário em public.users:', userError);
      return { 
        success: false, 
        error: userError?.message || 'Erro ao criar conta. Tente novamente.' 
      };
    }

    const authUser: AuthUser = {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      createdAt: userRow.created_at,
      lastLoginAt: userRow.last_login_at || undefined,
      subscriptionActive: userRow.subscription_active,
      subscriptionExpiresAt: userRow.subscription_expires_at || undefined,
      totalTokensUsed: (userRow as any).total_tokens_used || 0,
      inputTokensUsed: (userRow as any).input_tokens_used || 0,
      outputTokensUsed: (userRow as any).output_tokens_used || 0,
      tokenLimit: (userRow as any).token_limit || undefined,
    };

    return {
      success: true,
      user: authUser,
      token: signUpData.session?.access_token || '',
    };
  } catch (error) {
    console.error('Erro ao registrar:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao criar conta. Tente novamente.' 
    };
  }
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

  if (!supabase) {
    return { success: false, error: 'Supabase não está configurado' };
  }

  try {
    // Faz login no Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: credentials.email.toLowerCase(),
      password: credentials.password,
    });

    if (signInError || !signInData.user) {
      return { 
        success: false, 
        error: signInError?.message || 'Email ou senha incorretos' 
      };
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
      return { 
        success: false, 
        error: userError?.message || 'Erro ao fazer login. Tente novamente.' 
      };
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

    return {
      success: true,
      user: authUser,
      token: signInData.session?.access_token || '',
    };
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao fazer login. Tente novamente.' 
    };
  }
}

/**
 * Faz logout
 */
export async function logout(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

/**
 * Verifica se o usuário está autenticado (busca do Supabase Auth)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Busca dados complementares em public.users
    const { data: userRow, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !userRow) {
      console.error('Erro ao buscar usuário:', error);
      return null;
    }

    return {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name,
      createdAt: userRow.created_at,
      lastLoginAt: userRow.last_login_at || undefined,
      subscriptionActive: userRow.subscription_active,
      subscriptionExpiresAt: userRow.subscription_expires_at || undefined,
      totalTokensUsed: (userRow as any).total_tokens_used || 0,
      inputTokensUsed: (userRow as any).input_tokens_used || 0,
      outputTokensUsed: (userRow as any).output_tokens_used || 0,
      tokenLimit: (userRow as any).token_limit || undefined,
    };
  } catch (error) {
    console.error('Erro ao obter usuário atual:', error);
    return null;
  }
}

/**
 * Obtém o token de autenticação (do Supabase Auth)
 */
export async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

/**
 * Salva configurações da conta (apenas preferências de UI, não dados sensíveis)
 */
export function saveAccountSettings(settings: AccountSettings): void {
  // Apenas preferências de UI podem ser salvas localmente
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/**
 * Obtém configurações da conta (apenas preferências de UI)
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
  if (!supabase) {
    return { success: false, error: 'Supabase não está configurado' };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: 'Usuário não autenticado' };
  }

  if (!data.name.trim()) {
    return { success: false, error: 'Nome é obrigatório' };
  }

  if (!isValidEmail(data.email)) {
    return { success: false, error: 'Email inválido' };
  }

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
      return { success: false, error: authError.message || 'Erro ao atualizar perfil' };
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
      return { success: false, error: error?.message || 'Erro ao atualizar perfil' };
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

    return {
      success: true,
      user: authUser,
    };
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao atualizar perfil' 
    };
  }
}

/**
 * Altera a senha
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthResponse> {
  if (!supabase) {
    return { success: false, error: 'Supabase não está configurado' };
  }

  const currentUser = await getCurrentUser();
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
      return { success: false, error: updateError.message || 'Erro ao alterar senha' };
    }

    return { success: true };
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao alterar senha' 
    };
  }
}
