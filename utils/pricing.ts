/**
 * Lógica de precificação e conversão de unidades para confeitaria
 */

export type Unidade = 'g' | 'kg' | 'ml' | 'L' | 'unidade' | 'un';

/**
 * Converte um valor para a unidade base (gramas ou mililitros)
 */
export function converterParaBase(valor: number, unidade: Unidade): number {
  const u = unidade.toLowerCase();
  
  if (u === 'kg') return valor * 1000;
  if (u === 'l') return valor * 1000;
  
  // Se já estiver na base ou for unidade, retorna o valor original
  return valor;
}

/**
 * Calcula o custo unitário por grama, ml ou unidade
 * @param preco Preço total pago
 * @param quantidade Quantidade total comprada
 * @param unidadeCompra Unidade em que foi comprado (kg, L, etc)
 * @returns Custo por unidade base (R$ / g ou R$ / ml)
 */
export function calcularCustoUnitario(
  preco: number, 
  quantidade: number, 
  unidadeCompra: string
): number {
  if (!preco || !quantidade || quantidade <= 0) return 0;
  
  const quantidadeBase = converterParaBase(quantidade, unidadeCompra as Unidade);
  
  // Arredondamento para 4 casas decimais para precisão em receitas
  const custo = preco / quantidadeBase;
  return Number(custo.toFixed(4));
}

/**
 * Retorna a unidade base correspondente (g para kg, ml para L)
 */
export function getUnidadeBase(unidade: string): string {
  const u = unidade.toLowerCase();
  if (u === 'kg' || u === 'g') return 'g';
  if (u === 'l' || u === 'ml') return 'ml';
  return 'unidade';
}

/**
 * Formata um valor monetário com precisão variável
 */
export function formatarMoeda(valor: number, casas: number = 2): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}
