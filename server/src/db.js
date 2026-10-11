import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const dbPath = path.resolve(__dirname, '../mindora.db');
export const db = new DatabaseSync(dbPath);

export function runMigrations() {
  // Ensure schema_migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);

  // Check which migrations have already run
  const applied = db.prepare('SELECT version FROM schema_migrations').all();
  const appliedVersions = new Set(applied.map((r) => r.version));

  // Migration 1: Core Mindora tables & focus_sessions table
  if (!appliedVersions.has(1)) {
    console.log('[Database] Applying Migration 001: Initial schema & focus_sessions...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS learning_activities (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        topic_id TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS focus_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        activity_id TEXT,
        activity_title TEXT,
        mode TEXT NOT NULL,
        planned_seconds INTEGER NOT NULL,
        actual_seconds INTEGER NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 1,
        notes TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Seed default student account if not present
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get('student@mindora.ai');
    if (!existingUser) {
      const hashedPassword = bcrypt.hashSync('password123', 8);
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash, role, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('usr_alex', 'Alex Chen', 'student@mindora.ai', hashedPassword, 'student', new Date().toISOString());
      console.log('[Database] Seeded student user: student@mindora.ai');
    }

    // Seed default learning activities
    const activitiesCount = db.prepare('SELECT COUNT(*) as count FROM learning_activities').get();
    if (activitiesCount.count === 0) {
      const activities = [
        ['act_101', 'Linear Algebra: Eigenvalues & Diagonalization', 'Mathematics III', 'math_la'],
        ['act_102', 'Data Structures: AVL Trees & Balance Factors', 'Data Structures', 'cs_ds'],
        ['act_103', 'OS: Virtual Memory & Page Replacement Algorithms', 'Operating Systems', 'cs_os'],
        ['act_104', 'DBMS: Normalization 3NF & BCNF Decomposition', 'Database Systems', 'cs_db'],
        ['act_105', 'Computer Networks: TCP 3-Way Handshake & Flow Control', 'Networks', 'cs_cn'],
      ];
      const insertAct = db.prepare('INSERT INTO learning_activities (id, title, subject, topic_id, created_at) VALUES (?, ?, ?, ?, ?)');
      const now = new Date().toISOString();
      for (const [id, title, subject, topicId] of activities) {
        insertAct.run(id, title, subject, topicId, now);
      }
      console.log('[Database] Seeded 5 initial learning activities.');
    }

    db.prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
      1,
      '001_initial_schema',
      new Date().toISOString()
    );
    console.log('[Database] Migration 001 applied successfully.');
  }
}

