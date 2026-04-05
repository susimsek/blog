'use client';

import type { AdminSessionProfile } from '@/lib/adminSessionProfileCache';

export type AdminIdentity = AdminSessionProfile | null;

export type DashboardPayload = {
  totalPosts: number;
  totalSubscribers: number;
  contentHealth: {
    localePairCoverage: number;
    missingTranslations: number;
    missingThumbnails: number;
    latestUpdatedPosts: Array<{
      id: string;
      title: string;
      date: string;
      category: string;
    }>;
    dominantCategory: {
      id: string;
      name: string;
      count: number;
    } | null;
  };
  topViewedPosts: Array<{
    postId: string;
    title: string;
    locale: string;
    publishedDate: string;
    hits: number;
    likes: number;
  }>;
  topLikedPosts: Array<{
    postId: string;
    title: string;
    locale: string;
    publishedDate: string;
    hits: number;
    likes: number;
  }>;
};

export type ContentSummary = {
  missingTranslations: number;
  missingThumbnails: number;
  localePairCoverage: number;
  latestUpdatedPosts: Array<{
    id: string;
    title: string;
    date: string;
    category: string;
  }>;
  topCategory: {
    id: string;
    name: string;
    count: number;
  } | null;
};
