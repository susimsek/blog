import React from 'react';
import { PostSummary } from '@/types/posts';
import { Row, Col, Badge } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import DateDisplay from '@/components/common/DateDisplay';

interface PostListItemProps {
  post: PostSummary;
}

export default function PostListItem({ post }: Readonly<PostListItemProps>) {
  const { id, title, date, thumbnail, topics } = post;

  return (
    <Row className="post-list-item">
      {/* Thumbnail */}
      <Col xs={3} className="post-thumbnail-container">
        {thumbnail && (
          <Link href={`/posts/${id}`}>
            <div className="post-thumbnail">
              <Image
                src={thumbnail}
                alt={title}
                className="img-fluid rounded"
                width={80}
                height={120}
                style={{ objectFit: 'cover' }}
              />
            </div>
          </Link>
        )}
      </Col>
      {/* Content */}
      <Col xs={9} className="d-flex flex-column justify-content-between">
        <div>
          <h6 className="post-title">
            <Link href={`/posts/${id}`} className="link">
              {title}
            </Link>
          </h6>
          <p className="post-date">
            <Link href={`/posts/${id}`} className="link">
              <DateDisplay date={date} />
            </Link>
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
