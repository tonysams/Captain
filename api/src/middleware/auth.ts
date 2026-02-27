import type { FastifyRequest, FastifyReply } from 'fastify';

export interface JWTPayload {
  sub: string; // user id
  email: string;
  role: 'instructor' | 'student';
  iat: number;
  exp: number;
}

declare module 'fastify' {
  interface FastifyRequest {
    user: JWTPayload;
  }
}

export async function verifyJWT(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

export async function requireInstructor(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await verifyJWT(request, reply);
  if (request.user?.role !== 'instructor') {
    reply.code(403).send({ error: 'Forbidden', message: 'Instructor access required' });
  }
}
