"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
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
  const { profile } = useBusiness()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  // Modals
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // AI Import States
  const [isAIImportOpen, setIsAIImportOpen] = useState(false)
  const [aiUrl, setAiUrl] = useState("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedProduct, setExtractedProduct] = useState<any>(null)
  const [extractedBulkData, setExtractedBulkData] = useState<any>(null)
  const [isBulkImport, setIsBulkImport] = useState(false)
  const [isSavingBulk, setIsSavingBulk] = useState(false)
  const [autoClone, setAutoClone] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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
    if (user && profile?.company_id) {
      fetchData()
    }
  }, [user, profile?.company_id])

  // draft persistence
  useEffect(() => {
    const draft = localStorage.getItem("product_draft")
    if (draft && !isProductDialogOpen) {
      try {
        const parsed = JSON.parse(draft)
        setProductData(parsed)
      } catch (e) {
        console.error("Error loading draft", e)
      }
    }
  }, [])

  useEffect(() => {
    if (isProductDialogOpen) {
      localStorage.setItem("product_draft", JSON.stringify(productData))
    }
  }, [productData, isProductDialogOpen])

  // Robustly resolve or self-heal company_id
  async function resolveCompanyId() {
    // 1. Check current state
    let cid = profile?.company_id || (user as any)?.company_id || (user as any)?.user_metadata?.company_id
    
    if (cid) return cid

    // 2. Database look-up
    if (user) {
        const { data: profileCheck } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .maybeSingle()
        
        if (profileCheck?.company_id) return profileCheck.company_id

        // 3. Search for existing company owned by this user
        const { data: companyCheck } = await supabase
            .from('companies')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle()
        
        if (companyCheck?.id) {
            // Self-heal: link company to profile
            await supabase.from('profiles').update({ company_id: companyCheck.id }).eq('id', user.id)
            return companyCheck.id
        }

        // 4. Final Fallback: Create a default business for the user
        const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert({
                name: (user as any)?.user_metadata?.store_name || "Minha Confeitaria",
                owner_id: user.id
            })
            .select()
            .single()
        
        if (newCompany) {
            await supabase.from('profiles').update({ company_id: newCompany.id }).eq('id', user.id)
            return newCompany.id
        }
    }
    
    return null
  }

  async function fetchData() {
    const companyId = await resolveCompanyId()
    if (!companyId) return

    try {
      setLoading(true)
      const [catRes, prodRes] = await Promise.all([
        supabase.from('menu_categories').select('*').eq('company_id', companyId).order('position'),
        supabase.from('menu_products').select('*').eq('company_id', companyId).order('created_at', { ascending: false })
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
    const price = parseFloat(productData.price)
    
    if (!productData.name || isNaN(price) || !productData.category_id) {
      toast.error("Preencha os campos obrigatórios corretamente (Nome, Preço válido e Categoria)")
      return
    }

    try {
      const companyId = await resolveCompanyId()

      if (!companyId) {
        toast.error("Erro: ID da empresa não pôde ser recuperado ou criado.")
        return
      }

      const payload = {
        ...productData,
        price: parseFloat(productData.price),
        company_id: companyId
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
      localStorage.removeItem("product_draft")
      setEditingProduct(null)
      fetchData()
    } catch (error: any) {
      toast.error("Erro ao salvar produto")
    }
  }

  async function handleAIExtract() {
    if (!aiUrl) {
      toast.error("Insira um link ou descrição para extrair.")
      return
    }

    setIsExtracting(true)
    try {
      const response = await fetch("/api/menu/import-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: aiUrl.startsWith("http") ? "link" : "text",
          content: aiUrl
        })
      })

      const data = await response.json()
      if (data.success) {
        if (data.data.is_bulk) {
            setExtractedBulkData(data.data)
            setIsBulkImport(true)
            // Auto-clone logic
            if (autoClone) {
              // Trigger bulk save almost instantly
              setTimeout(() => {
                  const btn = document.getElementById('btn-bulk-save')
                  if (btn) btn.click()
              }, 500)
            }
        } else {
            setExtractedProduct(data.data.product)
            setIsBulkImport(false)
        }
        toast.success("Dados extraídos com sucesso!")
      } else {
        toast.error(data.error || "Falha na extração.")
      }
    } catch (error: any) {
      toast.error("Erro ao conectar com a IA: " + error.message)
    } finally {
      setIsExtracting(false)
    }
  }

  async function handleBulkSave() {
    if (!extractedBulkData || (!user && !profile)) return
    
    setIsSavingBulk(true)
    const companyId = await resolveCompanyId()

    if (!companyId) {
        toast.error("Erro crítico: ID da empresa não encontrado após tentativa de recuperação.")
        setIsSavingBulk(false)
        return
    }

    try {
        for (const cat of extractedBulkData.categories) {
            // 1. Ensure category exists or create it
            let categoryId = ""
            const existingCat = categories.find(c => c.name.toLowerCase() === cat.name.toLowerCase())
            
            if (existingCat) {
                categoryId = existingCat.id
            } else {
                const { data: newCat, error: catError } = await supabase
                    .from('menu_categories')
                    .insert({ name: cat.name, company_id: companyId })
                    .select()
                    .single()
                
                if (catError) throw catError
                categoryId = newCat.id
            }

            // 2. Insert products for this category
            const productsToInsert = cat.products.map((p: any) => ({
                name: p.name,
                description: p.description,
                price: parseFloat(p.price) || 0,
                image_url: p.image_url,
                category_id: categoryId,
                company_id: companyId,
                active: true
            }))

            const { error: prodError } = await supabase
                .from('menu_products')
                .insert(productsToInsert)
            
            if (prodError) throw prodError
        }

        toast.success("Todos os produtos e categorias foram importados!")
        setIsAIImportOpen(false)
        setExtractedBulkData(null)
        setAiUrl("")
        fetchData()
    } catch (error: any) {
        console.error("Erro detalhado no bulk import:", error)
        toast.error("Erro ao importar dados em massa: " + (error?.message || "Erro desconhecido"))
    } finally {
        setIsSavingBulk(false)
    }
  }

  function handleAddExtractedToForm() {
    if (!extractedProduct) return
    
    setProductData({
      name: extractedProduct.name,
      description: extractedProduct.description,
      price: extractedProduct.price.toString(),
      category_id: "",
      image_url: extractedProduct.image_url,
      active: true
    })
    setIsAIImportOpen(false)
    setIsProductDialogOpen(true)
    setExtractedProduct(null)
    setAiUrl("")
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) {
    let file: File | undefined

    if ('files' in e.target && e.target.files) {
      file = e.target.files[0]
    } else if ('dataTransfer' in e && e.dataTransfer.files) {
      file = e.dataTransfer.files[0]
    }

    if (!file) return

    try {
      setIsUploading(true)
      const companyId = await resolveCompanyId()
      if (!companyId || !user) throw new Error("ID da empresa ou usuário não encontrado")

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setProductData(prev => ({ ...prev, image_url: publicUrl }))
      toast.success("Imagem enviada com sucesso!")
    } catch (error: any) {
      console.error("Erro no upload:", error)
      toast.error("Erro ao enviar imagem: " + (error.message || "Tente novamente"))
    } finally {
      setIsUploading(false)
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

  const menuLink = `https://docesgestao.netlify.app/m/${(user as any)?.company_id || "demo"}`

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
          <Dialog open={isAIImportOpen} onOpenChange={setIsAIImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-12 border-primary/20 bg-primary/5 text-primary font-bold hover:bg-primary/10 rounded-xl gap-2 transition-all hover:scale-105 active:scale-95">
                <Plus className="size-4" /> Importar com IA ✨
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-[32px] overflow-hidden p-0 border-none shadow-2xl">
              <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 size-40 bg-primary/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 relative z-10">
                  IA Doce <span className="text-primary italic">Gestão</span>
                </DialogTitle>
                <p className="text-slate-400 text-sm font-medium mt-2 relative z-10">
                  Cole um link do iFood (produto ou loja completa) ou descreva os itens para importarmos tudo automaticamente.
                </p>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {!extractedProduct && !extractedBulkData && (
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Link ou Descrição</Label>
                    <div className="relative group">
                      <LinkIcon className="absolute left-4 top-4 size-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                      <Textarea 
                        placeholder="Ex: https://www.ifood.com.br/delivery/restaurante-xyz..."
                        className="min-h-[120px] pl-12 rounded-2xl bg-slate-50 border-none font-medium text-sm focus:ring-primary/20"
                        value={aiUrl}
                        onChange={e => setAiUrl(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 px-1">
                        <input 
                            type="checkbox" 
                            id="auto-clone" 
                            checked={autoClone}
                            onChange={(e) => setAutoClone(e.target.checked)}
                            className="size-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor="auto-clone" className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer">
                            Modo Clone Turbo ✨ (Salvar automaticamente após extrair)
                        </label>
                    </div>
                  </div>
                )}

                {extractedProduct && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      {extractedProduct.image_url && (
                        <div className="size-16 rounded-xl overflow-hidden shadow-sm shrink-0">
                          <img src={extractedProduct.image_url} alt="" className="size-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-black text-slate-900 uppercase italic tracking-tight leading-none mb-1">{extractedProduct.name}</h4>
                        <span className="text-primary font-black text-lg italic tracking-tighter">R$ {extractedProduct.price.toFixed(2)}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase tracking-tight line-clamp-2">
                      {extractedProduct.description}
                    </p>
                    <Button onClick={handleAddExtractedToForm} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase italic tracking-widest text-[11px] mt-2">
                       Confirmar e Editar ✨
                    </Button>
                  </motion.div>
                )}

                {extractedBulkData && (
                  <div className="space-y-6">
                    <div className="sticky top-0 bg-white z-20 pb-2 border-b border-slate-100">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black uppercase italic tracking-tighter text-slate-900">Itens Encontrados</h3>
                            <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-3">
                                {extractedBulkData.categories.reduce((acc: number, cat: any) => acc + cat.products.length, 0)} Produtos
                            </Badge>
                        </div>
                        <Button 
                            id="btn-bulk-save"
                            onClick={handleBulkSave} 
                            disabled={isSavingBulk}
                            className="w-full h-12 rounded-xl bg-primary hover:bg-primary text-white font-black uppercase italic tracking-widest text-[11px] shadow-lg shadow-primary/20"
                        >
                            {isSavingBulk ? "Clonando Cardápio..." : "Clonar Tudo Agora ✨"}
                        </Button>
                    </div>

                    <div className="space-y-8">
                        {extractedBulkData.categories.map((cat: any, idx: number) => (
                            <div key={idx} className="space-y-3">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <ListOrdered className="size-3" /> {cat.name}
                                </h4>
                                <div className="space-y-2">
                                    {cat.products.map((p: any, pIdx: number) => (
                                        <div key={pIdx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                                            {p.image_url ? (
                                                <div className="size-10 rounded-lg overflow-hidden shrink-0">
                                                    <img src={p.image_url} alt="" className="size-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-300">
                                                    <Coffee className="size-5" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-bold text-slate-900 uppercase italic truncate">{p.name}</p>
                                                <p className="text-[10px] font-black text-primary italic">R$ {parseFloat(p.price).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>
                )}

                {!extractedProduct && !extractedBulkData && (
                  <Button 
                    onClick={handleAIExtract} 
                    disabled={isExtracting}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary text-white font-black uppercase italic tracking-widest text-xs shadow-xl shadow-primary/20"
                  >
                    {isExtracting ? "Extraindo Dados..." : "Extrair com IA ✨"}
                  </Button>
                )}
              </div>
            </DialogContent>
          </Dialog>

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

          <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingProduct(null)
                  setProductData({ name: "", description: "", price: "", category_id: "", image_url: "", active: true })
                }}
                className="h-12 px-6 rounded-xl bg-primary hover:bg-primary text-white font-black uppercase italic tracking-widest text-[10px] shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
              >
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
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Imagem do Produto</Label>
                  <div className="flex flex-col gap-4">
                    <div 
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleImageUpload(e as any); }}
                      className={cn(
                        "relative h-40 rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center transition-all bg-slate-50",
                        isUploading ? "border-primary animate-pulse" : "border-slate-200 hover:border-primary hover:bg-slate-50/50"
                      )}
                    >
                      {productData.image_url ? (
                        <div className="relative size-full p-2">
                          <img src={productData.image_url} alt="" className="size-full object-contain rounded-xl" />
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-4 right-4 size-8 rounded-lg"
                            onClick={(e) => { e.stopPropagation(); setProductData({...productData, image_url: ""}); }}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ) : (
                        <label htmlFor="product-image-upload" className="flex flex-col items-center gap-2 cursor-pointer w-full h-full justify-center">
                          <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm text-slate-400">
                             <ImageIcon className="size-6" />
                          </div>
                          <div className="text-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 block">Arraste a foto aqui</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ou clique para selecionar</span>
                          </div>
                        </label>
                      )}
                    </div>
                    <div className="relative">
                      <Input 
                        placeholder="Ou cole o link da imagem aqui..." 
                        className="h-12 rounded-xl bg-slate-50 border-none font-medium px-4"
                        value={productData.image_url}
                        onChange={e => setProductData({...productData, image_url: e.target.value})}
                      />
                      <input 
                        type="file" 
                        accept="image/*" 
                        id="product-image-upload" 
                        className="hidden" 
                        onChange={handleImageUpload}
                        disabled={isUploading}
                      />
                    </div>
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
