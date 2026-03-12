import { NextResponse } from 'next/server';
import { logoutWhatsApp } from '@/lib/whatsappClient';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await logoutWhatsApp();
    return NextResponse.json({ success: true, message: 'WhatsApp Client stopped' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to stop' }, { status: 500 });
  }
}
