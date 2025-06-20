# SaaS Barbearias - Backend

API completa para sistema SaaS de gerenciamento de barbearias com integração Jira.

## 🚀 Funcionalidades

- ✅ **Sistema de Autenticação Completo** (JWT + Refresh Token)
- ✅ **Integração com Jira** para gerenciamento de tickets
- ✅ **Documentação Swagger/OpenAPI** automática
- ✅ **Testes Unitários** com >80% de cobertura
- ✅ **CI/CD Pipeline** com GitHub Actions
- ✅ **Validação de Dados** com Zod
- ✅ **Logging Estruturado** com Winston
- ✅ **Rate Limiting** e segurança
- ✅ **Health Check** endpoint

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm >= 9.0.0

## 🛠️ Instalação

```bash
# Clonar o repositório
git clone https://github.com/diegodonald/saas-barbearias.git
cd saas-barbearias/backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Executar migrações do banco
npx prisma migrate dev

# Gerar cliente Prisma
npx prisma generate

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Iniciar servidor com hot reload
npm run build        # Build para produção
npm start           # Iniciar servidor de produção

# Testes
npm test            # Executar testes unitários
npm run test:coverage # Testes com cobertura
npm run test:watch  # Testes em modo watch

# Qualidade de Código
npm run lint        # Verificar código com ESLint
npm run lint:fix    # Corrigir problemas automaticamente
npm run format      # Formatar código com Prettier
npm run format:check # Verificar formatação
npm run type-check  # Verificar tipos TypeScript

# CI/CD
npm run ci          # Pipeline completo (lint + type-check + test)
npm run ci:coverage # Pipeline com cobertura

# Banco de Dados
npm run db:migrate  # Executar migrações
npm run db:seed     # Popular banco com dados de teste
npm run db:studio   # Abrir Prisma Studio
npm run db:reset    # Resetar banco de dados
```

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Renovar token
- `GET /api/auth/me` - Perfil do usuário
- `PUT /api/auth/profile` - Atualizar perfil
- `POST /api/auth/change-password` - Alterar senha
- `POST /api/auth/forgot-password` - Solicitar reset de senha
- `POST /api/auth/reset-password` - Redefinir senha
- `POST /api/auth/logout` - Logout

### Jira Integration
- `POST /api/jira/issues` - Criar issue
- `GET /api/jira/issues/:key` - Obter issue
- `PUT /api/jira/issues/:key` - Atualizar issue
- `GET /api/jira/search` - Buscar issues
- `POST /api/jira/issues/:key/transitions` - Transições
- `POST /api/jira/issues/:key/comments` - Comentários

### Utilitários
- `GET /health` - Health check
- `GET /api/docs` - Documentação Swagger

## 📊 CI/CD Pipeline

O projeto utiliza GitHub Actions para CI/CD automático:

### Jobs Executados

1. **Lint & Type Check** 🔍
   - ESLint para qualidade de código
   - TypeScript type checking
   - Prettier para formatação

2. **Unit Tests** 🧪
   - Testes unitários com Jest
   - Cobertura de código
   - Upload para Codecov

3. **Security Analysis** 🔒
   - Auditoria de dependências
   - Verificação de vulnerabilidades

4. **Build** 🏗️
   - Build da aplicação
   - Upload de artefatos

5. **Deploy** 🚀 (apenas branch main)
   - Deploy automático para produção
   - Health check pós-deploy

### Configuração de Secrets

Para o pipeline funcionar completamente, configure os seguintes secrets no GitHub:

```bash
# Opcional - para análise de segurança
SNYK_TOKEN=your_snyk_token

# Para deploy (quando implementado)
PRODUCTION_API_URL=https://api.saas-barbearias.com
```

## 🧪 Testes

### Executar Testes

```bash
# Todos os testes
npm test

# Com cobertura
npm run test:coverage

# Modo watch
npm run test:watch

# Testes específicos
npm test -- auth.service.test.ts
```

### Cobertura Atual

- **AuthService**: 82.97% (>80% ✅)
- **JiraService**: 62.22%
- **Total**: 72.82%

## 📝 Documentação da API

A documentação completa da API está disponível via Swagger:

- **Desenvolvimento**: http://localhost:3001/api/docs
- **Produção**: https://api.saas-barbearias.com/api/docs

## 🔐 Variáveis de Ambiente

```bash
# Servidor
NODE_ENV=development
PORT=3001

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost:5432/saas_barbearias

# JWT
JWT_SECRET=your-super-secret-jwt-key-with-minimum-32-characters
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Jira (opcional)
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=SAAS

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logs
LOG_LEVEL=info

# Features
ENABLE_SWAGGER=true
ENABLE_CORS=true
```

## 🏗️ Arquitetura

```
src/
├── config/          # Configurações (DB, Logger, Swagger)
├── controllers/     # Controllers da API
├── middleware/      # Middlewares (Auth, Validation)
├── routes/          # Definição das rotas
├── services/        # Lógica de negócio
├── types/           # Tipos TypeScript
├── utils/           # Utilitários (JWT, Crypto)
├── tests/           # Testes unitários
└── server.ts        # Entrada da aplicação
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

**Diego Donald**
- GitHub: [@diegodonald](https://github.com/diegodonald)
- Email: diego@example.com
