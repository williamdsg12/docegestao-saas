"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Building2, 
  User, 
  MapPin, 
  QrCode, 
  Phone, 
  Mail, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  Globe,
  Search,
  Check
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const onboardingSchema = z.object({
  // Account Info
  documentType: z.enum(["CPF", "CNPJ"]),
  documentNumber: z.string().min(11, "Documento inválido"),
  fullName: z.string().min(3, "Nome muito curto"),
  motherName: z.string().min(3, "Nome da mãe obrigatório"),
  birthDate: z.string().min(10, "Data inválida"),
  occupation: z.string().min(2, "Ocupação obrigatória"),
  website: z.string().url("URL inválida").optional().or(z.literal('')),
  
  // Billing Info
  cep: z.string().min(8, "CEP inválido"),
  state: z.string().min(2, "Estado obrigatório"),
  city: z.string().min(2, "Cidade obrigatória"),
  neighborhood: z.string().min(2, "Bairro obrigatório"),
  address: z.string().min(3, "Endereço obrigatório"),
  number: z.string().min(1, "Número obrigatório"),
  complement: z.string().optional(),
  
  // Bank Info
  bank: z.string().min(1, "Banco obrigatório"),
  accountType: z.enum(["corrente", "poupança"]),
  branch: z.string().min(1, "Agência obrigatória"),
  account: z.string().min(1, "Conta obrigatória"),
  
  // PIX Info
  pixType: z.enum(["CPF", "Email", "Telefone", "Aleatória"]),
  pixKey: z.string().min(1, "Chave Pix obrigatória"),
  
  // Contact info
  email: z.string().email("Email inválido"),
  phone: z.string().min(11, "Telefone inválido"),
  
  // Confirmation
  agreed: z.literal(true, {
    errorMap: () => ({ message: "Você deve concordar para continuar" }),
  }),
})

type OnboardingValues = z.infer<typeof onboardingSchema>

interface TunaOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: any) => void
  tenantId: string
}

const SECTIONS = [
  { id: "account", title: "Identificação", icon: User },
  { id: "billing", title: "Endereço", icon: MapPin },
  { id: "bank", title: "Dados Bancários", icon: Building2 },
  { id: "pix", title: "Chave PIX", icon: QrCode },
  { id: "contact", title: "Contato", icon: Mail },
]

