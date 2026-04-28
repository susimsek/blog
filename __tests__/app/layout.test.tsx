import React from 'react';
import RootLayout, { metadata, viewport } from '@/app/(default)/layout';

describe('RootLayout', () => {
  it('exposes base metadata', () => {
    expect(metadata).toMatchObject({
      applicationName: "Suayb's Blog",
      title: 'Blog',
      description: 'Blog application',
      manifest: '/manifest.webmanifest',
      appleWebApp: {
        capable: true,
        title: "Suayb's Blog",
      },
    });
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(metadata.icons).toMatchObject({
      icon: expect.arrayContaining([expect.objectContaining({ url: '/favicon-192x192.png' })]),
      apple: [expect.objectContaining({ url: '/apple-touch-icon.png' })],
    });
    expect(viewport).toMatchObject({
      themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#ffffff' },
        { media: '(prefers-color-scheme: dark)', color: '#111827' },
      ],
    });
  });

  it('creates html/body wrapper with children', () => {
    const element = RootLayout({
      params: Promise.resolve({}),
      children: <div>child-content</div>,
    }) as React.ReactElement<{ lang?: string; children: React.ReactNode }>;

    expect(element.type).toBe('html');
    expect(element.props.lang).toBe('en');

    const children = React.Children.toArray(element.props.children) as React.ReactElement[];
    const bodyElement = children[0] as React.ReactElement<{ children: React.ReactElement }>;
    const bodyChildren = bodyElement.props.children as React.ReactElement<{ children: string }>;

    expect(bodyElement.type).toBe('body');
    expect(bodyChildren.props.children).toBe('child-content');
  });
});
