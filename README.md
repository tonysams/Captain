# Instructor Buddy 🎿

AI-powered ski coaching analysis for PSIA-certified instructors.

Record student skiing → on-device pose estimation → Claude vision analysis → annotated playback with coaching cues.

---

## Architecture

```
/mobile    Expo React Native app (iOS + Android)
/api       Node.js + Fastify backend
/supabase  Database schema + seed data
```

### Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 52) |
| Camera | expo-camera (60fps) |
| Frame Extraction | FFmpegKit |
| Pose Estimation | MediaPipe BlazePose (on-device) |
| AI Analysis | Anthropic Claude claude-sonnet-4-6 (vision) |
| Overlay Rendering | React Native Skia |
| Backend | Node.js + Fastify |
| Database + Storage + Auth | Supabase |

---

## Quick Start

### Prerequisites
- Node.js ≥ 20
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free tier works)
- Anthropic API key

### 1. Database Setup (Supabase)

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Open the SQL Editor and run `supabase/schema.sql`
3. For development, optionally run `supabase/seed.sql`
4. Create a storage bucket named `instructor-buddy` (done by schema.sql)
5. Note your **Project URL** and **anon key** (Settings → API)

### 2. Backend API

```bash
cd api
cp .env.example .env
# Fill in ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET
npm install
npm run dev
# → API running on http://localhost:3000
```

Verify: `curl http://localhost:3000/health`

### 3. Mobile App

```bash
cd mobile
cp .env.example .env
# Fill in EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
npm install
```

**Development build (Expo Go — limited):**
```bash
npx expo start
```

**Full build with native modules (recommended):**

FFmpegKit and MediaPipe require native code — they need a development build, not Expo Go.

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

---

## Environment Variables

### `/api/.env`
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=your-super-secret-jwt-key-32chars+
PORT=3000
MAX_FRAMES_PER_SESSION=15
MAX_IMAGE_SIZE_KB=200
```

### `/mobile/.env`
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Core User Flow

```
Instructor records 30s ski run (CaptureScreen)
        ↓
FFmpegKit extracts frames on-device (~4fps = ~120 frames)
        ↓
MediaPipe BlazePose: 33 landmarks per frame (on-device, no network)
        ↓
Frame selection algorithm picks 6-12 key frames
        ↓
Claude claude-sonnet-4-6 (vision): returns coaching JSON per frame
        ↓
PlaybackScreen: video scrubber + Skia overlays + CoachingCueCard
        ↓
Instructor shares report link or exports PDF
```

---

## Project Structure

### Mobile (`/mobile`)

```
app/
  _layout.tsx                   Root layout + auth guard
  (tabs)/
    index.tsx                   Dashboard — recent sessions, quick capture
    library.tsx                 Session library grid
    students/
      index.tsx                 Student roster + add student
      [studentId].tsx           Student profile + session history
    settings.tsx                Instructor profile, PSIA level, cost dashboard
  capture.tsx                   60fps camera with session config
  analysis/[sessionId].tsx      Pipeline progress: extract → pose → analyze
  playback/[sessionId].tsx      Video + Skia overlay canvas + scrubber
  report/[sessionId].tsx        Session report with PDF export + share
  onboarding.tsx                First-run 3-step onboarding

components/
  overlays/
    OverlayCanvas.tsx           Skia canvas positioned over video
    AngleOverlay.tsx            Joint angle arc (knee flex, hip angulation)
    LineOverlay.tsx             Dashed alignment line
    ArrowOverlay.tsx            Directional movement arrow
    CircleOverlay.tsx           Joint highlight ring
    TextOverlay.tsx             Floating text annotation
  CoachingCueCard.tsx           Slide-up card with primary observation + cue
  VideoScrubber.tsx             Frame timeline + prev/next + overlay toggles
  SessionCard.tsx               Session list item
  StudentCard.tsx               Student list item

