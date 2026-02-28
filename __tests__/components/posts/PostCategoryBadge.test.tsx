import React from 'react';
import { render, screen } from '@testing-library/react';
import PostCategoryBadge from '@/components/posts/PostCategoryBadge';
import { getPostCategoryPresentation } from '@/lib/postCategories';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { resolvedLanguage: 'en', language: 'en' },
  }),
}));

jest.mock('@/lib/postCategories', () => ({
  getPostCategoryPresentation: jest.fn(),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ className }: { className?: string }) => (
    <span data-testid="category-icon" className={className} />
  ),
}));

jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const getPostCategoryPresentationMock = getPostCategoryPresentation as jest.MockedFunction<
  typeof getPostCategoryPresentation
>;

describe('PostCategoryBadge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders linked category badge with fixed-width icon class', () => {
    getPostCategoryPresentationMock.mockReturnValue({
      slug: 'programming',
      label: 'Programming',
      color: 'blue',
      icon: 'code',
    });

    render(<PostCategoryBadge category={{ id: 'programming', name: 'Programming', color: 'blue' }} />);

    expect(screen.getByRole('link', { name: /programming/i })).toHaveAttribute('href', '/categories/programming');
    expect(screen.getByTestId('category-icon')).toHaveClass('fa-fw');
  });

  it('renders non-linked badge as span and returns null when category is unknown', () => {
    getPostCategoryPresentationMock.mockReturnValue({
      slug: 'gaming',
      label: 'Gaming',
      color: 'red',
      icon: undefined,
    });
    const { rerender, container } = render(
      <PostCategoryBadge category={{ id: 'gaming', name: 'Gaming', color: 'red' }} linked={false} />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.querySelector('span.post-category-link')).toBeInTheDocument();

    getPostCategoryPresentationMock.mockReturnValue(null);
    rerender(<PostCategoryBadge category={{ id: 'unknown', name: 'Unknown', color: 'gray' }} />);
    expect(container).toBeEmptyDOMElement();
  });
});
