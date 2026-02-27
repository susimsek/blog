import {
  getAllPostCategories,
  getPostCategoryLabel,
  getPostCategoryPresentation,
  normalizePostCategory,
} from '@/lib/postCategories';

describe('postCategories', () => {
  it('normalizes category ids from string and object inputs', () => {
    expect(normalizePostCategory(' Programming ')).toBe('programming');
    expect(normalizePostCategory({ id: ' Gaming ', name: 'Gaming' })).toBe('gaming');
    expect(normalizePostCategory({ id: '', name: 'Empty' })).toBeNull();
    expect(normalizePostCategory(null)).toBeNull();
    expect(normalizePostCategory(undefined)).toBeNull();
  });

  it('returns localized presentation and label for known categories', () => {
    expect(getPostCategoryPresentation('programming', 'en')).toMatchObject({
      slug: 'programming',
      label: 'Programming',
      color: 'blue',
      icon: 'code',
    });

    expect(getPostCategoryPresentation({ id: 'programming', name: 'Programming' }, 'tr')).toMatchObject({
      slug: 'programming',
      label: 'Programlama',
      color: 'blue',
      icon: 'code',
    });

    expect(getPostCategoryLabel('gaming', 'tr')).toBe('Oyun');
    expect(getPostCategoryPresentation('unknown-category', 'en')).toBeNull();
  });

  it('returns all categories for locale', () => {
    const categories = getAllPostCategories('tr');
    expect(categories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'programming', color: 'blue' }),
        expect.objectContaining({ id: 'gaming', color: 'red' }),
      ]),
    );
  });
});
