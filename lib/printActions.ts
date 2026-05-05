import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import { toast } from "sonner";

export interface PrintOrderData {
  id: string;
  created_at: string;
  order_type: string;
  customer_name: string;
  customer_phone: string;
  address?: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  paid: boolean;
  items: any[];
}

export const generateNF = (order: PrintOrderData) => {
  // Version for basic simplified NF as specified
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.text("NOTA FISCAL", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.text("Estabelecimento: Doce Gestão Confeitaria", 20, 40);
  doc.text("CNPJ: 00.000.000/0001-00", 20, 45);
  doc.text("Endereço: Rua dos Doces, 123 - Centro", 20, 50);
  
  doc.line(20, 55, 190, 55);
  doc.text(`Pedido Nº: #${order.id.slice(-4).toUpperCase()}`, 20, 65);
  doc.text(`Data: ${format(new Date(order.created_at), "dd/MM/yy HH:mm")}`, 140, 65);
  doc.text(`Tipo: ${order.order_type === 'delivery' ? 'Delivery' : 'Retirada'}`, 20, 70);
  
  doc.line(20, 75, 190, 75);
  doc.text("DADOS DO CLIENTE", 20, 85);
  doc.text(`Nome: ${order.customer_name}`, 20, 95);
  doc.text(`Telefone: ${order.customer_phone}`, 20, 100);
  doc.text(`Endereço: ${order.address || "Não informado"}`, 20, 105);
  
  doc.line(20, 110, 190, 110);
  doc.text("ITENS", 20, 120);
  
  const tableData = order.items.map(item => [
    `${item.quantity}x`,
    item.name,
    `R$ ${Number(item.price).toFixed(2)}`
  ]);
  
  (doc as any).autoTable({
    startY: 125,
    head: [['Qtd', 'Produto', 'Valor']],
    body: tableData,
    theme: 'plain',
    headStyles: { fontStyle: 'bold' }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text(`Subtotal: R$ ${Number(order.subtotal).toFixed(2)}`, 140, finalY);
  doc.text(`Taxa de entrega: R$ ${Number(order.delivery_fee).toFixed(2)}`, 140, finalY + 5);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: R$ ${Number(order.total).toFixed(2)}`, 140, finalY + 12);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Forma de pagamento: ${order.payment_method || 'Não inf.'}`, 20, finalY + 20);
  doc.text(`Status: ${order.paid ? 'Pago' : 'Não pago'}`, 20, finalY + 25);
  
  doc.save(`nota-fiscal-pedido-${order.id.slice(-4)}.pdf`);
  toast.success("Nota fiscal gerada com sucesso", { duration: 3000 });
};

export const printKitchenTicket = (order: PrintOrderData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemsHtml = order.items.map(item => `
    <div style="margin-bottom: 10px;">
      <div style="display: flex; gap: 10px; font-weight: bold;">
        <span>[ ${item.quantity}x ]</span>
        <span>${item.name}</span>
      </div>
      ${item.observation ? `<div style="margin-left: 45px; font-size: 10px;">- ${item.observation}</div>` : ''}
    </div>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Ticket Cozinha - #${order.id.slice(-4)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            width: 80mm; 
            margin: 0; 
            padding: 10px; 
            font-family: 'Courier New', monospace; 
            font-size: 12px;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .order-number { font-size: 24px; font-weight: bold; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="center bold">🍴 COZINHA</div>
        <div class="divider"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div class="order-number">#${order.id.slice(-4).toUpperCase()}</div>
          <div class="bold">${order.order_type.toUpperCase()}</div>
        </div>
        <div class="divider"></div>
        <div>DATA: ${format(new Date(order.created_at), "dd/MM/yy")}  HORA: ${format(new Date(order.created_at), "HH:mm")}</div>
        <div class="divider"></div>
        <div class="bold">ITENS DO PEDIDO:</div>
        <div class="divider"></div>
        ${itemsHtml}
        <div class="divider" style="border-top-style: solid; border-width: 2px;"></div>
        <div><span class="bold">CLIENTE:</span> ${order.customer_name}</div>
        <div><span class="bold">ENDEREÇO:</span> ${order.address || "Retirada"}</div>
        <div class="divider" style="border-top-style: solid; border-width: 2px;"></div>
        <div class="center bold" style="margin-top: 10px;">*** PREPARAR COM URGÊNCIA ***</div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.print();
  toast.success("✓ Ticket de cozinha enviado para impressão", { duration: 3000 });
};

export const downloadClientPDF = (order: PrintOrderData) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.text("DOCE GESTÃO", 105, 20, { align: "center" });
  doc.setFontSize(10);
  doc.text("www.docegestao.com.br", 105, 27, { align: "center" });
  
  doc.line(20, 35, 190, 35);
  doc.setFont("helvetica", "bold");
  doc.text("COMPROVANTE DE PEDIDO", 105, 45, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text(`Pedido #${order.id.slice(-4).toUpperCase()} — ${format(new Date(order.created_at), "dd/MM/yy HH:mm")}`, 105, 52, { align: "center" });
  
  doc.line(20, 60, 190, 60);
  doc.text(`TIPO: ${order.order_type.toUpperCase()}`, 20, 70);
  
  doc.setFont("helvetica", "bold");
  doc.text("SEUS DADOS", 20, 85);
  doc.setFont("helvetica", "normal");
  doc.text(`Nome: ${order.customer_name}`, 20, 95);
  doc.text(`Tel: ${order.customer_phone}`, 20, 100);
  doc.text(`Endereço: ${order.address || "Retirada"}`, 20, 105);
  
  doc.line(20, 115, 190, 115);
  doc.setFont("helvetica", "bold");
  doc.text("ITENS PEDIDOS", 20, 125);
  
  const tableData = order.items.map(item => [
    `${item.quantity}x ${item.name}`,
    `R$ ${Number(item.price).toFixed(2)}`
  ]);
  
  (doc as any).autoTable({
    startY: 130,
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 10 }
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.text(`Subtotal: R$ ${Number(order.subtotal).toFixed(2)}`, 140, finalY);
  doc.text(`Entrega: R$ ${Number(order.delivery_fee).toFixed(2)}`, 140, finalY + 5);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: R$ ${Number(order.total).toFixed(2)}`, 140, finalY + 12);
  
  doc.line(20, finalY + 20, 190, finalY + 20);
  doc.setFontSize(10);
  doc.text("PAGAMENTO", 20, finalY + 30);
  doc.setFont("helvetica", "normal");
  doc.text(`Forma: ${order.payment_method || 'Não inf.'}`, 20, finalY + 40);
  doc.text(`Status: ${order.paid ? 'Pago' : 'Não pago'}`, 20, finalY + 45);
  doc.text(`Valor a pagar: R$ ${Number(order.total).toFixed(2)}`, 20, finalY + 50);
  
  doc.setFontSize(11);
  doc.text("Obrigado pela sua preferência!", 105, finalY + 70, { align: "center" });
  
  doc.save(`pedido-${order.id.slice(-4)}-ticket-cliente.pdf`);
  toast.success("✓ PDF baixado com sucesso", { duration: 3000 });
};

export const printClientTicket = (order: PrintOrderData) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemsHtml = order.items.map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
      <span>${item.quantity}x ${item.name}</span>
      <span>R$ ${Number(item.price).toFixed(2)}</span>
    </div>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Ticket Cliente - #${order.id.slice(-4)}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { 
            width: 80mm; 
            margin: 0; 
            padding: 10px; 
            font-family: Arial, sans-serif; 
            font-size: 11px;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .logo { font-size: 18px; font-weight: 900; margin-bottom: 2px; }
        </style>
      </head>
      <body>
        <div class="center logo">DOCE GESTÃO</div>
        <div class="center">www.docegestao.com.br</div>
        <div class="divider"></div>
        <div class="center bold">COMPROVANTE DE PEDIDO</div>
        <div class="center">Pedido #${order.id.slice(-4).toUpperCase()} — ${format(new Date(order.created_at), "dd/MM/yy HH:mm")}</div>
        <div class="divider"></div>
        <div class="bold">TIPO: ${order.order_type.toUpperCase()}</div>
        <div style="margin-top: 10px;">
          <div class="bold">SEUS DADOS</div>
          <div>Nome: ${order.customer_name}</div>
          <div>Tel: ${order.customer_phone}</div>
          <div>Endereço: ${order.address || "Retirada"}</div>
        </div>
        <div class="divider"></div>
        <div class="bold">ITENS PEDIDOS</div>
        <div style="margin-top: 5px;">
          ${itemsHtml}
        </div>
        <div class="divider"></div>
        <div style="text-align: right;">
          <div>Subtotal: R$ ${Number(order.subtotal).toFixed(2)}</div>
          <div>Entrega: R$ ${Number(order.delivery_fee).toFixed(2)}</div>
          <div class="bold" style="font-size: 14px; margin-top: 5px;">TOTAL: R$ ${Number(order.total).toFixed(2)}</div>
        </div>
        <div class="divider"></div>
        <div class="bold">PAGAMENTO</div>
        <div>Forma: ${order.payment_method || 'Não inf.'}</div>
        <div>Status: ${order.paid ? 'Pago' : 'Não pago'}</div>
        <div>Valor a pagar: R$ ${Number(order.total).toFixed(2)}</div>
        <div class="divider"></div>
        <div class="center" style="margin-top: 10px; font-style: italic;">Obrigado pela sua preferência!</div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.print();
  toast.success("✓ Ticket do cliente enviado para impressão", { duration: 3000 });
};
