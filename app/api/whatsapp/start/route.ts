import { NextResponse } from 'next/server';
import { getWhatsAppClient } from '@/lib/whatsappClient';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    getWhatsAppClient(); // This will initialize and attach event listeners if not already
    return NextResponse.json({ success: true, message: 'WhatsApp Client start requested' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to start' }, { status: 500 });
  }
}
