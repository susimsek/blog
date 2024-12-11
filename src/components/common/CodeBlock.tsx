import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
  theme: 'dark' | 'light';
}

const CodeBlock: React.FC<Readonly<CodeBlockProps>> = ({ className, children, theme }) => {
  const syntaxTheme = theme === 'dark' ? materialDark : materialLight;
  const match = /language-(\w+)/.exec(className ?? '');

  return match ? (
    <SyntaxHighlighter style={syntaxTheme} language={match[1]}>
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code className={className}>{children}</code>
  );
};

export default CodeBlock;
