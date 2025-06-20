#!/usr/bin/env node

/**
 * Script para sincronizar código local com repositório GitHub
 * Faz push das branches main e development e configura proteções
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Sincronizando código com GitHub...\n');

/**
 * Executa comando com tratamento de erro
 */
function runCommand(command, description) {
  try {
    console.log(`🔧 ${description}...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`✅ ${description} - Concluído`);
    return { success: true, output: result.trim() };
  } catch (error) {
    console.log(`❌ ${description} - Erro: ${error.message.split('\n')[0]}`);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar se repositório remoto existe
 */
function checkRemoteRepo() {
  console.log('🔍 Verificando repositório remoto...');
  
  const result = runCommand('git ls-remote origin', 'Testando conexão com repositório remoto');
  
  if (!result.success) {
    console.log('\n❌ Repositório remoto não encontrado!');
    console.log('📋 Por favor, crie o repositório primeiro:');
    console.log('   1. Acesse: https://github.com/new');
    console.log('   2. Nome: saas-barbearias');
    console.log('   3. Público, sem inicialização');
    console.log('   4. Execute novamente: npm run git:sync\n');
    return false;
  }
  
  console.log('✅ Repositório remoto encontrado!');
  return true;
}

/**
 * Sincronizar branches
 */
function syncBranches() {
  console.log('\n📤 Sincronizando branches...');
  
  // Push da branch main
  const mainResult = runCommand('git push -u origin main', 'Push da branch main');
  if (!mainResult.success) {
    return false;
  }
  
  // Push da branch development
  const devResult = runCommand('git push -u origin development', 'Push da branch development');
  if (!devResult.success) {
    console.log('⚠️  Branch development não foi enviada, mas main foi sincronizada');
  }
  
  return true;
}

/**
 * Configurar proteções de branch via API (se possível)
 */
function configureBranchProtection() {
  console.log('\n🛡️  Configurando proteções de branch...');
  
  // Verificar se gh CLI está disponível
  const ghCheck = runCommand('gh --version', 'Verificando GitHub CLI');
  
  if (ghCheck.success) {
    console.log('📋 Configurando proteções via GitHub CLI...');
    
    const protectionCommands = [
      'gh api repos/diegodonald/saas-barbearias/branches/main/protection -X PUT --input -',
    ];
    
    const protectionConfig = JSON.stringify({
      required_status_checks: {
        strict: true,
        contexts: ['ci/backend-tests', 'ci/frontend-tests', 'ci/e2e-tests']
      },
      enforce_admins: false,
      required_pull_request_reviews: {
        required_approving_review_count: 1,
        dismiss_stale_reviews: true,
        require_code_owner_reviews: false
      },
      restrictions: null,
      allow_force_pushes: false,
      allow_deletions: false
    });
    
    try {
      execSync(`echo '${protectionConfig}' | gh api repos/diegodonald/saas-barbearias/branches/main/protection -X PUT --input -`, { stdio: 'pipe' });
      console.log('✅ Proteções de branch configuradas via CLI');
    } catch (error) {
      console.log('⚠️  Proteções de branch devem ser configuradas manualmente no GitHub');
      console.log('   Settings → Branches → Add rule para branch main');
    }
  } else {
    console.log('⚠️  GitHub CLI não encontrado');
    console.log('📋 Configure proteções manualmente:');
    console.log('   1. Acesse: https://github.com/diegodonald/saas-barbearias/settings/branches');
    console.log('   2. Add rule para branch "main"');
    console.log('   3. ✅ Require pull request reviews');
    console.log('   4. ✅ Require status checks to pass');
    console.log('   5. ✅ Require branches to be up to date');
  }
}

/**
 * Verificar sincronização
 */
function verifySyncronization() {
  console.log('\n🔍 Verificando sincronização...');
  
  const checks = [
    {
      name: 'Branch main sincronizada',
      command: 'git log origin/main --oneline -1',
      description: 'Verificando último commit na branch main remota'
    },
    {
      name: 'Branch development sincronizada',
      command: 'git log origin/development --oneline -1 2>/dev/null || echo "Branch development não encontrada"',
      description: 'Verificando branch development remota'
    }
  ];
  
  let allSynced = true;
  
  checks.forEach(check => {
    const result = runCommand(check.command, check.description);
    if (!result.success) {
      allSynced = false;
    }
  });
  
  return allSynced;
}

/**
 * Gerar relatório de sincronização
 */
function generateSyncReport() {
  console.log('\n📊 Gerando relatório de sincronização...');
  
  const report = {
    timestamp: new Date().toISOString(),
    repository: 'https://github.com/diegodonald/saas-barbearias',
    branches: {},
    status: 'success'
  };
  
  // Verificar status das branches
  try {
    const mainCommit = execSync('git log origin/main --oneline -1', { encoding: 'utf8' }).trim();
    report.branches.main = {
      synced: true,
      lastCommit: mainCommit
    };
  } catch (error) {
    report.branches.main = { synced: false, error: error.message };
    report.status = 'partial';
  }
  
  try {
    const devCommit = execSync('git log origin/development --oneline -1', { encoding: 'utf8' }).trim();
    report.branches.development = {
      synced: true,
      lastCommit: devCommit
    };
  } catch (error) {
    report.branches.development = { synced: false, error: 'Branch não encontrada' };
  }
  
  // Salvar relatório
  fs.writeFileSync('sync-report.json', JSON.stringify(report, null, 2));
  console.log('✅ Relatório salvo em: sync-report.json');
  
  return report;
}

/**
 * Função principal
 */
function main() {
  try {
    // Verificar repositório remoto
    if (!checkRemoteRepo()) {
      process.exit(1);
    }
    
    // Sincronizar branches
    if (!syncBranches()) {
      console.log('\n❌ Falha na sincronização das branches');
      process.exit(1);
    }
    
    // Configurar proteções
    configureBranchProtection();
    
    // Verificar sincronização
    if (verifySyncronization()) {
      console.log('\n✅ Sincronização concluída com sucesso!');
    } else {
      console.log('\n⚠️  Sincronização parcial - verifique os logs acima');
    }
    
    // Gerar relatório
    const report = generateSyncReport();
    
    console.log('\n🎉 Repositório GitHub configurado!');
    console.log(`📍 URL: ${report.repository}`);
    console.log('📋 Próximos passos:');
    console.log('   1. Verificar repositório no GitHub');
    console.log('   2. Configurar proteções de branch (se necessário)');
    console.log('   3. Configurar secrets para CI/CD');
    console.log('   4. Iniciar desenvolvimento da Fase 3');
    
  } catch (error) {
    console.error('\n❌ Erro durante sincronização:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = {
  checkRemoteRepo,
  syncBranches,
  configureBranchProtection,
  verifySyncronization
};
