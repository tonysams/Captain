import { useState, useCallback } from 'react';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { uploadFrame } from '../lib/api';
import type { CoachingResponse } from '../types/coaching';
import type { FocusArea, OfflineJob, SkillLevel } from '../types/session';
import type { PoseKeypoint } from '../types/pose';
import { enqueueJob } from '../lib/storage';
import { v4 as uuidv4 } from 'uuid';

export interface AnalysisParams {
  sessionId: string;
  frameIndex: number;
  timestamp: number;
  imageUri: string;
  poseKeypoints: PoseKeypoint[];
  skillLevel: SkillLevel;
  focusArea: FocusArea;
  previousNote?: string;
  isOnline: boolean;
}

export interface UseAnalysisReturn {
  analyzeFrame: (params: AnalysisParams) => Promise<CoachingResponse | null>;
  isAnalyzing: boolean;
  currentFrame: number;
  totalFrames: number;
  error: string | null;
}

const MAX_IMAGE_SIZE_KB = 200;
const JPEG_QUALITY = 0.8;

async function imageUriToBase64(uri: string): Promise<string> {
  // First compress to target size
  const manipResult = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 720 } }], // Resize to max 720px wide
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Check size — if still too large, compress more aggressively
  const sizeKb = (base64.length * 3) / 4 / 1024;
  if (sizeKb > MAX_IMAGE_SIZE_KB) {
    const compressed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 480 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
    );
    return FileSystem.readAsStringAsync(compressed.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  return base64;
}

export function useAnalysis(): UseAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const analyzeFrame = useCallback(
    async (params: AnalysisParams): Promise<CoachingResponse | null> => {
      setIsAnalyzing(true);
      setError(null);

      try {
        const imageBase64 = await imageUriToBase64(params.imageUri);

        if (!params.isOnline) {
          // Queue for later when connectivity restored
          const job: Omit<OfflineJob, 'retries'> = {
            id: uuidv4(),
            sessionId: params.sessionId,
            frameIndex: params.frameIndex,
            timestamp: params.timestamp,
            imageUri: params.imageUri,
            poseJson: JSON.stringify(params.poseKeypoints),
            context: JSON.stringify({
              skillLevel: params.skillLevel,
              focusArea: params.focusArea,
              previousNote: params.previousNote,
            }),
            createdAt: new Date().toISOString(),
          };
          await enqueueJob(job);
          return null;
        }

        const result = await uploadFrame({
          sessionId: params.sessionId,
          frameIndex: params.frameIndex,
          timestamp: params.timestamp,
          imageBase64,
          poseKeypoints: params.poseKeypoints,
          context: {
            skillLevel: params.skillLevel,
            focusArea: params.focusArea,
            previousNote: params.previousNote,
          },
        });

        return result.coaching;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        setError(msg);
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [],
  );

  return { analyzeFrame, isAnalyzing, currentFrame, totalFrames, error };
}

/** Analyze a batch of frames sequentially, reporting progress */
export async function analyzeFrameBatch(
  frames: Array<{
    sessionId: string;
    frameIndex: number;
    timestamp: number;
    imageUri: string;
    poseKeypoints: PoseKeypoint[];
    skillLevel: SkillLevel;
    focusArea: FocusArea;
    previousNote?: string;
    isOnline: boolean;
  }>,
  onProgress: (completed: number, total: number) => void,
): Promise<Map<number, CoachingResponse>> {
  const results = new Map<number, CoachingResponse>();

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    onProgress(i, frames.length);

    try {
      const imageBase64 = await imageUriToBase64(frame.imageUri);
      const result = await uploadFrame({
        sessionId: frame.sessionId,
        frameIndex: frame.frameIndex,
        timestamp: frame.timestamp,
        imageBase64,
        poseKeypoints: frame.poseKeypoints,
        context: {
          skillLevel: frame.skillLevel,
          focusArea: frame.focusArea,
          previousNote: frame.previousNote,
        },
      });
      results.set(frame.frameIndex, result.coaching);
    } catch (err) {
      console.warn(`[Analysis] Frame ${frame.frameIndex} failed:`, err);
    }
  }

  onProgress(frames.length, frames.length);
  return results;
}
