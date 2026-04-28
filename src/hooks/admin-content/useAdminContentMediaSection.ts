'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import {
  deleteAdminMediaAsset,
  fetchAdminMediaLibrary,
  isAdminSessionError,
  replaceAdminMediaAsset,
  resolveAdminError,
  uploadAdminMediaAsset,
  type AdminMediaLibraryItem,
  type AdminMediaLibrarySort,
} from '@/lib/adminApi';
import { ADMIN_ROUTES, withAdminLocalePath } from '@/lib/adminRoutes';

type ContentSectionTab = 'posts' | 'topics' | 'categories' | 'media';
type MediaLibraryFilterValue = AdminMediaLibraryItem['kind'] | 'ALL';
type MediaLibrarySortValue = AdminMediaLibrarySort;

const MEDIA_LIBRARY_DEFAULT_PAGE_SIZE = 10;

const fileToDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string' && reader.result.trim() !== '') {
        resolve(reader.result);
        return;
      }
      reject(new Error('invalid media file'));
    };
    reader.onerror = () => reject(new Error('invalid media file'));
    reader.readAsDataURL(file);
  });

type UseAdminContentMediaSectionParams = {
  activeTab: ContentSectionTab;
  isPostDetailRoute: boolean;
  routeLocale: string;
  onSessionExpired: () => void;
  t: TFunction;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string>>;
  onMediaValueDeleted: (value: string) => void;
};

