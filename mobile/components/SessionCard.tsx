import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import type { Session } from '../types/session';
import { FOCUS_AREA_LABELS, SKILL_LEVEL_LABELS } from '../constants/posePoints';

interface SessionCardProps {
  session: Session;
  studentName?: string;
  onPress: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: Colors.textMuted,
  processing: Colors.overlayYellow,
  completed: Colors.overlayGreen,
  failed: Colors.overlayRed,
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Analyzing…',
  completed: 'Complete',
  failed: 'Failed',
};

export function SessionCard({ session, studentName, onPress }: SessionCardProps) {
  const date = new Date(session.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Session: ${FOCUS_AREA_LABELS[session.focusArea]}, ${date}`}
    >
      <View style={styles.header}>
        <View style={styles.focusBadge}>
          <Text style={styles.focusText}>{FOCUS_AREA_LABELS[session.focusArea]}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[session.status] }]} />
        <Text style={[styles.statusText, { color: STATUS_COLORS[session.status] }]}>
          {STATUS_LABELS[session.status]}
        </Text>
      </View>

      <View style={styles.meta}>
        {studentName && (
          <Text style={styles.student} numberOfLines={1}>
            👤 {studentName}
          </Text>
        )}
        <Text style={styles.detail}>
          {SKILL_LEVEL_LABELS[session.skillLevel]} · {date}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  focusBadge: {
    flex: 1,
  },
  focusText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  meta: {
    gap: 3,
  },
  student: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  detail: {
    color: Colors.textMuted,
    fontSize: 12,
  },
});
