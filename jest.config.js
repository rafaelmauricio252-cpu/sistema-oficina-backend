// jest.config.js
module.exports = {
  // O ambiente de teste que será usado
  testEnvironment: 'node',

  // Padrões de arquivos que o Jest deve ignorar
  testPathIgnorePatterns: [
    '/node_modules/',
    '/pasta-dos-testes/' // Ignorar a pasta de testes antiga
  ],

  // Desliga a cobertura de código por padrão para não deixar os testes mais lentos
  collectCoverage: false,

  // Timeout para testes assíncronos (em milissegundos)
  testTimeout: 10000,

  // Limpa mocks entre os testes para garantir isolamento
  clearMocks: true,

  // Arquivos de setup globais que serão executados uma vez antes de todos os testes
  globalSetup: './jest.global-setup.js',
  globalTeardown: './jest.global-teardown.js',
};
