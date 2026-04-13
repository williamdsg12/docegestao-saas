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
  Check,
  ShieldCheck
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { ALL_BANKS } from "@/constants/banks"
import { validateCPF, validateCNPJ, validatePIX, formatDocument } from "@/lib/validations"

const onboardingSchema = z.object({
  // Account Info
  documentType: z.enum(["CPF", "CNPJ"]),
  documentNumber: z.string().refine((val) => {
    const clean = val.replace(/\D/g, "");
    return clean.length === 11 || clean.length === 14;
  }, "Número de documento inválido"),
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
  pixType: z.enum(["CPF", "CNPJ", "EMAIL", "TELEFONE", "ALEATÓRIA"]),
  pixKey: z.string().min(1, "Chave Pix obrigatória"),
  
  // Contact info
  email: z.string().email("Email inválido"),
  phone: z.string().min(11, "Telefone inválido"),
  
  // Confirmation
  agreed: z.literal(true, {
    errorMap: () => ({ message: "Você deve estar ciente para continuar" }),
  }),
})

type OnboardingValues = z.infer<typeof onboardingSchema>

interface TunaOnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (data: any) => void
  tenantId: string
}

const STEPS = [
  { id: "account", title: "Informações da Conta", icon: User },
  { id: "billing", title: "Informações de Faturamento", icon: MapPin },
  { id: "bank", title: "Informações Bancárias", icon: Building2 },
  { id: "contact", title: "Informações de Contato", icon: Mail },
]

