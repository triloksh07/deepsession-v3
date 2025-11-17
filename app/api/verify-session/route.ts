// app/api/verify-session/route.ts
import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
// import { initAdmin } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs'; // 👈 critical

export async function POST(req: Request) {
  // await initAdmin();
  const { session } = await req.json();

  try {
    const decoded = await getAuth().verifySessionCookie(session, true);
    return NextResponse.json({ uid: decoded.uid });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
