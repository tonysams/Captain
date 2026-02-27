import type { CoachingResponse } from './coaching';
import type { PoseKeypoint } from './pose';
import type { Overlay } from './overlay';

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

export interface Session {
  id: string;
  instructorId: string;
  studentId?: string;
  videoUrl?: string;
  localVideoUri?: string; // on-device path before upload
  focusArea: FocusArea;
  skillLevel: SkillLevel;
  status: SessionStatus;
  createdAt: string;
  frames?: AnalyzedFrame[];
}

export interface AnalyzedFrame {
  id: string;
  sessionId: string;
  frameIndex: number;
  timestamp: number; // seconds
  imageUri?: string; // local or remote
  poseKeypoints: PoseKeypoint[];
  coaching?: CoachingResponse;
  overlays?: Overlay[];
}

export interface SessionNote {
  id: string;
  sessionId: string;
  authorId: string;
  content: string;
  createdAt: string;
}

export interface Student {
  id: string;
  email: string;
  name?: string;
  skillLevel: SkillLevel;
  notes?: string;
  createdAt: string;
}

export interface InstructorProfile {
  id: string;
  email: string;
  psiaLevel?: string;
  defaultFocusArea: FocusArea;
  defaultSkillLevel: SkillLevel;
}

/** Pending analysis job stored locally for offline queue */
export interface OfflineJob {
  id: string;
  sessionId: string;
  frameIndex: number;
  timestamp: number;
  imageUri: string;
  poseJson: string; // JSON stringified PoseKeypoint[]
  context: string;  // JSON stringified FrameContext
  createdAt: string;
  retries: number;
}
