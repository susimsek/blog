import React from 'react';
import { render, screen } from '@testing-library/react';
import PostAuthorBox from '@/components/posts/PostAuthorBox';

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: [string, string] }) => <span data-testid={`icon-${icon[1]}`} />,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('PostAuthorBox', () => {
  it('renders author information, expertise, and social links', () => {
    render(<PostAuthorBox />);

    expect(screen.getByRole('heading', { name: 'Şuayb Şimşek' })).toBeInTheDocument();
    expect(screen.getByText('post.authorBox.title')).toBeInTheDocument();
    expect(screen.getByText('post.authorBox.expertise.spring')).toBeInTheDocument();
    expect(screen.getByText('post.authorBox.links.github')).toBeInTheDocument();
    expect(screen.getByText('post.authorBox.links.linkedin')).toBeInTheDocument();
    expect(screen.getByText('post.authorBox.links.medium')).toBeInTheDocument();
    expect(screen.getByTestId('icon-github')).toBeInTheDocument();
    expect(screen.getByTestId('icon-linkedin')).toBeInTheDocument();
    expect(screen.getByTestId('icon-medium')).toBeInTheDocument();
  });
});
