import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors } from '../../constants/colors';
import { SessionCard } from '../../components/SessionCard';
import type { Session } from '../../types/session';

export default function LibraryScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, []),
  );

  async function loadSessions() {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });

    setSessions((data ?? []) as Session[]);
    setIsLoading(false);
  }

  return (
    <View style={styles.screen}>
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📹</Text>
          <Text style={styles.emptyText}>No sessions yet</Text>
          <Text style={styles.emptySub}>Record a session to get started.</Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.push('/capture')}
          >
            <Text style={styles.ctaText}>Record First Session</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onPress={() => router.push(`/playback/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1 },
  list: { paddingVertical: 12, paddingBottom: 40 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptySub: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  ctaButton: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
