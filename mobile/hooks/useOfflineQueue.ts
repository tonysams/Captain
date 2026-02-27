import { useEffect, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import {
  getPendingJobs,
  markJobComplete,
  incrementJobRetries,
  getPendingJobCount,
} from '../lib/storage';
import { uploadFrame } from '../lib/api';
import type { FocusArea, OfflineJob, SkillLevel } from '../types/session';
import type { PoseKeypoint } from '../types/pose';

export interface UseOfflineQueueReturn {
  pendingCount: number;
  isSyncing: boolean;
  syncNow: () => Promise<void>;
}

export function useOfflineQueue(): UseOfflineQueueReturn {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);

  const refreshCount = async () => {
    const count = await getPendingJobCount();
    setPendingCount(count);
  };

  const processJob = async (job: OfflineJob): Promise<boolean> => {
    try {
      const imageBase64 = await FileSystem.readAsStringAsync(job.imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const poseKeypoints: PoseKeypoint[] = JSON.parse(job.poseJson);
      const context = JSON.parse(job.context) as {
        skillLevel: SkillLevel;
        focusArea: FocusArea;
        previousNote?: string;
      };

      await uploadFrame({
        sessionId: job.sessionId,
        frameIndex: job.frameIndex,
        timestamp: job.timestamp,
        imageBase64,
        poseKeypoints,
        context,
      });

      await markJobComplete(job.id);
      return true;
    } catch (err) {
      console.warn(`[OfflineQueue] Job ${job.id} failed:`, err);
      await incrementJobRetries(job.id);
      return false;
    }
  };

  const syncNow = async () => {
    if (syncInProgress.current) return;
    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const jobs = await getPendingJobs(5);
      for (const job of jobs) {
        await processJob(job);
      }
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
      await refreshCount();
    }
  };

  // Watch for connectivity changes and auto-sync
  useEffect(() => {
    refreshCount();

    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        syncNow();
      }
    });

    return unsubscribe;
  }, []);

  return { pendingCount, isSyncing, syncNow };
}
