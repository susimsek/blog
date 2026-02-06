import React, { useEffect, useState } from 'react';
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

type SyntaxHighlighterComponent = typeof import('react-syntax-highlighter').Prism;
type SyntaxTheme = Record<string, React.CSSProperties>;
type SyntaxAssets = {
  SyntaxHighlighter: SyntaxHighlighterComponent;
  themes: {
    dark: SyntaxTheme;
    light: SyntaxTheme;
    oceanic: SyntaxTheme;
    forest: SyntaxTheme;
  };
};

let syntaxAssetsPromise: Promise<SyntaxAssets> | null = null;

const loadSyntaxAssets = async (): Promise<SyntaxAssets> => {
  if (!syntaxAssetsPromise) {
    syntaxAssetsPromise = Promise.all([
      import('react-syntax-highlighter'),
      import('react-syntax-highlighter/dist/cjs/styles/prism/material-dark'),
      import('react-syntax-highlighter/dist/cjs/styles/prism/material-light'),
      import('react-syntax-highlighter/dist/cjs/styles/prism/material-oceanic'),
      import('react-syntax-highlighter/dist/cjs/styles/prism/gruvbox-dark'),
    ]).then(([syntaxLib, darkStyle, lightStyle, oceanicStyle, forestStyle]) => ({
      SyntaxHighlighter: syntaxLib.Prism,
      themes: {
        dark: darkStyle.default,
        light: lightStyle.default,
        oceanic: oceanicStyle.default,
        forest: forestStyle.default,
      },
    }));
  }

  return syntaxAssetsPromise;
};

const toCodeText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(toCodeText).join('');
  }
  return '';
};

const CodeBlock: React.FC<Readonly<CodeBlockProps>> = ({ inline, className, children, theme, t, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [syntaxAssets, setSyntaxAssets] = useState<SyntaxAssets | null>(null);
  const match = /language-(\w+)/.exec(className ?? '');
  const hasLanguage = Boolean(match);
  const language = match?.[1];
  const codeText = toCodeText(children).replace(/\n$/, '');
  const isMultiline = codeText.includes('\n');

  useEffect(() => {
    if (process.env.NODE_ENV === 'test' || inline || !hasLanguage) {
      return;
    }

    let isMounted = true;
    loadSyntaxAssets().then(assets => {
      if (isMounted) {
        setSyntaxAssets(assets);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [inline, hasLanguage]);

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

  const syntaxTheme = syntaxAssets
    ? (() => {
        switch (theme) {
          case 'dark':
            return syntaxAssets.themes.dark;
          case 'oceanic':
            return syntaxAssets.themes.oceanic;
          case 'forest':
            return syntaxAssets.themes.forest;
          default:
            return syntaxAssets.themes.light;
        }
      })()
    : null;
  const SyntaxHighlighter = syntaxAssets?.SyntaxHighlighter;

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

      {SyntaxHighlighter && syntaxTheme ? (
        <SyntaxHighlighter
          style={syntaxTheme}
          language={language}
          PreTag="div"
          showLineNumbers={showLineNumbers}
          customStyle={{ padding: '2.5rem 1rem 1rem' }}
          {...props}
        >
          {codeText}
        </SyntaxHighlighter>
      ) : (
        <pre className={className}>
          <code role="code">{codeText}</code>
        </pre>
      )}
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
