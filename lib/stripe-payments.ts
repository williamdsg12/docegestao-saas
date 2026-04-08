import { stripe } from './stripe';

interface DestinationPaymentData {
  amount: number; // em centavos (ex: 5000 = R$ 50,00)
  currency: string;
  stripeAccountId: string; // ID da conta conectada (Lojista)
  applicationFeeAmount: number; // Taxa do Doce Gestão em centavos
  description?: string;
  orderId: string;
  metadata?: Record<string, any>;
}

/**
 * Cria um PaymentIntent com Destination Charge (Transferência Automática)
 * 
 * Nesta configuração, o pagamento é criado na conta da plataforma,
 * mas os fundos são transferidos automaticamente para a conta do lojista,
 * descontando a taxa da plataforma (application_fee_amount).
 */
export async function createDestinationPayment(data: DestinationPaymentData) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: data.currency || 'brl',
      payment_method_types: ['card'], // Adicionar 'pix' se houver suporte da conta conectada
      description: data.description || `Pedido #${data.orderId}`,
      metadata: {
        ...data.metadata,
        orderId: data.orderId,
      },
      // Configurações de Transferência
      transfer_data: {
        destination: data.stripeAccountId,
      },
      application_fee_amount: data.applicationFeeAmount,
      // Faz o lojista aparecer no extrato bancário do cliente (ajuda na redução de disputas)
      on_behalf_of: data.stripeAccountId,
      // Define quem é o merchant of record para a Stripe (importante para impostos/disputas)
      // Nota: Com Destination Charges, a plataforma ainda é tecnicamente responsável perante a Stripe,
      // mas usaremos Webhooks para reverter transferências em caso de estorno.
    });

    return paymentIntent;
  } catch (error: any) {
    console.error('[Stripe Payments] Erro ao criar PaymentIntent:', error.message);
    throw error;
  }
}

/**
 * Helper para calcular a taxa do Doce Gestão (ex: 1%)
 */
export function calculateDoceGestaoFee(amount: number): number {
  // Exemplo: 1% de taxa sobre o valor total
  // 0.01 * amount
  return Math.round(amount * 0.01);
}
