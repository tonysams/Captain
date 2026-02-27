import { z } from 'zod';

const PoseKeypointSchema = z.object({
  id: z.number().int().min(0).max(32),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  z: z.number(),
  visibility: z.number().min(0).max(1),
});

export const FrameUploadSchema = z.object({
  frameIndex: z.number().int().min(0),
  timestamp: z.number().min(0), // seconds
  imageBase64: z.string().min(1), // JPEG base64
  poseKeypoints: z.array(PoseKeypointSchema).length(33),
  context: z.object({
    skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),
    focusArea: z.enum([
      'carved_turns',
      'parallel_turns',
      'moguls',
      'powder',
      'athletic_stance',
      'edge_control',
      'pole_plant',
      'general',
    ]),
    previousNote: z.string().max(500).optional(),
  }),
});

export type FrameUploadInput = z.infer<typeof FrameUploadSchema>;
