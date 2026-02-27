import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase, signOut } from '../../lib/supabase';
import { getCostAnalytics } from '../../lib/api';
import { Colors } from '../../constants/colors';
import { FOCUS_AREA_LABELS, SKILL_LEVEL_LABELS } from '../../constants/posePoints';
import type { FocusArea, SkillLevel } from '../../types/session';

const PSIA_LEVELS = ['Level I', 'Level II', 'Level III', 'Examiner'];
const FOCUS_AREAS = Object.keys(FOCUS_AREA_LABELS) as FocusArea[];
const SKILL_LEVELS = Object.keys(SKILL_LEVEL_LABELS) as SkillLevel[];

export default function SettingsScreen() {
  const [email, setEmail] = useState('');
  const [psiaLevel, setPsiaLevel] = useState('');
  const [defaultFocus, setDefaultFocus] = useState<FocusArea>('general');
  const [defaultSkill, setDefaultSkill] = useState<SkillLevel>('intermediate');
  const [isSaving, setIsSaving] = useState(false);
  const [analytics, setAnalytics] = useState<{
    sessionCount: number;
    totalFramesAnalyzed: number;
    estimatedCostUsd: number;
  } | null>(null);

  useEffect(() => {
    loadProfile();
    loadAnalytics();
  }, []);

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (data) {
      setEmail(data.email);
      setPsiaLevel(data.psia_level ?? '');
      setDefaultFocus((data.default_focus_area as FocusArea) ?? 'general');
      setDefaultSkill((data.default_skill_level as SkillLevel) ?? 'intermediate');
    }
  }

  async function loadAnalytics() {
    try {
      const data = await getCostAnalytics();
      setAnalytics(data);
    } catch { /* API may not be available */ }
  }

  async function handleSave() {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsSaving(false); return; }
    const { error } = await supabase
      .from('users')
      .update({ psia_level: psiaLevel || null })
      .eq('id', user.id);
    setIsSaving(false);
    if (error) {
      Alert.alert('Error', 'Failed to save settings.');
    } else {
      Alert.alert('Saved', 'Settings updated successfully.');
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Profile */}
      <Section title="INSTRUCTOR PROFILE">
        <Field label="Email">
          <Text style={styles.readonlyText}>{email}</Text>
        </Field>
        <Field label="PSIA Level">
          <View style={styles.chipRow}>
            {PSIA_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.chip, psiaLevel === level && styles.chipActive]}
                onPress={() => setPsiaLevel(level)}
              >
                <Text style={[styles.chipText, psiaLevel === level && styles.chipTextActive]}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>
      </Section>

      {/* Defaults */}
      <Section title="COACHING DEFAULTS">
        <Field label="Default Focus Area">
          <View style={styles.chipRow}>
            {FOCUS_AREAS.map((fa) => (
              <TouchableOpacity
                key={fa}
                style={[styles.chip, defaultFocus === fa && styles.chipActive]}
                onPress={() => setDefaultFocus(fa)}
              >
                <Text style={[styles.chipText, defaultFocus === fa && styles.chipTextActive]}>
                  {FOCUS_AREA_LABELS[fa]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>
        <Field label="Default Skill Level">
          <View style={styles.chipRow}>
            {SKILL_LEVELS.map((sl) => (
              <TouchableOpacity
                key={sl}
                style={[styles.chip, defaultSkill === sl && styles.chipActive]}
                onPress={() => setDefaultSkill(sl)}
              >
                <Text style={[styles.chipText, defaultSkill === sl && styles.chipTextActive]}>
                  {SKILL_LEVEL_LABELS[sl]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>
      </Section>

      {/* Cost Dashboard */}
      {analytics && (
        <Section title="USAGE & COST (30 DAYS)">
          <View style={styles.statsGrid}>
            <StatCell label="Sessions" value={analytics.sessionCount.toString()} />
            <StatCell label="Frames Analyzed" value={analytics.totalFramesAnalyzed.toString()} />
            <StatCell
              label="Est. API Cost"
              value={`$${analytics.estimatedCostUsd.toFixed(2)}`}
            />
          </View>
        </Section>
      )}

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.disabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving…' : 'Save Settings'}</Text>
      </TouchableOpacity>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Instructor Buddy v1.0 · claude-sonnet-4-6</Text>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 60 },
  section: { marginTop: 24, marginHorizontal: 16 },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  sectionBody: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  field: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 8,
  },
  fieldLabel: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  readonlyText: { color: Colors.textPrimary, fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary + '25', borderColor: Colors.primary },
  chipText: { color: Colors.textMuted, fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: Colors.primary },
  statsGrid: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2, textAlign: 'center' },
  saveButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  signOutButton: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.overlayRed + '50',
  },
  signOutText: { color: Colors.overlayRed, fontSize: 16, fontWeight: '600' },
  version: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
  },
});
