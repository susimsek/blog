import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminContentPostMetadataTab from '@/components/admin/content/AdminContentPostMetadataTab';
import type {
  AdminContentCategoryItem,
  AdminContentPostItem,
  AdminContentPostRevisionItem,
  AdminContentTopicItem,
  AdminMediaLibraryItem,
} from '@/lib/adminApi';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    unoptimized: _unoptimized,
    loader: _loader,
    fill: _fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean; loader?: unknown; fill?: boolean }) => (
    <img {...props} />
  ),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span aria-hidden="true" />,
}));

jest.mock('@/components/common/CompactCount', () => ({
  __esModule: true,
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

jest.mock('@/components/pagination/PaginationBar', () => ({
  __esModule: true,
  default: ({
    currentPage,
    totalPages,
    size,
    onPageChange,
    onSizeChange,
  }: {
    currentPage: number;
    totalPages: number;
    size: number;
    onPageChange: (page: number) => void;
    onSizeChange: (size: number) => void;
  }) => (
    <div>
      <button type="button" onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}>
        next revision page
      </button>
      <button type="button" onClick={() => onSizeChange(size + 10)}>
        increase revision page size
      </button>
    </div>
  ),
}));

jest.mock('react-datepicker', () => {
  const MockDatePicker = ({
    selected,
    onChange,
    placeholderText,
    className,
    isClearable,
  }: {
    selected?: Date | null;
    onChange: (date: Date | null) => void;
    placeholderText?: string;
    className?: string;
    isClearable?: boolean;
  }) => (
    <span>
      <input
        aria-label={placeholderText}
        placeholder={placeholderText}
        className={className}
        value={selected ? selected.toISOString().slice(0, 10) : ''}
        onChange={event => {
          onChange(event.currentTarget.value ? new Date(`${event.currentTarget.value}T00:00:00`) : null);
        }}
      />
      {isClearable ? (
        <button type="button" aria-label={`clear ${placeholderText}`} onClick={() => onChange(null)}>
          clear date
        </button>
      ) : null}
    </span>
  );

  return { __esModule: true, default: MockDatePicker };
});

type Props = React.ComponentProps<typeof AdminContentPostMetadataTab>;

const post: AdminContentPostItem = {
  locale: 'en',
  id: 'captain-tsubasa',
  title: 'Captain Tsubasa',
  summary: 'A football story',
  content: 'Post content',
  contentMode: 'markdown',
  thumbnail: '/images/captain.webp',
  source: 'blog',
  publishedDate: '2026-02-26',
  updatedDate: '2026-02-27',
  categoryId: 'gaming',
  categoryName: 'Gaming',
  topicIds: ['sports'],
  topicNames: ['Sports'],
  readingTimeMin: 4,
  status: 'PUBLISHED',
  scheduledAt: null,
  contentUpdatedAt: null,
  updatedAt: null,
  revisionCount: 2,
  latestRevisionAt: '2026-02-28T12:00:00.000Z',
  viewCount: 1400,
  likeCount: 40,
  commentCount: 3,
};

const revision: AdminContentPostRevisionItem = {
  id: 'revision-2',
  locale: 'en',
  postId: post.id,
  revisionNumber: 2,
  title: 'Updated post title',
  summary: 'Revision summary',
  content: 'Older content',
  contentMode: 'markdown',
  thumbnail: null,
  publishedDate: '2026-02-26',
  updatedDate: '2026-02-27',
  categoryId: 'gaming',
  categoryName: 'Gaming',
  topicIds: ['sports'],
  topicNames: ['Sports'],
  readingTimeMin: 4,
  status: 'SCHEDULED',
  scheduledAt: '2026-03-01T08:30:00.000Z',
  createdAt: '2026-02-28T12:00:00.000Z',
};

const category: AdminContentCategoryItem = {
  locale: 'en',
  id: 'gaming',
  name: 'Gaming',
  color: '#e11d48',
  icon: 'gamepad',
  link: null,
  updatedAt: null,
};

const topic: AdminContentTopicItem = {
  locale: 'en',
  id: 'sports',
  name: 'Sports',
  color: '#0ea5e9',
  link: null,
  updatedAt: null,
};

const mediaItem: AdminMediaLibraryItem = {
  id: 'media-1',
  kind: 'UPLOADED',
  name: 'captain.webp',
  value: '/images/captain.webp',
  previewUrl: '/images/captain.webp',
  contentType: 'image/webp',
  sizeBytes: 1024,
  width: 1200,
  height: 630,
  usageCount: 2,
  createdAt: '2026-02-20T12:00:00.000Z',
  updatedAt: null,
};

const translate: Props['t'] = (key, options) => {
  const values = Object.entries(options ?? {})
    .filter(([option]) => option !== 'ns')
    .map(([, value]) => String(value));
  return values.length > 0 ? `${key}: ${values.join(', ')}` : key;
};

const makeProps = (overrides: Partial<Props> = {}): Props => ({
  t: translate,
  routeLocale: 'en',
  editingPost: post,
  formatCount: value => `${value} formatted`,
  formatDateTime: value => `date:${value}`,
  postEditorSeoPreview: {
    title: 'SEO title',
    description: 'SEO description',
    canonicalURL: 'https://example.test/en/posts/captain-tsubasa',
    previewImageSrc: '/images/seo.webp',
    domainLabel: 'example.test',
    creatorLabel: '@creator',
    authorLabel: 'Author Name',
  },
  postSeoPreviewTab: 'openGraph',
  onPostSeoPreviewTabChange: jest.fn(),
  imageLoader: ({ src }) => src,
  postEditorTitle: 'Captain Tsubasa',
  onPostEditorTitleChange: jest.fn(),
  postEditorSummary: 'A football story',
  onPostEditorSummaryChange: jest.fn(),
  postEditorPublishedDate: '2026-02-26',
  onPostEditorPublishedDateChange: jest.fn(),
  postEditorUpdatedDate: '2026-02-27',
  onPostEditorUpdatedDateChange: jest.fn(),
  parseISODateInput: value => (value ? new Date(`${value}T00:00:00`) : null),
  datePickerLocaleConfig: {} as Props['datePickerLocaleConfig'],
  postEditorStatus: 'PUBLISHED',
  onPostEditorStatusChange: jest.fn(),
  postEditorScheduledAt: '',
  onPostEditorScheduledAtChange: jest.fn(),
  toDateTimeLocalInputValue: value => value,
  fromDateTimeLocalInputValue: value => (value ? new Date(value).toISOString() : null),
  resolvePostLifecycleBadgeVariant: status => status.toLowerCase(),
  postEditorThumbnail: '/images/captain.webp',
  onPostEditorThumbnailChange: jest.fn(),
  resolveThumbnailSrc: value => value,
  onOpenMediaLibrary: jest.fn(),
  onClearPostEditorThumbnail: jest.fn(),
  selectedMediaLibraryItem: mediaItem,
  postEditorCategoryID: 'gaming',
  onPostEditorCategoryIDChange: jest.fn(),
  postEditorCategoryOptions: [category],
  postEditorTopicQuery: 'sport',
  onPostEditorTopicQueryChange: jest.fn(),
  onClearPostEditorTopicQuery: jest.fn(),
  postEditorTopicOptions: [topic],
  postEditorTopicIDs: ['sports'],
  onPostTopicToggle: jest.fn(),
  getTaxonomyKey: item => `${item.locale}:${item.id}`,
  postRevisionsErrorMessage: '',
  isPostRevisionsLoading: false,
  postRevisions: [],
  postRevisionsTotal: 0,
  postRevisionsPage: 1,
  totalPostRevisionPages: 1,
  postRevisionsPageSize: 10,
  onPostRevisionsPageChange: jest.fn(),
  onPostRevisionsPageSizeChange: jest.fn(),
  onOpenRestoreRevision: jest.fn(),
  ...overrides,
});

describe('AdminContentPostMetadataTab', () => {
  it('renders analytics and switches SEO preview tabs', () => {
    const props = makeProps();
    const { rerender } = render(<AdminContentPostMetadataTab {...props} />);

    expect(screen.getByText('1400')).toBeInTheDocument();
    expect(screen.getByText('40 formatted')).toBeInTheDocument();
    expect(screen.getByText('3 formatted')).toBeInTheDocument();
    expect(screen.getByText('example.test')).toBeInTheDocument();
    expect(screen.getByText('SEO title')).toBeInTheDocument();
    expect(screen.getByAltText('SEO title')).toHaveAttribute('src', '/images/seo.webp');

    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.modals.post.seo.twitterTitle' }));

    expect(props.onPostSeoPreviewTabChange).toHaveBeenCalledWith('twitter');
    rerender(<AdminContentPostMetadataTab {...props} postSeoPreviewTab="twitter" />);
    expect(
      screen.getByText(
        'adminAccount.content.modals.post.seo.canonicalLabel: https://example.test/en/posts/captain-tsubasa',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.modals.post.seo.creatorLabel: @creator')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.modals.post.seo.authorLabel: Author Name')).toBeInTheDocument();
  });

  it('updates metadata, schedule, taxonomy, and thumbnail controls', () => {
    const formatDateTime = jest.fn(value => `date:${value}`);
    const props = makeProps({
      formatDateTime,
      postEditorStatus: 'DRAFT',
      postEditorScheduledAt: '2026-03-01T08:30',
    });
    const { rerender } = render(<AdminContentPostMetadataTab {...props} />);

    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.post.metadataFields.title'), {
      target: { value: 'New title' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.post.metadataFields.summary'), {
      target: { value: 'New summary' },
    });
    expect(props.onPostEditorTitleChange).toHaveBeenCalledWith('New title');
    expect(props.onPostEditorSummaryChange).toHaveBeenCalledWith('New summary');

    const dateInputs = screen.getAllByLabelText('adminAccount.content.modals.post.metadataFields.publishedDate');
    fireEvent.change(dateInputs[0], { target: { value: '2026-03-05' } });
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.post.metadataFields.updatedDate'), {
      target: { value: '2026-03-06' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'clear adminAccount.content.modals.post.metadataFields.updatedDate' }),
    );
    expect(props.onPostEditorPublishedDateChange).toHaveBeenCalledWith('2026-03-05');
    expect(props.onPostEditorUpdatedDateChange).toHaveBeenNthCalledWith(1, '2026-03-06');
    expect(props.onPostEditorUpdatedDateChange).toHaveBeenLastCalledWith('');

    const statusSelect = screen.getByLabelText('adminAccount.content.modals.post.lifecycle.statusLabel');
    expect(screen.getByLabelText('adminAccount.content.modals.post.lifecycle.scheduledAtLabel')).toBeDisabled();
    expect(screen.getByText('adminAccount.content.modals.post.lifecycle.scheduledAtDisabledHint')).toBeInTheDocument();
    fireEvent.change(statusSelect, { target: { value: 'SCHEDULED' } });
    expect(props.onPostEditorStatusChange).toHaveBeenCalledWith('SCHEDULED');
    rerender(<AdminContentPostMetadataTab {...props} postEditorStatus="SCHEDULED" />);
    expect(
      screen.getByText(/^adminAccount\.content\.modals\.post\.lifecycle\.scheduledFor: date:/),
    ).toBeInTheDocument();
    expect(formatDateTime).toHaveBeenCalledWith('2026-02-28T12:00:00.000Z');
    expect(formatDateTime).toHaveBeenCalledWith('2026-03-01T08:30');
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.post.lifecycle.scheduledAtLabel'), {
      target: { value: '2026-03-02T10:15' },
    });
    expect(props.onPostEditorScheduledAtChange).toHaveBeenCalledWith(expect.stringMatching(/^2026-03-02T.*\.000Z$/));

    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.modals.post.media.openLibrary' }));
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.modals.post.media.clear' }));
    expect(props.onOpenMediaLibrary).toHaveBeenCalledTimes(1);
    expect(props.onClearPostEditorThumbnail).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/captain\.webp.*media\.usedIn: 2/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.post.metadataFields.thumbnail'), {
      target: { value: '/images/updated.webp' },
    });
    expect(props.onPostEditorThumbnailChange).toHaveBeenCalledWith('/images/updated.webp');

    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.post.category'), {
      target: { value: 'gaming' },
    });
    fireEvent.change(screen.getByPlaceholderText('adminAccount.content.modals.post.topicsQueryPlaceholder'), {
      target: { value: 'football' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.modals.post.topics' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sports' }));

    expect(props.onPostEditorCategoryIDChange).toHaveBeenCalledWith('gaming');
    expect(props.onPostEditorTopicQueryChange).toHaveBeenCalledWith('football');
    expect(props.onClearPostEditorTopicQuery).toHaveBeenCalledTimes(1);
    expect(props.onPostTopicToggle).toHaveBeenCalledWith('sports', false);
  });

  it('shows empty previews and topics when their data is not available', () => {
    const props = makeProps({
      postEditorSeoPreview: null,
      postEditorThumbnail: '',
      selectedMediaLibraryItem: { ...mediaItem, usageCount: 0 },
      postEditorTopicQuery: '',
      postEditorTopicOptions: [],
      postEditorTopicIDs: [],
      editingPost: { ...post, latestRevisionAt: null },
    });
    const { rerender } = render(<AdminContentPostMetadataTab {...props} />);

    expect(screen.queryByText('SEO title')).not.toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.modals.post.topicsEmpty')).toBeInTheDocument();
    expect(screen.getByText('captain.webp')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'adminAccount.content.modals.post.media.clear' })).toBeDisabled();
    expect(screen.getByText('adminAccount.content.modals.post.lifecycle.revisionSummary: 2')).toBeInTheDocument();
    rerender(<AdminContentPostMetadataTab {...props} selectedMediaLibraryItem={null} />);
    expect(screen.getByText('adminAccount.content.modals.post.media.hint')).toBeInTheDocument();
  });

  it('renders revision loading, error, empty, populated, restore, and pagination states', () => {
    const formatDateTime = jest.fn(value => `date:${value}`);
    const props = makeProps({
      formatDateTime,
      isPostRevisionsLoading: true,
      postRevisionsErrorMessage: 'Revision load failed',
    });
    const { rerender } = render(<AdminContentPostMetadataTab {...props} />);

    expect(screen.getByText('Revision load failed')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.modals.post.revisions.loading')).toBeInTheDocument();

    rerender(<AdminContentPostMetadataTab {...props} isPostRevisionsLoading={false} postRevisions={[]} />);
    expect(screen.getByText('adminAccount.content.modals.post.revisions.empty')).toBeInTheDocument();

    const olderRevision: AdminContentPostRevisionItem = {
      ...revision,
      id: 'revision-1',
      revisionNumber: 1,
      title: 'Earlier revision',
      summary: null,
      updatedDate: null,
      scheduledAt: null,
      status: 'DRAFT',
    };
    rerender(
      <AdminContentPostMetadataTab
        {...props}
        isPostRevisionsLoading={false}
        postRevisions={[revision, olderRevision]}
        postRevisionsTotal={22}
        postRevisionsPage={2}
        totalPostRevisionPages={3}
      />,
    );

    expect(screen.getByText('Updated post title')).toBeInTheDocument();
    expect(screen.getByText('Revision summary')).toBeInTheDocument();
    expect(screen.getByText('Earlier revision')).toBeInTheDocument();
    expect(
      screen.getAllByText('adminAccount.content.modals.post.revisions.createdAt: date:2026-02-28T12:00:00.000Z'),
    ).toHaveLength(2);
    expect(formatDateTime).toHaveBeenCalledWith('2026-03-01T08:30:00.000Z');
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.content.modals.post.revisions.restore' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'next revision page' }));
    fireEvent.click(screen.getByRole('button', { name: 'increase revision page size' }));

    expect(props.onOpenRestoreRevision).toHaveBeenCalledWith(revision);
    expect(props.onPostRevisionsPageChange).toHaveBeenCalledWith(3);
    expect(props.onPostRevisionsPageSizeChange).toHaveBeenCalledWith(20);
  });
});
