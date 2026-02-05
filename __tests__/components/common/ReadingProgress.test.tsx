import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ReadingProgress from '@/components/common/ReadingProgress';

describe('ReadingProgress', () => {
  it('positions progress bar under the sticky header', async () => {
    const header = document.createElement('nav');
    header.className = 'navbar sticky-top';
    header.getBoundingClientRect = () => ({ height: 64 }) as DOMRect;
    document.body.appendChild(header);

    render(<ReadingProgress />);

    const progressbar = await screen.findByRole('progressbar', { name: 'Reading progress' });
    const container = progressbar.closest('.reading-progress');

    await waitFor(() => {
      expect(container).toHaveStyle({ top: '64px' });
    });
  });
});
