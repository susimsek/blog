import { act, renderHook, waitFor } from '@testing-library/react';
import type { TFunction } from 'i18next';
import {
  deleteAdminMediaAsset,
  fetchAdminMediaLibrary,
  isAdminSessionError,
  replaceAdminMediaAsset,
  resolveAdminError,
  uploadAdminMediaAsset,
  type AdminMediaLibraryItem,
} from '@/lib/adminApi';
import { useAdminContentMediaSection } from '@/hooks/admin-content/useAdminContentMediaSection';

jest.mock('@/lib/adminApi', () => ({
  deleteAdminMediaAsset: jest.fn(),
  fetchAdminMediaLibrary: jest.fn(),
  isAdminSessionError: jest.fn(),
  replaceAdminMediaAsset: jest.fn(),
  resolveAdminError: jest.fn(),
  uploadAdminMediaAsset: jest.fn(),
}));

const uploaded: AdminMediaLibraryItem = {
  id: 'asset-1',
  kind: 'UPLOADED',
  name: 'cover.png',
  value: '/api/media/asset-1',
  previewUrl: '/preview.png',
  contentType: 'image/png',
  width: 640,
  height: 480,
  sizeBytes: 1200,
  usageCount: 1,
  createdAt: null,
  updatedAt: null,
};
const reference: AdminMediaLibraryItem = { ...uploaded, id: 'reference-1', kind: 'REFERENCE', name: 'old-cover.png' };
const t = ((key: string) => key) as TFunction;
const onSessionExpired = jest.fn();
const setSuccessMessage = jest.fn();
const onMediaValueDeleted = jest.fn();
const mediaPayload = (items = [uploaded]) => ({ items, total: items.length, page: 1, size: 10 });
const renderMedia = (activeTab: 'posts' | 'topics' | 'categories' | 'media' = 'media', isPostDetailRoute = false) =>
  renderHook(() =>
    useAdminContentMediaSection({
      activeTab,
      isPostDetailRoute,
      routeLocale: 'tr',
      onSessionExpired,
      t,
      setSuccessMessage,
      onMediaValueDeleted,
    }),
  );

