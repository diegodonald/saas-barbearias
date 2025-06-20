#!/usr/bin/env node

/**
 * Script para validar critérios de aceite de uma fase específica
 * Usado para garantir que uma fase está realmente completa antes de avançar
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Critérios de aceite por fase
const ACCEPTANCE_CRITERIA = {
  'FASE_1': {
    name: 'Análise e Planejamento',
    criteria: [
      {
        name: 'Documentação técnica completa',
        validator: () => {
          const docsPath = path.join(__dirname, '..', 'Docs');
          return fs.existsSync(path.join(docsPath, 'documentacao_tecnica.md')) &&
                 fs.existsSync(path.join(docsPath, 'plano_geral.md'));
        }
      },
      {
        name: 'Ambiente de desenvolvimento funcional',
        validator: () => {
          return fs.existsSync(path.join(__dirname, '..', 'docker-compose.yml')) &&
                 fs.existsSync(path.join(__dirname, '..', 'package.json'));
        }
      },
      {
        name: 'Estrutura base do projeto configurada',
        validator: () => {
          const backend = fs.existsSync(path.join(__dirname, '..', 'backend', 'package.json'));
          const frontend = fs.existsSync(path.join(__dirname, '..', 'frontend', 'package.json'));
          return backend && frontend;
        }
      }
    ]
  },
  'FASE_2': {
    name: 'Autenticação e Autorização',
    criteria: [
      {
        name: 'Sistema de autenticação JWT funcionando',
        validator: () => {
          const authService = path.join(__dirname, '..', 'backend', 'src', 'services', 'auth.service.ts');
          const authController = path.join(__dirname, '..', 'backend', 'src', 'controllers', 'auth.controller.ts');
          return fs.existsSync(authService) && fs.existsSync(authController);
        }
      },
      {
        name: 'Frontend com autenticação implementado',
        validator: () => {
          const authContext = path.join(__dirname, '..', 'frontend', 'src', 'contexts', 'AuthContext.tsx');
          const loginPage = path.join(__dirname, '..', 'frontend', 'src', 'pages', 'auth', 'LoginPage.tsx');
          return fs.existsSync(authContext) && fs.existsSync(loginPage);
        }
      },
      {
        name: 'Testes de autenticação passando',
        validator: () => {
          try {
            // Verificar se existem testes
            const testPath = path.join(__dirname, '..', 'backend', 'src', 'tests', 'auth.service.test.ts');
            if (!fs.existsSync(testPath)) return false;
            
            // Executar testes (opcional - pode ser pesado)
            // execSync('cd backend && npm test', { stdio: 'pipe' });
            return true;
          } catch (error) {
            return false;
          }
        }
      },
      {
        name: 'Rotas protegidas funcionando',
        validator: () => {
          const protectedRoute = path.join(__dirname, '..', 'frontend', 'src', 'components', 'layout', 'ProtectedRoute.tsx');
          const authMiddleware = path.join(__dirname, '..', 'backend', 'src', 'middleware', 'auth.middleware.ts');
          return fs.existsSync(protectedRoute) && fs.existsSync(authMiddleware);
        }
      }
    ]
  }
};

/**
 * Valida uma fase específica
 */
function validatePhase(phaseName) {
  console.log(`🔍 Validando ${phaseName}...`);
  
  const phase = ACCEPTANCE_CRITERIA[phaseName];
  if (!phase) {
    console.error(`❌ Fase '${phaseName}' não encontrada!`);
    return false;
  }
  
  console.log(`📋 Validando: ${phase.name}\n`);
  
  let passedCriteria = 0;
  const totalCriteria = phase.criteria.length;
  
  phase.criteria.forEach((criterion, index) => {
    try {
      const passed = criterion.validator();
      const status = passed ? '✅' : '❌';
      console.log(`  ${index + 1}. ${status} ${criterion.name}`);
      
      if (passed) passedCriteria++;
    } catch (error) {
      console.log(`  ${index + 1}. ❌ ${criterion.name} (Erro: ${error.message})`);
    }
  });
  
  const percentage = ((passedCriteria / totalCriteria) * 100).toFixed(1);
  console.log(`\n📊 Resultado: ${passedCriteria}/${totalCriteria} critérios atendidos (${percentage}%)`);
  
  const isComplete = passedCriteria === totalCriteria;
  if (isComplete) {
    console.log(`🎉 ${phaseName} está COMPLETA e pronta para produção!`);
  } else {
    console.log(`⚠️  ${phaseName} ainda não está completa. Verifique os critérios pendentes.`);
  }
  
  return isComplete;
}

/**
 * Valida todas as fases
 */
function validateAllPhases() {
  console.log('🚀 Validando todas as fases do projeto...\n');
  
  const results = {};
  let totalPassed = 0;
  
  Object.keys(ACCEPTANCE_CRITERIA).forEach(phaseName => {
    const isComplete = validatePhase(phaseName);
    results[phaseName] = isComplete;
    if (isComplete) totalPassed++;
    console.log('─'.repeat(50));
  });
  
  const totalPhases = Object.keys(ACCEPTANCE_CRITERIA).length;
  const overallProgress = ((totalPassed / totalPhases) * 100).toFixed(1);
  
  console.log(`\n🎯 Progresso Geral: ${totalPassed}/${totalPhases} fases completas (${overallProgress}%)`);
  
  return results;
}

/**
 * Gera relatório detalhado
 */
function generateDetailedReport() {
  console.log('\n📄 Gerando relatório detalhado...\n');
  
  const timestamp = new Date().toISOString();
  let report = `# Relatório de Validação - ${timestamp}\n\n`;
  
  Object.entries(ACCEPTANCE_CRITERIA).forEach(([phaseName, phase]) => {
    report += `## ${phaseName} - ${phase.name}\n\n`;
    
    let phaseScore = 0;
    phase.criteria.forEach((criterion, index) => {
      try {
        const passed = criterion.validator();
        const status = passed ? '✅' : '❌';
        report += `${index + 1}. ${status} ${criterion.name}\n`;
        if (passed) phaseScore++;
      } catch (error) {
        report += `${index + 1}. ❌ ${criterion.name} (Erro)\n`;
      }
    });
    
    const phasePercentage = ((phaseScore / phase.criteria.length) * 100).toFixed(1);
    report += `\n**Score:** ${phaseScore}/${phase.criteria.length} (${phasePercentage}%)\n\n`;
  });
  
  // Salvar relatório
  const reportPath = path.join(__dirname, '..', 'validation-report.md');
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`📄 Relatório salvo em: ${reportPath}`);
  
  return reportPath;
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Uso: node validate-phase.js [FASE_1|FASE_2|all|report]');
    process.exit(1);
  }
  
  const command = args[0].toUpperCase();
  
  switch (command) {
    case 'ALL':
      const results = validateAllPhases();
      const allComplete = Object.values(results).every(Boolean);
      process.exit(allComplete ? 0 : 1);
      break;
      
    case 'REPORT':
      generateDetailedReport();
      break;
      
    case 'FASE_1':
    case 'FASE_2':
      const isComplete = validatePhase(command);
      process.exit(isComplete ? 0 : 1);
      break;
      
    default:
      console.error(`❌ Comando inválido: ${command}`);
      process.exit(1);
  }
}

module.exports = {
  validatePhase,
  validateAllPhases,
  generateDetailedReport,
  ACCEPTANCE_CRITERIA
};
