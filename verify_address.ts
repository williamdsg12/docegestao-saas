
import { formatAddress } from './lib/formatters';

const mockOrders = [
  {
    order_type: 'delivery',
    delivery_address: 'Rua das Flores',
    delivery_number: '123',
    delivery_neighborhood: 'Centro',
    delivery_city: 'São Paulo'
  },
  {
    order_type: 'delivery',
    customers: {
      address: {
        street: 'Av. Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo'
      }
    }
  },
  {
    order_type: 'delivery',
    address: 'Endereço em string direta 456'
  },
  {
    order_type: 'pickup'
  }
];

console.log('--- TESTANDO FORMATADDRESS ---');
mockOrders.forEach((o, i) => {
  console.log(`Pedido ${i + 1}:`, formatAddress(o));
});
