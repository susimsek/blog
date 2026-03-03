import { CONTACT_LINKS, SOCIAL_MEDIA_NAMES } from '@/config/constants';

describe('Environment Constants', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.resetModules(); // Clear the module cache
    originalEnv = { ...process.env }; // Make a copy of the original environment
  });

  afterEach(() => {
    process.env = originalEnv; // Restore the original environment
  });

  it('restores the original environment between tests', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' };
    expect(process.env.NODE_ENV).toBe('development');
  });
});

describe('Static Constants', () => {
  it('should export the correct author name', () => {
    const { AUTHOR_NAME } = require('@/config/constants');
    expect(AUTHOR_NAME).toBe('Şuayb Şimşek');
  });

  it('should export correct contact links', () => {
    expect(CONTACT_LINKS).toEqual({
      email: 'suaybsimsek58@gmail.com',
      linkedin: 'https://linkedin.com/in/şuayb-şimşek-29b077178',
      medium: 'https://medium.com/@suaybsimsek58',
      github: 'https://github.com/susimsek',
    });
  });

  it('should export correct social media names', () => {
    expect(SOCIAL_MEDIA_NAMES).toEqual({
      linkedin: 'LinkedIn',
      medium: 'Medium',
      github: 'GitHub',
    });
  });

  it('should export correct locales', () => {
    const { LOCALES } = require('@/config/constants');
    expect(Object.keys(LOCALES).length).toBe(2);
  });

  it('should export correct themes', () => {
    const { THEMES } = require('@/config/constants');
    expect(THEMES).toEqual([
      {
        key: 'light',
        label: 'common.header.theme.light',
        icon: 'sun',
      },
      {
        key: 'dark',
        label: 'common.header.theme.dark',
        icon: 'moon',
      },
      {
        key: 'oceanic',
        label: 'common.header.theme.oceanic',
        icon: 'water',
      },
      {
        key: 'forest',
        label: 'common.header.theme.forest',
        icon: 'leaf',
      },
    ]);
  });
});

describe('Dynamic Constants', () => {
  it('should handle asset prefix correctly when set', () => {
    process.env.NEXT_PUBLIC_ASSET_PREFIX = '/custom-prefix';
    jest.resetModules();
    const { assetPrefix: updatedPrefix } = require('@/config/constants');
    expect(updatedPrefix).toBe('/custom-prefix');
  });

  it('should handle asset prefix correctly when not set', () => {
    delete process.env.NEXT_PUBLIC_ASSET_PREFIX;
    jest.resetModules();
    const { assetPrefix: updatedPrefix } = require('@/config/constants');
    expect(updatedPrefix).toBe('');
  });
});
