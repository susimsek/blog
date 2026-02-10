// components/posts/PostDetail.tsx
import dynamic from 'next/dynamic';
import { Post } from '@/types/posts';
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
import { useTranslation } from 'react-i18next';
import { useParams } from 'next/navigation';
import { defaultLocale } from '@/i18n/settings';
import { buildLocalizedAbsoluteUrl } from '@/lib/metadata';

const MarkdownRenderer = dynamic(() => import('@/components/common/MarkdownRenderer'), {
  loading: () => null,
});

interface PostDetailProps {
  post: Post;
  relatedPosts?: PostSummary[];
}

export default function PostDetail({ post, relatedPosts = [] }: Readonly<PostDetailProps>) {
  const { t } = useTranslation('post');
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params?.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const { title, date, contentHtml, thumbnail, topics, readingTime } = post;
  const articleRef = React.useRef<HTMLElement | null>(null);
  const copyTimeoutRef = React.useRef<number | null>(null);
  const [isCopied, setIsCopied] = React.useState(false);
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

  const postUrl = React.useMemo(() => buildLocalizedAbsoluteUrl(locale, `posts/${post.id}`), [locale, post.id]);

  const xShareUrl = React.useMemo(() => {
    const params = new URLSearchParams({
      url: postUrl,
      text: title,
    });
    return `https://twitter.com/intent/tweet?${params.toString()}`;
  }, [postUrl, title]);

  const linkedInShareUrl = React.useMemo(() => {
    const params = new URLSearchParams({
      url: postUrl,
    });
    return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
  }, [postUrl]);

  const facebookShareUrl = React.useMemo(() => {
    const params = new URLSearchParams({
      u: postUrl,
    });
    return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
  }, [postUrl]);

  const handleCopyLink = React.useCallback(async () => {
    const copyWithFallback = () => {
      const textarea = document.createElement('textarea');
      textarea.value = postUrl;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    };

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        copyWithFallback();
      }

      setIsCopied(true);
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      setIsCopied(false);
    }
  }, [postUrl]);

  React.useEffect(
    () => () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <>
      <ReadingProgress />
      <BackToTop />
      <section className="mt-5">
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
        <div className="post-share mb-4" role="group" aria-label={t('post.share.title')}>
          <span className="post-share-prefix text-muted" aria-hidden="true">
            <FontAwesomeIcon icon="share-nodes" />
            <span className="ms-2">{t('post.share.title')}</span>
          </span>
          <div className="post-share-actions">
            <a
              href={xShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="post-share-action"
              aria-label={t('post.share.onX')}
            >
              <span className="post-share-circle post-share-circle-x" aria-hidden="true">
                <FontAwesomeIcon icon={['fab', 'x-twitter']} />
              </span>
              <span className="post-share-text">{t('post.share.shortX')}</span>
            </a>
            <a
              href={linkedInShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="post-share-action"
              aria-label={t('post.share.onLinkedIn')}
            >
              <span className="post-share-circle post-share-circle-linkedin" aria-hidden="true">
                <FontAwesomeIcon icon={['fab', 'linkedin']} />
              </span>
              <span className="post-share-text">{t('post.share.shortLinkedIn')}</span>
            </a>
            <a
              href={facebookShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="post-share-action"
              aria-label={t('post.share.onFacebook')}
            >
              <span className="post-share-circle post-share-circle-facebook" aria-hidden="true">
                <FontAwesomeIcon icon={['fab', 'facebook-f']} />
              </span>
              <span className="post-share-text">{t('post.share.shortFacebook')}</span>
            </a>
            <button
              type="button"
              className="post-share-action"
              onClick={handleCopyLink}
              aria-label={isCopied ? t('post.share.copied') : t('post.share.copyLink')}
            >
              <span className="post-share-circle post-share-circle-copy" aria-hidden="true">
                <FontAwesomeIcon icon={isCopied ? 'check' : 'copy'} />
              </span>
              <span className="post-share-text">
                {isCopied ? t('post.share.shortCopied') : t('post.share.shortCopy')}
              </span>
            </button>
          </div>
          <span className="visually-hidden" aria-live="polite">
            {isCopied ? t('post.share.copied') : ''}
          </span>
        </div>
        {thumbnailSrc && <Thumbnail src={thumbnailSrc} alt={title} width={1200} height={630} />}
        <article ref={articleRef} className="post-article">
          {splitIntro.intro && <MarkdownRenderer content={splitIntro.intro} />}
          <PostToc content={markdown} rootRef={articleRef} />
          {splitIntro.rest && <MarkdownRenderer content={splitIntro.rest} />}
        </article>
        <RelatedPosts posts={relatedPosts} />
      </section>
    </>
  );
}
