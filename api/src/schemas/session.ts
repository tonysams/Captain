import { z } from 'zod';

export const CreateSessionSchema = z.object({
  studentId: z.string().uuid().optional(),
  focusArea: z
    .enum([
      'carved_turns',
      'parallel_turns',
      'moguls',
      'powder',
      'athletic_stance',
      'edge_control',
      'pole_plant',
      'general',
    ])
    .default('general'),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
});

export const AddNoteSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;
export type AddNoteInput = z.infer<typeof AddNoteSchema>;
