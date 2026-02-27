import type { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { requireInstructor } from '../middleware/auth.js';
import { AssignSessionSchema, CreateStudentSchema } from '../schemas/student.js';
import { supabase } from '../services/supabase.js';

export async function studentRoutes(fastify: FastifyInstance): Promise<void> {
  /** GET /students — List students linked to this instructor */
  fastify.get('/students', { preHandler: [requireInstructor] }, async (request, reply) => {
    const { data, error } = await supabase
      .from('instructor_students')
      .select(`
        student_id,
        created_at,
        users!instructor_students_student_id_fkey (
          id, email, psia_level, skill_level, notes, created_at
        )
      `)
      .eq('instructor_id', request.user.sub)
      .order('created_at', { ascending: false });

    if (error) {
      return reply.code(500).send({ error: 'Database error', message: error.message });
    }

    const students = data?.map((row) => ({
      ...(row.users as object),
      linkedAt: row.created_at,
    }));

    return reply.send({ students });
  });

  /** POST /students — Create and link a new student */
  fastify.post('/students', { preHandler: [requireInstructor] }, async (request, reply) => {
    const body = CreateStudentSchema.parse(request.body);

    // Create user record
    const studentId = uuidv4();
    const { error: userError } = await supabase.from('users').insert({
      id: studentId,
      email: body.email,
      role: 'student',
      skill_level: body.skillLevel,
      notes: body.notes,
    });

    if (userError) {
      return reply.code(500).send({ error: 'Database error', message: userError.message });
    }

    // Link to instructor
    const { error: linkError } = await supabase.from('instructor_students').insert({
      instructor_id: request.user.sub,
      student_id: studentId,
    });

    if (linkError) {
      return reply.code(500).send({ error: 'Database error', message: linkError.message });
    }

    return reply.code(201).send({ studentId, email: body.email });
  });

  /** GET /students/:id — Get student profile with session history */
  fastify.get('/students/:id', { preHandler: [requireInstructor] }, async (request, reply) => {
    const { id: studentId } = request.params as { id: string };

    // Verify instructor-student relationship
    const { data: link } = await supabase
      .from('instructor_students')
      .select('student_id')
      .eq('instructor_id', request.user.sub)
      .eq('student_id', studentId)
      .single();

    if (!link) {
      return reply.code(404).send({ error: 'Student not found' });
    }

    const { data: student, error } = await supabase
      .from('users')
      .select('id, email, psia_level, skill_level, notes, created_at')
      .eq('id', studentId)
      .single();

    if (error || !student) {
      return reply.code(404).send({ error: 'Student not found' });
    }

    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, focus_area, skill_level, status, created_at')
      .eq('student_id', studentId)
      .eq('instructor_id', request.user.sub)
      .order('created_at', { ascending: false });

    return reply.send({ student, sessions: sessions ?? [] });
  });

  /** POST /students/:id/sessions — Assign a session to a student */
  fastify.post(
    '/students/:id/sessions',
    { preHandler: [requireInstructor] },
    async (request, reply) => {
      const { id: studentId } = request.params as { id: string };
      const body = AssignSessionSchema.parse(request.body);

      const { error } = await supabase
        .from('sessions')
        .update({ student_id: studentId })
        .eq('id', body.sessionId)
        .eq('instructor_id', request.user.sub);

      if (error) {
        return reply.code(500).send({ error: 'Database error', message: error.message });
      }

      return reply.send({ success: true });
    },
  );
}
