import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TFunction } from 'i18next';
import AdminContentPostsTab from '@/components/admin/content/AdminContentPostsTab';
import type {
  AdminContentCategoryItem,
  AdminContentPostGroupItem,
  AdminContentPostItem,
  AdminContentTopicItem,
} from '@/lib/adminApi';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    fill: _fill,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean; unoptimized?: boolean }) => (
    <img {...props} alt={props.alt ?? ''} />
  ),
}));

jest.mock('@/components/admin/AdminLoadingState', () => ({
  __esModule: true,
  default: ({ ariaLabel }: { ariaLabel: string }) => <div role="status" aria-label={ariaLabel} />,
}));

jest.mock('@/components/common/CompactCount', () => ({
  __esModule: true,
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

jest.mock('@/components/common/PostDensityToggle', () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (mode: 'default' | 'editorial' | 'grid') => void }) => (
    <div>
      <button onClick={() => onChange('editorial')}>Editorial density</button>
      <button onClick={() => onChange('grid')}>Grid density</button>
    </div>
  ),
}));

jest.mock('@/components/pagination/PaginationBar', () => ({
  __esModule: true,
  default: ({
    onPageChange,
    onSizeChange,
  }: {
    onPageChange: (page: number) => void;
    onSizeChange: (size: number) => void;
  }) => (
    <div>
      <button onClick={() => onPageChange(2)}>Next page</button>
      <button onClick={() => onSizeChange(20)}>Change page size</button>
    </div>
  ),
}));

jest.mock('@/components/posts/PostCategoryBadge', () => ({
  __esModule: true,
  default: ({ category }: { category: { name: string } }) => <span>{category.name}</span>,
}));

const translate = (key: string, options?: { value?: string }) => {
  if (key === 'adminAccount.content.modals.post.lifecycle.scheduledFor') {
    return `${key}:${options?.value ?? ''}`;
  }
  return key;
};

const makePost = (overrides: Partial<AdminContentPostItem> = {}): AdminContentPostItem => ({
  locale: 'en',
  id: 'captain-tsubasa',
  title: 'Captain Tsubasa',
  summary: 'A football story',
  content: null,
  contentMode: 'markdown',
  thumbnail: '/images/captain.webp',
  source: 'blog',
  publishedDate: '2026-02-26',
  updatedDate: '2026-02-27',
  categoryId: 'gaming',
  categoryName: 'Gaming',
  topicIds: ['anime-game'],
  topicNames: ['Anime Game'],
  readingTimeMin: 4,
  status: 'SCHEDULED',
  scheduledAt: '2026-02-28T03:00:00Z',
  contentUpdatedAt: null,
  updatedAt: null,
  revisionCount: 0,
  latestRevisionAt: null,
  viewCount: 1400,
  likeCount: 40,
  commentCount: 2,
  ...overrides,
});

const props = () => {
  const post = makePost();
  const draft = makePost({
    id: 'draft-post',
    title: 'Draft Post',
    locale: 'tr',
    source: 'blog',
    status: 'DRAFT',
    thumbnail: null,
    updatedDate: null,
    scheduledAt: null,
    categoryName: 'All Categories',
    categoryId: null,
    topicIds: [],
    topicNames: ['Fallback Topic'],
    summary: '  Draft summary  ',
  });
  const medium = makePost({
    id: 'medium-post',
    title: 'Medium Post',
    source: 'medium',
    status: 'PUBLISHED',
    thumbnail: 'https://cdn.example.com/medium.webp',
    updatedDate: null,
    scheduledAt: null,
    categoryName: 'Tüm kategoriler',
    topicIds: [],
    topicNames: [],
    summary: null,
  });
  const groups: AdminContentPostGroupItem[] = [post, draft, medium].map(item => ({
    id: item.id,
    source: item.source,
    preferred: item,
    en: item.locale === 'en' ? item : null,
    tr: item.locale === 'tr' ? item : null,
  }));
  const category: AdminContentCategoryItem = {
    locale: 'en',
    id: 'gaming',
    name: 'Gaming',
    color: 'danger',
    icon: 'gamepad',
    link: null,
    updatedAt: null,
  };
  const topic: AdminContentTopicItem = {
    locale: 'en',
    id: 'anime-game',
    name: 'Anime Game',
    color: 'primary',
    link: null,
    updatedAt: null,
  };

  return {
    t: translate as TFunction,
    formatDate: (value: string) => `date:${value}`,
    formatDateTime: (value: string) => `datetime:${value}`,
    formatCount: (value: number) => String(value),
    routeLocale: 'en',
    filterLocale: 'all' as const,
    onFilterLocaleChange: jest.fn(),
    filterSource: 'all' as const,
    onFilterSourceChange: jest.fn(),
    filterCategoryID: '',
    onFilterCategoryIDChange: jest.fn(),
    filterTopicID: '',
    onFilterTopicIDChange: jest.fn(),
    filterQuery: 'tsubasa',
    onFilterQueryChange: jest.fn(),
    onClearFilterQuery: jest.fn(),
    filterCategoryOptions: [category],
    filterTopicOptions: [topic],
    resolvedPostDensityMode: 'default' as const,
    canUsePostGridDensity: false,
    onPostDensityModeChange: jest.fn(),
    isLoading: false,
    total: groups.length,
    posts: groups,
    categoriesByLocaleAndID: new Map([['en|gaming', category]]),
    topicsByLocaleAndID: new Map([['en|anime-game', topic]]),
    page: 1,
    totalPages: 2,
    pageSize: 10,
    onPageChange: jest.fn(),
    onPageSizeChange: jest.fn(),
    onOpenDeletePost: jest.fn(),
  };
};

