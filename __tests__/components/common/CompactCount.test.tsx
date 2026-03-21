import React from 'react';
import { render, screen } from '@testing-library/react';
import CompactCount, { formatCompactCount } from '@/components/common/CompactCount';

describe('CompactCount', () => {
  it('formats counts using compact notation', () => {
    const formatted = formatCompactCount(1250, 'en');

    expect(formatted).toBe('1.3K');
  });

  it('uses locale-aware separators', () => {
    const formatted = formatCompactCount(1250, 'tr');

    expect(formatted).toContain('1,3');
  });

  it('switches to whole K for six-figure counts like X', () => {
    const formatted = formatCompactCount(123456, 'en');

    expect(formatted).toBe('123K');
  });

  it('keeps one decimal for millions like X profile counts', () => {
    const formatted = formatCompactCount(3100000, 'en');

    expect(formatted).toBe('3.1M');
  });

  it('rolls large K values up to M instead of showing 1000K', () => {
    const formatted = formatCompactCount(999950, 'en');

    expect(formatted).toBe('1M');
  });

  it('renders full count as title and aria-label', () => {
    render(<CompactCount value={1500} locale="en" className="metric" />);

    const count = screen.getByText('1.5K');
    expect(count).toHaveAttribute('title', '1,500');
    expect(count).toHaveAttribute('aria-label', '1,500');
    expect(count).toHaveClass('metric');
  });
});
