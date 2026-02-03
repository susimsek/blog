import React from 'react';
import type { PostSummary } from '@/types/posts';
import Link from '@/components/common/Link';
import DateDisplay from '@/components/common/DateDisplay';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import i18nextConfig from '@root/next-i18next.config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
      <div className="list-group">
        {posts.map(post => (
          <Link
            key={post.id}
            href={`/${currentLocale}/posts/${post.id}`}
            skipLocaleHandling
            className="list-group-item list-group-item-action d-flex justify-content-between align-items-start"
          >
            <div className="me-3">
              <div className="fw-semibold">{post.title}</div>
              <div className="text-muted small mt-1">
                <span className="me-3">
                  <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                  <DateDisplay date={post.date} />
                </span>
                <span>
                  <FontAwesomeIcon icon="clock" className="me-2" />
                  {post.readingTime}
                </span>
              </div>
            </div>
            <FontAwesomeIcon icon="chevron-right" className="text-muted mt-1" />
          </Link>
        ))}
      </div>
    </section>
  );
}
