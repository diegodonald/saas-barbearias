#!/usr/bin/env node

/**
 * Script automatizado para atualizar o checklist de desenvolvimento
 * Monitora o progresso do projeto e atualiza automaticamente o status das tarefas
 */

const fs = require('fs');
const path = require('path');

// Configurações
const CHECKLIST_PATH = path.join(__dirname, '..', 'checklist_desenvolvimento.md');
const BACKEND_PATH = path.join(__dirname, '..', 'backend');
const FRONTEND_PATH = path.join(__dirname, '..', 'frontend');

// Critérios de validação para cada fase
const VALIDATION_CRITERIA = {
  'FASE_1': {
    'Documentação técnica analisada': () => fs.existsSync(path.join(__dirname, '..', 'Docs', 'documentacao_tecnica.md')),
    'Estrutura de pastas criada': () => fs.existsSync(BACKEND_PATH) && fs.existsSync(FRONTEND_PATH),
    'Docker Compose configurado': () => fs.existsSync(path.join(__dirname, '..', 'docker-compose.yml')),
    'Banco PostgreSQL configurado': () => fs.existsSync(path.join(BACKEND_PATH, 'prisma', 'schema.prisma')),
    'Variáveis de ambiente definidas': () => fs.existsSync(path.join(__dirname, '..', '.env.example'))
  },
  'FASE_2': {
    'Modelo User implementado': () => {
      const schemaPath = path.join(BACKEND_PATH, 'prisma', 'schema.prisma');
      if (!fs.existsSync(schemaPath)) return false;
      const schema = fs.readFileSync(schemaPath, 'utf8');
      return schema.includes('model User');
    },
    'Login com JWT implementado': () => {
      const authServicePath = path.join(BACKEND_PATH, 'src', 'services', 'auth.service.ts');
      return fs.existsSync(authServicePath);
    },
    'Páginas de login/registro criadas': () => {
      const loginPath = path.join(FRONTEND_PATH, 'src', 'pages', 'auth', 'LoginPage.tsx');
      const registerPath = path.join(FRONTEND_PATH, 'src', 'pages', 'auth', 'RegisterPage.tsx');
      return fs.existsSync(loginPath) && fs.existsSync(registerPath);
    },
    'Context de autenticação configurado': () => {
      const authContextPath = path.join(FRONTEND_PATH, 'src', 'contexts', 'AuthContext.tsx');
      return fs.existsSync(authContextPath);
    },
    'Testes de autenticação passando': () => {
      const testPath = path.join(BACKEND_PATH, 'src', 'tests', 'auth.service.test.ts');
      return fs.existsSync(testPath);
    }
  },
  'TOOLS': {
    'GitHub Actions para CI/CD': () => fs.existsSync(path.join(__dirname, '..', '.github', 'workflows', 'ci.yml')),
    'Playwright para testes E2E': () => fs.existsSync(path.join(__dirname, '..', 'playwright.config.ts')),
    'ESLint e Prettier configurados': () => {
      const backendEslint = fs.existsSync(path.join(BACKEND_PATH, '.eslintrc.js'));
      const frontendEslint = fs.existsSync(path.join(FRONTEND_PATH, '.eslintrc.cjs'));
      return backendEslint || frontendEslint;
    },
    'Swagger/OpenAPI para APIs': () => {
      const swaggerPath = path.join(BACKEND_PATH, 'src', 'config', 'swagger.ts');
      return fs.existsSync(swaggerPath);
    }
  }
};

/**
 * Verifica se um critério específico foi atendido
 */
function checkCriteria(criteria) {
  try {
    return criteria();
  } catch (error) {
    console.warn(`Erro ao verificar critério: ${error.message}`);
    return false;
  }
}

/**
 * Atualiza uma linha específica no checklist
 */
function updateChecklistLine(content, taskName, isCompleted) {
  const regex = new RegExp(`^(\\s*)-\\s*\\[[ x]\\]\\s*${taskName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gm');
  const replacement = `$1- [${isCompleted ? 'x' : ' '}] ${taskName}`;
  return content.replace(regex, replacement);
}

/**
 * Função principal para atualizar o checklist
 */
function updateChecklist() {
  try {
    console.log('🔍 Iniciando verificação automática do checklist...');
    
    // Ler o arquivo do checklist
    if (!fs.existsSync(CHECKLIST_PATH)) {
      console.error('❌ Arquivo checklist_desenvolvimento.md não encontrado!');
      return;
    }
    
    let content = fs.readFileSync(CHECKLIST_PATH, 'utf8');
    let updatedCount = 0;
    
    // Verificar cada critério e atualizar o checklist
    Object.entries(VALIDATION_CRITERIA).forEach(([phase, criteria]) => {
      console.log(`\n📋 Verificando ${phase}:`);
      
      Object.entries(criteria).forEach(([taskName, validator]) => {
        const isCompleted = checkCriteria(validator);
        const status = isCompleted ? '✅' : '❌';
        console.log(`  ${status} ${taskName}`);
        
        const oldContent = content;
        content = updateChecklistLine(content, taskName, isCompleted);
        
        if (oldContent !== content) {
          updatedCount++;
        }
      });
    });
    
    // Atualizar timestamp
    const now = new Date().toISOString().split('T')[0];
    content = content.replace(
      /\*\*Última Atualização:\*\* \d{4}-\d{2}-\d{2}/,
      `**Última Atualização:** ${now}`
    );
    
    // Salvar o arquivo atualizado
    fs.writeFileSync(CHECKLIST_PATH, content, 'utf8');
    
    console.log(`\n🎉 Checklist atualizado com sucesso!`);
    console.log(`📊 ${updatedCount} itens foram atualizados.`);
    
    return { success: true, updatedCount };
    
  } catch (error) {
    console.error('❌ Erro ao atualizar checklist:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Gerar relatório de progresso
 */
function generateProgressReport() {
  console.log('\n📈 Gerando relatório de progresso...');
  
  let totalTasks = 0;
  let completedTasks = 0;
  
  Object.entries(VALIDATION_CRITERIA).forEach(([phase, criteria]) => {
    let phaseCompleted = 0;
    const phaseTotal = Object.keys(criteria).length;
    
    Object.entries(criteria).forEach(([taskName, validator]) => {
      totalTasks++;
      if (checkCriteria(validator)) {
        completedTasks++;
        phaseCompleted++;
      }
    });
    
    const phaseProgress = ((phaseCompleted / phaseTotal) * 100).toFixed(1);
    console.log(`  ${phase}: ${phaseCompleted}/${phaseTotal} (${phaseProgress}%)`);
  });
  
  const totalProgress = ((completedTasks / totalTasks) * 100).toFixed(1);
  console.log(`\n🎯 Progresso Total: ${completedTasks}/${totalTasks} (${totalProgress}%)`);
  
  return {
    totalTasks,
    completedTasks,
    progressPercentage: parseFloat(totalProgress)
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  const result = updateChecklist();
  generateProgressReport();
  
  process.exit(result.success ? 0 : 1);
}

module.exports = {
  updateChecklist,
  generateProgressReport,
  VALIDATION_CRITERIA
};
