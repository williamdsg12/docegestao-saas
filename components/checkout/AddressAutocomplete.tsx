"use client"

import { useEffect, useRef, useState } from "react"
import { Search, Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"

interface AddressAutocompleteProps {
  onAddressSelect: (address: any) => void
  placeholder?: string
  className?: string
  onManualToggle?: (isManual: boolean) => void
}

// Load the Google Maps script only once
let scriptLoading = false
const callbacks: (() => void)[] = []

async function initGoogleMaps(apiKey: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if ((window as any).google?.maps?.importLibrary) return true;
  if (scriptLoading) return new Promise(resolve => callbacks.push(() => resolve(true)));
  
  scriptLoading = true;
  
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      scriptLoading = false;
      resolve(false);
    };

    script.onload = () => {
      scriptLoading = false;
      callbacks.forEach(cb => cb());
      callbacks.length = 0;
      resolve(true);
    };

    if (!document.getElementById("google-maps-script")) {
      document.head.appendChild(script);
    } else {
      // Script exists but maybe not loaded yet?
      const existing = document.getElementById("google-maps-script");
      if (existing) {
        existing.onload = () => {
          scriptLoading = false;
          callbacks.forEach(cb => cb());
          callbacks.length = 0;
          resolve(true);
        }
      }
    }
  });
}

