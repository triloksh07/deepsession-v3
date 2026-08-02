import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();
    if (!idToken) return NextResponse.json({ error: "Missing idToken" }, { status: 400 });

    const authCode = `code_${randomUUID()}`;

    // Store temporary exchange code (Expires in 5 minutes)
    await setDoc(doc(db, "oauth_codes", authCode), {
      idToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    return NextResponse.json({ code: authCode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}