export function useAdminContentMediaSection({
  activeTab,
  isPostDetailRoute,
  routeLocale,
  onSessionExpired,
  t,
  setSuccessMessage,
  onMediaValueDeleted,
}: UseAdminContentMediaSectionParams) {
  const [mediaLibraryQuery, setMediaLibraryQuery] = React.useState('');
  const [mediaLibraryFilter, setMediaLibraryFilter] = React.useState<MediaLibraryFilterValue>('ALL');
  const [mediaLibrarySort, setMediaLibrarySort] = React.useState<MediaLibrarySortValue>('RECENT');
  const [mediaLibraryItems, setMediaLibraryItems] = React.useState<AdminMediaLibraryItem[]>([]);
  const [mediaLibraryPage, setMediaLibraryPage] = React.useState(1);
  const [mediaLibraryPageSize, setMediaLibraryPageSize] = React.useState(MEDIA_LIBRARY_DEFAULT_PAGE_SIZE);
  const [mediaLibraryTotal, setMediaLibraryTotal] = React.useState(0);
  const [isMediaLibraryLoading, setIsMediaLibraryLoading] = React.useState(false);
  const [isMediaLibraryUploading, setIsMediaLibraryUploading] = React.useState(false);
  const [mediaLibraryErrorMessage, setMediaLibraryErrorMessage] = React.useState('');
  const [copiedMediaAssetID, setCopiedMediaAssetID] = React.useState('');
  const [pendingMediaAssetDelete, setPendingMediaAssetDelete] = React.useState<AdminMediaLibraryItem | null>(null);
  const [isMediaAssetDeleting, setIsMediaAssetDeleting] = React.useState(false);
  const [replacingMediaAssetID, setReplacingMediaAssetID] = React.useState('');

  const mediaUploadInputRef = React.useRef<HTMLInputElement | null>(null);
  const mediaReplaceInputRef = React.useRef<HTMLInputElement | null>(null);
  const pendingMediaAssetReplaceRef = React.useRef<AdminMediaLibraryItem | null>(null);
  const mediaLibraryRequestIDRef = React.useRef(0);
  const deferredMediaLibraryQuery = React.useDeferredValue(mediaLibraryQuery);

  const totalMediaLibraryPages = Math.max(1, Math.ceil(mediaLibraryTotal / mediaLibraryPageSize));

  useAutoClearValue(copiedMediaAssetID, setCopiedMediaAssetID, 2000);

  const loadMediaLibrary = React.useCallback(
    async (nextPage = mediaLibraryPage, nextSize = mediaLibraryPageSize) => {
      if (isPostDetailRoute || activeTab !== 'media') {
        return;
      }

      const requestID = mediaLibraryRequestIDRef.current + 1;
      mediaLibraryRequestIDRef.current = requestID;
      setIsMediaLibraryLoading(true);
      setMediaLibraryErrorMessage('');

      try {
        const payload = await fetchAdminMediaLibrary({
          query: deferredMediaLibraryQuery,
          kind: mediaLibraryFilter,
          sort: mediaLibrarySort,
          page: nextPage,
          size: nextSize,
        });
        if (requestID !== mediaLibraryRequestIDRef.current) {
          return;
        }
        setMediaLibraryItems(payload.items);
        setMediaLibraryTotal(payload.total);
        setMediaLibraryPage(payload.page);
        setMediaLibraryPageSize(payload.size);
      } catch (error) {
        if (requestID !== mediaLibraryRequestIDRef.current) {
          return;
        }
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setMediaLibraryErrorMessage(
          resolvedError.message || t('adminAccount.content.errors.mediaLibraryLoad', { ns: 'admin-account' }),
        );
      } finally {
        if (requestID === mediaLibraryRequestIDRef.current) {
          setIsMediaLibraryLoading(false);
        }
      }
    },
    [
      activeTab,
      deferredMediaLibraryQuery,
      isPostDetailRoute,
      mediaLibraryFilter,
      mediaLibraryPage,
      mediaLibraryPageSize,
      mediaLibrarySort,
      onSessionExpired,
      t,
    ],
  );

  React.useEffect(() => {
    void loadMediaLibrary();
  }, [loadMediaLibrary]);

  const handleMediaUpload = React.useCallback(
    async (file: File) => {
      if (isMediaLibraryUploading) {
        return;
      }

      setIsMediaLibraryUploading(true);
      setMediaLibraryErrorMessage('');
      try {
        const dataUrl = await fileToDataURL(file);
        const uploaded = await uploadAdminMediaAsset({
          fileName: file.name,
          dataUrl,
        });
        setSuccessMessage(
          t('adminAccount.content.success.mediaUploaded', {
            ns: 'admin-account',
            name: uploaded.name,
          }),
        );
        if (mediaLibraryPage !== 1) {
          setMediaLibraryPage(1);
        } else {
          await loadMediaLibrary(1, mediaLibraryPageSize);
        }
      } catch (error) {
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setMediaLibraryErrorMessage(
          resolvedError.message || t('adminAccount.content.errors.mediaLibraryUpload', { ns: 'admin-account' }),
        );
      } finally {
        setIsMediaLibraryUploading(false);
        if (mediaUploadInputRef.current) {
          mediaUploadInputRef.current.value = '';
        }
      }
    },
    [
      isMediaLibraryUploading,
      loadMediaLibrary,
      mediaLibraryPage,
      mediaLibraryPageSize,
      onSessionExpired,
      setSuccessMessage,
      t,
    ],
  );

  const openMediaLibraryScreen = React.useCallback(() => {
    const href = withAdminLocalePath(routeLocale, `${ADMIN_ROUTES.settings.content}#media`);
    globalThis.window?.open(href, '_blank', 'noopener,noreferrer');
  }, [routeLocale]);

  const handleCopyMediaPath = React.useCallback(
    async (item: AdminMediaLibraryItem) => {
      if (!globalThis.navigator?.clipboard) {
        setMediaLibraryErrorMessage(t('adminAccount.content.errors.mediaLibraryCopy', { ns: 'admin-account' }));
        return;
      }

      try {
        await globalThis.navigator.clipboard.writeText(item.value);
        setCopiedMediaAssetID(item.id);
        setMediaLibraryErrorMessage('');
        setSuccessMessage(
          t('adminAccount.content.success.mediaCopied', {
            ns: 'admin-account',
            name: item.name,
          }),
        );
      } catch {
        setMediaLibraryErrorMessage(t('adminAccount.content.errors.mediaLibraryCopy', { ns: 'admin-account' }));
      }
    },
    [setSuccessMessage, t],
  );

  const handleDeleteMediaAsset = React.useCallback(async () => {
    if (!pendingMediaAssetDelete || isMediaAssetDeleting) {
      return;
    }

    setIsMediaAssetDeleting(true);
    setMediaLibraryErrorMessage('');
    setSuccessMessage('');
    try {
      const deleted = await deleteAdminMediaAsset(pendingMediaAssetDelete.id);
      if (!deleted) {
        throw new Error(t('adminAccount.content.errors.mediaLibraryDelete', { ns: 'admin-account' }));
      }

      onMediaValueDeleted(pendingMediaAssetDelete.value);
      setPendingMediaAssetDelete(null);

      const nextTotal = Math.max(mediaLibraryTotal - 1, 0);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / mediaLibraryPageSize));
      const nextPage = Math.min(mediaLibraryPage, nextTotalPages);
      if (nextPage === mediaLibraryPage) {
        await loadMediaLibrary(nextPage, mediaLibraryPageSize);
      } else {
        setMediaLibraryPage(nextPage);
      }

      setSuccessMessage(
        t('adminAccount.content.success.mediaDeleted', {
          ns: 'admin-account',
          name: pendingMediaAssetDelete.name,
        }),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setMediaLibraryErrorMessage(
        resolvedError.message || t('adminAccount.content.errors.mediaLibraryDelete', { ns: 'admin-account' }),
      );
    } finally {
      setIsMediaAssetDeleting(false);
    }
  }, [
    isMediaAssetDeleting,
    loadMediaLibrary,
    mediaLibraryPage,
    mediaLibraryPageSize,
    mediaLibraryTotal,
    onMediaValueDeleted,
    onSessionExpired,
    pendingMediaAssetDelete,
    setSuccessMessage,
    t,
  ]);

  const handleReplaceMediaAsset = React.useCallback(
    async (item: AdminMediaLibraryItem, file: File) => {
      if (item.kind !== 'UPLOADED' || replacingMediaAssetID.trim() !== '') {
        return;
      }

      setReplacingMediaAssetID(item.id);
      setMediaLibraryErrorMessage('');
      try {
        const dataUrl = await fileToDataURL(file);
        const replaced = await replaceAdminMediaAsset({
          id: item.id,
          fileName: file.name,
          dataUrl,
        });
        setSuccessMessage(
          t('adminAccount.content.success.mediaReplaced', {
            ns: 'admin-account',
            name: replaced.name,
          }),
        );
        await loadMediaLibrary(mediaLibraryPage, mediaLibraryPageSize);
      } catch (error) {
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setMediaLibraryErrorMessage(
          resolvedError.message || t('adminAccount.content.errors.mediaLibraryReplace', { ns: 'admin-account' }),
        );
      } finally {
        setReplacingMediaAssetID('');
        pendingMediaAssetReplaceRef.current = null;
        if (mediaReplaceInputRef.current) {
          mediaReplaceInputRef.current.value = '';
        }
      }
    },
    [
      loadMediaLibrary,
      mediaLibraryPage,
      mediaLibraryPageSize,
      onSessionExpired,
      replacingMediaAssetID,
      setSuccessMessage,
      t,
    ],
  );

  const handleTriggerReplaceMediaAsset = React.useCallback((item: AdminMediaLibraryItem) => {
    if (item.kind !== 'UPLOADED') {
      return;
    }
    pendingMediaAssetReplaceRef.current = item;
    mediaReplaceInputRef.current?.click();
  }, []);

  const handleReplaceMediaFileChange = React.useCallback(
    async (file: File) => {
      const pendingItem = pendingMediaAssetReplaceRef.current;
      if (!pendingItem) {
        if (mediaReplaceInputRef.current) {
          mediaReplaceInputRef.current.value = '';
        }
        return;
      }

      await handleReplaceMediaAsset(pendingItem, file);
    },
    [handleReplaceMediaAsset],
  );

  return {
    mediaLibraryQuery,
    setMediaLibraryQuery,
    mediaLibraryFilter,
    setMediaLibraryFilter,
    mediaLibrarySort,
    setMediaLibrarySort,
    mediaLibraryItems,
    mediaLibraryPage,
    setMediaLibraryPage,
    mediaLibraryPageSize,
    setMediaLibraryPageSize,
    mediaLibraryTotal,
    totalMediaLibraryPages,
    isMediaLibraryLoading,
    isMediaLibraryUploading,
    mediaLibraryErrorMessage,
    copiedMediaAssetID,
    pendingMediaAssetDelete,
    setPendingMediaAssetDelete,
    isMediaAssetDeleting,
    replacingMediaAssetID,
    mediaUploadInputRef,
    mediaReplaceInputRef,
    handleMediaUpload,
    handleReplaceMediaAsset,
    handleReplaceMediaFileChange,
    handleTriggerReplaceMediaAsset,
    handleCopyMediaPath,
    handleDeleteMediaAsset,
    openMediaLibraryScreen,
  };
}
