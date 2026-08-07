
# Static OAuth/OIDC Implementation Audit — DeepSession MCP Connector

**Audit date:** 2026-08-07  
**Repos inspected:**
- `deepsession-mcp` → `/mnt/5E507BA2507B7F97/Code-Projects/lang-graph/workflow/deepsession-mcp/src/`
- `deepsession-mpt` → `/mnt/…/deepsession-v3/`

---

## Part 1: Per-Checklist-Item Results

### Section A — Discovery

**A1. MCP server returns `401` on unauthenticated MCP request**

**Compliant** — `index.ts:81–85` intercepts only genuine empty probes (`content-length: 0`) with a 200, and `index.ts:92–95` repeats the same check for POST `/`. All other POST requests fall through to `authenticateJwtToken` (`auth.ts:20–36`) which returns 401 with `WWW-Authenticate` when the Authorization header is absent. The prior bug (over-broad probe match) is documented as fixed in the comment at `index.ts:68–77`.

---

**A2. `WWW-Authenticate` header is present on that 401, containing `resource_metadata=`**

**Compliant** — `auth.ts:24–27`:
```ts
res.setHeader(
  "WWW-Authenticate",
  `Bearer realm="mcp", resource_metadata="${mcpServerUrl}/.well-known/oauth-protected-resource"`
);
```
`mcpServerUrl` is derived from `req.protocol` + `req.get('host')`, which means the URL is **runtime-computed per-request** — see the cross-file consistency note in Part 2 below.

---

**A3. `/.well-known/oauth-protected-resource` returns valid JSON with `authorization_servers: [...]`**

**Compliant** (structure-wise) — `index.ts:56–66` registers this route (plus two path variants) and returns:
```json
{ "resource": "<baseUrl>/mcp", "authorization_servers": ["<NEXTJS_AUTH_SERVER>"] }
```
Both `resource` and `authorization_servers[0]` are dynamically composed. **Cannot verify statically** that the values are reachable at runtime — see "Needs live verification" at the end.

---

**A4. AS exposes at least one of `/.well-known/oauth-authorization-server` or `/.well-known/openid-configuration`**

**Compliant** — both exist:
- `app/.well-known/oauth-authorization-server/route.ts` serves the full metadata object.
- `app/.well-known/openid-configuration/route.ts` simply re-exports `GET` from the above file — they are identical responses.

---

**A5. `issuer` in metadata exactly matches `iss` in issued tokens**

**Compliant by construction** — both use the same expression:
```ts
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://deepsession-mpt.vercel.app";
```
- `oauth-authorization-server/route.ts:4,7` — sets `issuer: baseUrl`
- `api/oauth/token/route.ts:137,143` — sets `.setIssuer(baseUrl)`

Both read the same env var in the same process (Next.js on the same deployment). Drift can only happen if the two routes are deployed at different origins or if `NEXT_PUBLIC_APP_URL` is unset in one of them — **cannot verify statically**.

---

**A6. Metadata includes `code_challenge_methods_supported: ["S256"]`**

**Compliant** — `oauth-authorization-server/route.ts:12`:
```ts
code_challenge_methods_supported: ["S256"],
```
Present, correctly spelled, array with `"S256"`.

---

**A7. `token_endpoint`, `authorization_endpoint`, `registration_endpoint` are absolute**

**Compliant** — all three are built as `${baseUrl}/…` strings in `oauth-authorization-server/route.ts:8–10`. They will be absolute as long as `baseUrl` resolves to a real origin. **Cannot verify statically** that the values match the actual deployed hostname.

---

### Section B — Client Registration

**B1. Which registration method does the server actually support?**

The server supports all three simultaneously:
- **DCR** (`/api/oauth/register`) is present and advertised in metadata (`registration_endpoint`).
- **Static/pre-registered** clients also work: the authorize page stores `clientId || 'default_client'` in the Firestore `oauth_codes` doc (`authorize/page.tsx:52`), and the token endpoint never validates `client_id` from the code record.

---

**B2. DCR response shape**

**Compliant** — `register/route.ts:34–47` returns `client_id`, `client_secret`, `client_id_issued_at`, `client_secret_expires_at: 0`, `redirect_uris`, `grant_types`, `response_types`, `token_endpoint_auth_method`.

**Partially non-compliant / gap:** `redirect_uris` are echoed back verbatim from the request body (`body.redirect_uris || []`) but are **never validated or stored anywhere**. Since there is no persistent client record, the token endpoint has nothing to compare a later `redirect_uri` against. This means a client that sends `redirect_uris: ["https://evil.example.com"]` during registration and then uses a different `redirect_uri` in the authorization request would not be caught. More importantly, if Claude sends its `redirect_uri` in the auth request, there is no stored registered value to validate it against — see B3 / C2.

---

**B3. Does the authorization endpoint validate `client_id` against something real?**

**Non-compliant** — `authorize/page.tsx:52`:
```ts
client_id: clientId || 'default_client',
```
The `clientId` from the query string is written directly into the Firestore `oauth_codes` doc but is never checked against any registered client record. Any string passed as `client_id` is silently accepted. This is a security gap but likely not a connection-failure blocker since real clients don't rely on the server to reject their own `client_id`.

---

### Section C — Authorization Request → Redirect

**C1. Authorization endpoint captures all required parameters including `resource`**

**Partially compliant:**
- ✅ Captured: `redirect_uri` (`page.tsx:36`), `state` (`page.tsx:37`), `client_id` (`page.tsx:38`), `code_challenge` (`page.tsx:39`), `resource` (`page.tsx:43`)
- ❌ **Missing:** `response_type` — never read from `searchParams`. Not a functional blocker for the current flow, but a spec gap.
- ❌ **Missing:** `code_challenge_method` — never read or validated. The PKCE verification in the token endpoint hard-codes S256 logic (`base64UrlSha256`) but never checks that the client declared `code_challenge_method=S256`. If a client sends `code_challenge_method=plain` (which this server does not support), it would silently compute the wrong check and fail with an opaque `invalid_grant`.

---

**C2. `redirect_uri` validated against a registered/allowed value**

**Non-compliant** — `redirect_uri` from `searchParams` is written to Firestore (`page.tsx:55`) and later echoed back in the redirect from the exchange page (`exchange/page.tsx:56`). It is never compared against any registered value. This is an open redirect: any `redirect_uri` in the query string is used.

---

**C3. Redirect back to client contains `code` and `state`, not any token material**

**Compliant** — `exchange/page.tsx:54–57`:
```ts
callbackUrl.searchParams.set('code', code as string);
if (state) callbackUrl.searchParams.set('state', state);
```
No token material in the redirect. The exchange page only forwards the authorization code.

---

**C4. `code_challenge` persisted to Firestore for token endpoint to read back**

**Compliant** — `authorize/page.tsx:55`: `code_challenge: codeChallenge || null` written to `oauth_codes/<code>` doc, read back by `token/route.ts:87`.

---

**C5. `resource` persisted to Firestore for audience binding at token issuance**

**Compliant** — `authorize/page.tsx:56`: `resource: resource || null` written to Firestore, read back by `token/route.ts:138`: `const audience: string | undefined = data.resource || undefined`.

---

### Section D — Token Request → Token Response

**D1. Token endpoint called server-to-server by client (not browser-redirected)**

**Compliant** (by design) — `POST /api/oauth/token` is a standard HTTP POST. The exchange page does not call it; it only redirects with the code. The actual token fetch is up to the client (Claude/ChatGPT) to call server-side.

---

**D2. PKCE actually verified (S256): SHA256(code_verifier) == stored code_challenge**

**Conditionally compliant — with a dangerous bypass gap:**

`token/route.ts:87–98`:
```ts
if (data.code_challenge) {
  if (!codeVerifier) { ... return 400; }
  const computed = base64UrlSha256(codeVerifier);
  if (computed !== data.code_challenge) { ... return 400; }
}
```

The PKCE check is inside `if (data.code_challenge)`. If the authorization code was created **without** a `code_challenge` (i.e., `codeChallenge` was `null`/absent on the authorize page), the entire PKCE block is skipped and any request — or no `code_verifier` at all — is accepted. Given that the metadata advertises `code_challenge_methods_supported: ["S256"]`, a spec-compliant client will always send PKCE. But this bypass means a non-PKCE request (e.g., the local test tool) would also succeed, and it means the server does not enforce PKCE as required.

