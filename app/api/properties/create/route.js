import { NextResponse } from 'next/server';
import { handleCreateProperty } from '@/core/services/properties/create-property.service';

export const runtime = 'nodejs';
export const bodySizeLimit = '20mb';

export async function POST(req) {
  return handleCreateProperty(req);
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
