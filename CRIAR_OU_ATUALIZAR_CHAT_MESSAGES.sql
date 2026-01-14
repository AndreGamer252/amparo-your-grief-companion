-- Script para criar ou atualizar a tabela chat_messages com todas as colunas necessárias
-- Execute este script no SQL Editor do Supabase

-- 1. Cria a tabela se não existir
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

-- 2. Migra de 'sender' para 'role' se necessário e adiciona colunas faltantes
DO $$ 
BEGIN
    -- Se existe 'sender' mas não 'role', migra os dados
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'sender'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'role'
    ) THEN
        -- Adiciona coluna role
        ALTER TABLE public.chat_messages 
        ADD COLUMN role TEXT;
        
        -- Migra dados: 'user' -> 'user', 'amparo' -> 'assistant'
        UPDATE public.chat_messages 
        SET role = CASE 
            WHEN sender = 'user' THEN 'user'
            WHEN sender = 'amparo' THEN 'assistant'
            ELSE 'user'
        END;
        
        -- Torna role NOT NULL
        ALTER TABLE public.chat_messages 
        ALTER COLUMN role SET NOT NULL;
        
        -- Adiciona constraint
        ALTER TABLE public.chat_messages 
        ADD CONSTRAINT chat_messages_role_check CHECK (role IN ('user', 'assistant'));
        
        -- Remove coluna sender antiga (opcional - pode manter se quiser)
        -- ALTER TABLE public.chat_messages DROP COLUMN sender;
    END IF;
    
    -- Adiciona role se não existir (e não há sender)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'role'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'sender'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN role TEXT NOT NULL DEFAULT 'user';
        -- Adiciona constraint depois
        ALTER TABLE public.chat_messages 
        ADD CONSTRAINT chat_messages_role_check CHECK (role IN ('user', 'assistant'));
    END IF;

    -- Adiciona conversation_id se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'conversation_id'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN conversation_id UUID;
    END IF;

    -- Adiciona prompt_tokens se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'prompt_tokens'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN prompt_tokens INTEGER DEFAULT 0;
    END IF;

    -- Adiciona completion_tokens se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'completion_tokens'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN completion_tokens INTEGER DEFAULT 0;
    END IF;

    -- Adiciona total_tokens se não existir
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'total_tokens'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN total_tokens INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Cria índices se não existirem
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp);

-- 4. Habilita RLS se não estiver habilitado
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 5. Remove políticas antigas e cria novas
DROP POLICY IF EXISTS "Users can manage their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.chat_messages;

-- 6. Cria políticas RLS
CREATE POLICY "Users can view their own chat messages"
ON public.chat_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages"
ON public.chat_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- 7. Verifica a estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'chat_messages'
ORDER BY ordinal_position;
