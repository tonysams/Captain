import { useState, useCallback } from 'react';
import { FFmpegKit, FFmpegKitConfig, ReturnCode } from 'ffmpeg-kit-react-native';
import * as FileSystem from 'expo-file-system';
import type { PoseKeypoint } from '../types/pose';
import { computeAngle, POSE_LANDMARKS } from '../types/pose';

export interface ExtractedFrame {
  index: number;
  timestamp: number; // seconds
  uri: string;       // local file URI
}

export interface UseFrameExtractionReturn {
  extractFrames: (videoUri: string, durationSeconds: number) => Promise<ExtractedFrame[]>;
  selectKeyFrames: (
    allFrames: ExtractedFrame[],
    poseData: Map<number, PoseKeypoint[]>,
  ) => ExtractedFrame[];
  isExtracting: boolean;
  progress: number; // 0–1
  error: string | null;
}

/** Max frames the AI will analyze */
const MAX_AI_FRAMES = 15;
/** Frames per second to extract for analysis candidates */
const ANALYSIS_FPS = 4; // extract 4 fps from the video

export function useFrameExtraction(): UseFrameExtractionReturn {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const extractFrames = useCallback(
    async (videoUri: string, durationSeconds: number): Promise<ExtractedFrame[]> => {
      setIsExtracting(true);
      setProgress(0);
      setError(null);

      const outputDir = `${FileSystem.cacheDirectory}frames_${Date.now()}/`;
      await FileSystem.makeDirectoryAsync(outputDir, { intermediates: true });

      // FFmpeg command: extract frames at ANALYSIS_FPS, max quality JPEG
      const command = `-i "${videoUri}" -vf "fps=${ANALYSIS_FPS}" -q:v 2 "${outputDir}frame_%04d.jpg"`;

      FFmpegKitConfig.enableStatisticsCallback((stats) => {
        const time = stats.getTime(); // ms processed
        if (durationSeconds > 0) {
          setProgress(Math.min(time / (durationSeconds * 1000), 1));
        }
      });

      const session = await FFmpegKit.execute(command);
      const returnCode = await session.getReturnCode();

      if (!ReturnCode.isSuccess(returnCode)) {
        const logs = await session.getLogsAsString();
        setError(`Frame extraction failed: ${logs.slice(-200)}`);
        setIsExtracting(false);
        return [];
      }

      // Read extracted files
      const files = await FileSystem.readDirectoryAsync(outputDir);
      const frameFiles = files
        .filter((f) => f.endsWith('.jpg'))
        .sort()
        .map((filename, index) => ({
          index,
          timestamp: index / ANALYSIS_FPS,
          uri: `${outputDir}${filename}`,
        }));

      setProgress(1);
      setIsExtracting(false);
      return frameFiles;
    },
    [],
  );

  /**
   * Select the most informative frames for AI analysis using heuristics.
   * Returns up to MAX_AI_FRAMES frames.
   */
  const selectKeyFrames = useCallback(
    (
      allFrames: ExtractedFrame[],
      poseData: Map<number, PoseKeypoint[]>,
    ): ExtractedFrame[] => {
      if (allFrames.length <= MAX_AI_FRAMES) return allFrames;

      const scores = allFrames.map((frame, i) => {
        const pose = poseData.get(frame.index);
        const prevPose = i > 0 ? poseData.get(allFrames[i - 1].index) : null;

        if (!pose) return { frame, score: 0 };

        let score = 0;

        const leftHip = pose.find((kp) => kp.id === POSE_LANDMARKS.LEFT_HIP);
        const rightHip = pose.find((kp) => kp.id === POSE_LANDMARKS.RIGHT_HIP);
        const leftShoulder = pose.find((kp) => kp.id === POSE_LANDMARKS.LEFT_SHOULDER);
        const rightShoulder = pose.find((kp) => kp.id === POSE_LANDMARKS.RIGHT_SHOULDER);
        const leftKnee = pose.find((kp) => kp.id === POSE_LANDMARKS.LEFT_KNEE);
        const rightKnee = pose.find((kp) => kp.id === POSE_LANDMARKS.RIGHT_KNEE);
        const leftAnkle = pose.find((kp) => kp.id === POSE_LANDMARKS.LEFT_ANKLE);
        const rightAnkle = pose.find((kp) => kp.id === POSE_LANDMARKS.RIGHT_ANKLE);
        const leftWrist = pose.find((kp) => kp.id === POSE_LANDMARKS.LEFT_WRIST);
        const rightWrist = pose.find((kp) => kp.id === POSE_LANDMARKS.RIGHT_WRIST);

        // 1. Maximum edge angle: sharp knee flex = lower knee angle value
        if (leftHip && leftKnee && leftAnkle && rightHip && rightKnee && rightAnkle) {
          const leftKneeAngle = computeAngle(leftHip, leftKnee, leftAnkle);
          const rightKneeAngle = computeAngle(rightHip, rightKnee, rightAnkle);
          const minKneeAngle = Math.min(leftKneeAngle, rightKneeAngle);
          // More flex (lower angle) = higher score for edge frames
          score += (180 - minKneeAngle) / 180;
        }

        // 2. Turn initiation: lateral acceleration of hip center
        if (prevPose && leftHip && rightHip) {
          const prevLeftHip = prevPose.find((kp) => kp.id === POSE_LANDMARKS.LEFT_HIP);
          const prevRightHip = prevPose.find((kp) => kp.id === POSE_LANDMARKS.RIGHT_HIP);
          if (prevLeftHip && prevRightHip) {
            const currHipX = (leftHip.x + rightHip.x) / 2;
            const prevHipX = (prevLeftHip.x + prevRightHip.x) / 2;
            const lateralAccel = Math.abs(currHipX - prevHipX);
            if (lateralAccel > 0.02) score += 0.5; // turn initiation threshold
          }
        }

        // 3. Pole plant: wrist near ground level (high y value = lower on screen)
        if (leftWrist && rightWrist) {
          const wristY = Math.max(leftWrist.y, rightWrist.y);
          if (wristY > 0.75 && leftWrist.visibility > 0.7) score += 0.3;
        }

        // 4. Hip-shoulder separation (countering)
        if (leftHip && rightHip && leftShoulder && rightShoulder) {
          const hipAngle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x);
          const shoulderAngle = Math.atan2(
            rightShoulder.y - leftShoulder.y,
            rightShoulder.x - leftShoulder.x,
          );
          const separation = Math.abs(hipAngle - shoulderAngle);
          score += separation * 0.5;
        }

        return { frame, score };
      });

      return scores
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_AI_FRAMES)
        .sort((a, b) => a.frame.timestamp - b.frame.timestamp)
        .map((s) => s.frame);
    },
    [],
  );

  return { extractFrames, selectKeyFrames, isExtracting, progress, error };
}
