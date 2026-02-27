-- Instructor Buddy — Dev Seed Data
-- Run AFTER schema.sql in development only.

-- Demo instructor
insert into users (id, email, role, psia_level) values
  ('00000000-0000-0000-0000-000000000001', 'instructor@demo.com', 'instructor', 'Level II');

-- Demo students
insert into users (id, email, role, skill_level, notes) values
  ('00000000-0000-0000-0000-000000000002', 'alice@demo.com', 'student', 'intermediate',
   'Working on carved turns. Good athletic stance.'),
  ('00000000-0000-0000-0000-000000000003', 'bob@demo.com', 'student', 'beginner',
   'First season. Focus on basic parallel turns.');

-- Link students to instructor
insert into instructor_students (instructor_id, student_id) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003');

-- Demo session
insert into sessions (id, instructor_id, student_id, focus_area, skill_level, status) values
  ('10000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000002',
   'carved_turns', 'intermediate', 'completed');
