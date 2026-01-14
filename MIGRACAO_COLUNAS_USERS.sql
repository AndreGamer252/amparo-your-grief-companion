-- ============================================
-- Script SQL para adicionar colunas de tokens na tabela users
-- Execute este script no SQL Editor do Supabase se a tabela já existir
-- ============================================

-- Adiciona colunas de tokens se não existirem
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS total_tokens_used BIGINT DEFAULT 0 NOT NULL;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS input_tokens_used BIGINT DEFAULT 0 NOT NULL;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS output_tokens_used BIGINT DEFAULT 0 NOT NULL;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS token_limit BIGINT;

-- Atualiza valores existentes para 0 se forem NULL
UPDATE public.users
SET 
  total_tokens_used = COALESCE(total_tokens_used, 0),
  input_tokens_used = COALESCE(input_tokens_used, 0),
  output_tokens_used = COALESCE(output_tokens_used, 0)
WHERE 
  total_tokens_used IS NULL 
  OR input_tokens_used IS NULL 
  OR output_tokens_used IS NULL;