describe('AdminContentPostsTab', () => {
  it('renders posts, metadata, taxonomy, source, thumbnail, and actions', () => {
    const viewProps = props();
    const { container } = render(<AdminContentPostsTab {...viewProps} />);

    expect(screen.getByText('Captain Tsubasa')).toHaveAttribute(
      'href',
      '/admin/settings/content/posts/en/captain-tsubasa',
    );
    expect(screen.getAllByText('Gaming')).toHaveLength(2);
    expect(screen.getAllByText('Anime Game')).toHaveLength(2);
    expect(
      screen.getByText('adminAccount.content.modals.post.lifecycle.scheduledFor:datetime:2026-02-28T03:00:00Z'),
    ).toBeInTheDocument();
    expect(screen.getByText('Fallback Topic')).toBeInTheDocument();
    expect(screen.getByText('Medium Post')).not.toHaveAttribute('href');
    expect(container.querySelector('img[alt="Captain Tsubasa"]')).toHaveAttribute('src', '/images/captain.webp');
    expect(container.querySelector('img[alt="Medium Post"]')).toHaveAttribute(
      'src',
      'https://cdn.example.com/medium.webp',
    );

    fireEvent.change(screen.getByLabelText('adminAccount.content.filters.locale'), { target: { value: 'tr' } });
    fireEvent.change(screen.getByLabelText('adminAccount.content.filters.source'), { target: { value: 'medium' } });
    fireEvent.change(screen.getByLabelText('adminAccount.content.filters.category'), { target: { value: 'gaming' } });
    fireEvent.change(screen.getByLabelText('adminAccount.content.filters.topic'), { target: { value: 'anime-game' } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'changed' } });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.filters.query' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editorial density' }));
    fireEvent.click(screen.getByRole('button', { name: 'Grid density' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.content.actions.deletePost' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Change page size' }));

    expect(viewProps.onFilterLocaleChange).toHaveBeenCalledWith('tr');
    expect(viewProps.onFilterSourceChange).toHaveBeenCalledWith('medium');
    expect(viewProps.onFilterCategoryIDChange).toHaveBeenCalledWith('gaming');
    expect(viewProps.onFilterTopicIDChange).toHaveBeenCalledWith('anime-game');
    expect(viewProps.onFilterQueryChange).toHaveBeenCalledWith('changed');
    expect(viewProps.onClearFilterQuery).toHaveBeenCalled();
    expect(viewProps.onPostDensityModeChange).toHaveBeenNthCalledWith(1, 'editorial');
    expect(viewProps.onPostDensityModeChange).toHaveBeenNthCalledWith(2, 'default');
    expect(viewProps.onOpenDeletePost).toHaveBeenCalledWith(viewProps.posts[0].preferred);
    expect(viewProps.onPageChange).toHaveBeenCalledWith(2);
    expect(viewProps.onPageSizeChange).toHaveBeenCalledWith(20);
  });

  it('renders loading and empty states without pagination', () => {
    const viewProps = props();
    const { rerender } = render(<AdminContentPostsTab {...viewProps} isLoading />);
    expect(screen.getByRole('status', { name: 'adminAccount.content.loading.posts' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();

    rerender(<AdminContentPostsTab {...viewProps} isLoading={false} total={0} posts={[]} />);
    expect(screen.getByText('adminAccount.content.empty.posts')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();
  });
});
