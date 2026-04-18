"use client"

import { useDropzone } from "react-dropzone"
import { useState, useCallback } from "react"
import { Upload, X, Loader2, Image as ImageIcon, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ImageUploaderProps {
  value?: string
  onChange: (url: string) => void
  label?: string
}

export function ImageUploader({ value, onChange, label }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error("O arquivo é muito grande. O limite é 5MB.")
      return
    }

    // Local preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Falha no upload")
      }

      const data = await response.json()
      onChange(data.url)
      setPreview(data.url)
      toast.success("Foto enviada com sucesso!")
    } catch (error) {
      console.error(error)
      toast.error("Erro ao enviar a imagem. Tente novamente.")
      setPreview(value || null)
    } finally {
      setIsUploading(false)
    }
  }, [onChange, value])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
    },
    maxFiles: 1,
    disabled: isUploading,
  })

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onChange("")
  }

  return (
    <div className="space-y-2">
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>}
      
      <div 
        {...getRootProps()} 
        className={cn(
          "relative min-h-[180px] rounded-[24px] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center p-6 text-center group",
          isDragActive ? "border-pink-500 bg-pink-50/30 ring-4 ring-pink-500/10" : "border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-slate-100/50",
          preview ? "border-solid border-slate-100 bg-white p-2" : "",
          isUploading && "pointer-events-none opacity-80"
        )}
      >
        <input {...getInputProps()} />

        {preview ? (
          <div className="relative w-full h-[180px] rounded-[20px] overflow-hidden group">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div className="h-10 px-4 rounded-xl bg-white text-slate-900 font-black uppercase text-[10px] flex items-center gap-2">
                <Upload size={14} /> Trocar Imagem
              </div>
              <button 
                onClick={removeImage}
                className="size-10 rounded-xl bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {isUploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                <Loader2 className="size-8 text-pink-500 animate-spin mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Enviando...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-300 mb-4 group-hover:text-pink-500 transition-colors">
              <Upload size={24} />
            </div>
            <h3 className="text-xs font-black text-slate-900 uppercase italic leading-none">
              {isDragActive ? "Solte para enviar" : "Arraste uma imagem"}
            </h3>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              ou clique para selecionar (PNG, JPG, WEBP)
            </p>
            <p className="text-[8px] font-medium text-slate-300 uppercase tracking-widest mt-4">
              Máximo 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
