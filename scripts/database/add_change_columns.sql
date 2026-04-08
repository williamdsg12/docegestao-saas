-- MIGRAÇÃO: Adiciona informações de troco aos pedidos
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS precisa_troco BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS valor_pago NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS troco NUMERIC(10, 2);

-- Comentários nas colunas para facilitar o entendimento
COMMENT ON COLUMN orders.precisa_troco IS 'Indica se o cliente precisa de troco para pagamento em dinheiro';
COMMENT ON COLUMN orders.valor_pago IS 'Valor total entregue pelo cliente em dinheiro';
COMMENT ON COLUMN orders.troco IS 'Valor do troco a ser entregue ao cliente';
