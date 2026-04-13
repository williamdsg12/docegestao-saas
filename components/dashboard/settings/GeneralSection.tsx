"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Store, Instagram, Camera, Palette, Check } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useState } from "react"

interface GeneralSectionProps {
    data: any
    onChange: (updates: any) => void
}

export function GeneralSection({ data, onChange }: GeneralSectionProps) {
    const [uploading, setUploading] = useState(false)

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            const file = event.target.files?.[0]
            if (!file) return

            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `logos/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('logos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('logos')
                .getPublicUrl(filePath)

            onChange({ logo_url: publicUrl })
            toast.success("Logo carregada com sucesso!")
        } catch (e: any) {
            toast.error("Erro no upload: " + e.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6"
        >
            <div className="flex items-center gap-4 border-b border-slate-50 pb-4">
                <div className="size-10 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center">
                    <Store size={20} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Identidade da Loja</h3>
                    <p className="text-xs text-slate-500">Dados gerais e visual da sua marca</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Nome da Loja</Label>
                    <Input 
                        value={data.name || ""} 
                        onChange={e => onChange({ name: e.target.value })} 
                        placeholder="Nome do seu negócio"
                        className="h-10 rounded-lg border-slate-200 focus:border-pink-500 transition-all font-medium text-sm text-slate-700 px-4 bg-slate-50/50" 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Instagram (@)</Label>
                    <div className="relative">
                        <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                        <Input 
                            value={data.instagram || ""} 
                            onChange={e => onChange({ instagram: e.target.value })} 
                            placeholder="seu_perfil"
                            className="h-10 pl-10 rounded-lg border-slate-200 focus:border-pink-500 transition-all font-medium text-sm text-slate-700 bg-slate-50/50" 
                        />
                    </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Bio ou Descrição da Loja</Label>
                    <Textarea 
                        value={data.description || ""} 
                        onChange={e => onChange({ description: e.target.value })} 
                        placeholder="Conte um pouco sobre seu negócio..."
                        className="min-h-[100px] rounded-xl border-slate-200 focus:border-pink-500 p-4 transition-all font-medium text-sm text-slate-700 leading-relaxed bg-slate-50/50" 
                    />
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                {/* Logo Upload */}
                <div className="space-y-4">
                    <Label className="text-xs font-semibold text-slate-700">Logo do Negócio</Label>
                    <div className="flex items-center gap-4">
                        <div className="relative group shrink-0">
                            {data.logo_url ? (
                                <div className="size-20 rounded-2xl overflow-hidden border-2 border-slate-50 shadow-md">
                                    <img src={data.logo_url} alt="Logo" className="size-full object-cover" />
                                </div>
                            ) : (
                                <div className="size-20 rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                                    <Store size={24} />
                                </div>
                            )}
                            <button 
                                onClick={() => document.getElementById('logo-uploader')?.click()}
                                disabled={uploading}
                                className="absolute -bottom-1 -right-1 size-8 rounded-lg bg-white shadow-md border border-slate-100 flex items-center justify-center text-slate-400 hover:text-pink-500 transition-all"
                            >
                                <Camera size={16} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-1">
                             <p className="text-[11px] text-slate-400 font-medium leading-tight">
                                Use uma imagem de alta qualidade (PNG/JPG). sugerido: 512x512px.
                             </p>
                             <input id="logo-uploader" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </div>
                    </div>
                </div>

                {/* Primary Color */}
                <div className="space-y-4">
                    <Label className="text-xs font-semibold text-slate-700">Cor Principal da Marca</Label>
                    <div className="flex flex-wrap gap-2">
                        {["#FF2F81", "#D4AF37", "#4F46E5", "#10B981", "#1E293B", "#F59E0B"].map(color => (
                            <button
                                key={color}
                                onClick={() => onChange({ primary_color: color })}
                                className={cn(
                                    "size-8 rounded-full border-2 transition-all hover:scale-110 active:scale-90 flex items-center justify-center",
                                    data.primary_color === color ? "border-slate-900 ring-2 ring-slate-100" : "border-transparent"
                                )}
                                style={{ backgroundColor: color }}
                            >
                                {data.primary_color === color && <Check className="size-3 text-white drop-shadow-md" />}
                            </button>
                        ))}
                        <div className="relative size-8 rounded-full overflow-hidden border border-slate-200">
                            <input 
                                type="color" 
                                value={data.primary_color || "#FF2F81"}
                                onChange={e => onChange({ primary_color: e.target.value })}
                                className="absolute inset-0 size-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
