import { create } from 'zustand';

export type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'custom' | 'stopwatch' | 'activity';

export interface LinkedActivity {
  id: string;
  title: string;
  subject?: string;
  topicId?: string;
}

export interface FocusSessionLog {
  id: string;
  userId?: string;
  activityId?: string;
  activityTitle?: string;
  mode: TimerMode;
  plannedSeconds: number;
  actualSeconds: number;
  startedAt: string;
  endedAt: string;
  completed: boolean;
  notes?: string;
}

interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  isPaused: boolean;
  
  // Pomodoro config (in seconds)
  pomodoroDuration: number;   // default 25 * 60 = 1500
  shortBreakDuration: number; // default 5 * 60 = 300
  longBreakDuration: number;  // default 15 * 60 = 900
  customDuration: number;     // in seconds
  
  // Tracking
  remainingSeconds: number;
  elapsedSeconds: number; // for stopwatch or actual time spent
  endTime: number | null; // absolute timestamp (ms)
  startTime: number | null; // absolute timestamp (ms) of session start
  
  // Pomodoro cycle count
  sessionsCompletedCount: number;
  
  // Linked activity & notes
  linkedActivity: LinkedActivity | null;
  sessionNotes: string;

  // Preferences
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  
  // Completion modal / notice
  showCompletionModal: boolean;
  lastCompletedSession: FocusSessionLog | null;

  // Actions
  setMode: (mode: TimerMode, customMinutes?: number) => void;
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  skipSession: () => void;
  tick: () => void;
  setCustomDuration: (minutes: number) => void;
  setLinkedActivity: (activity: LinkedActivity | null) => void;
  setSessionNotes: (notes: string) => void;
  toggleSound: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  closeCompletionModal: () => void;
  saveCompletedSessionToBackend: () => Promise<void>;
}

const STORAGE_KEY = 'mindora_timer_state';

// Web Audio API chime synthesizer
export const playCompletionChime = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Aurora chord)
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.15);
      
      gain.gain.setValueAtTime(0, ctx.currentTime + index * 0.15);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + index * 0.15 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.15 + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + index * 0.15);
      osc.stop(ctx.currentTime + index * 0.15 + 0.85);
    });
  } catch (err) {
    console.warn('Audio playback not permitted or unavailable:', err);
  }
};

const getInitialModeDuration = (mode: TimerMode, customDuration: number): number => {
  switch (mode) {
    case 'pomodoro':
      return 25 * 60;
    case 'short_break':
      return 5 * 60;
    case 'long_break':
      return 15 * 60;
    case 'custom':
      return customDuration || 30 * 60;
    case 'activity':
      return 30 * 60;
    case 'stopwatch':
      return 0;
    default:
      return 25 * 60;
  }
};

const getPersistedState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
};

