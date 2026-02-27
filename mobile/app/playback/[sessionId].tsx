import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Video, { type VideoRef } from 'react-native-video';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/colors';
import { useSessionStore, useSelectedFrame } from '../../hooks/useSession';
import { OverlayCanvas } from '../../components/overlays/OverlayCanvas';
import { CoachingCueCard } from '../../components/CoachingCueCard';
import { VideoScrubber } from '../../components/VideoScrubber';
import type { OverlayType, OverlayVisibility } from '../../types/overlay';
import { DEFAULT_OVERLAY_VISIBILITY } from '../../types/overlay';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_ASPECT = 16 / 9;
const VIDEO_HEIGHT = SCREEN_WIDTH / VIDEO_ASPECT;

export default function PlaybackScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { currentSession, frames, selectedFrameIndex, setSelectedFrame, loadSession } =
    useSessionStore();
  const selectedFrame = useSelectedFrame();

  const videoRef = useRef<VideoRef>(null);
  const [showCueCard, setShowCueCard] = useState(true);
  const [overlayVisibility, setOverlayVisibility] =
    useState<OverlayVisibility>(DEFAULT_OVERLAY_VISIBILITY);
  const [isPaused, setIsPaused] = useState(true);
  const [totalDuration, setTotalDuration] = useState(30);

  useEffect(() => {
    if (sessionId && !currentSession) {
      loadSession(sessionId);
    }
  }, [sessionId]);

  // Seek video to current frame timestamp
  useEffect(() => {
    if (selectedFrame && videoRef.current) {
      videoRef.current.seek(selectedFrame.timestamp);
      setIsPaused(true);
      setShowCueCard(!!selectedFrame.coaching);
    }
  }, [selectedFrame]);

  const handleOverlayToggle = useCallback((type: OverlayType) => {
    setOverlayVisibility((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  const videoUri = currentSession?.localVideoUri ?? currentSession?.videoUrl;

  return (
    <View style={styles.screen}>
      {/* Video + Overlay layer */}
      <View style={styles.videoContainer}>
        {videoUri ? (
          <Video
            ref={videoRef}
            source={{ uri: videoUri }}
            style={styles.video}
            paused={isPaused}
            resizeMode="contain"
            onLoad={(meta) => setTotalDuration(meta.duration)}
            onPress={() => setIsPaused((p) => !p)}
          />
        ) : (
          <View style={[styles.video, styles.videoPlaceholder]}>
            <Text style={styles.videoPlaceholderText}>
              {frames.length > 0
                ? 'Video not available — showing analysis only'
                : 'Loading…'}
            </Text>
          </View>
        )}

        {/* Skia overlay canvas */}
        {selectedFrame && (
          <OverlayCanvas
            overlays={selectedFrame.overlays ?? selectedFrame.coaching?.overlays ?? []}
            keypoints={selectedFrame.poseKeypoints}
            frameWidth={SCREEN_WIDTH}
            frameHeight={VIDEO_HEIGHT}
            visibility={overlayVisibility}
          />
        )}

        {/* Play/pause tap target */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => setIsPaused((p) => !p)}
          activeOpacity={1}
        />

        {/* Report button */}
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() =>
            router.push({ pathname: '/report/[sessionId]', params: { sessionId } })
          }
          accessibilityLabel="View session report"
        >
          <Text style={styles.reportIcon}>📋</Text>
        </TouchableOpacity>
      </View>

      {/* Coaching cue card */}
      {selectedFrame?.coaching && (
        <CoachingCueCard
          coaching={selectedFrame.coaching}
          visible={showCueCard && isPaused}
          onDismiss={() => setShowCueCard(false)}
        />
      )}

      {/* Scrubber */}
      <VideoScrubber
        frames={frames}
        selectedIndex={selectedFrameIndex}
        totalDuration={totalDuration}
        onFrameSelect={setSelectedFrame}
        overlayVisibility={overlayVisibility}
        onOverlayToggle={handleOverlayToggle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
  },
  videoPlaceholder: {
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  reportButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10,15,30,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportIcon: { fontSize: 20 },
});
