"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, Package, Tag, Percent, Calculator, MoreVertical, Edit2, Trash2, ArrowUpRight, ChefHat, Info, FileText, Copy, CheckCircle2, TrendingUp } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface Ingredient {
  id: string
  nome: string
  preco_compra: number
  unidade_padrao: string
  quantidade_embalagem: number
}

interface Product {
  id: string
  nome: string
  categoria: string
  variacoes?: string[]
  custo_base: number
  margem: number
  preco_venda: number
  ativo: boolean
  embalagem: number
  mao_de_obra: number
  rendimento: number
}

const initialProducts: Product[] = [
  {
    id: "PRD-001",
    nome: "Bolo de Chocolate",
    categoria: "Bolos",
    variacoes: ["1kg"],
    custo_base: 35,
    margem: 150,
    preco_venda: 87.50,
    ativo: true,
    embalagem: 5,
    mao_de_obra: 10,
    rendimento: 1
  },
  {
    id: "PRD-002",
    nome: "Cupcake Red Velvet",
    categoria: "Cupcakes",
    variacoes: ["Unidade"],
    custo_base: 4.50,
    margem: 200,
    preco_venda: 13.50,
    ativo: true,
    embalagem: 0.80,
    mao_de_obra: 1.50,
    rendimento: 1
  },
]

const categoryColors: Record<string, string> = {
  Bolos: "text-primary bg-rose-50 border-rose-100",
  Cupcakes: "text-blue-600 bg-blue-50 border-blue-100",
  Tortas: "text-amber-600 bg-amber-50 border-amber-100",
  Docinhos: "text-green-600 bg-green-50 border-green-100",
}

