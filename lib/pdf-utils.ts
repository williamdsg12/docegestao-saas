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
export const generateQuotePDF = (quote: any, businessInfo: any) => {
    const doc = new jsPDF();
    const primaryColor = [255, 47, 129] as [number, number, number]; // Pink
    const darkColor = [15, 23, 42] as [number, number, number]; // Slate 900

    // Header Design
    doc.setFillColor(...darkColor);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ORÇAMENTO PROFISSIONAL', 14, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`#${quote.id.slice(0, 8).toUpperCase()}`, 14, 32);

    // Business Info (Right side of header)
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(businessInfo.name || 'Doce Gestão', 196, 20, { align: 'right' });
    doc.setFontSize(8);
    doc.text(businessInfo.whatsapp || '', 196, 25, { align: 'right' });
    doc.text(businessInfo.address || '', 196, 30, { align: 'right' });

    // Client Section
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', 14, 55);
    
    doc.setDrawColor(240, 240, 240);
    doc.line(14, 58, 196, 58);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${quote.client_name || 'Consumidor'}`, 14, 65);
    doc.text(`WhatsApp: ${quote.client_whatsapp || 'Não informado'}`, 14, 70);
    doc.text(`Data: ${new Date(quote.created_at).toLocaleDateString()}`, 120, 65);
    doc.text(`Validade: ${new Date(quote.valid_until).toLocaleDateString()}`, 120, 70);

    // Order Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALHES DA PROPOSTA', 14, 85);
    doc.line(14, 88, 196, 88);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Descrição / Tema:', 14, 95);
    const splitDesc = doc.splitTextToSize(quote.description || 'Sem descrição detalhada.', 180);
    doc.text(splitDesc, 14, 100);

    let currentY = 100 + (splitDesc.length * 5) + 10;

    // Items/Costs Table if showDetails is true
    if (quote.display_options?.showDetails && quote.costs?.length > 0) {
        autoTable(doc, {
            startY: currentY,
            head: [['Item / Descrição', 'Valor']],
            body: quote.costs.filter((c: any) => c.show_to_client).map((c: any) => [
                c.description,
                `R$ ${Number(c.value).toFixed(2)}`
            ]),
            headStyles: { fillColor: primaryColor },
            theme: 'striped',
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
    } else {
        currentY += 10;
    }

    // Totals Box
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(120, currentY, 76, 35, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('TOTAL DA PROPOSTA', 125, currentY + 10);
    
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`R$ ${Number(quote.total_final).toFixed(2)}`, 125, currentY + 25);

    // Observations
    if (quote.observations) {
        doc.setTextColor(...darkColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVAÇÕES:', 14, currentY + 10);
        doc.setFont('helvetica', 'normal');
        const obs = doc.splitTextToSize(quote.observations, 100);
        doc.text(obs, 14, currentY + 15);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Este documento é uma proposta comercial válida pelo período indicado.', 105, pageHeight - 20, { align: 'center' });
    doc.text('Gerado automaticamente por Doce Gestão', 105, pageHeight - 15, { align: 'center' });

    doc.save(`orcamento-${quote.id.slice(0, 5)}.pdf`);
};
