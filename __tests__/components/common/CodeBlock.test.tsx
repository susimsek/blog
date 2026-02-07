import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CodeBlock from '@/components/common/CodeBlock';

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock i18n translation function
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Just return the key as translation
  }),
}));

const mockTranslation = (key: string) => {
  return key;
};

jest.mock('react-bootstrap/Tooltip', () => {
  return ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
});

jest.mock('@/config/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

// Mock `FontAwesomeIcon` component
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`font-awesome-icon-${icon}`} />,
}));

describe('CodeBlock Component', () => {
  it('renders syntax highlighted code when language is provided', () => {
    render(
      <CodeBlock
        theme="dark"
        t={mockTranslation}
        className="language-javascript"
      >{`console.log('Hello, World!');`}</CodeBlock>,
    );

    const codeElement = screen.getByRole('code');
    expect(codeElement).toBeInTheDocument();

    expect(codeElement.textContent).toContain("console.log('Hello, World!');");
  });

  it('renders plain code when language is not provided', () => {
    render(<CodeBlock theme="light" t={mockTranslation}>{`console.log('Hello, World!');`}</CodeBlock>);

    const plainCode = screen.getByText(/console\.log\('Hello, World!'\)/);
    expect(plainCode).toBeInTheDocument();
  });

  it('renders JavaScript code block correctly with dark theme', () => {
    render(
      <CodeBlock
        theme="dark"
        t={mockTranslation}
        className="language-javascript"
      >{`console.log('Hello, World!');`}</CodeBlock>,
    );

    const codeBlock = document.querySelector('.language-javascript');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock).toHaveTextContent(`console.log('Hello, World!');`);
  });

  it('renders highlighted block markup for light mode', () => {
    render(
      <CodeBlock
        theme="light"
        t={mockTranslation}
        className="language-javascript"
      >{`console.log('Hello, World!');`}</CodeBlock>,
    );

    const codeBlock = document.querySelector('.language-javascript');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock).toHaveTextContent(`console.log('Hello, World!');`);
  });

  it('renders code as plain text when className is not defined', () => {
    render(<CodeBlock theme="dark" t={mockTranslation}>{`console.log('No Language Provided');`}</CodeBlock>);

    const plainCode = screen.getByText(/console\.log\('No Language Provided'\)/);
    expect(plainCode).toBeInTheDocument();
    expect(plainCode.tagName).toBe('CODE');
  });

  it('copies text to clipboard when copy button is clicked', async () => {
    render(
      <CodeBlock
        theme="light"
        t={mockTranslation}
        className="language-javascript"
      >{`console.log('Copy Test');`}</CodeBlock>,
    );

    const copyIcon = screen.getByTestId('font-awesome-icon-copy');
    expect(copyIcon).toBeInTheDocument();

    const copyButton = screen.getByRole('button', { name: 'common.codeBlock.copy' });
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("console.log('Copy Test');");

    const checkIcon = screen.getByTestId('font-awesome-icon-check');
    expect(checkIcon).toBeInTheDocument();
  });

  it('shows language badge and toggles line numbers for multiline code', () => {
    render(
      <CodeBlock
        theme="light"
        t={mockTranslation}
        className="language-javascript"
      >{`const a = 1;\nconst b = 2;`}</CodeBlock>,
    );

    expect(screen.getByText('JAVASCRIPT')).toBeInTheDocument();

    const toggleButton = screen.getByRole('button', { name: 'common.codeBlock.showLineNumbers' });
    expect(screen.getByTestId('font-awesome-icon-eye')).toBeInTheDocument();

    fireEvent.click(toggleButton);

    expect(screen.getByRole('button', { name: 'common.codeBlock.hideLineNumbers' })).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-eye-slash')).toBeInTheDocument();
  });

  it('renders inline code correctly when inline prop is true', () => {
    render(
      <CodeBlock inline theme="light" t={mockTranslation} className="language-javascript">
        {`inline code example`}
      </CodeBlock>,
    );

    const inlineCode = screen.getByText('inline code example');
    expect(inlineCode).toBeInTheDocument();
    expect(inlineCode.tagName).toBe('CODE');
    expect(inlineCode).toHaveClass('language-javascript');
  });

  it('supports oceanic and forest themes for highlighted blocks', () => {
    const { rerender } = render(
      <CodeBlock theme="oceanic" t={mockTranslation} className="language-javascript">
        {`const theme = 'oceanic';`}
      </CodeBlock>,
    );

    expect(screen.getByRole('code')).toHaveTextContent("const theme = 'oceanic';");

    rerender(
      <CodeBlock theme="forest" t={mockTranslation} className="language-javascript">
        {`const theme = 'forest';`}
      </CodeBlock>,
    );
    expect(screen.getByRole('code')).toHaveTextContent("const theme = 'forest';");
  });

  it('normalizes complex children before copy and skips empty copy payloads', () => {
    render(
      <CodeBlock theme="light" t={mockTranslation} className="language-javascript">
        {['line ', 1, '\n', <span key="x">ignored</span>]}
      </CodeBlock>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'common.codeBlock.copy' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('line 1');

    render(
      <CodeBlock theme="light" t={mockTranslation} className="language-javascript">
        {<span>ignored</span>}
      </CodeBlock>,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'common.codeBlock.copy' }).at(-1) as HTMLElement);
    expect((navigator.clipboard.writeText as jest.Mock).mock.calls.filter(call => call[0] === '').length).toBe(0);
  });

  it('loads syntax assets outside test environment and applies all theme branches', async () => {
    const previousDescriptor = Object.getOwnPropertyDescriptor(process.env, 'NODE_ENV');
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    try {
      const { rerender } = render(
        <CodeBlock theme="dark" t={mockTranslation} className="language-sh">
          {'echo "hello"'}
        </CodeBlock>,
      );

      await waitFor(() => {
        expect(document.querySelector('pre.language-sh')).not.toBeInTheDocument();
      });

      rerender(
        <CodeBlock theme="oceanic" t={mockTranslation} className="language-sh">
          {'echo "hello"'}
        </CodeBlock>,
      );
      rerender(
        <CodeBlock theme="forest" t={mockTranslation} className="language-sh">
          {'echo "hello"'}
        </CodeBlock>,
      );
      rerender(
        <CodeBlock theme="light" t={mockTranslation} className="language-sh">
          {'echo "hello"'}
        </CodeBlock>,
      );

      expect(screen.getByText('SH')).toBeInTheDocument();
    } finally {
      if (previousDescriptor) {
        Object.defineProperty(process.env, 'NODE_ENV', previousDescriptor);
      } else {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: 'test',
          configurable: true,
        });
      }
    }
  });

  it('resolves language aliases that should map to plain text', () => {
    render(
      <CodeBlock theme="light" t={mockTranslation} className="language-text">
        {'just text'}
      </CodeBlock>,
    );

    expect(screen.getByText('TEXT')).toBeInTheDocument();
    expect(screen.getByRole('code')).toHaveTextContent('just text');
  });
});
