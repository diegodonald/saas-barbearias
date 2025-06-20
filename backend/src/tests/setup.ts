// Configurar variáveis de ambiente para testes ANTES de importar qualquer módulo
process.env['NODE_ENV'] = 'test';
process.env['DATABASE_URL'] =
  process.env['DATABASE_URL']?.replace('saas_barbearias', 'saas_barbearias_test') ||
  'postgresql://postgres:postgres123@localhost:5432/saas_barbearias_test';
process.env['JWT_SECRET'] = 'test-jwt-secret-with-minimum-32-characters-for-security';
process.env['CORS_ORIGIN'] = 'http://localhost:3000';

// Configuração carregada automaticamente pelos módulos que precisam

// Setup global antes de todos os testes
beforeAll(async () => {
  // Configurações globais para testes
});

// Cleanup global após todos os testes
afterAll(async () => {
  // Limpeza global após testes
});

// Setup antes de cada teste
beforeEach(async () => {
  // Reset de mocks ou estado antes de cada teste
});

// Cleanup após cada teste
afterEach(async () => {
  // Limpeza após cada teste
});
