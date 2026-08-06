// app/api/oauth/token/route.ts
import { NextResponse } from 'next/server';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SignJWT } from 'jose';
import crypto from 'node:crypto';

// Shared HMAC secret with the MCP server's middleware/auth.ts.
// Must be identical in both deployments' environment variables.
const MCP_JWT_SECRET = process.env.MCP_JWT_SECRET;
if (!MCP_JWT_SECRET) {
  throw new Error("MCP_JWT_SECRET environment variable is required");
}
const secretKey = new TextEncoder().encode(MCP_JWT_SECRET);

function base64UrlSha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('base64url');
}

export async function POST(req: Request) {
  let code: string | null = null;
  let codeVerifier: string | null = null;
  const contentType = req.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      code = (formData.get('code') as string) || null;
      codeVerifier = (formData.get('code_verifier') as string) || null;
    } else {
      const json = await req.json();
      code = json.code || null;
      codeVerifier = json.code_verifier || null;
    }
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Failed to parse request body' },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing authorization code' },
      { status: 400 }
    );
  }

  const codeDocRef = doc(db, 'oauth_codes', code);
  const codeSnap = await getDoc(codeDocRef);

  if (!codeSnap.exists()) {
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Invalid, expired, or already-used code' },
      { status: 400 }
    );
  }

  const data = codeSnap.data();

  // Expiration check — createdAt is a Firestore serverTimestamp on write
  const createdAtMs = data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt;
  if (createdAtMs && Date.now() - createdAtMs > 5 * 60 * 1000) {
    await deleteDoc(codeDocRef);
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Code expired' },
      { status: 400 }
    );
  }

  // Check expiration if expiresAt exists on the document
  // if (data.expiresAt && data.expiresAt < Date.now()) {
  //   await deleteDoc(codeDocRef);
  //   return NextResponse.json(
  //     { error: 'invalid_grant', error_description: 'Code expired' },
  //     { status: 400 }
  //   );
  // }


  // PKCE verification (S256) — required since discovery metadata advertises it
  if (data.code_challenge) {
    if (!codeVerifier) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Missing code_verifier for PKCE exchange' },
        { status: 400 }
      );
    }
    const computed = base64UrlSha256(codeVerifier);
    if (computed !== data.code_challenge) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'PKCE verification failed' },
        { status: 400 }
      );
    }
  }

  if (!data.uid) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'No user bound to this authorization code' },
      { status: 500 }
    );
  }

  // Consume the code here (One-time use) — this is the actual point of use, unlike the old
  // /oauth/exchange page which deleted it before the token was ever issued.
  await deleteDoc(codeDocRef);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deepsession-mpt.vercel.app";
  const audience: string | undefined = data.resource || undefined;

  const jwtBuilder = new SignJWT({ sub: data.uid, user_id: data.uid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(baseUrl)
    .setExpirationTime('1h');

  if (audience) {
    jwtBuilder.setAudience(audience);
  }

  const accessToken = await jwtBuilder.sign(secretKey);

  return NextResponse.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
  });
}