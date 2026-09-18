// Codes on 401/403 auth responses so the client can tell "session expired,
// retry" apart from "wrong credentials, show the error" — the frontend
// interceptor only refreshes-and-retries on TOKEN_EXPIRED.
export const AuthErrorCode = {
  // missing/malformed/expired access token — the only code the frontend retries on
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // wrong password, unknown email, or Google-only account — kept
  // indistinguishable on purpose, don't reveal which accounts exist
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Google access token was missing, invalid, expired, or minted for another app.
  GOOGLE_AUTH_FAILED: 'GOOGLE_AUTH_FAILED',

  // Google account's email address is not verified.
  GOOGLE_EMAIL_UNVERIFIED: 'GOOGLE_EMAIL_UNVERIFIED',

  // No refresh token cookie was sent.
  REFRESH_TOKEN_NOT_FOUND: 'REFRESH_TOKEN_NOT_FOUND',

  // Refresh token failed verification or is no longer in the session store.
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',

  // Server misconfiguration — JWT_REFRESH_TOKEN_SECRET_KEY isn't set.
  REFRESH_TOKEN_SECRET_KEY_NOT_CONFIGURED:
    'REFRESH_TOKEN_SECRET_KEY_NOT_CONFIGURED',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];
