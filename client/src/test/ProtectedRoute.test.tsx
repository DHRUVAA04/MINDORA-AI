import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const LoginPageMock = () => {
  const location = useLocation();
  const fromPath = (location.state as any)?.from?.pathname || 'none';
  return <div>Login Screen - Redirected from: {fromPath}</div>;
};

describe('Frontend ProtectedRoute Suite', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('redirects unauthenticated student to /login and preserves original location in state', () => {
    render(
      <MemoryRouter initialEntries={['/roadmap']}>
        <Routes>
          <Route path="/login" element={<LoginPageMock />} />
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <div>Private Roadmap Screen</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Private Roadmap Screen')).toBeNull();
    expect(screen.getByText('Login Screen - Redirected from: /roadmap')).toBeInTheDocument();
  });

  it('renders protected screen when student is authenticated', () => {
    useAuthStore.setState({
      user: {
        id: 'usr_test',
        name: 'Sarah Connor',
        email: 'sarah@mindora.ai',
        role: 'student',
        educational_level: 'College',
        age_range: '18-22',
        email_verified: true,
      },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/roadmap']}>
        <Routes>
          <Route path="/login" element={<LoginPageMock />} />
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <div>Private Roadmap Screen</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Private Roadmap Screen')).toBeInTheDocument();
  });
});

