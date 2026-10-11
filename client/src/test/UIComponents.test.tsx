import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { NavItem } from '../components/ui/NavItem';
import { Card } from '../components/ui/Card';
import { MemoryRouter } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';

describe('Reusable UI Components Suite (States & A11y)', () => {
  it('renders Button with variants and loading state', () => {
    const { rerender } = render(<Button variant="primary">Start Study</Button>);
    const btn = screen.getByRole('button', { name: /Start Study/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();

    // Loading state: disabled, shows spinner, preserves text
    rerender(<Button variant="primary" isLoading>Start Study</Button>);
    expect(btn).toBeDisabled();
    expect(btn).toHaveTextContent('Start Study');
  });

  it('renders Button with disabled state preventing action', () => {
    render(<Button disabled>Disabled Action</Button>);
    const btn = screen.getByRole('button', { name: /Disabled Action/i });
    expect(btn).toBeDisabled();
    expect(btn.className).toContain('disabled:opacity-50');
    expect(btn.className).toContain('disabled:cursor-not-allowed');
  });

  it('renders NavItem with active and collapsed mode tooltips', () => {
    render(
      <MemoryRouter initialEntries={['/roadmap']}>
        <NavItem
          to="/roadmap"
          label="Roadmap"
          icon={<Sparkles data-testid="nav-icon" />}
          isCollapsed={true}
        />
      </MemoryRouter>
    );

    const link = screen.getByRole('link', { name: 'Roadmap' });
    expect(link).toBeInTheDocument();
    // In collapsed mode, tooltip exists
    expect(screen.getByRole('tooltip')).toHaveTextContent('Roadmap');
  });

  it('renders Card with semantic status border for mastered and weak topics', () => {
    const { rerender } = render(
      <Card status="mastered" data-testid="mastered-card">
        <h3>Mastered Content</h3>
      </Card>
    );
    const masteredCard = screen.getByTestId('mastered-card');
    expect(masteredCard.className).toContain('border-l-brand-mint');

    rerender(
      <Card status="weak" data-testid="weak-card">
        <h3>Weak Topic</h3>
      </Card>
    );
    const weakCard = screen.getByTestId('weak-card');
    expect(weakCard.className).toContain('border-l-brand-coral');
  });
});