export function TunaOnboardingModal({ isOpen, onClose, onSuccess, tenantId }: TunaOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingCEP, setIsFetchingCEP] = useState(false)
  const [banks, setBanks] = useState<any[]>([])
  const [searchBankOpen, setSearchBankOpen] = useState(false)
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      documentType: "CPF",
      accountType: "corrente",
      pixType: "CPF",
    }
  })

  // 1. Carregar lista de bancos
  useEffect(() => {
    async function loadBanks() {
      try {
        const response = await fetch("https://brasilapi.com.br/api/banks/v1")
        const data = await response.json()
        if (Array.isArray(data)) {
          // Filtrar bancos que tenham código e nome
          setBanks(data.filter(b => b.code).sort((a, b) => a.name.localeCompare(b.name)))
        }
      } catch (error) {
        console.error("Erro ao carregar bancos:", error)
      }
    }
    loadBanks()
  }, [])

  // 2. Lógica de Autocomplete de CEP
  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "")
    form.setValue("cep", value)

    if (value.length === 8) {
      try {
        setIsFetchingCEP(true)
        const response = await fetch(`https://viacep.com.br/ws/${value}/json/`)
        const data = await response.json()

        if (data.erro) {
          toast.error("CEP não encontrado")
          return
        }

        form.setValue("state", data.uf)
        form.setValue("city", data.localidade)
        form.setValue("neighborhood", data.bairro)
        form.setValue("address", data.logradouro)
        toast.success("Endereço preenchido!")
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      } finally {
        setIsFetchingCEP(false)
      }
    }
  }

  const onSubmit = async (values: OnboardingValues) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/tuna/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, tenant_id: tenantId }),
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Erro no onboarding")

      toast.success("Cadastro enviado com sucesso!")
      onSuccess(data)
      onClose()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < SECTIONS.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !isLoading && !val && onClose()}>
      <DialogContent className="max-w-[1200px] w-full md:w-[95vw] p-0 overflow-hidden bg-white rounded-[20px] border-none shadow-2xl h-[90vh] md:max-h-[95vh] flex flex-col sm:max-w-full m-0 md:m-auto">
        {/* HEADER (FIXO) */}
        <DialogHeader className="p-8 md:p-10 shrink-0 border-b border-slate-100 bg-white z-30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                Ativar <span className="text-rose-500">Pagamentos</span>
              </DialogTitle>
              <DialogDescription className="text-xs font-bold uppercase text-slate-400 mt-3 italic tracking-widest">
                Onboarding Doce Gestão & Tuna
              </DialogDescription>
            </div>
            <div className="hidden sm:flex gap-3">
              {SECTIONS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "h-2.5 rounded-full transition-all duration-500",
                    idx === currentStep ? "w-16 bg-rose-500" : (idx < currentStep ? "w-8 bg-emerald-400" : "w-8 bg-slate-200")
                  )} 
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* BODY (SCROLLÁVEL) */}
        <div className="flex-1 overflow-y-auto p-8 md:p-14 custom-scrollbar bg-slate-50/30">
          <form id="onboarding-form" onSubmit={form.handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-10"
              >
                {currentStep === 0 && (
                  <Card className="rounded-[16px] border border-slate-100 shadow-sm bg-white overflow-hidden p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="size-12 rounded-[12px] bg-rose-50 text-rose-500 flex items-center justify-center">
                        <User size={24} />
                      </div>
                      <h3 className="text-xl font-black uppercase italic text-slate-900 tracking-tight">Informações da Conta</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Tipo de Documento</Label>
                        <Select onValueChange={(val) => form.setValue("documentType", val as any)} defaultValue={form.getValues("documentType")}>
                          <SelectTrigger className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus:ring-rose-500">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="CPF">CPF (Pessoa Física)</SelectItem>
                            <SelectItem value="CNPJ">CNPJ (Empresa)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Número do Documento</Label>
                        <Input 
                          {...form.register("documentNumber")} 
                          placeholder="000.000.000-00" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-rose-500"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Nome Completo</Label>
                        <Input 
                          {...form.register("fullName")} 
                          placeholder="Nome conforme documento" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-rose-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Nome da Mãe</Label>
                        <Input 
                          {...form.register("motherName")} 
                          placeholder="Nome completo" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-rose-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Data de Nascimento</Label>
                        <Input 
                          {...form.register("birthDate")} 
                          type="date"
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-rose-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Ocupação</Label>
                        <Input 
                          {...form.register("occupation")} 
                          placeholder="Ex: Padeiro, Empresário" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-rose-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Website (Opcional)</Label>
                        <div className="relative">
                          < Globe size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                          <Input 
                            {...form.register("website")} 
                            placeholder="www.seusite.com.br" 
                            className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] pl-12 font-black italic focus-visible:ring-rose-500"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {currentStep === 1 && (
                  <Card className="rounded-[16px] border border-slate-100 shadow-sm bg-white overflow-hidden p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="size-12 rounded-[12px] bg-amber-50 text-amber-500 flex items-center justify-center">
                        <MapPin size={24} />
                      </div>
                      <h3 className="text-xl font-black uppercase italic text-slate-900 tracking-tight">Endereço de Faturamento</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">CEP</Label>                                                                   
                        <div className="relative">
                          <Input 
                            {...form.register("cep")} 
                            onChange={handleCEPChange}
                            maxLength={9}
                            placeholder="00000-000" 
                            className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-amber-500"
                          />
                          {isFetchingCEP && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="size-4 animate-spin text-amber-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Estado</Label>
                        <Input 
                          {...form.register("state")} 
                          placeholder="UF" 
                          maxLength={2}
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black uppercase italic focus-visible:ring-amber-500 text-center"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Cidade</Label>
                        <Input 
                          {...form.register("city")} 
                          placeholder="Sua cidade" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-amber-500"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Endereço (Rua/Av)</Label>
                        <Input 
                          {...form.register("address")} 
                          placeholder="Logradouro" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Número</Label>
                        <Input 
                          {...form.register("number")} 
                          placeholder="Nº" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Bairro</Label>
                        <Input 
                          {...form.register("neighborhood")} 
                          placeholder="Seu bairro" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-amber-500"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Complemento (Opcional)</Label>
                        <Input 
                          {...form.register("complement")} 
                          placeholder="Apto, Bloco, etc." 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-amber-500"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {currentStep === 2 && (
                  <Card className="rounded-[16px] border border-slate-100 shadow-sm bg-white overflow-hidden p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="size-12 rounded-[12px] bg-indigo-50 text-indigo-500 flex items-center justify-center">
                        <Building2 size={24} />
                      </div>
                      <h3 className="text-xl font-black uppercase italic text-slate-900 tracking-tight">Dados Bancários</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Banco</Label>
                        <Popover open={searchBankOpen} onOpenChange={setSearchBankOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={searchBankOpen}
                              className="w-full justify-between rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic hover:bg-slate-50 px-4"
                            >
                              <span className="truncate">
                                {form.watch("bank") 
                                  ? banks.find((b) => b.code?.toString() === form.watch("bank"))?.name || `Banco ${form.watch("bank")}`
                                  : "Selecione o banco"}
                              </span>
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full min-w-[300px] p-0 rounded-xl shadow-2xl border-slate-100" align="start">
                            <Command className="rounded-xl">
                              <CommandInput placeholder="Buscar por nome ou código..." className="h-12" />
                              <CommandList className="max-h-[300px] custom-scrollbar">
                                <CommandEmpty>Nenhum banco encontrado.</CommandEmpty>
                                <CommandGroup>
                                  {banks.map((banco) => (
                                    <CommandItem
                                      key={banco.ispb}
                                      value={`${banco.code} ${banco.name} ${banco.fullName}`}
                                      onSelect={() => {
                                        form.setValue("bank", banco.code?.toString())
                                        setSearchBankOpen(false)
                                      }}
                                      className="py-3 px-4 cursor-pointer hover:bg-indigo-50"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 text-indigo-500",
                                          form.watch("bank") === banco.code?.toString() ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span className="font-black italic text-xs uppercase text-slate-900 leading-none">{banco.name}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Cód: {banco.code}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Tipo de Conta</Label>
                        <Select onValueChange={(val) => form.setValue("accountType", val as any)} defaultValue={form.getValues("accountType")}>
                          <SelectTrigger className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus:ring-indigo-500">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="corrente">Conta Corrente</SelectItem>
                            <SelectItem value="poupança">Conta Poupança</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Agência</Label>
                        <Input 
                          {...form.register("branch")} 
                          placeholder="0000" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-indigo-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Conta com Dígito</Label>
                        <Input 
                          {...form.register("account")} 
                          placeholder="00000-0" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {currentStep === 3 && (
                  <Card className="rounded-[16px] border border-slate-100 shadow-sm bg-white overflow-hidden p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="size-12 rounded-[12px] bg-emerald-50 text-emerald-500 flex items-center justify-center">
                        <QrCode size={24} />
                      </div>
                      <h3 className="text-xl font-black uppercase italic text-slate-900 tracking-tight">Transferência via PIX</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Tipo de Chave</Label>
                        <Select onValueChange={(val) => form.setValue("pixType", val as any)} defaultValue={form.getValues("pixType")}>
                          <SelectTrigger className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus:ring-emerald-500">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="CPF">CPF</SelectItem>
                            <SelectItem value="Email">Email</SelectItem>
                            <SelectItem value="Telefone">Telefone</SelectItem>
                            <SelectItem value="Aleatória">Chave Aleatória</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Sua Chave Pix</Label>
                        <Input 
                          {...form.register("pixKey")} 
                          placeholder="Insira sua chave Pix aqui" 
                          className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </Card>
                )}

                {currentStep === 4 && (
                  <div className="space-y-10">
                    <Card className="rounded-[16px] border border-slate-100 shadow-sm bg-white overflow-hidden p-8 md:p-10">
                      <div className="flex items-center gap-4 mb-10">
                        <div className="size-12 rounded-[12px] bg-rose-50 text-rose-500 flex items-center justify-center">
                          <Phone size={24} />
                        </div>
                        <h3 className="text-xl font-black uppercase italic text-slate-900 tracking-tight">Informações de Contato</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Email de Contato</Label>
                          <Input 
                            {...form.register("email")} 
                            placeholder="seu@email.com" 
                            className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-rose-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-black uppercase text-slate-500 italic ml-1">Telefone Celular</Label>
                          <Input 
                            {...form.register("phone")} 
                            placeholder="(00) 00000-0000" 
                            className="rounded-[10px] border-slate-200 bg-white h-[48px] md:h-[52px] font-black italic focus-visible:ring-rose-500"
                          />
                        </div>
                      </div>
                    </Card>

                    <div className="p-8 rounded-[16px] bg-emerald-50/50 border border-emerald-100 flex items-start gap-4">
                      <Checkbox 
                        id="agreed" 
                        className="mt-1 size-5 border-emerald-500 data-[state=checked]:bg-emerald-500"
                        onCheckedChange={(val) => form.setValue("agreed", val as any)}
                      />
                      <Label htmlFor="agreed" className="text-xs md:text-sm font-bold text-emerald-800 leading-relaxed cursor-pointer tracking-tight">
                        Confirmo que as informações bancárias e PIX fornecidas pertencem ao titular do documento informado acima e estou ciente da política de repasses da Tuna.
                      </Label>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </div>

        {/* FOOTER (FIXO) */}
        <div className="p-8 md:p-10 shrink-0 border-t border-slate-100 bg-white z-30 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0 || isLoading}
            className="rounded-xl h-[48px] md:h-[52px] px-8 font-black uppercase italic tracking-wider text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={20} className="mr-2" /> Voltar
          </Button>

          {currentStep === SECTIONS.length - 1 ? (
            <Button
              type="submit"
              form="onboarding-form"
              disabled={isLoading}
              className="rounded-xl h-[48px] md:h-[52px] px-12 bg-emerald-500 hover:bg-emerald-600 font-black uppercase italic tracking-widest text-[13px] shadow-lg shadow-emerald-200 transition-all hover:-translate-y-1 active:translate-y-0"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>Finalizar Cadastro <ChevronRight size={20} className="ml-2" /></>}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={isLoading}
              className="rounded-xl h-[48px] md:h-[52px] px-12 bg-rose-500 hover:bg-rose-600 font-black uppercase italic tracking-widest text-[13px] shadow-lg shadow-rose-200 transition-all hover:-translate-y-1 active:translate-y-0"
            >
              Continuar <ChevronRight size={20} className="ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
