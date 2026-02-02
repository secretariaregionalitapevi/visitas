# Guia de Configuração - APP Itapevi

## Pré-requisitos

1. **Node.js** instalado (versão 14 ou superior)
2. **MySQL** instalado e rodando
3. **Banco de dados** criado

## Passos para Configuração

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.test` na raiz do projeto com o seguinte conteúdo:

```env
# Configuração de Ambiente de Teste
NODE_ENV=TEST

# Porta do servidor
PORT=4222

# Configuração do Banco de Dados MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=ccbro-beta

# Chave secreta para cookies (altere para uma chave segura)
COOKIE=sua-chave-secreta-aqui
```

**Importante:** 
- Substitua `sua_senha_mysql` pela senha do seu MySQL
- Substitua `sua-chave-secreta-aqui` por uma chave aleatória segura
- Certifique-se de que o banco de dados `ccbro-beta` existe

### 3. Criar o Banco de Dados

Certifique-se de que o banco de dados MySQL está criado:

```sql
CREATE DATABASE IF NOT EXISTS `ccbro-beta`;
```

### 4. Executar o Sistema

Para desenvolvimento (Windows):
```bash
npm run start-dev-win
```

Para desenvolvimento (Linux/Mac):
```bash
npm run start-dev
```

Para produção:
```bash
npm start
```

O servidor estará rodando em `http://localhost:4222` (ou na porta configurada no .env.test)

## Estrutura do Projeto

- `app.js` - Arquivo principal da aplicação
- `src/` - Código fonte
  - `config/` - Configurações (banco de dados, regionais)
  - `controllers/` - Controladores das rotas
  - `routes/` - Definição de rotas
  - `services/` - Lógica de negócio
  - `utils/` - Utilitários (middleware, logger, etc.)
  - `views/` - Templates EJS
- `public/` - Arquivos estáticos (CSS, JS, imagens)

## Problemas Comuns

### Erro de conexão com banco de dados
- Verifique se o MySQL está rodando
- Confirme as credenciais no arquivo `.env.test`
- Certifique-se de que o banco de dados existe

### Erro de módulos não encontrados
- Execute `npm install` novamente
- Verifique se todas as dependências estão no `package.json`

### Porta já em uso
- Altere a porta no arquivo `.env.test`
- Ou encerre o processo que está usando a porta 4222

