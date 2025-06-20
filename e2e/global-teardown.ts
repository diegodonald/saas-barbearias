import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Iniciando limpeza global dos testes E2E...');

  try {
    // Limpeza de dados de teste
    console.log('🗑️ Limpando dados de teste...');
    
    // Aqui você pode fazer limpeza de dados específicos dos testes
    // Por exemplo, remover usuários de teste, agendamentos, etc.
    
    console.log('✅ Limpeza global concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro na limpeza global:', error);
    // Não falhar os testes por causa de erro na limpeza
  }
}

export default globalTeardown;
