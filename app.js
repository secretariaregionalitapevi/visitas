require("dotenv").config();

const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const cookieSession = require('cookie-session');
const regionais = require('./src/config/regionais');

let cookieSecure = false;


if (process.env.NODE_ENV === 'PRODUCTION') {
  cookieSecure = true
  dotenv.config({ path: '.env' });
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
  keys: [process.env.COOKIE], // Chave p/ cookie.
  maxAge: 2 * 24 * 60 * 60 * 1000, // 2 dias em milissegundos
  httpOnly: true,
  secure: cookieSecure,
  resave: false,
  saveUninitialized: true

}));

// Importe o middleware
const addAuthToResponse = require('./src/utils/authMiddleware');
const logger = require('./src/utils/logger');
global.logger = logger;

// Use o middleware antes das rotas
app.use(addAuthToResponse);

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
app.use(routes);

app.use((req, res, next) => {
  res.status(404).render('error', { 
      layout: false, 
      type: 'danger', 
      message: "Página não encontrada."
  });
});

//BANCO DE DADOS
var dbConnection = require('./src/config/dbConfig');
app.connection = dbConnection.connection();


// Inicialização do servidor
const port = process.env.PORT || 4222;
app.listen(port, () => {
  console.log(`Server running on ${port} port`);
});
