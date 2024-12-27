import React from 'react';
import { PostSummary } from '@/types/posts';
import { Row, Col, Badge } from 'react-bootstrap';
import Link from 'next/link';
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
      <Col xs={5} className="post-thumbnail-container">
        {thumbnail && (
          <Link href={`/posts/${id}`}>
            <div className="post-thumbnail">
              <Image
                src={`${assetPrefix}${thumbnail}`}
                alt={title}
                className="img-fluid rounded"
                width={800}
                height={600}
              />
            </div>
          </Link>
        )}
      </Col>
      {/* Content */}
      <Col xs={7} className="d-flex flex-column justify-content-between">
        <div>
          <h6 className="post-title">
            <Link href={`/posts/${id}`} className="link">
              {title}
            </Link>
          </h6>
          <p className="post-date text-muted mb-1">
            <Link href={`/posts/${id}`} className="link link-muted d-block mb-1">
              <FontAwesomeIcon icon="calendar-alt" className="me-2" />
              <DateDisplay date={date} />
            </Link>
            <span className="text-muted d-block">
              <FontAwesomeIcon icon="clock" className="me-2" />
              {readingTime}
            </span>
          </p>
          {topics && topics.length > 0 && (
            <div className="post-topics">
              {topics.map(topic => (
                <Link key={topic.id} href={`/topics/${topic.id}`}>
                  <Badge bg={topic.color} className={`post-topic-badge badge-${topic.color}`}>
                    {topic.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Col>
    </Row>
  );
}
