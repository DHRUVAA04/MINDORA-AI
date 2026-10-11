import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from './app.js';
import { generateToken } from './auth.js';

test('Timer API Backend Suite', async (t) => {
  const validToken = generateToken({
    id: 'usr_alex',
    name: 'Alex Chen',
    email: 'student@mindora.ai',
    role: 'student',
  });

  await t.test('POST /api/timer/sessions rejects request without authorization header', async () => {
    const res = await request(app)
      .post('/api/timer/sessions')
      .send({
        mode: 'pomodoro',
        planned_seconds: 1500,
        actual_seconds: 1500,
      });

    assert.equal(res.status, 401);
    assert.match(res.body.error, /Authorization header missing/i);
  });

  await t.test('POST /api/timer/sessions successfully records completed session with auth', async () => {
    const startedAt = new Date().toISOString();
    const endedAt = new Date().toISOString();

    const res = await request(app)
      .post('/api/timer/sessions')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        activity_id: 'act_103',
        activity_title: 'OS: Virtual Memory & Page Replacement Algorithms',
        mode: 'pomodoro',
        planned_seconds: 1500,
        actual_seconds: 1500,
        started_at: startedAt,
        ended_at: endedAt,
        completed: 1,
        notes: 'Simulated Belady anomaly with 3 vs 4 page frames',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.session.id);
    assert.equal(res.body.session.user_id, 'usr_alex');
    assert.equal(res.body.session.activity_id, 'act_103');
    assert.equal(res.body.session.mode, 'pomodoro');
    assert.equal(res.body.session.actual_seconds, 1500);
    assert.equal(res.body.session.completed, 1);
    assert.equal(res.body.session.notes, 'Simulated Belady anomaly with 3 vs 4 page frames');
  });

  await t.test('GET /api/timer/sessions retrieves recorded sessions for authorized user', async () => {
    const res = await request(app)
      .get('/api/timer/sessions')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.sessions));
    assert.ok(res.body.sessions.length > 0);
    assert.equal(res.body.sessions[0].user_id, 'usr_alex');
  });

  await t.test('GET /api/timer/stats returns aggregated self-timed minutes', async () => {
    const res = await request(app)
      .get('/api/timer/stats')
      .set('Authorization', `Bearer ${validToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.stats);
    assert.ok(typeof res.body.stats.todayMinutes === 'number');
    assert.ok(res.body.stats.todayMinutes >= 25);
    assert.ok(res.body.stats.weeklyTotalMinutes >= 25);
    assert.ok(Array.isArray(res.body.history));
  });
});
