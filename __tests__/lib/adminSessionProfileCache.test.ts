import {
  clearAdminSessionProfileCache,
  readAdminSessionProfileCache,
  writeAdminSessionProfileCache,
  type AdminSessionProfile,
} from '@/lib/adminSessionProfileCache';

const SAMPLE_PROFILE: AdminSessionProfile = {
  id: 'admin-1',
  name: 'Admin User',
  username: 'admin',
  avatarUrl: '/images/avatar.webp',
  email: 'admin@example.com',
  pendingEmail: null,
  pendingEmailExpiresAt: null,
  googleLinked: true,
  googleEmail: 'admin@gmail.com',
  googleLinkedAt: '2026-03-22T00:00:00Z',
  githubLinked: false,
  githubEmail: null,
  githubLinkedAt: null,
  roles: ['OWNER'],
};

describe('adminSessionProfileCache', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('writes and reads the cached admin profile', () => {
    writeAdminSessionProfileCache(SAMPLE_PROFILE);

    expect(readAdminSessionProfileCache()).toEqual(SAMPLE_PROFILE);
  });

  it('clears the cached admin profile', () => {
    writeAdminSessionProfileCache(SAMPLE_PROFILE);

    clearAdminSessionProfileCache();

    expect(readAdminSessionProfileCache()).toBeNull();
  });

  it('returns null for malformed cached payloads', () => {
    window.localStorage.setItem('admin.session.profile.v1', '{"id":"","email":""}');

    expect(readAdminSessionProfileCache()).toBeNull();
  });

  it('clears storage when asked to write a null profile', () => {
    writeAdminSessionProfileCache(SAMPLE_PROFILE);

    writeAdminSessionProfileCache(null);

    expect(readAdminSessionProfileCache()).toBeNull();
  });
});
