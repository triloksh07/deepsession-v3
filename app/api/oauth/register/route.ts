import { NextResponse } from 'next/server';
// import { randomUUID } from 'node:crypto';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// export async function POST(req: Request) {
//   const body = await req.json().catch(() => ({}));

//   return NextResponse.json({
//     client_id: `mcp_client_${randomUUID().substring(0, 8)}`,
//     client_secret: randomUUID(),
//     redirect_uris: body.redirect_uris || [],
//     grant_types: ["authorization_code"]
//   });
// }

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Generate standard dynamic client credentials
    const clientId = `mcp_client_${crypto.randomBytes(8).toString('hex')}`;
    const clientSecret = crypto.randomBytes(16).toString('hex');

    return NextResponse.json({
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_secret_expires_at: 0,
      redirect_uris: body.redirect_uris || [],
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none"
    }, {
      status: 201,
      headers: corsHeaders
    });
  }
  catch (err: unknown) {
    let message = "An unexpected error occurred";

    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    } else {
      message = JSON.stringify(err);
    }

    return NextResponse.json(
      { error: "invalid_request", error_description: message },
      { status: 400, headers: corsHeaders }
    );
  }
}