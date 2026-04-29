"use client"

import { Palette, ImageIcon, Type, Globe, Upload } from "lucide-react"

interface WhiteLabelSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function WhiteLabelSettings({ data, onChange }: WhiteLabelSettingsProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Visual Identity */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <ImageIcon className="size-3 text-indigo-400" /> Logo da Plataforma
                        </label>
                        <div className="flex gap-4">
                            <div className="size-11 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center overflow-hidden shrink-0">
                                {data.white_label_logo_url ? (
                                    <img src={data.white_label_logo_url} alt="Logo" className="max-w-[70%] max-h-[70%] object-contain" />
                                ) : (
                                    <Upload className="size-4 text-slate-600" />
                                )}
                            </div>
                            <input 
                                type="text" 
                                value={data.white_label_logo_url || ""}
                                onChange={(e) => onChange('white_label_logo_url', e.target.value)}
                                className="flex-1 h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[10px] font-mono text-slate-400 outline-none focus:border-indigo-500/30 transition-all"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Type className="size-3 text-indigo-400" /> Nome de Exibição
                        </label>
                        <input 
                            type="text" 
                            value={data.white_label_platform_name || ""}
                            onChange={(e) => onChange('white_label_platform_name', e.target.value)}
                            className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-medium text-white outline-none"
                            placeholder="Ex: Doce Gestão Pro"
                        />
                    </div>
                </div>

                {/* Colors & UX */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Palette className="size-3 text-indigo-400" /> Cor Transacional (Primary)
                        </label>
                        <div className="flex gap-4">
                            <div 
                                className="size-11 rounded-lg shadow-lg shrink-0 border border-white/10"
                                style={{ backgroundColor: data.white_label_primary_color || '#6366f1' }}
                            />
                            <input 
                                type="text" 
                                value={data.white_label_primary_color || ""}
                                onChange={(e) => onChange('white_label_primary_color', e.target.value)}
                                className="flex-1 h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-sm font-mono text-white outline-none uppercase"
                                placeholder="#6366F1"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Globe className="size-3 text-indigo-400" /> Favicon URL
                        </label>
                        <input 
                            type="text" 
                            value={data.white_label_favicon_url || ""}
                            onChange={(e) => onChange('white_label_favicon_url', e.target.value)}
                            className="w-full h-11 px-4 bg-white/[0.03] border border-white/[0.05] rounded-lg text-[10px] font-mono text-slate-400 outline-none"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 bg-white/[0.02] rounded-xl border border-white/[0.05] space-y-4">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Preview Visual Branding</h5>
                <div className="h-14 w-full bg-[#09090b] rounded-lg border border-white/[0.05] flex items-center px-4 gap-4">
                    <div 
                        className="size-6 rounded bg-indigo-500"
                        style={{ backgroundColor: data.white_label_primary_color || '#6366f1' }}
                    />
                    <div className="h-2 w-24 bg-white/5 rounded-full" />
                    <div className="ml-auto h-6 w-6 rounded-full bg-white/5" />
                </div>
            </div>
        </div>
    )
}
