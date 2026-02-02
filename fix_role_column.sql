-- ============================================
-- Script de Correção: Adiciona coluna role se não existir
-- Execute este script se receber o erro: column "role" does not exist
-- ============================================

-- Verifica se a tabela users existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'users'
    ) THEN
        RAISE EXCEPTION 'Tabela users não existe! Execute o schema completo primeiro (supabase_schema.sql)';
    END IF;
END $$;

-- Adiciona a coluna role se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user';
        
        RAISE NOTICE '✅ Coluna role adicionada à tabela users com sucesso!';
    ELSE
        RAISE NOTICE 'ℹ️ Coluna role já existe na tabela users';
    END IF;
END $$;

-- Cria o índice se não existir
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Verifica a estrutura final
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Verificação concluída! A tabela users está configurada corretamente.';
END $$;

