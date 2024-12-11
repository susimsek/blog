import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';

interface CodeBlockProps {
  className?: string;
  children: React.ReactNode;
  theme: 'light' | 'dark';
  t: (key: string) => string;
}

const CodeBlock: React.FC<Readonly<CodeBlockProps>> = ({ className, children, theme, t }) => {
  const [isCopied, setIsCopied] = useState(false);

  const syntaxTheme: any = theme === 'dark' ? materialDark : materialLight;
  const match = /language-(\w+)/.exec(className ?? '');

  const copyToClipboard = () => {
    if (children) {
      navigator.clipboard.writeText(String(children));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return match ? (
    <div className="code-block-container">
      <SyntaxHighlighter style={syntaxTheme} language={match[1]}>
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id="copy-tooltip">{isCopied ? t('common.codeBlock.copied') : t('common.codeBlock.copy')}</Tooltip>
        }
      >
        <Button className="copy-button" size="sm" onClick={copyToClipboard}>
          {t('common.codeBlock.copy')}
        </Button>
      </OverlayTrigger>
    </div>
  ) : (
    <code className={className}>{children}</code>
  );
};

export default CodeBlock;
