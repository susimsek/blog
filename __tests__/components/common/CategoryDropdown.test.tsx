import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import CategoryDropdown from '@/components/common/CategoryDropdown';

const getAllPostCategoriesMock = jest.fn();

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      resolvedLanguage: 'en',
      language: 'en',
    },
  }),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span data-testid="category-icon" />,
}));

jest.mock('@/lib/postCategories', () => ({
  getAllPostCategories: (locale: string) => getAllPostCategoriesMock(locale),
}));

jest.mock('react-bootstrap/DropdownButton', () => ({
  __esModule: true,
  default: ({
    title,
    onSelect,
    children,
  }: {
    title: React.ReactNode;
    onSelect?: (eventKey: string | null) => void;
    children: React.ReactNode;
  }) => (
    <div>
      <button type="button" data-testid="category-dropdown-trigger" onClick={() => onSelect?.('programming')}>
        {title}
      </button>
      <div>{children}</div>
    </div>
  ),
}));

jest.mock('react-bootstrap/Dropdown', () => {
  const Item = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  return {
    __esModule: true,
    default: { Item },
  };
});

describe('CategoryDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllPostCategoriesMock.mockReturnValue([
      {
        id: 'programming',
        name: 'Programming',
        icon: 'code',
      },
    ]);
  });

  it('calls onChange with the selected category', () => {
    const onChange = jest.fn();

    render(<CategoryDropdown value="all" onChange={onChange} />);
    fireEvent.click(screen.getByTestId('category-dropdown-trigger'));

    expect(onChange).toHaveBeenCalledWith('programming');
  });

  it('returns null when there are no categories', () => {
    getAllPostCategoriesMock.mockReturnValue([]);

    const { container } = render(<CategoryDropdown value="all" onChange={jest.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });
});
