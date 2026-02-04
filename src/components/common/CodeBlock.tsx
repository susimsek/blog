import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import materialOceanic from 'react-syntax-highlighter/dist/cjs/styles/prism/material-oceanic';
import gruvboxDark from 'react-syntax-highlighter/dist/cjs/styles/prism/gruvbox-dark';
import { Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Theme } from '@/reducers/theme';

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
  theme: Theme;
  t: (key: string) => string;
}

const CodeBlock: React.FC<Readonly<CodeBlockProps>> = ({ inline, className, children, theme, t, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);

  const syntaxTheme = (() => {
    switch (theme) {
      case 'dark':
        return materialDark;
      case 'oceanic':
        return materialOceanic;
      case 'forest':
        return gruvboxDark;
      default:
        return materialLight;
    }
  })();
  const match = /language-(\w+)/.exec(className ?? '');
  const language = match?.[1];
  const codeText = String(children ?? '').replace(/\n$/, '');
  const isMultiline = codeText.includes('\n');

  const copyToClipboard = () => {
    if (codeText) {
      navigator.clipboard?.writeText?.(codeText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  if (inline) {
    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  }

  return match ? (
    <div className="code-block-container">
      {language && <span className="code-language-badge">{language.toUpperCase()}</span>}
      {isMultiline && (
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id="line-numbers-tooltip">
              {showLineNumbers ? t('common.codeBlock.hideLineNumbers') : t('common.codeBlock.showLineNumbers')}
            </Tooltip>
          }
        >
          <Button
            className="line-numbers-button"
            size="sm"
            aria-label={showLineNumbers ? t('common.codeBlock.hideLineNumbers') : t('common.codeBlock.showLineNumbers')}
            onClick={() => setShowLineNumbers(prev => !prev)}
          >
            <FontAwesomeIcon icon={showLineNumbers ? 'eye-slash' : 'eye'} className="fa-icon" />
          </Button>
        </OverlayTrigger>
      )}

      <SyntaxHighlighter
        style={syntaxTheme}
        language={language}
        PreTag="div"
        showLineNumbers={showLineNumbers}
        customStyle={{ paddingTop: '2.5rem' }}
        {...props}
      >
        {codeText}
      </SyntaxHighlighter>
      <OverlayTrigger
        placement="top"
        overlay={
          <Tooltip id="copy-tooltip">{isCopied ? t('common.codeBlock.copied') : t('common.codeBlock.copy')}</Tooltip>
        }
      >
        <Button className="copy-button" size="sm" aria-label={t('common.codeBlock.copy')} onClick={copyToClipboard}>
          <FontAwesomeIcon icon={isCopied ? 'check' : 'copy'} className="me-2 fa-icon" />
        </Button>
      </OverlayTrigger>
    </div>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export default CodeBlock;
