import { z } from 'zod';

export const CreateStudentSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('beginner'),
  notes: z.string().max(1000).optional(),
});

export const AssignSessionSchema = z.object({
  sessionId: z.string().uuid(),
});

export type CreateStudentInput = z.infer<typeof CreateStudentSchema>;
export type AssignSessionInput = z.infer<typeof AssignSessionSchema>;
