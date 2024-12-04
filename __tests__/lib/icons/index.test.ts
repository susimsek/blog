import { faSidebar } from '@/lib/icons';

describe('faSidebar Icon Definition', () => {
  it('should have the correct prefix', () => {
    expect(faSidebar.prefix).toBe('fas');
  });

  it('should have the correct iconName', () => {
    expect(faSidebar.iconName).toBe('sidebar');
  });

  it('should have the correct icon array structure', () => {
    expect(faSidebar.icon).toBeDefined();
    expect(Array.isArray(faSidebar.icon)).toBe(true);

    const [width, height, ligatures, unicode, svgPathData] = faSidebar.icon;

    expect(width).toBe(20);
    expect(height).toBe(20);
    expect(ligatures).toEqual([]);
    expect(typeof unicode).toBe('string');
    expect(typeof svgPathData).toBe('string');
  });

  it('should have the correct SVG path data', () => {
    const expectedSvgPathData =
      'M7 3h-5v14h5v-14zM9 3v14h9v-14h-9zM0 3c0-1.1 0.9-2 2-2h16c1.105 0 2 0.895 2 2v0 14c0 1.105-0.895 2-2 2v0h-16c-1.105 0-2-0.895-2-2v0-14zM3 4h3v2h-3v-2zM3 7h3v2h-3v-2zM3 10h3v2h-3v-2z';

    expect(faSidebar.icon[4]).toBe(expectedSvgPathData);
  });
});
