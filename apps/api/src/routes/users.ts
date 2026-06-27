import type { FastifyPluginAsync } from 'fastify';
import { changePasswordSchema, profileSchema } from '../auth/schemas.js';
import { hashPassword, verifyPassword } from '../auth/crypto.js';
const publicUser = (u:any) => ({ id:u.id, email:u.email, name:u.name, avatarUrl:u.avatarUrl, emailVerifiedAt:u.emailVerifiedAt, roles:u.roles?.map((r:any)=>r.name) ?? [] });
export const userRoutes: FastifyPluginAsync = async (app) => {
 app.get('/users/me', { preHandler:app.authenticate, schema:{ tags:['Users'] } }, async (req) => ({ user: publicUser(await app.prisma.user.findUniqueOrThrow({ where:{ id:req.user!.id }, include:{ roles:true }})) }));
 app.patch('/users/profile', { preHandler:app.authenticate, schema:{ tags:['Users'] } }, async (req) => { const input=profileSchema.parse(req.body); const user=await app.prisma.user.update({ where:{ id:req.user!.id }, data:input, include:{ roles:true }}); return { user:publicUser(user) }; });
 app.patch('/users/password', { preHandler:app.authenticate, schema:{ tags:['Users'] } }, async (req, reply) => { const input=changePasswordSchema.parse(req.body); const user=await app.prisma.user.findUniqueOrThrow({ where:{ id:req.user!.id }}); if (!await verifyPassword(input.currentPassword, user.passwordHash)) return reply.code(400).send({ message:'Current password is incorrect' }); await app.prisma.user.update({ where:{ id:user.id }, data:{ passwordHash:await hashPassword(input.newPassword) }}); await app.prisma.refreshToken.updateMany({ where:{ userId:user.id }, data:{ revokedAt:new Date() }}); return { ok:true }; });
 app.delete('/users/account', { preHandler:app.authenticate, schema:{ tags:['Users'] } }, async (req) => { await app.prisma.user.update({ where:{ id:req.user!.id }, data:{ isActive:false, email:`deleted-${req.user!.id}@deleted.local` }}); await app.prisma.session.updateMany({ where:{ userId:req.user!.id }, data:{ status:'REVOKED', revokedAt:new Date() }}); return { ok:true }; });
};
