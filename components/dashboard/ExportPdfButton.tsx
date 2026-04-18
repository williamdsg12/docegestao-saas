"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function ExportPdfButton({ items }: { items: any[] }) {
    const [isExporting, setIsExporting] = useState(false)

    async function handleExport() {
        if (items.length === 0) return toast.error("A lista está vazia.")
        
        setIsExporting(true)
        try {
            // Lazy load jspdf only when needed on the client
            const { default: jsPDF } = await import("jspdf")
            await import("jspdf-autotable")

            const doc = new jsPDF() as any
            
            // Header
            doc.setFont("helvetica", "bold")
            doc.setFontSize(22)
            doc.text("LISTA DE COMPRAS - DOCE GESTÃO", 105, 20, { align: "center" })

            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.text(`Data da Lista: ${new Date().toLocaleDateString('pt-BR')}`, 105, 28, { align: "center" })

            // Table
            const tableData = items.map(item => [
                item.nome_item,
                item.quantidade,
                item.unidade,
                item.fornecedor || "-",
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.preco_unitario || 0),
                new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total || 0)
            ])

            doc.autoTable({
                startY: 40,
                head: [['Item', 'Qtd', 'Unidade', 'Fornecedor', 'Preço Unit.', 'Total Est.']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
                styles: { font: "helvetica", fontSize: 10 },
                columnStyles: {
                    0: { cellWidth: 60 },
                    1: { cellWidth: 20 },
                    2: { cellWidth: 20 },
                    3: { cellWidth: 30 },
                    4: { cellWidth: 30 },
                    5: { cellWidth: 30 }
                }
            })

            const total = items.reduce((acc, item) => acc + (item.valor_total || 0), 0)
            const finalY = (doc as any).lastAutoTable.finalY + 10

            doc.setFontSize(12)
            doc.setFont("helvetica", "bold")
            doc.text(`VALOR TOTAL ESTIMADO: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}`, 200, finalY, { align: "right" })

            doc.save(`lista-compras-${new Date().toISOString().split('T')[0]}.pdf`)
            toast.success("PDF gerado com sucesso!")
        } catch (err) {
            console.error("Erro na exportação PDF:", err)
            toast.error("Erro ao carregar módulo de PDF.")
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button 
            variant="ghost"
            onClick={handleExport}
            disabled={isExporting}
            className="h-10 px-4 rounded-2xl text-slate-500 hover:text-slate-900 font-bold uppercase text-[9px] tracking-widest gap-2"
        >
            {isExporting ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />}
            {isExporting ? "Gerando..." : "Exportar PDF"}
        </Button>
    )
}
