import React from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata, viewport } from '@/app/(default)/layout';

const mockResources = { common: { common: { siteName: 'Blog' } } };
const mockLoadLocaleResources = jest.fn(async (_locale: string, _namespaces: string[]) => mockResources);
const mockAppProviders = jest.fn(({ children }: { children: React.ReactNode }) => (
  <div data-testid="providers">{children}</div>
));

jest.mock('@/i18n/server', () => ({
  loadLocaleResources: (locale: string, namespaces: string[]) => mockLoadLocaleResources(locale, namespaces),
}));

jest.mock('@/app/providers', () => ({
  __esModule: true,
  default: (props: { locale: string; resources: Record<string, unknown>; children: React.ReactNode }) =>
    mockAppProviders(props),
}));

describe('static root layout', () => {
  it('exposes site metadata and viewport settings', () => {
    expect(metadata).toMatchObject({
      applicationName: "Suayb's Blog",
      title: 'Blog',
      description: 'Blog application',
      manifest: '/manifest.webmanifest',
      appleWebApp: { capable: true, title: "Suayb's Blog" },
    });
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(viewport.themeColor).toEqual([
      { media: '(prefers-color-scheme: light)', color: '#ffffff' },
      { media: '(prefers-color-scheme: dark)', color: '#111827' },
    ]);
  });

  it('emits the English root document with English resources and no locale cookie behavior', async () => {
    const element = await RootLayout({ children: <div>static-content</div>, params: Promise.resolve({}) });
    const html = element as React.ReactElement<{ lang: string; children: React.ReactNode }>;
    expect(html.type).toBe('html');
    expect(html.props.lang).toBe('en');

    const body = React.Children.toArray(html.props.children)[0] as React.ReactElement<{
      children: React.ReactNode;
    }>;
    render(<>{body.props.children}</>);

    expect(mockLoadLocaleResources).toHaveBeenCalledWith('en', expect.any(Array));
    expect(mockAppProviders).toHaveBeenCalledWith(expect.objectContaining({ locale: 'en', resources: mockResources }));
    expect(screen.getByText('static-content')).toBeInTheDocument();
  });
});
