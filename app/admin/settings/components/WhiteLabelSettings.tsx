"use client"

import { Palette, ImageIcon, Type, Globe, Upload } from "lucide-react"

interface WhiteLabelSettingsProps {
    data: any
    onChange: (field: string, value: any) => void
}

export default function WhiteLabelSettings({ data, onChange }: WhiteLabelSettingsProps) {
    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Visual Identity */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <ImageIcon className="size-3" /> Logo da Plataforma (URL)
                        </label>
                        <div className="flex gap-4">
                            <div className="size-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                {data.white_label_logo_url ? (
                                    <img src={data.white_label_logo_url} alt="Logo" className="max-w-[70%] max-h-[70%] object-contain" />
                                ) : (
                                    <Upload className="size-6 text-slate-300" />
                                )}
                            </div>
                            <input 
                                type="text" 
                                value={data.white_label_logo_url || ""}
                                onChange={(e) => onChange('white_label_logo_url', e.target.value)}
                                className="flex-1 h-14 px-6 bg-slate-50 border-none rounded-2xl text-xs font-mono focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                placeholder="https://exemplo.com/logo.png"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Type className="size-3" /> Nome da Plataforma (Display)
                        </label>
                        <input 
                            type="text" 
                            value={data.white_label_platform_name || ""}
                            onChange={(e) => onChange('white_label_platform_name', e.target.value)}
                            className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            placeholder="Ex: Doce Gestão Pro"
                        />
                    </div>
                </div>

                {/* Colors & UX */}
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Palette className="size-3" /> Cor Primária (Hex)
                        </label>
                        <div className="flex gap-4">
                            <div 
                                className="size-14 rounded-2xl shadow-lg shrink-0 border border-white"
                                style={{ backgroundColor: data.white_label_primary_color || '#ec4899' }}
                            />
                            <input 
                                type="text" 
                                value={data.white_label_primary_color || ""}
                                onChange={(e) => onChange('white_label_primary_color', e.target.value)}
                                className="flex-1 h-14 px-6 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none uppercase"
                                placeholder="#EC4899"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <Globe className="size-3" /> Favicon URL
                        </label>
                        <input 
                            type="text" 
                            value={data.white_label_favicon_url || ""}
                            onChange={(e) => onChange('white_label_favicon_url', e.target.value)}
                            className="w-full h-14 px-6 bg-slate-50 border-none rounded-2xl text-xs font-mono focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            placeholder="https://exemplo.com/favicon.ico"
                        />
                    </div>
                </div>
            </div>

            <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Preview do Dashboard</h5>
                <div className="h-20 w-full bg-white rounded-2xl border border-slate-100 flex items-center px-6 gap-4">
                    <div 
                        className="size-8 rounded-lg"
                        style={{ backgroundColor: data.white_label_primary_color || '#ec4899' }}
                    />
                    <div className="h-3 w-32 bg-slate-100 rounded-full" />
                    <div className="ml-auto h-8 w-8 rounded-full bg-slate-100" />
                </div>
            </div>
        </div>
    )
}
