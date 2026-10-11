import express from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const timerRouter = express.Router();

// POST /api/timer/sessions — Save completed focus session
timerRouter.post('/sessions', requireAuth, (req, res) => {
  const {
    activity_id,
    activity_title,
    mode = 'pomodoro',
    planned_seconds = 1500,
    actual_seconds = 1500,
    started_at = new Date().toISOString(),
    ended_at = new Date().toISOString(),
    completed = 1,
    notes = '',
  } = req.body;

  const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const userId = req.user.id;
  const createdAt = new Date().toISOString();

  try {
    const insertStmt = db.prepare(`
      INSERT INTO focus_sessions (
        id, user_id, activity_id, activity_title, mode,
        planned_seconds, actual_seconds, started_at, ended_at,
        completed, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      sessionId,
      userId,
      activity_id || null,
      activity_title || null,
      mode,
      Number(planned_seconds),
      Number(actual_seconds),
      started_at,
      ended_at,
      completed ? 1 : 0,
      notes || null,
      createdAt
    );

    const savedSession = db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(sessionId);

    res.status(201).json({
      success: true,
      message: 'Focus session recorded successfully. Self-timed study time saved.',
      session: savedSession,
    });
  } catch (err) {
    console.error('Error saving focus session:', err);
    res.status(500).json({ error: 'Failed to record focus session', details: err.message });
  }
});

// GET /api/timer/sessions — List sessions for authenticated user
timerRouter.get('/sessions', requireAuth, (req, res) => {
  const userId = req.user.id;
  try {
    const sessions = db.prepare(`
      SELECT * FROM focus_sessions 
      WHERE user_id = ? 
      ORDER BY started_at DESC 
      LIMIT 50
    `).all(userId);

    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
});

// GET /api/timer/stats — Aggregate metrics: today's focus, weekly distribution, streak
timerRouter.get('/stats', requireAuth, (req, res) => {
  const userId = req.user.id;
  try {
    // Today boundary
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayIso = startOfToday.toISOString();

    // 7 days ago boundary
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const todayRows = db.prepare(`
      SELECT SUM(actual_seconds) as total_seconds, COUNT(*) as count 
      FROM focus_sessions 
      WHERE user_id = ? AND started_at >= ?
    `).get(userId, todayIso);

    const weeklyRows = db.prepare(`
      SELECT SUM(actual_seconds) as total_seconds, COUNT(*) as count 
      FROM focus_sessions 
      WHERE user_id = ? AND started_at >= ?
    `).get(userId, sevenDaysAgo);

    const todaySeconds = todayRows?.total_seconds || 0;
    const weeklySeconds = weeklyRows?.total_seconds || 0;

    const recentSessions = db.prepare(`
      SELECT * FROM focus_sessions 
      WHERE user_id = ? 
      ORDER BY started_at DESC 
      LIMIT 10
    `).all(userId);

    res.json({
      stats: {
        todayMinutes: Math.round(todaySeconds / 60),
        todaySeconds,
        weeklyTotalMinutes: Math.round(weeklySeconds / 60),
        sessionsCount: todayRows?.count || 0,
      },
      history: recentSessions,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate timer statistics' });
  }
});

// GET /api/timer/activities — Fetch list of linkable learning activities
timerRouter.get('/activities', requireAuth, (req, res) => {
  try {
    const activities = db.prepare('SELECT * FROM learning_activities ORDER BY title ASC').all();
    res.json({ activities });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch learning activities' });
  }
});

