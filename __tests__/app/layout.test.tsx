import React from 'react';
import RootLayout, { metadata } from '@/app/layout';

describe('RootLayout', () => {
  it('exposes base metadata', () => {
    expect(metadata).toMatchObject({
      title: 'Blog',
      description: 'Blog application',
    });
    expect(metadata.metadataBase).toBeInstanceOf(URL);
  });

  it('creates html/body wrapper with children', () => {
    const element = RootLayout({ children: <div>child-content</div> }) as React.ReactElement;

    expect(element.type).toBe('html');
    expect(element.props.lang).toBe('en');

    const bodyElement = element.props.children as React.ReactElement;
    expect(bodyElement.type).toBe('body');
    expect(bodyElement.props.children.props.children).toBe('child-content');
  });
});
