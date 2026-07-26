import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-admin'

// POST /api/delivery/chat
export async function POST(req: Request) {
  try {
    const { orderId, senderId, senderType, message } = await req.json()

    if (!orderId || !senderType || !message) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('delivery_messages')
      .insert({
        order_id: orderId,
        sender_id: senderId || null,
        sender_type: senderType,
        message: message
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting message:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Chat POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET /api/delivery/chat?orderId=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('delivery_messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
