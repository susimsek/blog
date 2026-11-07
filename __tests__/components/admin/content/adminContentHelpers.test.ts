import {
  CONTENT_ID_PATTERN,
  adminPreviewImageLoader,
  formatMediaSize,
  fromDateTimeLocalInputValue,
  parseISODateInput,
  resolveAdminContentAccentColor,
  resolveAdminContentThumbnailSrc,
  resolveLocaleLabel,
  resolvePostEditorTab,
  resolvePostLifecycleBadgeVariant,
  toDateTimeLocalInputValue,
  toTaxonomyKey,
} from '@/components/admin/content/adminContentHelpers';

jest.mock('@/config/constants', () => {
  let prefix = '';
  return {
    get assetPrefix() {
      return prefix;
    },
    setMockAssetPrefix: (value: string) => {
      prefix = value;
    },
    LOCALES: {
      en: { name: 'English' },
      tr: { name: 'Turkish' },
    },
  };
});

const setMockAssetPrefix = (value: string) => {
  (jest.requireMock('@/config/constants') as { setMockAssetPrefix: (prefix: string) => void }).setMockAssetPrefix(
    value,
  );
};

describe('adminContentHelpers', () => {
  afterEach(() => {
    setMockAssetPrefix('');
  });

  it('normalizes locale, taxonomy, post editor tab, and lifecycle values', () => {
    expect(resolveLocaleLabel(' tr ')).toBe('Turkish');
    expect(resolveLocaleLabel('EN')).toBe('English');
    expect(resolveLocaleLabel('xx')).toBe('XX');
    expect(toTaxonomyKey({ locale: 'TR', id: 'Sports' })).toBe('tr|sports');
    expect(resolvePostEditorTab(' comments ')).toBe('comments');
    expect(resolvePostEditorTab('CONTENT')).toBe('content');
    expect(resolvePostEditorTab('content', false)).toBe('metadata');
    expect(resolvePostEditorTab('unknown')).toBe('metadata');
    expect(resolvePostEditorTab(null)).toBe('metadata');
    expect(resolvePostLifecycleBadgeVariant('DRAFT')).toBe('secondary');
    expect(resolvePostLifecycleBadgeVariant('SCHEDULED')).toBe('warning');
    expect(resolvePostLifecycleBadgeVariant('PUBLISHED')).toBe('success');
    expect(CONTENT_ID_PATTERN.test('valid-post-2')).toBe(true);
    expect(CONTENT_ID_PATTERN.test('x')).toBe(false);
    expect(CONTENT_ID_PATTERN.test('Invalid-ID')).toBe(false);
  });

  it('resolves thumbnail URLs, accent colors, and image loader values', () => {
    expect(resolveAdminContentThumbnailSrc(null)).toBeNull();
    expect(resolveAdminContentThumbnailSrc('   ')).toBeNull();
    expect(resolveAdminContentThumbnailSrc('https://cdn.example.test/image.webp')).toBe(
      'https://cdn.example.test/image.webp',
    );
    expect(resolveAdminContentThumbnailSrc('HTTP://cdn.example.test/image.webp')).toBe(
      'HTTP://cdn.example.test/image.webp',
    );
    expect(resolveAdminContentThumbnailSrc('images/local.webp')).toBe('/images/local.webp');
    expect(resolveAdminContentThumbnailSrc('/images/local.webp')).toBe('/images/local.webp');

    setMockAssetPrefix('/blog');
    expect(resolveAdminContentThumbnailSrc('images/local.webp')).toBe('/blog/images/local.webp');
    setMockAssetPrefix('/blog/');
    expect(resolveAdminContentThumbnailSrc('/images/local.webp')).toBe('/blog/images/local.webp');

    expect(resolveAdminContentAccentColor('')).toBe('var(--active-color)');
    expect(resolveAdminContentAccentColor(' PRIMARY ')).toBe('var(--bs-primary)');
    expect(resolveAdminContentAccentColor('#123abc')).toBe('#123abc');
    expect(adminPreviewImageLoader({ src: '/images/preview.webp' })).toBe('/images/preview.webp');
  });

  it('accepts only valid ISO date and date-time values', () => {
    expect(parseISODateInput('')).toBeNull();
    expect(parseISODateInput('  ')).toBeNull();
    expect(parseISODateInput('2026/03/04')).toBeNull();
    expect(parseISODateInput('2026-02-29')).toBeNull();
    expect(parseISODateInput('2026-13-01')).toBeNull();
    expect(parseISODateInput('2024-02-29')).toEqual(new Date(2024, 1, 29));

    expect(toDateTimeLocalInputValue(null)).toBe('');
    expect(toDateTimeLocalInputValue('  ')).toBe('');
    expect(toDateTimeLocalInputValue('not-a-date')).toBe('');
    const sourceDate = new Date('2026-03-04T15:07:00.000Z');
    const expectedLocalValue = `${sourceDate.getFullYear()}-${String(sourceDate.getMonth() + 1).padStart(2, '0')}-${String(sourceDate.getDate()).padStart(2, '0')}T${String(sourceDate.getHours()).padStart(2, '0')}:${String(sourceDate.getMinutes()).padStart(2, '0')}`;
    expect(toDateTimeLocalInputValue(sourceDate.toISOString())).toBe(expectedLocalValue);

    expect(fromDateTimeLocalInputValue('  ')).toBeNull();
    expect(fromDateTimeLocalInputValue('not-a-date')).toBeNull();
    expect(fromDateTimeLocalInputValue('2026-03-04T15:07')).toBe(new Date('2026-03-04T15:07').toISOString());
  });

  it('formats media sizes across byte, kilobyte, megabyte, and invalid ranges', () => {
    expect(formatMediaSize(-1, 'en')).toBe('');
    expect(formatMediaSize(0, 'en')).toBe('');
    expect(formatMediaSize(Number.NaN, 'en')).toBe('');
    expect(formatMediaSize(Number.POSITIVE_INFINITY, 'en')).toBe('');
    expect(formatMediaSize(512, 'en')).toBe('512 B');
    expect(formatMediaSize(1536, 'en')).toBe('2 KB');
    expect(formatMediaSize(1.5 * 1024 * 1024, 'en')).toBe('1.5 MB');
    expect(formatMediaSize(1.5 * 1024 * 1024, 'de')).toBe('1,5 MB');
  });
});
