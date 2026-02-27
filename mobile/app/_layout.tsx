import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { supabase, type AuthUser, getCurrentUser } from '../lib/supabase';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    getCurrentUser().then((u) => {
      setUser(u);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const u = await getCurrentUser();
        setUser(u);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.textPrimary,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: Colors.bg },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen
          name="capture"
          options={{ title: 'Record Session', headerBackTitle: 'Back', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="analysis/[sessionId]"
          options={{ title: 'Analyzing…', headerBackVisible: false }}
        />
        <Stack.Screen
          name="playback/[sessionId]"
          options={{ title: 'Session Review', headerBackTitle: 'Library' }}
        />
        <Stack.Screen
          name="report/[sessionId]"
          options={{ title: 'Session Report', headerBackTitle: 'Review' }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
