-- ============================================
-- SCHEMA DEFINITIVO - COPIE E COLE TUDO DE UMA VEZ
-- ============================================

-- PASSO 1: Remove tudo que existe
DROP TABLE IF EXISTS visits_log CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS user_churches CASCADE;
DROP TABLE IF EXISTS user_cities CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS churches CASCADE;
DROP TABLE IF EXISTS cities CASCADE;

-- PASSO 2: Cria a tabela cities (PRIMEIRA - sem dependências)
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PASSO 3: Cria a tabela churches (depende de cities)
CREATE TABLE churches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_churches_city_id ON churches(city_id);

-- PASSO 4: Cria a tabela users (sem dependências, mas outras dependem dela)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    obs TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    accept_lgpd BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- PASSO 5: Cria user_cities (depende de users e cities)
CREATE TABLE user_cities (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, city_id)
);
CREATE INDEX idx_user_cities_user_id ON user_cities(user_id);
CREATE INDEX idx_user_cities_city_id ON user_cities(city_id);

-- PASSO 6: Cria user_churches (depende de users e churches)
CREATE TABLE user_churches (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    church_id INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, church_id)
);
CREATE INDEX idx_user_churches_user_id ON user_churches(user_id);
CREATE INDEX idx_user_churches_church_id ON user_churches(church_id);

-- PASSO 7: Cria visits (depende de cities e churches)
CREATE TABLE visits (
    id SERIAL PRIMARY KEY,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    church_id INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    gvi INTEGER NOT NULL DEFAULT 0 CHECK (gvi >= 0),
    gvm INTEGER NOT NULL DEFAULT 0 CHECK (gvm >= 0),
    rf INTEGER NOT NULL DEFAULT 0 CHECK (rf >= 0),
    re INTEGER NOT NULL DEFAULT 0 CHECK (re >= 0),
    ip VARCHAR(45),
    os VARCHAR(255),
    browser VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_visits_month ON visits(month);
CREATE INDEX idx_visits_city_id ON visits(city_id);
CREATE INDEX idx_visits_church_id ON visits(church_id);
CREATE INDEX idx_visits_church_month ON visits(church_id, month);

-- PASSO 8: Cria visits_log (depende de visits, churches e users)
CREATE TABLE visits_log (
    id SERIAL PRIMARY KEY,
    visit_id INTEGER NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
    church_id INTEGER NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_visits_log_visit_id ON visits_log(visit_id);
CREATE INDEX idx_visits_log_user_id ON visits_log(user_id);
CREATE INDEX idx_visits_log_created_at ON visits_log(created_at);

-- PASSO 9: Cria função para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- PASSO 10: Cria triggers
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_churches_updated_at BEFORE UPDATE ON churches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PASSO 11: Verifica se deu certo
SELECT 
    COUNT(*) as total_tabelas,
    CASE 
        WHEN COUNT(*) = 7 THEN '✅ SUCESSO - Todas as 7 tabelas foram criadas!'
        ELSE '❌ ERRO - Faltam tabelas. Esperado: 7, Encontrado: ' || COUNT(*)::text
    END as status
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('cities', 'churches', 'users', 'user_cities', 'user_churches', 'visits', 'visits_log');