describe('useAdminContentMediaSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchAdminMediaLibrary).mockResolvedValue(mediaPayload());
    jest.mocked(uploadAdminMediaAsset).mockResolvedValue(uploaded);
    jest.mocked(replaceAdminMediaAsset).mockResolvedValue({ ...uploaded, name: 'new-cover.png' });
    jest.mocked(deleteAdminMediaAsset).mockResolvedValue(true);
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: 'Request failed' });
  });

  it('loads and filters the media library only when the media tab is active', async () => {
    const inactive = renderMedia('posts');
    expect(fetchAdminMediaLibrary).not.toHaveBeenCalled();
    inactive.unmount();
    const detail = renderMedia('media', true);
    expect(fetchAdminMediaLibrary).not.toHaveBeenCalled();
    detail.unmount();

    const { result } = renderMedia();
    await waitFor(() => expect(result.current.mediaLibraryItems).toEqual([uploaded]));
    expect(fetchAdminMediaLibrary).toHaveBeenCalledWith({ query: '', kind: 'ALL', sort: 'RECENT', page: 1, size: 10 });
    act(() => {
      result.current.setMediaLibraryQuery('  logo  ');
      result.current.setMediaLibraryFilter('UPLOADED');
      result.current.setMediaLibrarySort('NAME');
    });
    await waitFor(() =>
      expect(fetchAdminMediaLibrary).toHaveBeenLastCalledWith({
        query: '  logo  ',
        kind: 'UPLOADED',
        sort: 'NAME',
        page: 1,
        size: 10,
      }),
    );
  });

  it('uploads a file and opens the localized media library', async () => {
    const { result } = renderMedia();
    await waitFor(() => expect(result.current.mediaLibraryItems).toEqual([uploaded]));
    const file = new File(['image-data'], 'new.png', { type: 'image/png' });
    await act(async () => result.current.handleMediaUpload(file));
    expect(uploadAdminMediaAsset).toHaveBeenCalledWith({
      fileName: 'new.png',
      dataUrl: expect.stringMatching(/^data:/),
    });
    expect(setSuccessMessage).toHaveBeenCalledWith('adminAccount.content.success.mediaUploaded');
    expect(result.current.isMediaLibraryUploading).toBe(false);

    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    act(() => result.current.openMediaLibraryScreen());
    expect(open).toHaveBeenCalledWith('/admin/settings/content#media', '_blank', 'noopener,noreferrer');
    open.mockRestore();
  });

  it('reports invalid upload data and session-expired upload errors', async () => {
    const { result } = renderMedia();
    await waitFor(() => expect(result.current.mediaLibraryItems).toEqual([uploaded]));
    const file = new File(['image-data'], 'bad.png', { type: 'image/png' });
    const readFile = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
      this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
    });
    await act(async () => result.current.handleMediaUpload(file));
    expect(uploadAdminMediaAsset).not.toHaveBeenCalled();
    expect(result.current.mediaLibraryErrorMessage).toBe('Request failed');
    readFile.mockRestore();

    jest.mocked(isAdminSessionError).mockReturnValue(true);
    jest.mocked(uploadAdminMediaAsset).mockRejectedValue(new Error('expired'));
    await act(async () => result.current.handleMediaUpload(file));
    expect(onSessionExpired).toHaveBeenCalled();
    expect(result.current.isMediaLibraryUploading).toBe(false);
  });

  it('rejects an empty FileReader result and safely ignores missing delete or reference replace targets', async () => {
    const { result } = renderMedia();
    await waitFor(() => expect(result.current.mediaLibraryItems).toEqual([uploaded]));
    const file = new File(['image-data'], 'empty.png', { type: 'image/png' });
    const readFile = jest.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
      Object.defineProperty(this, 'result', { configurable: true, value: '  ' });
      this.onload?.(new ProgressEvent('load') as ProgressEvent<FileReader>);
    });
    await act(async () => result.current.handleMediaUpload(file));
    expect(uploadAdminMediaAsset).not.toHaveBeenCalled();
    expect(result.current.mediaLibraryErrorMessage).toBe('Request failed');
    readFile.mockRestore();

    await act(async () => result.current.handleDeleteMediaAsset());
    expect(deleteAdminMediaAsset).not.toHaveBeenCalled();
    await act(async () => result.current.handleReplaceMediaAsset(reference, file));
    expect(replaceAdminMediaAsset).not.toHaveBeenCalled();

    jest.mocked(replaceAdminMediaAsset).mockRejectedValue(new Error('replace failed'));
    await act(async () => result.current.handleReplaceMediaAsset(uploaded, file));
    expect(result.current.mediaLibraryErrorMessage).toBe('Request failed');
    expect(result.current.replacingMediaAssetID).toBe('');
  });

  it('copies paths and reports unavailable or failing clipboard access', async () => {
    const { result } = renderMedia();
    await waitFor(() => expect(result.current.mediaLibraryItems).toEqual([uploaded]));
    const originalDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    await act(async () => result.current.handleCopyMediaPath(uploaded));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(uploaded.value);
    expect(result.current.copiedMediaAssetID).toBe(uploaded.id);
    expect(setSuccessMessage).toHaveBeenCalledWith('adminAccount.content.success.mediaCopied');

    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    await act(async () => result.current.handleCopyMediaPath(uploaded));
    expect(result.current.mediaLibraryErrorMessage).toBe('adminAccount.content.errors.mediaLibraryCopy');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockRejectedValue(new Error('clipboard failed')) },
    });
    await act(async () => result.current.handleCopyMediaPath(uploaded));
    expect(result.current.mediaLibraryErrorMessage).toBe('adminAccount.content.errors.mediaLibraryCopy');
    if (originalDescriptor) {
      Object.defineProperty(navigator, 'clipboard', originalDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'clipboard');
    }
  });

  it('deletes assets and updates the deleted value and page state', async () => {
    const { result } = renderMedia();
    await waitFor(() => expect(result.current.mediaLibraryItems).toEqual([uploaded]));
    act(() => result.current.setPendingMediaAssetDelete(uploaded));
    await act(async () => result.current.handleDeleteMediaAsset());
    expect(deleteAdminMediaAsset).toHaveBeenCalledWith(uploaded.id);
    expect(onMediaValueDeleted).toHaveBeenCalledWith(uploaded.value);
    expect(result.current.pendingMediaAssetDelete).toBeNull();
    expect(setSuccessMessage).toHaveBeenCalledWith('adminAccount.content.success.mediaDeleted');

    jest.mocked(deleteAdminMediaAsset).mockResolvedValue(false);
    act(() => result.current.setPendingMediaAssetDelete(uploaded));
    await act(async () => result.current.handleDeleteMediaAsset());
    expect(result.current.mediaLibraryErrorMessage).toBe('Request failed');
    expect(result.current.isMediaAssetDeleting).toBe(false);
  });

  it('replaces uploaded assets and ignores references or missing pending targets', async () => {
    const { result } = renderMedia();
    await waitFor(() => expect(result.current.mediaLibraryItems).toEqual([uploaded]));
    const input = document.createElement('input');
    const click = jest.spyOn(input, 'click');
    result.current.mediaReplaceInputRef.current = input;

    act(() => result.current.handleTriggerReplaceMediaAsset(reference));
    expect(click).not.toHaveBeenCalled();
    act(() => result.current.handleTriggerReplaceMediaAsset(uploaded));
    expect(click).toHaveBeenCalledTimes(1);

    const file = new File(['updated'], 'replacement.png', { type: 'image/png' });
    await act(async () => result.current.handleReplaceMediaFileChange(file));
    expect(replaceAdminMediaAsset).toHaveBeenCalledWith({
      id: uploaded.id,
      fileName: file.name,
      dataUrl: expect.stringMatching(/^data:/),
    });
    expect(setSuccessMessage).toHaveBeenCalledWith('adminAccount.content.success.mediaReplaced');
    expect(result.current.replacingMediaAssetID).toBe('');

    await act(async () => result.current.handleReplaceMediaFileChange(file));
    expect(replaceAdminMediaAsset).toHaveBeenCalledTimes(1);
  });

  it('returns to the first page after deleting or uploading from a later page', async () => {
    jest.mocked(fetchAdminMediaLibrary).mockImplementation(async filter => ({
      items: [uploaded],
      total: 11,
      page: filter?.page ?? 1,
      size: filter?.size ?? 10,
    }));
    const { result } = renderMedia();
    await waitFor(() => expect(result.current.mediaLibraryItems).toEqual([uploaded]));

    act(() => result.current.setMediaLibraryPage(2));
    await waitFor(() => expect(result.current.mediaLibraryPage).toBe(2));
    act(() => result.current.setPendingMediaAssetDelete(uploaded));
    await act(async () => result.current.handleDeleteMediaAsset());
    await waitFor(() => expect(result.current.mediaLibraryPage).toBe(1));

    act(() => result.current.setMediaLibraryPage(2));
    await waitFor(() => expect(result.current.mediaLibraryPage).toBe(2));
    const file = new File(['image-data'], 'new.png', { type: 'image/png' });
    await act(async () => result.current.handleMediaUpload(file));
    await waitFor(() => expect(result.current.mediaLibraryPage).toBe(1));
  });

  it('routes media library, delete and replace session errors to the expiry handler', async () => {
    jest.mocked(fetchAdminMediaLibrary).mockRejectedValue(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    const loadFailure = renderMedia();
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(1));
    loadFailure.unmount();

    jest.mocked(fetchAdminMediaLibrary).mockResolvedValue(mediaPayload());
    const { result } = renderMedia();
    await waitFor(() => expect(result.current.mediaLibraryItems).toEqual([uploaded]));
    jest.mocked(deleteAdminMediaAsset).mockRejectedValueOnce(new Error('expired'));
    act(() => result.current.setPendingMediaAssetDelete(uploaded));
    await act(async () => result.current.handleDeleteMediaAsset());
    expect(onSessionExpired).toHaveBeenCalledTimes(2);

    const file = new File(['image-data'], 'replacement.png', { type: 'image/png' });
    jest.mocked(replaceAdminMediaAsset).mockRejectedValueOnce(new Error('expired'));
    await act(async () => result.current.handleReplaceMediaAsset(uploaded, file));
    expect(onSessionExpired).toHaveBeenCalledTimes(3);
    expect(result.current.replacingMediaAssetID).toBe('');
  });
});
