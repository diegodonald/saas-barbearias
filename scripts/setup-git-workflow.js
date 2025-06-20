#!/usr/bin/env node

/**
 * Script para configurar automaticamente o fluxo de trabalho Git
 * Configura branches, hooks, e proteções necessárias
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔀 Configurando fluxo de trabalho Git...\n');

/**
 * Executa comando Git com tratamento de erro
 */
function gitCommand(command, description) {
  try {
    console.log(`🔧 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - Concluído`);
    return result.trim();
  } catch (error) {
    console.log(`⚠️  ${description} - ${error.message.split('\n')[0]}`);
    return null;
  }
}

/**
 * Configurar branches principais
 */
function setupBranches() {
  console.log('\n📋 Configurando branches...');
  
  // Verificar se estamos na branch correta
  const currentBranch = gitCommand('git branch --show-current', 'Verificando branch atual');
  
  if (currentBranch !== 'development') {
    gitCommand('git checkout development', 'Mudando para branch development');
  }
  
  // Configurar upstream para development
  gitCommand('git push -u origin development', 'Configurando upstream para development');
  
  // Voltar para main
  gitCommand('git checkout main', 'Voltando para branch main');
  gitCommand('git push -u origin main', 'Configurando upstream para main');
}

/**
 * Configurar hooks do Git
 */
