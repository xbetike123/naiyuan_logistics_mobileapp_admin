// src/app/api/admin-verify/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ valid: false, message: 'No token provided' }, { status: 401 });
    }

    const apiBase = process.env.API_URL || 'http://localhost:3000';
    const candidates = [
      '/api/v1/admin/dashboard',
      '/api/admin/dashboard',
      '/admin/dashboard',
    ];

    for (const path of candidates) {
      const res = await fetch(`${apiBase}${path}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        return NextResponse.json({ valid: true });
      }

      if (res.status !== 404) {
        const body = await res.json().catch(() => ({}));
        return NextResponse.json(
          { valid: false, message: body.message || 'Invalid token' },
          { status: res.status === 401 || res.status === 403 ? 401 : res.status },
        );
      }
    }

    return NextResponse.json(
      { valid: false, message: 'Admin dashboard route is not available on backend deployment' },
      { status: 502 },
    );
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, message: err.message || 'Auth verification failed' },
      { status: 502 },
    );
  }
}
