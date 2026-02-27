import type { Overlay } from './overlay';

export interface CoachingObservation {
  text: string;
  confidence: number; // 0–1
}

export interface CoachingResponse {
  primaryObservation: CoachingObservation;
  overlays: Overlay[];
  cue: string;
}
