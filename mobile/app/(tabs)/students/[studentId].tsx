import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getStudent } from '../../../lib/api';
import { Colors } from '../../../constants/colors';
import { SessionCard } from '../../../components/SessionCard';
import { SKILL_LEVEL_LABELS } from '../../../constants/posePoints';
import type { Session, Student } from '../../../types/session';

export default function StudentProfileScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (studentId) loadProfile(studentId);
  }, [studentId]);

  async function loadProfile(id: string) {
    setIsLoading(true);
    try {
      const { student: s, sessions: sess } = await getStudent(id);
      setStudent(s);
      setSessions(sess);
    } catch (err) {
      console.error('[StudentProfile]', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>Student not found.</Text>
      </View>
    );
  }

  const sessionCount = sessions.length;
  const completedCount = sessions.filter((s) => s.status === 'completed').length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(student.name ?? student.email)[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{student.name ?? student.email}</Text>
        <Text style={styles.email}>{student.email}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{SKILL_LEVEL_LABELS[student.skillLevel]}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox label="Sessions" value={sessionCount.toString()} />
        <StatBox label="Analyzed" value={completedCount.toString()} />
        <StatBox
          label="Joined"
          value={new Date(student.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })}
        />
      </View>

      {/* Notes */}
      {student.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>INSTRUCTOR NOTES</Text>
          <Text style={styles.notesText}>{student.notes}</Text>
        </View>
      )}

      {/* Session history */}
      <Text style={styles.sectionTitle}>SESSION HISTORY</Text>
      {sessions.length === 0 ? (
        <Text style={styles.emptyText}>No sessions yet for this student.</Text>
      ) : (
        sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onPress={() => router.push(`/playback/${session.id}`)}
          />
        ))
      )}
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1 },
  content: { paddingBottom: 40 },
  errorText: { color: Colors.textSecondary, textAlign: 'center', marginTop: 40, fontSize: 16 },
  profileHeader: { alignItems: 'center', paddingVertical: 32 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: Colors.primary, fontSize: 30, fontWeight: '700' },
  name: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  email: { color: Colors.textMuted, fontSize: 14, marginTop: 4 },
  levelBadge: {
    marginTop: 8,
    backgroundColor: Colors.primary + '20',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  levelText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statValue: { color: Colors.textPrimary, fontSize: 22, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2, fontWeight: '500' },
  notesSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
});
