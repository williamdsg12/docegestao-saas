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

    // Dynamic Fee Rules (Example)
    let fee = 0;
    if (distance <= 2) fee = 4.0;
    else if (distance <= 5) fee = 7.0;
    else if (distance <= 10) fee = 12.0;
    else fee = 18.0;

    const time = Math.round(distance * 4 + 15); // Estimated time: 4 min/km + 15 min base

    return NextResponse.json({
      distance: parseFloat(distance.toFixed(2)),
      fee,
      time,
      store: { lat: STORE_LAT, lng: STORE_LNG }
    });
  } catch (error) {
    console.error("Delivery calculation error:", error);
    return NextResponse.json({ error: "Erro ao calcular entrega" }, { status: 500 });
  }
}
