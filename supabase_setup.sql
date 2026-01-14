-- ============================================
-- Script SQL para criar tabelas no Supabase
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- Tabela de usuários (vinculada ao Supabase Auth)
-- NOTA: Com Supabase Auth, as senhas são gerenciadas em auth.users,
-- então password_hash não é necessário em public.users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  last_login_at TIMESTAMP WITH TIME ZONE,
  subscription_active BOOLEAN DEFAULT false NOT NULL,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  total_tokens_used BIGINT DEFAULT 0 NOT NULL,
  input_tokens_used BIGINT DEFAULT 0 NOT NULL,
  output_tokens_used BIGINT DEFAULT 0 NOT NULL,
  token_limit BIGINT,
  profile_data JSONB DEFAULT '{}'::jsonb NOT NULL
  -- password_hash removido: senhas são gerenciadas pelo Supabase Auth
);

-- Tabela de memórias
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('carta', 'lembranca')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela de check-ins
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  mood INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0
);

-- Tabela de progresso da jornada
CREATE TABLE IF NOT EXISTS public.journey_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  module_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, module_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON public.memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_ins_user_id ON public.check_ins(user_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON public.check_ins(date);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_journey_progress_user_id ON public.journey_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_journey_progress_module_id ON public.journey_progress(module_id);

-- RLS (Row Level Security) - Segurança
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journey_progress ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
-- Usuários podem ver e atualizar apenas seu próprio perfil
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.users;
CREATE POLICY "Users can view and update their own profile" ON public.users
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Políticas RLS para memories
-- Usuários podem ver, criar, atualizar e deletar apenas suas próprias memórias
DROP POLICY IF EXISTS "Users can manage their own memories" ON public.memories;
CREATE POLICY "Users can manage their own memories" ON public.memories
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para check_ins
-- Usuários podem ver, criar e atualizar apenas seus próprios check-ins
DROP POLICY IF EXISTS "Users can manage their own check-ins" ON public.check_ins;
CREATE POLICY "Users can manage their own check-ins" ON public.check_ins
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para chat_messages
-- Usuários podem ver e criar apenas suas próprias mensagens
DROP POLICY IF EXISTS "Users can manage their own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage their own chat messages" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para journey_progress
-- Usuários podem ver e atualizar apenas seu próprio progresso
DROP POLICY IF EXISTS "Users can manage their own journey progress" ON public.journey_progress;
CREATE POLICY "Users can manage their own journey progress" ON public.journey_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
