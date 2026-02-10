import React from 'react';
import RootLayout, { metadata } from '@/app/(default)/layout';

describe('RootLayout', () => {
  it('exposes base metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Blog',
      description: 'Blog application',
    });
    expect(metadata.metadataBase).toBeInstanceOf(URL);
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
