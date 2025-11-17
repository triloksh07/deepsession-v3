// app/api/session/route.ts
import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

export const runtime = 'nodejs'; // 👈 forces Node runtime

export async function GET() {
  const user = await admin.auth().getUser('uid');
  return NextResponse.json(user);
}
