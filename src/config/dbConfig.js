const { Pool } = require('pg');

// Configuração do Supabase (PostgreSQL)
// O Supabase usa PostgreSQL, então podemos usar o cliente pg diretamente
const connectionString = process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'postgres'}`;

// Detecta se é Supabase (contém 'supabase.co' na URL) e habilita SSL automaticamente
const isSupabase = connectionString.includes('supabase.co');
const sslEnabled = process.env.DB_SSL === 'true' || isSupabase;

const pool = new Pool({
    connectionString: connectionString,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    max: 10, // connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Wrapper para compatibilidade com o código existente (mysql2 style)
// As queries já foram convertidas para usar $1, $2, etc., então não precisa converter
const connection = {
    query: async (query, params = []) => {
        try {
            // Executa a query diretamente (já está em formato PostgreSQL)
            const result = await pool.query(query, params);

            // Retorna no formato compatível com mysql2
            // mysql2 retorna [rows, fields], mas aqui retornamos [rows, { affectedRows }]
            return [
                result.rows,
                {
                    affectedRows: result.rowCount || 0,
                    insertId: result.rows[0]?.id || null
                }
            ];
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }
};

// Testa a conexão ao inicializar
pool.on('connect', () => {
    console.log('Connected to Supabase PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = {
    connection: function () {
        return connection;
    },
    pool: pool // Exporta também o pool direto para uso avançado
};
