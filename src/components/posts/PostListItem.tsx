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

interface PostListItemProps {
  post: PostSummary;
}

export default function PostListItem({ post }: Readonly<PostListItemProps>) {
  const { title, date, thumbnail, topics, readingTimeMin } = post;
  const { t } = useTranslation('common');

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
          <h6 className="post-title">{title}</h6>
          <p className="post-date text-muted mb-1">
            <span className="text-muted d-block mb-1">
              <FontAwesomeIcon icon="calendar-alt" className="me-2" />
              <DateDisplay date={date} />
            </span>
            <span className="text-muted d-block">
              <FontAwesomeIcon icon="clock" className="me-2" />
              {formatReadingTime(readingTimeMin, t)}
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
