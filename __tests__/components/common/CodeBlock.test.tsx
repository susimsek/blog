import React from 'react';
import { render, screen } from '@testing-library/react';
import CodeBlock from '@/components/common/CodeBlock';

describe('CodeBlock Component', () => {
  it('renders syntax highlighted code when language is provided', () => {
    render(
      <CodeBlock className="language-javascript" theme="dark">
        {`console.log('Hello, World!');`}
      </CodeBlock>,
    );

    const codeElement = screen.getByRole('code');
    expect(codeElement).toBeInTheDocument();

    expect(codeElement.textContent).toContain("console.log('Hello, World!');");
  });

  it('renders plain code when language is not provided', () => {
    render(<CodeBlock theme="light">{`console.log('Hello, World!');`}</CodeBlock>);

    const plainCode = screen.getByText(/console\.log\('Hello, World!'\)/);
    expect(plainCode).toBeInTheDocument();
  });

  it('renders JavaScript code block correctly with dark theme', () => {
    render(
      <CodeBlock className="language-javascript" theme="dark">
        {`console.log('Hello, World!');`}
      </CodeBlock>,
    );

    const codeBlock = document.querySelector('.language-javascript');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock).toHaveTextContent(`console.log('Hello, World!');`);
  });

  it('applies the correct theme for light mode', () => {
    render(
      <CodeBlock className="language-javascript" theme="light">
        {`console.log('Hello, World!');`}
      </CodeBlock>,
    );

    const codeBlock = document.querySelector('code.language-javascript');
    expect(codeBlock).toBeInTheDocument();
    expect(codeBlock).toHaveStyle({ background: 'rgb(250, 250, 250)' });
  });

  it('renders code as plain text when className is not defined', () => {
    render(<CodeBlock theme="dark">{`console.log('No Language Provided');`}</CodeBlock>);

    const plainCode = screen.getByText(/console\.log\('No Language Provided'\)/);
    expect(plainCode).toBeInTheDocument();
    expect(plainCode.tagName).toBe('CODE');
  });
});
