# Sign-in options

| Option | Works now | Needs |
|---|---|---|
| Email + password | Yes | — |
| One-time code by email | Yes (codes appear in the server log until SMTP is set) | SMTP for real delivery (`SMTP_HOST` …) |
| One-time code by WhatsApp (when a phone number is typed) | Logged only | WhatsApp provider (docs/whatsapp.md), template `ailit_login_code` |
| Google | Hidden until configured | Google OAuth client (below) |

All options create the same session as a password login, are recorded in the audit log (`login`, with the
method), and refuse suspended accounts.

## One-time codes

- 6 digits, valid 10 minutes, single use; only a hash is stored.
- At most 3 codes per account per 15 minutes; 5 wrong tries end the code.
- The request answers the same whether or not an account exists, so it cannot be used to find accounts.

## Google sign-in

Google signs in **existing** accounts whose email matches a verified Google email (school-issued Google
accounts work too). New users sign up first, because under-18s need a birth date and parent consent; after
that they can use Google. The first Google sign-in links that Google account; a different Google account
with the same email is refused.

To switch it on:

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → *Web application*.
2. Authorised redirect URI: `https://ailearning.impact.id/api/users/google/callback`
   (and `http://localhost:3000/api/users/google/callback` for local testing).
3. OAuth consent screen: app name "AI Literacy · Impact Thinklab", support email, scopes `openid email profile`.
4. Put the client ID and secret in `.env.selfhost` as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, restart.
   The "Sign in with Google" button appears on the sign-in page.
