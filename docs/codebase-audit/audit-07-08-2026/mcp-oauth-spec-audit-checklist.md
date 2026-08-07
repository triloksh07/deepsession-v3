# MCP Authorization Spec — Implementation Checklist for Coding Agent

Source: [modelcontextprotocol.io/specification/2025-11-25/basic/authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
(current spec revision as of Aug 2026). This doc distills every MUST/SHOULD
requirement relevant to a custom OIDC-backed MCP server into a checklist.
Use it to audit both repos (`deepsession-mcp-server` and `deepsession-mpt`
main app) line by line — don't assume prior fixes are complete; re-verify.

---

## Context: why this audit is needed

Local manual testing (`mcp-test-oidc.html`) works, but real MCP clients
(Claude.ai, ChatGPT) fail to connect. This is a strong signal that the local
test tool is taking a shortcut a spec-compliant client does not — most
commonly, skipping discovery, skipping PKCE, or accepting a token handed
back directly instead of doing the full code-exchange. **Do not trust the
local test tool as a correctness signal for this audit.** Check each item
below against the actual server responses (curl/network tab), not against
whether the local HTML tool "works."

---

## A. Discovery (RFC 9728 + RFC 8414 / OIDC Discovery)

- [ ] **MCP server returns `401`** (not `200`, not silently accepted) on an MCP
      request with no `Authorization` header — check every route/middleware
      that could intercept the request before auth runs (probe handlers,
      CORS preflight handlers, etc. have caused this exact bug before).
- [ ] **`WWW-Authenticate` header is present on that 401** and contains
      `resource_metadata="<url>"` pointing to a reachable metadata URL.
- [ ] `/.well-known/oauth-protected-resource` (or path-specific variant)
      returns valid JSON with `authorization_servers: [...]` — at least one
      entry, a real reachable HTTPS URL.
- [ ] Authorization server exposes **at least one** of:
      `/.well-known/oauth-authorization-server` or
      `/.well-known/openid-configuration` — verify the actual response body,
      not just that the route exists.
- [ ] That metadata's `issuer` field **exactly matches** the value later
      signed into tokens as `iss` — string-exact, including trailing slash
      or lack thereof.
- [ ] Metadata includes `code_challenge_methods_supported: ["S256"]`. **If
      this field is absent, spec-compliant clients must refuse to connect
      entirely** — this alone can explain a total connection failure with no
      other symptom.
- [ ] `token_endpoint`, `authorization_endpoint`, and (if used)
      `registration_endpoint` in the metadata are absolute, correct, and
      actually reachable (not localhost, not a stale tunnel URL).

## B. Client Registration

- [ ] Determine which registration method the server actually supports:
      static/pre-registered client_id, Client ID Metadata Documents, or
      Dynamic Client Registration (RFC 7591).
- [ ] If DCR (`/api/oauth/register` or similar): confirm it returns
      `client_id` (and `client_secret` if confidential) in a shape the
      client can parse, and that whatever `redirect_uris` the client sends
      get validated/stored — not silently ignored.
- [ ] If relying on manually-entered Client ID/Secret in Claude's connector
      settings instead: confirm the authorization endpoint actually
      validates the `client_id` it receives against something real, not
      just accepting any string as `'default_client'`.

## C. Authorization Request → Redirect

- [ ] Authorization endpoint captures **all** of: `response_type=code`,
      `client_id`, `redirect_uri`, `state`, `code_challenge`,
      `code_challenge_method`, and **`resource`**. Grep for each of these
      being read from `searchParams`/query — a missing one is a silent bug,
      not an error.
- [ ] `redirect_uri` is validated against a registered/allowed value —
      not blindly trusted and echoed back (open redirect risk, and also
      something strict clients may reject).
- [ ] The eventual redirect back to the client contains **`code` and
      `state`** in the query string. It must **not** contain `access_token`,
      `id_token`, or any token material — if it does, this is an implicit-flow
      shortcut and will fail against any spec-compliant client even though
      it may "work" for a hand-rolled test page that reads tokens off the URL.
- [ ] `code_challenge` gets persisted somewhere the token endpoint can read
      it back by `code` later (DB row, Firestore doc, etc.) — not just held
      in memory/session state that a redirect-based flow would lose.
- [ ] `resource` gets persisted the same way, for audience binding at token
      issuance.

## D. Token Request → Token Response

- [ ] Token endpoint is called **server-to-server** by the client (not
      browser-redirected) with `code`, `code_verifier`, `resource`
      (and `client_id`/`client_secret` or equivalent auth).
- [ ] PKCE is actually **verified**: `SHA256(code_verifier)` base64url ==
      stored `code_challenge`. Confirm this check exists and actually
      rejects on mismatch — a route that accepts a `code_verifier` param
      but never checks it against anything is a common near-miss.
- [ ] Authorization code is single-use: confirm it's deleted/invalidated
      exactly once, at the point it's actually redeemed — not earlier (a
      page view, a redirect hop) and not left reusable.
