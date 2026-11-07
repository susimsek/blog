const redirectMock = jest.fn((href: string) => {
  throw new Error(`REDIRECT:${href}`);
});
const getAllPostIdsMock = jest.fn(async () => [
  { params: { locale: 'en', id: 'post-1' } },
  { params: { locale: 'tr', id: 'post-1' } },
  { params: { locale: ' EN ', id: ' post-1 ' } },
]);
const getServerTranslatorMock = jest.fn(async (_locale: string, _namespaces: string[]) => ({
  t: (key: string) => key,
}));
const buildPageMetadataMock = jest.fn((metadata: unknown) => metadata);

jest.mock('next/navigation', () => ({ redirect: (href: string) => redirectMock(href) }));
jest.mock('@/lib/posts', () => ({ getAllPostIds: () => getAllPostIdsMock() }));
jest.mock('@/i18n/server', () => ({
  getServerTranslator: (locale: string, namespaces: string[]) => getServerTranslatorMock(locale, namespaces),
}));
jest.mock('@/lib/metadata', () => ({ buildPageMetadata: (metadata: unknown) => buildPageMetadataMock(metadata) }));

import DefaultTabRoute, {
  generateMetadata as generateDefaultTabMetadata,
  generateStaticParams as generateDefaultTabParams,
} from '@/app/(default)/admin/settings/content/posts/[postLocale]/[postId]/[tab]/page';
import LocalizedTabRoute, {
  generateMetadata as generateLocalizedTabMetadata,
  generateStaticParams as generateLocalizedTabParams,
} from '@/app/(localized)/[locale]/admin/settings/content/posts/[postLocale]/[postId]/[tab]/page';
import LocalizedPostRoute, {
  generateStaticParams as generateLocalizedPostParams,
} from '@/app/(localized)/[locale]/admin/settings/content/posts/[postLocale]/[postId]/page';
import { defaultLocale, locales } from '@/i18n/settings';

describe('admin post route wrappers', () => {
  beforeEach(() => jest.clearAllMocks());

  it('generates default-locale tab params and private metadata', async () => {
    const params = await generateDefaultTabParams();
    expect(params).toHaveLength(locales.length * 3 * 3);
    expect(params).toEqual(
      expect.arrayContaining([
        { postLocale: 'en', postId: 'post-1', tab: 'metadata' },
        { postLocale: 'tr', postId: 'post-1', tab: 'comments' },
      ]),
    );

    const metadata = await generateDefaultTabMetadata({
      params: Promise.resolve({ postLocale: 'tr', postId: 'post-1', tab: 'comments' }),
    });
    expect(metadata).toMatchObject({ robots: { index: false, follow: false } });
    expect(getServerTranslatorMock).toHaveBeenCalledWith(defaultLocale, ['admin-account']);
    expect(buildPageMetadataMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'admin/settings/content/posts/tr/post-1/comments' }),
    );
  });

  it('redirects default tab routes to the locale-neutral editor URL', async () => {
    await expect(
      DefaultTabRoute({ params: Promise.resolve({ postLocale: 'tr', postId: 'post 1', tab: 'content' }) }),
    ).rejects.toThrow('REDIRECT:/admin/settings/content/posts/tr/post%201#content');
    expect(redirectMock).toHaveBeenCalledTimes(1);
  });

  it('deduplicates localized post and tab params and localizes metadata', async () => {
    expect(await generateLocalizedPostParams()).toEqual([
      { locale: 'tr', postLocale: 'en', postId: 'post-1' },
      { locale: 'tr', postLocale: 'tr', postId: 'post-1' },
    ]);
    const tabParams = await generateLocalizedTabParams();
    expect(tabParams).toHaveLength(2 * 3);
    expect(tabParams).toContainEqual({ locale: 'tr', postLocale: 'en', postId: 'post-1', tab: 'metadata' });

    const metadata = await generateLocalizedTabMetadata({
      params: Promise.resolve({ locale: 'tr', postLocale: 'en', postId: 'post-1', tab: 'metadata' }),
    });
    expect(metadata).toMatchObject({ robots: { index: false, follow: false } });
    expect(getServerTranslatorMock).toHaveBeenCalledWith('tr', ['admin-account']);
  });

  it('redirects localized routes and keeps the selected tab in the hash', async () => {
    await expect(
      LocalizedTabRoute({
        params: Promise.resolve({ locale: 'tr', postLocale: 'en', postId: 'post-1', tab: 'comments' }),
      }),
    ).rejects.toThrow('REDIRECT:/admin/settings/content/posts/en/post-1#comments');
    expect(redirectMock).toHaveBeenCalledTimes(1);

    await expect(
      LocalizedPostRoute({ params: Promise.resolve({ locale: 'tr', postLocale: 'en', postId: 'post-1' }) }),
    ).resolves.toBeNull();
  });
});
