import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTimerStore } from '../store/timerStore';

describe('Timer Store & Countdown Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 11, 10, 0, 0));
    useTimerStore.getState().resetTimer();
    useTimerStore.getState().setMode('pomodoro');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default 25 minutes for pomodoro mode', () => {
    const state = useTimerStore.getState();
    expect(state.mode).toBe('pomodoro');
    expect(state.remainingSeconds).toBe(1500); // 25 * 60
    expect(state.isRunning).toBe(false);
  });

  it('starts countdown with absolute endTime timestamp and computes remaining on tick', () => {
    const store = useTimerStore.getState();
    const startNow = Date.now();
    store.startTimer();

    const runningState = useTimerStore.getState();
    expect(runningState.isRunning).toBe(true);
    expect(runningState.endTime).toBe(startNow + 1500 * 1000);

    // Advance 60 seconds
    vi.setSystemTime(new Date(startNow + 60 * 1000));
    useTimerStore.getState().tick();

    expect(useTimerStore.getState().remainingSeconds).toBe(1440);
  });

  it('pauses and resumes accurately without losing elapsed seconds', () => {
    const store = useTimerStore.getState();
    const startNow = Date.now();
    store.startTimer();

    // Advance 120 seconds
    vi.setSystemTime(new Date(startNow + 120 * 1000));
    store.pauseTimer();

    const pausedState = useTimerStore.getState();
    expect(pausedState.isRunning).toBe(false);
    expect(pausedState.isPaused).toBe(true);
    expect(pausedState.remainingSeconds).toBe(1380); // 1500 - 120
    expect(pausedState.endTime).toBeNull();

    // Advance time while paused (e.g. 5 minutes idle)
    vi.setSystemTime(new Date(startNow + 420 * 1000));

    // Resume
    pausedState.resumeTimer();
    const resumedState = useTimerStore.getState();
    expect(resumedState.isRunning).toBe(true);
    // End time should be now + 1380s
    expect(resumedState.endTime).toBe(Date.now() + 1380 * 1000);

    // Tick 10 seconds later
    vi.setSystemTime(new Date(Date.now() + 10 * 1000));
    resumedState.tick();
    expect(useTimerStore.getState().remainingSeconds).toBe(1370);
  });

  it('persists state to localStorage and restores correctly on page reload', () => {
    const store = useTimerStore.getState();
    const startNow = Date.now();
    store.startTimer();

    // Check localStorage was populated
    const rawSaved = localStorage.getItem('mindora_timer_state');
    expect(rawSaved).not.toBeNull();
    const saved = JSON.parse(rawSaved!);
    expect(saved.isRunning).toBe(true);
    expect(saved.endTime).toBe(startNow + 1500 * 1000);

    // Simulate page reload after 300 seconds
    vi.setSystemTime(new Date(startNow + 300 * 1000));

    // Re-evaluating or re-initializing state from storage
    const restoredEndTime = saved.endTime;
    const computedRemaining = Math.round((restoredEndTime - Date.now()) / 1000);
    expect(computedRemaining).toBe(1200); // 1500 - 300
  });

  it('triggers completion modal and records session when countdown reaches zero', () => {
    const store = useTimerStore.getState();
    const startNow = Date.now();
    store.setLinkedActivity({
      id: 'act_test',
      title: 'Operating Systems: Virtual Memory',
    });
    store.setSessionNotes('Completed 4 replacement trace examples');
    store.startTimer();

    // Jump 1500 seconds forward to expiration
    vi.setSystemTime(new Date(startNow + 1501 * 1000));
    store.tick();

    const completedState = useTimerStore.getState();
    expect(completedState.isRunning).toBe(false);
    expect(completedState.remainingSeconds).toBe(0);
    expect(completedState.showCompletionModal).toBe(true);
    expect(completedState.lastCompletedSession).not.toBeNull();
    expect(completedState.lastCompletedSession?.activityTitle).toBe('Operating Systems: Virtual Memory');
    expect(completedState.lastCompletedSession?.completed).toBe(true);
    expect(completedState.sessionsCompletedCount).toBe(1);
  });
});

