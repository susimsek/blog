import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminContentPostDetailSection from '@/components/admin/content/AdminContentPostDetailSection';
import type { AdminContentPostItem } from '@/lib/adminApi';
import type { ComponentProps } from 'react';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => null }));
jest.mock('@/components/common/FlagIcon', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/common/Link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
jest.mock('@/components/admin/content/AdminContentPostMetadataTab', () => ({
  __esModule: true,
  default: () => <div data-testid="metadata-tab" />,
}));
jest.mock('@/components/admin/content/AdminContentPostContentTab', () => ({
  __esModule: true,
  default: () => <div data-testid="content-tab" />,
}));
jest.mock('@/components/admin/content/AdminContentPostCommentsTab', () => ({
  __esModule: true,
  default: () => <div data-testid="comments-tab" />,
}));

type Props = ComponentProps<typeof AdminContentPostDetailSection>;

const post: AdminContentPostItem = {
  locale: 'en',
  id: 'sample-post',
  title: 'Sample post',
  summary: null,
  content: null,
  contentMode: null,
  thumbnail: null,
  source: 'blog',
  publishedDate: '2026-11-01',
  updatedDate: null,
  categoryId: null,
  categoryName: null,
  topicIds: [],
  topicNames: [],
  readingTimeMin: 1,
  status: 'PUBLISHED',
  scheduledAt: null,
  contentUpdatedAt: null,
  updatedAt: null,
  revisionCount: 0,
  latestRevisionAt: null,
  viewCount: 0,
  likeCount: 0,
  commentCount: 0,
};

const makeProps = (overrides: Partial<Props> = {}) =>
  ({
    t: (key: string) => key,
    routeLocale: 'en',
    editingPost: null,
    activePostEditorTab: 'metadata',
    postLocaleTabs: [],
    onSwitchPostEditorLocale: jest.fn(),
    resolveLocaleLabel: (value: string) => value,
    resolvePostLifecycleBadgeVariant: () => 'success',
    isPostContentLoading: false,
    navigateToPostEditorRoute: jest.fn(),
    resolvePostEditorTab: (value?: string | null) => (value === 'comments' ? 'comments' : 'metadata'),
    showInlinePostFeedback: false,
    errorMessage: '',
    successMessage: '',
    postSaveAction: <span>Save post</span>,
    onOpenDeletePost: jest.fn(),
    ...overrides,
  }) as unknown as Props;

describe('AdminContentPostDetailSection', () => {
  it('renders the empty and loading states', () => {
    const { rerender } = render(<AdminContentPostDetailSection {...makeProps()} />);

    expect(screen.getByRole('heading', { name: 'adminAccount.content.modals.post.title' })).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.modals.post.empty')).toBeInTheDocument();

    rerender(<AdminContentPostDetailSection {...makeProps({ isPostContentLoading: true })} />);

    expect(screen.getByText('adminAccount.content.loading.postContent')).toBeInTheDocument();
    expect(screen.queryByText('adminAccount.content.modals.post.empty')).not.toBeInTheDocument();
  });

  it('renders a blog post editor, locale navigation, feedback, and delete actions', () => {
    const props = makeProps({
      editingPost: post,
      postLocaleTabs: [
        { locale: 'en', available: true },
        { locale: 'tr', available: false },
      ],
      showInlinePostFeedback: true,
      errorMessage: 'Save failed',
      successMessage: 'Saved',
    });
    render(<AdminContentPostDetailSection {...props} />);

    expect(screen.getByRole('heading', { name: 'Sample post' })).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.modals.post.lifecycle.statuses.published')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TR' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('tab', { name: 'adminAccount.content.modals.post.tabs.content' })).toBeInTheDocument();
    expect(screen.getByTestId('metadata-tab')).toBeInTheDocument();
    expect(screen.getByText('Save failed')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'EN' }));
    fireEvent.click(screen.getByRole('tab', { name: 'adminAccount.content.modals.post.tabs.comments' }));
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.actions.deletePost' }));

    expect(props.onSwitchPostEditorLocale).toHaveBeenCalledWith('en');
    expect(props.navigateToPostEditorRoute).toHaveBeenCalledWith(
      '/admin/settings/content/posts/en/sample-post',
      'comments',
    );
    expect(props.onOpenDeletePost).toHaveBeenCalled();
  });

  it('omits locale tabs and the content tab for external posts', () => {
    const externalPost = { ...post, source: 'medium' };
    render(<AdminContentPostDetailSection {...makeProps({ editingPost: externalPost })} />);

    expect(screen.getByTestId('metadata-tab')).toBeInTheDocument();
    expect(
      screen.queryByRole('tab', { name: 'adminAccount.content.modals.post.tabs.content' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'adminAccount.content.modals.post.tabs.comments' })).toBeInTheDocument();
  });
});
