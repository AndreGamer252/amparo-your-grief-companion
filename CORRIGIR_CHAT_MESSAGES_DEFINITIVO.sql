-- SCRIPT DEFINITIVO PARA CORRIGIR A TABELA chat_messages
-- Execute este script no SQL Editor do Supabase
-- Este script remove a coluna 'sender' e garante que 'role' funcione corretamente

-- 1. Remove constraint NOT NULL de sender se existir (para poder migrar)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'sender'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.chat_messages 
        ALTER COLUMN sender DROP NOT NULL;
    END IF;
END $$;

-- 2. Cria coluna 'role' se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.chat_messages 
        ADD COLUMN role TEXT;
    END IF;
END $$;

-- 3. Migra dados de sender para role (se sender existir e role estiver vazio)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'sender'
    ) THEN
        UPDATE public.chat_messages 
        SET role = CASE 
            WHEN sender = 'user' THEN 'user'
            WHEN sender = 'amparo' THEN 'assistant'
            WHEN role IS NULL THEN 'user'
            ELSE role
        END
        WHERE role IS NULL OR role = '';
    END IF;
END $$;

-- 4. Torna role NOT NULL e adiciona constraint
DO $$ 
BEGIN
    -- Atualiza NULLs para 'user' antes de tornar NOT NULL
    UPDATE public.chat_messages 
    SET role = 'user' 
    WHERE role IS NULL OR role = '';
    
    -- Remove constraint antiga se existir
    ALTER TABLE public.chat_messages 
    DROP CONSTRAINT IF EXISTS chat_messages_role_check;
    
    -- Torna role NOT NULL
    ALTER TABLE public.chat_messages 
    ALTER COLUMN role SET NOT NULL;
    
    -- Adiciona constraint
    ALTER TABLE public.chat_messages 
    ADD CONSTRAINT chat_messages_role_check CHECK (role IN ('user', 'assistant'));
END $$;

-- 5. Remove coluna sender (não é mais necessária)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'chat_messages' 
        AND column_name = 'sender'
    ) THEN
        ALTER TABLE public.chat_messages 
        DROP COLUMN sender;
    END IF;
END $$;

-- 6. Adiciona conversation_id se não existir
DO $$ 
BEGIN
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
END $$;

-- 7. Adiciona colunas de tokens se não existirem
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

-- 8. Cria índices se não existirem
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON public.chat_messages(timestamp);

-- 9. Habilita RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 10. Remove políticas antigas
DROP POLICY IF EXISTS "Users can manage their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can update their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can delete their own chat messages" ON public.chat_messages;

-- 11. Cria políticas RLS
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

-- 12. Verifica a estrutura final
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'chat_messages'
ORDER BY ordinal_position;

-- 13. Mostra estatísticas
SELECT 
    COUNT(*) as total_mensagens,
    COUNT(DISTINCT user_id) as total_usuarios,
    COUNT(DISTINCT conversation_id) as total_conversas
FROM public.chat_messages;