**More critically:** `code_challenge_method` is never read or validated anywhere, as noted in C1. The SHA256 computation in `base64UrlSha256` uses Node's `crypto.createHash('sha256')` with `.digest('base64url')`. This is correct for S256.

---

**D3. Authorization code is single-use, deleted at point of actual redemption**

**Compliant** — `token/route.ts:135`: `await codeDocRef.delete()` runs exactly once, after all validation passes and immediately before signing the JWT. The exchange page (`exchange/page.tsx`) no longer deletes the code (the comment in the code explicitly notes this fix). The exchange page's `getDoc` read is read-only and does not consume the code.

---

**D4. Response contains `access_token`, `token_type: "Bearer"`, `expires_in`, no undefined fields**

**Compliant** — `token/route.ts:150–156`:
```ts
{ access_token: accessToken, token_type: 'Bearer', expires_in: 3600 }
```
`accessToken` is the result of `jwtBuilder.sign(secretKey)` which will be a string if `data.uid` is truthy (checked at line 120) and the signing key is valid. The `uid` path is guarded before the sign call.

---

**D5. Issued token is actually signed (JWT with real signature)**

**Compliant** — `token/route.ts` uses `SignJWT` from `jose` (`package.json` confirms `jose: ^6.2.8` is installed) with `HS256` algorithm and the shared `MCP_JWT_SECRET`. This produces a standard signed JWT, not a decoded-only or bare value.

---

**D6. Token's `aud` claim == `resource` value captured in step C**

**Compliant** — `token/route.ts:138,146–148`:
```ts
const audience: string | undefined = data.resource || undefined;
...
if (audience) { jwtBuilder.setAudience(audience); }
```
`data.resource` is exactly what the authorize page stored from `searchParams.get('resource')`.

**Non-compliant edge case:** If `data.resource` is `null` or `""` (i.e., the client did not send a `resource` parameter), **no `aud` claim is set** on the token. The MCP server's `jwtVerify` call in `auth.ts:44` explicitly checks `audience: \`${mcpServerUrl}/mcp\``. `jose`'s `jwtVerify` will **throw** if an `audience` option is provided but the token has no `aud` claim. This means a client that does not send `resource` in the authorization request will get a token that the MCP server categorically rejects.

Whether real clients (Claude, ChatGPT) always send `resource` in the authorization request is a runtime question — **cannot verify statically** — but this is a plausible connection failure vector.

---

**D7. Token's `iss` claim == `issuer` from AS metadata**

**Compliant** — same `baseUrl` expression used in both places (see A5 above).

---

### Section E — Resource Server Token Validation

**E1. Real cryptographic signature verification (not decode-only)**

**Compliant** — `auth.ts:2`: `import { jwtVerify } from 'jose'`. `jwtVerify` performs cryptographic signature verification. `jose` is confirmed in `package.json` of the MCP server (`jose: ^6.2.8`). No `jwt-decode` present.

---

**E2. Verification explicitly checks `iss` and `aud`**

**Compliant** — `auth.ts:43–45`:
```ts
await jwtVerify(token, secretKey, {
  issuer: NEXTJS_AUTH_SERVER,
  audience: `${mcpServerUrl}/mcp`,
});
```
Both `issuer` and `audience` are explicit options passed to `jwtVerify`. `jose` enforces these as hard failures.

---

**E3. Expired/invalid tokens return `401` with `WWW-Authenticate`, not 500 or pass-through**

**Compliant** — `auth.ts:56–62` catch block sets `WWW-Authenticate` header and returns 401.

---

**E4. No middleware upstream of token validation returns 200 for requests missing valid Authorization**

**Compliant with a narrow caveat** — the probe interceptors at `index.ts:81–85` and `index.ts:92–95` both gate on `content-length: 0`, so they only trigger for genuinely empty bodies. A real Claude/ChatGPT MCP request will have a JSON body and non-zero content-length, so it will not be swallowed. The fix is correctly implemented as described in the inline comment.

---

**E5. Server does not forward the client's MCP access token to upstream (Firebase) calls**

**Compliant** — `auth.ts` extracts `uid` from the verified token and sets `req.userUid`. The `userContext` in `index.ts:17` stores `{ uid, token }`. The `firebaseAdmin.ts` config uses Firebase Admin SDK credentials (service account), not the user's bearer token. No code in the inspected files passes the client's bearer token to Firebase.

