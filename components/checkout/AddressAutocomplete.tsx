"use client"

import { useState, useRef, useEffect } from "react"
import { useJsApiLoader, Autocomplete } from "@react-google-maps/api"
import { Input } from "@/components/ui/input"
import { MapPin, Search } from "lucide-react"

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

      const addressComponents = place.address_components
      const address = {
        formatted_address: place.formatted_address,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
        street: addressComponents?.find(c => c.types.includes("route"))?.long_name,
        number: addressComponents?.find(c => c.types.includes("street_number"))?.long_name,
        neighborhood: addressComponents?.find(c => c.types.includes("sublocality"))?.long_name,
        city: addressComponents?.find(c => c.types.includes("locality"))?.long_name,
        state: addressComponents?.find(c => c.types.includes("administrative_area_level_1"))?.short_name,
        zip: addressComponents?.find(c => c.types.includes("postal_code"))?.long_name,
      }

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
