# Instructor Buddy — Project Memory

## Project Overview
Ski coaching mobile app: record student skiing → MediaPipe pose estimation → Claude vision analysis → annotated playback.

## Repo Structure
```
/mobile   Expo SDK 52 React Native app
/api      Node.js + Fastify backend
/supabase schema.sql + seed.sql
README.md
```

## Tech Stack
- Mobile: Expo SDK 52, expo-router v4 (file-based nav)
- Camera: expo-camera (60fps)
- Frame extraction: ffmpeg-kit-react-native
- Pose estimation: react-native-mediapipe (BlazePose 33 landmarks) — mock in dev
- AI: claude-sonnet-4-6 (vision) via backend API
- Overlay rendering: @shopify/react-native-skia (GPU canvas)
- State: Zustand (useSession store)
- Backend: Node.js + Fastify + Zod validation
- DB/Auth/Storage: Supabase
- Offline queue: expo-sqlite

## Key Files
- `mobile/hooks/usePoseEstimation.ts` — mock BlazePose; production block commented in
- `mobile/hooks/useFrameExtraction.ts` — FFmpegKit + intelligent frame selection algorithm
- `mobile/hooks/useSession.ts` — Zustand store for session/frame state
- `api/src/services/claude.ts` — Claude API + response cache by pose hash
- `api/src/prompts/coachingPrompt.ts` — PSIA system prompt
- `supabase/schema.sql` — full DB schema with RLS

## Claude Response Format
```json
{
  "primaryObservation": { "text": "...", "confidence": 0.0-1.0 },
  "overlays": [{ "type": "angle|line|arrow|circle|text", "points": [...], "label": "...", "color": "#hex", "x": 0.0-1.0, "y": 0.0-1.0 }],
  "cue": "Single actionable coaching cue"
}
```
Overlays use normalized coordinates (0–1); OverlayCanvas scales to pixel positions.

## Design Philosophy
- Neurodivergent-first: 1-2 observations per frame max, cues ≤ 12 words
- Offline-first: MediaPipe runs on-device; Claude sync queued via SQLite
- Cost controls: max 15 frames/session, image compression to <200KB, pose hash cache

## Setup Requirements
- Supabase project with schema.sql applied
- Anthropic API key in api/.env
- Native dev build (not Expo Go) for FFmpegKit + MediaPipe
- MediaPipe model file: pose_landmarker_lite.task in mobile/assets/models/

## Phase Status
- Phases 1-3: Complete (core pipeline, scrubber, student profiles, sharing, offline)
- Phase 4: Not started (performance, accessibility, App Store)
