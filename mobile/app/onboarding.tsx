import React, { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PSIA_LEVELS = ['Level I', 'Level II', 'Level III', 'Examiner', 'None / Other'];

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

const STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to\nInstructor Buddy',
    subtitle: 'AI-powered ski coaching analysis. Record student runs, get instant technique insights.',
    icon: '🎿',
  },
  {
    id: 'how',
    title: 'How It Works',
    subtitle: '1. Record your student skiing\n2. On-device pose estimation runs automatically\n3. Claude AI identifies 1-2 key coaching moments\n4. Review annotated frames with actionable cues',
    icon: '🧠',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    subtitle: 'Tell us about yourself so we can tailor the coaching language.',
    icon: '👤',
  },
];

export default function OnboardingScreen() {
  const flatListRef = useRef<FlatList>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [psiaLevel, setPsiaLevel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function goNext() {
    if (currentStep < STEPS.length - 1) {
      const next = currentStep + 1;
      setCurrentStep(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    } else {
      handleComplete();
    }
  }

  async function handleComplete() {
    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ psia_level: psiaLevel || null })
        .eq('id', user.id);
    }
    setIsSaving(false);
    router.replace('/(tabs)');
  }

  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <LinearGradient
      colors={['#0a0f1e', '#0d1830', '#0a0f1e']}
      style={styles.screen}
    >
      <FlatList
        ref={flatListRef}
        data={STEPS}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        renderItem={({ item, index }) => (
          <View style={styles.slide}>
            <Text style={styles.icon}>{item.icon}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>

            {/* Profile step extras */}
            {item.id === 'profile' && (
              <View style={styles.profileSection}>
                <Text style={styles.fieldLabel}>PSIA Certification Level</Text>
                <View style={styles.levelOptions}>
                  {PSIA_LEVELS.map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.levelChip,
                        psiaLevel === level && styles.levelChipActive,
                      ]}
                      onPress={() => setPsiaLevel(level)}
                    >
                      <Text
                        style={[
                          styles.levelChipText,
                          psiaLevel === level && styles.levelChipTextActive,
                        ]}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      />

      {/* Step dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === currentStep && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.ctaButton, isSaving && styles.ctaDisabled]}
        onPress={goNext}
        disabled={isSaving}
        accessibilityRole="button"
        accessibilityLabel={isLastStep ? 'Get started' : 'Next'}
      >
        <Text style={styles.ctaText}>
          {isSaving ? 'Getting started…' : isLastStep ? "Let's Go 🎿" : 'Next →'}
        </Text>
      </TouchableOpacity>

      {!isLastStep && (
        <TouchableOpacity style={styles.skipButton} onPress={handleComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingTop: 80,
  },
  icon: { fontSize: 72, marginBottom: 24 },
  title: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 26,
  },
  profileSection: { width: '100%', marginTop: 32 },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  levelOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  levelChipActive: { backgroundColor: Colors.primary + '25', borderColor: Colors.primary },
  levelChipText: { color: Colors.textMuted, fontSize: 13, fontWeight: '500' },
  levelChipTextActive: { color: Colors.primary, fontWeight: '600' },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  dotActive: { width: 20, backgroundColor: Colors.primary },
  ctaButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  skipButton: { alignSelf: 'center', marginBottom: 32 },
  skipText: { color: Colors.textMuted, fontSize: 14 },
});
