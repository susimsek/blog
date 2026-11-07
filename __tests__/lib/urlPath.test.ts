import { stripLeadingSlashes, stripTrailingSlashes } from '@/lib/urlPath';

describe('URL path helpers', () => {
  it('strips repeated leading slashes', () => {
    expect(stripLeadingSlashes('///docs/page')).toBe('docs/page');
    expect(stripLeadingSlashes('docs/page')).toBe('docs/page');
    expect(stripLeadingSlashes('///')).toBe('');
  });

  it('strips repeated trailing slashes', () => {
    expect(stripTrailingSlashes('docs/page///')).toBe('docs/page');
    expect(stripTrailingSlashes('docs/page')).toBe('docs/page');
    expect(stripTrailingSlashes('///')).toBe('');
  });
});
