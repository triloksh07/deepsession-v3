import { NextResponse } from 'next/server';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: Request) {
  const body = await req.formData().catch(() => null) || await req.json().catch(() => ({}));
  const code = body.code || body.get?.("code");

  if (!code) {
    return NextResponse.json({ error: "invalid_request", error_description: "Missing authorization code" }, { status: 400 });
  }

  const codeDocRef = doc(db, "oauth_codes", code);
  const codeSnap = await getDoc(codeDocRef);

  if (!codeSnap.exists()) {
    return NextResponse.json({ error: "invalid_grant", error_description: "Invalid code" }, { status: 400 });
  }

  const data = codeSnap.data();
  if (data.expiresAt < Date.now()) {
    await deleteDoc(codeDocRef);
    return NextResponse.json({ error: "invalid_grant", error_description: "Code expired" }, { status: 400 });
  }

  // Consume code (One-time use)
  await deleteDoc(codeDocRef);

  return NextResponse.json({
    access_token: data.idToken,
    token_type: "Bearer",
    expires_in: 3600
  });
}