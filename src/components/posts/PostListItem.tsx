import React from 'react';
import { PostSummary } from '@/types/posts';
import { Row, Col, Badge } from 'react-bootstrap';
import Image from 'next/image';
import DateDisplay from '@/components/common/DateDisplay';
import { assetPrefix } from '@/config/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface PostListItemProps {
  post: PostSummary;
}

export default function PostListItem({ post }: Readonly<PostListItemProps>) {
  const { id, title, date, thumbnail, topics, readingTime } = post;

  return (
    <Row className="post-list-item">
      {/* Thumbnail */}
      <Col xs={5} md={4} className="post-thumbnail-container">
        {thumbnail && (
          <div className="post-thumbnail">
            <Image
              src={`${assetPrefix}${thumbnail}`}
              alt={title}
              className="img-fluid rounded"
              width={800}
              height={600}
            />
          </div>
        )}
      </Col>
      {/* Content */}
      <Col xs={7} md={8} className="d-flex flex-column justify-content-between">
        <div>
          <h6 className="post-title">{title}</h6>
          <p className="post-date text-muted mb-1">
            <span className="text-muted d-block mb-1">
              <FontAwesomeIcon icon="calendar-alt" className="me-2" />
              <DateDisplay date={date} />
            </span>
            <span className="text-muted d-block">
              <FontAwesomeIcon icon="clock" className="me-2" />
              {readingTime}
            </span>
          </p>
          {topics && topics.length > 0 && (
            <div className="post-topics">
              {topics.map(topic => (
                <Badge bg={topic.color} className={`post-topic-badge badge-${topic.color}`}>
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
