import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { requireInstructor } from '../middleware/auth.js';
import { FrameUploadSchema } from '../schemas/frame.js';
import { analyzeFrame } from '../services/claude.js';
import { compressImageBase64 } from '../services/imageProcessor.js';
import { supabase, uploadFrameImage } from '../services/supabase.js';

const MAX_FRAMES_PER_SESSION = parseInt(process.env.MAX_FRAMES_PER_SESSION ?? '15', 10);

export async function frameRoutes(fastify: FastifyInstance): Promise<void> {
  /** POST /sessions/:id/frames — Upload frame + pose data, run Claude analysis */
  fastify.post(
    '/sessions/:id/frames',
    { preHandler: [requireInstructor] },
    async (request, reply) => {
      const { id: sessionId } = request.params as { id: string };

      // Verify session belongs to this instructor
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('id, instructor_id, status, focus_area, skill_level')
        .eq('id', sessionId)
        .eq('instructor_id', request.user.sub)
        .single();

      if (sessionError || !session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      // Check frame limit
      const { count } = await supabase
        .from('frames')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId);

      if ((count ?? 0) >= MAX_FRAMES_PER_SESSION) {
        return reply.code(429).send({
          error: 'Frame limit reached',
          message: `Maximum ${MAX_FRAMES_PER_SESSION} frames per session`,
          limit: MAX_FRAMES_PER_SESSION,
        });
      }

      const body = FrameUploadSchema.parse(request.body);

      // Update session status to processing
      await supabase.from('sessions').update({ status: 'processing' }).eq('id', sessionId);

      // Compress image
      const compressedBase64 = await compressImageBase64(body.imageBase64);
      const imageBuffer = Buffer.from(compressedBase64, 'base64');

      // Upload image to Supabase Storage
      let imageUrl: string | undefined;
      try {
        imageUrl = await uploadFrameImage(sessionId, body.frameIndex, imageBuffer);
      } catch (err) {
        console.warn('[Frames] Storage upload failed, proceeding without URL:', err);
      }

      // Insert frame record
      const frameId = uuidv4();
      const { error: frameError } = await supabase.from('frames').insert({
        id: frameId,
        session_id: sessionId,
        frame_index: body.frameIndex,
        timestamp: body.timestamp,
        image_url: imageUrl,
        pose_json: body.poseKeypoints,
      });

      if (frameError) {
        return reply.code(500).send({ error: 'Database error', message: frameError.message });
      }

      // Run Claude analysis
      let coaching;
      try {
        coaching = await analyzeFrame({
          imageBase64: compressedBase64,
          poseKeypoints: body.poseKeypoints,
          skillLevel: body.context.skillLevel,
          focusArea: body.context.focusArea,
          previousNote: body.context.previousNote,
        });
      } catch (err) {
        console.error('[Frames] Claude analysis failed:', err);
        await supabase.from('sessions').update({ status: 'failed' }).eq('id', sessionId);
        return reply.code(502).send({
          error: 'Analysis failed',
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }

      // Store analysis result
      const analysisId = uuidv4();
      await supabase.from('analysis_results').insert({
        id: analysisId,
        frame_id: frameId,
        primary_observation: coaching.primaryObservation,
        cue: coaching.cue,
        overlays_json: coaching.overlays,
        model_version: 'claude-sonnet-4-6',
      });

      // Update session status
      await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId);

      return reply.code(201).send({
        frameId,
        analysisId,
        coaching,
      });
    },
  );
}