---

### Section F — Canonical URI Consistency

See Part 2 (table below).

---

### Section G — Session/Transport

**G1. `Mcp-Session-Id` doesn't interfere with auth state**

**Compliant** — `index.ts:104–120`: session IDs are stored in the `transports` map keyed by `sessionId`, and `userContext.run()` (`index.ts:130`) wraps each request with that request's own `uid`. Each HTTP request resolves its own uid from its own JWT before being dispatched. There is no cross-session state leakage visible in this code.

---

**G2. CORS exposes `WWW-Authenticate` and `Mcp-Session-Id` in `exposedHeaders`**

**Compliant** — `index.ts:29–32`:
```ts
app.use(cors({
  origin: '*',
  allowedHeaders: ['Content-Type', 'Authorization', 'mcp-session-id', 'x-mcp-session-id'],
  exposedHeaders: ['mcp-session-id', 'x-mcp-session-id', 'WWW-Authenticate']
}));
```
Both `WWW-Authenticate` and both casing variants of `mcp-session-id` are in `exposedHeaders`.

---

## Part 2: Cross-File Consistency Check (§F)

| Location | File : Line | String / Expression | Guaranteed to match? |
|---|---|---|---|
| **`resource` in protected-resource metadata** | `mcp/src/index.ts:63` | `` `${protocol}://${host}/mcp` `` (dynamic — from `x-forwarded-proto`/`x-forwarded-host` or `req.protocol`/`req.host`) | **Convention only** — depends on reverse-proxy forwarding headers being set correctly in production |
| **`resource_metadata` URL in 401 `WWW-Authenticate`** | `mcp/src/middleware/auth.ts:25` | `` `${req.protocol}://${req.get('host')}/.well-known/oauth-protected-resource` `` | Same dynamic derivation as above — same risk |
| **`aud` checked at token verification** | `mcp/src/middleware/auth.ts:44` | `` `${mcpServerUrl}/mcp` `` where `mcpServerUrl = \`${req.protocol}://${req.get('host')}\`` | Same dynamic derivation — all three are coherent with each other *only if* `req.protocol` and `req.get('host')` return the same value in both routes |
| **`aud` set at token issuance** | `mpt/app/api/oauth/token/route.ts:138` | `data.resource` — the exact string the client sent as the `resource` parameter | **Convention only — the most dangerous drift point** — this string comes from the client, not from any server config. It must match what `req.get('host')` resolves to on the MCP server side at verification time |
| **`authorization_servers[0]` in protected-resource metadata** | `mcp/src/index.ts:65` | `process.env.NEXTJS_AUTH_SERVER \|\| "https://deepsession-mpt.vercel.app"` | **Env var** — must match `NEXT_PUBLIC_APP_URL` / `issuer` in the main app |
| **`issuer` in AS metadata** | `mpt/app/.well-known/oauth-authorization-server/route.ts:4,7` | `process.env.NEXT_PUBLIC_APP_URL \|\| "https://deepsession-mpt.vercel.app"` | Same default fallback — coherent by convention, not construction |
| **`iss` in issued tokens** | `mpt/app/api/oauth/token/route.ts:137,143` | `process.env.NEXT_PUBLIC_APP_URL \|\| "https://deepsession-mpt.vercel.app"` | **Guaranteed to match `issuer` in AS metadata** — same var, same process |
| **`issuer` checked at token verification** | `mcp/src/middleware/auth.ts:11,43` | `process.env.NEXTJS_AUTH_SERVER \|\| "https://deepsession-mpt.vercel.app"` | **Must match `NEXT_PUBLIC_APP_URL` in the main app** — different env var names, different deployments, same default hardcode |

**Env vars that must match across both deployments:**

| Must match | MCP server env var | Main app env var |
|---|---|---|
| AS issuer / `iss` / `issuer` check | `NEXTJS_AUTH_SERVER` | `NEXT_PUBLIC_APP_URL` |
| Token signing/verification secret | `MCP_JWT_SECRET` | `MCP_JWT_SECRET` |

