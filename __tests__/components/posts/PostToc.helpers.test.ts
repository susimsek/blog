import {
  areTocItemsEqual,
  buildTocItems,
  createSlugger,
  getScrollBehavior,
  resolveActiveTocItemId,
  shouldIncludeTocHeading,
  slugify,
} from '@/components/posts/PostToc';

describe('PostToc helpers', () => {
  it('compares toc item arrays and slugifies headings', () => {
    expect(areTocItemsEqual([{ id: 'a', text: 'A', level: 2 }], [{ id: 'a', text: 'A', level: 2 }])).toBe(true);
    expect(areTocItemsEqual([{ id: 'a', text: 'A', level: 2 }], [{ id: 'b', text: 'B', level: 2 }])).toBe(false);
    expect(slugify('  Résumé Section  ')).toBe('resume-section');
    expect(slugify('!!!')).toBe('section');

    const slugger = createSlugger();
    expect(slugger('Overview')).toBe('overview');
    expect(slugger('Overview')).toBe('overview-1');
  });

  it('builds toc items from valid headings only', () => {
    document.body.innerHTML = `
      <article>
        <h2>Intro</h2>
        <div class="post-toc"><h2>Ignore</h2></div>
        <div class="tab-content"><h3>Tab Ignore</h3></div>
        <h3>Details</h3>
      </article>
    `;
    const root = document.querySelector('article') as HTMLElement;
    const items = buildTocItems(root);

    expect(items).toEqual([
      { id: 'intro', text: 'Intro', level: 2 },
      { id: 'details', text: 'Details', level: 3 },
    ]);

    const tabHeading = document.querySelector('.tab-content h3') as HTMLElement;
    expect(shouldIncludeTocHeading(tabHeading)).toBe(false);
  });

  it('resolves active ids and scroll behavior', () => {
    expect(resolveActiveTocItemId(null, [])).toBeNull();
    expect(resolveActiveTocItemId('missing', [{ id: 'intro', text: 'Intro', level: 2 }])).toBe('intro');
    expect(resolveActiveTocItemId('intro', [{ id: 'intro', text: 'Intro', level: 2 }])).toBe('intro');

    const originalMatchMedia = globalThis.window?.matchMedia;
    Object.defineProperty(globalThis.window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: true }),
    });
    expect(getScrollBehavior()).toBe('auto');

    Object.defineProperty(globalThis.window, 'matchMedia', {
      configurable: true,
      value: undefined,
    });
    expect(getScrollBehavior()).toBe('smooth');

    Object.defineProperty(globalThis.window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
  });
});
