"use client"

import { useState } from "react"
import { CreditCard, Shield, Eye, EyeOff, Globe, Zap, QrCode } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface PaymentSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function PaymentSettings({ data, onChange }: PaymentSettingsProps) {
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

    const toggleShow = (key: string) => {
        setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sandbox Toggle */}
            <div className="flex items-center justify-between p-8 bg-amber-50 rounded-[32px] border border-amber-100/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                    <Shield className="size-24 text-amber-600" />
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="size-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <Zap className="size-7 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-black text-amber-900 text-lg uppercase italic tracking-tight">Modo Sandbox (Testes)</p>
                        <p className="text-[10px] text-amber-600/60 font-black uppercase tracking-widest mt-1">Ambiente seguro para simular transações sem cobrança real</p>
                    </div>
                </div>
                <Switch 
                    checked={data.payment_sandbox_mode || false}
                    onCheckedChange={(checked) => onChange('payment_sandbox_mode', checked)}
                    className="data-[state=checked]:bg-amber-600"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Stripe */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-xl bg-slate-900 flex items-center justify-center text-white">
                            <CreditCard className="size-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-wider">Stripe <span className="text-primary italic">Global</span></h4>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Public Key</label>
                            <Input 
                                type="text"
                                value={data.stripe_public_key || ""}
                                onChange={(e) => onChange('stripe_public_key', e.target.value)}
                                className="h-12 bg-slate-50 border-none rounded-xl text-xs font-mono"
                                placeholder="pk_test_..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secret Key</label>
                            <div className="relative">
                                <Input 
                                    type={showKeys.stripe_secret ? "text" : "password"}
                                    value={data.stripe_secret_key || ""}
                                    onChange={(e) => onChange('stripe_secret_key', e.target.value)}
                                    className="h-12 bg-slate-50 border-none rounded-xl text-xs font-mono pr-12"
                                    placeholder="sk_test_..."
                                />
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => toggleShow('stripe_secret')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                                >
                                    {showKeys.stripe_secret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mercado Pago */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                            <Globe className="size-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-wider">Mercado <span className="text-blue-600 italic">Pago</span></h4>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Token</label>
                        <div className="relative">
                            <Input 
                                type={showKeys.mp_token ? "text" : "password"}
                                value={data.mercado_pago_token || ""}
                                onChange={(e) => onChange('mercado_pago_token', e.target.value)}
                                className="h-12 bg-slate-50 border-none rounded-xl text-xs font-mono pr-12"
                                placeholder="APP_USR-..."
                            />
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => toggleShow('mp_token')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                            >
                                {showKeys.mp_token ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </Button>
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Pix */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                            <QrCode className="size-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-wider">Configuração <span className="text-emerald-500 italic">Pix</span></h4>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave Pix (E-mail, CPF, CNPJ ou Celular)</label>
                        <Input 
                            value={data.pix_key || ""}
                            onChange={(e) => onChange('pix_key', e.target.value)}
                            className="h-12 bg-slate-50 border-none rounded-xl text-sm font-bold"
                            placeholder="Chave para recebimentos manuais"
                        />
                    </div>
                </section>

                {/* Webhooks */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="size-10 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                            <Zap className="size-5" />
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase italic tracking-wider">Webhooks <span className="text-purple-600 italic">Endpoints</span></h4>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Webhook URL Principal</label>
                        <Input 
                            value={data.payment_webhook_url || ""}
                            onChange={(e) => onChange('payment_webhook_url', e.target.value)}
                            className="h-12 bg-slate-50 border-none rounded-xl text-xs font-mono"
                            placeholder="https://suaapi.com/webhooks/payments"
                        />
                    </div>
                </section>
            </div>
        </div>
    )
}
