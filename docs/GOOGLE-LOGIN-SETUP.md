# Google-only sign-in

The website now uses Supabase Google OAuth with PKCE. Authentication is Google-only; the mock identity selector and mock authentication code have been removed. APP_MODE cannot enable mock login. Live checkout remains disabled. No commerce SQL is needed simply to sign in: Supabase Auth manages authenticated users.

## Required provider setup

The project's public Auth settings reported Google disabled on 16 October 2026. The website cannot enable a provider using a public API key.

1. In Google Cloud, configure the OAuth consent screen and create an OAuth client of type Web application. Configure the app name FIXIHUB, contact details and authorised production domain. Publish for the intended audience; while in testing, add intended test users.
2. Add this exact Google authorised redirect URI:
   `https://nnognzvpuojzifidmqzm.supabase.co/auth/v1/callback`
3. In Supabase Authentication → Sign In / Providers → Google, enable Google and enter the OAuth Client ID and Client Secret. Keep the secret in Supabase; never put it in NEXT_PUBLIC environment variables or browser code. Use only basic sign-in scopes; do not enable the skip-nonce-check option.
4. Disable Email sign-in, anonymous sign-in and any other providers for a Google-only project. Existing sessions from other providers are rejected by this website's login presentation.
5. In Authentication → URL Configuration, add the exact allowed development redirect:
   `http://127.0.0.1:3000/auth/callback`
   If localhost is used separately, also allow `http://localhost:3000/auth/callback`.
6. Set Site URL to the real production HTTPS origin and allow `https://YOUR-DOMAIN/auth/callback`. Replace YOUR-DOMAIN with the launch domain; do not use broad wildcard redirects in production.
7. Deploy with NEXT_PUBLIC_APP_MODE=live plus the existing public project URL and publishable key. Rebuild after changing public environment variables.

## Behaviour and boundaries

- Google provides identity, name, available profile image and account email. Users can edit their FIXIHUB display name without changing Google.
- Browser auth state is verified with Supabase getUser before showing a live profile. Callback codes are exchanged once and removed from history. Errors are shown without echoing provider-supplied text.
- Session refresh is handled by Supabase. Local sign-out clears this browser's Supabase session; it does not sign out of Google.
- Every live user currently receives customer UI access. User metadata never grants elevated permissions. Staff/admin live roles require the forthcoming server-managed role schema and RLS; do not infer access from email or mock role selections.
- Saved delivery addresses and commerce remain disabled in live mode until their database and RLS are connected. Mock order data is never imported into real accounts.
- Client UI role checks are not a security boundary. Every future server operation must validate authentication and enforce RLS/permissions independently.

## Verification

Automated tests cover Google profile mapping, rejection of non-Google identities, metadata privilege escalation, PKCE redirect construction, unavailable-provider recovery and callback cancellation. Completing a real Google account sign-in requires the provider setup above and user consent in the browser. Also verify return login, refresh, logout and profile-name saving after configuring Google.

References: https://supabase.com/docs/guides/auth/social-login/auth-google and https://supabase.com/docs/guides/auth/redirect-urls