hooks/
  useFrameExtraction.ts         FFmpegKit: extract + intelligent frame selection
  usePoseEstimation.ts          MediaPipe BlazePose (mock in dev, native in prod)
  useAnalysis.ts                Upload frames to API, receive coaching JSON
  useSession.ts                 Zustand store: session state + frame management
  useOfflineQueue.ts            Expo SQLite queue + auto-sync on reconnect

lib/
  supabase.ts                   Supabase client + auth helpers
  api.ts                        Backend API client (fetch wrapper)
  storage.ts                    SQLite: offline jobs + instructor settings
  permissions.ts                Camera + microphone permission helpers

types/
  pose.ts                       PoseKeypoint, landmark IDs, angle computation
  overlay.ts                    Overlay type definitions
  coaching.ts                   CoachingResponse from Claude
  session.ts                    Session, AnalyzedFrame, Student, OfflineJob
```

### Backend (`/api`)

```
src/
  server.ts                     Fastify setup + plugins + health + analytics
  routes/
    sessions.ts                 POST /sessions, GET /sessions/:id, etc.
    frames.ts                   POST /sessions/:id/frames → Claude analysis
    students.ts                 Student CRUD + session assignment
  services/
    claude.ts                   Claude API calls + response cache
    supabase.ts                 Supabase client + image storage
    imageProcessor.ts           Image compression + pose hash
  middleware/
    auth.ts                     JWT verification
  schemas/
    session.ts, frame.ts, student.ts  Zod validation
  prompts/
    coachingPrompt.ts           PSIA system prompt + user message builder
  types/
    index.ts                    Shared TypeScript types
```

---

## Key Design Decisions

### Neurodivergent-First UX
- **One cue per frame** — `CoachingCueCard` shows a single, brief, actionable cue
- **Visual anchoring** — all feedback tied to visible body positions via overlays
- **No walls of text** — observations ≤ 20 words, cues ≤ 12 words

### Cost Controls
- Max 15 AI-analyzed frames per session (configurable via env)
- Image compression to <200KB before Claude API call
- Response caching by pose signature hash (skips re-analysis of identical poses)
- Per-instructor 30-day cost dashboard in Settings

### Offline-First
- MediaPipe runs entirely on-device — pose estimation works without cell service
- Unanalyzed frames queue in SQLite (`useOfflineQueue`)
- Auto-sync to Claude API when connectivity restored

### Frame Selection Algorithm
Scores each frame by:
1. Maximum edge angle (knee flex → arc-shaped turn)
2. Turn initiation (lateral hip/shoulder acceleration)
3. Pole plant (wrist near ground)
4. Hip-shoulder separation (countering)

Top-scoring frames up to the 15-frame limit are sent for AI analysis.

---

## MediaPipe Production Setup

The `usePoseEstimation` hook ships with a realistic mock for development. For production:

1. Install the native module: `npx expo install react-native-mediapipe`
2. Download the model: `pose_landmarker_lite.task` from [MediaPipe releases](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
3. Add to `mobile/assets/models/`
4. Uncomment the production block in `hooks/usePoseEstimation.ts`
5. Run `npx expo prebuild` and rebuild native app

---

## Deployment

### API
Deploy to [Railway](https://railway.app) or [Fly.io](https://fly.io):
```bash
# Railway
railway login && railway up

# Fly.io
fly launch && fly deploy
```

### Mobile
```bash
# Build for App Store / TestFlight
npx eas build --platform ios --profile production

# Build for Play Store
npx eas build --platform android --profile production
```

---

## Development Phases

| Phase | Status | Goal |
|---|---|---|
| 1 — Core Pipeline | ✅ Built | Camera → FFmpegKit → MediaPipe → Claude → overlay |
| 2 — Full Scrubber | ✅ Built | Frame scrubber, all 5 overlay types, cue card |
| 3 — Student Profiles | ✅ Built | Student management, session reports, offline queue |
| 4 — Polish & Beta | 🔜 Next | Performance tuning, accessibility, App Store submission |

---

## License
Proprietary — Instructor Buddy © 2026
