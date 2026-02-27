import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { listStudents, createStudent } from '../../../lib/api';
import { Colors } from '../../../constants/colors';
import { StudentCard } from '../../../components/StudentCard';
import type { SkillLevel, Student } from '../../../types/session';

const SKILL_LEVELS: SkillLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('beginner');
  const [newNotes, setNewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, []),
  );

  async function loadStudents() {
    setIsLoading(true);
    try {
      const { students: data } = await listStudents();
      setStudents(data);
    } catch {
      // Students may not load if API isn't running
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddStudent() {
    if (!newEmail || !newName) {
      Alert.alert('Required Fields', 'Please enter a name and email.');
      return;
    }
    setIsSaving(true);
    try {
      await createStudent({
        email: newEmail,
        name: newName,
        skillLevel: newSkillLevel,
        notes: newNotes || undefined,
      });
      setShowAddModal(false);
      setNewEmail('');
      setNewName('');
      setNewNotes('');
      setNewSkillLevel('beginner');
      await loadStudents();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add student');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.screen}>
      {isLoading ? (
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={students}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <StudentCard
              student={item}
              onPress={() => router.push(`/students/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No students yet</Text>
              <Text style={styles.emptySub}>Add a student to start tracking their progress.</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 80 }} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        accessibilityRole="button"
        accessibilityLabel="Add new student"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Student Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Student</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalClose}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={Colors.textMuted}
            value={newName}
            onChangeText={setNewName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            placeholderTextColor={Colors.textMuted}
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>Skill Level</Text>
          <View style={styles.skillRow}>
            {SKILL_LEVELS.map((level) => (
              <TouchableOpacity
                key={level}
                style={[styles.skillChip, newSkillLevel === level && styles.skillChipActive]}
                onPress={() => setNewSkillLevel(level)}
              >
                <Text style={[styles.skillChipText, newSkillLevel === level && styles.skillChipTextActive]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Notes (optional)"
            placeholderTextColor={Colors.textMuted}
            value={newNotes}
            onChangeText={setNewNotes}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleAddStudent}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Adding…' : 'Add Student'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  loader: { flex: 1 },
  list: { paddingVertical: 12 },
  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 40, gap: 8 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyText: { color: Colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptySub: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32 },
  modal: { flex: 1, backgroundColor: Colors.bg, padding: 20 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  modalClose: { color: Colors.primary, fontSize: 16 },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: 10,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  fieldLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 8 },
  skillRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  skillChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.bgInput,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillChipActive: { backgroundColor: Colors.primary + '30', borderColor: Colors.primary },
  skillChipText: { color: Colors.textMuted, fontSize: 12, fontWeight: '500' },
  skillChipTextActive: { color: Colors.primary },
  saveButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
