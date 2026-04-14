import { NextResponse } from "next/server";

// Dynamic Store Coordinates (Example)
const STORE_LAT = parseFloat(process.env.STORE_LAT || "-24.9555");
const STORE_LNG = parseFloat(process.env.STORE_LNG || "-53.4552");
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

// City Multipliers (iFood Master Level)
const CITY_MULTIPLIERS: Record<string, number> = {
  "São Paulo": 1.25,
  "Rio de Janeiro": 1.20,
  "Curitiba": 1.10,
  "Cascavel": 1.0, // Base city
};

export async function POST(req: Request) {
  try {
    const { lat, lng, city } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude e longitude são obrigatórias" }, { status: 400 });
    }

    let distanceKm = 0;
    let durationText = "30-45 min";
    let durationValue = 35; // default in minutes

    // 1. Google Distance Matrix (Real Route)
    if (GOOGLE_KEY) {
      try {
        const origin = `${STORE_LAT},${STORE_LNG}`;
        const destination = `${lat},${lng}`;
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&key=${GOOGLE_KEY}&mode=driving`;
        
        console.log(`Calculating route: ${origin} -> ${destination}`);
        
        const gRes = await fetch(url);
        const gData = await gRes.json();

        if (gData.rows?.[0]?.elements?.[0]?.status === "OK") {
           const element = gData.rows[0].elements[0];
           distanceKm = element.distance.value / 1000; // Meters to KM
           durationText = element.duration.text;
           durationValue = Math.ceil(element.duration.value / 60);
           console.log(`Route Found: ${distanceKm}km`);
        } else {
           console.warn("Distance Matrix status not OK, falling back to Haversine. Status:", gData.rows?.[0]?.elements?.[0]?.status);
           distanceKm = calcHaversine(STORE_LAT, STORE_LNG, lat, lng);
        }
      } catch (e) {
        console.error("GDM API Error:", e);
        distanceKm = calcHaversine(STORE_LAT, STORE_LNG, lat, lng);
      }
    } else {
      distanceKm = calcHaversine(STORE_LAT, STORE_LNG, lat, lng);
    }

    // 2. Max distance check (increased to 100km for testing)
    const MAX_KM = 100;
    if (distanceKm > MAX_KM) {
      return NextResponse.json({ 
        error: `Endereço a ${distanceKm.toFixed(1)}km está fora do raio de entrega (${MAX_KM}km).`,
        distance: distanceKm
      }, { status: 400 });
    }

    // 3. iFood ZONES (Override)
    // Se existir uma zona definida para essa distância, usa o valor fixo da zona.
    const ZONAS = [
      { ate: 2, valor: 6.00 },
      { ate: 5, valor: 9.00 },
      { ate: 8, valor: 13.00 },
      { ate: 12, valor: 18.00 }
    ];

    let fee = 0;
    const zonaEncontrada = ZONAS.find(z => distanceKm <= z.ate);
    
    if (zonaEncontrada) {
        fee = zonaEncontrada.valor;
    } else {
        // Fallback: Base + Extra KM
        const baseFee = 7.50;
        const baseKm = 4.0;
        const perKmExtra = 1.50;
        fee = baseFee + (Math.ceil(Math.max(0, distanceKm - baseKm)) * perKmExtra);
    }

    // 4. Multiplicadores Dinâmicos (Estilo iFood)
    const now = new Date();
    const hora = now.getHours();
    let multiplier = CITY_MULTIPLIERS[city] || 1.0;

    // Horário de Pico (18h-21h)
    if (hora >= 18 && hora <= 21) {
        multiplier *= 1.2;
    }

    // Noite (acima de 22h)
    if (hora >= 22 || hora <= 5) {
        multiplier *= 1.1;
    }

    fee = fee * multiplier;

    return NextResponse.json({
      distance: parseFloat(distanceKm.toFixed(2)),
      fee: parseFloat(fee.toFixed(2)),
      time: durationText,
      durationMinutes: durationValue,
      isRealRoute: !!GOOGLE_KEY
    });

  } catch (error) {
    console.error("Delivery calculation error:", error);
    return NextResponse.json({ error: "Erro interno ao calcular entrega" }, { status: 500 });
  }
}

function calcHaversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
