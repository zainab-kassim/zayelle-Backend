// Machine-readable codes attached to 401/403 auth responses so the client can
// tell "your session expired, refresh and retry" apart from "your credentials
// are wrong, show the error". The frontend axios interceptor only runs its
// refresh-and-retry flow when it sees TOKEN_EXPIRED.
export const AuthErrorCode = {
  // No valid access token on the request — missing, malformed, or expired.
  // This is the only code the frontend interceptor treats as "refresh & retry".
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Wrong password, unknown email, or an email that only has a Google account.
  // Deliberately indistinguishable so we never reveal which accounts exist or
  // how they were created.
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Google access token was missing, invalid, expired, or minted for another app.
  GOOGLE_AUTH_FAILED: 'GOOGLE_AUTH_FAILED',

  // Google account's email address is not verified.
  GOOGLE_EMAIL_UNVERIFIED: 'GOOGLE_EMAIL_UNVERIFIED',

  // No refresh token cookie was sent.
  REFRESH_TOKEN_NOT_FOUND: 'REFRESH_TOKEN_NOT_FOUND',

  // Refresh token failed verification or is no longer in the session store.
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];
