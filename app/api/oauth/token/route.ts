// app/api/oauth/token/route.ts
import { NextResponse } from 'next/server';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: Request) {
  let code: string | null = null;
  const contentType = req.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      code = (formData.get('code') as string) || null;
    } else {
      const json = await req.json();
      code = json.code || null;
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
      { error: 'invalid_grant', error_description: 'Invalid or expired code' },
      { status: 400 }
    );
  }

  const data = codeSnap.data();

  // Check expiration if expiresAt exists on the document
  if (data.expiresAt && data.expiresAt < Date.now()) {
    await deleteDoc(codeDocRef);
    return NextResponse.json(
      { error: 'invalid_grant', error_description: 'Code expired' },
      { status: 400 }
    );
  }

  // Consume code (One-time use)
  await deleteDoc(codeDocRef);

  return NextResponse.json({
    access_token: data.uid, // Return user identity reference or custom token string
    token_type: 'Bearer',
    expires_in: 3600,
  });
}