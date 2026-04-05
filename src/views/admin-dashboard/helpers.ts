'use client';

import type { ContentSummary, DashboardPayload } from './types';

export const parseDateValue = (value?: string) => {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const buildContentSummary = (dashboard: DashboardPayload | null): ContentSummary | null => {
  if (!dashboard) {
    return null;
  }

  return {
    missingTranslations: dashboard.contentHealth.missingTranslations,
    missingThumbnails: dashboard.contentHealth.missingThumbnails,
    localePairCoverage: dashboard.contentHealth.localePairCoverage,
    latestUpdatedPosts: dashboard.contentHealth.latestUpdatedPosts,
    topCategory: dashboard.contentHealth.dominantCategory,
  };
};
