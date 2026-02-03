import React from 'react';
import type { PostSummary } from '@/types/posts';
import Link from '@/components/common/Link';
import DateDisplay from '@/components/common/DateDisplay';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import i18nextConfig from '@root/next-i18next.config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Row, Col, Badge } from 'react-bootstrap';
import Image from 'next/image';
import { assetPrefix } from '@/config/constants';

interface RelatedPostsProps {
  posts: PostSummary[];
}

export default function RelatedPosts({ posts }: Readonly<RelatedPostsProps>) {
  const { t } = useTranslation('post');
  const router = useRouter();
  const currentLocale = (router.query.locale as string) || i18nextConfig.i18n.defaultLocale;

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
                      src={`${assetPrefix}${post.thumbnail}`}
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
                      {post.readingTime}
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
