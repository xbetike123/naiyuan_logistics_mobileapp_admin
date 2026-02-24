// src/lib/jwt.ts
// Zero-dependency JWT using Web Crypto API (works in Next.js Edge + Node)

const ALGORITHM = { name: 'HMAC', hash: 'SHA-256' };
const DEFAULT_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

function getSecret(): string {
  const secret = process.env.ADMIN_TOKEN_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('ADMIN_TOKEN_SECRET must be set and at least 16 characters');
  }
  return secret;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const secret = getSecret();
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    ALGORITHM,
    false,
    ['sign', 'verify'],
  );
}

function base64UrlEncode(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(data: string): string {
  const padded = data.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded);
}

export interface AdminTokenPayload {
  sub: string;       // username
  role: string;      // 'ADMIN'
  iat: number;       // issued at (unix seconds)
  exp: number;       // expiry (unix seconds)
}

export async function signToken(
  username: string,
  expiresInSeconds: number = DEFAULT_EXPIRY,
): Promise<string> {
  const key = await getCryptoKey();
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: username,
      role: 'ADMIN',
      iat: now,
      exp: now + expiresInSeconds,
    }),
  );

  const encoder = new TextEncoder();
  const data = encoder.encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${header}.${payload}.${sig}`;
}

export async function verifyToken(token: string): Promise<AdminTokenPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');

  const [header, payload, signature] = parts;
  const key = await getCryptoKey();

  // Verify signature
  const encoder = new TextEncoder();
  const data = encoder.encode(`${header}.${payload}`);

  // Decode signature from base64url
  const sigStr = signature.replace(/-/g, '+').replace(/_/g, '/');
  const sigPadded = sigStr + '='.repeat((4 - (sigStr.length % 4)) % 4);
  const sigBytes = Uint8Array.from(atob(sigPadded), (c) => c.charCodeAt(0));

  const valid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
  if (!valid) throw new Error('Invalid signature');

  // Decode payload
  const decoded: AdminTokenPayload = JSON.parse(base64UrlDecode(payload));

  // Check expiry
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp && decoded.exp < now) {
    throw new Error('Token expired');
  }

  return decoded;
}
