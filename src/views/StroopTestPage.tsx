'use client';

import React from 'react';
import Badge from 'react-bootstrap/Badge';
import Card from 'react-bootstrap/Card';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/common/Layout';
import Thumbnail from '@/components/common/Thumbnail';
import { assetPrefix } from '@/config/constants';
import StroopTestTrainer from '@/components/games/StroopTestTrainer';
import type { Localized } from '@/i18n/settings';
import type { LayoutPageData } from '@/lib/localizedPageData';
import { useLocalizedContent } from '@/i18n/useLocalizedContent';

type StroopTestPageProps = { contentByLocale: Localized<LayoutPageData> };

export default function StroopTestPage({ contentByLocale }: Readonly<StroopTestPageProps>) {
  const { t } = useTranslation('games');
  const { layoutPosts, topics, preFooterTopTopics } = useLocalizedContent(contentByLocale);
  const previewImageSrc = `${assetPrefix}/images/stroop-test-thumbnail.webp`;

  return (
    <Layout
      posts={layoutPosts}
      topics={topics}
      preFooterTopTopics={preFooterTopTopics}
      searchEnabled={true}
      sidebarEnabled={false}
    >
      <section className="stroop-page-section stack stack-24">
        <header className="stroop-page-hero">
          <h1 className="page-header-title fw-bold">{t('games.stroop.title')}</h1>
          <div className="stroop-page-kicker-wrap">
            <Badge bg="danger" className="badge-red stroop-page-kicker">
              {t('games.stroop.badge')}
            </Badge>
            <span className="stroop-page-kicker-note">{t('games.stroop.kickerNote')}</span>
          </div>
        </header>

        <Thumbnail
          src={previewImageSrc}
          alt={t('games.stroop.meta.title')}
          width={1200}
          height={630}
          className="stroop-page-preview"
          noBottomMargin
          priority
        />

        <p className="page-header-subtitle mb-0">{t('games.stroop.subtitle')}</p>

        <StroopTestTrainer />

        <div className="stroop-page-grid">
          <Card className="stroop-info-card">
            <Card.Body>
              <h2 className="h4 fw-bold mb-3">{t('games.stroop.howToPlay.title')}</h2>
              <ul className="mb-0 stroop-list">
                <li>{t('games.stroop.howToPlay.step1')}</li>
                <li>{t('games.stroop.howToPlay.step2')}</li>
                <li>{t('games.stroop.howToPlay.step3')}</li>
                <li>{t('games.stroop.howToPlay.step4')}</li>
              </ul>
            </Card.Body>
          </Card>

          <Card className="stroop-info-card">
            <Card.Body>
              <h2 className="h4 fw-bold mb-3">{t('games.stroop.whyUse.title')}</h2>
              <p className="mb-2">{t('games.stroop.whyUse.body1')}</p>
              <p className="mb-0">{t('games.stroop.whyUse.body2')}</p>
            </Card.Body>
          </Card>
        </div>

        <Card className="stroop-info-card">
          <Card.Body>
            <h2 className="h4 fw-bold mb-3">{t('games.stroop.notes.title')}</h2>
            <ul className="mb-0 stroop-list">
              <li>{t('games.stroop.notes.item1')}</li>
              <li>{t('games.stroop.notes.item2')}</li>
              <li>{t('games.stroop.notes.item3')}</li>
            </ul>
          </Card.Body>
        </Card>

        <Card className="stroop-info-card">
          <Card.Body>
            <h2 className="h4 fw-bold mb-3">{t('games.stroop.research.title')}</h2>
            <p className="mb-2">{t('games.stroop.research.body1')}</p>
            <p className="mb-3">{t('games.stroop.research.body2')}</p>
            <ul className="stroop-list mb-0">
              <li>
                <a href="https://en.wikipedia.org/wiki/Stroop_effect" target="_blank" rel="noopener noreferrer">
                  {t('games.stroop.research.sources.background')}
                </a>
              </li>
              <li>
                <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6600873/" target="_blank" rel="noopener noreferrer">
                  {t('games.stroop.research.sources.automaticity')}
                </a>
              </li>
              <li>
                <a
                  href="https://datashare.nida.nih.gov/instrument/stroop-color-word-task"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('games.stroop.research.sources.taskReference')}
                </a>
              </li>
            </ul>
          </Card.Body>
        </Card>
      </section>
    </Layout>
  );
}
