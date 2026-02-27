import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { useSessionStore } from '../hooks/useSession';
import type { FocusArea, SkillLevel } from '../types/session';
import { FOCUS_AREA_LABELS, SKILL_LEVEL_LABELS } from '../constants/posePoints';
import NetInfo from '@react-native-community/netinfo';

const FOCUS_OPTIONS = Object.entries(FOCUS_AREA_LABELS).map(([value, label]) => ({
  value: value as FocusArea,
  label,
}));

const SKILL_OPTIONS = Object.entries(SKILL_LEVEL_LABELS).map(([value, label]) => ({
  value: value as SkillLevel,
  label,
}));

const MAX_RECORDING_SECONDS = 60;

export default function CaptureScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [focusArea, setFocusArea] = useState<FocusArea>('general');
  const [skillLevel, setSkillLevel] = useState<SkillLevel>('intermediate');
  const [showConfig, setShowConfig] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { createSession } = useSessionStore();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.permScreen}>
        <Text style={styles.permTitle}>Camera Access Required</Text>
        <Text style={styles.permSub}>
          Instructor Buddy needs camera and microphone access to record sessions.
        </Text>
        <TouchableOpacity
          style={styles.permButton}
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
          }}
        >
          <Text style={styles.permButtonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function startRecording() {
    if (!cameraRef.current || isRecording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);
    setElapsedSeconds(0);
    setShowConfig(false);

    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => {
        if (s >= MAX_RECORDING_SECONDS - 1) {
          stopRecording();
          return s;
        }
        return s + 1;
      });
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: MAX_RECORDING_SECONDS,
      });

      if (video?.uri) {
        await handleVideoReady(video.uri);
      }
    } catch (err) {
      console.error('[Capture] Recording failed:', err);
      Alert.alert('Recording Failed', 'Please try again.');
      setIsRecording(false);
    }
  }

  async function stopRecording() {
    if (!cameraRef.current || !isRecording) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (timerRef.current) clearInterval(timerRef.current);
    cameraRef.current.stopRecording();
    setIsRecording(false);
  }

  async function handleVideoReady(videoUri: string) {
    const netState = await NetInfo.fetch();
    const isOnline = !!(netState.isConnected && netState.isInternetReachable);

    const session = await createSession({ focusArea, skillLevel });
    if (!session) {
      Alert.alert('Error', 'Could not create session. Check your connection.');
      return;
    }

    router.replace({
      pathname: '/analysis/[sessionId]',
      params: {
        sessionId: session.id,
        videoUri,
        focusArea,
        skillLevel,
        isOnline: isOnline ? '1' : '0',
      },
    });
  }

  const recordingProgress = elapsedSeconds / MAX_RECORDING_SECONDS;

  return (
    <View style={styles.screen}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        mode="video"
        videoQuality="1080p"
      >
        {/* Recording progress bar */}
        {isRecording && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${recordingProgress * 100}%` }]} />
          </View>
        )}

        {/* Timer */}
        {isRecording && (
          <View style={styles.timerBadge}>
            <View style={styles.recDot} />
            <Text style={styles.timerText}>
              {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}

        {/* Config panel */}
        {showConfig && !isRecording && (
          <View style={styles.configPanel}>
            <Text style={styles.configTitle}>Session Setup</Text>

            <Text style={styles.configLabel}>Focus Area</Text>
            <View style={styles.optionRow}>
              {FOCUS_OPTIONS.slice(0, 4).map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionChip, focusArea === opt.value && styles.optionActive]}
                  onPress={() => setFocusArea(opt.value)}
                >
                  <Text style={[styles.optionText, focusArea === opt.value && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.optionRow}>
              {FOCUS_OPTIONS.slice(4).map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionChip, focusArea === opt.value && styles.optionActive]}
                  onPress={() => setFocusArea(opt.value)}
                >
                  <Text style={[styles.optionText, focusArea === opt.value && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.configLabel}>Student Level</Text>
            <View style={styles.optionRow}>
              {SKILL_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.optionChip, skillLevel === opt.value && styles.optionActive]}
                  onPress={() => setSkillLevel(opt.value)}
                >
                  <Text style={[styles.optionText, skillLevel === opt.value && styles.optionTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Controls row */}
        <View style={styles.controls}>
          {/* Flip camera */}
          <TouchableOpacity
            style={styles.flipButton}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
            accessibilityLabel="Flip camera"
          >
            <Text style={styles.flipIcon}>🔄</Text>
          </TouchableOpacity>

          {/* Record button */}
          <TouchableOpacity
            style={[styles.recordButton, isRecording && styles.recordButtonActive]}
            onPress={isRecording ? stopRecording : startRecording}
            accessibilityRole="button"
            accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <View style={[styles.recordInner, isRecording && styles.recordInnerActive]} />
          </TouchableOpacity>

          {/* Config toggle */}
          {!isRecording && (
            <TouchableOpacity
              style={styles.flipButton}
              onPress={() => setShowConfig((v) => !v)}
              accessibilityLabel="Session settings"
            >
              <Text style={styles.flipIcon}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: { height: 3, backgroundColor: Colors.overlayRed },
  timerBadge: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.overlayRed },
  timerText: { color: '#fff', fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
  configPanel: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(10,15,30,0.92)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  configTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  configLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 8,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  optionChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionActive: { backgroundColor: Colors.primary + '30', borderColor: Colors.primary },
  optionText: { color: Colors.textMuted, fontSize: 11, fontWeight: '500' },
  optionTextActive: { color: Colors.primary },
  controls: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  flipButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flipIcon: { fontSize: 22 },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: { borderColor: Colors.overlayRed },
  recordInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
  },
  recordInnerActive: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.overlayRed,
  },
  permScreen: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  permTitle: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  permSub: { color: Colors.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  permButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  permButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
