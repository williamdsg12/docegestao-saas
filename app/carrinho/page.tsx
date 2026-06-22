"use client"
import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 

 MapPin, 
  ShoppingBag, 
  Clock, 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 

 Search, 
  Info, 

 Trash2, 
  Plus, 
  Minus,
  AlertCircle,
  Truck,
  Store,
  ChevronRight,
  DollarSign,

 Loader2,
  Check,
  Calendar,
  Keyboard,
  Map as MapIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { RegistrationModal } from "@/components/checkout/RegistrationModal"
type CheckoutStep = 
  | 'delivery-options'
  | 'address-form' 
  | 'schedule'
  | 'payment'
  | 'confirm'
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
  variation?: any
  extras?: any[]
  observation?: string
  totalItemPrice: number
}
interface CheckoutState {
  items: CartItem[]
  subtotal: number
  deliveryType: 'delivery' | 'retirada' | 'local'
  address?: {
    cep: string
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    reference?: string
    lat?: number
    lng?: number
    formatted_address?: string
  }
  deliveryFee: number
  scheduleType: 'now' | 'scheduled'
  scheduledTime?: string
  estimatedTime?: string
  paymentTiming: 'app' | 'delivery'
  paymentMethod: 'cash' | 'credit' | 'debit' | 'pix' | 'credit_app' | 'debit_app' | 'voucher_app'
  changeFor?: string
  couponCode?: string
  phone?: string
  taxId?: string
  notes?: string
  total: number
}
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
async function getAddressCoordinates(addressStr: string): Promise<{lat: number, lng: number} | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !(window as any).google?.maps?.Geocoder) {
      resolve(null);
      return;
    }
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ address: addressStr }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const loc = results[0].geometry.location;
        resolve({ lat: loc.lat(), lng: loc.lng() });
      } else {
        console.error("Geocoding failed:", status);
        resolve(null);
      }
    });
  });
}
function CarrinhoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeSlug = searchParams.get('s')
  const initialType = (searchParams.get('tipo') || 'delivery') as 'delivery' | 'retirada' | 'local'

  const [step, setStep] = useState<CheckoutStep>('delivery-options')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [company, setCompany] = useState<any>(null)

  // Form States
  const [checkout, setCheckout] = useState<CheckoutState>({
    items: [],
    subtotal: 0,
    deliveryType: initialType,
    deliveryFee: 0,
    scheduleType: 'now',
    estimatedTime: "45-58min",
    paymentTiming: 'delivery',
    paymentMethod: 'cash',
    total: 0
  })

  const [cepInput, setCepInput] = useState("")
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showCashModal, setShowCashModal] = useState(false)
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [mapCoordinates, setMapCoordinates] = useState<{lat: number, lng: number} | null>(null)
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [deliverySettings, setDeliverySettings] = useState<any>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)

  // iFood Payment States
  const [paymentProvider, setPaymentProvider] = useState<'mercadopago' | 'tuna'>('mercadopago')
  const [mp, setMp] = useState<any>(null)
  const [cardFields, setCardFields] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
    cpf: "",
    installments: "1"
  })

  // Format Helpers
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\D/g, "").substring(0, 16)
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ""
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    return parts.length > 0 ? parts.join(" ") : v
  }

  const formatExpiry = (value: string) => {
    const clean = value.replace(/\D/g, "").substring(0, 4)
    if (clean.length > 2) {
      return `${clean.substring(0, 2)}/${clean.substring(2, 4)}`
    }
    return clean
  }

  const formatCPF = (value: string) => {
    const clean = value.replace(/\D/g, "").substring(0, 11)
    if (clean.length > 9) {
      return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6, 9)}-${clean.substring(9, 11)}`
    }
    if (clean.length > 6) {
      return `${clean.substring(0, 3)}.${clean.substring(3, 6)}.${clean.substring(6)}`
    }
    if (clean.length > 3) {
      return `${clean.substring(0, 3)}.${clean.substring(3)}`
    }
    return clean
  }

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\D/g, "")
    if (clean.startsWith("4")) return "visa"
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "mastercard"
    if (/^(34|37)/.test(clean)) return "amex"
    if (/^(4011|4312|4389|4514|4576|5041|5067|5090|6277|6363|6362)/.test(clean)) return "elo"
    if (/^(6062|3841)/.test(clean)) return "hipercard"
    if (/^(301|305|36|38)/.test(clean)) return "diners"
    return "unknown"
  }

  // Load Mercado Pago dynamically & fetch active provider
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).MercadoPago) {
      const mpInstance = new (window as any).MercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || '', {
        locale: 'pt-BR'
      })
      setMp(mpInstance)
    }
  }, [])

  useEffect(() => {
    if (company?.id) {
      fetch(`/api/payments/pix?tenant_id=${company.id}&check_only=true`)
        .then(res => res.json())
        .then(data => {
          if (data.provider) {
            setPaymentProvider(data.provider)
            console.log(`Payment provider for this store is: ${data.provider}`)
          }
        })
        .catch(err => console.error("Error checking payment provider:", err))
    }
  }, [company?.id])

  // Audit Logs
  useEffect(() => {
    console.log('Método selecionado', checkout.paymentMethod)
    if (['credit_app', 'debit_app', 'voucher_app'].includes(checkout.paymentMethod)) {
      console.log('Formulário de cartão carregado')
    }
  }, [checkout.paymentMethod])


  // Load Google Maps Script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
    if (!apiKey) return;

    if (!(window as any).google?.maps) {
      const existing = document.getElementById("google-maps-script")
      if (!existing) {
        const script = document.createElement("script")
        script.id = "google-maps-script"
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places`
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
    }
  }, [])

  // Initialize Google Map in Confirmation Dialog
  useEffect(() => {
    if (showMapModal && mapCoordinates && mapRef.current && (window as any).google?.maps) {
      const google = (window as any).google;

      if (!mapInstanceRef.current) {
        const map = new google.maps.Map(mapRef.current, {
          center: mapCoordinates,
          zoom: 17,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: false
        });
        mapInstanceRef.current = map;

        const marker = new google.maps.Marker({
          position: mapCoordinates,
          map: map,
          draggable: true,
          title: "Arraste para ajustar sua localização"
        });
        markerInstanceRef.current = marker;

        // Listen to dragend
        marker.addListener("dragend", () => {
          const position = marker.getPosition();
          if (position) {
            const newCoords = { lat: position.lat(), lng: position.lng() };
            setMapCoordinates(newCoords);
            console.log("Marker dragged to new coordinates:", newCoords);
          }
        });
      } else {
        // Just update center and marker position if coordinates changed from outside
        const currentCenter = mapInstanceRef.current.getCenter();
        if (currentCenter && (currentCenter.lat() !== mapCoordinates.lat || currentCenter.lng() !== mapCoordinates.lng)) {
          mapInstanceRef.current.setCenter(mapCoordinates);
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setPosition(mapCoordinates);
          }
        }
      }
    }

    // Clean up map instance when modal closes
    if (!showMapModal) {
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
    }
  }, [showMapModal, mapCoordinates])

  const [currentCustomer, setCurrentCustomer] = useState<any>(null)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [customerNotFound, setCustomerNotFound] = useState(false)
  const [lastSearchedPhone, setLastSearchedPhone] = useState("")
  const numberInputRef = useState<any>(null) // We'll use a standard ref later or just focus by ID

  // Bug 7: Pre-fill from identification modal
  useEffect(() => {
    const savedPhone = sessionStorage.getItem('checkoutPhone')
    const savedCustomer = sessionStorage.getItem('checkoutCustomer')
    const savedDeliveryType = sessionStorage.getItem('checkoutDeliveryType') as any

    if (savedPhone) updateCheckout({ phone: formatPhone(savedPhone) })
    if (savedDeliveryType) updateCheckout({ deliveryType: savedDeliveryType })

    if (savedCustomer) {
      try {
        const customer = JSON.parse(savedCustomer)
        setCurrentCustomer(customer)

        // Split name into firstName and lastName
        const fullName = customer.name || ""
        const firstSpaceIdx = fullName.indexOf(" ")
        if (firstSpaceIdx !== -1) {
          setFirstName(fullName.substring(0, firstSpaceIdx))
          setLastName(fullName.substring(firstSpaceIdx + 1))
        } else {
          setFirstName(fullName)
          setLastName("")
        }

        const hasRootAddress = customer.cep || customer.address
        const rootAddr = hasRootAddress ? {
          cep: customer.cep || "",
          street: customer.address || "",
          number: customer.number || "",
          complement: customer.complement || "",
          neighborhood: customer.neighborhood || "",
          city: customer.city || "",
          state: customer.state || "",
          reference: customer.reference_point || "",
        } : null

        const firstAddr = (customer.addresses && customer.addresses.length > 0) ? {
          cep: customer.addresses[0].zip || customer.addresses[0].cep || "",
          street: customer.addresses[0].street || customer.addresses[0].address || customer.addresses[0].rua || "",
          number: customer.addresses[0].number || customer.addresses[0].numero || "",
          complement: customer.addresses[0].complement || "",
          neighborhood: customer.addresses[0].neighborhood || customer.addresses[0].bairro || "",
          city: customer.addresses[0].city || customer.addresses[0].cidade || "",
          state: customer.addresses[0].state || "",
          reference: customer.addresses[0].reference || customer.addresses[0].reference_point || "",
        } : null

        updateCheckout({
          taxId: customer.cpf_cnpj || customer.cpf || customer.taxId || "",
          address: (savedDeliveryType === 'delivery') ? (rootAddr || firstAddr || checkout.address) : checkout.address
        })
      } catch (e) {
        console.error("Error parsing saved customer", e)
      }
    }
  }, [])

  // Helpers
  const updateCheckout = (updates: Partial<CheckoutState>) => {
    setCheckout(prev => {
      const newState = { ...prev, ...updates }
      newState.total = newState.subtotal + newState.deliveryFee
      return newState
    })
  }

  const handleNext = (next: CheckoutStep) => setStep(next)

  const autoCalculateDelivery = useCallback(async (addr: any) => {
    if (!addr || !addr.cep || !addr.street) {
      console.log("Carrinho: autoCalculateDelivery cancelado - endereço incompleto", addr)
      return
    }

    const addressStr = `${addr.street}, ${addr.number || ""} - ${addr.neighborhood || ""}, ${addr.city} - ${addr.state || ""}, Brazil`
    console.log("Carrinho: autoCalculateDelivery iniciando geocodificação para:", addressStr)

    try {
      let coords = null
      if (addr.lat && addr.lng) {
        coords = { lat: Number(addr.lat), lng: Number(addr.lng) }
      } else {
        coords = await getAddressCoordinates(addressStr)
      }

      if (!coords) {
        console.warn("Carrinho: autoCalculateDelivery falhou ao obter coordenadas do Google.")
        return
      }

      const clientLat = coords.lat
      const clientLng = coords.lng

      // Calculate distance
      let storeLat = Number(company?.address_lat)
      let storeLng = Number(company?.address_lng)

      // Fallback if store has no coordinates
      if (!storeLat || !storeLng) {
        console.warn("Carrinho: autoCalculateDelivery - Coordenadas da loja não definidas, usando Cascavel/PR como fallback.")
        storeLat = -24.9555
        storeLng = -53.4555
      }

      const distance = calculateDistance(storeLat, storeLng, clientLat, clientLng)
      const maxRadius = Number(deliverySettings?.max_km) || Number(company?.delivery_radius) || 10

      console.log(`Carrinho: Distância calculada: ${distance.toFixed(2)} km, Raio máximo da loja: ${maxRadius} km`)

      if (distance > maxRadius) {
        toast.warning("Endereço distante", {
          description: `Sua localização está a ${distance.toFixed(1)} km, o limite da loja é ${maxRadius} km.`
        })
      }

      // Calculate delivery fee
      const baseFee = Number(deliverySettings?.base_fee) || Number(company?.delivery_fee) || 0
      const feePerKm = Number(deliverySettings?.fee_per_km) || 0
      const subtotal = checkout.subtotal
      const freeThreshold = Number(deliverySettings?.frete_gratis_valor) || 50

      let finalFee = baseFee + (distance * feePerKm)
      if (subtotal >= freeThreshold) {
        finalFee = 0
      }

      console.log(`Carrinho: Cálculo de frete concluído. Distância: ${distance.toFixed(2)} km, Taxa: R$ ${finalFee.toFixed(2)}`)

      updateCheckout({
        deliveryFee: finalFee,
        address: {
          ...addr,
          lat: clientLat,
          lng: clientLng,
          formatted_address: `${addr.street}, ${addr.number || ""} - ${addr.neighborhood || ""}, ${addr.city} - ${addr.state || ""}`
        }
      })

      // Auto transition to the schedule step for a frictionless customer flow
      handleNext('schedule')
      toast.success("Endereço e frete preenchidos automaticamente!")

    } catch (err) {
      console.error("Carrinho: Erro ao calcular frete automático:", err)
    }
  }, [company, deliverySettings, checkout.subtotal, handleNext])

  // Trigger automatic calculation and step advancement once company data is loaded
  useEffect(() => {
    if (!company?.id || !currentCustomer) return

    const hasRootAddress = currentCustomer.cep || currentCustomer.address
    const rootAddr = hasRootAddress ? {
      cep: currentCustomer.cep || "",
      street: currentCustomer.address || "",
      number: currentCustomer.number || "",
      complement: currentCustomer.complement || "",
      neighborhood: currentCustomer.neighborhood || "",
      city: currentCustomer.city || "",
      state: currentCustomer.state || "",
      reference: currentCustomer.reference_point || "",
    } : null

    const firstAddr = (currentCustomer.addresses && currentCustomer.addresses.length > 0) ? {
      cep: currentCustomer.addresses[0].zip || currentCustomer.addresses[0].cep || "",
      street: currentCustomer.addresses[0].street || currentCustomer.addresses[0].address || currentCustomer.addresses[0].rua || "",
      number: currentCustomer.addresses[0].number || currentCustomer.addresses[0].numero || "",
      complement: currentCustomer.addresses[0].complement || "",
      neighborhood: currentCustomer.addresses[0].neighborhood || currentCustomer.addresses[0].bairro || "",
      city: currentCustomer.addresses[0].city || currentCustomer.addresses[0].cidade || "",
      state: currentCustomer.addresses[0].state || "",
      reference: currentCustomer.addresses[0].reference || currentCustomer.addresses[0].reference_point || "",
    } : null

    const targetAddress = rootAddr || firstAddr
    if (targetAddress && targetAddress.cep) {
      // Pre-fill CEP input field
      let formattedCep = targetAddress.cep.replace(/\D/g, '')
      if (formattedCep.length > 5) {
        formattedCep = formattedCep.slice(0, 5) + '-' + formattedCep.slice(5, 8)
      }
      setCepInput(formattedCep)

      if (checkout.deliveryFee === 0 && checkout.deliveryType === 'delivery' && step === 'delivery-options') {
        console.log("Carrinho: Auto-calculando frete de cliente recuperado na inicialização...")
        autoCalculateDelivery(targetAddress)
      }
    }
  }, [company?.id, currentCustomer, autoCalculateDelivery, checkout.deliveryFee, checkout.deliveryType, step])


  // Load Data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        let slug = storeSlug

        if (!slug) {
          const lastStore = localStorage.getItem('last_visited_store')
          if (lastStore) slug = lastStore
        }

        if (!slug) {
          router.push('/')
          return
        }

        // Fetch Company and Delivery Settings
        const [companyRes, deliveryRes] = await Promise.all([
          supabase.from('companies').select('*').eq('menu_slug', slug).maybeSingle(),
          supabase.from('delivery_settings').select('*').eq('tenant_id', slug).maybeSingle() // Slug might be ID here, need to check
        ])

        const companyData = companyRes.data

        if (!companyData) {
          toast.error("Loja não encontrada")
          router.push('/')
          return
        }

        setCompany(companyData)

        // If previous fetch failed because of slug/id mismatch, try with company ID
        let deliveryData = deliveryRes.data
        if (!deliveryData && companyData.id) {
          const { data } = await supabase.from('delivery_settings').select('*').eq('tenant_id', companyData.id).maybeSingle()
          deliveryData = data
        }
        setDeliverySettings(deliveryData)

        const freeThreshold = Number(deliveryData?.frete_gratis_valor) || 50
        const baseFee = Number(deliveryData?.taxa_base) || 0

        // Fetch Cart
        const savedCart = localStorage.getItem(`cart_${slug}`)
        if (savedCart) {
          const items = JSON.parse(savedCart)
          const subtotal = items.reduce((acc: number, i: CartItem) => acc + i.totalItemPrice, 0)

          setCheckout(prev => {
            const newState = {
              ...prev,
              items,
              subtotal,
              deliveryType: initialType,
              deliveryFee: (initialType === 'delivery' && subtotal < freeThreshold) ? baseFee : 0,
              total: subtotal + ((initialType === 'delivery' && subtotal < freeThreshold) ? baseFee : 0)
            }
            return newState
          })

          // Logic to skip steps based on type
          if (initialType === 'retirada') {
            setStep('schedule')
            setCheckout(prev => ({ ...prev, deliveryFee: 0 }))
          } else if (initialType === 'local') {
            setStep('schedule')
            setCheckout(prev => ({ ...prev, deliveryFee: 0 }))
          }
        } else {
          toast.error("Seu carrinho está vazio")
          router.push(`/menu/${slug}`)
        }
      } catch (err) {
        console.error("Error loading checkout data", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [storeSlug, initialType])



  const handleBack = () => {
    if (step === 'address-form') setStep('delivery-options')
    else if (step === 'schedule') {
      if (checkout.deliveryType === 'delivery') setStep('address-form')
      else setStep('delivery-options')
    }
    else if (step === 'payment') setStep('schedule')
    else if (step === 'confirm') setStep('payment')
    else router.back()
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      let masked = numbers
      if (numbers.length > 2) masked = `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      if (numbers.length > 7) masked = `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
      return masked
    }
    return value
  }

  const formatTaxId = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})/, "$1-$2")
        .replace(/(-\d{2})\d+?$/, "$1")
    }
    return numbers.slice(0, 14)
  }

  const lookupCustomer = useCallback(async (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "")
    if (cleanPhone.length < 10) return
    if (!company?.id) {
      console.log('Carrinho: lookupCustomer cancelado - loja ainda não carregou.')
      return
    }

    try {
      console.log('Carrinho: Buscando cadastro para o telefone:', phone)
      console.log('Carrinho: Telefone normalizado:', cleanPhone)
      console.log('Carrinho: ID da Loja:', company.id)

      const res = await fetch(`/api/customers?phone=${cleanPhone}&storeId=${company.id}`)
      const data = await res.json()

      console.log('Carrinho: Resposta da busca do cliente:', data)

      if (data && data.id) {
        // Cliente encontrado — preencher dados
        setCurrentCustomer(data)
        setCustomerNotFound(false)

        // Split name into firstName and lastName
        const fullName = data.name || ""
        const firstSpaceIdx = fullName.indexOf(" ")
        if (firstSpaceIdx !== -1) {
          setFirstName(fullName.substring(0, firstSpaceIdx))
          setLastName(fullName.substring(firstSpaceIdx + 1))
        } else {
          setFirstName(fullName)
          setLastName("")
        }

        const lastOrder = data.orders && data.orders.length > 0
          ? [...data.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
          : null

        toast.success(`👋 Bem-vindo de volta, ${data.name.split(' ')[0]}! Seus dados foram preenchidos automaticamente.`)

        const hasRootAddress = data.cep || data.address
        const rootAddr = hasRootAddress ? {
          cep: data.cep || "",
          street: data.address || "",
          number: data.number || "",
          complement: data.complement || "",
          neighborhood: data.neighborhood || "",
          city: data.city || "",
          state: data.state || "",
          reference: data.reference_point || "",
        } : null

        const firstAddr = (data.addresses && data.addresses.length > 0) ? {
          cep: data.addresses[0].zip || data.addresses[0].cep || "",
          street: data.addresses[0].street || data.addresses[0].address || data.addresses[0].rua || "",
          number: data.addresses[0].number || data.addresses[0].numero || "",
          complement: data.addresses[0].complement || "",
          neighborhood: data.addresses[0].neighborhood || data.addresses[0].bairro || "",
          city: data.addresses[0].city || data.addresses[0].cidade || "",
          state: data.addresses[0].state || "",
          reference: data.addresses[0].reference || data.addresses[0].reference_point || "",
        } : null

        const targetAddress = rootAddr || firstAddr
        updateCheckout({
          taxId: data.cpf_cnpj || data.cpf || checkout.taxId,
          notes: lastOrder?.notes || checkout.notes,
          address: targetAddress || checkout.address
        })

        if (targetAddress && targetAddress.cep) {
          // Pre-fill CEP input field
          let formattedCep = targetAddress.cep.replace(/\D/g, '')
          if (formattedCep.length > 5) {
            formattedCep = formattedCep.slice(0, 5) + '-' + formattedCep.slice(5, 8)
          }
          setCepInput(formattedCep)

          // Perform automatic delivery fee calculation and step skipping if in delivery mode
          if (checkout.deliveryType === 'delivery') {
            autoCalculateDelivery(targetAddress)
          }
        }
      } else {
        // Cliente não encontrado — abrir modal de cadastro
        setCurrentCustomer(null)
        setFirstName("")
        setLastName("")
        setCustomerNotFound(true)
        toast.info("Cliente não encontrado. Complete os dados para realizar o cadastro.")
        setShowRegistrationModal(true)
      }
    } catch (err) {
      console.error("Error looking up customer", err)
    }
  }, [company?.id, checkout.address, checkout.taxId, checkout.notes, checkout.deliveryType, autoCalculateDelivery])

  // Automatic lookup with 500ms debounce
  useEffect(() => {
    if (!company?.id) {
      console.log('Carrinho: Debounce lookup pulado - empresa não carregada.')
      return
    }

    const cleanPhone = checkout.phone?.replace(/\D/g, "") || ""
    if (cleanPhone.length < 10) {
      if (cleanPhone.length === 0) {
        setCurrentCustomer(null)
        setFirstName("")
        setLastName("")
        setCustomerNotFound(false)
        setLastSearchedPhone("")
      }
      return
    }
    if (cleanPhone === lastSearchedPhone) return

    console.log('Carrinho: Iniciando timer de 500ms para buscar telefone:', cleanPhone)

    const timer = setTimeout(() => {
      setLastSearchedPhone(cleanPhone)
      lookupCustomer(cleanPhone)
    }, 500)

    return () => clearTimeout(timer)
  }, [checkout.phone, lastSearchedPhone, lookupCustomer, company?.id])


  const handleCepLookup = async (manualCep?: string) => {
    const targetCep = (manualCep || cepInput).replace(/\D/g, '')
    console.log('CEP:', targetCep)
    if (targetCep.length !== 8) {
      if (!manualCep) toast.error("Digite um CEP válido")
      return
    }
    try {
      setIsLoadingCep(true)
      console.log('Buscando CEP...')
      const res = await fetch(`https://viacep.com.br/ws/${targetCep}/json/`)
      const data = await res.json()
      console.log('Resposta:', data)
      if (data.erro) {
        toast.error("CEP não encontrado")
        return
      }
      console.log('Endereço encontrado')
      updateCheckout({
        address: {
          cep: targetCep,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
          number: ""
        }
      })
      handleNext('address-form')
      // Focus number input
      setTimeout(() => {
        const el = document.getElementById('address-number')
        if (el) el.focus()
      }, 500)
    } catch (err) {
      console.log('Erro capturado:', err)
      toast.error("Erro ao buscar CEP")
    } finally {
      setIsLoadingCep(false)
    }
  }

  const handleAddressSubmit = async () => {
    if (!checkout.address?.street || !checkout.address?.number || !checkout.address?.city) {
      toast.error("Por favor, preencha o endereço completo")
      return
    }

    try {
      setIsGeocoding(true)
      setShowMapModal(true)

      const addressStr = `${checkout.address.street}, ${checkout.address.number} - ${checkout.address.neighborhood || ""}, ${checkout.address.city} - ${checkout.address.state || ""}, Brazil`
      console.log("Geocoding address:", addressStr)

      // If address already has lat and lng (from AddressAutocomplete), use it
      if (checkout.address.lat && checkout.address.lng) {
        setMapCoordinates({ lat: checkout.address.lat, lng: checkout.address.lng })
      } else {
        const coords = await getAddressCoordinates(addressStr)
        if (coords) {
          setMapCoordinates(coords)
        } else {
          // Fallback to store coordinates or default Cascavel, PR
          console.warn("Geocoding failed, centering on default coordinates.")
          const fallbackCoords = company?.address_lat && company?.address_lng 
            ? { lat: Number(company.address_lat), lng: Number(company.address_lng) }
            : { lat: -24.9555, lng: -53.4555 }
          setMapCoordinates(fallbackCoords)
        }
      }
    } catch (error) {
      console.error("Error in address geocoding:", error)
    } finally {
      setIsGeocoding(false)
    }
  }

  const handleConfirmLocation = () => {
    if (!mapCoordinates) {
      toast.error("Localização não disponível")
      return
    }

    const clientLat = mapCoordinates.lat
    const clientLng = mapCoordinates.lng

    // Calculate distance
    let storeLat = Number(company?.address_lat)
    let storeLng = Number(company?.address_lng)

    // Fallback if store has no coordinates
    if (!storeLat || !storeLng) {
      console.warn("Store coordinates not set, using default coordinates from Cascavel/Brazil")
      storeLat = -24.9555
      storeLng = -53.4555
    }

    const distance = calculateDistance(storeLat, storeLng, clientLat, clientLng)
    const maxRadius = Number(deliverySettings?.max_km) || Number(company?.delivery_radius) || 10

    console.log(`Calculated distance: ${distance} km, Max delivery radius: ${maxRadius} km`)

    if (distance > maxRadius) {
      toast.error("Endereço fora da área de entrega", {
        description: `Sua localização está a ${distance.toFixed(1)} km, mas nosso raio de entrega máximo é de ${maxRadius} km.`
      })
      return
    }

    // Calculate delivery fee
    const baseFee = Number(deliverySettings?.base_fee) || Number(company?.delivery_fee) || 0
    const feePerKm = Number(deliverySettings?.fee_per_km) || 0

    // Check if free delivery threshold is met
    const subtotal = checkout.subtotal
    const freeThreshold = Number(deliverySettings?.frete_gratis_valor) || 50

    let finalFee = baseFee + (distance * feePerKm)
    if (subtotal >= freeThreshold) {
      finalFee = 0
    }

    // Save fields to checkout address state
    updateCheckout({
      deliveryFee: finalFee,
      address: {
        ...checkout.address!,
        lat: clientLat,
        lng: clientLng,
        formatted_address: `${checkout.address?.street}, ${checkout.address?.number} - ${checkout.address?.neighborhood}, ${checkout.address?.city} - ${checkout.address?.state}`
      }
    })

    setShowMapModal(false)
    handleNext('schedule')
    toast.success("Localização confirmada com sucesso!")
  }

  const handleOrderSubmit = async () => {
    if (!checkout.phone) {
      toast.error("Informe seu telefone")
      return
    }

    const isCardPayment = ['credit_app', 'debit_app', 'voucher_app'].includes(checkout.paymentMethod)
    
    // Validate card inputs if it is card payment
    if (isCardPayment) {
      if (!cardFields.name || !cardFields.number || !cardFields.expiry || !cardFields.cvv || !cardFields.cpf) {
        toast.error("Por favor, preencha todos os campos do cartão")
        return
      }
      if (cardFields.number.replace(/\s/g, "").length < 15) {
        toast.error("Número do cartão inválido")
        return
      }
      if (cardFields.expiry.length < 5) {
        toast.error("Data de validade inválida (Use MM/AA)")
        return
      }
      if (cardFields.cvv.length < 3) {
        toast.error("CVV inválido")
        return
      }
      if (cardFields.cpf.replace(/\D/g, "").length < 11) {
        toast.error("CPF do titular inválido")
        return
      }
    }

    try {
      setIsSubmitting(true)

      let cardToken = ""
      let detectedBrand = "visa"

      // 1. If card payment, tokenize card first
      if (isCardPayment) {
        toast.info("Processando dados do cartão com segurança...")
        const [expiryMonth, expiryYear] = cardFields.expiry.split('/')
        detectedBrand = getCardBrand(cardFields.number)
        if (detectedBrand === 'unknown') detectedBrand = 'visa'

        if (paymentProvider === 'tuna') {
          // Get session
          const sessionRes = await fetch(`/api/payments/tuna/session?tenant_id=${company.id}`)
          const { session_id } = await sessionRes.json()
          if (!session_id) throw new Error("Não foi possível iniciar a sessão de pagamento")

          const tuna = new (window as any).Tuna()
          const tunaToken = await tuna.createToken({
            sessionId: session_id,
            card: {
              number: cardFields.number.replace(/\s/g, ""),
              name: cardFields.name,
              expiryMonth,
              expiryYear: "20" + expiryYear,
              cvv: cardFields.cvv
            }
          })
          if (!tunaToken || !tunaToken.token) {
            throw new Error("Erro ao gerar token do cartão com a Tuna")
          }
          cardToken = tunaToken.token
          console.log('Token do cartão gerado')
        } else {
          // Default: Mercado Pago
          if (!mp) {
            throw new Error("Sistema de pagamentos do Mercado Pago não está pronto. Tente novamente.")
          }
          const cardTokenResponse = await mp.createCardToken({
            cardNumber: cardFields.number.replace(/\s/g, ""),
            cardholderName: cardFields.name,
            cardExpirationMonth: expiryMonth,
            cardExpirationYear: "20" + expiryYear,
            securityCode: cardFields.cvv,
            identificationType: "CPF",
            identificationNumber: cardFields.cpf.replace(/\D/g, ""),
          })
          if (!cardTokenResponse || !cardTokenResponse.id) {
            throw new Error("Erro ao tokenizar cartão. Verifique os dados inseridos.")
          }
          cardToken = cardTokenResponse.id
          console.log('Token do cartão gerado')
        }
      }

      // 2. Sync/Link Customer
      if (currentCustomer?.id) {
        await fetch(`/api/customers/${currentCustomer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: company.id,
            name: `${firstName} ${lastName}`.trim() || currentCustomer.name, 
            email: currentCustomer.email || "",
            cpf_cnpj: checkout.taxId || null,
            cep: checkout.address?.cep || null,
            address: checkout.address?.street || null,
            number: checkout.address?.number || null,
            neighborhood: checkout.address?.neighborhood || null,
            city: checkout.address?.city || null,
            state: checkout.address?.state || null,
            complement: checkout.address?.complement || null,
            reference_point: checkout.address?.reference || null
          })
        })
      }

      // 3. Submit Order
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeSlug: storeSlug,
          company_id: company.id,
          tenant_id: company.id,

          // Tipo de pedido
          deliveryType: checkout.deliveryType,

          // Itens
          items: checkout.items.map(item => ({
            productId: item.id,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.totalItemPrice / item.quantity,
            totalPrice: item.totalItemPrice,
            variations: item.variation,
            extras: item.extras,
            notes: item.observation
          })),

          // Valores
          subtotal: checkout.subtotal,
          deliveryFee: checkout.deliveryFee,
          discount: 0,
          total: checkout.total,

          // Endereço (somente se deliveryType === "delivery")
          addressCep: checkout.address?.cep,
          addressStreet: checkout.address?.street,
          addressNumber: checkout.address?.number,
          addressComplement: checkout.address?.complement,
          addressNeighborhood: checkout.address?.neighborhood,
          addressCity: checkout.address?.city,
          addressState: checkout.address?.state,
          addressReference: checkout.address?.reference,
          latitude: checkout.address?.lat || null,
          longitude: checkout.address?.lng || null,

          // Horário
          scheduleType: checkout.scheduleType,
          estimatedTime: checkout.estimatedTime,

          // Pagamento
          paymentTiming: checkout.paymentTiming,
          paymentMethod: checkout.paymentMethod === 'pix' ? 'pix' : (checkout.paymentMethod === 'credit_app' ? 'credit_card' : 'debit_card'),
          changeFor: checkout.changeFor,

          // Cliente
          customerPhone: checkout.phone,
          customerCpf: checkout.taxId || cardFields.cpf || null,
          customerName: `${firstName} ${lastName}`.trim() || currentCustomer?.name || "Cliente",

          // Observações
          notes: checkout.notes
        })
      })

      const result = await res.json()
      if (!result.success) {
        throw new Error(result.error || "Erro ao criar pedido.")
      }

      const orderId = result.orderId

      // 4. Handle PIX redirect
      if (checkout.paymentTiming === 'app' && checkout.paymentMethod === 'pix') {
        console.log('PIX gerado')
        toast.success("Pedido enviado! Redirecionando para pagamento PIX...")
        localStorage.removeItem(`cart_${company.menu_slug}`)
        router.push(`/checkout/pagamento?orderId=${orderId}`)
        return
      }

      // 5. Handle Online Card Payment (Credit/Debit/Voucher)
      if (checkout.paymentTiming === 'app' && isCardPayment) {
        toast.info("Processando pagamento do cartão...")
        
        const cardPaymentRes = await fetch('/api/payments/card', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: cardToken,
            amount: checkout.total,
            order_id: orderId,
            tenant_id: company.id,
            customer_email: currentCustomer?.email || 'cliente@docegestao.com.br',
            customer_name: `${firstName} ${lastName}`.trim() || cardFields.name,
            installments: Number(cardFields.installments) || 1,
            payment_method_id: detectedBrand
          })
        })

        const paymentResult = await cardPaymentRes.json()
        if (paymentResult.status === 'approved') {
          console.log('Pagamento aprovado')
          toast.success("Pagamento aprovado! Seu pedido foi confirmado.")
          localStorage.removeItem(`cart_${company.menu_slug}`)
          router.push(`/pedido/rastreamento/${orderId}?new=true`)
        } else {
          console.log('Pagamento recusado')
          throw new Error(`Pagamento recusado: ${paymentResult.detail || paymentResult.status_detail || 'Transação não autorizada. Verifique os dados do cartão ou limite.'}`)
        }
      } else {
        // Pague na entrega ou outros
        toast.success("Pedido enviado com sucesso!")
        localStorage.removeItem(`cart_${company.menu_slug}`)
        router.push(`/pedido/rastreamento/${orderId}?new=true`)
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar pedido")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="size-10 animate-spin text-red-600" /></div>

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-red-100 selection:text-red-600">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={handleBack} className="size-8 rounded-full bg-[#DC2626] flex items-center justify-center text-white shadow-md active:scale-90 transition-all">
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-[18px] font-medium text-slate-800">
            {step === 'delivery-options' && "Opções de entrega"}
            {step === 'address-form' && "Completar endereço"}
            {step === 'schedule' && (checkout.deliveryType === 'delivery' ? "Entregar no endereço" : "Retirada no estabelecimento")}
            {step === 'payment' && "Selecione a forma de pagamento"}
            {step === 'confirm' && "Confirmar pedido"}
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LEFT COLUMN: STEPS */}
        <div className="lg:col-span-8 space-y-6">
          <AnimatePresence mode="wait">
            {step === 'delivery-options' && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
                {/* Entregar */}
                <section className="space-y-4">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">ENTREGAR NO MEU ENDEREÇO</h2>
                  <div className="space-y-1">
                    <button 
                      onClick={() => toast.info("Localização automática em desenvolvimento")}
                      className="w-full bg-white p-6 border-b border-slate-50 hover:bg-slate-50 transition-all text-left flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <MapPin className="size-6 text-slate-400 group-hover:text-[#DC2626]" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Usar a minha localização atual</p>
                          <p className="text-[11px] text-slate-400">Ativar localização automática</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                        Selecionar <ChevronRight className="size-4" />
                      </div>
                    </button>

                    <div className="bg-white p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <Keyboard className="size-6 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Digitar meu endereço por CEP</p>
                          <p className="text-[11px] text-slate-400">Informar meu endereço por CEP</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Digite o CEP" 
                          className="h-12 rounded-lg bg-slate-50 border-slate-200 text-sm" 
                          value={cepInput}
                          maxLength={9}
                          onChange={e => {
                            let val = e.target.value.replace(/\D/g, '')
                            if (val.length > 5) val = val.slice(0, 5) + '-' + val.slice(5, 8)
                            setCepInput(val)

                            // Bug 4: Auto lookup
                            const digits = val.replace(/\D/g, '')
                            if (digits.length === 8) {
                               // Small delay to ensure state is updated if needed
                               setTimeout(() => handleCepLookup(digits), 100)
                            }
                          }}
                        />
                        <Button 
                          onClick={() => handleCepLookup()} 
                          disabled={isLoadingCep}
                          className="h-12 px-8 bg-[#DC2626] hover:bg-red-700 text-white font-bold uppercase text-[11px] tracking-widest rounded-lg"
                        >
                          {isLoadingCep ? <Loader2 className="size-4 animate-spin" /> : "BUSCAR CEP"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Retirar */}
                <section className="space-y-4">
                  <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400">IR ATÉ O ESTABELECIMENTO</h2>
                  <button 
                    onClick={() => {
                      updateCheckout({ deliveryType: 'retirada', deliveryFee: 0 })
                      handleNext('schedule')
                    }}
                    className="w-full bg-white p-6 rounded-xl border border-slate-100 hover:border-[#DC2626] transition-all text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-lg border border-slate-100 overflow-hidden shrink-0">
                        <img src={company.logo_url} className="size-full object-cover" alt="Logo" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{company.name}</p>
                        <p className="text-[11px] text-slate-400">{company.address || "Endereço da loja"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-[#DC2626]">
                       Selecionar <ChevronRight className="size-4" />
                    </div>
                  </button>
                </section>
              </motion.div>
            )}

            {step === 'address-form' && checkout.address && (
              <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">CEP</Label>
                      <Input value={checkout.address.cep || ""} disabled className="h-12 bg-slate-50 border-slate-100 text-sm opacity-60" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">LOGRADOURO</Label>
                      <Input value={checkout.address.street || ""} disabled className="h-12 bg-slate-50 border-slate-100 text-sm opacity-60" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">BAIRRO</Label>
                      <Input value={checkout.address.neighborhood || ""} disabled className="h-12 bg-slate-50 border-slate-100 text-sm opacity-60" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-400 ml-1">CIDADE/UF</Label>
                      <Input value={`${checkout.address.city || ""} - ${checkout.address.state || ""}`} disabled className="h-12 bg-slate-50 border-slate-100 text-sm opacity-60" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-900 ml-1">NÚMERO</Label>
                      <Input 
                        id="address-number"
                        placeholder="Digite o número" 
                        value={checkout.address.number || ""} 
                        onChange={e => updateCheckout({ address: { ...checkout.address!, number: e.target.value } })}
                        className="h-12 border-slate-200 focus:border-red-500 transition-all text-sm" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-900 ml-1">COMPLEMENTO</Label>
                      <Input 
                        placeholder="Ex: Apto 101" 
                        value={checkout.address.complement || ""} 
                        onChange={e => updateCheckout({ address: { ...checkout.address!, complement: e.target.value } })}
                        className="h-12 border-slate-200 focus:border-red-500 transition-all text-sm" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase text-slate-900 ml-1">PONTO DE REFERÊNCIA</Label>
                    <Input 
                      placeholder="Ex: Ao lado do mercado" 
                      value={checkout.address.reference || ""} 
                      onChange={e => updateCheckout({ address: { ...checkout.address!, reference: e.target.value } })}
                      className="h-12 border-slate-200 focus:border-red-500 transition-all text-sm" 
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAddressSubmit}
                  disabled={!checkout.address.number || isGeocoding}
                  className={cn(
                    "w-full h-14 font-bold uppercase tracking-[0.2em] text-xs rounded-lg transition-all flex items-center justify-center gap-2",
                    checkout.address.number ? "bg-[#DC2626] text-white" : "bg-red-200 text-white cursor-not-allowed"
                  )}
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      PROCESSANDO...
                    </>
                  ) : (
                    "CONTINUAR"
                  )}
                </Button>
              </motion.div>
            )}

            {step === 'schedule' && (
              <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-red-50 text-[#DC2626] flex items-center justify-center shrink-0">
                      <MapPin className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                        {checkout.deliveryType === 'delivery' ? 'ENTREGAR NO ENDEREÇO' : 
                         checkout.deliveryType === 'retirada' ? 'RETIRADA NO ESTABELECIMENTO' : 'CONSUMO NO LOCAL'}
                      </p>
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {checkout.deliveryType === 'delivery' 
                          ? `${checkout.address?.street}, ${checkout.address?.number} / ${checkout.address?.neighborhood} / ${checkout.address?.city}, ${checkout.address?.state} - ${checkout.address?.cep}` 
                          : `${company.name} - ${company.address}`}
                      </p>
                      <p className="text-xs text-slate-500 font-bold mt-1">Taxa de entrega: {checkout.deliveryFee > 0 ? `R$ ${checkout.deliveryFee.toFixed(2)}` : "GRÁTIS"}</p>
                    </div>
                    <button onClick={() => setStep('delivery-options')} className="text-[11px] font-bold text-red-600 hover:underline shrink-0">Alterar entrega ou endereço</button>
                  </div>

                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                        onClick={() => updateCheckout({ scheduleType: 'now' })}
                        className={cn(
                          "p-6 rounded-xl border-2 transition-all text-left flex flex-col gap-2",
                          checkout.scheduleType === 'now' ? "border-[#DC2626] bg-red-50/30" : "border-slate-100 bg-white"
                        )}
                      >
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                             <Clock className={cn("size-5", checkout.scheduleType === 'now' ? "text-[#DC2626]" : "text-slate-400")} />
                             <span className="font-bold text-slate-900 text-sm">AGORA</span>
                           </div>
                           <div className={cn("size-5 rounded-full border-2 flex items-center justify-center", checkout.scheduleType === 'now' ? "border-[#DC2626]" : "border-slate-200")}>
                             {checkout.scheduleType === 'now' && <div className="size-2.5 rounded-full bg-[#DC2626]" />}
                           </div>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ENTREGA EM {checkout.estimatedTime}</p>
                      </button>

                      <button 
                        onClick={() => updateCheckout({ scheduleType: 'scheduled' })}
                        className={cn(
                          "p-6 rounded-xl border-2 transition-all text-left flex flex-col gap-2",
                          checkout.scheduleType === 'scheduled' ? "border-[#DC2626] bg-red-50/30" : "border-slate-100 bg-white opacity-60"
                        )}
                      >
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-2">
                             <Calendar className={cn("size-5", checkout.scheduleType === 'scheduled' ? "text-[#DC2626]" : "text-slate-400")} />
                             <span className="font-bold text-slate-900 text-sm">AGENDAR</span>
                           </div>
                           <div className={cn("size-5 rounded-full border-2 flex items-center justify-center", checkout.scheduleType === 'scheduled' ? "border-[#DC2626]" : "border-slate-200")}>
                             {checkout.scheduleType === 'scheduled' && <div className="size-2.5 rounded-full bg-[#DC2626]" />}
                           </div>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">SELECIONAR HORÁRIO</p>
                      </button>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleNext('payment')}
                  className="w-full h-14 bg-[#DC2626] hover:bg-red-700 text-white font-bold uppercase tracking-[0.2em] text-xs rounded-lg"
                >
                  CONTINUAR
                </Button>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div key="step4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                   <div className="flex border-b border-slate-100">
                      <button 
                        onClick={() => updateCheckout({ paymentTiming: 'delivery' })}
                        className={cn(
                          "flex-1 py-4 font-bold uppercase text-[11px] tracking-widest transition-all relative",
                          checkout.paymentTiming === 'delivery' ? "text-[#DC2626]" : "text-slate-400"
                        )}
                      >
                        PAGUE NA ENTREGA
                        {checkout.paymentTiming === 'delivery' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DC2626]" />}
                      </button>
                      <button 
                        onClick={() => updateCheckout({ paymentTiming: 'app' })}
                        className={cn(
                          "flex-1 py-4 font-bold uppercase text-[11px] tracking-widest transition-all relative",
                          checkout.paymentTiming === 'app' ? "text-[#DC2626]" : "text-slate-400"
                        )}
                      >
                        PAGUE PELO APP
                        {checkout.paymentTiming === 'app' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#DC2626]" />}
                      </button>
                   </div>

                   <div className="p-6 space-y-3">
                      {checkout.paymentTiming === 'delivery' ? (
                        <div className="space-y-2">
                           {[
                             { id: 'cash', label: 'Dinheiro', icon: <DollarSign className="size-5" /> },
                             { id: 'credit', label: 'Cartão de Crédito', icon: <CreditCard className="size-5" /> },
                             { id: 'debit', label: 'Cartão de Débito', icon: <CreditCard className="size-5" /> }
                           ].map(opt => (
                             <button
                               key={opt.id}
                               onClick={() => {
                                 updateCheckout({ paymentMethod: opt.id as any })
                                 if (opt.id === 'cash') setShowCashModal(true)
                               }}
                               className={cn(
                                 "w-full flex items-center gap-4 p-4 rounded-lg border transition-all",
                                 checkout.paymentMethod === opt.id ? "border-[#DC2626] bg-red-50/20" : "border-slate-50 bg-white"
                               )}
                             >
                               <div className={cn("size-5 rounded-full border-2 flex items-center justify-center", checkout.paymentMethod === opt.id ? "border-[#DC2626]" : "border-slate-200")}>
                                 {checkout.paymentMethod === opt.id && <div className="size-2.5 rounded-full bg-[#DC2626]" />}
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="text-slate-400">{opt.icon}</div>
                                  <span className="font-medium text-slate-900 text-sm">{opt.label}</span>
                               </div>
                             </button>
                           ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                           {[
                             { id: 'pix', label: 'PIX INSTANTÂNEO', icon: <Smartphone className="size-5" /> },
                             { id: 'credit_app', label: 'CARTÃO DE CRÉDITO ONLINE', icon: <CreditCard className="size-5" /> },
                             { id: 'debit_app', label: 'CARTÃO DE DÉBITO ONLINE', icon: <CreditCard className="size-5" /> },
                             { id: 'voucher_app', label: 'VALE REFEIÇÃO / VOUCHER', icon: <CreditCard className="size-5" /> }
                           ].map(opt => (
                             <button
                               key={opt.id}
                               onClick={() => updateCheckout({ paymentMethod: opt.id as any })}
                               className={cn(
                                 "w-full flex items-center gap-4 p-4 rounded-lg border transition-all",
                                 checkout.paymentMethod === opt.id ? "border-[#DC2626] bg-red-50/20" : "border-slate-50 bg-white"
                               )}
                             >
                               <div className={cn("size-5 rounded-full border-2 flex items-center justify-center", checkout.paymentMethod === opt.id ? "border-[#DC2626]" : "border-slate-200")}>
                                 {checkout.paymentMethod === opt.id && <div className="size-2.5 rounded-full bg-[#DC2626]" />}
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="text-slate-400">{opt.icon}</div>
                                  <span className="font-medium text-slate-900 text-sm">{opt.label}</span>
                                </div>
                             </button>
                           ))}
                        </div>
                      )}

                      {/* Render Inline Card Form if a card payment method is selected */}
                      {['credit_app', 'debit_app', 'voucher_app'].includes(checkout.paymentMethod) && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-6 border-t border-slate-100 pt-6 space-y-4 px-4 bg-slate-50/50 p-6 rounded-2xl border"
                        >
                          <div className="text-center mb-4">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                               Preencha os dados do seu cartão abaixo
                             </p>
                          </div>
                          
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nome no Cartão</Label>
                            <Input 
                              placeholder="NOME DO TITULAR IGUAL NO CARTÃO"
                              value={cardFields.name}
                              onChange={e => {
                                setCardFields({ ...cardFields, name: e.target.value.toUpperCase() })
                              }}
                              className="h-12 bg-white border-slate-200 focus:border-red-500 font-bold uppercase text-xs"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Número do Cartão</Label>
                            <div className="relative">
                              <Input 
                                placeholder="0000 0000 0000 0000"
                                value={cardFields.number}
                                onChange={e => {
                                  const formatted = formatCardNumber(e.target.value)
                                  setCardFields({ ...cardFields, number: formatted })
                                }}
                                className="h-12 bg-white border-slate-200 focus:border-red-500 font-bold text-sm pr-16"
                              />
                              {getCardBrand(cardFields.number) !== 'unknown' && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded">
                                  {getCardBrand(cardFields.number)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Validade</Label>
                              <Input 
                                placeholder="MM/AA"
                                value={cardFields.expiry}
                                onChange={e => {
                                  const formatted = formatExpiry(e.target.value)
                                  setCardFields({ ...cardFields, expiry: formatted })
                                }}
                                className="h-12 bg-white border-slate-200 focus:border-red-500 font-bold text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">CVV</Label>
                              <Input 
                                placeholder="123"
                                value={cardFields.cvv}
                                onChange={e => {
                                  const clean = e.target.value.replace(/\D/g, "").substring(0, 4)
                                  setCardFields({ ...cardFields, cvv: clean })
                                }}
                                className="h-12 bg-white border-slate-200 focus:border-red-500 font-bold text-sm"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">CPF do Titular</Label>
                            <Input 
                              placeholder="000.000.000-00"
                              value={cardFields.cpf}
                              onChange={e => {
                                const formatted = formatCPF(e.target.value)
                                setCardFields({ ...cardFields, cpf: formatted })
                              }}
                              className="h-12 bg-white border-slate-200 focus:border-red-500 font-bold text-sm"
                            />
                          </div>

                          {checkout.paymentMethod === 'credit_app' && (
                            <div className="space-y-1.5">
                              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Parcelamento</Label>
                              <select 
                                value={cardFields.installments}
                                onChange={e => setCardFields({ ...cardFields, installments: e.target.value })}
                                className="w-full h-12 rounded-lg border border-slate-200 bg-white px-3 font-bold text-xs focus:border-red-500 focus:outline-none"
                              >
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                                  <option key={n} value={n.toString()}>
                                    {n}x de R$ {(checkout.total / n).toFixed(2)} sem juros
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </motion.div>
                      )}
                   </div>
                </div>

                <Button 
                  onClick={() => handleNext('confirm')}
                  className="w-full h-14 bg-[#DC2626] hover:bg-red-700 text-white font-bold uppercase tracking-[0.2em] text-xs rounded-lg"
                >
                  CONTINUAR
                </Button>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div key="step5" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-8">
                  {/* Sacola */}
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">MINHA SACOLA ({checkout.items.length})</h3>
                        <button onClick={() => router.push(`/menu/${company.menu_slug}`)} className="text-[10px] font-bold uppercase text-slate-400 hover:text-red-600">VER E EDITAR</button>
                     </div>
                     <div className="space-y-3">
                        {checkout.items.map(item => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700">{item.quantity}x {item.name}</span>
                              {item.variation && <span className="text-[10px] text-slate-400 uppercase">1x {item.variation.name}</span>}
                            </div>
                            <span className="font-medium text-slate-900">R$ {item.totalItemPrice.toFixed(2)}</span>
                          </div>
                        ))}
                        <button onClick={() => router.push(`/menu/${company.menu_slug}`)} className="text-[11px] font-bold uppercase text-red-600 flex items-center gap-1 pt-2">
                           + ADICIONAR MAIS ITENS
                        </button>
                     </div>
                  </div>

                  {/* Entrega */}
                  <div className="pt-8 border-t border-slate-50 space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">ENTREGA</h3>
                        <button onClick={() => setStep('delivery-options')} className="text-[10px] font-bold uppercase text-slate-400 hover:text-red-600">TROCAR</button>
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">Agora ({checkout.estimatedTime})</p>
                        <p className="text-xs text-slate-500">
                          {checkout.deliveryType === 'delivery' 
                            ? `${checkout.address?.street}, ${checkout.address?.number} / ${checkout.address?.neighborhood} / ${checkout.address?.city}, ${checkout.address?.state} - ${checkout.address?.cep}`
                            : checkout.deliveryType === 'retirada' ? "Retirada no estabelecimento" : "No local / balcão"}
                        </p>
                     </div>
                  </div>

                  {/* Pagamento */}
                  <div className="pt-8 border-t border-slate-50 space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">PAGAMENTO</h3>
                        <button onClick={() => setStep('payment')} className="text-[10px] font-bold uppercase text-slate-400 hover:text-red-600">TROCAR</button>
                     </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-900">{checkout.paymentTiming === 'delivery' ? "Pague na Entrega" : "Pago Pelo App"}</p>
                        <p className="text-xs text-slate-500 capitalize">{checkout.paymentMethod} {checkout.changeFor && `(Troco para: R$ ${checkout.changeFor})`}</p>
                     </div>
                  </div>
                </div>

                {/* Campos Finais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-900">CÓDIGO DO CUPOM</Label>
                      <div className="flex gap-2">
                         <Input placeholder="Ex: DOCE10" className="h-12 bg-white border-slate-200 text-sm" />
                         <Button className="h-12 bg-[#DC2626] text-white font-bold uppercase text-[10px] tracking-widest rounded-lg">APLICAR</Button>
                      </div>
                   </div>
                   <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase text-slate-900">TELEFONE</Label>
                       <Input 
                          placeholder="(44) 99999-9999" 
                          className="h-12 bg-white border-slate-200 text-sm"
                          value={checkout.phone || ""}
                          onChange={e => updateCheckout({ phone: formatPhone(e.target.value) })}
                       />
                       {customerNotFound && (
                          <p className="text-[11px] font-bold text-amber-600 mt-1">
                            ⚠️ Cliente não encontrado. Complete os dados para realizar o cadastro.
                          </p>
                       )}
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase text-slate-900">NOME</Label>
                       <Input 
                          placeholder="Ex: João" 
                          className="h-12 bg-white border-slate-200 text-sm font-semibold"
                          value={firstName}
                          onChange={e => setFirstName(e.target.value)}
                       />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-[10px] font-bold uppercase text-slate-900">SOBRENOME</Label>
                       <Input 
                          placeholder="Ex: da Silva" 
                          className="h-12 bg-white border-slate-200 text-sm font-semibold"
                          value={lastName}
                          onChange={e => setLastName(e.target.value)}
                       />
                    </div>
                   <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-900">CPF / CNPJ</Label>
                      <Input 
                         placeholder="000.000.000-00" 
                         className="h-12 bg-white border-slate-200 text-sm"
                         value={checkout.taxId || ""}
                         onChange={e => updateCheckout({ taxId: formatTaxId(e.target.value) })}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-900">OBSERVAÇÃO</Label>
                      <Input 
                         placeholder="Ex: Tocar o interfone" 
                         className="h-12 bg-white border-slate-200 text-sm"
                         value={checkout.notes || ""}
                         onChange={e => updateCheckout({ notes: e.target.value })}
                      />
                   </div>
                </div>

                {/* HISTÓRICO DE PEDIDOS */}
                {currentCustomer?.orders && currentCustomer.orders.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4 mb-6">
                     <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Histórico de Pedidos</h3>
                     <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-2">
                       {currentCustomer.orders.map((o: any) => (
                         <div key={o.id} className="py-2.5 flex justify-between text-xs items-center">
                           <div className="flex flex-col gap-0.5">
                             <span className="font-bold text-slate-800">Pedido #{o.id.slice(-4).toUpperCase()}</span>
                             <span className="text-slate-400 font-medium">{o.created_at ? format(new Date(o.created_at), "dd/MM/yyyy HH:mm") : ""}</span>
                           </div>
                           <div className="text-right">
                             <span className="font-black text-slate-900">R$ {Number(o.total).toFixed(2)}</span>
                             <span className="block text-[10px] font-bold text-slate-400 capitalize">{o.status}</span>
                           </div>
                         </div>
                       ))}
                     </div>
                  </div>
                )}

                <Button 
                  onClick={handleOrderSubmit}
                  disabled={isSubmitting}
                  className="w-full h-16 bg-[#DC2626] hover:bg-red-700 text-white font-bold uppercase tracking-[0.3em] text-sm rounded-lg shadow-xl shadow-red-100 transition-all active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="size-6 animate-spin" /> : "ENVIAR PEDIDO"}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN: SUMMARY */}
        <aside className="lg:col-span-4 h-fit lg:sticky lg:top-24">
           <div className="bg-white rounded-xl border border-slate-100 p-8 space-y-6">
              <h3 className="text-base font-semibold text-slate-800">Resumo</h3>

              <div className="space-y-4">
                 <div className="flex justify-between text-sm text-slate-600">
                    <span>{checkout.items.length} item(s)</span>
                    <span>R$ {checkout.subtotal.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-sm text-slate-600">
                    <span>Taxa de entrega</span>
                    <span>{checkout.deliveryFee > 0 ? `R$ ${checkout.deliveryFee.toFixed(2)}` : "GRÁTIS"}</span>
                 </div>

                 {checkout.subtotal < 50 && (
                   <div className="bg-[#DCFCE7] p-4 rounded-lg border border-[#BBF7D0]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#16A34A] text-center">
                        ADICIONE R$ {(50 - checkout.subtotal).toFixed(2)} EM PRODUTOS E GANHE <span className="underline">ENTREGA GRÁTIS</span>
                      </p>
                   </div>
                 )}

                 <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-base font-bold text-slate-900">Total</span>
                    <span className="text-xl font-bold text-slate-900">R$ {checkout.total.toFixed(2)}</span>
                 </div>
              </div>

              {step === 'confirm' && (
                <Button 
                  onClick={handleOrderSubmit}
                  disabled={isSubmitting}
                  className="w-full h-14 bg-[#DC2626] hover:bg-red-700 text-white font-bold uppercase tracking-[0.2em] text-xs rounded-lg"
                >
                  ENVIAR PEDIDO
                </Button>
              )}
           </div>
        </aside>
      </main>

      {/* MODALS */}
      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className="p-0 overflow-hidden rounded-2xl max-w-md">
           <div className="h-64 bg-slate-100 flex items-center justify-center relative">
              <MapIcon className="size-12 text-red-500 animate-pulse" />
              <div className="absolute inset-0 bg-slate-900/5 pointer-events-none" />
           </div>
           <div className="p-6 space-y-6">
              <div className="text-center space-y-2">
                 <DialogTitle className="text-lg font-bold text-slate-900">A localização está correta?</DialogTitle>
                 <DialogDescription className="text-xs text-slate-500">
                   {checkout.address?.street}, {checkout.address?.number} - {checkout.address?.neighborhood}, {checkout.address?.city} - {checkout.address?.state}
                 </DialogDescription>
              </div>
              <div className="flex gap-4">
                 <Button variant="outline" onClick={() => setShowMapModal(false)} className="flex-1 h-12 rounded-lg font-bold uppercase text-[10px] tracking-widest">AJUSTAR</Button>
                 <Button 
                   onClick={() => {
                     setShowMapModal(false)
                     updateCheckout({ deliveryFee: 11.99 }) // Simulating Sweet Savory fee
                     handleNext('schedule')
                   }} 
                   className="flex-1 h-12 bg-[#DC2626] text-white font-bold uppercase text-[10px] tracking-widest rounded-lg"
                 >
                   CONFIRMAR
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
        <DialogContent className="p-8 rounded-3xl max-w-sm">
           <DialogHeader>
              <DialogTitle className="text-xl font-black italic uppercase tracking-tighter text-slate-900 text-center">Precisa de troco?</DialogTitle>
           </DialogHeader>
           <div className="space-y-6 pt-4">
              <div className="text-center">
                 <p className="text-sm text-slate-500 font-medium">Total do pedido: <span className="text-slate-900 font-bold">R$ {checkout.total.toFixed(2)}</span></p>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Troco para quanto?</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                  <Input 
                    type="number" 
                    placeholder={checkout.total.toFixed(2)}
                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 text-xl font-bold text-center pl-10 focus:border-red-500 transition-all"
                    value={checkout.changeFor || ""}
                    onChange={e => updateCheckout({ changeFor: e.target.value })}
                  />
                </div>
              </div>

              {/* Bug 5: Real-time calculation */}
              {checkout.changeFor && parseFloat(checkout.changeFor) > checkout.total && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                   <p className="text-green-700 font-bold text-sm">Troco: R$ {(parseFloat(checkout.changeFor) - checkout.total).toFixed(2)}</p>
                </motion.div>
              )}
              {checkout.changeFor && parseFloat(checkout.changeFor) > 0 && parseFloat(checkout.changeFor) < checkout.total && (
                <p className="text-center text-[10px] font-bold text-red-500 uppercase tracking-widest">⚠️ Valor menor que o total</p>
              )}

              <div className="flex gap-3">
                 <Button 
                   variant="outline" 
                   onClick={() => {
                     updateCheckout({ changeFor: undefined })
                     setShowCashModal(false)
                   }} 
                   className="flex-1 h-12 rounded-2xl font-black uppercase italic tracking-widest text-[10px] border-slate-100 text-slate-400"
                 >
                   NÃO PRECISO
                 </Button>
                 <Button 
                   onClick={() => setShowCashModal(false)} 
                   disabled={!!checkout.changeFor && parseFloat(checkout.changeFor) < checkout.total}
                   className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white font-black uppercase italic tracking-widest text-[10px] rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95"
                 >
                   CONTINUAR
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      <RegistrationModal 
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        phone={checkout.phone || ""}
        storeId={company?.id}
        onSuccess={(customer) => {
          setCurrentCustomer(customer)
          setCustomerNotFound(false)

          const fullName = customer.name || ""
          const firstSpaceIdx = fullName.indexOf(" ")
          if (firstSpaceIdx !== -1) {
            setFirstName(fullName.substring(0, firstSpaceIdx))
            setLastName(fullName.substring(firstSpaceIdx + 1))
          } else {
            setFirstName(fullName)
            setLastName("")
          }

          const hasRootAddress = customer.cep || customer.address
          const rootAddr = hasRootAddress ? {
            cep: customer.cep || "",
            street: customer.address || "",
            number: customer.number || "",
            complement: customer.complement || "",
            neighborhood: customer.neighborhood || "",
            city: customer.city || "",
            state: customer.state || "",
            reference: customer.reference_point || "",
          } : null

          const firstAddr = (customer.addresses && customer.addresses.length > 0) ? {
            cep: customer.addresses[0].zip || customer.addresses[0].cep || "",
            street: customer.addresses[0].street || customer.addresses[0].address || customer.addresses[0].rua || "",
            number: customer.addresses[0].number || customer.addresses[0].numero || "",
            complement: customer.addresses[0].complement || "",
            neighborhood: customer.addresses[0].neighborhood || customer.addresses[0].bairro || "",
            city: customer.addresses[0].city || customer.addresses[0].cidade || "",
            state: customer.addresses[0].state || "",
            reference: customer.addresses[0].reference || customer.addresses[0].reference_point || "",
          } : null

          updateCheckout({
            taxId: customer.cpf || customer.cpf_cnpj || checkout.taxId,
            address: rootAddr || firstAddr || checkout.address
          })
        }}
      />
    </div>
  )
}
export default function CarrinhoPage() {

 return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center flex-col gap-2 bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Carregando checkout...</p>
      </div>

    }>
      <CarrinhoContent />
    </Suspense>
  )
}