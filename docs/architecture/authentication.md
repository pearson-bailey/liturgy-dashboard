# Authentication and access

> Status: Active
> Scope: Single-organization Supabase Auth
> Canonical for: Identity, invitation-only access, cookies, auth routes

## Rules and implementation

- Public signup and anonymous sign-in MUST remain disabled in Supabase itself;
  omitting a signup screen alone is insufficient. All invited users have equal
  read and synchronization access in this single-organization MVP.
- The email provider MUST remain enabled. In the pinned CLI,
  `[auth].enable_signup = false` blocks registration while
  `[auth.email].enable_signup = true` keeps email login available. See the
  [upstream clarification](https://github.com/supabase/supabase/issues/40582).
- Every application service entry point verifies the user through Supabase
  `auth.getUser()`. Route Handlers independently enforce authentication; page
  redirects are not API authorization. Public sign-in, recovery-request, and
  invitation callback boundaries are intentional exceptions.
- All POST operations require a same-origin `Origin` header, including sign-in.
- `src/proxy.ts` delegates session-cookie refresh through the auth service to the
  Supabase SSR integration. Server rendering reads cookies; writable HTTP contexts
  propagate refreshed cookies. Authenticated responses MUST NOT be publicly cached.
  Session cookies are HttpOnly and SameSite=Lax. The integration retries a rejected
  GET once if local PostgREST reports a newly issued JWT in the future; writes and
  other authentication failures are never retried by this adapter.
- Application tables grant invited authenticated users SELECT only. The server
  secret client is reserved for sync/reparse writes after service authentication.
- Browser components use fetch to `/api/auth/<operation>`; no browser Supabase SDK
  or public credentials are needed. Provider initialization stays in `lib`.

## Flows

`sign-in`, `sign-out`, `forgot-password`, and `update-password` are POST operations.
Password updates require a verified session and a minimum of 12 characters.
Recovery requests return the same success message for known and unknown accounts.
Supabase provides auth rate limiting; invalid credentials and expired sessions
receive safe errors.

Invitation/recovery templates use `/auth/confirm?token_hash=…&type=invite|recovery`.
The callback verifies the token server-side and sends the user to `/update-password`.
It also supports PKCE authorization codes; a recovery type sends those sessions
to `/update-password`, while other code callbacks go to `/dashboard`. App-initiated
recovery requests explicitly supply `/auth/confirm?type=recovery` on the requesting
origin, which must be allowlisted. The password form requires matching confirmation.
Redirect destinations are fixed; arbitrary user-supplied redirect URLs are not accepted.
Expired/reused/invalid links return to sign-in with guidance for obtaining a new link.

## Setup and limits

Invite real users using Supabase's administrative invitation flow, outside this
application. Configure the deployed Site URL and install the versioned invite and
recovery email templates when using hosted Supabase. Local mail is captured by
Mailpit and never sent to real recipients. No public signup endpoint is implemented.
Follow [hosted authentication setup](../workflows/hosted-authentication.md) for the
exact URLs, template configuration, SMTP requirements, and deployed verification.

The application relies on the Supabase project's invitation-only settings as its
membership boundary. Do not share this Auth project with unrelated applications
that allow registration. Multi-organization roles would require a new design.

See [local development](../workflows/local-development.md),
[database](database.md), and the official [Supabase SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client).
