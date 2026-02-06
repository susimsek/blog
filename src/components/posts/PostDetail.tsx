// components/posts/PostDetail.tsx
import dynamic from 'next/dynamic';
import { Post } from '@/types/posts';
import Container from 'react-bootstrap/Container';
import Badge from 'react-bootstrap/Badge';
import { assetPrefix, SITE_URL } from '@/config/constants';
import DateDisplay from '@/components/common/DateDisplay';
import Thumbnail from '@/components/common/Thumbnail';
import Link from '@/components/common/Link';
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { PostSummary } from '@/types/posts';
import RelatedPosts from '@/components/posts/RelatedPosts';
import ReadingProgress from '@/components/common/ReadingProgress';
import BackToTop from '@/components/common/BackToTop';
import PostToc from '@/components/posts/PostToc';

const MarkdownRenderer = dynamic(() => import('@/components/common/MarkdownRenderer'), {
  loading: () => null,
});

interface PostDetailProps {
  post: Post;
  relatedPosts?: PostSummary[];
}

export default function PostDetail({ post, relatedPosts = [] }: Readonly<PostDetailProps>) {
  const { title, date, contentHtml, thumbnail, topics, readingTime } = post;
  const articleRef = React.useRef<HTMLElement | null>(null);
  const markdown = contentHtml ?? '';
  const thumbnailSrc = (() => {
    if (!thumbnail) return null;
    try {
      const base = assetPrefix || SITE_URL;
      return new URL(thumbnail, base).toString();
    } catch {
      return thumbnail;
    }
  })();

  const splitIntro = React.useMemo(() => {
    if (!markdown) {
      return { intro: '', rest: '' };
    }

    const lines = markdown.split(/\r?\n/);
    let inFence = false;
    let fenceToken: string | null = null;

    const isFence = (line: string) => {
      const trimmed = line.trimStart();
      if (trimmed.startsWith('```')) return '```';
      if (trimmed.startsWith('~~~')) return '~~~';
      return null;
    };

    const isSectionHeading = (line: string) => {
      if (inFence) return false;
      return /^#{2,6}\s+\S+/.test(line);
    };

    for (let i = 0; i < lines.length; i += 1) {
      const fence = isFence(lines[i] ?? '');
      if (fence) {
        if (!inFence) {
          inFence = true;
          fenceToken = fence;
        } else if (fenceToken === fence) {
          inFence = false;
          fenceToken = null;
        }
        continue;
      }

      if (isSectionHeading(lines[i] ?? '')) {
        const intro = lines.slice(0, i).join('\n').trim();
        const rest = lines.slice(i).join('\n').trim();
        return { intro, rest };
      }
    }

    return { intro: markdown.trim(), rest: '' };
  }, [markdown]);

  return (
    <>
      <ReadingProgress />
      <BackToTop />
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
        {thumbnailSrc && <Thumbnail src={thumbnailSrc} alt={title} width={1200} height={630} />}
        <article ref={articleRef} className="fs-5 lh-lg post-article">
          {splitIntro.intro && <MarkdownRenderer content={splitIntro.intro} />}
          <PostToc content={markdown} rootRef={articleRef} />
          {splitIntro.rest && <MarkdownRenderer content={splitIntro.rest} />}
        </article>
        <RelatedPosts posts={relatedPosts} />
      </Container>
    </>
  );
}
