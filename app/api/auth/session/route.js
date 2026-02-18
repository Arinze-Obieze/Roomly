import { AuthService } from '@/core/services/auth.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await AuthService.getSession();

    if (!user) {
      return NextResponse.json(
        { user: null, authenticated: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      user,
      authenticated: true,
    });
  } catch (err) {
    console.error('Session check error:', err);
    return NextResponse.json(
      { user: null, authenticated: false },
      { status: 200 }
    );
  }
}
