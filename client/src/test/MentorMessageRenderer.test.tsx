import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MentorMessageRenderer } from '../components/common/MentorMessageRenderer';

describe('MentorMessageRenderer', () => {
  it('renders regular text and bold markdown', () => {
    render(<MentorMessageRenderer content="Hello! This is **important** concepts." />);
    expect(screen.getByText('important')).toBeInTheDocument();
  });

  it('renders code blocks with language badge and copy button', () => {
    const codeSample = "```python\ndef solve():\n    return 42\n```";
    render(<MentorMessageRenderer content={codeSample} />);
    expect(screen.getByText(/python/i)).toBeInTheDocument();
    expect(screen.getByText('Copy')).toBeInTheDocument();
  });

  it('renders document source chips when sources are provided', () => {
    const sources = [{ filename: 'OS_Virtual_Memory_Lecture.pdf', page: 5 }];
    render(
      <MentorMessageRenderer
        content="From your uploaded notes on paging."
        sources={sources}
      />
    );
    expect(screen.getByText('OS_Virtual_Memory_Lecture.pdf')).toBeInTheDocument();
  });
});
