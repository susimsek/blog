import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminContentPostContentTab from '@/components/admin/content/AdminContentPostContentTab';
import type { AdminContentPostItem, AdminContentTopicItem } from '@/lib/adminApi';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => <span aria-hidden="true" /> }));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));
jest.mock('@/components/admin/AdminMarkdownEditor', () => ({
  __esModule: true,
  default: ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
    <textarea aria-label={label} value={value} onChange={event => onChange(event.currentTarget.value)} />
  ),
}));
jest.mock('@/components/common/MarkdownRenderer', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}));
jest.mock('@/components/posts/PostCategoryBadge', () => ({
  __esModule: true,
  default: ({ category }: { category: { name: string } }) => <span>{category.name}</span>,
}));

const t = (key: string) => key;
const post = {
  id: 'post-1',
  locale: 'en',
  title: 'A test post',
  publishedDate: '2026-11-01',
  updatedDate: '',
} as AdminContentPostItem;
const topic: AdminContentTopicItem = {
  locale: 'en',
  id: 'sports',
  name: 'Sports',
  color: 'primary',
  link: null,
  updatedAt: null,
};
const category = { id: 'games', name: 'Games', color: 'success' };

describe('AdminContentPostContentTab', () => {
  it('renders post preview metadata, media and editor controls', () => {
    const onModeChange = jest.fn();
    const onContentChange = jest.fn();
    render(
      <AdminContentPostContentTab
        t={t}
        editingPost={post}
        postEditorPreviewState={{
          sourceIcon: 'book',
          sourceLabel: 'Blog',
          thumbnailSrc: '/cover.webp',
          resolvedSummary: 'A short summary',
          resolvedPostCategory: category,
          resolvedTopicBadges: [topic],
        }}
        postContentViewMode="editor"
        onPostContentViewModeChange={onModeChange}
        postEditorContent="# draft"
        onPostEditorContentChange={onContentChange}
        onSplitEditorViewportChange={jest.fn()}
        splitPreviewRef={React.createRef<HTMLDivElement>()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'A test post' })).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('A short summary')).toBeInTheDocument();
    expect(screen.getByAltText('A test post')).toHaveAttribute('src', '/cover.webp');
    expect(screen.getByDisplayValue('# draft')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.modals.post.modes.split' }));
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.modals.post.modes.preview' }));
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Changed' } });
    expect(onModeChange).toHaveBeenNthCalledWith(1, 'split');
    expect(onModeChange).toHaveBeenNthCalledWith(2, 'preview');
    expect(onContentChange).toHaveBeenCalledWith('Changed');
  });

  it('renders empty split and preview states without optional post metadata', () => {
    const { rerender } = render(
      <AdminContentPostContentTab
        t={t}
        editingPost={post}
        postEditorPreviewState={null}
        postContentViewMode="split"
        onPostContentViewModeChange={jest.fn()}
        postEditorContent="   "
        onPostEditorContentChange={jest.fn()}
        onSplitEditorViewportChange={jest.fn()}
        splitPreviewRef={React.createRef<HTMLDivElement>()}
      />,
    );

    expect(screen.queryByRole('heading', { name: 'A test post' })).not.toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.modals.post.previewEmpty')).toBeInTheDocument();
    expect(screen.queryByTestId('markdown')).not.toBeInTheDocument();

    rerender(
      <AdminContentPostContentTab
        t={t}
        editingPost={post}
        postEditorPreviewState={{
          sourceIcon: 'book',
          sourceLabel: 'Blog',
          thumbnailSrc: null,
          resolvedSummary: '',
          resolvedPostCategory: null,
          resolvedTopicBadges: [],
        }}
        postContentViewMode="preview"
        onPostContentViewModeChange={jest.fn()}
        postEditorContent="Rendered markdown"
        onPostEditorContentChange={jest.fn()}
        onSplitEditorViewportChange={jest.fn()}
        splitPreviewRef={React.createRef<HTMLDivElement>()}
      />,
    );
    expect(screen.getByTestId('markdown')).toHaveTextContent('Rendered markdown');
    expect(screen.getByText('adminAccount.content.modals.post.modes.preview')).toBeInTheDocument();
  });
});
