import React from 'react';
import type { PostSummary } from '@/types/posts';
import Link from '@/components/common/Link';
import DateDisplay from '@/components/common/DateDisplay';
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import i18nextConfig from '@/i18n/settings';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Image from 'next/image';
import { assetPrefix } from '@/config/constants';
import { formatReadingTime } from '@/lib/readingTime';

interface RelatedPostsProps {
  posts: PostSummary[];
}

export default function RelatedPosts({ posts }: Readonly<RelatedPostsProps>) {
  const { t } = useTranslation(['post', 'common']);
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const currentLocale = routeLocale || i18nextConfig.i18n.defaultLocale;
  const resolveThumbnailSrc = (value: string) => {
    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
    if (!assetPrefix) {
      return normalizedPath;
    }

    const normalizedPrefix = assetPrefix.endsWith('/') ? assetPrefix.slice(0, -1) : assetPrefix;
    return `${normalizedPrefix}${normalizedPath}`;
  };

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-5" aria-label={t('post.relatedPostsTitle')}>
      <h2 className="h4 fw-bold mb-3">{t('post.relatedPostsTitle')}</h2>
      <Row className="g-3">
        {posts.map(post => (
          <Col key={post.id} xs={12} md={6} lg={4}>
            <Link
              href={`/${currentLocale}/posts/${post.id}`}
              skipLocaleHandling
              className="text-decoration-none d-block h-100"
            >
              <div className="post-card flex-column align-items-stretch h-100 related-post-card">
                {post.thumbnail && (
                  <div className="related-post-thumb">
                    <Image
                      src={resolveThumbnailSrc(post.thumbnail)}
                      alt={post.title}
                      className="img-fluid"
                      width={1200}
                      height={630}
                    />
                  </div>
                )}

                <div className="p-3">
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <h3 className="h6 fw-bold mb-2 related-post-title">{post.title}</h3>
                    <FontAwesomeIcon icon="chevron-right" className="text-muted mt-1 flex-shrink-0" />
                  </div>

                  <p className="text-muted small mb-2 related-post-summary">{post.summary}</p>

                  <div className="text-muted small d-flex align-items-center gap-3 mb-2 flex-wrap">
                    <span className="d-flex align-items-center">
                      <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                      <DateDisplay date={post.date} />
                    </span>
                    <span className="d-flex align-items-center">
                      <FontAwesomeIcon icon="clock" className="me-2" />
                      {formatReadingTime(post.readingTimeMin, t)}
                    </span>
                  </div>

                  {post.topics && post.topics.length > 0 && (
                    <div className="d-flex flex-wrap gap-2 mb-2">
                      {post.topics.map(topic => (
                        <Badge key={topic.id} bg={topic.color} className={`badge-${topic.color}`}>
                          {topic.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          </Col>
        ))}
      </Row>
    </section>
  );
}
