import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  return NextResponse.json({
    client_id: `mcp_client_${randomUUID().substring(0, 8)}`,
    client_secret: randomUUID(),
    redirect_uris: body.redirect_uris || [],
    grant_types: ["authorization_code"]
  });
}