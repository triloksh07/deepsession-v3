# DeepSession MCP Connector — OAuth/OIDC Debugging Report

**Status:** Root cause identified. Fix scoped, not yet implemented.
**Symptom:** Claude.ai custom connector shows *"Authorization with the MCP server failed"* after the OAuth login screen completes successfully.
**Impact:** Claude never obtains a usable access token, so no MCP tool calls can succeed via claude.ai (local manual testing appeared to work, which masked the issue — see §4).

---

## 1. Executive Summary

The DeepSession MCP server correctly advertises an OAuth 2.1 **authorization code + PKCE** flow in its discovery metadata, but the actual implementation in the main app (`deepsession-mpt`) silently short-circuits into an **implicit-style flow** — handing back an access token directly in a redirect URL instead of an authorization `code`. Claude's client strictly expects the code-exchange contract it discovered in the metadata, so the connection fails at the point where Claude tries to redeem a `code` that was never sent.

This was masked during local testing because the test harness (`mcp-test.html`) and a partially-built `/api/oauth/token` route both independently bypass the same step, so the bug never surfaced until tested against the real Claude client.

A secondary, independent issue (token signature verification) was already partially fixed mid-session but should be finished as part of the same pass.

---

## 2. Current Architecture (as found)

```
Claude.ai                         DeepSession Main App                 MCP Server
   │                                (deepsession-mpt.vercel.app)         (Express)
   │                                                                     │
   │  GET /.well-known/oauth-authorization-server (on MCP server) ─────►│
   │◄──────────────── issuer, endpoints, code_challenge S256 ───────────│
   │                                                                     │
   │  Browser → /oauth/authorize?response_type=code&code_challenge=..   │
   ├────────────────────────────────►  oauth/authorize/page.tsx         │
   │                                   (Firebase login, writes           │
   │                                    oauth_codes/{code} w/ uid,       │
   │                                    code_challenge, redirect_uri)    │
   │                                          │                         │
   │                                          ▼                         │
   │                                   oauth/exchange/page.tsx           │
   │                                   - reads + DELETES code doc        │
   │                                   - gets Firebase idToken           │
   │                                   - redirects to Claude callback    │
   │                                     with ?access_token=...  ⚠       │
   │◄── redirect: ?access_token=<firebase idToken>&token_type=Bearer ───│
   │                                                                     │
   │  ✗ Claude expected `?code=...`, not a token. Flow fails here.       │
   │                                                                     │
   │  (unreached) POST /api/oauth/token  {code, code_verifier}          │
   │                                   - looks up data.uid  (was         │
   │                                     previously undefined — fixed    │
   │                                     in authorize page, but route    │
   │                                     itself is now orphaned)         │
   │                                   - no PKCE verification            │
   │                                   - returns raw uid/idToken as      │
   │                                     "access_token", not a signed    │
   │                                     JWT with proper aud/iss         │
   │                                                                     │
   │  (unreached) MCP server middleware validates Bearer token ─────────►│
   │                                   - originally used jwt-decode      │
   │                                     (no signature verification)     │
   │                                   - switched to Admin SDK           │
   │                                     verifyIdToken() during          │
   │                                     debugging — works, but only     │
   │                                     validates Firebase ID tokens,   │
   │                                     not tokens minted by /token     │
```

---

## 3. Root Cause

**The redirect-back step (`oauth/exchange/page.tsx`) returns an access token directly instead of an authorization code**, even though:

- The server's own discovery metadata advertises `"response_types_supported": ["code"]` and `"grant_types_supported": ["authorization_code"]`.
- Claude.ai's OAuth client follows RFC 6749 strictly: it expects `?code=...` on the redirect and will perform a **separate, server-to-server** `POST` to `token_endpoint` to exchange it. It does not accept a token appended directly to the browser redirect.

Because of this mismatch, Claude's callback handler receives a redirect it can't parse as a valid authorization response, and the connector reports failure before ever calling `/api/oauth/token`.

This is a **flow-shape bug**, not a credentials or network issue — which is why earlier troubleshooting (DNS, reachability, WAF, etc.) correctly ruled out infrastructure causes.

---

## 4. Why Local Testing Didn't Catch This

Two things independently short-circuited the same step, hiding the bug from local testing:

1. **`mcp-test.html`** (manual test harness) reads `access_token` directly off the redirect URL — it never calls `/api/oauth/token` either. So "successful" manual tool calls only proved the *login* and *middleware* worked, not that the *code exchange* worked.
2. **`app/api/oauth/code/route.ts`** is orphaned dead code — it expects a POSTed `idToken` and was presumably an earlier design, but nothing in the current UI calls it.

Net effect: the code-exchange path (`/api/oauth/token`) has never actually been exercised end-to-end by anything except Claude — which is exactly the client that requires it.

---

## 5. Full Issue List