- [ ] Response body is valid JSON containing `access_token`, `token_type:
      "Bearer"`, `expires_in` — confirm `access_token` is never `undefined`
      by tracing the exact field name from wherever `uid`/user identity gets
      stored on the code record through to what's returned here.
- [ ] The issued token is **actually signed** (JWT with real signature, or
      opaque token backed by server-side lookup) — not a bare user ID or an
      unsigned/decoded-only value.
- [ ] Token's `aud` claim (if JWT) == the `resource` value captured in step C,
      exactly (canonical form: lowercase scheme/host, no trailing slash).
- [ ] Token's `iss` claim == the `issuer` value from the AS metadata, exactly.

## E. Resource Server (MCP Server) Token Validation

- [ ] Every MCP request's `Authorization: Bearer <token>` is validated with
      **real cryptographic signature verification** — not a decode-only
      library (e.g. `jwt-decode` in JS decodes but does not verify; needs
      something like `jose`'s `jwtVerify` or equivalent).
- [ ] Verification explicitly checks `iss` matches the expected authorization
      server, and `aud` matches this MCP server's own canonical URI — both
      checks must be explicit, not implied by "well the signature matched."
- [ ] Expired or invalid tokens get a real `401` with `WWW-Authenticate`,
      not a 500 or a silent pass-through.
- [ ] No middleware upstream of token validation could return `200` for a
      request that's missing/carries no valid Authorization header — audit
      every `app.use` interceptor for accidental over-broad matches (e.g.
      matching on `content-length: 0` is fine; matching on "no auth header
      present" for *any* POST is not — that treats every real Claude request
      as a harmless probe).
- [ ] If this server calls any upstream API (Firebase, etc.) on the user's
      behalf, confirm it does **not** forward the client's original MCP
      access token unmodified to that upstream call (token passthrough is
      explicitly disallowed by spec — use a separate credential/token for
      upstream calls).

## F. Canonical URI Consistency (common silent-failure source)

Check that the **exact same string** is used as the MCP server's canonical
URI everywhere it appears:
- [ ] In `resource` sent by the client (not controlled by you, but note it
      for comparison)
- [ ] In `resource` field of `/.well-known/oauth-protected-resource`
- [ ] In `aud` claim checked at token verification time
- [ ] In `aud` claim set at token issuance time
All four must match exactly — including trailing slash, `/mcp` suffix
presence, scheme, and host. A tunnel URL (ngrok/Cloudflare) that changes
between test runs is a common source of drift here — confirm whichever URL
is currently configured as the connector endpoint in Claude matches what
the server computes for itself in each of these four places *right now*,
not what it was during a previous session.

## G. Session/Transport (separate from auth, but adjacent)

- [ ] `Mcp-Session-Id` handling doesn't interfere with or get confused with
      auth state — a session tied to one user's transport instance
      shouldn't leak into another's.
- [ ] CORS configuration exposes headers the client needs to read
      (`WWW-Authenticate`, `Mcp-Session-Id`) — confirm `exposedHeaders`
      actually includes them, not just `allowedHeaders`.

---

## How to use this with the coding agent

Give the agent: this file, both repos (or relevant auth-related files), and
instruct it to go through sections A–G in order, for each item either
(1) confirm compliant with a code citation, (2) flag non-compliant with the
specific file/line, or (3) flag "can't verify statically — needs a live
`curl`/network trace," and produce that list of live checks separately for
you to run against the deployed instance.
