import { withAdminAvatarSize } from '@/lib/adminAvatar';

describe('withAdminAvatarSize', () => {
  it('returns an empty value for missing URLs', () => {
    expect(withAdminAvatarSize(null, 48)).toBe('');
    expect(withAdminAvatarSize('  ', 48)).toBe('');
  });

  it('preserves URLs that do not use the admin avatar endpoint', () => {
    expect(withAdminAvatarSize(' https://cdn.example.com/avatar.png ', 48)).toBe('https://cdn.example.com/avatar.png');
    expect(withAdminAvatarSize('http://[invalid', 48)).toBe('http://[invalid');
  });

  it('sets a normalized size while preserving endpoint query and hash', () => {
    expect(withAdminAvatarSize('/api/admin-avatar?token=abc#crop', 64.8)).toBe('/api/admin-avatar?token=abc&s=65#crop');
    expect(withAdminAvatarSize('/api/admin-avatar', -10)).toBe('/api/admin-avatar?s=1');
    expect(withAdminAvatarSize('/api/admin-avatar', Number.NaN)).toBe('/api/admin-avatar?s=256');
  });
});
