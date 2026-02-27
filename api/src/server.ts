import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { sessionRoutes } from './routes/sessions.js';
import { frameRoutes } from './routes/frames.js';
import { studentRoutes } from './routes/students.js';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

// Plugins
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN ?? '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

await fastify.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev-secret-change-in-production',
});

await fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
  keyGenerator: (request) => request.user?.sub ?? request.ip,
});

// Routes
await fastify.register(sessionRoutes);
await fastify.register(frameRoutes);
await fastify.register(studentRoutes);

// Health check
fastify.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: '1.0.0',
}));

// Analytics: cost dashboard endpoint
fastify.get(
  '/analytics/costs',
  {
    preHandler: [
      async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch {
          reply.code(401).send({ error: 'Unauthorized' });
        }
      },
    ],
  },
  async (request) => {
    const { supabase } = await import('./services/supabase.js');
    const { estimateSessionCost } = await import('./services/claude.js');

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, created_at')
      .eq('instructor_id', (request as any).user.sub)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const sessionIds = sessions?.map((s) => s.id) ?? [];

    let totalFrames = 0;
    if (sessionIds.length > 0) {
      const { count } = await supabase
        .from('frames')
        .select('id', { count: 'exact', head: true })
        .in('session_id', sessionIds);
      totalFrames = count ?? 0;
    }

    return {
      period: '30d',
      sessionCount: sessionIds.length,
      totalFramesAnalyzed: totalFrames,
      estimatedCostUsd: estimateSessionCost(totalFrames),
      avgFramesPerSession:
        sessionIds.length > 0 ? Math.round(totalFrames / sessionIds.length) : 0,
    };
  },
);

const PORT = parseInt(process.env.PORT ?? '3000', 10);

try {
  await fastify.listen({ port: PORT, host: '0.0.0.0' });
  console.log(`\n🎿 Instructor Buddy API running on port ${PORT}\n`);
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
