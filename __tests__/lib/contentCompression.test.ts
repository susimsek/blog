import { randomBytes } from 'crypto';
import { compressContentForPayload, CONTENT_COMPRESSION_ENCODING, resolvePostContent } from '@/lib/contentCompression';

describe('contentCompression', () => {
  it('keeps short content uncompressed', () => {
    const content = '# Short\n\nThis is a short markdown body.';
    const result = compressContentForPayload(content);

    expect(result).toEqual({ contentHtml: content });
  });

  it('compresses large content when beneficial', () => {
    const content = `# Title\n\n${'spring boot graphql jwe authentication '.repeat(2000)}`;
    const result = compressContentForPayload(content);

    expect(result.contentCompressed).toBeDefined();
    expect(result.contentEncoding).toBe(CONTENT_COMPRESSION_ENCODING);
    expect(result.contentHtml).toBeUndefined();
  });

  it('falls back to plain content when compression is not beneficial', () => {
    const content = randomBytes(18_050).toString('base64url');

    expect(compressContentForPayload(content)).toEqual({ contentHtml: content });
  });

  it('resolves plain content directly', () => {
    const content = 'plain markdown';
    const resolved = resolvePostContent({ contentHtml: content });
    expect(resolved).toBe(content);
  });

  it('decompresses compressed content', () => {
    const original = `${'token '.repeat(10000)}`.trim();
    const compressed = compressContentForPayload(original);

    const resolved = resolvePostContent({
      contentCompressed: compressed.contentCompressed,
      contentEncoding: compressed.contentEncoding,
    });

    expect(resolved).toBe(original);
  });

  it('returns empty string when no usable content exists', () => {
    expect(resolvePostContent({})).toBe('');
    expect(resolvePostContent({ contentCompressed: 'x', contentEncoding: 'lz-string-uri' })).toBe('');
  });
});
