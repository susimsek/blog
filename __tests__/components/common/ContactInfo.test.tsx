import React from 'react';
import { render, screen } from '@testing-library/react';
import ContactInfo from '@/components/common/ContactInfo';
import { CONTACT_LINKS } from '@/config/constants';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}));

// Mock `FontAwesomeIcon` component
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <i data-testid={`font-awesome-icon-${icon}`} />,
}));

describe('ContactInfo Component', () => {
  it('renders email information correctly', () => {
    render(<ContactInfo />);

    const emailElement = screen.getByText(CONTACT_LINKS.email);

    expect(emailElement).toBeInTheDocument();
    expect(emailElement.closest('a')).toHaveAttribute('href', `mailto:${CONTACT_LINKS.email}`);
  });

  it('renders LinkedIn information correctly', () => {
    render(<ContactInfo />);

    const linkedinElement = screen.getByText((content, element) => {
      return element?.tagName === 'STRONG' && content.includes('LinkedIn');
    });

    expect(linkedinElement).toBeInTheDocument();
    const linkedinLink = linkedinElement.closest('li')?.querySelector('a');
    expect(linkedinLink).toHaveAttribute('href', CONTACT_LINKS.linkedin);
  });

  it('renders Medium information correctly', () => {
    render(<ContactInfo />);

    const mediumElement = screen.getByText((content, element) => {
      return element?.tagName === 'STRONG' && content.includes('Medium');
    });

    expect(mediumElement).toBeInTheDocument();
    const mediumLink = mediumElement.closest('li')?.querySelector('a');
    expect(mediumLink).toHaveAttribute('href', CONTACT_LINKS.medium);
  });

  it('renders GitHub information correctly', () => {
    render(<ContactInfo />);

    const githubElement = screen.getByText((content, element) => {
      return element?.tagName === 'STRONG' && content.includes('GitHub');
    });

    expect(githubElement).toBeInTheDocument();
    const githubLink = githubElement.closest('li')?.querySelector('a');
    expect(githubLink).toHaveAttribute('href', CONTACT_LINKS.github);
  });

  it('renders all icons correctly', () => {
    render(<ContactInfo />);

    expect(screen.getByTestId('font-awesome-icon-envelope')).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-fab,linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-fab,medium')).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-fab,github')).toBeInTheDocument();
  });
});
