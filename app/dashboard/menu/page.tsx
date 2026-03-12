"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Image as ImageIcon, 
  Coffee, 
  ChevronRight,
  MoreVertical,
  ExternalLink,
  Copy,
  LayoutGrid,
  ListOrdered,
  Share2,
  Link as LinkIcon
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Category {
  id: string
  name: string
  active: boolean
}

interface Product {
  id: string
  name: string
  description: string
  price: number
  category_id: string
  image_url: string
  active: boolean
  category?: Category
}

export default function DigitalMenuPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  // Modals
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form States
  const [categoryName, setCategoryName] = useState("")
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    active: true
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  async function fetchData() {
    try {
      setLoading(true)
      const [catRes, prodRes] = await Promise.all([
        supabase.from('menu_categories').select('*').order('position'),
        supabase.from('menu_products').select('*').order('created_at', { ascending: false })
      ])

      const categoriesData = catRes.data || []

      if (prodRes.data) {
        setProducts(prodRes.data.map((p: any) => ({
          ...p,
          category: { name: categoriesData.find((c: any) => c.id === p.category_id)?.name || "Sem categoria" }
        })))
      } else {
        setProducts([])
      }
      setCategories(categoriesData)
    } catch (error: any) {
      console.error("Error fetching data:", error.message)
      toast.error("Erro ao carregar dados do cardápio")
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveCategory() {
    if (!categoryName) return
    
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('menu_categories')
          .update({ name: categoryName })
          .eq('id', editingCategory.id)
        if (error) throw error
        toast.success("Categoria atualizada!")
      } else {
        const { error } = await supabase
          .from('menu_categories')
          .insert({ name: categoryName, company_id: (user as any)?.company_id })
        if (error) throw error
        toast.success("Categoria criada!")
      }
      setIsCategoryDialogOpen(false)
      setCategoryName("")
      setEditingCategory(null)
      fetchData()
    } catch (error: any) {
      toast.error("Erro ao salvar categoria")
    }
  }

  async function handleSaveProduct() {
    if (!productData.name || !productData.price || !productData.category_id) {
      toast.error("Preencha os campos obrigatórios")
      return
    }

    try {
      const payload = {
        ...productData,
        price: parseFloat(productData.price),
        company_id: (user as any)?.company_id
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('menu_products')
          .update(payload)
          .eq('id', editingProduct.id)
        if (error) throw error
        toast.success("Produto atualizado!")
      } else {
        const { error } = await supabase
          .from('menu_products')
          .insert(payload)
        if (error) throw error
        toast.success("Produto criado!")
      }
      setIsProductDialogOpen(false)
      setProductData({ name: "", description: "", price: "", category_id: "", image_url: "", active: true })
      setEditingProduct(null)
      fetchData()
    } catch (error: any) {
      toast.error("Erro ao salvar produto")
    }
  }

  async function handleToggleActive(id: string, table: string, current: boolean) {
    try {
      const { error } = await supabase
        .from(table)
        .update({ active: !current })
        .eq('id', id)
      if (error) throw error
      fetchData()
    } catch (error) {
      toast.error("Erro ao atualizar status")
    }
  }

  async function handleDelete(id: string, table: string) {
    if (!confirm("Tem certeza que deseja excluir?")) return
    try {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      toast.success("Excluído com sucesso!")
      fetchData()
    } catch (error) {
      toast.error("Erro ao excluir")
    }
  }

  const filteredProducts = products.filter((p: Product) => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name.toLowerCase().includes(search.toLowerCase())
  )

  const menuLink = `https://docegestao.app/m/${(user as any)?.company_id || "demo"}`

  function handleCopyLink() {
      navigator.clipboard.writeText(menuLink)
      toast.success("Link copiado para a área de transferência!")
  }

  function handleOpenMenu() {
      window.open(menuLink, '_blank')
  }

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 uppercase italic leading-none">
            Cardápio <span className="text-primary tracking-tighter">Digital</span>
          </h1>
          <p className="text-slate-500 font-medium">Gerencie o que seus clientes veem na sua vitrine online.</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-600 gap-2 hover:border-primary hover:text-primary transition-colors">
                    <Share2 className="size-4" /> Compartilhar
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 border-white/60 bg-white/90 backdrop-blur-2xl shadow-xl">
                  <DropdownMenuItem onClick={handleCopyLink} className="rounded-xl h-12 px-3 font-bold text-sm text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:text-primary">
                      <LinkIcon className="mr-3 size-4" /> Copiar Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleOpenMenu} className="rounded-xl h-12 px-3 font-bold text-sm text-slate-700 cursor-pointer hover:bg-slate-50 focus:bg-slate-50 focus:text-primary">
                      <ExternalLink className="mr-3 size-4" /> Ver Cardápio Online
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isProductDialogOpen} onOpenChange={(val) => {
            setIsProductDialogOpen(val)
            if(!val) { setEditingProduct(null); setProductData({ name: "", description: "", price: "", category_id: "", image_url: "", active: true }) }
          }}>
            <DialogTrigger asChild>
              <Button className="h-12 px-6 rounded-xl bg-primary hover:bg-primary text-white font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
                <Plus className="mr-2 size-5" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-[32px]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                  {editingProduct ? 'Editar' : 'Novo'} <span className="text-primary">Produto</span>
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome</Label>
                    <Input 
                      placeholder="Ex: Bolo de Brigadeiro" 
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                      value={productData.name}
                      onChange={e => setProductData({...productData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preço (R$)</Label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                      value={productData.price}
                      onChange={e => setProductData({...productData, price: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</Label>
                  <Select 
                    value={productData.category_id}
                    onValueChange={val => setProductData({...productData, category_id: val})}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none font-bold">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: Category) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição</Label>
                  <Textarea 
                    placeholder="Conte mais sobre o produto..." 
                    className="min-h-[100px] rounded-xl bg-slate-50 border-none font-medium text-sm"
                    value={productData.description}
                    onChange={e => setProductData({...productData, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Link da Imagem</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://..." 
                      className="h-12 rounded-xl bg-slate-50 border-none font-medium flex-1"
                      value={productData.image_url}
                      onChange={e => setProductData({...productData, image_url: e.target.value})}
                    />
                    <Button variant="outline" className="h-12 w-12 rounded-xl border-dashed border-slate-200">
                      <ImageIcon className="size-5 text-slate-400" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveProduct} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase italic tracking-widest shadow-xl">
                  Salvar Produto ✨
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="produtos" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-2xl h-14 shadow-sm">
            <TabsTrigger value="produtos" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
              <LayoutGrid className="size-4" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="categorias" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-white gap-2">
              <ListOrdered className="size-4" /> Categorias
            </TabsTrigger>
          </TabsList>

          <div className="relative group max-w-md w-full">
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Pesquisar..." 
              className="h-14 rounded-2xl border-slate-200 bg-white pl-12 font-medium shadow-sm focus:ring-primary/10"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="produtos" className="mt-8 transition-all">
          <div className="rounded-[40px] border border-slate-200 bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 italic">
                  <TableHead className="py-5 pl-8 text-[10px] font-black uppercase tracking-widest text-slate-400">Produto</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Preço</TableHead>
                  <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</TableHead>
                  <TableHead className="py-5 pr-8 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p: Product) => (
                  <TableRow key={p.id} className="group border-slate-100 hover:bg-slate-50 transition-colors">
                    <TableCell className="py-6 pl-8">
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="size-full object-cover" />
                          ) : (
                            <Coffee className="size-6" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 uppercase italic tracking-tight">{p.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{p.description || "Sem descrição"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-pink-50 text-primary border-pink-100 shadow-none">
                        {p.category?.name || "Sem categoria"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-black text-slate-900 italic tracking-tighter text-lg">
                      R$ {p.price.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <button 
                        onClick={() => handleToggleActive(p.id, 'menu_products', p.active)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all",
                          p.active 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                            : "bg-slate-100 text-slate-400 border-slate-200"
                        )}
                      >
                        {p.active ? "Ativo" : "Inativo"}
                      </button>
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                       <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-9 rounded-xl bg-slate-50 hover:bg-primary/10 text-slate-400 hover:text-primary transition-all"
                          onClick={() => {
                            setEditingProduct(p)
                            setProductData({
                              name: p.name,
                              description: p.description || "",
                              price: p.price.toString(),
                              category_id: p.category_id,
                              image_url: p.image_url || "",
                              active: p.active
                            })
                            setIsProductDialogOpen(true)
                          }}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-9 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-all"
                          onClick={() => handleDelete(p.id, 'menu_products')}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="categorias" className="mt-8">
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Dialog open={isCategoryDialogOpen} onOpenChange={(val) => {
              setIsCategoryDialogOpen(val)
              if(!val) { setEditingCategory(null); setCategoryName(""); }
            }}>
              <DialogTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: "#fff" }}
                  whileTap={{ scale: 0.98 }}
                  className="h-[120px] rounded-[32px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 group transition-all"
                >
                  <Plus className="size-8 text-slate-300 group-hover:text-primary group-hover:rotate-90 transition-all" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary">Nova Categoria</span>
                </motion.button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-[32px]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">
                    {editingCategory ? 'Editar' : 'Nova'} <span className="text-primary">Categoria</span>
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome da Categoria</Label>
                  <Input 
                    placeholder="Ex: Bolos de Festa" 
                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-lg mt-2"
                    value={categoryName}
                    onChange={e => setCategoryName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveCategory} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase italic tracking-widest shadow-xl">
                    Salvar Categoria ✨
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {categories.map((cat) => (
              <motion.div 
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all"
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Categoria</span>
                  <span className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">{cat.name}</span>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Badge className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase border-none", cat.active ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                    {cat.active ? "Ativa" : "Inativa"}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 rounded-lg hover:bg-slate-100"
                      onClick={() => {
                        setEditingCategory(cat)
                        setCategoryName(cat.name)
                        setIsCategoryDialogOpen(true)
                      }}
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-8 rounded-lg hover:bg-rose-50 hover:text-rose-500"
                      onClick={() => handleDelete(cat.id, 'menu_categories')}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
