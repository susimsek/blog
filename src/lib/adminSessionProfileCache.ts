export type AdminSessionProfile = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  email: string;
  pendingEmail: string | null;
  pendingEmailExpiresAt: string | null;
  googleLinked: boolean;
  googleEmail: string | null;
  googleLinkedAt: string | null;
  githubLinked: boolean;
  githubEmail: string | null;
  githubLinkedAt: string | null;
  roles: string[];
};

const ADMIN_SESSION_PROFILE_STORAGE_KEY = 'admin.session.profile.v1';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const normalizeNullableString = (value: unknown) => {
  const normalized = normalizeString(value);
  return normalized === '' ? null : normalized;
};

const normalizeBoolean = (value: unknown) => value === true;

const normalizeRoles = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(entry => normalizeString(entry)).filter((entry): entry is string => entry !== '');
};

const getLocalStorage = () => globalThis.window?.localStorage;

const normalizeAdminSessionProfile = (value: unknown): AdminSessionProfile | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = normalizeString(value.id);
  const email = normalizeString(value.email).toLowerCase();
  if (id === '' || email === '') {
    return null;
  }

  return {
    id,
    name: normalizeNullableString(value.name),
    username: normalizeNullableString(value.username),
    avatarUrl: normalizeNullableString(value.avatarUrl),
    email,
    pendingEmail: normalizeNullableString(value.pendingEmail),
    pendingEmailExpiresAt: normalizeNullableString(value.pendingEmailExpiresAt),
    googleLinked: normalizeBoolean(value.googleLinked),
    googleEmail: normalizeNullableString(value.googleEmail),
    googleLinkedAt: normalizeNullableString(value.googleLinkedAt),
    githubLinked: normalizeBoolean(value.githubLinked),
    githubEmail: normalizeNullableString(value.githubEmail),
    githubLinkedAt: normalizeNullableString(value.githubLinkedAt),
    roles: normalizeRoles(value.roles),
  };
};

export const readAdminSessionProfileCache = () => {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    return null;
  }

  try {
    const rawValue = localStorage.getItem(ADMIN_SESSION_PROFILE_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return normalizeAdminSessionProfile(JSON.parse(rawValue));
  } catch {
    return null;
  }
};

export const writeAdminSessionProfileCache = (profile: AdminSessionProfile | null) => {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    return;
  }

  if (!profile) {
    localStorage.removeItem(ADMIN_SESSION_PROFILE_STORAGE_KEY);
    return;
  }

  try {
    localStorage.setItem(ADMIN_SESSION_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage failures and continue with in-memory state.
  }
};

export const clearAdminSessionProfileCache = () => {
  const localStorage = getLocalStorage();
  if (!localStorage) {
    return;
  }

  try {
    localStorage.removeItem(ADMIN_SESSION_PROFILE_STORAGE_KEY);
  } catch {
    // Ignore storage failures and continue with in-memory state.
  }
};
