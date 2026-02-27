import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AccessibilityInfo,
} from 'react-native';
import { Colors } from '../constants/colors';
import type { CoachingResponse } from '../types/coaching';

interface CoachingCueCardProps {
  coaching: CoachingResponse;
  visible: boolean;
  onDismiss?: () => void;
}

/**
 * Slides up from the bottom of the screen with the primary coaching observation.
 * Neurodivergent-first design: one cue, bold and brief.
 */
export function CoachingCueCard({ coaching, visible, onDismiss }: CoachingCueCardProps) {
  const slideAnim = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 120,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();

    if (visible && coaching.cue) {
      AccessibilityInfo.announceForAccessibility(coaching.cue);
    }
  }, [visible, coaching.cue, slideAnim]);

  const confidenceColor =
    coaching.primaryObservation.confidence > 0.8
      ? Colors.overlayGreen
      : coaching.primaryObservation.confidence > 0.6
        ? Colors.overlayYellow
        : Colors.overlayRed;

  return (
    <Animated.View
      style={[styles.card, { transform: [{ translateY: slideAnim }] }]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={`Coaching cue: ${coaching.cue}`}
    >
      {/* Observation text */}
      <View style={styles.observationRow}>
        <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
        <Text style={styles.observationText} numberOfLines={2}>
          {coaching.primaryObservation.text}
        </Text>
      </View>

      {/* The single coaching cue — visually prominent */}
      <View style={styles.cueContainer}>
        <Text style={styles.cueLabel}>CUE</Text>
        <Text style={styles.cueText}>{coaching.cue}</Text>
      </View>

      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessibilityLabel="Dismiss coaching cue"
          accessibilityRole="button"
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  observationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  observationText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  cueContainer: {
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    padding: 12,
  },
  cueLabel: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  cueText: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
