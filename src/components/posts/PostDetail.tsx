// components/posts/PostDetail.tsx
import { Post } from '@/types/posts';
import { Container, Badge } from 'react-bootstrap';
import { assetPrefix } from '@/config/constants';
import DateDisplay from '@/components/common/DateDisplay';
import Thumbnail from '@/components/common/Thumbnail';
import Link from 'next/link';
import MarkdownRenderer from '@/components/common/MarkdownRenderer';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface PostDetailProps {
  post: Post;
}

export default function PostDetail({ post }: Readonly<PostDetailProps>) {
  const { title, date, contentHtml, thumbnail, topics, readingTime } = post;

  return (
    <Container className="mt-5" style={{ maxWidth: '800px' }}>
      <h1 className="fw-bold display-4 text-center mb-4">{title}</h1>
      <p className="text-center d-flex justify-content-center align-items-center text-muted mb-4">
        <span className="d-flex align-items-center me-3">
          <FontAwesomeIcon icon="calendar-alt" className="me-2" />
          <DateDisplay date={date} />
        </span>
        <span className="d-flex align-items-center">
          <FontAwesomeIcon icon="clock" className="me-2" />
          {readingTime}
        </span>
      </p>
      {topics && topics.length > 0 && (
        <div className="mb-4 d-flex justify-content-center flex-wrap">
          {topics.map(topic => (
            <Link key={topic.id} href={`/topics/${topic.id}`}>
              <Badge bg={topic.color} className={`me-2 badge-${topic.color}`}>
                {topic.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}
      {thumbnail && <Thumbnail src={`${assetPrefix}${thumbnail}`} alt={title} width={1024} height={576} />}
      <article className="fs-5 lh-lg">
        <MarkdownRenderer content={contentHtml ?? ''} />
      </article>
    </Container>
  );
}
