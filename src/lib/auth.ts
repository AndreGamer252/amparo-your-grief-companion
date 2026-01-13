/**
 * Serviço de autenticação
 * Por enquanto usa localStorage, mas está preparado para integração com backend
 */

import type { AuthUser, LoginCredentials, RegisterData, AuthResponse, AccountSettings } from '@/types/auth';

const AUTH_STORAGE_KEY = 'amparo_auth';
const USERS_STORAGE_KEY = 'amparo_users';
const SETTINGS_STORAGE_KEY = 'amparo_settings';

/**
 * Simula um banco de dados de usuários (em produção, isso seria uma API)
 */
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

/**
 * Valida formato de email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida força da senha
 */
function isStrongPassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'A senha deve ter pelo menos 6 caracteres' };
  }
  return { valid: true };
}

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

  // Verifica se o email já existe
  const users = getStoredUsers();
  if (users.has(data.email.toLowerCase())) {
    return { success: false, error: 'Este email já está cadastrado' };
  }

  // Cria novo usuário
  const newUser: AuthUser = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: data.email.toLowerCase(),
    name: data.name.trim(),
    createdAt: new Date().toISOString(),
    subscriptionActive: false, // Por padrão, sem assinatura ativa
  };

  // Armazena usuário (em produção, a senha seria hasheada no backend)
  users.set(data.email.toLowerCase(), {
    password: data.password, // ⚠️ Em produção, isso seria feito no backend com hash
    user: newUser,
  });
  saveUsers(users);

  // Faz login automático após registro
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

  const users = getStoredUsers();
  const userData = users.get(credentials.email.toLowerCase());

  if (!userData) {
    return { success: false, error: 'Email ou senha incorretos' };
  }

  // Em produção, compararia com hash
  if (userData.password !== credentials.password) {
    return { success: false, error: 'Email ou senha incorretos' };
  }

  // Atualiza último login
  const updatedUser: AuthUser = {
    ...userData.user,
    lastLoginAt: new Date().toISOString(),
  };

  userData.user = updatedUser;
  users.set(credentials.email.toLowerCase(), userData);
  saveUsers(users);

  // Cria token de autenticação
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

  // Atualiza usuário
  const updatedUser: AuthUser = {
    ...currentUser,
    name: data.name.trim(),
    email: data.email.toLowerCase(),
  };

  // Se o email mudou, atualiza no "banco de dados"
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

  // Atualiza no localStorage
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

  const users = getStoredUsers();
  const userData = users.get(currentUser.email);

  if (!userData) {
    return { success: false, error: 'Usuário não encontrado' };
  }

  // Verifica senha atual
  if (userData.password !== data.currentPassword) {
    return { success: false, error: 'Senha atual incorreta' };
  }

  // Valida nova senha
  const passwordCheck = isStrongPassword(data.newPassword);
  if (!passwordCheck.valid) {
    return { success: false, error: passwordCheck.error };
  }

  if (data.newPassword !== data.confirmPassword) {
    return { success: false, error: 'As senhas não coincidem' };
  }

  // Atualiza senha
  userData.password = data.newPassword;
  users.set(currentUser.email, userData);
  saveUsers(users);

  return { success: true };
}
