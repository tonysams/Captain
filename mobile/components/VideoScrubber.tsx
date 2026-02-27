import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import type { AnalyzedFrame } from '../types/session';
import type { OverlayType, OverlayVisibility } from '../types/overlay';

interface VideoScrubberProps {
  frames: AnalyzedFrame[];
  selectedIndex: number;
  totalDuration: number; // seconds
  onFrameSelect: (index: number) => void;
  overlayVisibility: OverlayVisibility;
  onOverlayToggle: (type: OverlayType) => void;
}

const OVERLAY_TYPES: OverlayType[] = ['angle', 'line', 'arrow', 'circle', 'text'];
const OVERLAY_LABELS: Record<OverlayType, string> = {
  angle: 'Angles',
  line: 'Lines',
  arrow: 'Arrows',
  circle: 'Joints',
  text: 'Notes',
};

/**
 * Frame timeline scrubber with overlay toggle controls.
 * Renders frame thumbnails and allows frame-by-frame stepping.
 */
export function VideoScrubber({
  frames,
  selectedIndex,
  totalDuration,
  onFrameSelect,
  overlayVisibility,
  onOverlayToggle,
}: VideoScrubberProps) {
  const handleFrameTap = useCallback(
    (index: number) => {
      Haptics.selectionAsync();
      onFrameSelect(index);
    },
    [onFrameSelect],
  );

  const handlePrev = useCallback(() => {
    if (selectedIndex > 0) {
      Haptics.selectionAsync();
      onFrameSelect(selectedIndex - 1);
    }
  }, [selectedIndex, onFrameSelect]);

  const handleNext = useCallback(() => {
    if (selectedIndex < frames.length - 1) {
      Haptics.selectionAsync();
      onFrameSelect(selectedIndex + 1);
    }
  }, [selectedIndex, frames.length, onFrameSelect]);

  const currentTimestamp = frames[selectedIndex]?.timestamp ?? 0;

  return (
    <View style={styles.container}>
      {/* Overlay toggle chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toggleRow}
        style={styles.toggleScroll}
      >
        {OVERLAY_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.toggleChip,
              overlayVisibility[type] && styles.toggleChipActive,
            ]}
            onPress={() => onOverlayToggle(type)}
            accessibilityRole="switch"
            accessibilityState={{ checked: overlayVisibility[type] }}
            accessibilityLabel={`Toggle ${OVERLAY_LABELS[type]} overlay`}
          >
            <Text
              style={[
                styles.toggleLabel,
                overlayVisibility[type] && styles.toggleLabelActive,
              ]}
            >
              {OVERLAY_LABELS[type]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Frame step controls + timestamp */}
      <View style={styles.stepRow}>
        <TouchableOpacity
          style={[styles.stepButton, selectedIndex === 0 && styles.stepButtonDisabled]}
          onPress={handlePrev}
          disabled={selectedIndex === 0}
          accessibilityLabel="Previous frame"
          accessibilityRole="button"
        >
          <Text style={styles.stepIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.timestampContainer}>
          <Text style={styles.timestamp}>{formatTime(currentTimestamp)}</Text>
          <Text style={styles.frameCount}>
            {selectedIndex + 1} / {frames.length}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.stepButton,
            selectedIndex === frames.length - 1 && styles.stepButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={selectedIndex === frames.length - 1}
          accessibilityLabel="Next frame"
          accessibilityRole="button"
        >
          <Text style={styles.stepIcon}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Frame thumbnail timeline */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeline}
      >
        {frames.map((frame, i) => {
          const isSelected = i === selectedIndex;
          const positionPct = totalDuration > 0 ? frame.timestamp / totalDuration : 0;

          return (
            <Pressable
              key={frame.id}
              style={[styles.frameThumb, isSelected && styles.frameThumbSelected]}
              onPress={() => handleFrameTap(i)}
              accessibilityRole="button"
              accessibilityLabel={`Frame at ${formatTime(frame.timestamp)}`}
              accessibilityState={{ selected: isSelected }}
            >
              {/* Coaching dot: green if analyzed */}
              {frame.coaching && (
                <View style={styles.analyzedDot} />
              )}
              <Text style={[styles.frameTime, isSelected && styles.frameTimeSelected]}>
                {formatTime(frame.timestamp)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 10);
  return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: 8,
  },
  toggleScroll: {
    maxHeight: 40,
  },
  toggleRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
  },
  toggleChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleChipActive: {
    backgroundColor: Colors.primary + '30',
    borderColor: Colors.primary,
  },
  toggleLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: Colors.primary,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  stepButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: {
    opacity: 0.3,
  },
  stepIcon: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 28,
  },
  timestampContainer: {
    alignItems: 'center',
  },
  timestamp: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  frameCount: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  timeline: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  frameThumb: {
    width: 56,
    height: 40,
    borderRadius: 6,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  frameThumbSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '20',
  },
  analyzedDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.overlayGreen,
  },
  frameTime: {
    color: Colors.textMuted,
    fontSize: 9,
    fontVariant: ['tabular-nums'],
  },
  frameTimeSelected: {
    color: Colors.primary,
  },
});