| # | Severity | Location | Issue | Status |
|---|----------|----------|-------|--------|
| 1 | **Critical** | `oauth/exchange/page.tsx` | Redirects to Claude with `access_token` in the URL instead of `code`. Breaks the advertised authorization_code flow. | **Not fixed** |
| 2 | **Critical** | `oauth/exchange/page.tsx` | Deletes the `oauth_codes` doc on page view, before `/api/oauth/token` ever runs — the code would already be consumed even if step 1 is fixed. | **Not fixed** |
| 3 | High | `app/api/oauth/token/route.ts` | Returns `data.uid` as `access_token` — a bare UID string, not a signed JWT. No `aud`/`iss` claims, so downstream audience/issuer validation (spec-required, and what Claude checks) is impossible. | **Not fixed** |
| 4 | High | `app/api/oauth/token/route.ts` | No PKCE (`code_verifier` vs `code_challenge`) check, despite advertising `S256` support in discovery metadata. | **Not fixed** |
| 5 | High | `oauth/authorize/page.tsx` | Does not capture or persist the `resource` parameter (RFC 8707) that Claude sends, needed to bind the issued token's `aud` to this specific MCP server. | **Not fixed** |
| 6 | Medium | `middleware/auth.ts` | Originally used `jwt-decode`, which performs **no signature verification** — any well-formed JWT-shaped string would pass. | **Partially fixed** (switched to Firebase Admin `verifyIdToken` during debugging) — needs to instead verify tokens issued by your own `/token` endpoint once §1–5 are fixed, using your own signing secret/JWKS, not Firebase's. |
| 7 | Medium | `index.ts` (MCP server) | Global POST interceptor treats *any unauthenticated POST* as an empty probe and returns `200 OK`, which also swallows Claude's legitimate first unauthenticated request used to trigger the `401 + WWW-Authenticate` discovery challenge. | **Not fixed** |
| 8 | Low | `app/api/oauth/code/route.ts` | Orphaned/dead route from an earlier design iteration; not referenced anywhere in the current flow. | Should be removed |
| 9 | Low | `oauth/authorize/page.tsx` | `client_id` from the request isn't validated against any registered client list — accepts anything, defaults silently to `'default_client'`. Fine for a single-tenant testing setup, not production-grade if you intend to support arbitrary registered clients via DCR. | Not fixed |

---

## 6. Fix Plan (in dependency order)

1. **`oauth/authorize/page.tsx`** — also capture and persist `resource` from the incoming query params, alongside the existing `code_challenge`.
2. **`oauth/exchange/page.tsx`** — stop reading `auth.currentUser` / minting a token here. Redirect back to Claude with `?code=...&state=...` only. Do **not** delete the Firestore code doc here.
3. **`app/api/oauth/token/route.ts`**:
   - Look up the code doc (now containing `uid`, `code_challenge`, `resource`).
   - Verify `code_verifier` against stored `code_challenge` (SHA-256 + base64url, per PKCE S256).
   - Delete the code doc here (one-time use, consumed at the right step).
   - Mint a real signed JWT (e.g. via `jose`'s `SignJWT`) with `sub`/`user_id` = uid, `iss` = your issuer URL, `aud` = the stored `resource` value, reasonable `exp`.
   - Return `{ access_token, token_type: "Bearer", expires_in }` as valid JSON per RFC 6749.
4. **`middleware/auth.ts`** — replace the Admin-SDK Firebase verification with `jwtVerify` (from `jose`) against your own signing secret/JWKS, checking `iss` and `aud` explicitly, not just decoding.
5. **`index.ts`** — narrow the empty-probe interceptor to only match `content-length: 0`, not "missing Authorization header," so the 401 challenge Claude needs for discovery isn't swallowed.
6. **Cleanup** — delete `app/api/oauth/code/route.ts`.
7. **Retest** against claude.ai (not the manual harness) — Owner/Pro connector flow: add connector → Connect → confirm OAuth completes → confirm a tool call succeeds.

---

## 7. Production-Grade Checklist (beyond the immediate bug)

- [ ] Real signed tokens (JWT or opaque + introspection) with `iss`/`aud`/`exp` — no bare UIDs or unverified client-decoded tokens anywhere in the trust path.
- [ ] PKCE S256 enforced on every code exchange, not just advertised in metadata.
- [ ] `resource` parameter captured and bound into token audience (RFC 8707).
- [ ] One-time, properly-scoped authorization codes (short TTL, deleted exactly once, at exchange time).
- [ ] Client registration (`/api/oauth/register`) should persist registered clients rather than minting throwaway credentials on every call, if you intend to support more than one client type long-term.
- [ ] Refresh token support with RFC 6749-compliant error codes, if long-lived sessions are needed (currently `expires_in: 3600` with no refresh path).
- [ ] Rate limiting / WAF rules on `/oauth/*` and `/mcp` should explicitly allowlist Anthropic's published egress IP range if any edge protection is added later.
- [ ] Remove or gate debug `console.log` of full request headers in `index.ts` before production (currently logs all incoming headers, which will include bearer tokens).

---

## 8. Key Files Referenced

- `server-mcp.ts` — original monolithic MCP server (pre-refactor, Firebase-password auth, superseded).
- `index.ts` — current Express entrypoint, OAuth-protected resource metadata, MCP request routing.
- `mcpServer.ts` — modular MCP server factory.
- `middleware/auth.ts` — Bearer token validation middleware.
- `mcp-test.html` — manual browser-based test harness (does not exercise the real code-exchange path — see §4).
- `app/.well-known/oauth-authorization-server/route.ts` — discovery metadata.
- `app/api/oauth/code/route.ts` — orphaned/unused.
- `app/api/oauth/token/route.ts` — token endpoint; currently broken (§5, items 3–4).
- `app/(public)/oauth/authorize/page.tsx` — consent/login page; writes authorization code.
- `app/(public)/oauth/exchange/page.tsx` — currently converts code → token client-side and redirects with a token (§5, items 1–2) — this is the primary defect.
