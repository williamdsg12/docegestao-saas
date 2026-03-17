"use client"

import { useState, useRef, useEffect } from "react"
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api"
import { Input } from "@/components/ui/input"
import { MapPin, Search } from "lucide-react"
import { toast } from "sonner"

const libraries: ("places")[] = ["places"]

interface AddressAutocompleteProps {
  onAddressSelect: (address: any) => void
  placeholder?: string
  className?: string
}

export function AddressAutocomplete({ onAddressSelect, placeholder, className }: AddressAutocompleteProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || "",
    libraries
  })

  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)

  const onLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto)
  }

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace()

      if (!place.geometry || !place.geometry.location) {
        toast.error("Por favor, selecione um endereço da lista.")
        return
      }

      const addressComponents = place.address_components
      
      const getComponent = (type: string, useShortName = false) => {
        const comp = addressComponents?.find(c => c.types.includes(type))
        return useShortName ? comp?.short_name : comp?.long_name
      }

      const address = {
        formatted_address: place.formatted_address,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        street: getComponent("route"),
        number: getComponent("street_number"),
        neighborhood: getComponent("sublocality_level_1") || getComponent("sublocality") || getComponent("neighborhood"),
        city: getComponent("administrative_area_level_2") || getComponent("locality"),
        state: getComponent("administrative_area_level_1", true),
        zip: getComponent("postal_code"),
      }

      console.log("Structured Address:", address)
      onAddressSelect(address)
    }
  }

  if (!isLoaded) return <Input disabled placeholder="Carregando endereços..." className={className} />

  return (
    <div className="relative w-full">
      <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder={placeholder || "Digite seu endereço..."}
            className={`pl-12 h-14 rounded-2xl border-rose-100 bg-rose-50/20 focus:ring-primary/10 font-bold ${className}`}
          />
        </div>
      </Autocomplete>
    </div>
  )
}
