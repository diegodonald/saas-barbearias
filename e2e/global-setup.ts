import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando setup global dos testes E2E...');

  // Aguardar serviços estarem prontos
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Verificar se backend está rodando
    console.log('⏳ Aguardando backend estar disponível...');
    await page.goto('http://localhost:3001/health', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    console.log('✅ Backend disponível');

    // Verificar se frontend está rodando
    console.log('⏳ Aguardando frontend estar disponível...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    console.log('✅ Frontend disponível');

    // Setup de dados de teste se necessário
    console.log('🗄️ Configurando dados de teste...');
    
    // Aqui você pode fazer chamadas para APIs de setup
    // ou executar scripts de seed específicos para testes
    
    console.log('✅ Setup global concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro no setup global:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
