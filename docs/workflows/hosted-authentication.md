# Hosted invitations and password recovery

The deployed application is https://liturgy-dashboard.vercel.app. Configure the
Supabase project referenced by that Vercel deployment's `SUPABASE_URL`.

## Supabase dashboard configuration

1. Authentication > URL Configuration: set Site URL to
   `https://liturgy-dashboard.vercel.app` (no trailing slash).
2. Add the following Redirect URLs:
   - `https://liturgy-dashboard.vercel.app/auth/confirm`
   - `https://liturgy-dashboard.vercel.app/auth/confirm?type=recovery`
3. Authentication > Email > Templates > Reset password: replace the email body
   with the entire contents of `supabase/templates/recovery.html` and save.
4. In the Invite user template, install `supabase/templates/invite.html` and save.
5. Enable email/password authentication; disable public signup and anonymous login.
6. Configure and test custom SMTP under Authentication > Email > SMTP Settings.
   Review Authentication > Rate Limits. The default mail provider is restricted
   to project team recipients and two authentication emails per hour.

The reset template must link directly to the app:

```html
<h2>Reset your Liturgy Dashboard password</h2>
<p>
  <a
    href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery"
  >
    Choose a new password
  </a>
</p>
```

Do not use `{{ .ConfirmationURL }}` for this flow. A default Supabase dashboard
recovery link may redirect to the site's root with a session in the URL fragment;
the server cannot read that fragment. The custom template instead lets the app
verify the one-time token on the server, set session cookies, and redirect to
`/update-password`. It also works when opened in a different browser.

Template changes affect new emails only. Request a fresh link after saving.
Supabase dashboard changes need no Vercel redeployment. Application code changes
must be deployed separately. A migration push does not install hosted templates.

## Verify the deployed flow

1. Open `/forgot-password` and enter an existing invited user's email.
2. Follow the newly received link. Expect `/update-password`, not the dashboard.
3. Enter and confirm a new password of at least 12 characters; save.
4. Sign out, then sign in using the new password.
5. An expired or reused link should offer a new reset request.

Keep auth links and tokens out of support messages and logs. If no email arrives,
check Supabase Auth logs and the SMTP provider's delivery logs. Email rate limits
and SMTP configuration must be resolved in Supabase; redeploying the app cannot
fix them. Vercel deployment protection must also permit your intended users.

For additional preview hosts, use a separate Supabase preview project or configure
its Site URL deliberately: these token templates use the configured Site URL.
App-initiated recovery requests additionally provide an explicit recovery callback
for the requesting origin; allowlist that exact URL if testing the standard PKCE
email flow. PKCE requires the browser that initiated the request.

Sources: [Supabase password recovery](https://supabase.com/docs/guides/auth/passwords),
[email templates](https://supabase.com/docs/guides/auth/auth-email-templates),
[SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
