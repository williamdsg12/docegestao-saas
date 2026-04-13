
const { calcularCustoUnitario, converterParaBase } = require('./utils/pricing');

function test() {
  console.log('--- TESTANDO LÓGICA DE PRECIFICAÇÃO ---');

  // Teste 1: kg para g
  const c1 = calcularCustoUnitario(6.58, 2, 'kg');
  console.log('Teste 1 (2kg por 6.58):', c1, 'esperado: 0.0033');
  
  // Teste 2: L para ml
  const c2 = calcularCustoUnitario(4.50, 1, 'L');
  console.log('Teste 2 (1L por 4.50):', c2, 'esperado: 0.0045');

  // Teste 3: g para g
  const c3 = calcularCustoUnitario(10.00, 500, 'g');
  console.log('Teste 3 (500g por 10.00):', c3, 'esperado: 0.02');

  // Teste 4: unidade
  const c4 = calcularCustoUnitario(12.00, 12, 'unidade');
  console.log('Teste 4 (12un por 12.00):', c4, 'esperado: 1.0');

  console.log('--- FIM DOS TESTES ---');
}

// Mocking the ES module for Node
global.converterParaBase = function(valor, unidade) {
  const u = unidade.toLowerCase();
  if (u === 'kg') return valor * 1000;
  if (u === 'l') return valor * 1000;
  return valor;
};

global.calcularCustoUnitario = function(preco, quantidade, unidadeCompra) {
  if (!preco || !quantidade || quantidade <= 0) return 0;
  const quantidadeBase = global.converterParaBase(quantidade, unidadeCompra);
  const custo = preco / quantidadeBase;
  return Number(custo.toFixed(4));
};

test();
