import React, { useMemo } from 'react';
import { Container, Row, Col, Badge } from 'react-bootstrap';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import i18nextConfig from '@root/next-i18next.config';
import type { PostSummary, Topic } from '@/types/posts';
import Link from '@/components/common/Link';
import { CONTACT_LINKS } from '@/config/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface PreFooterProps {
  posts?: PostSummary[];
  topics?: Topic[];
  topTopics?: Topic[];
}

const getTopTopics = (posts: PostSummary[], topics: Topic[], limit: number) => {
  const topicById = new Map(topics.map(topic => [topic.id, topic]));
  const counts = new Map<string, number>();

  for (const post of posts) {
    for (const topic of post.topics ?? []) {
      if (!topic?.id) continue;
      counts.set(topic.id, (counts.get(topic.id) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([id, count]) => ({ id, count, topic: topicById.get(id) }))
    .filter(item => item.topic)
    .sort((a, b) => b.count - a.count || String(a.topic?.name).localeCompare(String(b.topic?.name)))
    .slice(0, limit)
    .map(item => item.topic as Topic);
};

export default function PreFooter({ posts = [], topics = [], topTopics = [] }: Readonly<PreFooterProps>) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;

  const latestPosts = useMemo(() => {
    const sorted = [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return sorted.slice(0, 5);
  }, [posts]);

  const resolvedTopTopics = useMemo(() => {
    if (topTopics.length > 0) {
      return topTopics;
    }
    return getTopTopics(posts, topics, 6);
  }, [topTopics, posts, topics]);

  return (
    <section className="pre-footer py-5" aria-label={t('common.preFooter.title')}>
      <Container>
        <Row className="g-4">
          <Col xs={12} lg={4}>
            <h3 className="pre-footer-title h5 fw-bold">{t('common.preFooter.aboutTitle')}</h3>
            <p className="text-muted mb-3">{t('common.preFooter.aboutText')}</p>
            <div className="d-flex flex-wrap gap-2">
              <Link href={`/${currentLocale}/contact`} skipLocaleHandling className="btn btn-primary">
                {t('common.preFooter.contactCta')}
              </Link>
              <Link href={`/${currentLocale}/about`} skipLocaleHandling className="btn btn-outline-secondary">
                {t('common.preFooter.startHereCta')}
              </Link>
            </div>
          </Col>

          <Col xs={12} lg={4}>
            <h3 className="pre-footer-title h5 fw-bold">{t('common.preFooter.latestPostsTitle')}</h3>
            <ul className="list-unstyled mb-3">
              {latestPosts.map(post => (
                <li key={post.id} className="mb-2">
                  <Link href={`/${currentLocale}/posts/${post.id}`} skipLocaleHandling className="text-decoration-none">
                    <FontAwesomeIcon icon="chevron-right" className="me-2 text-muted" />
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="h6 fw-bold mb-2">{t('common.preFooter.topTopicsTitle')}</h4>
            <div className="d-flex flex-wrap gap-2">
              {resolvedTopTopics.map(topic => (
                <Link
                  key={topic.id}
                  href={`/${currentLocale}/topics/${topic.id}`}
                  skipLocaleHandling
                  className="text-decoration-none"
                >
                  <Badge bg={topic.color} className={`badge-${topic.color}`}>
                    {topic.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </Col>

          <Col xs={12} lg={4}>
            <h3 className="pre-footer-title h5 fw-bold">{t('common.preFooter.subscribeTitle')}</h3>
            <div className="d-flex flex-column gap-2 mb-3">
              <Link href={`/${currentLocale}/rss.xml`} skipLocaleHandling className="text-decoration-none">
                <FontAwesomeIcon icon="rss" className="me-2" />
                {t('common.preFooter.rss')}
              </Link>
            </div>

            <h4 className="h6 fw-bold mb-2">{t('common.preFooter.socialTitle')}</h4>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <a href={CONTACT_LINKS.github} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                <FontAwesomeIcon icon={['fab', 'github']} size="lg" />
              </a>
              <a
                href={CONTACT_LINKS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none"
              >
                <FontAwesomeIcon icon={['fab', 'linkedin']} size="lg" />
              </a>
              <a href={CONTACT_LINKS.medium} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                <FontAwesomeIcon icon={['fab', 'medium']} size="lg" />
              </a>
              <a href={`mailto:${CONTACT_LINKS.email}`} className="text-decoration-none">
                <FontAwesomeIcon icon="envelope" size="lg" />
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}
