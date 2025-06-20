# 🔀 Fluxo de Trabalho Git - SaaS Barbearias

## 📋 Visão Geral

Este documento define o fluxo de trabalho Git estruturado para o projeto SaaS Barbearias, garantindo qualidade, rastreabilidade e automação do processo de desenvolvimento.

## 🌳 Estrutura de Branches

### Branch Principal
- **`main`** - Branch de produção
  - Código estável e testado
  - Deploy automático para produção
  - Protegida contra push direto
  - Requer Pull Request aprovado

### Branch de Desenvolvimento
- **`development`** - Branch de integração
  - Código em desenvolvimento
  - Testes de integração contínua
  - Base para features branches
  - Deploy automático para staging

### Branches de Feature
- **`feature/nome-da-funcionalidade`** - Desenvolvimento de funcionalidades
- **`bugfix/nome-do-bug`** - Correção de bugs
- **`hotfix/nome-do-hotfix`** - Correções urgentes em produção

## 🔄 Processo de Desenvolvimento

### 1. Criação de Feature Branch
```bash
# Atualizar development
git checkout development
git pull origin development

# Criar nova feature branch
git checkout -b feature/sistema-barbeiros
```

### 2. Desenvolvimento
```bash
# Fazer alterações no código
# Commits frequentes com mensagens descritivas

git add .
git commit -m "feat: implementar CRUD de barbeiros

- ✅ Modelo Barber criado
- ✅ Controller com validações
- ✅ Rotas protegidas implementadas
- ✅ Testes unitários adicionados"
```

### 3. Sincronização
```bash
# Sincronizar com development regularmente
git checkout development
git pull origin development
git checkout feature/sistema-barbeiros
git rebase development
```

### 4. Push e Pull Request
```bash
# Push da feature branch
git push origin feature/sistema-barbeiros

# Criar Pull Request via GitHub
# - Base: development
# - Compare: feature/sistema-barbeiros
# - Adicionar descrição detalhada
# - Solicitar review
```

### 5. Review e Merge
- Code review obrigatório
- Testes automatizados devem passar
- Checklist automaticamente atualizado
- Merge para development após aprovação

### 6. Deploy para Produção
```bash
# Após testes em staging
git checkout main
git merge development
git push origin main
# Deploy automático para produção
```

## 📝 Convenções de Commit

### Formato Padrão
```
tipo(escopo): descrição breve

Descrição detalhada (opcional)

- ✅ Item implementado
- 🔧 Item configurado
- 📝 Item documentado
```

### Tipos de Commit
- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **style**: Formatação (sem mudança de código)
- **refactor**: Refatoração de código
- **test**: Adição ou correção de testes
- **chore**: Tarefas de manutenção

### Exemplos
```bash
feat(auth): implementar sistema de refresh tokens

- ✅ Middleware de renovação automática
- ✅ Endpoint /api/auth/refresh
- ✅ Testes de expiração de token
- 🔧 Configuração de tempo de vida

fix(database): corrigir conexão com PostgreSQL

- 🐛 Pool de conexões configurado corretamente
- ✅ Timeout de conexão ajustado
- 📝 Logs de debug adicionados

docs(readme): atualizar instruções de instalação

- 📝 Seção de pré-requisitos atualizada
- 📝 Scripts npm documentados
- 📝 Exemplos de uso adicionados
```

## 🤖 Automação e Hooks

### Pre-commit Hook
```bash
# Executado antes de cada commit
- Linting (ESLint)
- Formatação (Prettier)
- Testes unitários rápidos
- Validação de tipos (TypeScript)
```

### Post-commit Hook
```bash
# Executado após cada commit
- Atualização automática do checklist
- Validação de critérios de aceite
- Geração de métricas de progresso
```

### Pre-push Hook
```bash
# Executado antes do push
- Testes completos (unitários + integração)
- Build de produção
- Verificação de vulnerabilidades
```

## 🚀 CI/CD Pipeline

### Pull Request
```yaml
# .github/workflows/pr.yml
- Checkout código
- Setup Node.js
- Instalar dependências
- Executar linting
- Executar testes
- Build de produção
- Análise de cobertura
- Comentário automático no PR
```

### Merge para Development
```yaml
# Deploy automático para staging
- Build e testes
- Deploy para ambiente de staging
- Testes E2E automatizados
- Notificação de sucesso/falha
```

### Merge para Main
```yaml
# Deploy automático para produção
- Build de produção
- Testes de smoke
- Deploy para produção
- Monitoramento pós-deploy
- Rollback automático se necessário
```

## 📊 Monitoramento e Métricas

### Métricas Automáticas
- **Progresso do projeto**: Atualizado a cada commit
- **Cobertura de testes**: Reportada em cada PR
- **Performance**: Lighthouse score em cada deploy
- **Vulnerabilidades**: Scan automático de segurança

### Relatórios
```bash
# Gerar relatório de progresso
npm run checklist:report

# Validar fase atual
npm run validate:phase2

# Métricas de qualidade
npm run quality:report
```

## 🔒 Proteções de Branch

### Branch Main
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes that create files
- ✅ Require linear history

### Branch Development
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Allow force pushes (para rebases)

## 🚨 Procedimentos de Emergência

### Hotfix em Produção
```bash
# Criar hotfix branch a partir da main
git checkout main
git pull origin main
git checkout -b hotfix/correcao-critica

# Fazer correção
git add .
git commit -m "hotfix: corrigir vulnerabilidade de segurança"

# Push e PR direto para main
git push origin hotfix/correcao-critica
# Criar PR: hotfix/correcao-critica → main
```

### Rollback
```bash
# Rollback automático via CI/CD
# ou manual se necessário
git checkout main
git revert HEAD
git push origin main
```

## 📋 Checklist de PR

### Antes de Criar PR
- [ ] Código testado localmente
- [ ] Testes passando
- [ ] Linting sem erros
- [ ] Documentação atualizada
- [ ] Checklist atualizado automaticamente

### Review Checklist
- [ ] Código segue padrões do projeto
- [ ] Testes adequados implementados
- [ ] Performance não degradada
- [ ] Segurança validada
- [ ] Documentação adequada

## 🎯 Metas de Qualidade

### Métricas Obrigatórias
- **Cobertura de testes**: > 80%
- **Performance**: Lighthouse > 90
- **Segurança**: 0 vulnerabilidades críticas
- **Linting**: 0 erros

### SLA de Review
- **Features**: 24h para review
- **Bugfixes**: 4h para review
- **Hotfixes**: 1h para review

---

**Responsável**: Diego Donald  
**Última Atualização**: 2024-12-20  
**Versão**: 1.0
