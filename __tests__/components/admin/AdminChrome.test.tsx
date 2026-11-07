import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminChrome from '@/components/admin/AdminChrome';
import { fetchAdminMe, logoutAdmin } from '@/lib/adminApi';
import {
  clearAdminSessionProfileCache,
  readAdminSessionProfileCache,
  writeAdminSessionProfileCache,
  type AdminSessionProfile,
} from '@/lib/adminSessionProfileCache';

let mockPathname = '/en/admin/settings/profile';
let mockLocale = 'en';
let mockIsMobile = false;
const mockRouter = { replace: jest.fn(), push: jest.fn() };

jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => mockRouter,
}));
jest.mock('@/i18n/useLocale', () => ({ useLocale: () => mockLocale }));
jest.mock('@/hooks/useMediaQuery', () => ({ __esModule: true, default: () => mockIsMobile }));
jest.mock('@/hooks/useBoop', () => ({ __esModule: true, default: () => [{}, jest.fn()] }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, className, style }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src} alt={alt} width={width} height={height} className={className} style={style} />
  ),
}));
jest.mock('@/components/common/Footer', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));
jest.mock('@/components/i18n/LanguageSwitcher', () => ({ __esModule: true, default: () => <span>language</span> }));
jest.mock('@/components/theme/ThemeToggler', () => ({ __esModule: true, default: () => <span>theme</span> }));
jest.mock('@/components/voice/VoiceToggler', () => ({ __esModule: true, default: () => <span>voice</span> }));
jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => null }));
jest.mock('@/lib/adminApi', () => ({ fetchAdminMe: jest.fn(), logoutAdmin: jest.fn() }));

const profile = {
  id: 'admin-1',
  name: 'Admin Name',
  username: ' admin-user ',
  avatarUrl: 'https://example.com/avatar.png',
  email: 'admin@example.com',
  pendingEmail: null,
  pendingEmailExpiresAt: null,
  googleLinked: false,
  googleEmail: null,
  googleLinkedAt: null,
  githubLinked: false,
  githubEmail: null,
  githubLinkedAt: null,
  roles: ['admin'],
} satisfies AdminSessionProfile;

describe('AdminChrome', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/en/admin/settings/profile';
    mockLocale = 'en';
    mockIsMobile = false;
    localStorage.clear();
  });

  it('loads and caches the authenticated profile and reacts to profile updates', async () => {
    jest.mocked(fetchAdminMe).mockResolvedValueOnce({ authenticated: true, user: profile } as never);
    const { container } = render(<AdminChrome>Account settings</AdminChrome>);

    await waitFor(() => expect(screen.getByAltText('admin-user')).toBeInTheDocument());
    expect(readAdminSessionProfileCache()).toEqual({ ...profile, username: 'admin-user' });
    expect(screen.getByText('Account settings')).toBeInTheDocument();
    expect(container.querySelector('#admin-user-dropdown')).toBeInTheDocument();

    const updated = { ...profile, username: 'updated-admin' };
    act(() => {
      globalThis.dispatchEvent(new CustomEvent('admin:user-updated', { detail: { user: updated } }));
    });
    await waitFor(() => expect(screen.getByAltText('updated-admin')).toBeInTheDocument());
    expect(readAdminSessionProfileCache()?.username).toBe('updated-admin');
  });

  it('uses a cached profile, renders mobile controls and logs out to the admin route', async () => {
    mockIsMobile = true;
    mockPathname = '/en/admin';
    writeAdminSessionProfileCache(profile);
    const sidebarEvents = jest.fn();
    globalThis.addEventListener('admin:sidebar-toggle', sidebarEvents);
    jest.mocked(logoutAdmin).mockResolvedValueOnce({ success: true });
    const { container } = render(<AdminChrome>Dashboard</AdminChrome>);

    expect(fetchAdminMe).not.toHaveBeenCalled();
    expect(screen.getAllByText('language')).toHaveLength(1);
    expect(screen.getAllByText('theme')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'adminCommon.actions.toggleSidebar' }));
    expect(sidebarEvents).toHaveBeenCalledTimes(1);

    const dropdown = container.querySelector('#admin-user-dropdown');
    expect(dropdown).not.toBeNull();
    fireEvent.click(dropdown!);
    fireEvent.click(await screen.findByText('adminCommon.actions.logout'));
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/admin/login'));
    expect(logoutAdmin).toHaveBeenCalledTimes(1);
    expect(readAdminSessionProfileCache()).toBeNull();
    globalThis.removeEventListener('admin:sidebar-toggle', sidebarEvents);
  });

  it('handles unauthenticated and failed profile lookups and reloads after an empty update event', async () => {
    jest.mocked(fetchAdminMe).mockResolvedValueOnce({ authenticated: false, user: null } as never);
    render(<AdminChrome>Public admin route</AdminChrome>);
    await waitFor(() => expect(fetchAdminMe).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: /admin-user-dropdown/ })).not.toBeInTheDocument();

    clearAdminSessionProfileCache();
    jest.mocked(fetchAdminMe).mockResolvedValueOnce({ authenticated: true, user: profile } as never);
    act(() => globalThis.dispatchEvent(new CustomEvent('admin:user-updated')));
    await waitFor(() => expect(fetchAdminMe).toHaveBeenCalledTimes(2));

    jest.mocked(fetchAdminMe).mockRejectedValueOnce(new Error('offline'));
    clearAdminSessionProfileCache();
    mockLocale = 'tr';
    await waitFor(() => expect(fetchAdminMe).toHaveBeenCalledTimes(3));
    expect(readAdminSessionProfileCache()).toBeNull();
  });
});
