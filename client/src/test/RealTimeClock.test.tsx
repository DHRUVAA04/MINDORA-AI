import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { RealTimeClock } from '../components/common/RealTimeClock';
import { useThemeStore } from '../theme/themeStore';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';

describe('RealTimeClock Persistent Component Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ clockFormat: '12h' });
    vi.useFakeTimers();
    // Set a known fixed time: Oct 11, 2026, 14:30:45 (2:30:45 PM)
    vi.setSystemTime(new Date(2026, 9, 11, 14, 30, 45));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders with role="timer" and formats time correctly in 12-hour mode', () => {
    render(<RealTimeClock />);
    const clockElement = screen.getByRole('timer');
    expect(clockElement).toBeInTheDocument();

    // In 12h mode, 14:30:45 should be 02:30 with seconds 45 and PM period
    expect(clockElement).toHaveTextContent('02:30');
    expect(clockElement).toHaveTextContent('45');
    expect(clockElement).toHaveTextContent('PM');
    expect(clockElement).toHaveTextContent('Sun, 11 Oct 2026');
  });

  it('toggles to 24-hour mode on click and formats correctly', () => {
    render(<RealTimeClock />);
    const clockElement = screen.getByRole('timer');

    // Click to toggle to 24h
    fireEvent.click(clockElement);
    expect(useThemeStore.getState().clockFormat).toBe('24h');

    // In 24h mode, should show 14:30 and 45 seconds, no AM/PM
    expect(clockElement).toHaveTextContent('14:30');
    expect(clockElement).toHaveTextContent('45');
    expect(screen.queryByText('PM')).toBeNull();
  });

  it('updates aligned with second boundaries and resyncs on visibilitychange', () => {
    render(<RealTimeClock />);
    const clockElement = screen.getByRole('timer');
    expect(clockElement).toHaveTextContent('45');

    // Advance clock by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(clockElement).toHaveTextContent('46');

    // Advance clock by 5 seconds while backgrounded
    vi.setSystemTime(new Date(2026, 9, 11, 14, 30, 51));
    act(() => {
      // Trigger visibility change event
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(clockElement).toHaveTextContent('51');
  });

  it('persists unchanged across route changes in layout structure', () => {
    const TestApp = () => (
      <MemoryRouter initialEntries={['/page-one']}>
        <div>
          {/* TopBar persistent clock */}
          <RealTimeClock />

          <nav>
            <Link to="/page-one">Page One</Link>
            <Link to="/page-two">Page Two</Link>
          </nav>

          <Routes>
            <Route path="/page-one" element={<div>Content of Page One</div>} />
            <Route path="/page-two" element={<div>Content of Page Two</div>} />
          </Routes>
        </div>
      </MemoryRouter>
    );

    render(<TestApp />);
    expect(screen.getByText('Content of Page One')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('02:30');

    // Navigate to Page Two
    fireEvent.click(screen.getByText('Page Two'));
    expect(screen.getByText('Content of Page Two')).toBeInTheDocument();

    // Clock is still mounted and showing correct time
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('02:30');
  });
});

