# 🚀 Início Rápido - Sistema SaaS Barbearias

## ⚡ Setup em 5 Minutos

### 1. Pré-requisitos
```bash
# Verificar versões
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
docker --version
git --version
```

### 2. Clonar e Configurar
```bash
# Clonar repositório
git clone https://github.com/diegodonald/saas-barbearias.git
cd saas-barbearias

# Instalar dependências
npm run setup

# Configurar ambiente
cp .env.example .env
```

### 3. Subir Banco de Dados
```bash
# Subir PostgreSQL e Redis
npm run docker:up

# Executar migrações
npm run db:migrate

# Popular com dados iniciais (opcional)
npm run db:seed
```

### 4. Executar Aplicação
```bash
# Executar frontend e backend simultaneamente
npm run dev

# Ou executar separadamente
npm run dev:frontend  # http://localhost:3000
npm run dev:backend   # http://localhost:3001
```

### 5. Verificar Funcionamento
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001/api
- **Banco (Adminer):** http://localhost:8080
- **Prisma Studio:** `npm run db:studio`

---

## 🧪 Executar Testes

```bash
# Testes unitários
npm test

# Testes E2E (requer aplicação rodando)
npm run test:e2e

# Testes com coverage
npm run test:coverage
```

---

## 📋 Próximos Passos

### 1. Revisar Documentação
- [ ] Ler `checklist_desenvolvimento.md`
- [ ] Estudar `RELATORIO_IMPLEMENTACAO.md`
- [ ] Analisar `docs/` para entender regras de negócio

### 2. Configurar IDE
- [ ] Instalar extensões recomendadas (ESLint, Prettier, TypeScript)
- [ ] Configurar debugging para Node.js e React
- [ ] Configurar Git hooks (já incluído com Husky)

### 3. Começar Desenvolvimento
- [ ] Implementar sistema de autenticação (Fase 2)
- [ ] Criar componentes base do design system
- [ ] Configurar Storybook para documentação de componentes

---

## 🔧 Scripts Úteis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Executa frontend e backend |
| `npm run build` | Build de produção |
| `npm test` | Executa todos os testes |
| `npm run lint` | Linting do código |
| `npm run format` | Formatação com Prettier |
| `npm run db:migrate` | Executa migrações |
| `npm run db:seed` | Popula banco com dados |
| `npm run db:studio` | Interface visual do banco |
| `npm run docker:up` | Sobe containers |
| `npm run docker:down` | Para containers |

---

## 🚨 Troubleshooting

### Problema: Porta já em uso
```bash
# Verificar processos nas portas
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Matar processo (Windows)
taskkill /PID <PID> /F
```

### Problema: Erro de conexão com banco
```bash
# Verificar se containers estão rodando
docker ps

# Recriar containers
npm run docker:down
npm run docker:up

# Verificar logs
npm run docker:logs
```

### Problema: Dependências desatualizadas
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install

# Ou usar npm ci para instalação limpa
npm ci
```

---

## 📞 Suporte

- **Documentação:** Veja arquivos em `/docs`
- **Issues:** Use GitHub Issues para bugs
- **Dúvidas:** Consulte `checklist_desenvolvimento.md`

---

**🎯 Meta:** Ter o ambiente funcionando em menos de 5 minutos!**
