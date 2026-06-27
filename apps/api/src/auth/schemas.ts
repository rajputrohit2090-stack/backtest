import { z } from 'zod';
const password = z.string().min(12).max(128).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/);
export const registerSchema = z.object({ email: z.string().email(), password, name: z.string().trim().min(1).max(100).optional() });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1), rememberMe: z.boolean().default(false) });
export const tokenSchema = z.object({ token: z.string().min(20) });
export const forgotSchema = z.object({ email: z.string().email() });
export const resetSchema = z.object({ token: z.string().min(20), password });
export const profileSchema = z.object({ name: z.string().trim().min(1).max(100).optional(), avatarUrl: z.string().url().max(2048).optional() });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });
