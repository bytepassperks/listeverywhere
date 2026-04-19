import { FastifyRequest, FastifyReply } from 'fastify';

interface JwtPayload {
  id: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    userEmail?: string;
  }
}

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const decoded = await request.jwtVerify<JwtPayload>();
    request.userId = decoded.id;
    request.userEmail = decoded.email;
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}