export const useTimerStore = create<TimerState>((set, get) => {
  const persisted = getPersistedState();

  const defaultMode: TimerMode = persisted?.mode || 'pomodoro';
  const customDuration = persisted?.customDuration || 30 * 60;
  let remainingSeconds = persisted?.remainingSeconds ?? getInitialModeDuration(defaultMode, customDuration);
  let isRunning = persisted?.isRunning ?? false;
  let endTime = persisted?.endTime ?? null;
  let startTime = persisted?.startTime ?? null;
  let elapsedSeconds = persisted?.elapsedSeconds ?? 0;

  // Check if timer was running and has elapsed during page reload/sleep
  if (isRunning && endTime) {
    const now = Date.now();
    if (defaultMode === 'stopwatch') {
      elapsedSeconds = Math.max(0, Math.round((now - (startTime || now)) / 1000));
    } else {
      const remaining = Math.round((endTime - now) / 1000);
      if (remaining <= 0) {
        remainingSeconds = 0;
        isRunning = false;
        endTime = null;
      } else {
        remainingSeconds = remaining;
      }
    }
  }

  const persist = (partial: Partial<TimerState>) => {
    try {
      const current = get();
      const stateToSave = {
        mode: partial.mode ?? current.mode,
        isRunning: partial.isRunning ?? current.isRunning,
        isPaused: partial.isPaused ?? current.isPaused,
        pomodoroDuration: partial.pomodoroDuration ?? current.pomodoroDuration,
        shortBreakDuration: partial.shortBreakDuration ?? current.shortBreakDuration,
        longBreakDuration: partial.longBreakDuration ?? current.longBreakDuration,
        customDuration: partial.customDuration ?? current.customDuration,
        remainingSeconds: partial.remainingSeconds ?? current.remainingSeconds,
        elapsedSeconds: partial.elapsedSeconds ?? current.elapsedSeconds,
        endTime: partial.endTime ?? current.endTime,
        startTime: partial.startTime ?? current.startTime,
        sessionsCompletedCount: partial.sessionsCompletedCount ?? current.sessionsCompletedCount,
        linkedActivity: partial.linkedActivity ?? current.linkedActivity,
        soundEnabled: partial.soundEnabled ?? current.soundEnabled,
        notificationsEnabled: partial.notificationsEnabled ?? current.notificationsEnabled,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // storage error
    }
  };

  return {
    mode: defaultMode,
    isRunning,
    isPaused: persisted?.isPaused ?? false,
    pomodoroDuration: persisted?.pomodoroDuration || 25 * 60,
    shortBreakDuration: persisted?.shortBreakDuration || 5 * 60,
    longBreakDuration: persisted?.longBreakDuration || 15 * 60,
    customDuration,
    remainingSeconds,
    elapsedSeconds,
    endTime,
    startTime,
    sessionsCompletedCount: persisted?.sessionsCompletedCount || 0,
    linkedActivity: persisted?.linkedActivity || null,
    sessionNotes: '',
    soundEnabled: persisted?.soundEnabled ?? true,
    notificationsEnabled: persisted?.notificationsEnabled ?? false,
    showCompletionModal: false,
    lastCompletedSession: null,

    setMode: (mode: TimerMode, customMinutes?: number) => {
      const { customDuration, pomodoroDuration, shortBreakDuration, longBreakDuration } = get();
      let duration = 25 * 60;
      let newCustomDuration = customDuration;

      if (mode === 'pomodoro') duration = pomodoroDuration;
      else if (mode === 'short_break') duration = shortBreakDuration;
      else if (mode === 'long_break') duration = longBreakDuration;
      else if (mode === 'custom') {
        if (customMinutes) newCustomDuration = customMinutes * 60;
        duration = newCustomDuration;
      } else if (mode === 'activity') duration = 30 * 60;
      else if (mode === 'stopwatch') duration = 0;

      const next = {
        mode,
        remainingSeconds: duration,
        elapsedSeconds: 0,
        isRunning: false,
        isPaused: false,
        endTime: null,
        startTime: null,
        customDuration: newCustomDuration,
      };
      set(next);
      persist(next);
    },

    setCustomDuration: (minutes: number) => {
      const seconds = Math.max(1, Math.min(180, minutes)) * 60;
      const next = {
        customDuration: seconds,
        remainingSeconds: seconds,
        isRunning: false,
        isPaused: false,
        endTime: null,
      };
      set(next);
      persist(next);
    },

    setLinkedActivity: (activity: LinkedActivity | null) => {
      set({ linkedActivity: activity });
      persist({ linkedActivity: activity });
    },

    setSessionNotes: (notes: string) => {
      set({ sessionNotes: notes });
    },

    toggleSound: () => {
      const next = !get().soundEnabled;
      set({ soundEnabled: next });
      persist({ soundEnabled: next });
    },

    requestNotificationPermission: async () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return false;
      try {
        const permission = await Notification.requestPermission();
        const granted = permission === 'granted';
        set({ notificationsEnabled: granted });
        persist({ notificationsEnabled: granted });
        return granted;
      } catch {
        return false;
      }
    },

    startTimer: () => {
      const { mode, remainingSeconds } = get();
      const now = Date.now();
      const newEndTime = mode === 'stopwatch' ? null : now + remainingSeconds * 1000;
      
      const next = {
        isRunning: true,
        isPaused: false,
        endTime: newEndTime,
        startTime: now,
      };
      set(next);
      persist(next);
    },

    pauseTimer: () => {
      const { mode, endTime, startTime, remainingSeconds, elapsedSeconds } = get();
      const now = Date.now();
      let updatedRemaining = remainingSeconds;
      let updatedElapsed = elapsedSeconds;

      if (mode === 'stopwatch') {
        if (startTime) {
          updatedElapsed = Math.round((now - startTime) / 1000);
        }
      } else if (endTime) {
        updatedRemaining = Math.max(0, Math.round((endTime - now) / 1000));
      }

      const next = {
        isRunning: false,
        isPaused: true,
        remainingSeconds: updatedRemaining,
        elapsedSeconds: updatedElapsed,
        endTime: null,
      };
      set(next);
      persist(next);
    },

    resumeTimer: () => {
      const { mode, remainingSeconds, elapsedSeconds } = get();
      const now = Date.now();
      const newEndTime = mode === 'stopwatch' ? null : now + remainingSeconds * 1000;
      const newStartTime = mode === 'stopwatch' ? now - elapsedSeconds * 1000 : now;

      const next = {
        isRunning: true,
        isPaused: false,
        endTime: newEndTime,
        startTime: newStartTime,
      };
      set(next);
      persist(next);
    },

    resetTimer: () => {
      const { mode, customDuration, pomodoroDuration, shortBreakDuration, longBreakDuration } = get();
      let duration = 25 * 60;
      if (mode === 'pomodoro') duration = pomodoroDuration;
      else if (mode === 'short_break') duration = shortBreakDuration;
      else if (mode === 'long_break') duration = longBreakDuration;
      else if (mode === 'custom') duration = customDuration;
      else if (mode === 'activity') duration = 30 * 60;
      else if (mode === 'stopwatch') duration = 0;

      const next = {
        isRunning: false,
        isPaused: false,
        remainingSeconds: duration,
        elapsedSeconds: 0,
        endTime: null,
        startTime: null,
      };
      set(next);
      persist(next);

      if (typeof document !== 'undefined') {
        document.title = 'Mindora AI — Personalized Study Nebula';
      }
    },

    skipSession: () => {
      const { mode, sessionsCompletedCount } = get();
      let nextMode: TimerMode = 'pomodoro';
      if (mode === 'pomodoro') {
        nextMode = (sessionsCompletedCount + 1) % 4 === 0 ? 'long_break' : 'short_break';
      } else {
        nextMode = 'pomodoro';
      }
      get().setMode(nextMode);
    },

    tick: () => {
      const { isRunning, mode, endTime, startTime, soundEnabled, notificationsEnabled, linkedActivity, sessionNotes, sessionsCompletedCount } = get();
      if (!isRunning) return;

      const now = Date.now();

      if (mode === 'stopwatch') {
        if (startTime) {
          const elapsed = Math.max(0, Math.round((now - startTime) / 1000));
          set({ elapsedSeconds: elapsed });
          const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
          const secs = (elapsed % 60).toString().padStart(2, '0');
          document.title = `(${mins}:${secs}) ⏱️ Mindora AI`;
        }
        return;
      }

      if (!endTime) return;

      const remaining = Math.max(0, Math.round((endTime - now) / 1000));
      set({ remainingSeconds: remaining });

      // Update document.title
      const mins = Math.floor(remaining / 60).toString().padStart(2, '0');
      const secs = (remaining % 60).toString().padStart(2, '0');
      document.title = `(${mins}:${secs}) ⏳ Mindora AI`;

      // Check if timer finished
      if (remaining <= 0) {
        // Complete session
        const plannedDuration = getInitialModeDuration(mode, get().customDuration);
        const sessionLog: FocusSessionLog = {
          id: 'session_' + Date.now(),
          mode,
          activityId: linkedActivity?.id,
          activityTitle: linkedActivity?.title,
          plannedSeconds: plannedDuration,
          actualSeconds: plannedDuration,
          startedAt: new Date(startTime || Date.now() - plannedDuration * 1000).toISOString(),
          endedAt: new Date().toISOString(),
          completed: true,
          notes: sessionNotes || undefined,
        };

        const newCount = mode === 'pomodoro' ? sessionsCompletedCount + 1 : sessionsCompletedCount;

        const next = {
          isRunning: false,
          isPaused: false,
          remainingSeconds: 0,
          endTime: null,
          startTime: null,
          sessionsCompletedCount: newCount,
          showCompletionModal: true,
          lastCompletedSession: sessionLog,
        };
        set(next);
        persist(next);

        document.title = '🎉 Focus Complete! — Mindora AI';

        // Play audio chime if enabled
        if (soundEnabled) {
          playCompletionChime();
        }

        // Send browser notification if permission granted
        if (notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Mindora AI — Session Complete!', {
              body: mode === 'pomodoro' 
                ? 'Great job! Time for a well-deserved break.' 
                : 'Break ended. Ready to dive back into your studies?',
              icon: '/favicon.ico',
            });
          } catch (e) {
            console.warn('Notification failed:', e);
          }
        }

        // Auto save to backend
        get().saveCompletedSessionToBackend();
      }
    },

    closeCompletionModal: () => {
      set({ showCompletionModal: false });
    },

    saveCompletedSessionToBackend: async () => {
      const { lastCompletedSession } = get();
      if (!lastCompletedSession) return;

      try {
        const token = localStorage.getItem('mindora_auth_token');
        await fetch('http://localhost:5000/api/timer/sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            activity_id: lastCompletedSession.activityId,
            activity_title: lastCompletedSession.activityTitle,
            mode: lastCompletedSession.mode,
            planned_seconds: lastCompletedSession.plannedSeconds,
            actual_seconds: lastCompletedSession.actualSeconds,
            started_at: lastCompletedSession.startedAt,
            ended_at: lastCompletedSession.endedAt,
            completed: 1,
            notes: lastCompletedSession.notes,
          }),
        });
      } catch (err) {
        console.warn('Backend sync failed or offline; session stored locally in state:', err);
      }
    },
  };
});

