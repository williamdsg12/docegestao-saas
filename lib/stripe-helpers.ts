/**
 * Garante que a URL utilize HTTPS em ambientes que não sejam localhost.
 * Isso é um requisito obrigatório para redirects da Stripe em Livemode.
 */
export function ensureHttps(url: string | null | undefined): string {
    if (!url) return '';
    
    // Se for localhost ou 127.0.0.1, a Stripe permite HTTP
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
        return url;
    }
    
    // Em qualquer outro ambiente, forçar HTTPS
    return url;
}

export const STRIPE_REQUIREMENT_LABELS: Record<string, string> = {
  business_profile_mcc: "Categoria do negócio",
  business_profile_product_description: "Descrição dos produtos/serviços",
  business_profile_url: "Website da empresa",

  external_account: "Conta bancária para recebimentos",

  individual_first_name: "Nome",
  individual_last_name: "Sobrenome",
  individual_email: "E-mail",
  individual_phone: "Telefone",

  individual_dob_day: "Dia de nascimento",
  individual_dob_month: "Mês de nascimento",
  individual_dob_year: "Ano de nascimento",

  individual_id_number: "CPF / Documento de identidade",

  individual_address_line1: "Endereço",
  individual_address_city: "Cidade",
  individual_address_state: "Estado",
  individual_address_postal_code: "CEP",

  individual_verification_document: "Documento de verificação",
  individual_verification_additional_document: "Documento adicional",

  individual_political_exposure: "Declaração de exposição política",

  tos_acceptance_date: "Aceite dos termos Stripe",
  tos_acceptance_ip: "Confirmação de aceite dos termos",
}

export function formatStripeRequirements(requirements: string[]) {
  if (!requirements) return []
  return requirements.map(
    (req) =>
      STRIPE_REQUIREMENT_LABELS[req.toLowerCase()] ||
      req.replace(/_/g, " ")
  )
}
