"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { MapPin, Search } from "lucide-react"
import { toast } from "sonner"

// Declare custom elements for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'gmpx-api-loader': any;
      'gmpx-place-picker': any;
    }
  }
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: any) => void
  placeholder?: string
  className?: string
}

export function AddressAutocomplete({ onAddressSelect, placeholder, className }: AddressAutocompleteProps) {
  const pickerRef = useRef<any>(null)

  useEffect(() => {
    const picker = pickerRef.current
    if (!picker) return

    const handlePlaceChange = () => {
      const place = picker.value
      
      if (!place || !place.location) {
        return
      }

      // Extract structured data using the library's place object
      // Note: Place Extended Components handle most of this, but we'll map it to our existing schema
      const addressComponents = place.addressComponents
      
      const getComponent = (type: string, useShortName = false) => {
        const comp = addressComponents?.find((c: any) => c.types.includes(type))
        return useShortName ? comp?.shortName : comp?.longName
      }

      const structuredAddress = {
        formatted_address: place.formattedAddress,
        lat: place.location.lat(),
        lng: place.location.lng(),
        street: getComponent("route"),
        number: getComponent("street_number"),
        neighborhood: getComponent("sublocality_level_1") || getComponent("sublocality") || getComponent("neighborhood"),
        city: getComponent("administrative_area_level_2") || getComponent("locality"),
        state: getComponent("administrative_area_level_1", true),
        zip: getComponent("postal_code"),
      }

      console.log("Modern Structured Address:", structuredAddress)
      onAddressSelect(structuredAddress)
    }

    picker.addEventListener('gmpx-placechange', handlePlaceChange)
    return () => picker.removeEventListener('gmpx-placechange', handlePlaceChange)
  }, [onAddressSelect])

  return (
    <div className="relative w-full modern-autocomplete">
      <gmpx-api-loader 
        key={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY} 
        solution-channel="GMP_GE_mapsandplacesautocomplete_v2"
      />
      
      <div className="relative group">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400 z-10" />
        <gmpx-place-picker 
          ref={pickerRef}
          placeholder={placeholder || "Digite seu endereço..."}
          class="modern-picker"
        />
      </div>

      <style jsx global>{`
        gmpx-place-picker {
          width: 100%;
          --gmpx-border-radius: 28px;
          --gmpx-font-family: inherit;
          --gmpx-font-size: 14px;
        }
        gmpx-place-picker::part(input) {
          padding-left: 3rem;
          height: 64px;
          border: 2px solid transparent;
          background-color: #f8fafc;
          border-radius: 28px;
          font-weight: 700;
          color: #334155;
          transition: all 0.2s;
        }
        gmpx-place-picker:focus-within::part(input) {
          border-color: #fecdd3;
          background-color: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  )
}
