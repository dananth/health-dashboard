import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchGarminSummary, fetchProfile, calculateMetrics,
  fetchExerciseSuggestions, fetchDietPlan,
  fetchWorkoutLogs, addWorkoutLog, deleteWorkoutLog,
  fetchMealLogs, addMealLog, deleteMealLog, fetchDailySummary,
  type UserProfile,
} from './api';

// ── Garmin ──────────────────────────────────────────────────────────────────
export const useGarminSummary = (days = 7) =>
  useQuery({ queryKey: ['garmin', days], queryFn: () => fetchGarminSummary(days), retry: 1 });

// ── Profile / Metrics ────────────────────────────────────────────────────────
export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: fetchProfile });

export const useCalculateMetrics = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: UserProfile) => calculateMetrics(p),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
};

// ── Exercise ──────────────────────────────────────────────────────────────────
export const useExerciseSuggestions = () =>
  useQuery({ queryKey: ['exercise'], queryFn: fetchExerciseSuggestions, retry: 1 });

// ── Diet ──────────────────────────────────────────────────────────────────────
export const useDietPlan = () =>
  useQuery({ queryKey: ['diet'], queryFn: fetchDietPlan, retry: 1 });

// ── Logs ──────────────────────────────────────────────────────────────────────
export const useWorkoutLogs = (date?: string) =>
  useQuery({ queryKey: ['workout-logs', date], queryFn: () => fetchWorkoutLogs(date) });

export const useAddWorkoutLog = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: addWorkoutLog, onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-logs'] }) });
};
export const useDeleteWorkoutLog = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteWorkoutLog, onSuccess: () => qc.invalidateQueries({ queryKey: ['workout-logs'] }) });
};

export const useMealLogs = (date?: string) =>
  useQuery({ queryKey: ['meal-logs', date], queryFn: () => fetchMealLogs(date) });

export const useAddMealLog = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: addMealLog, onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-logs'] }) });
};
export const useDeleteMealLog = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteMealLog, onSuccess: () => qc.invalidateQueries({ queryKey: ['meal-logs'] }) });
};

export const useDailySummary = (date?: string) =>
  useQuery({ queryKey: ['daily-summary', date], queryFn: () => fetchDailySummary(date) });