export function TunaOnboardingModal({ isOpen, onClose, onSuccess, tenantId }: TunaOnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingCEP, setIsFetchingCEP] = useState(false)
  const [searchBankOpen, setSearchBankOpen] = useState(false)
  
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      documentType: "CPF",
      accountType: "corrente",
      pixType: "CPF",
    }
  })

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
    // Real Validations (Module 5)
    if (values.documentType === "CPF" && !validateCPF(values.documentNumber)) {
      return toast.error("CPF inválido");
    }
    if (values.documentType === "CNPJ" && !validateCNPJ(values.documentNumber)) {
      return toast.error("CNPJ inválido");
    }
    if (!validatePIX(values.pixKey, values.pixType)) {
      return toast.error(`Chave PIX do tipo ${values.pixType} está inválida`);
    }

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
    if (currentStep < STEPS.length - 1) {
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
      <DialogContent className="max-w-[1200px] w-full md:w-[95vw] p-0 overflow-hidden bg-white rounded-[40px] border-none shadow-2xl h-[90vh] md:max-h-[95vh] flex flex-col sm:max-w-full m-0 md:m-auto">
        {/* HEADER (FIXO) */}
        <DialogHeader className="p-8 md:p-12 shrink-0 border-b border-slate-100 bg-slate-900 z-30">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                Ativar <span className="text-blue-400">Pagamentos</span>
              </DialogTitle>
              <DialogDescription asChild className="text-[10px] font-black uppercase text-slate-400 mt-4 italic tracking-widest flex items-center gap-3">
                <div>
                  <div className="size-2 rounded-full bg-blue-500 animate-pulse" />
                  Onboarding Doce Gestão & Tuna
                </div>
              </DialogDescription>
            </div>
            <div className="hidden sm:flex gap-4">
              {STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "h-3 rounded-full transition-all duration-500",
                    idx === currentStep ? "w-24 bg-blue-400" : (idx < currentStep ? "w-12 bg-emerald-400" : "w-12 bg-slate-700")
                  )} 
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* BODY (SCROLLÁVEL) */}
        <div className="flex-1 overflow-y-auto p-8 md:p-14 custom-scrollbar bg-slate-50/50">
          <form id="onboarding-form" onSubmit={form.handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-12"
              >
                {currentStep === 0 && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="size-16 rounded-[24px] bg-white shadow-xl border border-slate-100 text-blue-600 flex items-center justify-center">
                        <User size={32} />
                      </div>
                      <h3 className="text-3xl font-black uppercase italic text-slate-900 tracking-tighter">Informações da Conta</h3>
                    </div>

                    <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Tipo de Documento</Label>
                        <Select onValueChange={(val) => form.setValue("documentType", val as any)} defaultValue={form.getValues("documentType")}>
                          <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus:ring-blue-500">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="CPF">CPF (Pessoa Física)</SelectItem>
                            <SelectItem value="CNPJ">CNPJ (Empresa)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Número do Documento</Label>
                        <Input 
                          {...form.register("documentNumber")} 
                          placeholder={form.watch("documentType") === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"} 
                          className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Nome Completo</Label>
                        <Input 
                          {...form.register("fullName")} 
                          placeholder="Nome impresso no documento" 
                          className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Nome da Mãe</Label>
                        <Input 
                          {...form.register("motherName")} 
                          placeholder="Nome completo da genitora" 
                          className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Data de Nascimento</Label>
                        <Input 
                          {...form.register("birthDate")} 
                          type="date"
                          className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Ocupação / Profissão</Label>
                        <Input 
                          {...form.register("occupation")} 
                          placeholder="Ex: Padeiro, Empresário" 
                          className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Website da Empresa (Opcional)</Label>
                        <div className="relative">
                          <Globe size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                          <Input 
                            {...form.register("website")} 
                            placeholder="www.seusite.com.br" 
                            className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 pl-14 font-black italic focus-visible:ring-blue-500"
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="size-16 rounded-[24px] bg-white shadow-xl border border-slate-100 text-amber-500 flex items-center justify-center">
                        <MapPin size={32} />
                      </div>
                      <h3 className="text-3xl font-black uppercase italic text-slate-900 tracking-tighter">Informações de Faturamento</h3>
                    </div>

                    <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">CEP</Label>                                                                   
                        <div className="relative">
                          <Input 
                            {...form.register("cep")} 
                            onChange={handleCEPChange}
                            maxLength={9}
                            placeholder="00000-000" 
                            className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-amber-500"
                          />
                          {isFetchingCEP && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <Loader2 className="size-5 animate-spin text-amber-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Estado</Label>
                        <Input 
                          {...form.register("state")} 
                          placeholder="UF" 
                          maxLength={2}
                          readOnly
                          className="rounded-2xl border-slate-100 bg-slate-100/50 h-14 font-black uppercase italic text-center text-slate-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Cidade</Label>
                        <Input 
                          {...form.register("city")} 
                          placeholder="Sua cidade" 
                          readOnly
                          className="rounded-2xl border-slate-100 bg-slate-100/50 h-14 font-black italic text-slate-500"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Logradouro (Rua/Av)</Label>
                        <Input 
                          {...form.register("address")} 
                          placeholder="Endereço perante o documento" 
                          className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Número</Label>
                        <Input 
                          {...form.register("number")} 
                          placeholder="Ex: 123" 
                          className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-amber-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Bairro</Label>
                        <Input 
                          {...form.register("neighborhood")} 
                          placeholder="Seu bairro" 
                          className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-amber-500"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Complemento (Opcional)</Label>
                        <Input 
                          {...form.register("complement")} 
                          placeholder="Apto, Bloco, Sala, etc." 
                          className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-amber-500"
                        />
                      </div>
                    </Card>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="size-16 rounded-[24px] bg-white shadow-xl border border-slate-100 text-indigo-600 flex items-center justify-center">
                        <Building2 size={32} />
                      </div>
                      <h3 className="text-3xl font-black uppercase italic text-slate-900 tracking-tighter">Informações Bancárias e PIX</h3>
                    </div>

                    <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden p-10 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Banco Oficial</Label>
                          <Popover open={searchBankOpen} onOpenChange={setSearchBankOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic px-5"
                              >
                                <span className="truncate">
                                  {form.watch("bank") 
                                    ? ALL_BANKS.find((b) => b.code === form.watch("bank"))?.name || `Banco ${form.watch("bank")}`
                                    : "Digite o nome ou código do banco"}
                                </span>
                                <Search className="ml-2 h-5 w-5 shrink-0 opacity-40" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-3xl shadow-2xl border-slate-100 overflow-hidden" align="start">
                              <Command className="rounded-3xl">
                                <CommandInput placeholder="Buscar por nome ou código..." className="h-14 font-black italic" />
                                <CommandList className="max-h-[400px] custom-scrollbar">
                                  <CommandEmpty className="py-10 text-center font-black uppercase text-[10px] text-slate-400 italic">Nenhum banco encontrado.</CommandEmpty>
                                  <CommandGroup className="p-2">
                                    {ALL_BANKS.map((banco) => (
                                      <CommandItem
                                        key={banco.code}
                                        value={`${banco.code} ${banco.name} ${banco.category}`}
                                        onSelect={() => {
                                          form.setValue("bank", banco.code)
                                          setSearchBankOpen(false)
                                        }}
                                        className="py-4 px-5 cursor-pointer rounded-2xl transition-all hover:bg-slate-50"
                                      >
                                        <Check
                                          className={cn(
                                            "mr-3 h-5 w-5 text-emerald-500",
                                            form.watch("bank") === banco.code ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col gap-1">
                                          <span className="font-black italic text-sm uppercase text-slate-900 leading-none">{banco.name}</span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black uppercase text-slate-400 italic">Cód: {banco.code}</span>
                                            <Badge className="bg-slate-100 text-slate-400 border-none text-[8px] h-4 font-black uppercase italic">{banco.category}</Badge>
                                          </div>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Tipo de Conta</Label>
                          <Select onValueChange={(val) => form.setValue("accountType", val as any)} defaultValue={form.getValues("accountType")}>
                            <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus:ring-indigo-500">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="corrente">Conta Corrente</SelectItem>
                              <SelectItem value="poupança">Conta Poupança</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Agência</Label>
                          <Input 
                            {...form.register("branch")} 
                            placeholder="Ex: 0001" 
                            className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-indigo-500"
                          />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Conta com Dígito</Label>
                          <Input 
                            {...form.register("account")} 
                            placeholder="Ex: 12345-6" 
                            className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-indigo-500"
                          />
                        </div>
                      </div>

                      <div className="h-px bg-slate-100" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Tipo de Chave PIX</Label>
                          <Select onValueChange={(val) => form.setValue("pixType", val as any)} defaultValue={form.getValues("pixType")}>
                            <SelectTrigger className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus:ring-emerald-500">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="CPF">CPF</SelectItem>
                              <SelectItem value="CNPJ">CNPJ</SelectItem>
                              <SelectItem value="EMAIL">E-mail</SelectItem>
                              <SelectItem value="TELEFONE">Telefone Celular</SelectItem>
                              <SelectItem value="ALEATÓRIA">Chave Aleatória</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Valor da Chave PIX</Label>
                          <div className="relative">
                            <QrCode size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                            <Input 
                              {...form.register("pixKey")} 
                              placeholder="Insira sua chave aqui" 
                              className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 pl-14 font-black italic focus-visible:ring-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-8 rounded-[24px] bg-amber-50 border border-amber-100 flex items-start gap-5">
                        <ShieldCheck className="text-amber-500 size-6 mt-1 shrink-0" />
                        <p className="text-xs font-bold text-amber-800 uppercase italic leading-loose tracking-tight">
                          Os pagamentos só irão ocorrer se os dados bancários e chave PIX forem do titular do CPF/CNPJ informado na Etapa 1.
                        </p>
                      </div>
                    </Card>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-10">
                    <div className="flex items-center gap-6">
                      <div className="size-16 rounded-[24px] bg-white shadow-xl border border-slate-100 text-rose-500 flex items-center justify-center">
                        <Mail size={32} />
                      </div>
                      <h3 className="text-3xl font-black uppercase italic text-slate-900 tracking-tighter">Informações de Contato</h3>
                    </div>

                    <Card className="rounded-[32px] border-none shadow-sm bg-white overflow-hidden p-10 space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">E-mail de Contato Comercial</Label>
                          <Input 
                            {...form.register("email")} 
                            placeholder="seu@contato.com.br" 
                            className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 font-black italic focus-visible:ring-rose-500"
                          />
                        </div>
                        <div className="space-y-4">
                          <Label className="text-[11px] font-black uppercase text-slate-400 italic ml-1">Telefone Celular / WhatsApp</Label>
                          <div className="relative">
                            <Phone size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                            <Input 
                              {...form.register("phone")} 
                              placeholder="(00) 00000-0000" 
                              className="rounded-2xl border-slate-100 bg-slate-50/50 h-14 pl-14 font-black italic focus-visible:ring-rose-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="p-10 rounded-[32px] bg-slate-900 text-white flex flex-col gap-6">
                         <div className="flex items-center gap-4">
                            <Checkbox 
                              id="agreed" 
                              className="size-7 rounded-xl border-slate-700 data-[state=checked]:bg-blue-400 data-[state=checked]:border-blue-400"
                              onCheckedChange={(val) => form.setValue("agreed", val as any)}
                            />
                            <Label htmlFor="agreed" className="text-sm font-black uppercase italic leading-tight cursor-pointer tracking-tighter">
                               Estou ciente de que os pagamentos só irão ocorrer se os dados <span className="text-blue-400">bancários e chave PIX</span> forem do titular do CPF/CNPJ de cadastro.
                            </Label>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase italic leading-relaxed tracking-widest pl-11">
                            Ao prosseguir, você concorda com os termos de uso e política de privacidade da Doce Gestão & Gateway Parceiro.
                         </p>
                      </div>
                    </Card>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </form>
        </div>

        {/* FOOTER (FIXO) */}
        <div className="p-8 md:p-12 shrink-0 border-t border-slate-100 bg-white z-30 flex items-center justify-between shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={currentStep === 0 || isLoading}
            className="rounded-2xl h-16 px-10 font-black uppercase italic tracking-widest text-slate-400 hover:text-slate-900 transition-all gap-3"
          >
            <ChevronLeft size={24} /> Voltar
          </Button>

          {currentStep === STEPS.length - 1 ? (
            <Button
              type="submit"
              form="onboarding-form"
              disabled={isLoading || !form.watch("agreed")}
              className="rounded-2xl h-16 px-16 bg-slate-900 hover:bg-black text-white font-black uppercase italic tracking-widest text-sm shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>Criar Conta <ChevronRight size={24} className="ml-3" /></>}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={isLoading}
              className="rounded-2xl h-16 px-16 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase italic tracking-widest text-sm shadow-2xl shadow-blue-100 transition-all hover:scale-105 active:scale-95"
            >
              Próxima Etapa <ChevronRight size={24} className="ml-3" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
