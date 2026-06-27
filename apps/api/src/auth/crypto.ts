import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import { config } from '../config.js';
export const sanitizeEmail = (email: string) => email.trim().toLowerCase();
export const randomToken = () => randomBytes(32).toString('base64url');
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, encoded: string) => bcrypt.compare(password, encoded);
export function signJwt(payload: object, ttlSeconds = config.JWT_ACCESS_TTL_SECONDS) { return jwt.sign(payload, config.JWT_SECRET, { expiresIn: ttlSeconds, issuer: 'backtest-ai', algorithm: 'HS256' }); }
export function verifyJwt<T>(token: string): T { return jwt.verify(token, config.JWT_SECRET, { issuer: 'backtest-ai', algorithms: ['HS256'] }) as T; }
