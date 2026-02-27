import React, { useEffect, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { SessionCard } from '../../components/SessionCard';
import { useOfflineQueue } from '../../hooks/useOfflineQueue';
import type { Session } from '../../types/session';

export default function HomeScreen() {
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [instructorName, setInstructorName] = useState('Instructor');
  const { pendingCount, isSyncing } = useOfflineQueue();

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();
    if (profile?.email) {
      setInstructorName(profile.email.split('@')[0]);
    }

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (sessions) setRecentSessions(sessions as Session[]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          Hey, {instructorName} 👋
        </Text>
        <Text style={styles.greetingSub}>Ready to coach?</Text>
      </View>

      {/* Offline sync badge */}
      {pendingCount > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>
            {isSyncing
              ? `Syncing ${pendingCount} pending analysis…`
              : `${pendingCount} session${pendingCount !== 1 ? 's' : ''} pending sync`}
          </Text>
        </View>
      )}

      {/* Quick capture CTA */}
      <TouchableOpacity
        style={styles.captureButton}
        onPress={() => router.push('/capture')}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Start a new recording session"
      >
        <Text style={styles.captureIcon}>🎿</Text>
        <View>
          <Text style={styles.captureTitle}>New Session</Text>
          <Text style={styles.captureSub}>Record and analyze ski technique</Text>
        </View>
        <Text style={styles.captureArrow}>›</Text>
      </TouchableOpacity>

      {/* Recent sessions */}
      <Text style={styles.sectionTitle}>Recent Sessions</Text>
      {recentSessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No sessions yet.</Text>
          <Text style={styles.emptySubText}>
            Record your first session to get started.
          </Text>
        </View>
      ) : (
        recentSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            onPress={() => router.push(`/playback/${session.id}`)}
          />
        ))
      )}

      {recentSessions.length > 0 && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/library')}
        >
          <Text style={styles.viewAllText}>View all sessions →</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },
  greeting: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
  greetingText: {
    color: Colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
  },
  greetingSub: {
    color: Colors.textSecondary,
    fontSize: 15,
    marginTop: 2,
  },
  syncBanner: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: Colors.overlayYellow + '20',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.overlayYellow + '40',
  },
  syncText: { color: Colors.overlayYellow, fontSize: 13, fontWeight: '500' },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    padding: 18,
    gap: 14,
  },
  captureIcon: { fontSize: 28 },
  captureTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  captureSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 },
  captureArrow: { color: '#fff', fontSize: 24, marginLeft: 'auto' },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 16, fontWeight: '500' },
  emptySubText: { color: Colors.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  viewAllText: { color: Colors.primary, fontSize: 14, fontWeight: '500' },
});
