'use client';

import React from 'react';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/common/Layout';
import Thumbnail from '@/components/common/Thumbnail';
import { assetPrefix } from '@/config/constants';
import type { LayoutPostSummary, Topic } from '@/types/posts';
import VisualMemoryTrainer from '@/components/games/VisualMemoryTrainer';

type VisualMemoryPageProps = {
  layoutPosts: LayoutPostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
};

export default function VisualMemoryPage({ layoutPosts, topics, preFooterTopTopics }: Readonly<VisualMemoryPageProps>) {
  const { t } = useTranslation('games');
  const previewImageSrc = `${assetPrefix}/images/visual-memory-thumbnail.webp`;

  return (
    <Layout
      posts={layoutPosts}
      topics={topics}
      preFooterTopTopics={preFooterTopTopics}
      searchEnabled={true}
      sidebarEnabled={false}
    >
      <section className="visual-memory-page-section stack stack-24">
        <header className="visual-memory-page-hero">
          <h1 className="page-header-title fw-bold mb-2">{t('games.visualMemory.title')}</h1>
          <div className="visual-memory-page-kicker-wrap">
            <Badge bg="danger" className="badge-red visual-memory-page-kicker">
              {t('games.visualMemory.badge')}
            </Badge>
            <span className="visual-memory-page-kicker-note">{t('games.visualMemory.kickerNote')}</span>
          </div>
        </header>

        <Thumbnail
          src={previewImageSrc}
          alt={t('games.visualMemory.meta.title')}
          width={1200}
          height={630}
          className="visual-memory-page-preview mb-0"
          priority
        />

        <p className="page-header-subtitle mb-0">{t('games.visualMemory.subtitle')}</p>

        <VisualMemoryTrainer />

        <div className="visual-memory-page-grid">
          <Card className="visual-memory-info-card">
            <Card.Body>
              <h2 className="h4 fw-bold mb-3">{t('games.visualMemory.howToPlay.title')}</h2>
              <ul className="mb-0 visual-memory-list">
                <li>{t('games.visualMemory.howToPlay.step1')}</li>
                <li>{t('games.visualMemory.howToPlay.step2')}</li>
                <li>{t('games.visualMemory.howToPlay.step3')}</li>
                <li>{t('games.visualMemory.howToPlay.step4')}</li>
              </ul>
            </Card.Body>
          </Card>

          <Card className="visual-memory-info-card">
            <Card.Body>
              <h2 className="h4 fw-bold mb-3">{t('games.visualMemory.whyUse.title')}</h2>
              <p className="mb-2">{t('games.visualMemory.whyUse.body1')}</p>
              <p className="mb-0">{t('games.visualMemory.whyUse.body2')}</p>
            </Card.Body>
          </Card>
        </div>

        <Card className="visual-memory-info-card">
          <Card.Body>
            <h2 className="h4 fw-bold mb-3">{t('games.visualMemory.notes.title')}</h2>
            <ul className="mb-0 visual-memory-list">
              <li>{t('games.visualMemory.notes.item1')}</li>
              <li>{t('games.visualMemory.notes.item2')}</li>
              <li>{t('games.visualMemory.notes.item3')}</li>
            </ul>
          </Card.Body>
        </Card>

        <Card className="visual-memory-info-card">
          <Card.Body>
            <h2 className="h4 fw-bold mb-3">{t('games.visualMemory.research.title')}</h2>
            <p className="mb-2">{t('games.visualMemory.research.body1')}</p>
            <p className="mb-3">{t('games.visualMemory.research.body2')}</p>
            <ul className="visual-memory-list mb-0">
              <li>
                <a href="https://en.wikipedia.org/wiki/Visual_memory" target="_blank" rel="noopener noreferrer">
                  {t('games.visualMemory.research.sources.background')}
                </a>
              </li>
              <li>
                <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7617679/" target="_blank" rel="noopener noreferrer">
                  {t('games.visualMemory.research.sources.capacityReview')}
                </a>
              </li>
              <li>
                <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC2733322/" target="_blank" rel="noopener noreferrer">
                  {t('games.visualMemory.research.sources.changeDetection')}
                </a>
              </li>
            </ul>
          </Card.Body>
        </Card>
      </section>
    </Layout>
  );
}
