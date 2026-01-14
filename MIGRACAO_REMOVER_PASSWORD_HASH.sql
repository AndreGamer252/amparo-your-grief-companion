-- ============================================
-- Script SQL para remover password_hash da tabela users
-- Execute este script no SQL Editor do Supabase
-- ============================================
-- 
-- Com Supabase Auth, as senhas são gerenciadas em auth.users,
-- então não precisamos de password_hash em public.users

-- Remove a constraint NOT NULL da coluna password_hash (se existir)
ALTER TABLE public.users
  ALTER COLUMN password_hash DROP NOT NULL;

-- Opcional: Se quiser remover a coluna completamente (não recomendado se houver dados antigos)
-- ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;
