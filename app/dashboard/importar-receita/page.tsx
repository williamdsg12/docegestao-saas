"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Import,
    Link as LinkIcon,
    FileText,
    Loader2,
    CheckCircle2,
    ChefHat,
    Plus,
    ChevronRight,
    ShoppingCart,
    Calculator,
    Package
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"

export default function ImportarReceitaPage() {
    const [importType, setImportType] = useState<"text" | "link">("text")
    const [recipeContent, setRecipeContent] = useState("")
    const [url, setUrl] = useState("")
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isSaving, setIsSaving] = useState(false) // Renamed from 'loading' to avoid conflict with useAuth
    const [recipeData, setRecipeData] = useState<any>(null) // Renamed from 'recipe'
    const { user, loading } = useAuth()
    const router = useRouter()

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando sua sessão...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                <div className="size-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6">
                    <Package className="size-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic mb-2">Acesso Restrito</h2>
                <p className="text-slate-500 max-w-sm mb-8">
                    Você precisa estar logado para acessar a ferramenta de importação de receitas com IA.
                </p>
                <Button onClick={() => router.push('/login')} className="h-12 px-8 rounded-xl uppercase font-black tracking-widest">
                    Ir para Login
                </Button>
            </div>
        )
    }

    const handleImport = async () => {
        if ((importType === "text" && !recipeContent) || (importType === "link" && !url)) {
            toast.error("Por favor, preencha o conteúdo para importar.")
            return
        }

        setIsAnalyzing(true)
        try {
            const response = await fetch("/api/receitas/importar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: importType,
                    content: importType === "text" ? recipeContent : url
                })
            })

            const responseText = await response.text()
            console.log("Resposta bruta da API:", responseText)

            let data: any = {}
            try {
                data = JSON.parse(responseText)
            } catch (e) {
                console.error("Falha ao parsear JSON:", e)
            }

            if (data.success) {
                setRecipeData(data.recipe)
                toast.success("Receita analisada com sucesso!")
            } else {
                console.error("Erro detalhado da API:", data)
                toast.error(data.error || "Erro ao importar receita.", {
                    description: data.details || responseText || "Tente novamente mais tarde.",
                    duration: 5000
                })
            }
        } catch (error) {
            toast.error("Ocorreu um erro na conexão.")
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleSave = async () => {
        if (!user) {
            toast.error("Você precisa estar logado para salvar.")
            return
        }
        if (!recipeData) {
            toast.error("Nenhuma receita importada para salvar.")
            return
        }

        console.log(">>> Frontend: Salvando receita...", { uid: (user as any).uid || (user as any).id, recipeName: recipeData.nome })
        setIsSaving(true)
        try {
            const response = await fetch("/api/receitas/salvar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recipe: recipeData,
                    userId: (user as any).uid || (user as any).id
                })
            })

            const data = await response.json()
            if (data.success) {
                toast.success("Receita salva com sucesso!")
                router.push("/dashboard/lista-compras")
            } else {
                console.error(">>> Frontend: Erro ao salvar:", data)
                toast.error(data.error || "Erro ao salvar receita.")
            }
        } catch (error) {
            console.error(">>> Frontend: Erro crítico ao salvar:", error)
            toast.error("Erro de conexão ao salvar.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col gap-4">
                <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-2 italic uppercase">
                    Importar <span className="text-primary font-black">Receita</span>
                </h1>
                <p className="text-slate-500 font-medium tracking-tight max-w-2xl">
                    Transforme qualquer texto ou link em uma ficha técnica estruturada. Nossa IA cuida da extração para você.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 space-y-6">
                    <Card className="rounded-[32px] border-slate-200 overflow-hidden shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                            <CardTitle className="text-xl font-black italic uppercase italic">Como deseja importar?</CardTitle>
                            <CardDescription className="font-medium">Escolha entre colar o texto da receita ou apenas um link.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <Tabs defaultValue="text" onValueChange={(val) => setImportType(val as any)}>
                                <TabsList className="grid w-full grid-cols-2 h-14 bg-slate-100 rounded-2xl p-1 mb-8">
                                    <TabsTrigger value="text" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                        <FileText className="mr-2 size-4" />
                                        Colar Receita
                                    </TabsTrigger>
                                    <TabsTrigger value="link" className="rounded-xl font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm">
                                        <LinkIcon className="mr-2 size-4" />
                                        Colar Link
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="text" className="space-y-6 duration-500 animate-in fade-in-0 slide-in-from-bottom-2">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Receita completa (Ingredientes e Preparo)</Label>
                                        <Textarea
                                            placeholder="Cole aqui o texto da sua receita..."
                                            className="min-h-[300px] rounded-2xl border-slate-200 bg-slate-50/50 p-6 font-medium focus:ring-primary/20 transition-all resize-none"
                                            value={recipeContent}
                                            onChange={(e) => setRecipeContent(e.target.value)}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="link" className="space-y-6 duration-500 animate-in fade-in-0 slide-in-from-bottom-2">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">URL da Receita (Ex: TudoGostoso, Panelinha...)</Label>
                                        <div className="relative group">
                                            <LinkIcon className="absolute left-6 top-1/2 -translate-y-1/2 size-5 text-slate-300 group-focus-within:text-primary transition-colors" />
                                            <Input
                                                placeholder="https://sua-receita-favorita.com/bolo-de-chocolate"
                                                className="h-16 pl-14 rounded-2xl border-slate-200 bg-slate-50/50 font-bold"
                                                value={url}
                                                onChange={(e) => setUrl(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <Button
                                onClick={handleImport}
                                disabled={isAnalyzing}
                                className="w-full h-16 mt-8 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-200 transition-all group"
                            >
                                {isAnalyzing ? (
                                    <Loader2 className="mr-2 size-5 animate-spin" />
                                ) : (
                                    <>
                                        Analisar Receita com IA
                                        <ChevronRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Status / Results Sidebar */}
                <div className="lg:col-span-2 space-y-6">
                    <AnimatePresence mode="wait">
                        {!recipeData ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="h-full min-h-[400px] border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center p-12 text-center text-slate-400"
                            >
                                <div className="size-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
                                    <Import className="size-10" />
                                </div>
                                <h3 className="text-xl font-black italic uppercase text-slate-300">Aguardando Importação</h3>
                                <p className="mt-2 text-sm font-medium">Assim que você clicar em analisar, o resultado estruturado aparecerá aqui.</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <Card className="rounded-[32px] border-primary/20 bg-primary/[0.02] shadow-xl shadow-primary/5 overflow-hidden">
                                    <CardHeader className="p-8 border-b border-primary/10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge className="bg-primary text-white font-black px-3 py-1 rounded-full text-[10px] uppercase">Sucesso</Badge>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Receita Estruturada</span>
                                        </div>
                                        <CardTitle className="text-3xl font-black italic uppercase text-slate-900 leading-none">{recipeData.nome}</CardTitle>
                                        <div className="flex items-center gap-4 mt-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <ChefHat className="size-4 text-primary" />
                                                Rendimento: {recipeData.rendimento} porções
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ingredientes Identificados ({recipeData.ingredientes.length})</h4>
                                            <div className="space-y-3">
                                                {recipeData.ingredientes && recipeData.ingredientes.length > 0 ? (
                                                    recipeData.ingredientes.map((ing: any, i: number) => (
                                                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                                            <span className="text-sm font-black italic uppercase text-slate-700">{ing.nome}</span>
                                                            <span className="text-xs font-black text-primary italic">{ing.quantidade} {ing.unidade}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center p-4 text-slate-400 text-xs font-bold uppercase italic">Nenhum ingrediente identificado</div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <Button
                                                onClick={handleSave}
                                                disabled={isSaving}
                                                className="h-14 rounded-2xl bg-primary hover:bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
                                            >
                                                {isSaving ? (
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="mr-2 size-4" />
                                                        Salvar e Gerar Lista
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => router.push("/dashboard/precificacao")}
                                                className="h-14 rounded-2xl border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest"
                                            >
                                                <Calculator className="mr-2 size-4" />
                                                Precificar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 size-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                                    <div className="flex items-center gap-3 mb-3">
                                        <ShoppingCart className="size-5 text-primary" />
                                        <h4 className="text-sm font-black uppercase italic tracking-widest">Próximo Passo</h4>
                                    </div>
                                    <p className="text-xs font-medium text-slate-400 leading-relaxed italic">
                                        Ao salvar, a lista de compras será criada automaticamente. Você poderá consolidar várias receitas em uma única lista para suas compras semanais.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