**Critical observation on `aud` drift:** The `aud` claim in issued tokens is `data.resource` — the raw string from the client's authorization request. The MCP server checks `aud` against a dynamically-computed `` `${req.protocol}://${req.get('host')}/mcp` ``. These two values must be character-identical, including scheme, host, port, `/mcp` suffix, and no trailing slash. Since the value stored in Firestore comes from whatever URL the client typed as the connector endpoint, and the verification value comes from HTTP request headers on the MCP server, any mismatch (e.g., `http` vs `https`, missing `x-forwarded-proto`, port inclusion, trailing slash) causes a hard 401 that `jose` will throw as an audience mismatch. **This is the highest-probability silent failure.**

---

## Part 3: Flow-Shape Summary

**What the code literally does, request by request:**

1. Client discovers `/.well-known/oauth-protected-resource` (either from a 401 challenge or directly). Gets back `{ resource: "<mcpUrl>/mcp", authorization_servers: ["<nextjsUrl>"] }`.
2. Client fetches `<nextjsUrl>/.well-known/oauth-authorization-server` (or `openid-configuration`). Gets metadata including `authorization_endpoint`, `token_endpoint`, `registration_endpoint`, and `code_challenge_methods_supported: ["S256"]`.
3. Client optionally POSTs to `<nextjsUrl>/api/oauth/register` to obtain a `client_id` and `client_secret` (DCR). The returned credentials are not stored anywhere server-side — they are ephemeral and unvalidated by subsequent calls.
4. Client redirects the user's browser to `<nextjsUrl>/oauth/authorize?response_type=code&client_id=…&redirect_uri=…&state=…&code_challenge=…&code_challenge_method=S256&resource=…`.
5. The Next.js page (`authorize/page.tsx`) authenticates the user via Firebase Auth (email/password or OAuth provider), writes an `oauth_codes` Firestore document containing `{ code, uid, client_id, redirect_uri, state, code_challenge, resource, createdAt }`, then redirects internally to `/oauth/exchange?code=…&redirect_uri=…&state=…`.
6. The exchange page (`exchange/page.tsx`) reads the Firestore doc (read-only), extracts `redirect_uri` and `state` from the stored data, and issues a browser redirect to `<redirect_uri>?code=<code>&state=<state>`. No token is in this redirect.
7. The client (Claude/ChatGPT) receives the browser callback with `code` and `state`, then makes a server-to-server POST to `<nextjsUrl>/api/oauth/token` with `code`, `code_verifier`, optionally `client_id`/`client_secret`.
8. The token endpoint verifies PKCE (if `code_challenge` was stored), deletes the Firestore doc, issues a signed HS256 JWT with `sub=uid`, `user_id=uid`, `iss=baseUrl`, `aud=data.resource` (if present), `exp=+1h`.
9. Client presents `Authorization: Bearer <JWT>` to the MCP server. `authenticateJwtToken` runs `jwtVerify` against the shared HMAC secret with explicit `issuer` and `audience` checks, extracts `uid`, sets it in `req.userUid`, and calls `next()`.

**Comparison against spec sequence:** Steps 1–9 correctly match the expected Authorization Code + PKCE + RFC 8707 Resource Indicators flow. The **first divergence point** is step 5: `code_challenge_method` is never stored or validated, and if a client omits `resource`, step 8 produces a token without `aud`, which step 9 rejects. These are the only structural deviations from the spec sequence.

---

## Part 4: Confidence-Ranked List of Likely Root Causes

Ranked by likelihood of being the **current** blocker for Claude.ai / ChatGPT failing while the local test tool succeeds:

**#1 — `aud` mismatch due to dynamic host derivation vs. client-supplied `resource` string (F / D6)**

The `aud` in the token is whatever string the client sent as `resource` (e.g., `https://my-tunnel.trycloudflare.com/mcp`). The MCP server checks `aud` against `` `${req.protocol}://${req.get('host')}/mcp` `` — which on a Railway/Render/cloud deployment behind a reverse proxy often returns `http://localhost:PORT` or a private hostname unless `x-forwarded-proto` and `x-forwarded-host` headers are properly forwarded. If these headers are not set by the hosting platform, the computed canonical URL is wrong, and every legitimate token fails verification with `jose`'s audience check. The local test tool likely bypasses this by using a value it controls directly. This is the most common cause of "works locally, fails in production" with `jose`-based HMAC verification.

