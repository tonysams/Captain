import { create } from 'zustand';
import type { AnalyzedFrame, FocusArea, Session, SkillLevel } from '../types/session';
import type { CoachingResponse } from '../types/coaching';
import type { Overlay } from '../types/overlay';
import * as api from '../lib/api';

interface SessionStore {
  // Current session state
  currentSession: Session | null;
  frames: AnalyzedFrame[];
  selectedFrameIndex: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  createSession: (params: {
    studentId?: string;
    focusArea: FocusArea;
    skillLevel: SkillLevel;
  }) => Promise<Session | null>;

  loadSession: (sessionId: string) => Promise<void>;

  addAnalyzedFrame: (frame: AnalyzedFrame) => void;

  updateFrameCoaching: (frameIndex: number, coaching: CoachingResponse) => void;

  setSelectedFrame: (index: number) => void;

  reset: () => void;
}

export const useSessionStore = create<SessionStore>((set, get) => ({
  currentSession: null,
  frames: [],
  selectedFrameIndex: 0,
  isLoading: false,
  error: null,

  createSession: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.createSession(params);
      const session = result.session;
      set({ currentSession: session, frames: [], isLoading: false });
      return session;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to create session',
        isLoading: false,
      });
      return null;
    }
  },

  loadSession: async (sessionId) => {
    set({ isLoading: true, error: null });
    try {
      const { session } = await api.getSession(sessionId);
      set({
        currentSession: session,
        frames: session.frames ?? [],
        selectedFrameIndex: 0,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load session',
        isLoading: false,
      });
    }
  },

  addAnalyzedFrame: (frame) => {
    set((state) => ({
      frames: [...state.frames, frame].sort((a, b) => a.frameIndex - b.frameIndex),
    }));
  },

  updateFrameCoaching: (frameIndex, coaching) => {
    set((state) => ({
      frames: state.frames.map((f) =>
        f.frameIndex === frameIndex
          ? { ...f, coaching, overlays: coaching.overlays as Overlay[] }
          : f,
      ),
    }));
  },

  setSelectedFrame: (index) => set({ selectedFrameIndex: index }),

  reset: () =>
    set({
      currentSession: null,
      frames: [],
      selectedFrameIndex: 0,
      isLoading: false,
      error: null,
    }),
}));

/** Convenience selector: get the currently selected analyzed frame */
export function useSelectedFrame() {
  return useSessionStore((s) =>
    s.frames[s.selectedFrameIndex] ?? null,
  );
}