function setupHooks() {
  console.log('\n🪝 Configurando hooks do Git...');
  
  const hooksDir = path.join(process.cwd(), '.husky');
  
  // Verificar se Husky está instalado
  if (!fs.existsSync(hooksDir)) {
    console.log('📦 Instalando Husky...');
    try {
      execSync('npx husky install', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️  Erro ao instalar Husky:', error.message);
      return;
    }
  }
  
  // Configurar hooks
  const hooks = [
    {
      name: 'pre-commit',
      script: `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Executando verificações pre-commit..."

# Linting
npm run lint:fix

# Formatação
npm run format

# Testes rápidos
npm run test:quick 2>/dev/null || npm test

echo "✅ Pre-commit verificações concluídas"`
    },
    {
      name: 'post-commit',
      script: `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔄 Atualizando checklist pós-commit..."

# Atualizar checklist
npm run checklist:update

# Se houve mudanças, fazer commit automático
if [ -n "$(git status --porcelain checklist_desenvolvimento.md)" ]; then
  echo "📝 Checklist atualizado automaticamente"
  git add checklist_desenvolvimento.md
  git commit -m "chore: atualizar checklist automaticamente [skip ci]"
fi

echo "✅ Checklist atualizado"`
    },
    {
      name: 'pre-push',
      script: `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🚀 Executando verificações pre-push..."

# Testes completos
npm test

# Build de produção
npm run build

# Validação de fase (se aplicável)
npm run validate:all 2>/dev/null || echo "⚠️  Validação de fase não disponível"

echo "✅ Pre-push verificações concluídas"`
    }
  ];
  
  hooks.forEach(hook => {
    const hookPath = path.join(hooksDir, hook.name);
    fs.writeFileSync(hookPath, hook.script, { mode: 0o755 });
    console.log(`✅ Hook ${hook.name} configurado`);
  });
}

/**
 * Configurar templates de commit
 */
function setupCommitTemplate() {
  console.log('\n📝 Configurando template de commit...');
  
  const template = `# Tipo(escopo): descrição breve
#
# Tipos disponíveis:
# feat:     Nova funcionalidade
# fix:      Correção de bug
# docs:     Documentação
# style:    Formatação (sem mudança de código)
# refactor: Refatoração de código
# test:     Adição ou correção de testes
# chore:    Tarefas de manutenção
#
# Exemplo:
# feat(auth): implementar sistema de refresh tokens
#
# Descrição detalhada (opcional):
# - ✅ Item implementado
# - 🔧 Item configurado
# - 📝 Item documentado
#
# Closes #123`;
  
  const templatePath = path.join(process.cwd(), '.gitmessage');
  fs.writeFileSync(templatePath, template);
  
  gitCommand('git config commit.template .gitmessage', 'Configurando template de commit');
}

/**
 * Configurar aliases úteis do Git
 */
function setupGitAliases() {
  console.log('\n🔧 Configurando aliases do Git...');
  
  const aliases = [
    ['git config alias.st', 'status'],
    ['git config alias.co', 'checkout'],
    ['git config alias.br', 'branch'],
    ['git config alias.ci', 'commit'],
    ['git config alias.unstage', 'reset HEAD --'],
    ['git config alias.last', 'log -1 HEAD'],
    ['git config alias.visual', '!gitk'],
    ['git config alias.tree', 'log --graph --pretty=format:"%C(yellow)%h%Creset -%C(red)%d%Creset %s %C(green)(%cr) %C(bold blue)<%an>%Creset" --abbrev-commit'],
    ['git config alias.feature', 'checkout -b feature/'],
    ['git config alias.bugfix', 'checkout -b bugfix/'],
    ['git config alias.hotfix', 'checkout -b hotfix/']
  ];
  
  aliases.forEach(([command, alias]) => {
    gitCommand(`${command} "${alias}"`, `Configurando alias: ${alias}`);
  });
}

/**
 * Criar arquivo de configuração do projeto
 */
function createProjectConfig() {
  console.log('\n⚙️  Criando configuração do projeto...');
  
  const config = {
    project: {
      name: 'SaaS Barbearias',
      version: '1.0.0',
      repository: 'https://github.com/diegodonald/saas-barbearias.git'
    },
    git: {
      mainBranch: 'main',
      developmentBranch: 'development',
      featurePrefix: 'feature/',
      bugfixPrefix: 'bugfix/',
      hotfixPrefix: 'hotfix/'
    },
    automation: {
      checklistUpdate: true,
      autoValidation: true,
      progressTracking: true
    },
    quality: {
      minTestCoverage: 80,
      requireLinting: true,
      requireFormatting: true,
      requireBuild: true
    }
  };
  
  const configPath = path.join(process.cwd(), '.project-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Configuração do projeto criada');
}

/**
 * Validar configuração
 */
function validateSetup() {
  console.log('\n🔍 Validando configuração...');
  
  const checks = [
    {
      name: 'Repositório Git inicializado',
      check: () => fs.existsSync('.git')
    },
    {
      name: 'Remote origin configurado',
      check: () => {
        try {
          execSync('git remote get-url origin', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      }
    },
    {
      name: 'Hooks do Husky configurados',
      check: () => fs.existsSync('.husky/pre-commit')
    },
    {
      name: 'Template de commit configurado',
      check: () => fs.existsSync('.gitmessage')
    },
    {
      name: 'Scripts de automação disponíveis',
      check: () => {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.scripts && packageJson.scripts['checklist:update'];
      }
    }
  ];
  
  let allPassed = true;
  checks.forEach(check => {
    const passed = check.check();
    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${check.name}`);
    if (!passed) allPassed = false;
  });
  
  return allPassed;
}

/**
 * Função principal
 */
function main() {
  try {
    setupBranches();
    setupHooks();
    setupCommitTemplate();
    setupGitAliases();
    createProjectConfig();
    
    console.log('\n🎉 Configuração do fluxo de trabalho Git concluída!');
    
    if (validateSetup()) {
      console.log('\n✅ Todas as verificações passaram!');
      console.log('\n📋 Próximos passos:');
      console.log('1. Criar repositório no GitHub (se ainda não existir)');
      console.log('2. Configurar proteções de branch no GitHub');
      console.log('3. Configurar secrets para CI/CD');
      console.log('4. Fazer primeiro push: git push origin main');
      console.log('5. Fazer push da branch development: git push origin development');
    } else {
      console.log('\n⚠️  Algumas verificações falharam. Verifique os erros acima.');
    }
    
  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  setupBranches,
  setupHooks,
  setupCommitTemplate,
  setupGitAliases,
  validateSetup
};
