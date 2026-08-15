import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export interface TokenPayload {
  userId: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload) {
  return jwt.sign(
    payload,
    ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
    } as jwt.SignOptions
  );
}

export function signRefreshToken(payload: TokenPayload) {
  return jwt.sign(
    payload,
    REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d',
    } as jwt.SignOptions
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}