import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import type { Student } from '../types/session';
import { SKILL_LEVEL_LABELS } from '../constants/posePoints';

interface StudentCardProps {
  student: Student;
  sessionCount?: number;
  onPress: () => void;
}

const SKILL_COLORS: Record<string, string> = {
  beginner: '#68D391',      // green
  intermediate: '#63B3ED',  // blue
  advanced: '#F6AD55',      // orange
  expert: '#FC8181',        // red
};

export function StudentCard({ student, sessionCount = 0, onPress }: StudentCardProps) {
  const initials = (student.name ?? student.email)
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Student: ${student.name ?? student.email}`}
    >
      {/* Avatar circle */}
      <View style={[styles.avatar, { backgroundColor: SKILL_COLORS[student.skillLevel] + '30' }]}>
        <Text style={[styles.initials, { color: SKILL_COLORS[student.skillLevel] }]}>
          {initials}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {student.name ?? student.email}
        </Text>
        <Text style={styles.sub}>
          {SKILL_LEVEL_LABELS[student.skillLevel]}
          {sessionCount > 0 ? ` · ${sessionCount} session${sessionCount !== 1 ? 's' : ''}` : ''}
        </Text>
        {student.notes && (
          <Text style={styles.notes} numberOfLines={1}>
            {student.notes}
          </Text>
        )}
      </View>

      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 16,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  sub: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  notes: {
    color: Colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  chevron: {
    color: Colors.textMuted,
    fontSize: 20,
  },
});
