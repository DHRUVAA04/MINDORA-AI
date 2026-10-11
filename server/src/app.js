import express from 'express';
import cors from 'cors';
import { runMigrations } from './db.js';
import { authRouter } from './routes/auth.js';
import { timerRouter } from './routes/timer.js';

// Run database migrations on startup
runMigrations();

export const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/timer', timerRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Mindora AI Backend Engine',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