export default function FichaTecnicaPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [newProductOpen, setNewProductOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("produtos")

  const [newIngredientOpen, setNewIngredientOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)

  // New Ingredient Form State
  const [ingData, setIngData] = useState({
    nome: "",
    preco_compra: "",
    quantidade_embalagem: "",
    unidade_padrao: "g"
  })

  // Product Wizard State
  const [productForm, setProductForm] = useState({
    nome: "",
    categoria: "",
    rendimento: "1",
    mao_de_obra: "0",
    embalagem: "0",
    margem: "100"
  })
  const [selectedIngredients, setSelectedIngredients] = useState<{ ingrediente_id: string, quantidade: number, custo: number }[]>([])
  const [ingSearch, setIngSearch] = useState("")

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  async function fetchData() {
    try {
      setLoading(true)
      const [prodRes, ingRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('ingredientes').select('*').order('nome')
      ])

      if (prodRes.error) throw prodRes.error
      if (ingRes.error) throw ingRes.error

      setProducts(prodRes.data || [])
      setIngredients(ingRes.data || [])
    } catch (error: any) {
      console.error("Error fetching data:", error.message || error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveProduct() {
    if (!productForm.nome) {
      toast.error("O nome do produto é obrigatório")
      return
    }

    setIsSaving(true)
    try {
      const custo_base = selectedIngredients.reduce((acc: number, curr: any) => acc + curr.custo, 0) +
        parseFloat(productForm.mao_de_obra) +
        parseFloat(productForm.embalagem)

      const preco_venda = custo_base * (1 + parseFloat(productForm.margem) / 100)

      let savedProduct;

      if (editingProduct) {
        const { data, error: pError } = await supabase
          .from('products')
          .update({
            name: productForm.nome,
            category: productForm.categoria,
            custo_base,
            margem: parseFloat(productForm.margem),
            preco_venda,
            mao_de_obra: parseFloat(productForm.mao_de_obra),
            embalagem: parseFloat(productForm.embalagem),
            rendimento: parseInt(productForm.rendimento)
          })
          .eq('id', editingProduct.id)
          .select()
          .single()
        
        if (pError) throw pError
        savedProduct = data
        
        // Remove old ingredients
        await supabase.from('product_ingredients').delete().eq('product_id', editingProduct.id)
      } else {
        const { data, error: pError } = await supabase
          .from('products')
          .insert({
            user_id: user?.id,
            name: productForm.nome,
            category: productForm.categoria,
            custo_base,
            margem: parseFloat(productForm.margem),
            preco_venda,
            mao_de_obra: parseFloat(productForm.mao_de_obra),
            embalagem: parseFloat(productForm.embalagem),
            rendimento: parseInt(productForm.rendimento),
            ativo: true
          })
          .select()
          .single()

        if (pError) throw pError
        savedProduct = data
      }

      // SAVE RECIPE INGREDIENTS
      if (selectedIngredients.length > 0) {
        const { error: iError } = await supabase
          .from('product_ingredients')
          .insert(selectedIngredients.map(ing => ({
            product_id: savedProduct.id,
            ingredient_id: ing.ingrediente_id,
            quantity: ing.quantidade,
            cost: ing.custo
          })))

        if (iError) throw iError
      }

      if (editingProduct) {
        setProducts(prev => prev.map((p: any) => p.id === savedProduct.id ? savedProduct : p))
      } else {
        setProducts(prev => [savedProduct, ...prev])
      }
      
      setNewProductOpen(false)
      setEditingProduct(null)
      toast.success("Produto/Ficha Técnica salva com sucesso!")
      setWizardStep(1)
      setProductForm({
        nome: "",
        categoria: "",
        rendimento: "1",
        mao_de_obra: "0",
        embalagem: "0",
        margem: "100"
      })
      setSelectedIngredients([])
    } catch (error: any) {
      console.error("Error saving product:", error.message || error)
      toast.error("Erro ao salvar produto")
    } finally {
      setIsSaving(false)
    }
  }

  function addIngredientToProduct(ing: Ingredient) {
    const custo = (ing.preco_compra / (ing.quantidade_embalagem || 1))
    setSelectedIngredients(prev => [...prev, {
      ingrediente_id: ing.id,
      quantidade: 1,
      custo: custo
    }])
  }

  async function handleSaveIngredient() {
    if (!ingData.nome || !ingData.preco_compra) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    setIsSaving(true)
    try {
      if (editingIngredient) {
        const { error } = await supabase
          .from('ingredientes')
          .update({
            nome: ingData.nome,
            preco_compra: parseFloat(ingData.preco_compra),
            quantidade_embalagem: parseFloat(ingData.quantidade_embalagem) || 1,
            unidade_padrao: ingData.unidade_padrao
          })
          .eq('id', editingIngredient.id)

        if (error) throw error
        setIngredients(prev => prev.map(i => i.id === editingIngredient.id ? { ...i, ...ingData, preco_compra: parseFloat(ingData.preco_compra), quantidade_embalagem: parseFloat(ingData.quantidade_embalagem) || 1 } : i).sort((a, b) => a.nome.localeCompare(b.nome)))
        toast.success("Insumo atualizado!")
      } else {
        const { data, error } = await supabase
          .from('ingredientes')
          .insert({
            user_id: user?.id,
            nome: ingData.nome,
            preco_compra: parseFloat(ingData.preco_compra),
            quantidade_embalagem: parseFloat(ingData.quantidade_embalagem) || 1,
            unidade_padrao: ingData.unidade_padrao
          })
          .select()
          .single()

        if (error) throw error

        setIngredients(prev => [...prev, data].sort((a, b) => a.nome.localeCompare(b.nome)))
        toast.success("Insumo cadastrado!")
      }
      
      setNewIngredientOpen(false)
      setEditingIngredient(null)
      setIngData({ nome: "", preco_compra: "", quantidade_embalagem: "", unidade_padrao: "g" })
    } catch (error: any) {
      console.error("Error saving ingredient:", error.message || error)
      toast.error("Erro ao cadastrar insumo")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!window.confirm("Deseja realmente excluir este produto?")) return
    try {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
      setProducts(prev => prev.filter(p => p.id !== id))
      toast.success("Produto excluído!")
    } catch (error: any) {
      toast.error("Erro ao excluir produto")
    }
  }

  async function handleDeleteIngredient(id: string) {
    if (!window.confirm("Deseja realmente excluir este insumo?")) return
    try {
      const { error } = await supabase.from('ingredientes').delete().eq('id', id)
      if (error) throw error
      setIngredients(prev => prev.filter(i => i.id !== id))
      toast.success("Insumo excluído!")
    } catch (error: any) {
      toast.error("Erro ao excluir insumo")
    }
  }

  const handleEditProduct = async (product: any) => {
    setEditingProduct(product)
    setProductForm({
      nome: product.name || product.nome,
      categoria: product.category || product.categoria,
      rendimento: (product.rendimento || 1).toString(),
      mao_de_obra: (product.mao_de_obra || 0).toString(),
      embalagem: (product.embalagem || 0).toString(),
      margem: (product.margem || 100).toString()
    })
    
    try {
      const { data } = await supabase.from('product_ingredients').select('*').eq('product_id', product.id)
      if (data) {
        setSelectedIngredients(data.map((d: any) => ({
          ingrediente_id: d.ingredient_id,
          quantidade: d.quantity,
          custo: d.cost
        })))
      }
    } catch (e) {
      console.error(e)
    }
    
    setWizardStep(1)
    setNewProductOpen(true)
  }

  const handleEditIngredient = (ing: Ingredient) => {
    setEditingIngredient(ing)
    setIngData({
      nome: ing.nome,
      preco_compra: ing.preco_compra.toString(),
      quantidade_embalagem: (ing.quantidade_embalagem || 1).toString(),
      unidade_padrao: ing.unidade_padrao
    })
    setNewIngredientOpen(true)
  }

  // Wizard State
  const [wizardStep, setWizardStep] = useState(1)

  const filtered = products.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) || p.categoria.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    { label: "Produtos", value: products.length, icon: Package, color: "text-primary" },
    { label: "Margem Média", value: "182%", icon: Percent, color: "text-blue-600" },
    { label: "Custo Médio", value: "R$ 14,20", icon: Calculator, color: "text-amber-600" },
    { label: "Lucro Estimado", value: "R$ 8.420", icon: ArrowUpRight, color: "text-green-600" },
  ]

  return (
    <div className="space-y-10 pb-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 italic uppercase">Precificação <span className="text-primary font-black">& Fichas</span></h1>
          <p className="text-slate-500 font-medium tracking-tight">Crie receitas lucrativas com cálculo automático de ingredientes e mão de obra.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold">
            <FileText className="mr-2 size-4" />
            Exportar Tudo
          </Button>
          <Button onClick={() => setNewProductOpen(true)} className="h-11 px-8 rounded-xl bg-primary hover:bg-primary text-white font-bold shadow-lg shadow-primary/20 transition-transform hover:scale-105">
            <Plus className="mr-2 size-5" />
            Nova Ficha Técnica
          </Button>
        </div>
      </div>

      <Tabs defaultValue="produtos" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl h-14 shadow-sm">
            <TabsTrigger value="produtos" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Meus Produtos</TabsTrigger>
            <TabsTrigger value="ingredientes" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white">Biblioteca de Insumos</TabsTrigger>
          </TabsList>

          {activeTab === "produtos" && (
            <div className="relative group max-w-md w-full">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                placeholder="Pesquisar categoria ou produto..."
                className="w-full h-12 rounded-xl border border-slate-200 bg-white pl-12 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all outline-none shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
        </div>

        <TabsContent value="produtos" className="space-y-10 mt-0 focus-visible:outline-none">
          {/* Stats 2.0 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 hover:border-primary/20 transition-all duration-300 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={cn("flex size-14 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform duration-500", stat.color)}>
                      <stat.icon className="size-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="py-5 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Item / Receita</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Custo Total</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Preço Venda</TableHead>
                  <TableHead className="py-5 pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((product, i) => (
                    <motion.tr
                      layout
                      key={product.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      className="group border-slate-100 hover:bg-slate-50 transition-all duration-300 cursor-pointer"
                    >
                      <TableCell className="py-6 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="size-11 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center text-primary shadow-sm overflow-hidden group-hover:scale-105 transition-transform">
                            <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${product.nome}&backgroundColor=FF2F81&fontFamily=Inter&fontWeight=900`} alt="" className="size-full object-cover" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-black text-slate-900 italic tracking-tight leading-none uppercase italic">{product.nome}</span>
                            <span className="text-[10px] text-zinc-500 font-bold uppercase mt-1.5">{product.id}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <Badge variant="outline" className={cn("px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-none", categoryColors[product.categoria] || "border-slate-100 text-slate-400")}>
                          {product.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-6 text-slate-500 font-bold">
                        R$ {product.custo_base.toFixed(2)}
                      </TableCell>
                      <TableCell className="py-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-lg font-black text-slate-900 tracking-tighter">R$ {product.preco_venda.toFixed(2)}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-tight">+{product.margem}% Lucro</span>
                            <div className="size-1 rounded-full bg-green-500" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6 pr-8 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <Button variant="ghost" size="icon" className="size-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary transition-all">
                            <FileText className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-9 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-primary transition-all">
                            <Copy className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} className="size-9 rounded-xl bg-slate-50 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all">
                            <Edit2 className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} className="size-9 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all">
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="ingredientes" className="space-y-6 mt-0 focus-visible:outline-none">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-900 italic uppercase">Biblioteca de Insumos</h3>
                <p className="text-sm text-slate-500 font-medium tracking-tight">Gerencie aqui o preço unitário de cada matéria-prima usada nas suas receitas.</p>
              </div>
              <Dialog open={newIngredientOpen} onOpenChange={setNewIngredientOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold">
                    <Plus className="mr-2 size-4" />
                    Novo Insumo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md border-slate-200 bg-white text-slate-900 p-8 rounded-3xl shadow-2xl">
                  <DialogHeader className="mb-6">
                    <DialogTitle className="text-2xl font-black italic uppercase">Novo <span className="text-primary italic">Insumo</span></DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome do Insumo</Label>
                      <Input
                        placeholder="Ex: Chocolate Callebaut"
                        className="h-11 border-slate-200 bg-slate-50 rounded-xl"
                        value={ingData.nome}
                        onChange={e => setIngData({ ...ingData, nome: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preço Compra (R$)</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="h-11 border-slate-200 bg-slate-50 rounded-xl"
                          value={ingData.preco_compra}
                          onChange={e => setIngData({ ...ingData, preco_compra: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unidade</Label>
                        <select
                          className="h-11 border-slate-200 bg-slate-50 rounded-xl px-4 text-sm font-bold outline-none"
                          value={ingData.unidade_padrao}
                          onChange={e => setIngData({ ...ingData, unidade_padrao: e.target.value })}
                        >
                          <option value="g">Grama (g)</option>
                          <option value="kg">Quilo (kg)</option>
                          <option value="ml">Mililitro (ml)</option>
                          <option value="l">Litro (l)</option>
                          <option value="un">Unidade (un)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Qtd na Embalagem</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 1000"
                        className="h-11 border-slate-200 bg-slate-50 rounded-xl"
                        value={ingData.quantidade_embalagem}
                        onChange={e => setIngData({ ...ingData, quantidade_embalagem: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={handleSaveIngredient}
                      disabled={isSaving}
                      className="h-12 mt-4 rounded-xl bg-primary hover:bg-primary text-white font-bold shadow-lg shadow-primary/20"
                    >
                      {isSaving ? "Cadastrando..." : "Cadastrar Insumo"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Insumo</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preço Compra</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rendimento Emb.</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400">Custo Unitário</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((insumo) => (
                  <TableRow key={insumo.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-black italic uppercase text-slate-700 py-4">{insumo.nome}</TableCell>
                    <TableCell className="font-bold text-slate-500">R$ {insumo.preco_compra.toFixed(2)}</TableCell>
                    <TableCell className="font-bold text-slate-400">{insumo.quantidade_embalagem} {insumo.unidade_padrao}</TableCell>
                    <TableCell className="font-black text-primary italic">
                      R$ {(insumo.preco_compra / (insumo.quantidade_embalagem || 1)).toFixed(4)}
                      <span className="text-[10px] uppercase font-black text-slate-300"> / {insumo.unidade_padrao === 'kg' ? 'g' : insumo.unidade_padrao}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditIngredient(insumo)} className="size-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary"><Edit2 className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteIngredient(insumo.id)} className="size-8 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500"><Trash2 className="size-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {ingredients.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-slate-500">Nenhum insumo cadastrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Advanced Pricing Wizard */}
      <Dialog open={newProductOpen} onOpenChange={(val) => {
        setNewProductOpen(val)
        if (!val) setWizardStep(1)
      }}>
        <DialogContent className="sm:max-w-4xl border-slate-200 bg-white text-slate-900 p-0 rounded-3xl overflow-hidden">
          <DialogTitle className="sr-only">Nova Ficha Técnica</DialogTitle>
          <div className="flex h-[700px]">
            {/* Sidebar Steps */}
            <div className="w-64 bg-slate-50 border-r border-slate-100 p-8 flex flex-col justify-between">
              <div className="space-y-8">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20 mb-10">
                  <Calculator className="size-6 text-white" />
                </div>
                {[
                  { step: 1, label: "Informações", icon: Info },
                  { step: 2, label: "Receita", icon: ChefHat },
                  { step: 3, label: "Custos Extras", icon: Tag },
                  { step: 4, label: "Resultado", icon: ArrowUpRight },
                ].map((s) => (
                  <div key={s.step} className={cn("flex items-center gap-4 transition-all duration-500", wizardStep === s.step ? "opacity-100 translate-x-1" : "opacity-40")}>
                    <div className={cn("size-8 rounded-xl flex items-center justify-center font-black text-xs", wizardStep === s.step ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-slate-200 text-slate-500")}>
                      {s.step}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{s.label}</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-black uppercase tracking-tighter text-slate-400 italic leading-tight">
                Sistema Inteligente de<br />Precificação DoceGestão
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-10 flex flex-col">
              <div className="flex-1 overflow-auto pr-4 custom-scrollbar">
                {/* Step 1: Basic Info */}
                <AnimatePresence mode="wait">
                  {wizardStep === 1 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                      <div>
                        <h2 className="text-3xl font-black italic uppercase text-slate-900 leading-none">Dados da <span className="text-primary italic">Receita</span></h2>
                        <p className="text-slate-500 font-medium mt-3">Identifique seu produto para começar o cálculo.</p>
                      </div>
                      <div className="grid gap-6">
                        <div className="grid gap-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Produto acabado</Label>
                          <Input
                            placeholder="Ex: Bolo de Chocolate com Morango (P)"
                            className="h-14 border-slate-200 bg-slate-50 rounded-2xl md:text-lg font-bold px-6 shadow-inner"
                            value={productForm.nome}
                            onChange={e => setProductForm({ ...productForm, nome: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="grid gap-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoria</Label>
                            <Input
                              placeholder="Ex: Bolos de Festa"
                              className="h-14 border-slate-200 bg-slate-50 rounded-2xl font-bold px-6 shadow-inner"
                              value={productForm.categoria}
                              onChange={e => setProductForm({ ...productForm, categoria: e.target.value })}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rendimento Final (Ex: 12 fatias)</Label>
                            <Input
                              type="number"
                              placeholder="12"
                              className="h-14 border-slate-200 bg-slate-50 rounded-2xl font-bold px-6 shadow-inner"
                              value={productForm.rendimento}
                              onChange={e => setProductForm({ ...productForm, rendimento: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Ingredients Selector */}
                  {wizardStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div>
                        <h2 className="text-3xl font-black italic uppercase text-slate-900">Composição <span className="text-primary italic">Interna</span></h2>
                        <p className="text-slate-500 font-medium mt-2">Selecione os ingredientes e a quantidade exata usada.</p>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner">
                        <div className="flex gap-4 mb-6">
                          <div className="flex-1 relative group">
                            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input
                              placeholder="Buscar na biblioteca de insumos..."
                              className="h-12 pl-12 border-slate-200 bg-white rounded-xl shadow-sm font-bold"
                              value={ingSearch}
                              onChange={e => setIngSearch(e.target.value)}
                            />
                            {ingSearch && (
                              <div className="absolute top-14 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-[300px] overflow-y-auto">
                                {ingredients.filter(i => i.nome.toLowerCase().includes(ingSearch.toLowerCase())).map(item => (
                                  <div
                                    key={item.id}
                                    className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between group"
                                    onClick={() => {
                                      addIngredientToProduct(item)
                                      setIngSearch("")
                                    }}
                                  >
                                    <span className="font-bold text-slate-700">{item.nome}</span>
                                    <Plus className="size-4 text-slate-300 group-hover:text-primary" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3 min-h-[220px]">
                          {selectedIngredients.map((item, idx) => {
                            const ingredient = ingredients.find(i => i.id === item.ingrediente_id)
                            return (
                              <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-primary/20 transition-all">
                                <div className="flex flex-col">
                                  <span className="text-xs font-black uppercase text-slate-400 leading-none mb-1">Insumo</span>
                                  <span className="text-sm font-black italic uppercase text-slate-900">{ingredient?.nome}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Qtd Usada</span>
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="number"
                                        className="w-16 h-8 bg-slate-50 rounded-lg border-none text-right font-black text-slate-900 focus:ring-1 focus:ring-primary/20 outline-none pr-1"
                                        value={item.quantidade}
                                        onChange={(e) => {
                                          const qty = parseFloat(e.target.value) || 0
                                          const unitCost = (ingredient?.preco_compra || 0) / (ingredient?.quantidade_embalagem || 1)
                                          setSelectedIngredients(prev => prev.map((si, i) => i === idx ? { ...si, quantidade: qty, custo: unitCost * qty } : si))
                                        }}
                                      />
                                      <span className="text-[10px] font-black text-slate-400 uppercase">{ingredient?.unidade_padrao === 'kg' ? 'g' : ingredient?.unidade_padrao}</span>
                                    </div>
                                  </div>
                                  <div className="w-px h-8 bg-slate-100" />
                                  <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1">Custo</span>
                                    <span className="text-sm font-black text-primary italic">R$ {item.custo.toFixed(2)}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                    onClick={() => setSelectedIngredients(prev => prev.filter((_, i) => i !== idx))}
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-8 py-5 bg-primary/5 rounded-2xl border border-primary/10">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm border border-primary/5">
                            <Plus className="size-5" />
                          </div>
                          <span className="text-xs font-black uppercase text-slate-500 tracking-widest italic">Custo Parcial da Receita</span>
                        </div>
                        <span className="text-2xl font-black text-primary italic tracking-tight">
                          R$ {selectedIngredients.reduce((acc, curr) => acc + curr.custo, 0).toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Labor & Packaging */}
                  {wizardStep === 3 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                      <div>
                        <h2 className="text-3xl font-black italic uppercase text-slate-900">Mão de Obra <span className="text-primary italic">& Mais</span></h2>
                        <p className="text-slate-500 font-medium mt-2">Calcule seu tempo de trabalho e custos fixos automatizados.</p>
                      </div>
                      <div className="grid gap-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tempo Total de Produção</Label>
                            <div className="relative group">
                              <Plus className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-primary" />
                              <Input
                                type="number"
                                placeholder="60min"
                                className="h-14 pl-12 border-slate-200 bg-slate-50 rounded-2xl font-bold px-6 shadow-inner"
                                value={productForm.mao_de_obra}
                                onChange={e => setProductForm({ ...productForm, mao_de_obra: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Custo de Embalagem (Unid)</Label>
                            <div className="relative group">
                              <Package className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 group-focus-within:text-primary" />
                              <Input
                                type="number"
                                placeholder="R$ 5,00"
                                className="h-14 pl-12 border-slate-200 bg-slate-50 rounded-2xl font-bold px-6 shadow-inner"
                                value={productForm.embalagem}
                                onChange={e => setProductForm({ ...productForm, embalagem: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                          <div className="absolute top-0 right-0 size-48 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl transition-opacity opacity-50 group-hover:opacity-100" />
                          <div className="flex items-center gap-4 mb-3 relative z-10">
                            <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                              <Percent className="size-5" />
                            </div>
                            <h4 className="text-lg font-black italic uppercase tracking-tight">Custos Operacionais <span className="text-primary italic">Invisíveis</span></h4>
                          </div>
                          <p className="text-sm font-bold text-slate-400 leading-tight mb-6 relative z-10">
                            Insumos como água, luz, gás e detergente costumam representar cerca de **20%** do custo dos ingredientes.
                          </p>
                          <div className="flex items-center gap-4 relative z-10">
                            <Button className="h-10 px-6 rounded-xl bg-primary hover:bg-primary font-black uppercase text-[10px] tracking-widest text-white shadow-lg shadow-primary/10">+20% Sugerido (Padrão)</Button>
                            <Button variant="outline" className="h-10 px-6 rounded-xl border-slate-700 bg-transparent text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-800">Personalizar</Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Final Results */}
                  {wizardStep === 4 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                      <div className="text-center mb-6">
                        <div className="flex size-16 items-center justify-center rounded-2xl bg-green-50 text-green-500 mx-auto mb-4 border border-green-100 shadow-sm">
                          <Calculator className="size-8" />
                        </div>
                        <h2 className="text-3xl font-black italic uppercase text-slate-900 leading-none">Cálculo de <span className="text-primary italic">Lucratividade</span></h2>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 shadow-inner">
                          <div className="flex items-center justify-between mb-4">
                            <div className="size-8 rounded-lg bg-white flex items-center justify-center text-slate-400 border border-slate-100 shadow-sm">
                              <Tag className="size-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Investimento Total</span>
                          </div>
                          <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">
                            R$ {(selectedIngredients.reduce((acc, curr) => acc + curr.custo, 0) + parseFloat(productForm.mao_de_obra) + parseFloat(productForm.embalagem)).toFixed(2)}
                          </h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Custo da Receita Inteira</p>
                        </div>
                        <div className="bg-rose-50/50 rounded-3xl p-6 border border-primary/10 shadow-inner">
                          <div className="flex items-center justify-between mb-4">
                            <div className="size-8 rounded-lg bg-white flex items-center justify-center text-primary border border-primary/10 shadow-sm">
                              <Package className="size-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Custo de Produção</span>
                          </div>
                          <h3 className="text-4xl font-black text-primary tracking-tighter italic uppercase">
                            R$ {((selectedIngredients.reduce((acc, curr) => acc + curr.custo, 0) + parseFloat(productForm.mao_de_obra) + parseFloat(productForm.embalagem)) / (parseInt(productForm.rendimento) || 1)).toFixed(2)}
                          </h3>
                          <p className="text-[10px] font-black text-primary/60 uppercase mt-1">Custo p/ Unidade (Rend: {productForm.rendimento})</p>
                        </div>
                      </div>

                      <div className="bg-[#0F172A] rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#FF2F8115,transparent_50%)]" />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Qual sua Meta de Lucro?</span>
                            <div className="flex items-center gap-2">
                              <div className="size-2 rounded-full bg-green-400 animate-pulse" />
                              <span className="text-sm font-bold text-slate-300">Margem recomendada: 100%+</span>
                            </div>
                          </div>
                          <Badge className="bg-primary hover:bg-primary text-white font-black px-4 py-1.5 rounded-full text-xs shadow-lg shadow-primary/20">+{productForm.margem}% Meta</Badge>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mb-10 relative z-10">
                          {[50, 70, 100, 150].map((m) => (
                            <button
                              key={m}
                              className={cn("h-12 rounded-xl font-black text-xs uppercase transition-all border border-slate-800", parseFloat(productForm.margem) === m ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" : "bg-slate-800/50 text-slate-500 hover:text-slate-300 hover:bg-slate-800")}
                              onClick={() => setProductForm({ ...productForm, margem: m.toString() })}
                            >
                              {m}%
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-8 p-8 bg-slate-800/40 rounded-[32px] border border-slate-700/50 relative z-10">
                          <div className="flex flex-col border-r border-slate-700/50">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Preço de Venda Sugerido</span>
                            <span className="text-5xl font-black text-white italic tracking-tighter leading-none">
                              R$ {(((selectedIngredients.reduce((acc, curr) => acc + curr.custo, 0) + parseFloat(productForm.mao_de_obra) + parseFloat(productForm.embalagem)) / (parseInt(productForm.rendimento) || 1)) * (1 + parseFloat(productForm.margem) / 100)).toFixed(2)}
                            </span>
                            <span className="text-[10px] font-black text-slate-500 uppercase mt-3 tracking-widest">Valor por Fatia/Unidade</span>
                          </div>
                          <div className="flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                              <TrendingUp className="size-4 text-green-400" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-green-400/80">Lucro Líquido Real</span>
                            </div>
                            <span className="text-3xl font-black text-green-400 italic tracking-tight leading-none">
                              R$ {((((selectedIngredients.reduce((acc, curr) => acc + curr.custo, 0) + parseFloat(productForm.mao_de_obra) + parseFloat(productForm.embalagem)) / (parseInt(productForm.rendimento) || 1)) * (1 + parseFloat(productForm.margem) / 100)) - ((selectedIngredients.reduce((acc, curr) => acc + curr.custo, 0) + parseFloat(productForm.mao_de_obra) + parseFloat(productForm.embalagem)) / (parseInt(productForm.rendimento) || 1))).toFixed(2)}
                            </span>
                            <p className="text-[10px] font-bold text-slate-500 mt-3 leading-tight uppercase tracking-tight">Você ganha lucro livre em cada unidade vendida.</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-4 pt-10 border-t border-slate-100 mt-auto bg-white/80 backdrop-blur-sm z-20">
                {wizardStep > 1 && (
                  <Button variant="ghost" className="h-14 px-10 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-100 font-bold transition-all" onClick={() => setWizardStep(wizardStep - 1)}>Voltar</Button>
                )}
                <div className="flex-1 flex gap-4">
                  <Button variant="ghost" className="h-14 flex-1 rounded-2xl border border-slate-100 text-slate-400 font-bold hover:text-rose-500 hover:bg-rose-50" onClick={() => {
                    setNewProductOpen(false)
                    setWizardStep(1)
                  }}>Descartar</Button>

                  {wizardStep < 4 ? (
                    <Button className="h-14 flex-[2] rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 transition-all hover:translate-x-1" onClick={() => setWizardStep(wizardStep + 1)}>
                      Próximo Passo
                      <ArrowUpRight className="ml-2 size-5" />
                    </Button>
                  ) : (
                    <Button
                      className="h-14 flex-[2] rounded-2xl bg-primary hover:bg-primary text-white font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02]"
                      onClick={handleSaveProduct}
                      disabled={isSaving}
                    >
                      {isSaving ? "Finalizando..." : "Finalizar Precificação"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
