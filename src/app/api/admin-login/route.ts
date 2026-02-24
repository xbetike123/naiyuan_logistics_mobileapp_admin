import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const apiBase = process.env.API_URL || 'http://localhost:3000';
    const candidates = [
      '/api/v1/auth/admin-login',
      '/api/auth/admin-login',
      '/auth/admin-login',
    ];

    for (const path of candidates) {
      const res = await fetch(`${apiBase}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const raw = await res.text();
      const body = (() => {
        try {
          return JSON.parse(raw);
        } catch {
          return {};
        }
      })();

      if (res.ok) {
        return NextResponse.json(body);
      }

      // If route exists but auth failed, return immediately.
      if (res.status !== 404) {
        return NextResponse.json(
          { message: body.message || raw || 'Login failed' },
          { status: res.status },
        );
      }
    }

    return NextResponse.json(
      { message: 'Admin login route is not available on backend deployment' },
      { status: 502 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Auth service unavailable' },
      { status: 502 },
    );
  }
}
