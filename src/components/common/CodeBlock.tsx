import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
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
type PrismLightStaticApi = {
  registerLanguage?: (name: string, language: unknown) => void;
};
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
const registeredLanguages = new Set<string>();

const loadSyntaxAssets = async (): Promise<SyntaxAssets> => {
  syntaxAssetsPromise ??= Promise.all([
    import('react-syntax-highlighter/dist/cjs/prism-light'),
    import('react-syntax-highlighter/dist/cjs/styles/prism/material-dark'),
    import('react-syntax-highlighter/dist/cjs/styles/prism/material-light'),
    import('react-syntax-highlighter/dist/cjs/styles/prism/material-oceanic'),
    import('react-syntax-highlighter/dist/cjs/styles/prism/gruvbox-dark'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/bash'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/csv'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/go'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/graphql'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/groovy'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/java'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/json'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/kotlin'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/properties'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/xml-doc'),
    import('react-syntax-highlighter/dist/cjs/languages/prism/yaml'),
  ]).then(
    ([
      prismLightLib,
      darkStyle,
      lightStyle,
      oceanicStyle,
      forestStyle,
      bashLang,
      csvLang,
      goLang,
      graphqlLang,
      groovyLang,
      javaLang,
      jsonLang,
      kotlinLang,
      propertiesLang,
      xmlLang,
      yamlLang,
    ]) => {
      const SyntaxHighlighter = prismLightLib.default as unknown as SyntaxHighlighterComponent;
      const prismLightApi = prismLightLib.default as unknown as PrismLightStaticApi;
      const registerLanguage = (name: string, languageModule: unknown) => {
        if (registeredLanguages.has(name) || !prismLightApi.registerLanguage) {
          return;
        }
        prismLightApi.registerLanguage(name, (languageModule as { default?: unknown }).default ?? languageModule);
        registeredLanguages.add(name);
      };

      registerLanguage('bash', bashLang);
      registerLanguage('csv', csvLang);
      registerLanguage('go', goLang);
      registerLanguage('graphql', graphqlLang);
      registerLanguage('groovy', groovyLang);
      registerLanguage('java', javaLang);
      registerLanguage('json', jsonLang);
      registerLanguage('kotlin', kotlinLang);
      registerLanguage('properties', propertiesLang);
      registerLanguage('xml', xmlLang);
      registerLanguage('yaml', yamlLang);

      return {
        SyntaxHighlighter,
        themes: {
          dark: darkStyle.default,
          light: lightStyle.default,
          oceanic: oceanicStyle.default,
          forest: forestStyle.default,
        },
      };
    },
  );

  return syntaxAssetsPromise;
};

const LANGUAGE_ALIASES: Record<string, string> = {
  html: 'xml',
  ldif: 'properties',
  plaintext: 'text',
  shell: 'bash',
  sh: 'bash',
  text: 'text',
  xml: 'xml',
  yml: 'yaml',
};

const resolveLanguage = (language: string | undefined): string | null => {
  if (!language) {
    return null;
  }
  const normalized = language.toLowerCase();
  if (LANGUAGE_ALIASES[normalized] === 'text') {
    return null;
  }
  return LANGUAGE_ALIASES[normalized] ?? normalized;
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

const getSyntaxTheme = (theme: Theme, themes: SyntaxAssets['themes']): SyntaxTheme => {
  switch (theme) {
    case 'dark':
      return themes.dark;
    case 'oceanic':
      return themes.oceanic;
    case 'forest':
      return themes.forest;
    default:
      return themes.light;
  }
};

const CodeBlock: React.FC<Readonly<CodeBlockProps>> = ({ inline, className, children, theme, t, ...props }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [syntaxAssets, setSyntaxAssets] = useState<SyntaxAssets | null>(null);
  const match = /language-(\w+)/.exec(className ?? '');
  const hasLanguage = Boolean(match);
  const language = match?.[1];
  const resolvedLanguage = resolveLanguage(language);
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

  const syntaxTheme = syntaxAssets ? getSyntaxTheme(theme, syntaxAssets.themes) : null;
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
          language={resolvedLanguage ?? language}
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
