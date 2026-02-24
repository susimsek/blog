import React from 'react';
import { PostSummary } from '@/types/posts';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import Image from 'next/image';
import DateDisplay from '@/components/common/DateDisplay';
import { assetPrefix } from '@/config/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatReadingTime } from '@/lib/readingTime';
import { useTranslation } from 'react-i18next';
import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import PostCategoryBadge from '@/components/posts/PostCategoryBadge';

interface PostListItemProps {
  post: PostSummary;
}

export default function PostListItem({ post }: Readonly<PostListItemProps>) {
  const { title, publishedDate, thumbnail, topics, readingTimeMin, source, category } = post;
  const { t } = useTranslation('common');
  const sourceLabel =
    source === 'medium'
      ? t('common.searchSource.medium', { ns: 'common' })
      : t('common.searchSource.blog', { ns: 'common' });
  const sourceIcon: IconProp = source === 'medium' ? (['fab', 'medium'] as IconProp) : 'book';

  return (
    <Row className="post-list-item">
      {/* Thumbnail */}
      <Col xs={5} md={5} className="post-thumbnail-container">
        {thumbnail && (
          <div className="post-thumbnail">
            <Image
              src={`${assetPrefix}${thumbnail}`}
              alt={title}
              className="img-fluid rounded"
              width={1200}
              height={630}
            />
          </div>
        )}
      </Col>
      {/* Content */}
      <Col xs={7} md={7} className="d-flex flex-column justify-content-between">
        <div>
          <div className="post-list-title-row mb-1">
            {category && (
              <PostCategoryBadge category={category} className="post-category-link--truncated" linked={false} />
            )}
            <h6 className="post-title mb-0">{title}</h6>
          </div>
          <p className="post-date text-muted mb-1">
            <span className="text-muted d-block mb-1">
              <FontAwesomeIcon icon="calendar-alt" className="me-2" />
              <DateDisplay date={publishedDate} />
            </span>
            <span className="text-muted d-block">
              <FontAwesomeIcon icon="clock" className="me-2" />
              {formatReadingTime(readingTimeMin, t)}
            </span>
            <span className="text-muted d-block mt-1">
              <FontAwesomeIcon icon={sourceIcon} className="me-2" />
              {sourceLabel}
            </span>
          </p>
          {topics && topics.length > 0 && (
            <div className="post-topics">
              {topics.map(topic => (
                <Badge key={topic.id} bg={topic.color} className={`post-topic-badge badge-${topic.color}`}>
                  {topic.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </Col>
    </Row>
  );
}
