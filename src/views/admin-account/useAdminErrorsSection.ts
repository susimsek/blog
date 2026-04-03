'use client';

import React from 'react';
import useDebounce from '@/hooks/useDebounce';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import {
  createAdminErrorMessage,
  deleteAdminErrorMessage,
  fetchAdminErrorMessages,
  isAdminSessionError,
  resolveAdminError,
  updateAdminErrorMessage,
  type AdminErrorMessageItem,
} from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type UseAdminErrorsSectionOptions = {
  isActive: boolean;
  hasAdminUser: boolean;
  t: AdminAccountTranslate;
  onSessionExpired: () => void;
  successMessageAutoHideMs: number;
};

const ERROR_MESSAGE_CODE_PATTERN = /^[A-Z0-9_]{2,120}$/;

const toAdminErrorMessageKey = (item: Pick<AdminErrorMessageItem, 'scope' | 'locale' | 'code'>) =>
  `${item.scope}|${item.locale}|${item.code}`;

const scrollRefIntoView = (target: HTMLDivElement | null) => {
  if (!target) {
    return;
  }

  const currentWindow = globalThis.window;
  const prefersReducedMotion = currentWindow?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  target.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });
};

export default function useAdminErrorsSection({
  isActive,
  hasAdminUser,
  t,
  onSessionExpired,
  successMessageAutoHideMs,
}: Readonly<UseAdminErrorsSectionOptions>) {
  const [errorMessages, setErrorMessages] = React.useState<AdminErrorMessageItem[]>([]);
  const [isErrorMessagesLoading, setIsErrorMessagesLoading] = React.useState(isActive);
  const [errorMessagesErrorMessage, setErrorMessagesErrorMessage] = React.useState('');
  const [errorMessagesSuccessMessage, setErrorMessagesSuccessMessage] = React.useState('');
  const [errorFilterLocale, setErrorFilterLocale] = React.useState<'all' | 'en' | 'tr'>('all');
  const [errorFilterQuery, setErrorFilterQuery] = React.useState('');
  const [errorCrudTab, setErrorCrudTab] = React.useState<'create' | 'update'>('update');
  const [isErrorEditorModalOpen, setIsErrorEditorModalOpen] = React.useState(false);
  const [selectedErrorMessageKey, setSelectedErrorMessageKey] = React.useState('');
  const [errorMessagesPage, setErrorMessagesPage] = React.useState(1);
  const [errorMessagesPageSize, setErrorMessagesPageSize] = React.useState(5);
  const [totalErrorMessages, setTotalErrorMessages] = React.useState(0);
  const [errorCreateLocale, setErrorCreateLocale] = React.useState<'en' | 'tr'>('en');
  const [errorCreateCode, setErrorCreateCode] = React.useState('');
  const [errorCreateMessage, setErrorCreateMessage] = React.useState('');
  const [isErrorCreateSubmitting, setIsErrorCreateSubmitting] = React.useState(false);
  const [errorUpdateMessage, setErrorUpdateMessage] = React.useState('');
  const [isErrorUpdateSubmitting, setIsErrorUpdateSubmitting] = React.useState(false);
  const [isErrorDeleteSubmitting, setIsErrorDeleteSubmitting] = React.useState(false);
  const [deletingErrorMessageKey, setDeletingErrorMessageKey] = React.useState('');
  const [pendingErrorMessageDelete, setPendingErrorMessageDelete] = React.useState<AdminErrorMessageItem | null>(null);

  const errorMessagesListTopRef = React.useRef<HTMLDivElement | null>(null);
  const selectedErrorMessageKeyRef = React.useRef('');
  const errorMessagesRequestIDRef = React.useRef(0);
  const errorFilterQueryDebounced = useDebounce(errorFilterQuery.trim(), 220);

  useAutoClearValue(errorMessagesSuccessMessage, setErrorMessagesSuccessMessage, successMessageAutoHideMs);

  React.useEffect(() => {
    selectedErrorMessageKeyRef.current = selectedErrorMessageKey;
  }, [selectedErrorMessageKey]);

  React.useEffect(() => {
    setErrorMessagesPage(1);
  }, [errorFilterLocale, errorFilterQueryDebounced]);

  const selectedErrorMessage = React.useMemo(
    () => errorMessages.find(item => toAdminErrorMessageKey(item) === selectedErrorMessageKey) ?? null,
    [errorMessages, selectedErrorMessageKey],
  );
  const totalErrorMessagePages = Math.max(1, Math.ceil(totalErrorMessages / errorMessagesPageSize));
  const normalizedErrorCreateCode = errorCreateCode.trim().toUpperCase();
  const normalizedErrorCreateMessage = errorCreateMessage.trim();
  const normalizedErrorUpdateMessage = errorUpdateMessage.trim();
  const isErrorCreateCodeValid = ERROR_MESSAGE_CODE_PATTERN.test(normalizedErrorCreateCode);
  const canCreateErrorMessage =
    normalizedErrorCreateCode !== '' &&
    isErrorCreateCodeValid &&
    normalizedErrorCreateMessage !== '' &&
    !isErrorCreateSubmitting;
  const canUpdateErrorMessage =
    selectedErrorMessage !== null &&
    normalizedErrorUpdateMessage !== '' &&
    normalizedErrorUpdateMessage !== selectedErrorMessage.message &&
    !isErrorUpdateSubmitting &&
    !isErrorDeleteSubmitting;

  const doesErrorMessageMatchFilters = React.useCallback(
    (item: Pick<AdminErrorMessageItem, 'scope' | 'locale' | 'code' | 'message'>) => {
      const normalizedLocale = item.locale.trim().toLowerCase();
      if (errorFilterLocale !== 'all' && normalizedLocale !== errorFilterLocale) {
        return false;
      }

      if (!errorFilterQueryDebounced) {
        return true;
      }

      const normalizedQuery = errorFilterQueryDebounced.toLowerCase();
      return [item.scope, item.locale, item.code, item.message].some(part =>
        part.trim().toLowerCase().includes(normalizedQuery),
      );
    },
    [errorFilterLocale, errorFilterQueryDebounced],
  );

  const loadAdminErrorMessages = React.useCallback(
    async (options?: { page?: number; preferredSelectedKey?: string }): Promise<AdminErrorMessageItem[]> => {
      if (!isActive || !hasAdminUser) {
        return [];
      }

      const requestedPage = options?.page && options.page > 0 ? options.page : errorMessagesPage;
      const requestID = errorMessagesRequestIDRef.current + 1;
      errorMessagesRequestIDRef.current = requestID;
      setIsErrorMessagesLoading(true);
      setErrorMessagesErrorMessage('');

      try {
        const payload = await fetchAdminErrorMessages({
          locale: errorFilterLocale === 'all' ? undefined : errorFilterLocale,
          query: errorFilterQueryDebounced,
          page: requestedPage,
          size: errorMessagesPageSize,
        });

        if (requestID !== errorMessagesRequestIDRef.current) {
          return [];
        }

        const items = payload.items ?? [];
        setErrorMessages(items);
        setTotalErrorMessages(payload.total ?? 0);

        const resolvedPage = payload.page > 0 ? payload.page : requestedPage;
        if (resolvedPage !== errorMessagesPage) {
          setErrorMessagesPage(resolvedPage);
        }

        if (payload.size > 0 && payload.size !== errorMessagesPageSize) {
          setErrorMessagesPageSize(payload.size);
        }

        const preferredSelectedKey = options?.preferredSelectedKey?.trim() ?? '';
        const currentSelectedKey = preferredSelectedKey || selectedErrorMessageKeyRef.current;
        const hasCurrentSelection = items.some(item => toAdminErrorMessageKey(item) === currentSelectedKey);
        const nextSelectedKey = hasCurrentSelection
          ? currentSelectedKey
          : items[0]
            ? toAdminErrorMessageKey(items[0])
            : '';
        setSelectedErrorMessageKey(nextSelectedKey);
        selectedErrorMessageKeyRef.current = nextSelectedKey;

        const nextSelectedItem = items.find(item => toAdminErrorMessageKey(item) === nextSelectedKey) ?? null;
        setErrorUpdateMessage((nextSelectedItem?.message ?? '').trim());
        setErrorMessagesErrorMessage('');
        return items;
      } catch (error) {
        if (requestID !== errorMessagesRequestIDRef.current) {
          return [];
        }
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return [];
        }
        const resolvedError = resolveAdminError(error);
        setErrorMessagesErrorMessage(
          resolvedError.kind === 'network'
            ? t('adminCommon.errors.network', { ns: 'admin-common' })
            : resolvedError.message || t('adminAccount.errorsCatalog.errors.load', { ns: 'admin-account' }),
        );
        return [];
      } finally {
        if (requestID === errorMessagesRequestIDRef.current) {
          setIsErrorMessagesLoading(false);
        }
      }
    },
    [
      errorFilterLocale,
      errorFilterQueryDebounced,
      errorMessagesPage,
      errorMessagesPageSize,
      hasAdminUser,
      isActive,
      onSessionExpired,
      t,
    ],
  );

  React.useEffect(() => {
    if (!isActive || !hasAdminUser) {
      return;
    }

    void loadAdminErrorMessages();
  }, [errorMessagesPage, errorMessagesPageSize, hasAdminUser, isActive, loadAdminErrorMessages]);

  const scrollToErrorMessagesListStart = React.useCallback(() => {
    scrollRefIntoView(errorMessagesListTopRef.current);
  }, []);

  const onOpenCreateErrorMessage = React.useCallback(() => {
    setErrorCrudTab('create');
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');
    setIsErrorEditorModalOpen(true);
  }, []);

  const onErrorFilterLocaleChange = React.useCallback((value: 'all' | 'en' | 'tr') => {
    setErrorFilterLocale(value);
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');
  }, []);

  const onErrorFilterQueryChange = React.useCallback((value: string) => {
    setErrorFilterQuery(value);
    setErrorMessagesErrorMessage('');
  }, []);

  const onClearErrorFilterQuery = React.useCallback(() => {
    setErrorFilterQuery('');
    setErrorMessagesErrorMessage('');
  }, []);

  const onSelectErrorMessage = React.useCallback((item: AdminErrorMessageItem) => {
    const key = toAdminErrorMessageKey(item);
    setSelectedErrorMessageKey(key);
    setErrorCrudTab('update');
    setErrorUpdateMessage(item.message.trim());
    setErrorMessagesSuccessMessage('');
    setErrorMessagesErrorMessage('');
  }, []);

  const onOpenUpdateErrorMessage = React.useCallback(
    (item: AdminErrorMessageItem) => {
      onSelectErrorMessage(item);
      setErrorCrudTab('update');
      setIsErrorEditorModalOpen(true);
    },
    [onSelectErrorMessage],
  );

  const openDeleteErrorMessageConfirm = React.useCallback(
    (targetItem?: AdminErrorMessageItem) => {
      const item = targetItem ?? selectedErrorMessage;
      if (!item || isErrorDeleteSubmitting || isErrorUpdateSubmitting) {
        return;
      }

      setPendingErrorMessageDelete(item);
    },
    [isErrorDeleteSubmitting, isErrorUpdateSubmitting, selectedErrorMessage],
  );

  const onOpenDeleteErrorMessage = React.useCallback(
    (item: AdminErrorMessageItem) => {
      onSelectErrorMessage(item);
      openDeleteErrorMessageConfirm(item);
    },
    [onSelectErrorMessage, openDeleteErrorMessageConfirm],
  );

  const onErrorMessagesPageChange = React.useCallback(
    (page: number) => {
      setErrorMessagesPage(page);
      scrollToErrorMessagesListStart();
    },
    [scrollToErrorMessagesListStart],
  );

  const onErrorMessagesPageSizeChange = React.useCallback(
    (size: number) => {
      setErrorMessagesPageSize(size);
      setErrorMessagesPage(1);
      scrollToErrorMessagesListStart();
    },
    [scrollToErrorMessagesListStart],
  );

  const onCloseErrorEditor = React.useCallback(() => {
    if (isErrorCreateSubmitting || isErrorUpdateSubmitting || isErrorDeleteSubmitting) {
      return;
    }
    setIsErrorEditorModalOpen(false);
  }, [isErrorCreateSubmitting, isErrorDeleteSubmitting, isErrorUpdateSubmitting]);

  const onErrorCreateLocaleChange = React.useCallback((value: 'en' | 'tr') => {
    setErrorCreateLocale(value);
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');
  }, []);

  const onErrorCreateCodeChange = React.useCallback((value: string) => {
    setErrorCreateCode(value);
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');
  }, []);

  const onErrorCreateMessageChange = React.useCallback((value: string) => {
    setErrorCreateMessage(value);
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');
  }, []);

  const onErrorUpdateMessageChange = React.useCallback((value: string) => {
    setErrorUpdateMessage(value);
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');
  }, []);

  const onCreateErrorMessageSubmit = React.useCallback(async () => {
    if (!canCreateErrorMessage) {
      return;
    }

    setIsErrorCreateSubmitting(true);
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');

    try {
      const created = await createAdminErrorMessage({
        key: {
          scope: 'admin_graphql',
          locale: errorCreateLocale,
          code: normalizedErrorCreateCode,
        },
        message: normalizedErrorCreateMessage,
      });

      const createdKey = toAdminErrorMessageKey(created);
      setErrorCrudTab('update');
      setErrorCreateCode('');
      setErrorCreateMessage('');
      setErrorMessagesSuccessMessage(t('adminAccount.errorsCatalog.success.created', { ns: 'admin-account' }));
      setIsErrorEditorModalOpen(false);

      if (doesErrorMessageMatchFilters(created)) {
        setSelectedErrorMessageKey(createdKey);
        selectedErrorMessageKeyRef.current = createdKey;
        setTotalErrorMessages(previous => previous + 1);
        await loadAdminErrorMessages({
          page: errorMessagesPage,
          preferredSelectedKey: createdKey,
        });
      }
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessagesErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.errorsCatalog.errors.create', { ns: 'admin-account' }),
      );
    } finally {
      setIsErrorCreateSubmitting(false);
    }
  }, [
    canCreateErrorMessage,
    doesErrorMessageMatchFilters,
    errorCreateLocale,
    errorMessagesPage,
    loadAdminErrorMessages,
    normalizedErrorCreateCode,
    normalizedErrorCreateMessage,
    onSessionExpired,
    t,
  ]);

  const onUpdateErrorMessageSubmit = React.useCallback(async () => {
    if (!selectedErrorMessage || !canUpdateErrorMessage) {
      return;
    }

    setIsErrorUpdateSubmitting(true);
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');

    try {
      const updated = await updateAdminErrorMessage({
        key: {
          scope: selectedErrorMessage.scope,
          locale: selectedErrorMessage.locale,
          code: selectedErrorMessage.code,
        },
        message: normalizedErrorUpdateMessage,
      });

      if (doesErrorMessageMatchFilters(updated)) {
        const updatedKey = toAdminErrorMessageKey(updated);
        setErrorMessages(previous =>
          previous.map(item => (toAdminErrorMessageKey(item) === updatedKey ? updated : item)),
        );
        if (selectedErrorMessageKeyRef.current === updatedKey) {
          setErrorUpdateMessage(updated.message.trim());
        }
      } else {
        const updatedKey = toAdminErrorMessageKey(updated);
        setErrorMessages(previous => previous.filter(item => toAdminErrorMessageKey(item) !== updatedKey));
        setTotalErrorMessages(previous => Math.max(0, previous - 1));
        await loadAdminErrorMessages({
          page: errorMessagesPage,
          preferredSelectedKey: selectedErrorMessageKeyRef.current,
        });
      }

      setErrorMessagesSuccessMessage(t('adminAccount.errorsCatalog.success.updated', { ns: 'admin-account' }));
      setIsErrorEditorModalOpen(false);
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessagesErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.errorsCatalog.errors.update', { ns: 'admin-account' }),
      );
    } finally {
      setIsErrorUpdateSubmitting(false);
    }
  }, [
    canUpdateErrorMessage,
    doesErrorMessageMatchFilters,
    errorMessagesPage,
    loadAdminErrorMessages,
    normalizedErrorUpdateMessage,
    onSessionExpired,
    selectedErrorMessage,
    t,
  ]);

  const onCloseDeleteErrorMessage = React.useCallback(() => {
    if (isErrorDeleteSubmitting) {
      return;
    }
    setPendingErrorMessageDelete(null);
  }, [isErrorDeleteSubmitting]);

  const onDeleteErrorMessageSubmit = React.useCallback(async () => {
    const item = pendingErrorMessageDelete;
    if (!item || isErrorDeleteSubmitting || isErrorUpdateSubmitting) {
      return;
    }

    setIsErrorDeleteSubmitting(true);
    setDeletingErrorMessageKey(toAdminErrorMessageKey(item));
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');

    try {
      const selectedKey = toAdminErrorMessageKey(item);
      const deleted = await deleteAdminErrorMessage({
        scope: item.scope,
        locale: item.locale,
        code: item.code,
      });
      if (!deleted) {
        throw new Error(t('adminAccount.errorsCatalog.errors.delete', { ns: 'admin-account' }));
      }

      const remainingItems = errorMessages.filter(candidate => toAdminErrorMessageKey(candidate) !== selectedKey);
      const nextTotal = Math.max(0, totalErrorMessages - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / errorMessagesPageSize));
      const nextPage = Math.min(errorMessagesPage, nextTotalPages);
      const fallbackSelectionKey = remainingItems[0] ? toAdminErrorMessageKey(remainingItems[0]) : '';
      const preferredSelectedKey =
        selectedErrorMessageKeyRef.current === selectedKey ? fallbackSelectionKey : selectedErrorMessageKeyRef.current;

      setErrorMessages(remainingItems);
      setTotalErrorMessages(nextTotal);
      setSelectedErrorMessageKey(preferredSelectedKey);
      selectedErrorMessageKeyRef.current = preferredSelectedKey;
      setErrorUpdateMessage(
        (
          remainingItems.find(candidate => toAdminErrorMessageKey(candidate) === preferredSelectedKey)?.message ?? ''
        ).trim(),
      );
      if (nextPage !== errorMessagesPage) {
        setErrorMessagesPage(nextPage);
      }

      if (nextTotal > 0) {
        await loadAdminErrorMessages({
          page: nextPage,
          preferredSelectedKey,
        });
      }

      setErrorMessagesSuccessMessage(t('adminAccount.errorsCatalog.success.deleted', { ns: 'admin-account' }));
      setIsErrorEditorModalOpen(false);
      setPendingErrorMessageDelete(null);
    } catch (error) {
      if (isAdminSessionError(error)) {
        onSessionExpired();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessagesErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.errorsCatalog.errors.delete', { ns: 'admin-account' }),
      );
    } finally {
      setIsErrorDeleteSubmitting(false);
      setDeletingErrorMessageKey('');
    }
  }, [
    errorMessages,
    errorMessagesPage,
    errorMessagesPageSize,
    isErrorDeleteSubmitting,
    isErrorUpdateSubmitting,
    loadAdminErrorMessages,
    onSessionExpired,
    pendingErrorMessageDelete,
    t,
    totalErrorMessages,
  ]);

  return {
    errorMessages,
    isErrorMessagesLoading,
    errorMessagesErrorMessage,
    errorMessagesSuccessMessage,
    isErrorCreateSubmitting,
    isErrorUpdateSubmitting,
    isErrorDeleteSubmitting,
    onOpenCreateErrorMessage,
    errorMessagesListTopRef,
    errorFilterLocale,
    onErrorFilterLocaleChange,
    errorFilterQuery,
    onErrorFilterQueryChange,
    onClearErrorFilterQuery,
    totalErrorMessages,
    deletingErrorMessageKey,
    getErrorMessageKey: toAdminErrorMessageKey,
    onSelectErrorMessage,
    onOpenUpdateErrorMessage,
    onOpenDeleteErrorMessage,
    errorMessagesPage,
    totalErrorMessagePages,
    errorMessagesPageSize,
    onErrorMessagesPageChange,
    onErrorMessagesPageSizeChange,
    isErrorEditorModalOpen,
    onCloseErrorEditor,
    errorCrudTab,
    selectedErrorMessage,
    errorCreateLocale,
    onErrorCreateLocaleChange,
    errorCreateCode,
    onErrorCreateCodeChange,
    normalizedErrorCreateCode,
    isErrorCreateCodeValid,
    errorCreateMessage,
    onErrorCreateMessageChange,
    errorUpdateMessage,
    onErrorUpdateMessageChange,
    canCreateErrorMessage,
    canUpdateErrorMessage,
    onCreateErrorMessageSubmit,
    onUpdateErrorMessageSubmit,
    pendingErrorMessageDelete,
    onCloseDeleteErrorMessage,
    onDeleteErrorMessageSubmit,
  };
}
