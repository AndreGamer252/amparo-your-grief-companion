-- Script para adicionar colunas de tokens na tabela chat_messages
-- Execute este script no SQL Editor do Supabase se as colunas não existirem

-- Verifica e adiciona prompt_tokens se não existir
DO $$ 
BEGIN
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
END $$;

-- Verifica e adiciona completion_tokens se não existir
DO $$ 
BEGIN
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
END $$;

-- Verifica e adiciona total_tokens se não existir
DO $$ 
BEGIN
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

-- Verifica as colunas existentes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'chat_messages'
ORDER BY ordinal_position;
