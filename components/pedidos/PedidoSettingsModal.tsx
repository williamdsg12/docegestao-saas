"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { 
    Settings2, 
    Bell, 
    Clock, 
    Monitor, 
    Volume2, 
    History,
    Save,
    MapPin,
    Smartphone
} from "lucide-react"
import { usePedidoStore } from "@/store/pedidoStore"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PedidoSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function PedidoSettingsModal({ open, onOpenChange }: PedidoSettingsModalProps) {
    const config = usePedidoStore(s => s.config)
    const updateConfig = usePedidoStore(s => s.updateConfig)

    const handleSave = () => {
        toast.success("Configurações salvas com sucesso!")
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl rounded-[2.5rem] overflow-hidden p-0 bg-[#F4F7F6]">
                <DialogHeader className="bg-slate-900 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <div className="flex items-center gap-4 mb-2">
                        <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                            <Settings2 className="size-7 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Configurações</DialogTitle>
                            <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Ajustes da Central de Operação</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
                    
                    {/* 1. Alertas de Tempo */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="size-4 text-slate-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Urgência e Tempos</h4>
                        </div>
                        
                        <div className="space-y-6 bg-white p-5 rounded-3xl border border-slate-100">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-black text-slate-700">MODO ALERTA (🟡)</Label>
                                    <span className="text-amber-500 font-black italic">{config.alertMin} min</span>
                                </div>
                                <Slider 
                                    defaultValue={[config.alertMin]} 
                                    max={20} 
                                    step={1} 
                                    onValueChange={([val]) => updateConfig({ alertMin: val })}
                                />
                                <p className="text-[9px] text-slate-400 font-medium italic">Tempo até o pedido ser marcado como "Atenção".</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-black text-slate-700">MODO CRÍTICO (🔴)</Label>
                                    <span className="text-rose-500 font-black italic">{config.criticalMin} min</span>
                                </div>
                                <Slider 
                                    defaultValue={[config.criticalMin]} 
                                    max={60} 
                                    step={1} 
                                    onValueChange={([val]) => updateConfig({ criticalMin: val })}
                                />
                                <p className="text-[9px] text-slate-400 font-medium italic">A partir deste tempo, o pedido será marcado como atrasado.</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. Som e Áudio */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Volume2 className="size-4 text-slate-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Alertas Sonoros</h4>
                        </div>
                        
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between gap-6">
                            <div className="flex-1 space-y-3">
                                <div className="flex justify-between items-center">
                                    <Label className="text-xs font-black text-slate-700">VOLUME</Label>
                                    <span className="text-slate-900 font-black italic">{Math.round(config.soundVolume * 100)}%</span>
                                </div>
                                <Slider 
                                    defaultValue={[config.soundVolume * 100]} 
                                    max={100} 
                                    step={1} 
                                    onValueChange={([val]) => updateConfig({ soundVolume: val / 100 })}
                                />
                            </div>
                            <Button 
                                variant="outline" 
                                className="size-12 rounded-2xl shrink-0 border-slate-100 text-slate-400 hover:text-blue-500"
                                onClick={() => {
                                    const audio = new Audio('/notification.mp3')
                                    audio.volume = config.soundVolume
                                    audio.play()
                                }}
                            >
                                <Volume2 className="size-5" />
                            </Button>
                        </div>
                    </div>

                    {/* 3. Preferências de Visualização */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Monitor className="size-4 text-slate-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exibição no Kanban</h4>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-black text-slate-700 uppercase">Mostrar Endereço Sempre</Label>
                                    <p className="text-[9px] text-slate-400 font-medium">Exibe o local nos cards sem precisar passar o mouse.</p>
                                </div>
                                <Switch 
                                    checked={config.showAddressAlways} 
                                    onCheckedChange={(val) => updateConfig({ showAddressAlways: val })}
                                />
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-black text-slate-700 uppercase">Modo Compacto</Label>
                                    <p className="text-[9px] text-slate-400 font-medium">Reduz espaçamentos para ver mais pedidos na tela.</p>
                                </div>
                                <Switch 
                                    checked={config.isCompactMode} 
                                    onCheckedChange={(val) => updateConfig({ isCompactMode: val })}
                                />
                            </div>

                            <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between opacity-50">
                                <div className="space-y-0.5">
                                    <Label className="text-xs font-black text-slate-700 uppercase">Aceite Automático</Label>
                                    <p className="text-[9px] text-slate-400 font-bold text-rose-500">RECURSO PRO - EM BREVE</p>
                                </div>
                                <Switch disabled />
                            </div>
                        </div>
                    </div>

                </div>

                <DialogFooter className="p-8 bg-white border-t border-slate-100">
                    <Button 
                        onClick={handleSave}
                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-slate-200"
                    >
                        <Save className="size-4 mr-2" />
                        Salvar Preferências
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
