/**
 * Utility for thermal printing orders.
 * Matches the official iFood Standard Layout exactly.
 */

import { format } from "date-fns"
import { formatCurrency, formatAddress } from "./formatters"

export const printOrder = (pedido: any, items: any[]) => {
  const isDelivery = !['retirada', 'pickup', 'balcao', 'mesa', 'retirada no local'].includes((pedido.delivery_type || pedido.order_type || '').toLowerCase())
  const subtotal = (pedido.total || 0) - (pedido.delivery_fee || 0) + (pedido.discount || 0)
  const merchantName = (window as any).__MERCHANT_NAME__ || "DOCE GESTÃO"

  const printWindow = window.open('', '_blank', 'width=400,height=600')
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pedido #${pedido.id.slice(0, 4).toUpperCase()}</title>
      <style>
        @page { size: auto; margin: 0; }
        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          line-height: 1.1;
          width: 80mm;
          margin: 0;
          padding: 10px;
          color: #000;
          background: #fff;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .item-row { display: flex; justify-content: space-between; align-items: flex-start; }
        .complement-row { display: flex; justify-content: space-between; font-size: 10px; margin-left: 10px; opacity: 0.8; }
        
        /* iFood Styled Boxes */
        .box-container {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          margin: 5px 0;
          padding: 2px 0;
        }
        .box-line {
          display: flex;
          justify-content: space-between;
          padding: 0 5px;
          border-left: 1px dashed #000;
          border-right: 1px dashed #000;
        }
        .box-edge-top { border-top: 1px dashed #000; display: flex; justify-content: space-between; position: relative; }
        .box-edge-top::before { content: '+'; position: absolute; left: -3px; top: -6px; }
        .box-edge-top::after { content: '+'; position: absolute; right: -3px; top: -6px; }
        
        .box-edge-bottom { border-bottom: 1px dashed #000; display: flex; justify-content: space-between; position: relative; margin-top: -1px; }
        .box-edge-bottom::before { content: '+'; position: absolute; left: -3px; bottom: -6px; }
        .box-edge-bottom::after { content: '+'; position: absolute; right: -3px; bottom: -6px; }

        .header-ticket { font-size: 14px; letter-spacing: 1px; }
        @media print {
          body { width: 100%; padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="text-center bold header-ticket">**** PEDIDO #${pedido.id.slice(0, 4).toUpperCase()} ****</div>
      <div class="text-center mb-1">
        ${isDelivery ? 'Delivery' : (pedido.delivery_type === 'retirada' || pedido.delivery_type === 'retirada no local') ? 'Pra Retirar' : 'Na Mesa'}
      </div>
      <div class="text-center bold" style="font-size: 12px; margin: 5px 0;">${merchantName.toUpperCase()}</div>
      
      <div class="item-row"><span>Data do Pedido:</span> <span>${format(new Date(pedido.created_at), "dd/MM/yyyy HH:mm:ss")}</span></div>
      ${isDelivery ? `<div class="item-row"><span>Data de Entrega:</span> <span>${format(new Date(Date.now() + 45*60000), "dd/MM/yyyy HH:mm:ss")}</span></div>` : ''}
      
      <div class="item-row"><span>Cliente:</span> <span class="bold">${(pedido.customers?.name || pedido.customer_name || 'Cliente Final').toUpperCase()}</span></div>
      <div class="item-row"><span>Telefone:</span> <span>${pedido.phone || pedido.customers?.phone || '---'}</span></div>
      <div class="item-row"><span>ID:</span> <span>${pedido.id.slice(0, 8)}</span></div>
      
      <div class="divider"></div>
      <div class="text-center bold">ITENS DO PEDIDO</div>
      
      ${(items || []).map(item => `
        <div style="margin-top: 6px;">
          <div class="item-row">
            <span class="bold">${item.quantity} UN</span>
            <span style="flex: 1; margin: 0 8px; text-transform: uppercase;">${item.name || item.product_name || item.products?.name}</span>
            <span class="bold">${formatCurrency(item.price || 0)}</span>
          </div>
          
          ${(item.extras || []).map((ex: any) => `
            <div class="complement-row">
              <span>${ex.quantity || 1} UN ${ex.name}</span>
              <span>${formatCurrency(ex.price || 0)}</span>
            </div>
          `).join('')}
          
          ${item.notes || item.observation ? `<div style="font-size: 9px; margin-left: 10px; font-style: italic;">Obs: ${item.notes || item.observation}</div>` : ''}
          
          <div class="item-row" style="margin-top: 2px; border-top: 0.5px dotted #000; padding-top: 2px;">
             <span style="font-size: 9px;">Total do item</span>
             <span class="bold">${formatCurrency((item.price * item.quantity) + (item.extras || []).reduce((acc: number, e: any) => acc + ((e.price || 0) * (e.quantity || 1)), 0))}</span>
          </div>
        </div>
      `).join('')}
      
      <div class="divider" style="margin-top: 15px;"></div>
      <div class="text-center bold" style="font-size: 10px; margin-bottom: 2px;">TOTAL</div>
      
      <div class="box-edge-top"></div>
      <div class="box-line"><span>| Valor total dos itens</span> <span>${formatCurrency(subtotal)} |</span></div>
      <div class="box-line"><span>| Taxa de Entrega</span> <span>${formatCurrency(pedido.delivery_fee || 0)} |</span></div>
      ${pedido.discount ? `<div class="box-line"><span>| Desconto (LOJA)</span> <span>- ${formatCurrency(pedido.discount)} |</span></div>` : ''}
      <div class="box-line bold" style="font-size: 12px; margin-top: 2px; border-top: 1px dashed #000;">
        <span>| VALOR TOTAL</span> <span>${formatCurrency(pedido.total)} |</span>
      </div>
      <div class="box-edge-bottom"></div>

      <div class="text-center bold" style="font-size: 10px; margin-top: 15px; margin-bottom: 2px;">FORMAS DE PAGAMENTO</div>
      <div class="box-edge-top"></div>
      <div class="box-line">
        <span>| ${pedido.payment_method?.toLowerCase().includes('online') ? 'Pagamento Online' : 'Pagar na Entrega'}</span>
        <span>${formatCurrency(pedido.total)} |</span>
      </div>
      <div class="box-line" style="font-size: 9px; opacity: 0.8;">
        <span>| ${pedido.payment_method?.toUpperCase().replace('_', ' ')}</span>
        <span>|</span>
      </div>
      ${pedido.change_for ? `
        <div class="box-line"><span>| Troco para</span> <span>${formatCurrency(pedido.change_for)} |</span></div>
      ` : ''}
      <div class="box-edge-bottom" style="margin-top: 2px;"></div>

      ${pedido.tax_id || pedido.notes ? `
        <div style="margin-top: 10px;">
          <div class="bold">Informações Adicionais</div>
          ${pedido.tax_id ? `<div>Incluir CPF na nota: <span class="bold">${pedido.tax_id}</span></div>` : ''}
          ${pedido.notes ? `<div>Obs: ${pedido.notes}</div>` : ''}
        </div>
      ` : ''}

      ${isDelivery ? `
        <div class="divider" style="margin-top: 20px;"></div>
        <div class="text-center bold" style="font-size: 13px;">ENTREGA PEDIDO #${pedido.id.slice(0, 4).toUpperCase()}</div>
        
        <div style="margin-top: 10px;">
          <div class="item-row"><span>Cliente:</span> <span class="bold">${(pedido.customers?.name || pedido.customer_name || 'Cliente Final').toUpperCase()}</span></div>
          <div class="bold" style="margin-top: 5px;">Endereço: ${pedido.address || formatAddress(pedido)}</div>
          ${pedido.delivery_complement ? `<div>Comp: ${pedido.delivery_complement}</div>` : ''}
          ${pedido.neighborhood || pedido.delivery_neighborhood ? `<div>Bairro: ${pedido.neighborhood || pedido.delivery_neighborhood}</div>` : ''}
          ${pedido.city || pedido.delivery_city ? `<div>Cidade: ${pedido.city || pedido.delivery_city}</div>` : ''}
          ${pedido.distance_km ? `<div>Distância: ${pedido.distance_km.toFixed(1)} km (Rota)</div>` : ''}
          ${pedido.estimated_time ? `<div>Horário Est.: ${pedido.estimated_time}</div>` : ''}
        </div>
      ` : ''}

      <div class="divider" style="margin-top: 20px;"></div>
      <div class="text-center" style="font-size: 9px; opacity: 0.5;">
        Impresso por: DoceGestão Pro (v1.2.0) - Desenvolvedor
      </div>

      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}
