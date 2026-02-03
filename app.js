require("dotenv").config();

// Melhor logging temporário para depuração de crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason && reason.stack ? reason.stack : reason);
});
process.on('exit', (code) => {
  console.error('PROCESS EXIT with code:', code);
});

const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const cookieSession = require('cookie-session');
const regionais = require('./src/config/regionais');

let cookieSecure = false;

// Carrega .env específico se necessário
if (process.env.NODE_ENV === 'PRODUCTION') {
  // Em produção, habilite cookie secure apenas se explicitamente solicitado
  // via FORCE_COOKIE_SECURE=true. Isso evita problemas de cookies 'secure'
  // em ambientes locais onde NODE_ENV pode estar setado.
  dotenv.config({ path: '.env' });
  cookieSecure = process.env.FORCE_COOKIE_SECURE === 'true';
} else if (process.env.NODE_ENV === 'TEST') {
  dotenv.config({ path: '.env.test' });
}

const routes = require('./src/routes/routes');

const app = express();

// Configuração global das regionais
app.locals.regional = regionais.REGIONAL;

// Configuração do mecanismo de visualização EJS
app.set('views', path.join(__dirname, 'src/views'));
app.set('view engine', 'ejs');
app.set('trust proxy', true);


app.use(cookieSession({
  name: 'session',
  keys: [process.env.COOKIE || 'dev-default-cookie-key'], // Chave p/ cookie. Configure COOKIE env in production
  maxAge: 2 * 24 * 60 * 60 * 1000, // 2 dias em milissegundos
  httpOnly: true,
  secure: cookieSecure,
  resave: false,
  saveUninitialized: true,
  sameSite: 'lax'

}));

// Startup: cookie secure flag logged only when troubleshooting (removed verbose log)

// Importe o middleware
const addAuthToResponse = require('./src/utils/authMiddleware');
const logger = require('./src/utils/logger');
global.logger = logger;

// Use o middleware antes das rotas
app.use(addAuthToResponse);

// Middleware de debug: marca respostas com timestamp do servidor
app.use((req, res, next) => {
  try {
    res.setHeader('X-Server-Timestamp', Date.now());
    res.setHeader('X-Server-Route', req.originalUrl || req.url);
  } catch (e) {}
  next();
});

// Middleware para interpretar JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Middleware para cookies
app.use(cookieParser());

// Middleware para arquivos estáticos (CSS, JS, imagens, etc.)
app.use('/static', express.static(path.join(__dirname, 'public')));

// Configuração do layout padrão para as views
app.set('layout', 'layout');
app.use(expressLayouts);

// Rotas
// BANCO DE DADOS - inicializa antes das rotas para que controllers possam usar `req.app.connection`
var dbConnection = require('./src/config/dbConfig');
app.connection = dbConnection.connection();

app.use(routes);

// API pública (endpoints de teste/integracao)
app.use('/api', require('./src/routes/api'));

app.use((req, res, next) => {
  res.status(404).render('error', { 
      layout: false, 
      type: 'danger', 
      message: "Página não encontrada."
  });
});

// (a inicialização do DB foi movida acima das rotas)


// Inicialização do servidor com retry em caso de EADDRINUSE
const startingPort = parseInt(process.env.PORT, 10) || 4222;
const maxRetries = 10;

function startServer(port, remainingRetries) {
  const server = app.listen(port);

  server.on('listening', () => {
    console.log(`Server running on ${port} port`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && remainingRetries > 0) {
      console.warn(`Port ${port} in use, trying port ${port + 1} (${remainingRetries - 1} retries left)`);
      setTimeout(() => startServer(port + 1, remainingRetries - 1), 200);
    } else {
      console.error('Server failed to start:', err);
      process.exit(1);
    }
  });
}

startServer(startingPort, maxRetries);
