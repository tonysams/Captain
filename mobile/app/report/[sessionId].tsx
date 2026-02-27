import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams } from 'expo-router';
import { getSessionReport } from '../../lib/api';
import { Colors } from '../../constants/colors';
import { FOCUS_AREA_LABELS, SKILL_LEVEL_LABELS } from '../../constants/posePoints';
import { useSessionStore } from '../../hooks/useSession';

interface ReportData {
  reportId: string;
  sessionId: string;
  generatedAt: string;
  focusArea: string;
  skillLevel: string;
  frameCount: number;
  frames: Array<{
    frame_index: number;
    timestamp: number;
    analysis_results?: Array<{
      primary_observation: { text: string; confidence: number };
      cue: string;
      created_at: string;
    }>;
  }>;
  notes: Array<{ content: string; created_at: string }>;
  shareUrl: string;
}

export default function ReportScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { frames } = useSessionStore();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (sessionId) loadReport(sessionId);
  }, [sessionId]);

  async function loadReport(id: string) {
    setIsLoading(true);
    try {
      const { report: data } = await getSessionReport(id);
      setReport(data as ReportData);
    } catch {
      // Fallback: build report from local session store
      const localReport: ReportData = {
        reportId: id,
        sessionId: id,
        generatedAt: new Date().toISOString(),
        focusArea: 'general',
        skillLevel: 'intermediate',
        frameCount: frames.length,
        frames: frames.map((f) => ({
          frame_index: f.frameIndex,
          timestamp: f.timestamp,
          analysis_results: f.coaching
            ? [
                {
                  primary_observation: f.coaching.primaryObservation,
                  cue: f.coaching.cue,
                  created_at: new Date().toISOString(),
                },
              ]
            : [],
        })),
        notes: [],
        shareUrl: `https://instructorbuddy.app/report/${id}`,
      };
      setReport(localReport);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleShareLink() {
    if (!report) return;
    await Share.share({
      message: `Ski coaching session from Instructor Buddy:\n${report.shareUrl}`,
      url: report.shareUrl,
    });
  }

  async function handleExportPDF() {
    if (!report || !Sharing.isAvailableAsync()) return;
    setIsExporting(true);
    try {
      const html = buildReportHTML(report);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });
    } catch (err) {
      Alert.alert('Export Failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsExporting(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  if (!report) return null;

  const analyzedFrames = report.frames.filter(
    (f) => (f.analysis_results?.length ?? 0) > 0,
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Session Report</Text>
        <Text style={styles.subtitle}>
          {FOCUS_AREA_LABELS[report.focusArea] ?? report.focusArea} ·{' '}
          {SKILL_LEVEL_LABELS[report.skillLevel] ?? report.skillLevel}
        </Text>
        <Text style={styles.date}>
          {new Date(report.generatedAt).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox label="Frames" value={report.frameCount.toString()} />
        <StatBox label="Analyzed" value={analyzedFrames.length.toString()} />
        <StatBox label="Cues" value={analyzedFrames.length.toString()} />
      </View>

      {/* Coaching observations */}
      <Text style={styles.sectionTitle}>COACHING OBSERVATIONS</Text>
      {analyzedFrames.length === 0 ? (
        <Text style={styles.emptyText}>No analysis results available.</Text>
      ) : (
        analyzedFrames.map((frame, i) => {
          const analysis = frame.analysis_results?.[0];
          if (!analysis) return null;
          return (
            <View key={i} style={styles.observationCard}>
              <Text style={styles.frameLabel}>
                Frame {frame.frame_index + 1} · {frame.timestamp.toFixed(1)}s
              </Text>
              <Text style={styles.observationText}>
                {analysis.primary_observation.text}
              </Text>
              <View style={styles.cuePill}>
                <Text style={styles.cueLabel}>CUE</Text>
                <Text style={styles.cueText}>{analysis.cue}</Text>
              </View>
              <View
                style={[
                  styles.confidenceBar,
                  {
                    width: `${analysis.primary_observation.confidence * 100}%`,
                    backgroundColor:
                      analysis.primary_observation.confidence > 0.8
                        ? Colors.overlayGreen
                        : analysis.primary_observation.confidence > 0.6
                          ? Colors.overlayYellow
                          : Colors.overlayRed,
                  },
                ]}
              />
            </View>
          );
        })
      )}

      {/* Notes */}
      {report.notes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>INSTRUCTOR NOTES</Text>
          {report.notes.map((note, i) => (
            <View key={i} style={styles.noteCard}>
              <Text style={styles.noteText}>{note.content}</Text>
              <Text style={styles.noteDate}>
                {new Date(note.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* Actions */}
      <TouchableOpacity style={styles.shareButton} onPress={handleShareLink}>
        <Text style={styles.shareButtonText}>🔗 Share Link</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pdfButton, isExporting && styles.disabled]}
        onPress={handleExportPDF}
        disabled={isExporting}
      >
        <Text style={styles.pdfButtonText}>
          {isExporting ? 'Generating PDF…' : '📄 Export PDF'}
        </Text>
      </TouchableOpacity>
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

function buildReportHTML(report: ReportData): string {
  const analyzedFrames = report.frames.filter((f) => (f.analysis_results?.length ?? 0) > 0);
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, sans-serif; color: #1a1a2e; padding: 32px; }
        h1 { font-size: 28px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 16px; margin-bottom: 24px; }
        .card { background: #f5f7ff; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
        .cue { background: #e8f0ff; border-left: 4px solid #4A9EFF; padding: 8px 12px; border-radius: 4px; font-weight: bold; margin-top: 8px; }
        .frame-label { font-size: 12px; color: #888; margin-bottom: 6px; }
      </style>
    </head>
    <body>
      <h1>Session Report</h1>
      <p class="subtitle">${FOCUS_AREA_LABELS[report.focusArea] ?? report.focusArea} · ${SKILL_LEVEL_LABELS[report.skillLevel] ?? report.skillLevel}<br/>
      ${new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <p><strong>Frames analyzed:</strong> ${analyzedFrames.length} of ${report.frameCount}</p>
      <h2>Coaching Observations</h2>
      ${analyzedFrames.map((f, i) => {
        const a = f.analysis_results?.[0];
        return a ? `
          <div class="card">
            <div class="frame-label">Frame ${f.frame_index + 1} · ${f.timestamp.toFixed(1)}s</div>
            <p>${a.primary_observation.text}</p>
            <div class="cue">${a.cue}</div>
          </div>
        ` : '';
      }).join('')}
      <p style="color:#aaa;font-size:11px;margin-top:32px">Generated by Instructor Buddy · claude-sonnet-4-6</p>
    </body>
    </html>
  `;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 60 },
  header: { padding: 24, paddingBottom: 16 },
  title: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800' },
  subtitle: { color: Colors.textSecondary, fontSize: 15, marginTop: 4 },
  date: { color: Colors.textMuted, fontSize: 13, marginTop: 4 },
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
  statValue: { color: Colors.textPrimary, fontSize: 24, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginHorizontal: 20,
    marginBottom: 8,
    marginTop: 8,
  },
  observationCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  frameLabel: { color: Colors.textMuted, fontSize: 11, marginBottom: 6 },
  observationText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  cuePill: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  cueLabel: { color: Colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginBottom: 3 },
  cueText: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  confidenceBar: {
    height: 2,
    borderRadius: 1,
    marginTop: 10,
  },
  noteCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  noteDate: { color: Colors.textMuted, fontSize: 11, marginTop: 8 },
  shareButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  shareButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  pdfButton: {
    backgroundColor: Colors.bgCard,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pdfButtonText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  emptyText: { color: Colors.textMuted, textAlign: 'center', marginTop: 16, fontSize: 14 },
  disabled: { opacity: 0.5 },
});
