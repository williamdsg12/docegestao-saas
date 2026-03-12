"use client"

import { useState, useMemo, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Plus,
    Trash2,
    BarChart3,
    Calculator,
    Percent,
    TrendingUp,
    Package,
    Clock,
    DollarSign,
    Info,
    ChevronRight,
    CheckCircle2,
    CreditCard,
    Store,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface Ingredient {
    id: string
    nome: string
    quantidadeUsada: number
    unidade: string
    quantidadeComprada: number
    precoPago: number
}

export default function PrecificacaoPage() {
    const { user } = useAuth()
    const [products, setProducts] = useState<any[]>([])
    const [selectedProduct, setSelectedProduct] = useState<string>("")
    const [loadingProducts, setLoadingProducts] = useState(false)

    useEffect(() => {
        if (user) {
            fetchProducts()
        }
    }, [user])

    async function fetchProducts() {
        setLoadingProducts(true)
        try {
            const { data } = await supabase.from('receitas').select('id, nome')
            setProducts(data || [])
        } catch (error: any) {
            console.error("Error fetching recipes:", error.message || error)
        } finally {
            setLoadingProducts(false)
        }
    }

    async function handleLoadTechnicalSheet(recid: string) {
        if (!recid) return
        try {
            const { data: sheetData, error } = await supabase
                .from('receita_ingredientes')
                .select('quantidade, ingredientes(id, nome, preco_compra, quantidade_embalagem, unidade_padrao)')
                .eq('receita_id', recid)

            if (error) throw error

            const loadedIngredientes: Ingredient[] = sheetData.map((item: any) => {
                const ing = item.ingredientes
                return {
                    id: ing.id,
                    nome: ing.nome,
                    quantidadeUsada: item.quantidade,
                    unidade: ing.unidade_padrao,
                    quantidadeComprada: ing.quantidade_embalagem,
                    precoPago: ing.preco_compra
                }
            })

            setIngredientes(loadedIngredientes)
            toast.success("Ficha técnica carregada!")
        } catch (error: any) {
            console.error("Error loading technical sheet:", error.message || error)
            toast.error("Erro ao carregar ficha técnica")
        }
    }
    const [ingredientes, setIngredientes] = useState<Ingredient[]>([
        {
            id: "1",
            nome: "Leite Condensado",
            quantidadeUsada: 1,
            unidade: "un",
            quantidadeComprada: 1,
            precoPago: 6.50,
        },
    ])

    const [rendimento, setRendimento] = useState(30)
    const [custoEmbalagem, setCustoEmbalagem] = useState(2.00)
    const [horasTrabalhadas, setHorasTrabalhadas] = useState(1)
    const [valorHora, setValorHora] = useState(20)
    const [margemLucro, setMargemLucro] = useState(100)

    // Taxas
    const [aplicarTaxaCartao, setAplicarTaxaCartao] = useState(false)
    const [taxaCartaoPercent, setTaxaCartaoPercent] = useState(5)
    const [aplicarTaxaMarketplace, setAplicarTaxaMarketplace] = useState(false)
    const [taxaMarketplacePercent, setTaxaMarketplacePercent] = useState(15)
    const [aplicarTaxaFixa, setAplicarTaxaFixa] = useState(false)
    const [taxaFixaValor, setTaxaFixaValor] = useState(1.00)

    const adicionarIngrediente = () => {
        const novo: Ingredient = {
            id: Date.now().toString(),
            nome: "",
            quantidadeUsada: 0,
            unidade: "g",
            quantidadeComprada: 1000,
            precoPago: 0,
        }
        setIngredientes([...ingredientes, novo])
    }

    const removerIngrediente = (id: string) => {
        setIngredientes(ingredientes.filter((i) => i.id !== id))
    }

    const atualizarIngrediente = (id: string, campo: keyof Ingredient, valor: any) => {
        setIngredientes(
            ingredientes.map((i) => (i.id === id ? { ...i, [campo]: valor } : i))
        )
    }

    const calculos = useMemo(() => {
        const custoIngredientes = ingredientes.reduce((acc: number, ing: any) => {
            const precoUnitarioBase = ing.precoPago / (ing.quantidadeComprada || 1)
            const custoTotalIng = precoUnitarioBase * ing.quantidadeUsada
            return acc + (isNaN(custoTotalIng) ? 0 : custoTotalIng)
        }, 0)

        const custoMaoDeObra = horasTrabalhadas * valorHora
        const custoTotal = custoIngredientes + custoEmbalagem + custoMaoDeObra

        const precoComLucro = custoTotal * (1 + margemLucro / 100)

        // Taxas
        let precoAjustado = precoComLucro
        let somaTaxasPercent = 0
        if (aplicarTaxaCartao) somaTaxasPercent += taxaCartaoPercent
        if (aplicarTaxaMarketplace) somaTaxasPercent += taxaMarketplacePercent

        if (somaTaxasPercent < 100) {
            precoAjustado = precoComLucro / (1 - somaTaxasPercent / 100)
        }

        if (aplicarTaxaFixa) {
            precoAjustado += taxaFixaValor
        }

        const custoPorUnidade = custoTotal / (rendimento || 1)
        const precoPorUnidade = precoAjustado / (rendimento || 1)
        const lucroRealTotal = precoAjustado - custoTotal

        return {
            custoIngredientes,
            custoMaoDeObra,
            custoTotal,
            precoComLucro,
            precoAjustado,
            custoPorUnidade,
            precoPorUnidade,
            lucroRealTotal
        }
    }, [
        ingredientes,
        custoEmbalagem,
        horasTrabalhadas,
        valorHora,
        margemLucro,
        rendimento,
        aplicarTaxaCartao,
        taxaCartaoPercent,
        aplicarTaxaMarketplace,
        taxaMarketplacePercent,
        aplicarTaxaFixa,
        taxaFixaValor
    ])

    return (
        <div className="space-y-12 pb-24">
            {/* Page Header with Intelligent Loader */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between"
            >
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 italic uppercase leading-none">
                        Precificação <span className="text-primary tracking-tighter italic">Inteligente</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight italic">Consulte a viabilidade financeira das suas criações em tempo real.</p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group min-w-[280px]">
                        <Label className="absolute -top-3 left-4 bg-white px-2 text-[9px] font-black uppercase tracking-widest text-primary z-10">Sincronizar com Receita</Label>
                        <select
                            className="w-full h-16 pl-6 pr-10 rounded-[24px] border border-slate-200 bg-white/40 backdrop-blur-xl shadow-sm font-black italic uppercase text-xs text-slate-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all appearance-none cursor-pointer"
                            value={selectedProduct}
                            onChange={(e) => {
                                setSelectedProduct(e.target.value)
                                handleLoadTechnicalSheet(e.target.value)
                            }}
                        >
                            <option value="">Escolher da Biblioteca...</option>
                            {products.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.nome}</option>
                            ))}
                        </select>
                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 size-4 text-slate-400 rotate-90 pointer-events-none" />
                    </div>

                    <Button className="h-16 px-10 rounded-[24px] bg-slate-900 text-white font-black italic uppercase tracking-widest text-[10px] shadow-2xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all">
                        <Plus className="mr-3 size-4" />
                        Novo Orçamento Global
                    </Button>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                {/* Inputs Column */}
                <div className="xl:col-span-8 space-y-12">

                    {/* Ingredients Section */}
                    <section className="relative group p-10 rounded-[48px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-2xl overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-5">
                                <div className="size-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-primary shadow-inner">
                                    <CheckCircle2 className="size-7" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 italic uppercase leading-none">Insumos & Matéria-Prima</h2>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 opacity-60">Ficha Técnica Detalhada</p>
                                </div>
                            </div>
                            <Button
                                onClick={adicionarIngrediente}
                                className="h-12 px-6 rounded-2xl bg-primary hover:bg-rose-500 text-white font-black italic uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105"
                            >
                                <Plus className="mr-2 size-4" />
                                Adicionar Insumo
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <AnimatePresence initial={false}>
                                {ingredientes.map((ing, idx) => (
                                    <motion.div
                                        key={ing.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-[28px] bg-white/60 hover:bg-white transition-all group/item border border-transparent hover:border-white hover:shadow-xl"
                                    >
                                        <div className="md:col-span-4">
                                            <Input
                                                placeholder="Ingrediente..."
                                                className="h-14 bg-transparent border-none font-black italic uppercase italic text-slate-900 placeholder:text-slate-300 focus-visible:ring-0"
                                                value={ing.nome}
                                                onChange={(e) => atualizarIngrediente(ing.id, "nome", e.target.value)}
                                            />
                                        </div>
                                        <div className="md:col-span-2 flex items-center gap-2">
                                            <Input
                                                type="number"
                                                className="h-14 bg-transparent border-none font-black text-center text-slate-900 focus-visible:ring-0"
                                                value={ing.quantidadeUsada}
                                                onChange={(e) => atualizarIngrediente(ing.id, "quantidadeUsada", parseFloat(e.target.value))}
                                            />
                                            <select
                                                className="bg-primary/5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-primary outline-none"
                                                value={ing.unidade}
                                                onChange={(e) => atualizarIngrediente(ing.id, "unidade", e.target.value)}
                                            >
                                                <option value="g">g</option>
                                                <option value="kg">kg</option>
                                                <option value="ml">ml</option>
                                                <option value="L">L</option>
                                                <option value="un">un</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 flex items-center justify-center">
                                            <div className="text-[10px] font-black text-slate-300 uppercase italic">de</div>
                                            <Input
                                                type="number"
                                                className="h-14 w-20 bg-transparent border-none font-bold text-center text-slate-400 focus-visible:ring-0"
                                                value={ing.quantidadeComprada}
                                                onChange={(e) => atualizarIngrediente(ing.id, "quantidadeComprada", parseFloat(e.target.value))}
                                            />
                                        </div>
                                        <div className="md:col-span-3">
                                            <div className="relative group/price">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-hover/price:text-primary transition-colors" />
                                                <Input
                                                    type="number"
                                                    className="h-14 pl-10 bg-transparent border-none font-black text-right text-slate-900 focus-visible:ring-0"
                                                    value={ing.precoPago}
                                                    onChange={(e) => atualizarIngrediente(ing.id, "precoPago", parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="md:col-span-1 flex items-center justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-10 rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                                onClick={() => removerIngrediente(ing.id)}
                                            >
                                                <Trash2 className="size-5" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </section>

                    {/* Logistics Section */}
                    <section className="relative group p-10 rounded-[48px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-2xl overflow-hidden">
                        <div className="flex items-center gap-5 mb-10">
                            <div className="size-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                                <Package className="size-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 italic uppercase leading-none">Logística & Mão de Obra</h2>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1 opacity-60">Operações e Estrutura</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <Label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                                    <TrendingUp className="size-3 text-primary" /> Rendimento Total (unidades)
                                </Label>
                                <Input
                                    type="number"
                                    className="h-16 px-8 rounded-[24px] border-none bg-white shadow-sm font-black text-2xl text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all"
                                    value={rendimento}
                                    onChange={(e) => setRendimento(parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                                    <Package className="size-3 text-primary" /> Custo Embalagem/Visual (R$)
                                </Label>
                                <Input
                                    type="number"
                                    className="h-16 px-8 rounded-[24px] border-none bg-white shadow-sm font-black text-2xl text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all"
                                    value={custoEmbalagem}
                                    onChange={(e) => setCustoEmbalagem(parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                                    <Clock className="size-3 text-primary" /> Tempo de Produção (Horas)
                                </Label>
                                <Input
                                    type="number"
                                    className="h-16 px-8 rounded-[24px] border-none bg-white shadow-sm font-black text-2xl text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all"
                                    value={horasTrabalhadas}
                                    onChange={(e) => setHorasTrabalhadas(parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="space-y-4">
                                <Label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
                                    <DollarSign className="size-3 text-primary" /> Valor da Sua Hora (R$)
                                </Label>
                                <Input
                                    type="number"
                                    className="h-16 px-8 rounded-[24px] border-none bg-white shadow-sm font-black text-2xl text-slate-900 focus:ring-4 focus:ring-primary/10 transition-all"
                                    value={valorHora}
                                    onChange={(e) => setValorHora(parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Results Dashboard Column */}
                <div className="xl:col-span-4 space-y-8 sticky top-6">
                    <Card className="rounded-[56px] border-white bg-slate-900 text-white overflow-hidden shadow-[0_32px_64px_-12px_rgba(15,23,42,0.5)]">
                        <CardHeader className="p-12 pb-6 flex flex-row items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary shadow-[0_0_20px_rgba(244,114,182,0.4)] flex items-center justify-center">
                                    <TrendingUp className="size-6 text-white" />
                                </div>
                                <h3 className="text-xl font-black italic uppercase tracking-tighter">Performance</h3>
                            </div>
                            <Badge className="bg-white/10 text-primary border-none font-black text-[9px] uppercase tracking-widest">Tempo Real</Badge>
                        </CardHeader>

                        <CardContent className="p-12 space-y-12">
                            {/* Detailed List Results */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">Insumos Totais</span>
                                    <span className="text-xl font-black italic tracking-tighter">R$ {calculos.custoIngredientes.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center group">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-primary transition-colors">Mão de Obra</span>
                                    <span className="text-xl font-black italic tracking-tighter">R$ {calculos.custoMaoDeObra.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center group pt-6 border-t border-white/5">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Custo Direto Base</span>
                                    <span className="text-3xl font-black italic text-primary tracking-tighter">R$ {calculos.custoTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Profit Margin UI */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Margem de Lucro Estipulada</Label>
                                    <Badge className="bg-primary text-white font-black italic">{margemLucro}%</Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {[50, 100, 150].map((m) => (
                                        <button
                                            key={m}
                                            onClick={() => setMargemLucro(m)}
                                            className={cn(
                                                "h-14 rounded-2xl font-black italic uppercase text-[10px] tracking-widest transition-all",
                                                margemLucro === m
                                                    ? "bg-primary text-white shadow-xl shadow-primary/20 scale-105"
                                                    : "bg-white/5 text-slate-400 hover:bg-white/10"
                                            )}
                                        >
                                            {m}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Optional Taxes & Fees */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all cursor-pointer" onClick={() => setAplicarTaxaCartao(!aplicarTaxaCartao)}>
                                    <div className="flex items-center gap-4">
                                        <CreditCard className={cn("size-5 transition-colors", aplicarTaxaCartao ? "text-primary" : "text-slate-600")} />
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Taxas Cartão</span>
                                    </div>
                                    <Switch checked={aplicarTaxaCartao} onCheckedChange={setAplicarTaxaCartao} />
                                </div>
                                <div className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all cursor-pointer" onClick={() => setAplicarTaxaMarketplace(!aplicarTaxaMarketplace)}>
                                    <div className="flex items-center gap-4">
                                        <Store className={cn("size-5 transition-colors", aplicarTaxaMarketplace ? "text-primary" : "text-slate-600")} />
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">iFood / Marketplace</span>
                                    </div>
                                    <Switch checked={aplicarTaxaMarketplace} onCheckedChange={setAplicarTaxaMarketplace} />
                                </div>
                            </div>

                            {/* Final Big Results */}
                            <div className="space-y-6 pt-12 border-t border-white/10">
                                <div className="relative group p-10 rounded-[48px] bg-gradient-to-br from-primary to-rose-600 shadow-2xl shadow-primary/30 text-center overflow-hidden">
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60 block mb-3 leading-none">Preço de Venda (Unidade)</span>
                                    <div className="text-6xl font-black italic tracking-tightest leading-none">
                                        R$ {calculos.precoPorUnidade.toFixed(2)}
                                    </div>
                                    <div className="mt-8 flex items-center justify-center gap-4">
                                        <div className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md text-[9px] font-black uppercase italic">
                                            Custo: R$ {calculos.custoPorUnidade.toFixed(2)}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 text-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2 opacity-60">Lucro Real</span>
                                        <div className="text-2xl font-black italic tracking-tighter text-emerald-400">
                                            R$ {calculos.lucroRealTotal.toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 text-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2 opacity-60">Margem Final</span>
                                        <div className="text-2xl font-black italic tracking-tighter text-blue-400">
                                            {((calculos.lucroRealTotal / (calculos.custoTotal || 1)) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button variant="outline" className="w-full h-20 rounded-[32px] border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-black italic uppercase tracking-widest text-[11px] shadow-xl transition-all">
                        <BarChart3 className="mr-3 size-5" />
                        Exportar Relatório de Precificação
                    </Button>
                </div>
            </div>
        </div>
    )
}
