# 🔄 Guia de Migração: localStorage → Supabase

Este guia explica como migrar a aplicação Amparo do localStorage para Supabase.

## 📋 Passo a Passo

### 1. Instalar Dependências

```bash
npm install @supabase/supabase-js
```

### 2. Criar Cliente Supabase

Crie `src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          password_hash: string;
          created_at: string;
          last_login_at: string | null;
          subscription_active: boolean;
          subscription_expires_at: string | null;
          total_tokens_used: number;
          input_tokens_used: number;
          output_tokens_used: number;
          token_limit: number | null;
          profile_data: Record<string, any>;
        };
      };
      memories: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          date: string;
          type: 'carta' | 'lembranca';
          image_url: string | null;
          created_at: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          mood: number;
          note: string | null;
          created_at: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          sender: 'user' | 'amparo';
          timestamp: string;
        };
      };
      journey_progress: {
        Row: {
          id: string;
          user_id: string;
          module_id: string;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
      };
    };
  };
}
```

### 3. Migrar Autenticação

Atualize `src/lib/auth.ts` para usar Supabase:

```typescript
import { supabase } from './supabase';
import type { AuthUser, AuthResponse } from '@/types/auth';
import bcrypt from 'bcryptjs'; // ou use crypto nativo

export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Hash da senha
    const passwordHash = await hashPassword(password);
    
    // Criar usuário no Supabase
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        profile_data: {},
      })
      .select()
      .single();

    if (error) throw error;

    const user: AuthUser = {
      id: data.id,
      email: data.email,
      name: data.name,
      createdAt: data.created_at,
      subscriptionActive: data.subscription_active,
      subscriptionExpiresAt: data.subscription_expires_at || undefined,
      totalTokensUsed: data.total_tokens_used,
      inputTokensUsed: data.input_tokens_used,
      outputTokensUsed: data.output_tokens_used,
      tokenLimit: data.token_limit || undefined,
    };

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar',
    };
  }
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    // Buscar usuário
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return { success: false, error: 'Email ou senha inválidos' };
    }

    // Verificar senha
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'Email ou senha inválidos' };
    }

    // Atualizar último login
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
      totalTokensUsed: user.total_tokens_used,
      inputTokensUsed: user.input_tokens_used,
      outputTokensUsed: user.output_tokens_used,
      tokenLimit: user.token_limit || undefined,
    };

    // Salvar no localStorage para sessão
    localStorage.setItem('amparo_auth', JSON.stringify({ user: authUser }));

    return { success: true, user: authUser };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao fazer login',
    };
  }
}

// Funções auxiliares de hash
async function hashPassword(password: string): Promise<string> {
  // Usar Web Crypto API (nativo do browser)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
```

### 4. Migrar Memórias

Atualize `src/context/AmparoContext.tsx`:

```typescript
import { supabase } from '@/lib/supabase';

// Carregar memórias do Supabase
const loadMemories = async (userId: string) => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar memórias:', error);
    return [];
  }

  return data.map(m => ({
    id: m.id,
    title: m.title,
    content: m.content,
    date: m.date,
    type: m.type,
    imageUrl: m.image_url || undefined,
    createdAt: new Date(m.created_at),
  }));
};

// Adicionar memória
const addMemory = async (memory: Memory, userId: string) => {
  const { data, error } = await supabase
    .from('memories')
    .insert({
      user_id: userId,
      title: memory.title,
      content: memory.content,
      date: memory.date,
      type: memory.type,
      image_url: memory.imageUrl || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar memória:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    date: data.date,
    type: data.type,
    imageUrl: data.image_url || undefined,
    createdAt: new Date(data.created_at),
  };
};
```

### 5. Migrar Check-ins

```typescript
// Carregar check-ins
const loadCheckIns = async (userId: string) => {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Erro ao carregar check-ins:', error);
    return [];
  }

  return data.map(c => ({
    date: c.date,
    mood: c.mood as MoodLevel,
    note: c.note || undefined,
  }));
};

// Adicionar check-in
const addCheckIn = async (checkIn: DailyCheckIn, userId: string) => {
  const { data, error } = await supabase
    .from('check_ins')
    .upsert({
      user_id: userId,
      date: checkIn.date,
      mood: checkIn.mood,
      note: checkIn.note || null,
    }, {
      onConflict: 'user_id,date',
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar check-in:', error);
    throw error;
  }

  return checkIn;
};
```

### 6. Migrar Progresso da Jornada

```typescript
// Salvar progresso
const saveJourneyProgress = async (
  userId: string,
  moduleId: string,
  completed: boolean
) => {
  const { error } = await supabase
    .from('journey_progress')
    .upsert({
      user_id: userId,
      module_id: moduleId,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    }, {
      onConflict: 'user_id,module_id',
    });

  if (error) {
    console.error('Erro ao salvar progresso:', error);
    throw error;
  }
};
```

---

## 🧵 Atualização (Chat): múltiplas conversas + botão “Nova conversa”

Para manter o histórico e permitir iniciar uma **nova conversa sem apagar as antigas**, o app usa um `conversation_id` nas mensagens.

### SQL (produção / banco já existente)

Execute no Supabase SQL Editor:

```sql
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id
  ON public.chat_messages(conversation_id);
```

### Observação

- Mensagens antigas ficam com `conversation_id = NULL` e aparecem como **“Histórico anterior”** no seletor.

---

## 🔄 Estratégia de Migração

### Fase 1: Preparação
1. Criar banco de dados no Supabase
2. Criar tabelas
3. Configurar RLS

### Fase 2: Implementação
1. Instalar Supabase client
2. Criar funções de migração
3. Atualizar código para usar Supabase

### Fase 3: Migração de Dados Existentes
1. Criar script de migração
2. Migrar dados do localStorage para Supabase
3. Validar dados migrados

### Fase 4: Deploy
1. Configurar variáveis de ambiente
2. Deploy no Netlify
3. Testar em produção

---

## 📝 Notas Importantes

- **Senhas**: Use hash seguro (SHA-256 ou bcrypt)
- **RLS**: Sempre habilitado para segurança
- **Migração**: Faça backup antes de migrar
- **Testes**: Teste localmente antes de deploy

---

**Pronto para migrar! 🚀**
