import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AdminContentMediaTab from '@/components/admin/content/AdminContentMediaTab';
import type { AdminMediaLibraryItem } from '@/lib/adminApi';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }: { icon: string }) => <span data-icon={icon} />,
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    loader: _loader,
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { loader?: unknown; unoptimized?: boolean }) => (
    <img {...props} alt={props.alt ?? ''} />
  ),
}));

jest.mock('@/components/admin/AdminLoadingState', () => ({
  __esModule: true,
  default: ({ ariaLabel }: { ariaLabel: string }) => <div role="status" aria-label={ariaLabel} />,
}));

jest.mock('@/components/common/PostDensityToggle', () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (mode: 'default' | 'editorial' | 'grid') => void }) => (
    <button onClick={() => onChange('grid')}>Grid density</button>
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

const translate = (key: string, options?: { value?: string; count?: number }) => {
  if (key === 'adminAccount.content.list.updatedAt') {
    return `${key}:${options?.value ?? ''}`;
  }
  if (key === 'adminAccount.content.modals.post.media.usedIn') {
    return `${key}:${options?.count ?? 0}`;
  }
  return key;
};

const makeMediaItem = (overrides: Partial<AdminMediaLibraryItem> = {}): AdminMediaLibraryItem => ({
  id: 'asset-1',
  kind: 'UPLOADED',
  name: 'Hero image',
  value: '/images/hero.webp',
  previewUrl: ' https://cdn.example.com/hero.webp ',
  contentType: 'image/webp',
  width: 1200,
  height: 630,
  sizeBytes: 2048,
  usageCount: 2,
  createdAt: '2026-02-26T03:00:00Z',
  updatedAt: '2026-02-27T03:00:00Z',
  ...overrides,
});

const props = () => {
  const uploaded = makeMediaItem();
  const replacing = makeMediaItem({
    id: 'asset-2',
    name: 'Replacing image',
    previewUrl: '',
    createdAt: null,
    updatedAt: null,
    width: null,
    height: null,
    sizeBytes: 0,
    usageCount: 0,
  });
  const reference = makeMediaItem({
    id: 'asset-3',
    kind: 'REFERENCE',
    name: 'Referenced image',
    value: '/external/referenced.webp',
    previewUrl: '',
    updatedAt: null,
    createdAt: '2026-02-25T03:00:00Z',
    width: null,
    height: null,
    sizeBytes: 0,
    usageCount: 0,
  });

  return {
    t: translate,
    formatDate: (value: string) => `date:${value}`,
    routeLocale: 'en',
    mediaLibraryQuery: 'hero',
    onMediaLibraryQueryChange: jest.fn(),
    onClearMediaLibraryQuery: jest.fn(),
    mediaLibraryFilter: 'ALL' as const,
    onMediaLibraryFilterChange: jest.fn(),
    mediaLibrarySort: 'RECENT' as const,
    onMediaLibrarySortChange: jest.fn(),
    isMediaLibraryUploading: false,
    onTriggerMediaUpload: jest.fn(),
    mediaUploadInputRef: React.createRef<HTMLInputElement>(),
    onUploadFileChange: jest.fn().mockResolvedValue(undefined),
    mediaReplaceInputRef: React.createRef<HTMLInputElement>(),
    onReplaceFileChange: jest.fn().mockResolvedValue(undefined),
    mediaLibraryErrorMessage: 'Upload failed',
    resolvedMediaDensityMode: 'default' as const,
    onMediaDensityModeChange: jest.fn(),
    isMediaLibraryLoading: false,
    mediaLibraryTotal: 3,
    mediaLibraryItems: [uploaded, replacing, reference],
    formatMediaSize: (size: number, locale: string) => `${locale}:${size}`,
    imageLoader: ({ src }: { src: string }) => `loaded:${src}`,
    copiedMediaAssetID: uploaded.id,
    replacingMediaAssetID: replacing.id,
    onCopyMediaPath: jest.fn().mockResolvedValue(undefined),
    onTriggerReplaceMediaAsset: jest.fn(),
    onOpenDeleteMediaAsset: jest.fn(),
    mediaLibraryPage: 1,
    totalMediaLibraryPages: 2,
    mediaLibraryPageSize: 10,
    onMediaLibraryPageChange: jest.fn(),
    onMediaLibraryPageSizeChange: jest.fn(),
  };
};

describe('AdminContentMediaTab', () => {
  it('renders media variants and supports filters, file selection, actions, and pagination', async () => {
    const viewProps = props();
    const { container } = render(<AdminContentMediaTab {...viewProps} />);

    expect(screen.getByText('Upload failed')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.list.updatedAt:date:2026-02-27T03:00:00Z')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.modals.post.media.usedIn:2')).toBeInTheDocument();
    expect(screen.getByText('1200×630')).toBeInTheDocument();
    expect(screen.getByText('en:2048')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.list.updatedAt:date:2026-02-25T03:00:00Z')).toBeInTheDocument();
    expect(container.querySelector('img[alt="Hero image"]')).toHaveAttribute(
      'src',
      'https://cdn.example.com/hero.webp',
    );
    expect(screen.getAllByRole('button', { name: 'adminAccount.content.media.actions.copied' })).toHaveLength(1);

    fireEvent.change(screen.getByLabelText('adminAccount.content.filters.query'), { target: { value: 'new query' } });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.modals.post.media.clearSearch' }));
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.post.media.filterLabel'), {
      target: { value: 'UPLOADED' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.post.media.sortLabel'), {
      target: { value: 'NAME' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.modals.post.media.upload' }));
    fireEvent.click(screen.getByRole('button', { name: 'Grid density' }));

    const file = new File(['media'], 'replacement.png', { type: 'image/png' });
    const fileInputs = container.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [file] } });
    fireEvent.change(fileInputs[1], { target: { files: [file] } });
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.content.media.actions.copied' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.content.media.actions.replace' })[1]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.content.media.actions.delete' })[0]);
    expect(screen.getAllByRole('button', { name: 'adminAccount.content.media.actions.replace' })[0]).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'adminAccount.content.media.actions.replace' })[1]).not.toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'adminAccount.content.media.actions.delete' })[1]).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }));
    fireEvent.click(screen.getByRole('button', { name: 'Change page size' }));

    await waitFor(() => {
      expect(viewProps.onUploadFileChange).toHaveBeenCalledWith(file);
      expect(viewProps.onReplaceFileChange).toHaveBeenCalledWith(file);
      expect(viewProps.onCopyMediaPath).toHaveBeenCalledWith(viewProps.mediaLibraryItems[0]);
    });
    expect(viewProps.onMediaLibraryQueryChange).toHaveBeenCalledWith('new query');
    expect(viewProps.onClearMediaLibraryQuery).toHaveBeenCalled();
    expect(viewProps.onMediaLibraryFilterChange).toHaveBeenCalledWith('UPLOADED');
    expect(viewProps.onMediaLibrarySortChange).toHaveBeenCalledWith('NAME');
    expect(viewProps.onTriggerMediaUpload).toHaveBeenCalled();
    expect(viewProps.onMediaDensityModeChange).toHaveBeenCalledWith('grid');
    expect(viewProps.onTriggerReplaceMediaAsset).toHaveBeenCalledWith(viewProps.mediaLibraryItems[1]);
    expect(viewProps.onOpenDeleteMediaAsset).toHaveBeenCalledWith(viewProps.mediaLibraryItems[0]);
    expect(viewProps.onMediaLibraryPageChange).toHaveBeenCalledWith(2);
    expect(viewProps.onMediaLibraryPageSizeChange).toHaveBeenCalledWith(20);
  });

  it('renders loading and empty states and ignores empty file selections', () => {
    const viewProps = props();
    const { container, rerender } = render(<AdminContentMediaTab {...viewProps} isMediaLibraryLoading />);
    expect(screen.getByRole('status', { name: 'adminAccount.content.media.loading' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next page' })).not.toBeInTheDocument();

    rerender(
      <AdminContentMediaTab
        {...viewProps}
        isMediaLibraryLoading={false}
        mediaLibraryTotal={0}
        mediaLibraryItems={[]}
      />,
    );
    expect(screen.getByText('adminAccount.content.modals.post.media.empty')).toBeInTheDocument();

    const fileInputs = container.querySelectorAll('input[type="file"]');
    fireEvent.change(fileInputs[0], { target: { files: [] } });
    fireEvent.change(fileInputs[1], { target: { files: [] } });
    expect(viewProps.onUploadFileChange).not.toHaveBeenCalled();
    expect(viewProps.onReplaceFileChange).not.toHaveBeenCalled();
  });
});
