import Jwt from "jsonwebtoken";
import { SecretKey,RefreshSecretKey } from "./config";

export function GenerateAccessToken(user: { email: string; id: number; }) {
    if (!SecretKey) throw new Error('Missing SECRET_KEY environment variable');
    return Jwt.sign( { email: user.email, id: user.id }, SecretKey, { expiresIn: '20m' })
}

export function GenerateRefreshToken(user: { email: string; id: number; }) {
     if (!RefreshSecretKey) throw new Error('Missing Refresh SECRET_KEY environment variable');
    return Jwt.sign({email: user.email, id: user.id } , RefreshSecretKey, { expiresIn: '7d' })
}