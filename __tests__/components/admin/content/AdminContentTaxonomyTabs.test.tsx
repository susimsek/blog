import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminContentCategoriesTab from '@/components/admin/content/AdminContentCategoriesTab';
import AdminContentTopicsTab from '@/components/admin/content/AdminContentTopicsTab';
import type { ComponentProps } from 'react';
import type {
  AdminContentCategoryGroupItem,
  AdminContentCategoryItem,
  AdminContentTopicGroupItem,
  AdminContentTopicItem,
} from '@/lib/adminApi';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => null }));
jest.mock('@/components/admin/AdminLoadingState', () => ({
  __esModule: true,
  default: ({ ariaLabel }: { ariaLabel: string }) => <div role="status">{ariaLabel}</div>,
}));
jest.mock('@/components/pagination/PaginationBar', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: ({
      onPageChange,
      onSizeChange,
    }: {
      onPageChange: (page: number) => void;
      onSizeChange: (size: number) => void;
    }) =>
      React.createElement(
        'div',
        null,
        React.createElement('button', { onClick: () => onPageChange(2) }, 'Page 2'),
        React.createElement('button', { onClick: () => onSizeChange(20) }, 'Size 20'),
      ),
  };
});

const t = (key: string, options?: Record<string, unknown>) =>
  options?.value === undefined ? key : `${key}:${String(options.value)}`;

const category: AdminContentCategoryItem = {
  locale: 'en',
  id: 'games',
  name: 'Games',
  color: 'blue',
  icon: 'gamepad',
  link: null,
  updatedAt: '2026-11-01',
};
const categoryWithoutOptionals: AdminContentCategoryItem = {
  ...category,
  locale: 'tr',
  id: 'books',
  name: 'Books',
  icon: null,
  updatedAt: null,
};
const topic: AdminContentTopicItem = {
  locale: 'en',
  id: 'sports',
  name: 'Sports',
  color: 'green',
  link: null,
  updatedAt: '2026-11-02',
};
const topicWithoutDate: AdminContentTopicItem = { ...topic, id: 'anime', name: 'Anime', updatedAt: null };

const makeCategoryProps = (
  overrides: Partial<ComponentProps<typeof AdminContentCategoriesTab>> = {},
): ComponentProps<typeof AdminContentCategoriesTab> => ({
  t,
  formatDate: value => `date:${value}`,
  categoryFilterLocale: 'all',
  onCategoryFilterLocaleChange: jest.fn(),
  categoryFilterQuery: '',
  onCategoryFilterQueryChange: jest.fn(),
  onClearCategoryFilterQuery: jest.fn(),
  isCategoryListLoading: false,
  categoryTotal: 0,
  categoryListItems: [],
  onOpenCreateCategory: jest.fn(),
  onOpenUpdateCategory: jest.fn(),
  onOpenDeleteCategory: jest.fn(),
  resolveAccentColor: value => `accent-${value}`,
  categoryPage: 1,
  categoryTotalPages: 1,
  categoryPageSize: 10,
  onCategoryPageChange: jest.fn(),
  onCategoryPageSizeChange: jest.fn(),
  ...overrides,
});

const makeTopicProps = (
  overrides: Partial<ComponentProps<typeof AdminContentTopicsTab>> = {},
): ComponentProps<typeof AdminContentTopicsTab> => ({
  t,
  formatDate: value => `date:${value}`,
  topicFilterLocale: 'all',
  onTopicFilterLocaleChange: jest.fn(),
  topicFilterQuery: '',
  onTopicFilterQueryChange: jest.fn(),
  onClearTopicFilterQuery: jest.fn(),
  isTopicListLoading: false,
  topicTotal: 0,
  topicListItems: [],
  onOpenCreateTopic: jest.fn(),
  onOpenUpdateTopic: jest.fn(),
  onOpenDeleteTopic: jest.fn(),
  resolveAccentColor: value => `accent-${value}`,
  topicPage: 1,
  topicTotalPages: 1,
  topicPageSize: 10,
  onTopicPageChange: jest.fn(),
  onTopicPageSizeChange: jest.fn(),
  ...overrides,
});

