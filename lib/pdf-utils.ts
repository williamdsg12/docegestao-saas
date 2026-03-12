import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReceiptPDF = (order: any) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(255, 47, 129); // Primary Pink
    doc.text('DoceGestão - Compante', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Recibo de Pedido #${order.id}`, 14, 30);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 35);

    // Client Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text('Dados do Cliente:', 14, 50);
    doc.setFontSize(10);
    doc.text(`Nome: ${order.cliente}`, 14, 55);
    doc.text(`Telefone: ${order.telefone || 'Não informado'}`, 14, 60);

    // Table
    autoTable(doc, {
        startY: 70,
        head: [['Produto', 'Qtd', 'Preço Unit.', 'Subtotal']],
        body: [
            [order.produto, '1', `R$ ${order.valor.toFixed(2)}`, `R$ ${order.valor.toFixed(2)}`]
        ],
        headStyles: { fillColor: [255, 47, 129] },
        theme: 'grid',
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text(`Total: R$ ${order.valor.toFixed(2)}`, 140, finalY);

    doc.setFontSize(8);
    doc.text('Obrigado por sua encomenda!', 105, finalY + 40, { align: 'center' });

    doc.save(`pedido-${order.id}.pdf`);
};

export const generateInventoryReport = (items: any[]) => {
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('Relatório de Estoque', 14, 22);

    autoTable(doc, {
        startY: 30,
        head: [['Insumo', 'Qtd Atual', 'Mínimo', 'Unidade', 'Status']],
        body: items.map(item => [
            item.nome,
            item.quantidade,
            item.minimo,
            item.unidade,
            item.quantidade < item.minimo ? 'CRÍTICO' : 'OK'
        ]),
        headStyles: { fillColor: [15, 23, 42] },
    });

    doc.save(`relatorio-estoque-${Date.now()}.pdf`);
};
