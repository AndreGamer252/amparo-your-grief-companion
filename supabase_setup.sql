-- ============================================
-- Script SQL para criar tabelas no Supabase
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  subscription_active BOOLEAN DEFAULT false,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  input_tokens_used INTEGER DEFAULT 0,
  output_tokens_used INTEGER DEFAULT 0,
  token_limit INTEGER,
  profile_data JSONB DEFAULT '{}'::jsonb
);

-- Tabela de memórias
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('carta', 'lembranca')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de check-ins
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'amparo')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de progresso da jornada
CREATE TABLE IF NOT EXISTS journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, module_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON check_ins(date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_journey_progress_user_id ON journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_progress_module_id ON journey_progress(module_id);

-- RLS (Row Level Security) - Segurança
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
-- Nota: Como não estamos usando Supabase Auth, vamos usar uma abordagem diferente
-- Permitir leitura/escrita baseado em user_id armazenado no localStorage
-- Para produção, considere usar Supabase Auth

-- Política temporária: permitir tudo (será restringida depois)
-- IMPORTANTE: Em produção, você deve criar políticas mais restritivas
CREATE POLICY "Enable all operations for users" ON users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for memories" ON memories
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for check_ins" ON check_ins
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for chat_messages" ON chat_messages
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for journey_progress" ON journey_progress
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- NOTA IMPORTANTE DE SEGURANÇA:
-- ============================================
-- As políticas acima permitem acesso total.
-- Para produção, você deve:
-- 1. Usar Supabase Auth para autenticação
-- 2. Criar políticas que verificam auth.uid()
-- 3. Exemplo de política segura:
--    CREATE POLICY "Users can only see own data" ON memories
--      FOR SELECT USING (auth.uid()::text = user_id::text);
-- ============================================
