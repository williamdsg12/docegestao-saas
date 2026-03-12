export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getWhatsAppStatus } from '@/lib/whatsappClient';

export async function GET() {
  const status = getWhatsAppStatus();
  return NextResponse.json(status);
}
