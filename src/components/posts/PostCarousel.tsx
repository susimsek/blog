import React, { useState } from 'react';
import { Badge, Carousel } from 'react-bootstrap';
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

  const handleSelect = (selectedIndex: number) => {
    setActiveIndex(selectedIndex);
  };

  return (
    <div className="position-relative">
      <Carousel
        className="mx-auto shadow-sm rounded overflow-hidden"
        style={{ maxWidth: '800px' }}
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
                  className="d-block w-100 rounded shadow"
                  layout="responsive"
                  width={800}
                  height={450}
                  objectFit="cover"
                />
              </div>
            </Link>
            <Carousel.Caption className="text-center bg-opacity-75 p-3 rounded" style={{ bottom: '2rem' }}>
              <h3 className="fw-bold mb-3">
                <Link href={`/posts/${post.id}`} className="link-light">
                  {post.title}
                </Link>
              </h3>
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
              <p className="text-light">{post.summary}</p>
            </Carousel.Caption>
          </Carousel.Item>
        ))}
      </Carousel>

      <div className="carousel-indicators">
        {posts.map((_, index) => (
          <button
            key={index}
            type="button"
            className={`${activeIndex === index ? 'active' : ''}`}
            onClick={() => handleSelect(index)}
            aria-label={`Go to slide ${index + 1}`}
          >
            <FontAwesomeIcon className="carousel-indicator-icon" icon="circle" size="sm" />
          </button>
        ))}
      </div>
    </div>
  );
}