describe('AdminContentCategoriesTab', () => {
  it('shows loading, empty, and create states', () => {
    const props = makeCategoryProps({ isCategoryListLoading: true });
    const { rerender } = render(<AdminContentCategoriesTab {...props} />);
    expect(screen.getByRole('status')).toHaveTextContent('adminAccount.content.loading.taxonomy');
    expect(screen.queryByText('adminAccount.content.empty.categories')).not.toBeInTheDocument();

    rerender(<AdminContentCategoriesTab {...props} isCategoryListLoading={false} />);
    expect(screen.getByText('adminAccount.content.empty.categories')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.actions.create' }));
    expect(props.onOpenCreateCategory).toHaveBeenCalled();
  });

  it('filters, lists categories, opens actions, and changes pagination', () => {
    const groups: AdminContentCategoryGroupItem[] = [
      { id: 'games', preferred: category, en: category, tr: null },
      { id: 'books', preferred: categoryWithoutOptionals, en: null, tr: categoryWithoutOptionals },
    ];
    const props = makeCategoryProps({ categoryTotal: 2, categoryListItems: groups, categoryFilterQuery: 'ga' });
    render(<AdminContentCategoriesTab {...props} />);

    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.list.iconValue:gamepad')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.list.updatedAt:date:2026-11-01')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'adminAccount.content.actions.update' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'adminAccount.content.actions.delete' })).toHaveLength(2);

    fireEvent.change(screen.getByLabelText('adminAccount.content.filters.locale'), { target: { value: 'tr' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'adminAccount.content.filters.query' }), {
      target: { value: 'books' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.filters.query' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.content.actions.update' })[0]!);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.content.actions.delete' })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Size 20' }));

    expect(props.onCategoryFilterLocaleChange).toHaveBeenCalledWith('tr');
    expect(props.onCategoryFilterQueryChange).toHaveBeenCalledWith('books');
    expect(props.onClearCategoryFilterQuery).toHaveBeenCalled();
    expect(props.onOpenUpdateCategory).toHaveBeenCalledWith(category);
    expect(props.onOpenDeleteCategory).toHaveBeenCalledWith(category);
    expect(props.onCategoryPageChange).toHaveBeenCalledWith(2);
    expect(props.onCategoryPageSizeChange).toHaveBeenCalledWith(20);
  });
});

describe('AdminContentTopicsTab', () => {
  it('shows loading, empty, and create states', () => {
    const props = makeTopicProps({ isTopicListLoading: true });
    const { rerender } = render(<AdminContentTopicsTab {...props} />);
    expect(screen.getByRole('status')).toHaveTextContent('adminAccount.content.loading.taxonomy');
    expect(screen.queryByText('adminAccount.content.empty.topics')).not.toBeInTheDocument();

    rerender(<AdminContentTopicsTab {...props} isTopicListLoading={false} />);
    expect(screen.getByText('adminAccount.content.empty.topics')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.actions.create' }));
    expect(props.onOpenCreateTopic).toHaveBeenCalled();
  });

  it('filters, lists topics, opens actions, and changes pagination', () => {
    const groups: AdminContentTopicGroupItem[] = [
      { id: 'sports', preferred: topic, en: topic, tr: null },
      { id: 'anime', preferred: topicWithoutDate, en: topicWithoutDate, tr: null },
    ];
    const props = makeTopicProps({ topicTotal: 2, topicListItems: groups, topicFilterQuery: 'sp' });
    render(<AdminContentTopicsTab {...props} />);

    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Anime')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.list.updatedAt:date:2026-11-02')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'adminAccount.content.actions.update' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'adminAccount.content.actions.delete' })).toHaveLength(2);

    fireEvent.change(screen.getByLabelText('adminAccount.content.filters.locale'), { target: { value: 'en' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'adminAccount.content.filters.query' }), {
      target: { value: 'anime' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.filters.query' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.content.actions.update' })[0]!);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.content.actions.delete' })[0]!);
    fireEvent.click(screen.getByRole('button', { name: 'Page 2' }));
    fireEvent.click(screen.getByRole('button', { name: 'Size 20' }));

    expect(props.onTopicFilterLocaleChange).toHaveBeenCalledWith('en');
    expect(props.onTopicFilterQueryChange).toHaveBeenCalledWith('anime');
    expect(props.onClearTopicFilterQuery).toHaveBeenCalled();
    expect(props.onOpenUpdateTopic).toHaveBeenCalledWith(topic);
    expect(props.onOpenDeleteTopic).toHaveBeenCalledWith(topic);
    expect(props.onTopicPageChange).toHaveBeenCalledWith(2);
    expect(props.onTopicPageSizeChange).toHaveBeenCalledWith(20);
  });
});
