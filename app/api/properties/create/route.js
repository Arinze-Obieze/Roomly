import { NextResponse } from 'next/server';
import { handleCreateProperty } from '@/core/services/properties/create-property.service';
import { validateCSRFRequest } from '@/core/utils/csrf';

export const runtime = 'nodejs';
export const bodySizeLimit = '20mb';

export async function POST(req) {
  const csrfValidation = await validateCSRFRequest(req);
  if (!csrfValidation.valid) {
    return NextResponse.json({ error: csrfValidation.error }, { status: 403 });
  }

  return handleCreateProperty(req);
}

export function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
