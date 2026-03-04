declare module 'react-dom' {
  import type * as React from 'react';

  export function createPortal(children: React.ReactNode, container: Element | DocumentFragment): React.ReactPortal;
}
