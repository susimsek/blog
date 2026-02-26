import React, { useState, useCallback } from 'react';
import Badge from 'react-bootstrap/Badge';
import Carousel from 'react-bootstrap/Carousel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PostSummary } from '@/types/posts';
import { assetPrefix } from '@/config/constants';
import Link from '@/components/common/Link';
import Image from 'next/image';

type PostCarouselProps = {
  posts: PostSummary[];
  interval?: number;
};

export default function PostCarousel({ posts, interval = 5000 }: Readonly<PostCarouselProps>) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Optimized handleSelect with useCallback
  const handleSelect = useCallback((selectedIndex: number) => {
    setActiveIndex(selectedIndex);
  }, []);

  return (
    <div className="carousel-wrapper">
      <Carousel
        className="mx-auto rounded overflow-hidden"
        style={{
          width: '100%',
        }}
        prevIcon={<FontAwesomeIcon className="carousel-control-prev-icon" icon="chevron-left" size="lg" />}
        nextIcon={<FontAwesomeIcon className="carousel-control-next-icon" icon="chevron-right" size="lg" />}
        activeIndex={activeIndex}
        onSelect={handleSelect}
        interval={interval}
        wrap={true}
        indicators={false}
      >
        {posts.map(post => (
          <Carousel.Item key={post.id}>
            <Link href={`/posts/${post.id}`}>
              <div className="thumbnail-wrapper">
                <Image
                  src={`${assetPrefix}${post.thumbnail}`}
                  alt={post.title}
                  className="d-block w-100 rounded"
                  width={1200}
                  height={630}
                  style={{ objectFit: 'cover' }}
                />
              </div>
            </Link>
            <Carousel.Caption className="text-center bg-opacity-75 p-3 rounded">
              <div className="post-carousel-title-row mb-3">
                <h3 className="fw-bold mb-0">
                  <Link href={`/posts/${post.id}`} className="link-light">
                    {post.title}
                  </Link>
                </h3>
              </div>
              {post.topics && post.topics.length > 0 && (
                <div className="mb-4">
                  {post.topics.map(topic => (
                    <Link key={topic.id} href={`/topics/${topic.id}`}>
                      <Badge bg={topic.color} className={`me-2 badge-${topic.color}`}>
                        {topic.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </Carousel.Caption>
          </Carousel.Item>
        ))}
      </Carousel>

      <div className="carousel-indicators post-carousel-indicators" aria-label="Carousel slide indicators">
        {posts.map((post, index) => (
          <button
            key={post.id}
            type="button"
            className={`${activeIndex === index ? 'active' : ''}`}
            onClick={() => handleSelect(index)}
            aria-label={`Go to slide ${index + 1}`}
            aria-current={activeIndex === index ? 'true' : undefined}
          />
        ))}
      </div>
    </div>
  );
}