export function AddressAutocomplete({ onAddressSelect, placeholder, className, onManualToggle }: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<any>(null)
  const initializedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isManual, setIsManual] = useState(false)
  const [manualData, setManualData] = useState({
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zip: ""
  })
  const [isLoadingCep, setIsLoadingCep] = useState(false)

  const handleCepLookup = async (cep: string) => {
    console.log('CEP:', cep)
    try {
      setIsLoadingCep(true)
      console.log('Buscando CEP...')
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await res.json()
      console.log('Resposta:', data)
      
      if (data.erro) {
        toast.error("CEP não encontrado")
        return
      }

      console.log('Endereço encontrado')
      setManualData(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state
      }))
      
      toast.success("Endereço preenchido via CEP!")
    } catch (err) {
      console.log('Erro capturado:', err)
      toast.error("Erro ao buscar CEP")
    } finally {
      setIsLoadingCep(false)
    }
  }

  useEffect(() => {
    if (onManualToggle) onManualToggle(isManual)
  }, [isManual, onManualToggle])

  useEffect(() => {
    if (isManual) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""

    if (!apiKey) {
      setHasError(true)
      setIsLoading(false)
      return
    }

    const setup = async () => {
      const success = await initGoogleMaps(apiKey);
      
      if (!success) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      try {
        // Detect specialized Google Maps errors (like ApiTargetBlockedMapError)
        (window as any).gm_authFailure = () => {
          console.error("Google Maps Authentication Failure detected.");
          setHasError(true);
          setIsLoading(false);
          toast.error("MAPEAMENTO BLOQUEADO: Sua chave do Google Maps não tem permissão para usar a 'Maps JavaScript API' ou está restrita a outro domínio.", {
            duration: 15000,
            description: "O modo manual foi ativado. Para corrigir a busca, autorize 'localhost:3000' ou libere a API no painel do Google Cloud Console."
          });
          setIsManual(true);
        };

        const { Autocomplete } = await (window as any).google.maps.importLibrary("places") as google.maps.PlacesLibrary;
        
        setIsLoading(false);
        if (!inputRef.current || initializedRef.current) return;

        initializedRef.current = true;
        autocompleteRef.current = new Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "br" },
          fields: ["address_components", "formatted_address", "geometry", "name"]
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current?.getPlace();

          if (!place || !place.geometry || !place.geometry.location) {
            // Se o usuário apertar Enter sem selecionar nada, ignoramos ou avisamos
            return;
          }

          const components = place.address_components || [];
          const get = (type: string, short = false) => {
            const c = components.find((c: any) => c.types.includes(type));
            return short ? c?.short_name : c?.long_name;
          }

          // Padrão solicitado pelo usuário:
          onAddressSelect({
            formatted_address: place.formatted_address || place.name,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            street: get("route") || "",
            number: get("street_number") || "",
            neighborhood: get("sublocality_level_1") || get("sublocality") || get("neighborhood") || "",
            city: get("administrative_area_level_2") || get("locality") || "",
            state: get("administrative_area_level_1", true) || "",
            zip: get("postal_code") || "",
          });
        });

      } catch (err: any) {
        console.error("[AddressAutocomplete] Initialization Error:", err);
        setHasError(true);
        setIsLoading(false);
        setIsManual(true);
      }
    };

    setup();
  }, [onAddressSelect, isManual, isLoading])

  const handleManualSubmit = () => {
    if (!manualData.street || !manualData.number || !manualData.city) {
      toast.error("Preencha ao menos Rua, Número e Cidade")
      return
    }

    const formatted = `${manualData.street}, ${manualData.number} - ${manualData.neighborhood}, ${manualData.city} - ${manualData.state}, ${manualData.zip}`
    
    onAddressSelect({
      formatted_address: formatted,
      ...manualData,
      lat: null, // Manual doesn't have lat/lng easily
      lng: null
    })
  }

  if (isManual) {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
             <input 
              placeholder="Rua / Logradouro" 
              className="w-full h-14 rounded-2xl bg-white border-2 border-slate-100 px-6 font-bold text-slate-700 focus:border-pink-200 outline-none transition-all"
              value={manualData.street}
              onChange={e => setManualData({...manualData, street: e.target.value})}
             />
          </div>
          <div className="md:col-span-1">
             <input 
              placeholder="Nº" 
              className="w-full h-14 rounded-2xl bg-white border-2 border-slate-100 px-6 font-bold text-slate-700 focus:border-pink-200 outline-none transition-all"
              value={manualData.number}
              onChange={e => setManualData({...manualData, number: e.target.value})}
             />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <input 
            placeholder="Bairro" 
            className="w-full h-14 rounded-2xl bg-white border-2 border-slate-100 px-6 font-bold text-slate-700 focus:border-pink-200 outline-none transition-all"
            value={manualData.neighborhood}
            onChange={e => setManualData({...manualData, neighborhood: e.target.value})}
           />
           <div className="relative">
             <input 
              placeholder="CEP" 
              className="w-full h-14 rounded-2xl bg-white border-2 border-slate-100 px-6 font-bold text-slate-700 focus:border-pink-200 outline-none transition-all"
              value={manualData.zip}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                setManualData({...manualData, zip: val})
                if (val.length === 8) {
                  handleCepLookup(val)
                }
              }}
             />
             {isLoadingCep && (
               <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-pink-400 animate-spin" />
             )}
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="md:col-span-2">
              <input 
                placeholder="Cidade" 
                className="w-full h-14 rounded-2xl bg-white border-2 border-slate-100 px-6 font-bold text-slate-700 focus:border-pink-200 outline-none transition-all"
                value={manualData.city}
                onChange={e => setManualData({...manualData, city: e.target.value})}
              />
           </div>
           <div className="md:col-span-1">
              <input 
                placeholder="UF" 
                maxLength={2}
                className="w-full h-14 rounded-2xl bg-white border-2 border-slate-100 px-6 font-bold text-slate-700 focus:border-pink-200 outline-none transition-all uppercase"
                value={manualData.state}
                onChange={e => setManualData({...manualData, state: e.target.value.toUpperCase()})}
              />
           </div>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={handleManualSubmit}
            className="flex-1 h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#FF2F81] transition-colors"
          >
            Confirmar Endereço
          </button>
          <button 
            type="button"
            onClick={() => setIsManual(false)}
            className="px-6 h-14 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="space-y-4">
        <div className="relative w-full">
          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-rose-400 z-10" />
          <input
            type="text"
            placeholder="Erro no mapa. Use preenchimento manual ->"
            disabled
            className={`w-full pl-14 pr-6 h-16 rounded-[28px] bg-rose-50 border-2 border-rose-100 font-bold text-rose-400 text-sm cursor-not-allowed ${className}`}
          />
        </div>
        <div className="flex justify-end">
          <button 
            type="button"
            onClick={() => setIsManual(true)}
            className="text-[10px] font-black uppercase tracking-widest text-[#FF2F81] px-6 py-2 bg-pink-50 rounded-full hover:bg-pink-100 transition-colors"
          >
            Preencher Manualmente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full">
        <Search className={`absolute left-5 top-1/2 -translate-y-1/2 size-4 z-10 pointer-events-none transition-colors ${isLoading ? "text-slate-300" : "text-red-500"}`} />
        {isLoading && (
          <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 size-4 text-slate-300 animate-spin z-10" />
        )}
        <input
          ref={inputRef}
          type="text"
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          placeholder={isLoading ? "Carregando mapa..." : (placeholder || "Digite seu endereço completo...")}
          className={`w-full pl-14 pr-6 h-16 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-red-200 focus:bg-white focus:outline-none transition-all font-bold text-slate-700 text-sm disabled:opacity-60 disabled:cursor-wait ${className || ""}`}
        />
      </div>
      <div className="flex justify-end">
        <button 
          type="button"
          onClick={() => setIsManual(true)}
          className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#FF2F81] transition-colors"
        >
          Não encontrou? Preencher manualmente
        </button>
      </div>
    </div>
  )
}