**#2 — `resource` not sent by client → token issued without `aud` → MCP server rejects it (D6)**

If a client (particularly ChatGPT, which has been slower to adopt RFC 8707 resource indicators) does not include `resource` in its authorization request, `data.resource` is `null`, no `aud` is set on the JWT, and `jose`'s `jwtVerify` with `audience: …` throws. The local test tool may simply hardcode the `resource` param. A real client that omits it will always fail.

**#3 — DCR: `redirect_uris` not stored, so re-validation is impossible (B2)**

Claude registers a `client_id` via DCR, receives back a `client_id` and `redirect_uris`. But since these are never persisted, the authorization endpoint cannot validate whether the `redirect_uri` in the authorization request matches what was registered. Some strict clients may abort if they detect the server accepted a mismatched `redirect_uri`, though in practice this is less likely to surface as an outright failure than #1 and #2.

**#4 — `NEXTJS_AUTH_SERVER` / `NEXT_PUBLIC_APP_URL` mismatch (F)**

The MCP server verifies `iss` against `NEXTJS_AUTH_SERVER`; the main app issues tokens with `iss = NEXT_PUBLIC_APP_URL`. If these two env vars are set to slightly different strings (trailing slash, staging vs prod subdomain, etc.), every token fails the `iss` check. The shared fallback `"https://deepsession-mpt.vercel.app"` makes this safer in the default case, but in a real deployment where both vars are set explicitly, drift is entirely possible.

**#5 — `code_challenge_method` not validated; no enforcement of PKCE when `code_challenge` absent (D2)**

The local test tool probably sends `code_challenge` (since it worked during development). But this is not enforced server-side — a client that somehow ends up in a state where the authorize page receives an empty `code_challenge` (e.g., URL truncation, encoding issue) would produce a code with no challenge stored, the token endpoint would skip PKCE entirely, and the resulting token might have the wrong or missing claims. Lower probability because real clients send PKCE reliably.

---

## Needs Live Verification

The following items cannot be confirmed from static analysis alone. Each is a single `curl` command or equivalent:

1. **`aud` / `resource` round-trip** — From the Claude connector settings, note the exact URL configured as the MCP server endpoint (e.g., `https://xyz.railway.app`). Then:
   ```
   curl -s https://xyz.railway.app/.well-known/oauth-protected-resource | jq .resource
   ```
   The returned `resource` field must be character-identical to what Claude will include as the `resource` param in the authorization request. Then, after a full flow, decode the JWT (e.g., `jwt.io`) and confirm the `aud` claim in the token matches the `aud` option that `jwtVerify` will compute from `req.protocol`/`req.get('host')` at request time. If these differ by even a trailing slash, `jose` will reject the token.

2. **`x-forwarded-proto` / `x-forwarded-host` forwarding** — On the deployed MCP server host, confirm the platform sets these headers. If not, `req.protocol` will be `http` and `req.get('host')` will be the private/internal hostname, making `mcpServerUrl` wrong for both the 401 `WWW-Authenticate` header and the `jwtVerify` audience check:
   ```
   curl -v -X POST https://xyz.railway.app/mcp \
     -H "Content-Type: application/json" \
     -d '{}' 2>&1 | grep -i "www-authenticate"
   ```
   Confirm the `resource_metadata` URL in the `WWW-Authenticate` header uses `https://` and the correct public hostname.

3. **`NEXTJS_AUTH_SERVER` vs `NEXT_PUBLIC_APP_URL` exact match** — In the MCP server deployment env, echo `NEXTJS_AUTH_SERVER`. In the main app deployment env, echo `NEXT_PUBLIC_APP_URL`. They must be identical strings (including trailing slash, if any).

4. **`MCP_JWT_SECRET` exact match** — Confirm the value is the same in both deployments. A common mistake is copying with an extra newline or whitespace from the shell.

5. **`/.well-known/oauth-authorization-server` response body** — Confirm the live response includes `code_challenge_methods_supported`:
   ```
   curl -s https://deepsession-mpt.vercel.app/.well-known/oauth-authorization-server | jq .
   ```

6. **Orphaned `/api/oauth/code` route** — Confirmed **does not exist** in current code (the `app/api/oauth/` directory contains only `register/` and `token/`). No further analysis needed.