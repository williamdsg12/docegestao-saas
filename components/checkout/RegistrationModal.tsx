"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, MapPin } from "lucide-react"
import { toast } from "sonner"

interface RegistrationModalProps {
  phone: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (customer: any) => void
  storeId: string
}

export function RegistrationModal({ phone, isOpen, onClose, onSuccess, storeId }: RegistrationModalProps) {
  const [name, setName] = useState("")
  const [cpf, setCpf] = useState("")
  const [cep, setCep] = useState("")
  const [address, setAddress] = useState<any>(null)
  const [number, setNumber] = useState("")
  const [complement, setComplement] = useState("")
  const [reference, setReference] = useState("")
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCepLookup = async () => {
    const cleanCep = cep.replace(/\D/g, "")
    console.log('CEP:', cleanCep)
    if (cleanCep.length !== 8) {
      toast.error("CEP inválido")
      return
    }
    try {
      setIsLoadingCep(true)
      console.log('Buscando CEP...')
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await res.json()
      console.log('Resposta:', data)
      if (data.erro) {
        toast.error("CEP não encontrado")
        return
      }
      console.log('Endereço encontrado')
      setAddress(data)
    } catch (err) {
      console.log('Erro capturado:', err)
      toast.error("Erro ao buscar CEP")
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleRegister = async () => {
    if (!name.trim()) {
      toast.error("O nome é obrigatório")
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          cpf,
          storeId,
          address: address ? {
            cep,
            street: address.logradouro,
            number,
            neighborhood: address.bairro,
            city: address.localidade,
            state: address.uf,
            complement,
            reference_point: reference
          } : null
        })
      })

      const customer = await res.json()
      if (res.ok) {
        onSuccess(customer)
        toast.success(`Bem-vindo, ${name.split(" ")[0]}!`)
        onClose()
      } else {
        throw new Error(customer.error || "Erro ao realizar cadastro")
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[24px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-slate-900 text-white">
          <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center">
               <span className="text-xl">👤</span>
            </div>
            Criar seu cadastro
          </DialogTitle>
          <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">
            Facilite seus próximos pedidos preenchendo seus dados uma única vez.
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Nome completo *</Label>
              <Input 
                placeholder="Ex: Maria Silva" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Telefone</Label>
              <Input 
                value={phone} 
                disabled
                className="h-12 rounded-xl bg-slate-100 border-none font-bold opacity-60"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">CPF / CNPJ (Opcional)</Label>
              <Input 
                placeholder="000.000.000-00" 
                value={cpf} 
                onChange={e => setCpf(e.target.value)}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-slate-400" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Endereço (Opcional)</h4>
            </div>

            <div className="flex gap-2">
              <Input 
                placeholder="CEP" 
                value={cep} 
                onChange={e => setCep(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="h-12 rounded-xl bg-slate-50 border-none font-bold"
              />
              <Button 
                onClick={handleCepLookup} 
                variant="outline" 
                disabled={isLoadingCep || cep.length < 8}
                className="h-12 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest px-6"
              >
                {isLoadingCep ? <Loader2 className="size-4 animate-spin" /> : "BUSCAR"}
              </Button>
            </div>

            {address && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Rua</p>
                  <p className="text-xs font-bold text-slate-900">{address.logradouro}</p>
                  <p className="text-[10px] font-medium text-slate-400">{address.bairro} - {address.localidade}/{address.uf}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Número *</Label>
                    <Input 
                      placeholder="Nº" 
                      value={number} 
                      onChange={e => setNumber(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Complemento</Label>
                    <Input 
                      placeholder="Ex: Apto 10" 
                      value={complement} 
                      onChange={e => setComplement(e.target.value)}
                      className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Ponto de referência</Label>
                  <Input 
                    placeholder="Ex: Ao lado do mercado" 
                    value={reference} 
                    onChange={e => setReference(e.target.value)}
                    className="h-12 rounded-xl bg-slate-50 border-none font-bold"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-8 bg-slate-50 gap-4 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="flex-1 h-14 rounded-xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:text-slate-600"
          >
            PULAR POR AGORA
          </Button>
          <Button 
            onClick={handleRegister}
            disabled={isSubmitting || !name}
            className="flex-1 h-14 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-100"
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "CADASTRAR"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
