-- Instructor Buddy — Supabase Schema
-- Run this in the Supabase SQL editor to set up the database.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
create type user_role as enum ('instructor', 'student');
create type skill_level_enum as enum ('beginner', 'intermediate', 'advanced', 'expert');
create type focus_area_enum as enum (
  'carved_turns', 'parallel_turns', 'moguls', 'powder',
  'athletic_stance', 'edge_control', 'pole_plant', 'general'
);
create type session_status as enum ('pending', 'processing', 'completed', 'failed');

create table users (
  id          uuid primary key default uuid_generate_v4(),
  email       text not null unique,
  role        user_role not null default 'instructor',
  psia_level  text,                        -- e.g. "Level I", "Level II", "Level III"
  skill_level skill_level_enum,            -- used for students
  notes       text,                        -- instructor notes about student
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- INSTRUCTOR ↔ STUDENT RELATIONSHIPS
-- ─────────────────────────────────────────
create table instructor_students (
  instructor_id uuid not null references users(id) on delete cascade,
  student_id    uuid not null references users(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (instructor_id, student_id)
);

-- ─────────────────────────────────────────
-- SESSIONS
-- ─────────────────────────────────────────
create table sessions (
  id            uuid primary key default uuid_generate_v4(),
  instructor_id uuid not null references users(id) on delete cascade,
  student_id    uuid references users(id) on delete set null,
  video_url     text,
  focus_area    focus_area_enum not null default 'general',
  skill_level   skill_level_enum not null default 'intermediate',
  status        session_status not null default 'pending',
  created_at    timestamptz not null default now()
);

create index sessions_instructor_id_idx on sessions(instructor_id);
create index sessions_student_id_idx on sessions(student_id);

-- ─────────────────────────────────────────
-- FRAMES
-- ─────────────────────────────────────────
create table frames (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references sessions(id) on delete cascade,
  frame_index integer not null,
  timestamp   numeric not null,  -- seconds into the video
  image_url   text,
  pose_json   jsonb not null,    -- array of 33 MediaPipe keypoints
  created_at  timestamptz not null default now(),
  unique (session_id, frame_index)
);

create index frames_session_id_idx on frames(session_id);

-- ─────────────────────────────────────────
-- ANALYSIS RESULTS
-- ─────────────────────────────────────────
create table analysis_results (
  id                  uuid primary key default uuid_generate_v4(),
  frame_id            uuid not null references frames(id) on delete cascade,
  primary_observation jsonb not null,  -- { text, confidence }
  cue                 text not null,
  overlays_json       jsonb not null,  -- array of overlay objects
  model_version       text not null default 'claude-sonnet-4-6',
  created_at          timestamptz not null default now(),
  unique (frame_id)   -- one analysis per frame
);

create index analysis_results_frame_id_idx on analysis_results(frame_id);

-- ─────────────────────────────────────────
-- SESSION NOTES
-- ─────────────────────────────────────────
create table session_notes (
  id         uuid primary key default uuid_generate_v4(),
  session_id uuid not null references sessions(id) on delete cascade,
  author_id  uuid not null references users(id) on delete cascade,
  content    text not null,
  created_at timestamptz not null default now()
);

create index session_notes_session_id_idx on session_notes(session_id);

-- ─────────────────────────────────────────
-- STORAGE BUCKET
-- ─────────────────────────────────────────
-- Create this via Supabase dashboard or CLI:
-- supabase storage create instructor-buddy --public
-- Or via SQL:
insert into storage.buckets (id, name, public)
values ('instructor-buddy', 'instructor-buddy', true)
on conflict (id) do nothing;

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────
alter table users enable row level security;
alter table sessions enable row level security;
alter table frames enable row level security;
alter table analysis_results enable row level security;
alter table session_notes enable row level security;
alter table instructor_students enable row level security;

-- Users: can read/update own record
create policy "users_own" on users
  for all using (id = auth.uid());

-- Sessions: instructors see their own sessions
create policy "sessions_instructor" on sessions
  for all using (instructor_id = auth.uid());

-- Students see sessions they are assigned to
create policy "sessions_student" on sessions
  for select using (student_id = auth.uid());

-- Frames: visible to session instructor
create policy "frames_instructor" on frames
  for all using (
    exists (
      select 1 from sessions s
      where s.id = frames.session_id and s.instructor_id = auth.uid()
    )
  );

-- Analysis results: visible to session instructor
create policy "analysis_instructor" on analysis_results
  for all using (
    exists (
      select 1 from frames f
      join sessions s on s.id = f.session_id
      where f.id = analysis_results.frame_id and s.instructor_id = auth.uid()
    )
  );

-- Session notes: visible to session instructor
create policy "notes_instructor" on session_notes
  for all using (
    exists (
      select 1 from sessions s
      where s.id = session_notes.session_id and s.instructor_id = auth.uid()
    )
  );

-- Instructor-student links: instructor sees their own links
create policy "instructor_students_instructor" on instructor_students
  for all using (instructor_id = auth.uid());
