export type UserRole = 'instructor' | 'student';
export type SessionStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type FocusArea =
  | 'carved_turns'
  | 'parallel_turns'
  | 'moguls'
  | 'powder'
  | 'athletic_stance'
  | 'edge_control'
  | 'pole_plant'
  | 'general';

export type OverlayType = 'angle' | 'line' | 'arrow' | 'circle' | 'text';

export interface PoseKeypoint {
  id: number;
  x: number; // normalized 0–1
  y: number; // normalized 0–1
  z: number;
  visibility: number; // 0–1 confidence
}

export interface Overlay {
  type: OverlayType;
  /** Landmark IDs from MediaPipe (3 for angle, 2 for line, 1 for circle) */
  points?: number[];
  label?: string;
  color: string;
  x: number; // normalized label position
  y: number;
  /** For arrows: direction vector (normalized) */
  dx?: number;
  dy?: number;
}

export interface CoachingObservation {
  text: string;
  confidence: number;
}

export interface CoachingResponse {
  primaryObservation: CoachingObservation;
  overlays: Overlay[];
  cue: string;
}

export interface FrameContext {
  skillLevel: SkillLevel;
  focusArea: FocusArea;
  previousNote?: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  psiaLevel?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  instructorId: string;
  studentId?: string;
  videoUrl?: string;
  status: SessionStatus;
  createdAt: string;
}

export interface Frame {
  id: string;
  sessionId: string;
  frameIndex: number;
  timestamp: number;
  imageUrl?: string;
  poseJson: PoseKeypoint[];
}

export interface AnalysisResult {
  id: string;
  frameId: string;
  primaryObservation: CoachingObservation;
  cue: string;
  overlaysJson: Overlay[];
  modelVersion: string;
  createdAt: string;
}

export interface SessionNote {
  id: string;
  sessionId: string;
  authorId: string;
  content: string;
  createdAt: string;
}
