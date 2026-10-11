import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { GoalsPage } from './pages/GoalsPage';
import { DiagnosticPage } from './pages/DiagnosticPage';
import { SkillGapsPage } from './pages/SkillGapsPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { MentorPage } from './pages/MentorPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { PdfNotesPage } from './pages/PdfNotesPage';
import { PracticePage } from './pages/PracticePage';
import { ProgressPage } from './pages/ProgressPage';
import { TimetablePage } from './pages/TimetablePage';
import { TimerPage } from './pages/TimerPage';
import { ProfilePage } from './pages/ProfilePage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { useAuthStore } from './store/authStore';
import { Brain, Loader2 } from 'lucide-react';

// Protected Route wrapper component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F3FF] dark:bg-[#0B0A1A]">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-midnight via-brand-violet to-brand-orchid flex items-center justify-center shadow-violet-glow mb-4 animate-pulse-subtle">
          <Brain className="w-8 h-8 text-brand-cyan" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-violet dark:text-brand-cyan">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Synchronizing Mindora session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Route wrapper that redirects logged-in users away from auth screens
const PublicOnlyRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing & Auth Routes (No sidebar, no persistent clock) */}
        <Route
          path="/welcome"
          element={
            <PublicOnlyRoute>
              <LandingPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyRoute>
              <ForgotPasswordPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicOnlyRoute>
              <ResetPasswordPage />
            </PublicOnlyRoute>
          }
        />

        {/* Protected App Routes wrapped inside persistent AppShell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="diagnostic" element={<DiagnosticPage />} />
          <Route path="skill-gaps" element={<SkillGapsPage />} />
          <Route path="roadmap" element={<RoadmapPage />} />
          <Route path="ai-mentor" element={<MentorPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="pdf-notes" element={<PdfNotesPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="timetable" element={<TimetablePage />} />
          <Route path="timer" element={<TimerPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
