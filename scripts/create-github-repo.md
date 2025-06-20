# 🚀 Instruções para Criar Repositório GitHub

## 📋 Método 1: Via Interface Web (Recomendado)

### Passo a Passo
1. **Acesse**: https://github.com/new
2. **Configurações do Repositório**:
   - **Repository name**: `saas-barbearias`
   - **Description**: `Sistema SaaS completo para gestão de barbearias e salões - React + Node.js + TypeScript + PostgreSQL`
   - **Visibility**: ✅ Public
   - **Initialize repository**: ❌ **NÃO marcar** (já temos código local)
   - **Add .gitignore**: ❌ **NÃO marcar** (já temos)
   - **Choose a license**: ✅ MIT License

3. **Clique em**: "Create repository"

### Após Criação
O GitHub mostrará instruções para push de repositório existente. **IGNORE** essas instruções e use nossos scripts automatizados.

## 📋 Método 2: Via GitHub CLI (Alternativo)

Se você tem GitHub CLI instalado:

```bash
# Instalar GitHub CLI (se necessário)
# Windows: winget install GitHub.cli
# macOS: brew install gh

# Fazer login
gh auth login

# Criar repositório
gh repo create saas-barbearias --public --description "Sistema SaaS completo para gestão de barbearias e salões - React + Node.js + TypeScript + PostgreSQL" --clone=false
```

## 📋 Método 3: Via API com Token Pessoal

Se você tem um Personal Access Token:

```bash
curl -H "Authorization: token YOUR_GITHUB_TOKEN" \
     -H "Accept: application/vnd.github.v3+json" \
     https://api.github.com/user/repos \
     -d '{
       "name": "saas-barbearias",
       "description": "Sistema SaaS completo para gestão de barbearias e salões - React + Node.js + TypeScript + PostgreSQL",
       "private": false,
       "has_issues": true,
       "has_projects": true,
       "has_wiki": true,
       "auto_init": false,
       "license_template": "mit"
     }'
```

## ✅ Verificação

Após criar o repositório, verifique se:
- URL: `https://github.com/diegodonald/saas-barbearias`
- Visibilidade: Public
- Issues: Habilitadas
- Projects: Habilitados
- Wiki: Habilitado
- License: MIT

## 🚀 Próximos Passos Automáticos

Após criar o repositório, execute:

```bash
# Sincronizar código local com GitHub
npm run git:sync

# Ou manualmente:
git push -u origin main
git push -u origin development
```

## 🔧 Configurações Recomendadas

### Settings → General
- ✅ Issues
- ✅ Projects
- ✅ Wiki
- ✅ Discussions (opcional)

### Settings → Branches
- Default branch: `main`
- Branch protection rules (será configurado automaticamente)

### Settings → Actions
- ✅ Allow all actions and reusable workflows

### Settings → Security
- ✅ Dependency graph
- ✅ Dependabot alerts
- ✅ Dependabot security updates

## 📞 Suporte

Se encontrar problemas:
1. Verifique se está logado no GitHub
2. Confirme permissões da conta
3. Verifique se o nome `saas-barbearias` está disponível
4. Execute `npm run git:validate` para verificar configurações locais

---

**Status**: Aguardando criação manual do repositório  
**Próximo**: Sincronização automática do código
