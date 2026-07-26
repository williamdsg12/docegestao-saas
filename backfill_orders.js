const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase env vars (URL or SERVICE_ROLE_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function geocodeAddress(address) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || 
                 process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 
                 process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 
                 "";

  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        return {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          formatted: result.formatted_address,
          accuracy: result.geometry.location_type || 'google_geocoded',
          api: 'google'
        };
      }
    } catch (e) {
      console.error("Google maps geocode failed:", e);
    }
  }

  // Fallback to Nominatim (wait 1 second between requests to respect OpenStreetMap rate limits)
  await new Promise(r => setTimeout(r, 1000));
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'DoceGestaoGeocodingBackfill/1.0'
      }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        formatted: data[0].display_name,
        accuracy: 'nominatim_geocoded',
        api: 'nominatim'
      };
    }
  } catch (e) {
    console.error("Nominatim geocode failed:", e);
  }

  return null;
}

async function runBackfill() {
  console.log("Starting backfill for orders with missing coordinates...");

  // 1. Fetch all delivery orders with missing coordinates, joining their structured address record
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, 
      order_type, 
      address_id,
      addresses!address_id(street, number, neighborhood, city, state, zip)
    `)
    .eq('order_type', 'delivery')
    .or('latitude.is.null,longitude.is.null');

  if (error) {
    console.error("Error fetching orders:", error.message);
    process.exit(1);
  }

  console.log(`Found ${orders.length} orders to geocode.`);

  let successCount = 0;
  let failCount = 0;

  for (const order of orders) {
    const addr = order.addresses;
    if (!addr) {
      console.log(`Skipping order ${order.id}: no structured address record associated.`);
      failCount++;
      continue;
    }

    const addressStr = `${addr.street || ''} ${addr.number || ''}, ${addr.neighborhood || ''}, ${addr.city || ''} ${addr.state || ''}, ${addr.zip || ''}, Brasil`.replace(/\s+/g, ' ').trim();
    console.log(`Geocoding order ${order.id} | Address: "${addressStr}"`);

    const result = await geocodeAddress(addressStr);

    if (result) {
      // Update order coordinates, formatted address, accuracy, and geocoded_at fields
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          latitude: result.lat,
          longitude: result.lng,
          formatted_address: result.formatted,
          location_accuracy: result.accuracy,
          geocoded_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateError) {
        console.error(`Error updating order ${order.id}:`, updateError.message);
        failCount++;
        continue;
      }

      // Insert log entry for monitoring audit
      const { error: logError } = await supabase
        .from('geocoding_logs')
        .insert({
          order_id: order.id,
          input_address: addressStr,
          lat: result.lat,
          lng: result.lng,
          api_used: result.api,
          accuracy: result.accuracy
        });

      if (logError) {
        console.warn(`Warning: failed to insert log for order ${order.id}:`, logError.message);
      }

      console.log(`✅ Order ${order.id} geocoded successfully via ${result.api} (accuracy: ${result.accuracy}) -> [${result.lat}, ${result.lng}]`);
      successCount++;
    } else {
      console.error(`❌ Failed to geocode order ${order.id}.`);
      failCount++;
    }
  }

  console.log("\n==================================================");
  console.log("BACKFILL COMPLETADO:");
  console.log(`Total processados: ${orders.length}`);
  console.log(`Sucesso: ${successCount}`);
  console.log(`Falhas: ${failCount}`);
  console.log("==================================================\n");
}

runBackfill();
