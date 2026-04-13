/**
 * Validates a CPF (Brazilian Individual Taxpayer Registry)
 */
export function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, "");
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
}

/**
 * Validates a CNPJ (Brazilian Business Taxpayer Registry)
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, "");
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  const size = cleanCNPJ.length - 2;
  const numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  const newSize = size + 1;
  const newNumbers = cleanCNPJ.substring(0, newSize);
  sum = 0;
  pos = newSize - 7;

  for (let i = newSize; i >= 1; i--) {
    sum += parseInt(newNumbers.charAt(newSize - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

/**
 * Validates a PIX key based on its type
 */
export function validatePIX(key: string, type: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "ALEATÓRIA"): boolean {
  switch (type) {
    case "CPF":
      return validateCPF(key);
    case "CNPJ":
      return validateCNPJ(key);
    case "EMAIL":
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(key);
    case "TELEFONE":
      const phoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/;
      return phoneRegex.test(key);
    case "ALEATÓRIA":
      // Validates UUID-like keys
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(key) || key.length >= 32;
    default:
      return false;
  }
}

/**
 * Formats a document number based on its type
 */
export function formatDocument(doc: string, type: "CPF" | "CNPJ"): string {
  const clean = doc.replace(/\D/g, "");
  if (type === "CPF") {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").substring(0, 14);
  }
  return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").substring(0, 18);
}
