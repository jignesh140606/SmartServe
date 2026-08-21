import jwt, { SignOptions } from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
}

const JWT_SECRET: string = process.env.JWT_SECRET || 'smartserve_jwt_secret_key_default_2026';
const JWT_EXPIRES_IN = '7d';

/**
 * Generate a signed JWT token containing userId and role with 7-day expiration.
 */
export function generateToken(payload: TokenPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
