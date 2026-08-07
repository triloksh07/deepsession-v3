# Task: Static OAuth/OIDC Implementation Audit — DeepSession MCP Connector

## Scope and constraints

- **Static analysis only.** Read and reason about the code. Do not run the
  servers, do not make HTTP requests, do not run curl, do not execute any
  test scripts, do not start local dev servers, and do not attempt to
  connect to any deployed instance, tunnel URL, or `.well-known` endpoint.
- You have two repos: `deepsession-mcp-server` (Express MCP server) and
  `deepsession-mpt` (Next.js main app hosting the OIDC/authorization layer).
- Use `mcp-oauth-spec-audit-checklist.md` (attached) as your checklist.
  Work through sections A–G in order.

## Files to inspect (do not scan the rest of the codebase)

Limit inspection to the files below. If a file has moved or been renamed,
locate its current equivalent by responsibility (noted in parentheses) —
don't expand scope beyond the auth/OAuth surface to do so.

### `deepsession-mcp-server` repo
- `index.ts` (Express entrypoint — CORS, probe interceptors, protected
  resource metadata route, MCP request routing/mounting)
- `middleware/auth.ts` (bearer token validation)
- `mcpServer.ts` (MCP server factory — check only for anything auth-context
  related, e.g. how `userContext`/uid gets threaded into tool execution)
- `package.json` (confirm actual installed auth/JWT-related deps match what
  the code imports — e.g. no lingering `jwt-decode` if it's meant to be gone)
- Any file under a `config/` or `lib/` directory that sets up env vars
  consumed by the above (e.g. `MCP_JWT_SECRET`, `NEXTJS_AUTH_SERVER`)

absolute paths for mcp server repo:
- /mnt/5E507BA2507B7F97/Code-Projects/lang-graph/workflow/deepsession-mcp/src/middleware/auth.ts
- /mnt/5E507BA2507B7F97/Code-Projects/lang-graph/workflow/deepsession-mcp/src/index.ts
- /mnt/5E507BA2507B7F97/Code-Projects/lang-graph/workflow/deepsession-mcp/src/config/firebaseAdmin.ts
- /mnt/5E507BA2507B7F97/Code-Projects/lang-graph/workflow/deepsession-mcp/src/* // <only if required>

### `deepsession-mpt` (main app) repo
- `app/.well-known/oauth-authorization-server/route.ts` (AS metadata)
- `app/.well-known/openid-configuration/route.ts` (if it exists — OIDC
  discovery variant)
- `app/api/oauth/token/route.ts` (token endpoint)
- `app/api/oauth/register/route.ts` (DCR endpoint, if present)
- `app/(public)/oauth/authorize/page.tsx` (authorization/consent page)
- `app/(public)/oauth/exchange/page.tsx` (code hand-back page)
- `lib/firebaseAdmin.ts`
- `lib/firebase.ts` (or equivalent — confirm how `db`/`auth` are
  initialized, only insofar as it affects token/uid handling above)
- `package.json` (confirm `jose` or equivalent signing library is actually
  present if the code imports it)
- Any `.env.example` or documented env var list, to cross-reference against
  what section F of the checklist requires to match between repos

### Explicitly out of scope
Do not inspect UI components unrelated to auth, session-tracking tool logic
(`start_session`/`pause_session`/etc. in `mcpServer.ts`'s registered tools),
Firestore data model files unrelated to `oauth_codes`, or any file under
`app/api/oauth/code/route.ts` beyond confirming whether it still exists and
is still unreferenced (it was flagged as orphaned in a prior pass — just
verify current status, don't analyze its internals).

## What to produce

A single findings report, structured as:

### 1. Per-checklist-item results
For every checkbox item in sections A–G, one of:
- **Compliant** — cite the exact file and line range that satisfies it.
- **Non-compliant** — cite the exact file and line range where the gap is,
  and state specifically what's missing or wrong (not just "doesn't look
  right" — name the missing field, the wrong check, the unvalidated value).
- **Cannot verify statically** — for anything that depends on runtime
  behavior, live config values (env vars, deployed URLs), or network
  reachability. List these separately at the end under "Needs live
  verification" as a set of concrete checks (e.g. "curl
  `<server>/.well-known/oauth-protected-resource` and confirm the `resource`
  field matches exactly what's hardcoded/derived in
  `middleware/auth.ts:23`"). Do not attempt these yourself — just specify
  them precisely enough that a human can run them in one step.

### 2. Cross-file consistency check (maps to checklist §F)
Trace every place the MCP server's canonical URI, `resource`/`aud` value,
and `issuer`/`iss` value are read, written, or compared, across both repos.
List them as a table: file:line, what string/expression it uses, and
whether it's guaranteed to match the others by construction or only by
convention (i.e., could silently drift). Flag any that rely on an env var
being set consistently across two separate deployments — call out
explicitly which env vars must match between the two repos and where each
is consumed.

### 3. Flow-shape summary
Describe, in your own words based only on what the code actually does (not
what comments or variable names claim it does), the literal sequence of
requests/redirects that would occur for a real client. Compare this
sequence against the spec's expected sequence (checklist section A–D) and
flag the first point where they diverge, if any.

### 4. Confidence-ranked list of likely root causes
Given that local manual testing succeeds but real MCP clients (Claude.ai,
ChatGPT) fail to connect, rank the non-compliant findings from #1 by how
likely each is to be the actual current blocker — reasoning from the fact
that whatever's broken must be something the local test tool's flow
doesn't exercise (since that tool works). Don't assume any specific prior
fix was completed correctly — verify from current code state only.

## What not to do

- Don't modify any files.
- Don't assume anything about the codebase from any prior conversation
  summary, changelog, or commit message — verify every claim against the
  current file contents directly.
- Don't skip an item because it "looks standard" — cite it anyway.
- Don't propose code fixes in this pass; this is an audit/report only. Fixes
  come as a separate follow-up task once the report is reviewed.
