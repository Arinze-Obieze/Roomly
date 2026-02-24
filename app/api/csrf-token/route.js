import { generateCSRFToken } from '@/core/utils/csrf';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const csrfToken = await generateCSRFToken(request);
    return NextResponse.json({ csrfToken });
  } catch (error) {
    console.error('[CSRF Token] Error:', error);
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 });
  }
}
