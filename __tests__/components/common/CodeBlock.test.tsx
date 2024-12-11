import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CodeBlock from '@/components/common/CodeBlock';
import { useAppSelector } from '@/config/store';

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

// Mock i18n translation function
jest.mock('next-i18next', () => ({
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
    (useAppSelector as jest.Mock).mockReturnValue('dark');
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

  it('applies the correct theme for light mode', () => {
    (useAppSelector as jest.Mock).mockReturnValue('light');
    render(
      <CodeBlock
        theme="light"
        t={mockTranslation}
        className="language-javascript"
      >{`console.log('Hello, World!');`}</CodeBlock>,
    );

    const codeBlock = document.querySelector('code.language-javascript');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock).toHaveStyle({ background: 'rgb(250, 250, 250)' });
  });

  it('renders code as plain text when className is not defined', () => {
    (useAppSelector as jest.Mock).mockReturnValue('dark');
    render(<CodeBlock theme="dark" t={mockTranslation}>{`console.log('No Language Provided');`}</CodeBlock>);

    const plainCode = screen.getByText(/console\.log\('No Language Provided'\)/);
    expect(plainCode).toBeInTheDocument();
    expect(plainCode.tagName).toBe('CODE');
  });

  it('copies text to clipboard when copy button is clicked', async () => {
    (useAppSelector as jest.Mock).mockReturnValue('light');
    render(
      <CodeBlock
        theme="light"
        t={mockTranslation}
        className="language-javascript"
      >{`console.log('Copy Test');`}</CodeBlock>,
    );

    const copyIcon = screen.getByTestId('font-awesome-icon-copy');
    expect(copyIcon).toBeInTheDocument();

    const copyButton = screen.getByRole('button');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("console.log('Copy Test');");

    const checkIcon = screen.getByTestId('font-awesome-icon-check');
    expect(checkIcon).toBeInTheDocument();
  });
});
