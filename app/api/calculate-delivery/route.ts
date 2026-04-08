import { NextResponse } from "next/server";

// Fallback coordinates (center of Cascavel, PR as example, similar to STORE_LAT/LNG in user snippet)
const STORE_LAT = parseFloat(process.env.STORE_LAT || "-24.9555");
const STORE_LNG = parseFloat(process.env.STORE_LNG || "-53.4552");

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth's radius in km

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function POST(req: Request) {
  try {
    const { lat, lng } = await req.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude e longitude são obrigatórias" }, { status: 400 });
    }

    const distance = calcDistance(STORE_LAT, STORE_LNG, lat, lng);

    // Limit delivery distance (e.g., 100km for testing)
    if (distance > 100) {
      return NextResponse.json({ 
        error: "Endereço muito distante para entrega. Por favor, entre em contato via WhatsApp." 
      }, { status: 400 });
    }

    // Dynamic Fee Rules (Professionalized)
    let fee = 0;
    if (distance <= 1) fee = 0; // Free for very close
    else if (distance <= 3) fee = 5.0;
    else if (distance <= 5) fee = 8.0;
    else if (distance <= 10) fee = 15.0;
    else if (distance <= 15) fee = 22.0;
    else fee = 30.0;

    // Realistic time: Base 15m + 5m per km + 10m buffer
    const time = Math.round(15 + (distance * 5) + 10); 

    return NextResponse.json({
      distance: parseFloat(distance.toFixed(2)),
      fee,
      time: `${time - 5}-${time + 5}`, // Return a range (e.g., "30-40")
      store: { lat: STORE_LAT, lng: STORE_LNG }
    });
  } catch (error) {
    console.error("Delivery calculation error:", error);
    return NextResponse.json({ error: "Erro interno ao calcular entrega" }, { status: 500 });
  }
}
