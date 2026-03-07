const ADMIN_AVATAR_PATH = '/api/admin-avatar';

export const withAdminAvatarSize = (avatarUrl: string | null | undefined, size: number) => {
  const resolvedUrl = avatarUrl?.trim() ?? '';
  if (resolvedUrl === '') {
    return '';
  }

  const normalizedSize = Number.isFinite(size) ? Math.max(1, Math.round(size)) : 256;

  try {
    const parsed = new URL(resolvedUrl, 'http://localhost');
    if (!parsed.pathname.endsWith(ADMIN_AVATAR_PATH)) {
      return resolvedUrl;
    }

    parsed.searchParams.set('s', String(normalizedSize));
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return resolvedUrl;
  }
};
