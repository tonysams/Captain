import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { requireInstructor } from '../middleware/auth.js';
import { AddNoteSchema, CreateSessionSchema } from '../schemas/session.js';
import { supabase } from '../services/supabase.js';
import { estimateSessionCost } from '../services/claude.js';

export async function sessionRoutes(fastify: FastifyInstance): Promise<void> {
  /** POST /sessions — Create a new analysis session */
  fastify.post('/sessions', { preHandler: [requireInstructor] }, async (request, reply) => {
    const body = CreateSessionSchema.parse(request.body);
    const instructorId = request.user.sub;

    const sessionId = uuidv4();

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        id: sessionId,
        instructor_id: instructorId,
        student_id: body.studentId ?? null,
        focus_area: body.focusArea,
        skill_level: body.skillLevel,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      return reply.code(500).send({ error: 'Database error', message: error.message });
    }

    return reply.code(201).send({ session: data });
  });

  /** GET /sessions/:id — Get session with frames and overlays */
  fastify.get('/sessions/:id', { preHandler: [requireInstructor] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(`
        *,
        frames (
          *,
          analysis_results (*)
        ),
        session_notes (*)
      `)
      .eq('id', id)
      .eq('instructor_id', request.user.sub)
      .single();

    if (sessionError || !session) {
      return reply.code(404).send({ error: 'Not found' });
    }

    const frameCount = session.frames?.length ?? 0;
    const estimatedCost = estimateSessionCost(frameCount);

    return reply.send({ session, estimatedCostUsd: estimatedCost });
  });

  /** GET /sessions/:id/report — Generate shareable session report */
  fastify.get(
    '/sessions/:id/report',
    { preHandler: [requireInstructor] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const { data: session, error } = await supabase
        .from('sessions')
        .select(`
          *,
          frames (
            id, frame_index, timestamp, image_url,
            analysis_results (primary_observation, cue, overlays_json, model_version, created_at)
          ),
          session_notes (*),
          users!sessions_student_id_fkey (email)
        `)
        .eq('id', id)
        .eq('instructor_id', request.user.sub)
        .single();

      if (error || !session) {
        return reply.code(404).send({ error: 'Not found' });
      }

      const report = {
        reportId: uuidv4(),
        sessionId: id,
        generatedAt: new Date().toISOString(),
        instructor: { id: request.user.sub, email: request.user.email },
        student: session.users,
        focusArea: session.focus_area,
        skillLevel: session.skill_level,
        frameCount: session.frames?.length ?? 0,
        frames: session.frames,
        notes: session.session_notes,
        shareUrl: `${process.env.APP_URL ?? 'https://instructorbuddy.app'}/report/${id}`,
      };

      return reply.send({ report });
    },
  );

  /** POST /sessions/:id/notes — Add instructor note */
  fastify.post(
    '/sessions/:id/notes',
    { preHandler: [requireInstructor] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = AddNoteSchema.parse(request.body);

      const { data, error } = await supabase
        .from('session_notes')
        .insert({
          id: uuidv4(),
          session_id: id,
          author_id: request.user.sub,
          content: body.content,
        })
        .select()
        .single();

      if (error) {
        return reply.code(500).send({ error: 'Database error', message: error.message });
      }

      return reply.code(201).send({ note: data });
    },
  );
}
