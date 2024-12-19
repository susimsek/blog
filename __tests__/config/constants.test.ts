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

  const loadConstants = () => require('@/config/constants');

  it('should correctly determine if the environment is development', () => {
    process.env = { ...originalEnv, NODE_ENV: 'development' }; // Set NODE_ENV to development
    const { isDev, isProd } = loadConstants();
    expect(isDev).toBe(true);
    expect(isProd).toBe(false);
  });

  it('should correctly determine if the environment is production', () => {
    process.env = { ...originalEnv, NODE_ENV: 'production' }; // Set NODE_ENV to production
    const { isDev, isProd } = loadConstants();
    expect(isProd).toBe(true);
    expect(isDev).toBe(false);
  });

  it('should handle non-production/non-development environments', () => {
    process.env = { ...originalEnv, NODE_ENV: 'test' }; // Set NODE_ENV to test
    const { isDev, isProd } = loadConstants();
    expect(isDev).toBe(false);
    expect(isProd).toBe(false);
  });
});

describe('Static Constants', () => {
  it('should export the correct author name', () => {
    const { AUTHOR_NAME } = require('@/config/constants');
    expect(AUTHOR_NAME).toBe('Şuayb Şimşek');
  });

  it('should export correct contact links', () => {
    expect(CONTACT_LINKS).toEqual({
      email: 'mailto:suaybsimsek58@gmail.com',
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
    expect(LOCALES).toEqual({
      tr: { name: 'Türkçe', locale: 'tr' },
      en: { name: 'English', locale: 'en' },
    });
  });
});

describe('Dynamic Constants', () => {
  const { assetPrefix } = require('@/config/constants');

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
