import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { Post } from '@/types/posts';

const MIN_COMPRESSIBLE_LENGTH = 24_000;
const LZ_STRING_URI_ENCODING = 'lz-string-uri' as const;

export const CONTENT_COMPRESSION_ENCODING = LZ_STRING_URI_ENCODING;

export const compressContentForPayload = (
  content: string,
): Pick<Post, 'contentHtml' | 'contentCompressed' | 'contentEncoding'> => {
  if (!content || content.length < MIN_COMPRESSIBLE_LENGTH) {
    return { contentHtml: content };
  }

  const compressed = compressToEncodedURIComponent(content);
  if (!compressed || compressed.length >= content.length) {
    return { contentHtml: content };
  }

  return {
    contentCompressed: compressed,
    contentEncoding: LZ_STRING_URI_ENCODING,
  };
};

export const resolvePostContent = (
  post: Pick<Post, 'contentHtml' | 'contentCompressed' | 'contentEncoding'>,
): string => {
  if (typeof post.contentHtml === 'string') {
    return post.contentHtml;
  }

  if (post.contentCompressed && post.contentEncoding === LZ_STRING_URI_ENCODING) {
    return decompressFromEncodedURIComponent(post.contentCompressed) ?? '';
  }

  return '';
};
