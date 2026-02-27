import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useFrameExtraction } from '../../hooks/useFrameExtraction';
import { usePoseEstimation } from '../../hooks/usePoseEstimation';
import { analyzeFrameBatch } from '../../hooks/useAnalysis';
import { useSessionStore } from '../../hooks/useSession';
import type { FocusArea, SkillLevel } from '../../types/session';
import NetInfo from '@react-native-community/netinfo';

type Stage = 'extracting' | 'posing' | 'analyzing' | 'done' | 'error';

const STAGE_LABELS: Record<Stage, string> = {
  extracting: 'Extracting frames…',
  posing: 'Running pose estimation…',
  analyzing: 'Getting coaching insights…',
  done: 'Done!',
  error: 'Something went wrong',
};

const STAGE_ICONS: Record<Stage, string> = {
  extracting: '🎬',
  posing: '🦴',
  analyzing: '🧠',
  done: '✅',
  error: '⚠️',
};

export default function AnalysisScreen() {
  const params = useLocalSearchParams<{
    sessionId: string;
    videoUri: string;
    focusArea: string;
    skillLevel: string;
    isOnline: string;
  }>();

  const { sessionId, videoUri, focusArea, skillLevel } = params;
  const isOnline = params.isOnline === '1';

  const [stage, setStage] = useState<Stage>('extracting');
  const [detail, setDetail] = useState('');
  const [progress, setProgress] = useState(0);
  const { extractFrames, selectKeyFrames } = useFrameExtraction();
  const { estimateBatch } = usePoseEstimation();
  const { addAnalyzedFrame } = useSessionStore();
  const didRun = useRef(false);

  // Spinning animation for the icon
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
    );
  }, [rotation]);
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    if (!didRun.current && sessionId && videoUri) {
      didRun.current = true;
      runPipeline();
    }
  }, [sessionId, videoUri]);

  async function runPipeline() {
    try {
      // ── Stage 1: Frame Extraction ────────────────────────────────────────
      setStage('extracting');
      setDetail('Scanning video…');

      const allFrames = await extractFrames(videoUri, 30); // assume 30s clip
      setDetail(`Found ${allFrames.length} candidate frames`);

      // ── Stage 2: Pose Estimation ─────────────────────────────────────────
      setStage('posing');
      setDetail(`Estimating pose for ${allFrames.length} frames…`);

      const poseData = await estimateBatch(allFrames.map((f) => f.uri));

      const keyFrames = selectKeyFrames(allFrames, poseData);
      setDetail(`Selected ${keyFrames.length} key frames for analysis`);

      // ── Stage 3: Claude Analysis ─────────────────────────────────────────
      setStage('analyzing');
      setDetail(`Analyzing ${keyFrames.length} frames with Claude…`);

      const frameBatch = keyFrames.map((frame) => ({
        sessionId,
        frameIndex: frame.index,
        timestamp: frame.timestamp,
        imageUri: frame.uri,
        poseKeypoints: poseData.get(frame.index) ?? [],
        skillLevel: skillLevel as SkillLevel,
        focusArea: focusArea as FocusArea,
        isOnline,
      }));

      const coachingMap = await analyzeFrameBatch(
        frameBatch,
        (completed, total) => {
          setProgress(completed / total);
          setDetail(`Analyzed ${completed} of ${total} frames`);
        },
      );

      // Store results in session store
      for (const frame of keyFrames) {
        const coaching = coachingMap.get(frame.index);
        addAnalyzedFrame({
          id: `${sessionId}-${frame.index}`,
          sessionId,
          frameIndex: frame.index,
          timestamp: frame.timestamp,
          imageUri: frame.uri,
          poseKeypoints: poseData.get(frame.index) ?? [],
          coaching,
          overlays: coaching?.overlays,
        });
      }

      // ── Done ─────────────────────────────────────────────────────────────
      setStage('done');
      setTimeout(() => {
        router.replace({
          pathname: '/playback/[sessionId]',
          params: { sessionId },
        });
      }, 600);
    } catch (err) {
      console.error('[Analysis] Pipeline failed:', err);
      setStage('error');
      setDetail(err instanceof Error ? err.message : 'Unknown error');
      setTimeout(() => {
        Alert.alert('Analysis Failed', 'Please try again or check your connection.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }, 500);
    }
  }

  const isActive = stage !== 'done' && stage !== 'error';

  return (
    <View style={styles.screen}>
      <View style={styles.card}>
        <Animated.Text style={[styles.icon, isActive && spinStyle]}>
          {STAGE_ICONS[stage]}
        </Animated.Text>

        <Text style={styles.stageText}>{STAGE_LABELS[stage]}</Text>
        <Text style={styles.detailText}>{detail}</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width:
                  stage === 'analyzing'
                    ? `${progress * 100}%`
                    : stage === 'done'
                      ? '100%'
                      : '0%',
              },
            ]}
          />
        </View>

        <Text style={styles.hint}>
          {isOnline
            ? 'Stay nearby — AI coaching is running…'
            : 'Offline: pose analysis running locally. Coaching will sync when connected.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    maxWidth: 360,
  },
  icon: { fontSize: 52, marginBottom: 20 },
  stageText: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  detailText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    minHeight: 40,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.bgInput,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
