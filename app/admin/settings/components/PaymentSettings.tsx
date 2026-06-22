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
            <div className="flex items-center justify-between p-6 bg-amber-500/5 rounded-xl border border-amber-500/10">
                <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Zap className="size-5 text-amber-500" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-xs uppercase tracking-tight">Modo Sandbox (Testes)</p>
                        <p className="text-[9px] text-amber-500/60 font-bold uppercase tracking-widest mt-1">Ambiente seguro para simular transações</p>
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
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <CreditCard className="size-5" />
                        </div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest">Gateway Stripe</h4>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Public Key</label>
                            <input 
                                type="text"
                                value={data.stripe_public_key || ""}
                                onChange={(e) => onChange('stripe_public_key', e.target.value)}
                                className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[10px] font-mono text-indigo-400 outline-none focus:border-indigo-500/30 transition-all"
                                placeholder="pk_test_..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Secret Key</label>
                            <div className="relative">
                                <input 
                                    type={showKeys.stripe_secret ? "text" : "password"}
                                    value={data.stripe_secret_key || ""}
                                    onChange={(e) => onChange('stripe_secret_key', e.target.value)}
                                    className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[10px] font-mono text-indigo-400 outline-none focus:border-indigo-500/30 transition-all pr-10"
                                    placeholder="sk_test_..."
                                />
                                <button 
                                    onClick={() => toggleShow('stripe_secret')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showKeys.stripe_secret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mercado Pago */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Globe className="size-5" />
                        </div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest">Mercado Pago</h4>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Token</label>
                        <div className="relative">
                            <input 
                                type={showKeys.mp_token ? "text" : "password"}
                                value={data.mercado_pago_token || ""}
                                onChange={(e) => onChange('mercado_pago_token', e.target.value)}
                                className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[10px] font-mono text-blue-400 outline-none focus:border-blue-500/30 transition-all pr-10"
                                placeholder="APP_USR-..."
                            />
                            <button 
                                onClick={() => toggleShow('mp_token')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showKeys.mp_token ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/[0.05]">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <QrCode className="size-5" />
                        </div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest">Configuração Pix</h4>
                    </div>
                    <input 
                        value={data.pix_key || ""}
                        onChange={(e) => onChange('pix_key', e.target.value)}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-medium text-white outline-none"
                        placeholder="Chave Pix para recebimentos"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <Zap className="size-5" />
                        </div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest">Webhook URL</h4>
                    </div>
                    <input 
                        value={data.payment_webhook_url || ""}
                        onChange={(e) => onChange('payment_webhook_url', e.target.value)}
                        className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[10px] font-mono text-slate-400 outline-none"
                        placeholder="https://api.seudominio.com/webhooks"
                    />
                </div>
            </div>
        </div>
    )
}
