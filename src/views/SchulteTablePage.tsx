'use client';

import React from 'react';
import Card from 'react-bootstrap/Card';
import Badge from 'react-bootstrap/Badge';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/common/Layout';
import Thumbnail from '@/components/common/Thumbnail';
import { assetPrefix } from '@/config/constants';
import type { LayoutPostSummary, Topic } from '@/types/posts';
import SchulteTableTrainer from '@/components/games/SchulteTableTrainer';

type SchulteTablePageProps = {
  layoutPosts: LayoutPostSummary[];
  topics: Topic[];
  preFooterTopTopics: Topic[];
};

export default function SchulteTablePage({ layoutPosts, topics, preFooterTopTopics }: Readonly<SchulteTablePageProps>) {
  const { t } = useTranslation('games');
  const previewImageSrc = `${assetPrefix}/images/schulte-table-thumbnail.webp`;

  return (
    <Layout
      posts={layoutPosts}
      topics={topics}
      preFooterTopTopics={preFooterTopTopics}
      searchEnabled={true}
      sidebarEnabled={false}
    >
      <section className="schulte-page-section stack stack-24">
        <header className="schulte-page-hero">
          <h1 className="page-header-title fw-bold mb-2">{t('games.schulte.title')}</h1>
          <div className="schulte-page-kicker-wrap">
            <Badge bg="danger" className="badge-red schulte-page-kicker">
              {t('games.schulte.badge')}
            </Badge>
            <span className="schulte-page-kicker-note">{t('games.schulte.kickerNote')}</span>
          </div>
        </header>

        <Thumbnail
          src={previewImageSrc}
          alt={t('games.schulte.meta.title')}
          width={1200}
          height={630}
          className="schulte-page-preview mb-0"
          priority
        />

        <p className="page-header-subtitle mb-0">{t('games.schulte.subtitle')}</p>

        <SchulteTableTrainer />

        <div className="schulte-page-grid">
          <Card className="schulte-info-card">
            <Card.Body>
              <h2 className="h4 fw-bold mb-3">{t('games.schulte.howToPlay.title')}</h2>
              <ul className="mb-0 schulte-list">
                <li>{t('games.schulte.howToPlay.step1')}</li>
                <li>{t('games.schulte.howToPlay.step2')}</li>
                <li>{t('games.schulte.howToPlay.step3')}</li>
                <li>{t('games.schulte.howToPlay.step4')}</li>
              </ul>
            </Card.Body>
          </Card>

          <Card className="schulte-info-card">
            <Card.Body>
              <h2 className="h4 fw-bold mb-3">{t('games.schulte.whyUse.title')}</h2>
              <p className="mb-2">{t('games.schulte.whyUse.body1')}</p>
              <p className="mb-0">{t('games.schulte.whyUse.body2')}</p>
            </Card.Body>
          </Card>
        </div>

        <Card className="schulte-info-card">
          <Card.Body>
            <h2 className="h4 fw-bold mb-3">{t('games.schulte.notes.title')}</h2>
            <ul className="mb-0 schulte-list">
              <li>{t('games.schulte.notes.item1')}</li>
              <li>{t('games.schulte.notes.item2')}</li>
              <li>{t('games.schulte.notes.item3')}</li>
            </ul>
          </Card.Body>
        </Card>

        <Card className="schulte-info-card">
          <Card.Body>
            <h2 className="h4 fw-bold mb-3">{t('games.schulte.research.title')}</h2>
            <p className="mb-2">{t('games.schulte.research.body1')}</p>
            <p className="mb-3">{t('games.schulte.research.body2')}</p>
            <ul className="schulte-list mb-0">
              <li>
                <a href="https://fr.wikipedia.org/wiki/Table_de_Schulte" target="_blank" rel="noopener noreferrer">
                  {t('games.schulte.research.sources.origin')}
                </a>
              </li>
              <li>
                <a href="https://pubmed.ncbi.nlm.nih.gov/35000285/" target="_blank" rel="noopener noreferrer">
                  {t('games.schulte.research.sources.erpStudy')}
                </a>
              </li>
              <li>
                <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3718286/" target="_blank" rel="noopener noreferrer">
                  {t('games.schulte.research.sources.visualSearchContext')}
                </a>
              </li>
              <li>
                <a href="https://pubmed.ncbi.nlm.nih.gov/31100297/" target="_blank" rel="noopener noreferrer">
                  {t('games.schulte.research.sources.transferCaveat')}
                </a>
              </li>
            </ul>
          </Card.Body>
        </Card>
      </section>
    </Layout>
  );
}
