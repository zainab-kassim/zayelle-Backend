import 'dotenv/config';

export const SecretKey = process.env.JWT_SECRET_KEY;
export const RefreshSecretKey = process.env.JWT_REFRESH_TOKEN_SECRET_KEY;
export const GoogleClientId = process.env.GOOGLE_CLIENT_ID;
export const AppleServicesId = process.env.APPLE_SERVICES_ID;
