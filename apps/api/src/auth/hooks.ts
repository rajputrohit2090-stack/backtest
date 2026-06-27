import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { verifyJwt } from './crypto.js';
declare module 'fastify' { interface FastifyRequest { user?: { id:string; email:string; roles:string[]; sessionId:string } } interface FastifyInstance { authenticate:(r:FastifyRequest,p:FastifyReply)=>Promise<void>; requireRole:(roles:string[])=>(r:FastifyRequest,p:FastifyReply)=>Promise<void>; } }
export const authPlugin = fp(async (app) => {
 app.decorate('authenticate', async (req, reply) => { const header = req.headers.authorization; const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined; if (!token) return reply.code(401).send({ message:'Authentication required' }); try { req.user = verifyJwt(token); } catch { return reply.code(401).send({ message:'Invalid or expired token' }); } });
 app.decorate('requireRole', (roles) => async (req, reply) => { await app.authenticate(req, reply); if (reply.sent) return; if (!req.user?.roles.some((r) => roles.includes(r))) return reply.code(403).send({ message:'Insufficient permissions' }); });
});
