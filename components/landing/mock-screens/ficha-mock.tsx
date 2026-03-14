"use client"

import { ChefHat, Package, Zap, TrendingUp, Calculator } from "lucide-react"

const ingredients = [
    { name: "Leite Condensado", category: "Laticínios", cost: "R$ 7,50", qt: "395g" },
    { name: "Chocolate em Pó", category: "Chocolates", cost: "R$ 18,90", qt: "500g" },
    { name: "Manteiga", category: "Laticínios", cost: "R$ 12,00", qt: "200g" },
]

export function FichaMock() {
    return (
        <div className="w-full h-full bg-[#f8fafc] p-6 overflow-hidden">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase italic leading-none">
                        Ficha <span className="text-primary italic">Técnica</span>
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Precificação inteligente e automática</p>
                </div>
                <div className="h-10 w-32 rounded-xl bg-[#7C3AED] shadow-lg shadow-indigo-500/20 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest cursor-pointer">
                    Nova Receita
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 h-[calc(100%-80px)]">
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Package className="size-4 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-600 uppercase italic">Ingredientes Fixos</span>
                        </div>
                        <TrendingUp className="size-4 text-green-500" />
                    </div>
                    <div className="p-4 space-y-4">
                        {ingredients.map((ing, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0">
                                <div>
                                    <p className="text-[10px] font-black text-slate-800 uppercase italic leading-none">{ing.name}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">{ing.category}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-600">{ing.cost}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase">{ing.qt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-indigo-50 text-[#7C3AED] flex items-center justify-center">
                                <Calculator className="size-6" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-slate-800 uppercase italic leading-none">Cálculo de Custo</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Atualizado em tempo real</p>
                            </div>
                        </div>
                        <div className="space-y-2 pt-2">
                            <div className="flex justify-between text-[10px]">
                                <span className="font-bold text-slate-500 uppercase">Insumos</span>
                                <span className="font-black text-slate-900">R$ 12,40</span>
                            </div>
                            <div className="flex justify-between text-[10px]">
                                <span className="font-bold text-slate-500 uppercase">Mão de Obra</span>
                                <span className="font-black text-slate-900">R$ 4,50</span>
                            </div>
                            <div className="pt-2 border-t border-slate-100 flex justify-between text-[10px]">
                                <span className="font-black text-primary uppercase italic">Custo Unitário</span>
                                <span className="font-black text-primary italic">R$ 16,90</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#7C3AED] to-indigo-600 p-6 rounded-3xl shadow-xl text-white">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="size-5 text-amber-300 fill-amber-300" />
                            <h3 className="text-[10px] font-black uppercase italic">Sugestão de Preço</h3>
                        </div>
                        <p className="text-3xl font-black italic tracking-tighter">R$ 54,90</p>
                        <p className="text-[9px] text-indigo-100 font-bold mt-2 uppercase">Lucro estimado: 220%</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
