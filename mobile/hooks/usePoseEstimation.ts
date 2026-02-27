import { useState, useCallback, useRef } from 'react';
import type { PoseKeypoint } from '../types/pose';

export interface UsePoseEstimationReturn {
  estimatePose: (imageUri: string) => Promise<PoseKeypoint[]>;
  estimateBatch: (imageUris: string[]) => Promise<Map<number, PoseKeypoint[]>>;
  isReady: boolean;
  isProcessing: boolean;
  error: string | null;
}

/**
 * MediaPipe BlazePose integration for on-device pose estimation.
 *
 * Production implementation uses react-native-mediapipe (native module).
 * The hook provides a clean async API regardless of the underlying implementation.
 *
 * react-native-mediapipe: https://github.com/cdiddy77/react-native-mediapipe
 * Install: npx expo install react-native-mediapipe
 * Then run: npx expo prebuild (requires development build, not Expo Go)
 */
export function usePoseEstimation(): UsePoseEstimationReturn {
  const [isReady, setIsReady] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a development build with react-native-mediapipe installed, replace the
  // mock below with the actual MediaPipe pose landmarker calls.
  const mediapipeRef = useRef<unknown>(null);

  const estimatePose = useCallback(async (imageUri: string): Promise<PoseKeypoint[]> => {
    setIsProcessing(true);
    setError(null);

    try {
      // ── Production ──────────────────────────────────────────────────────────
      // When react-native-mediapipe is available:
      //
      // import { PoseLandmarker, RunningMode } from 'react-native-mediapipe';
      // if (!mediapipeRef.current) {
      //   mediapipeRef.current = await PoseLandmarker.createFromOptions(undefined, {
      //     baseOptions: {
      //       modelAssetPath: 'pose_landmarker_lite.task', // bundle in assets/
      //       delegate: 'GPU',
      //     },
      //     runningMode: RunningMode.IMAGE,
      //     numPoses: 1,
      //   });
      // }
      // const result = await (mediapipeRef.current as PoseLandmarker).detect(imageUri);
      // return result.landmarks[0]?.map((lm, id) => ({
      //   id,
      //   x: lm.x,
      //   y: lm.y,
      //   z: lm.z,
      //   visibility: lm.visibility ?? 1,
      // })) ?? [];

      // ── Development Mock ─────────────────────────────────────────────────────
      // Returns realistic-looking pose data for UI development without native build.
      await new Promise((r) => setTimeout(r, 120)); // simulate ~120ms inference
      return generateMockPose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pose estimation failed';
      setError(msg);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const estimateBatch = useCallback(
    async (imageUris: string[]): Promise<Map<number, PoseKeypoint[]>> => {
      const results = new Map<number, PoseKeypoint[]>();
      for (let i = 0; i < imageUris.length; i++) {
        const keypoints = await estimatePose(imageUris[i]);
        results.set(i, keypoints);
      }
      return results;
    },
    [estimatePose],
  );

  return { estimatePose, estimateBatch, isReady, isProcessing, error };
}

/** Generate a plausible mock ski pose for development */
function generateMockPose(): PoseKeypoint[] {
  const base: Omit<PoseKeypoint, 'id'>[] = [
    { x: 0.50, y: 0.08, z: -0.10, visibility: 0.99 }, // 0 nose
    { x: 0.48, y: 0.07, z: -0.11, visibility: 0.90 }, // 1 left eye inner
    { x: 0.47, y: 0.07, z: -0.11, visibility: 0.88 }, // 2 left eye
    { x: 0.46, y: 0.07, z: -0.11, visibility: 0.85 }, // 3 left eye outer
    { x: 0.52, y: 0.07, z: -0.11, visibility: 0.90 }, // 4 right eye inner
    { x: 0.53, y: 0.07, z: -0.11, visibility: 0.88 }, // 5 right eye
    { x: 0.54, y: 0.07, z: -0.11, visibility: 0.85 }, // 6 right eye outer
    { x: 0.44, y: 0.09, z: -0.08, visibility: 0.80 }, // 7 left ear
    { x: 0.56, y: 0.09, z: -0.08, visibility: 0.80 }, // 8 right ear
    { x: 0.49, y: 0.10, z: -0.05, visibility: 0.70 }, // 9 mouth left
    { x: 0.51, y: 0.10, z: -0.05, visibility: 0.70 }, // 10 mouth right
    { x: 0.42, y: 0.22, z: -0.05, visibility: 0.97 }, // 11 left shoulder
    { x: 0.58, y: 0.22, z: -0.05, visibility: 0.97 }, // 12 right shoulder
    { x: 0.38, y: 0.35, z: -0.03, visibility: 0.92 }, // 13 left elbow
    { x: 0.62, y: 0.35, z: -0.03, visibility: 0.92 }, // 14 right elbow
    { x: 0.35, y: 0.48, z:  0.02, visibility: 0.88 }, // 15 left wrist
    { x: 0.65, y: 0.48, z:  0.02, visibility: 0.88 }, // 16 right wrist
    { x: 0.34, y: 0.50, z:  0.03, visibility: 0.75 }, // 17 left pinky
    { x: 0.66, y: 0.50, z:  0.03, visibility: 0.75 }, // 18 right pinky
    { x: 0.33, y: 0.50, z:  0.03, visibility: 0.73 }, // 19 left index
    { x: 0.67, y: 0.50, z:  0.03, visibility: 0.73 }, // 20 right index
    { x: 0.35, y: 0.49, z:  0.02, visibility: 0.72 }, // 21 left thumb
    { x: 0.65, y: 0.49, z:  0.02, visibility: 0.72 }, // 22 right thumb
    { x: 0.44, y: 0.52, z:  0.00, visibility: 0.96 }, // 23 left hip
    { x: 0.56, y: 0.52, z:  0.00, visibility: 0.96 }, // 24 right hip
    { x: 0.43, y: 0.68, z:  0.05, visibility: 0.94 }, // 25 left knee
    { x: 0.57, y: 0.68, z:  0.05, visibility: 0.94 }, // 26 right knee
    { x: 0.42, y: 0.82, z:  0.08, visibility: 0.91 }, // 27 left ankle
    { x: 0.58, y: 0.82, z:  0.08, visibility: 0.91 }, // 28 right ankle
    { x: 0.41, y: 0.84, z:  0.09, visibility: 0.85 }, // 29 left heel
    { x: 0.59, y: 0.84, z:  0.09, visibility: 0.85 }, // 30 right heel
    { x: 0.40, y: 0.86, z:  0.10, visibility: 0.82 }, // 31 left foot index
    { x: 0.60, y: 0.86, z:  0.10, visibility: 0.82 }, // 32 right foot index
  ];

  // Add subtle jitter for realism
  return base.map((kp, id) => ({
    id,
    x: kp.x + (Math.random() - 0.5) * 0.01,
    y: kp.y + (Math.random() - 0.5) * 0.01,
    z: kp.z,
    visibility: kp.visibility,
  }));
}
