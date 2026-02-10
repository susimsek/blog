declare module '*.svg' {
  import * as React from 'react';
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  export default ReactComponent;
}

declare module 'react-syntax-highlighter/dist/cjs/styles/prism/gruvbox-dark' {
  import type * as React from 'react';
  const style: Record<string, React.CSSProperties>;
  export default style;
}

declare module 'react-syntax-highlighter/dist/cjs/languages/prism/csv' {
  const language: unknown;
  export default language;
}
