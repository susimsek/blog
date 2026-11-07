import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminDashboardCurationSection from '@/components/admin/dashboard/AdminDashboardCurationSection';
import type { ContentSummary, DashboardPayload } from '@/views/admin-dashboard/types';
import type { TFunction } from 'i18next';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => null }));

const t = ((key: string) => key) as unknown as TFunction;
const topViewedLead: DashboardPayload['topViewedPosts'][number] = {
  postId: 'popular',
  title: 'Most viewed',
  locale: 'en',
  publishedDate: '2026-11-01',
  hits: 120,
  likes: 8,
};
const topLikedLead: DashboardPayload['topLikedPosts'][number] = {
  ...topViewedLead,
  postId: 'liked',
  title: 'Most liked',
  locale: 'tr',
  likes: 42,
};
const contentSummary: ContentSummary = {
  missingTranslations: 0,
  missingThumbnails: 0,
  localePairCoverage: 100,
  latestUpdatedPosts: [],
  topCategory: { id: 'games', name: 'Games', count: 6 },
};

describe('AdminDashboardCurationSection', () => {
  it('uses fallback values when curation data is absent', () => {
    render(
      <AdminDashboardCurationSection
        contentSummary={null}
        formatMetric={String}
        t={t}
        topLikedLead={null}
        topViewedLead={null}
      />,
    );

    expect(screen.getAllByText('-')).toHaveLength(5);
    expect(screen.getByText(/0\s+adminDashboard\.table\.metricHits/)).toBeInTheDocument();
    expect(screen.getByText(/0\s+adminDashboard\.table\.metricLikes/)).toBeInTheDocument();
  });

  it('renders curation leads and the dominant category', () => {
    render(
      <AdminDashboardCurationSection
        contentSummary={contentSummary}
        formatMetric={value => `metric:${value}`}
        t={t}
        topLikedLead={topLikedLead}
        topViewedLead={topViewedLead}
      />,
    );

    expect(screen.getByText('Most viewed')).toBeInTheDocument();
    expect(screen.getByText('Most liked')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText(/metric:120\s+adminDashboard\.table\.metricHits/)).toBeInTheDocument();
    expect(screen.getByText(/metric:42\s+adminDashboard\.table\.metricLikes/)).toBeInTheDocument();
  });
});
