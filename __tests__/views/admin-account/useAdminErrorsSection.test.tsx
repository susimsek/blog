import { act, renderHook, waitFor } from '@testing-library/react';
import type { TFunction } from 'i18next';
import {
  createAdminErrorMessage,
  deleteAdminErrorMessage,
  fetchAdminErrorMessages,
  isAdminSessionError,
  resolveAdminError,
  updateAdminErrorMessage,
  type AdminErrorMessageItem,
} from '@/lib/adminApi';
import useAdminErrorsSection from '@/views/admin-account/useAdminErrorsSection';

jest.mock('@/lib/adminApi', () => ({
  createAdminErrorMessage: jest.fn(),
  deleteAdminErrorMessage: jest.fn(),
  fetchAdminErrorMessages: jest.fn(),
  isAdminSessionError: jest.fn(),
  resolveAdminError: jest.fn(),
  updateAdminErrorMessage: jest.fn(),
}));

const item: AdminErrorMessageItem = {
  scope: 'admin_graphql',
  locale: 'en',
  code: 'AUTH_REQUIRED',
  message: 'Sign in again',
  updatedAt: null,
};

const payload = (items: AdminErrorMessageItem[] = [item]) => ({
  items,
  total: items.length,
  page: 1,
  size: 5,
});

const t = ((key: string) => key) as TFunction;
const onSessionExpired = jest.fn();
const renderSection = (overrides: Partial<Parameters<typeof useAdminErrorsSection>[0]> = {}) =>
  renderHook(() =>
    useAdminErrorsSection({
      isActive: true,
      hasAdminUser: true,
      t,
      onSessionExpired,
      successMessageAutoHideMs: 0,
      ...overrides,
    }),
  );

describe('useAdminErrorsSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(fetchAdminErrorMessages).mockResolvedValue(payload());
    jest.mocked(createAdminErrorMessage).mockResolvedValue(item);
    jest.mocked(updateAdminErrorMessage).mockResolvedValue({ ...item, message: 'Updated message' });
    jest.mocked(deleteAdminErrorMessage).mockResolvedValue(true);
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: 'Request failed' });
  });

  it('loads records, preserves the current page metadata and supports locale/query filters', async () => {
    const { result } = renderSection();

    await waitFor(() => expect(result.current.errorMessages).toEqual([item]));
    expect(result.current.selectedErrorMessage).toEqual(item);
    expect(result.current.getErrorMessageKey(item)).toBe('admin_graphql|en|AUTH_REQUIRED');
    expect(fetchAdminErrorMessages).toHaveBeenCalledWith({ locale: undefined, query: '', page: 1, size: 5 });

    act(() => {
      result.current.onErrorFilterLocaleChange('tr');
      result.current.onErrorFilterQueryChange('  denied  ');
    });
    await waitFor(() => {
      expect(fetchAdminErrorMessages).toHaveBeenLastCalledWith({ locale: 'tr', query: 'denied', page: 1, size: 5 });
    });
    await waitFor(() => expect(result.current.isErrorMessagesLoading).toBe(false));

    act(() => result.current.onClearErrorFilterQuery());
    expect(result.current.errorFilterQuery).toBe('');
    expect(result.current.errorFilterLocale).toBe('tr');
  });

  it('creates, updates, selects and deletes an error message', async () => {
    const created: AdminErrorMessageItem = { ...item, code: 'NEW_CODE', message: 'Created message' };
    jest.mocked(createAdminErrorMessage).mockResolvedValue(created);
    jest.mocked(updateAdminErrorMessage).mockResolvedValue({ ...created, message: 'Updated message' });
    jest.mocked(fetchAdminErrorMessages).mockResolvedValue(payload([created]));
    const { result } = renderSection();

    await waitFor(() => expect(result.current.errorMessages).toEqual([created]));
    act(() => {
      result.current.onOpenCreateErrorMessage();
      result.current.onErrorCreateLocaleChange('en');
      result.current.onErrorCreateCodeChange(' new_code ');
      result.current.onErrorCreateMessageChange(' Created message ');
    });
    expect(result.current.normalizedErrorCreateCode).toBe('NEW_CODE');
    expect(result.current.isErrorCreateCodeValid).toBe(true);
    expect(result.current.canCreateErrorMessage).toBe(true);

    await act(async () => result.current.onCreateErrorMessageSubmit());
    expect(createAdminErrorMessage).toHaveBeenCalledWith({
      key: { scope: 'admin_graphql', locale: 'en', code: 'NEW_CODE' },
      message: 'Created message',
    });
    expect(result.current.errorMessagesSuccessMessage).toBe('adminAccount.errorsCatalog.success.created');
    expect(result.current.isErrorEditorModalOpen).toBe(false);

    act(() => result.current.onErrorUpdateMessageChange('Updated message'));
    expect(result.current.canUpdateErrorMessage).toBe(true);
    await act(async () => result.current.onUpdateErrorMessageSubmit());
    expect(updateAdminErrorMessage).toHaveBeenCalledWith({
      key: { scope: created.scope, locale: created.locale, code: created.code },
      message: 'Updated message',
    });
    expect(result.current.errorMessages[0]?.message).toBe('Updated message');

    act(() => result.current.onOpenDeleteErrorMessage(result.current.errorMessages[0]!));
    expect(result.current.pendingErrorMessageDelete?.code).toBe('NEW_CODE');
    await act(async () => result.current.onDeleteErrorMessageSubmit());
    expect(deleteAdminErrorMessage).toHaveBeenCalledWith({
      scope: created.scope,
      locale: created.locale,
      code: created.code,
    });
    expect(result.current.errorMessages).toEqual([]);
    expect(result.current.pendingErrorMessageDelete).toBeNull();
  });

  it('validates create/update inputs and ignores submit attempts without valid selections', async () => {
    const { result } = renderSection({ isActive: false });
    expect(fetchAdminErrorMessages).not.toHaveBeenCalled();
    await act(async () => result.current.onCreateErrorMessageSubmit());
    await act(async () => result.current.onUpdateErrorMessageSubmit());
    expect(createAdminErrorMessage).not.toHaveBeenCalled();
    expect(updateAdminErrorMessage).not.toHaveBeenCalled();
    expect(result.current.canCreateErrorMessage).toBe(false);
    expect(result.current.canUpdateErrorMessage).toBe(false);

    act(() => {
      result.current.onOpenCreateErrorMessage();
      result.current.onErrorCreateCodeChange('bad-code');
      result.current.onErrorCreateMessageChange('Message');
    });
    expect(result.current.isErrorCreateCodeValid).toBe(false);
    expect(result.current.canCreateErrorMessage).toBe(false);
  });

  it('routes session expiry and displays resolved load errors', async () => {
    const sessionError = new Error('session expired');
    jest.mocked(fetchAdminErrorMessages).mockRejectedValue(sessionError);
    jest.mocked(isAdminSessionError).mockReturnValue(true);
    const { result } = renderSection();
    await waitFor(() => expect(onSessionExpired).toHaveBeenCalledTimes(1));
    expect(result.current.errorMessagesErrorMessage).toBe('');
    await waitFor(() => expect(result.current.isErrorMessagesLoading).toBe(false));
  });

  it('skips loading without an admin user and ignores stale responses', async () => {
    const inactive = renderSection({ hasAdminUser: false });
    expect(fetchAdminErrorMessages).not.toHaveBeenCalled();
    inactive.unmount();

    let releaseStaleResponse!: (value: ReturnType<typeof payload>) => void;
    jest.mocked(fetchAdminErrorMessages).mockImplementation(filter => {
      if (!filter?.query) {
        return new Promise(resolve => {
          releaseStaleResponse = resolve;
        });
      }
      return Promise.resolve(payload([{ ...item, message: 'Filtered result' }]));
    });
    const { result } = renderSection();
    await waitFor(() => expect(fetchAdminErrorMessages).toHaveBeenCalledTimes(1));

    act(() => result.current.onErrorFilterQueryChange('filtered'));
    await waitFor(() =>
      expect(fetchAdminErrorMessages).toHaveBeenLastCalledWith({
        locale: undefined,
        query: 'filtered',
        page: 1,
        size: 5,
      }),
    );
    await waitFor(() => expect(result.current.errorMessages[0]?.message).toBe('Filtered result'));

    await act(async () => releaseStaleResponse(payload([{ ...item, message: 'Stale result' }])));
    expect(result.current.errorMessages[0]?.message).toBe('Filtered result');
  });

  it('uses the translated network message for a load failure', async () => {
    jest.mocked(fetchAdminErrorMessages).mockRejectedValue(new Error('offline'));
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'network', message: '' });
    const { result } = renderSection();
    await waitFor(() => expect(result.current.errorMessagesErrorMessage).toBe('adminCommon.errors.network'));
  });

  it('defaults empty server metadata and uses the fallback message for unknown load errors', async () => {
    jest.mocked(fetchAdminErrorMessages).mockResolvedValueOnce({ items: null, total: null, page: 0, size: 0 } as never);
    const emptyHook = renderSection();
    await waitFor(() => expect(emptyHook.result.current.isErrorMessagesLoading).toBe(false));
    expect(emptyHook.result.current.errorMessages).toEqual([]);
    expect(emptyHook.result.current.totalErrorMessages).toBe(0);
    expect(emptyHook.result.current.selectedErrorMessage).toBeNull();
    emptyHook.unmount();

    jest.mocked(fetchAdminErrorMessages).mockRejectedValueOnce(new Error('unknown failure'));
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: '' });
    const failedHook = renderSection();
    await waitFor(() =>
      expect(failedHook.result.current.errorMessagesErrorMessage).toBe('adminAccount.errorsCatalog.errors.load'),
    );
    await waitFor(() => expect(failedHook.result.current.isErrorMessagesLoading).toBe(false));
  });

  it('does not reload after creating a message outside the active filter', async () => {
    const { result } = renderSection();
    await waitFor(() => expect(result.current.selectedErrorMessage).toEqual(item));
    act(() => result.current.onErrorFilterQueryChange('no matching field'));
    await waitFor(() =>
      expect(fetchAdminErrorMessages).toHaveBeenLastCalledWith({
        locale: undefined,
        query: 'no matching field',
        page: 1,
        size: 5,
      }),
    );
    await waitFor(() => expect(result.current.isErrorMessagesLoading).toBe(false));
    const requestCount = jest.mocked(fetchAdminErrorMessages).mock.calls.length;
    jest.mocked(createAdminErrorMessage).mockResolvedValue({ ...item, code: 'OTHER_CODE', message: 'Different' });

    act(() => {
      result.current.onOpenCreateErrorMessage();
      result.current.onErrorCreateCodeChange('OTHER_CODE');
      result.current.onErrorCreateMessageChange('Different');
    });
    await act(async () => result.current.onCreateErrorMessageSubmit());

    expect(fetchAdminErrorMessages).toHaveBeenCalledTimes(requestCount);
    expect(result.current.errorMessagesSuccessMessage).toBe('adminAccount.errorsCatalog.success.created');
  });

  it('does not reload a created message that fails the locale filter', async () => {
    const { result } = renderSection();
    await waitFor(() => expect(result.current.selectedErrorMessage).toEqual(item));
    act(() => result.current.onErrorFilterLocaleChange('tr'));
    await waitFor(() =>
      expect(fetchAdminErrorMessages).toHaveBeenLastCalledWith({ locale: 'tr', query: '', page: 1, size: 5 }),
    );
    await waitFor(() => expect(result.current.isErrorMessagesLoading).toBe(false));
    const requestCount = jest.mocked(fetchAdminErrorMessages).mock.calls.length;
    jest.mocked(createAdminErrorMessage).mockResolvedValue({ ...item, code: 'NEW_CODE' });

    act(() => {
      result.current.onOpenCreateErrorMessage();
      result.current.onErrorCreateCodeChange('NEW_CODE');
      result.current.onErrorCreateMessageChange('Created message');
    });
    await act(async () => result.current.onCreateErrorMessageSubmit());

    expect(fetchAdminErrorMessages).toHaveBeenCalledTimes(requestCount);
  });

  it('shows the translated network message for create, update and delete failures', async () => {
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'network', message: '' });
    const { result } = renderSection();
    await waitFor(() => expect(result.current.selectedErrorMessage).toEqual(item));

    jest.mocked(createAdminErrorMessage).mockRejectedValue(new Error('offline'));
    act(() => {
      result.current.onOpenCreateErrorMessage();
      result.current.onErrorCreateCodeChange('NEW_CODE');
      result.current.onErrorCreateMessageChange('New message');
    });
    await act(async () => result.current.onCreateErrorMessageSubmit());
    expect(result.current.errorMessagesErrorMessage).toBe('adminCommon.errors.network');

    jest.mocked(updateAdminErrorMessage).mockRejectedValue(new Error('offline'));
    act(() => result.current.onErrorUpdateMessageChange('Changed message'));
    await act(async () => result.current.onUpdateErrorMessageSubmit());
    expect(result.current.errorMessagesErrorMessage).toBe('adminCommon.errors.network');

    jest.mocked(deleteAdminErrorMessage).mockRejectedValue(new Error('offline'));
    act(() => result.current.onOpenDeleteErrorMessage(item));
    await act(async () => result.current.onDeleteErrorMessageSubmit());
    expect(result.current.errorMessagesErrorMessage).toBe('adminCommon.errors.network');
  });

  it('handles CRUD failures and leaves the matching error visible', async () => {
    const { result } = renderSection();
    await waitFor(() => expect(result.current.selectedErrorMessage).toEqual(item));

    jest.mocked(createAdminErrorMessage).mockRejectedValue(new Error('create failed'));
    act(() => {
      result.current.onOpenCreateErrorMessage();
      result.current.onErrorCreateCodeChange('VALID_CODE');
      result.current.onErrorCreateMessageChange('A message');
    });
    await act(async () => result.current.onCreateErrorMessageSubmit());
    expect(result.current.errorMessagesErrorMessage).toBe('Request failed');

    jest.mocked(updateAdminErrorMessage).mockRejectedValue(new Error('update failed'));
    act(() => result.current.onErrorUpdateMessageChange('Changed message'));
    await act(async () => result.current.onUpdateErrorMessageSubmit());
    expect(result.current.errorMessagesErrorMessage).toBe('Request failed');

    jest.mocked(deleteAdminErrorMessage).mockResolvedValue(false);
    act(() => result.current.onOpenDeleteErrorMessage(item));
    await act(async () => result.current.onDeleteErrorMessageSubmit());
    expect(result.current.errorMessagesErrorMessage).toBe('Request failed');
    expect(result.current.isErrorDeleteSubmitting).toBe(false);
    expect(result.current.deletingErrorMessageKey).toBe('');
  });

  it('routes create, update, and delete session failures to the expiry handler', async () => {
    const { result } = renderSection();
    await waitFor(() => expect(result.current.selectedErrorMessage).toEqual(item));
    jest.mocked(isAdminSessionError).mockReturnValue(true);

    jest.mocked(createAdminErrorMessage).mockRejectedValue(new Error('expired'));
    act(() => {
      result.current.onOpenCreateErrorMessage();
      result.current.onErrorCreateCodeChange('NEW_CODE');
      result.current.onErrorCreateMessageChange('New message');
    });
    await act(async () => result.current.onCreateErrorMessageSubmit());
    expect(onSessionExpired).toHaveBeenCalledTimes(1);

    jest.mocked(updateAdminErrorMessage).mockRejectedValue(new Error('expired'));
    act(() => result.current.onErrorUpdateMessageChange('Changed message'));
    await act(async () => result.current.onUpdateErrorMessageSubmit());
    expect(onSessionExpired).toHaveBeenCalledTimes(2);

    jest.mocked(deleteAdminErrorMessage).mockRejectedValue(new Error('expired'));
    act(() => result.current.onOpenDeleteErrorMessage(item));
    await act(async () => result.current.onDeleteErrorMessageSubmit());
    expect(onSessionExpired).toHaveBeenCalledTimes(3);
    expect(result.current.isErrorDeleteSubmitting).toBe(false);
  });

  it('changes page size, closes idle dialogs, and blocks close while saving', async () => {
    jest.mocked(fetchAdminErrorMessages).mockImplementation(async filter => {
      const currentPage = filter?.page ?? 1;
      const currentSize = filter?.size ?? 5;
      return {
        ...payload([{ ...item, message: `${currentPage}-${currentSize}` }]),
        page: currentPage,
        size: currentSize,
      };
    });
    const { result } = renderSection();
    await waitFor(() => expect(result.current.errorMessages[0]?.message).toBe('1-5'));

    const scrollTarget = document.createElement('div');
    const scrollIntoView = jest.fn();
    scrollTarget.scrollIntoView = scrollIntoView;
    result.current.errorMessagesListTopRef.current = scrollTarget;
    act(() => result.current.onErrorMessagesPageChange(2));
    expect(result.current.errorMessagesPage).toBe(2);
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    await waitFor(() => expect(result.current.errorMessages[0]?.message).toBe('2-5'));
    act(() => result.current.onErrorMessagesPageSizeChange(10));
    await waitFor(() => {
      expect(result.current.errorMessages[0]?.message).toBe('1-10');
      expect(result.current.errorMessagesPageSize).toBe(10);
      expect(result.current.errorMessagesPage).toBe(1);
    });
    await waitFor(() => expect(result.current.isErrorMessagesLoading).toBe(false));

    act(() => {
      result.current.onOpenUpdateErrorMessage(item);
      result.current.onCloseErrorEditor();
    });
    expect(result.current.isErrorEditorModalOpen).toBe(false);
    expect(result.current.errorCrudTab).toBe('update');
  });

  it('accepts server pagination metadata and reloads after deleting when records remain', async () => {
    const second: AdminErrorMessageItem = { ...item, code: 'SECOND_CODE', message: 'Another message' };
    jest.mocked(fetchAdminErrorMessages).mockImplementation(async () => ({
      items: [item, second],
      total: 22,
      page: 2,
      size: 10,
    }));
    const { result } = renderSection();
    await waitFor(() => {
      expect(result.current.errorMessages).toHaveLength(2);
      expect(result.current.errorMessagesPage).toBe(2);
      expect(result.current.errorMessagesPageSize).toBe(10);
    });
    expect(result.current.totalErrorMessagePages).toBe(3);

    act(() => {
      result.current.errorMessagesListTopRef.current = null;
      result.current.onErrorMessagesPageChange(2);
    });
    expect(result.current.errorMessagesPage).toBe(2);

    act(() => result.current.onOpenDeleteErrorMessage(item));
    await act(async () => result.current.onDeleteErrorMessageSubmit());
    await waitFor(() => expect(result.current.isErrorMessagesLoading).toBe(false));
    expect(deleteAdminErrorMessage).toHaveBeenCalledWith({ scope: item.scope, locale: item.locale, code: item.code });
    expect(result.current.errorMessagesSuccessMessage).toBe('adminAccount.errorsCatalog.success.deleted');
    expect(fetchAdminErrorMessages).toHaveBeenCalledWith({ locale: undefined, query: '', page: 2, size: 10 });
  });

  it('moves back to the last page after deleting its only remaining record', async () => {
    jest
      .mocked(fetchAdminErrorMessages)
      .mockResolvedValueOnce({ items: [item], total: 11, page: 2, size: 10 } as never)
      .mockResolvedValueOnce({ items: [item], total: 11, page: 2, size: 10 } as never)
      .mockResolvedValue({ items: [], total: 10, page: 1, size: 10 } as never);
    const { result } = renderSection();
    await waitFor(() => expect(result.current.errorMessagesPage).toBe(2));

    act(() => result.current.onOpenDeleteErrorMessage(item));
    await act(async () => result.current.onDeleteErrorMessageSubmit());

    await waitFor(() => expect(result.current.isErrorMessagesLoading).toBe(false));
    expect(fetchAdminErrorMessages).toHaveBeenLastCalledWith({ locale: undefined, query: '', page: 1, size: 10 });
    expect(result.current.errorMessagesPage).toBe(1);
    expect(result.current.errorMessages).toEqual([]);
  });

  it('uses automatic scrolling when reduced motion is preferred', async () => {
    const previousMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: true }),
    });
    const { result } = renderSection();
    await waitFor(() => expect(result.current.isErrorMessagesLoading).toBe(false));
    const scrollTarget = document.createElement('div');
    scrollTarget.scrollIntoView = jest.fn();
    result.current.errorMessagesListTopRef.current = scrollTarget;

    act(() => result.current.onErrorMessagesPageChange(2));

    expect(scrollTarget.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
    await waitFor(() => expect(result.current.isErrorMessagesLoading).toBe(false));
    if (previousMatchMedia) {
      Object.defineProperty(window, 'matchMedia', previousMatchMedia);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  it('reloads an updated message when the changed value no longer matches the selected filter', async () => {
    const { result } = renderSection();
    await waitFor(() => expect(result.current.selectedErrorMessage).toEqual(item));
    act(() => result.current.onErrorFilterQueryChange('  SIGN IN  '));
    await waitFor(() =>
      expect(fetchAdminErrorMessages).toHaveBeenLastCalledWith({
        locale: undefined,
        query: 'SIGN IN',
        page: 1,
        size: 5,
      }),
    );
    await waitFor(() => expect(result.current.isErrorMessagesLoading).toBe(false));

    jest.mocked(updateAdminErrorMessage).mockResolvedValue({ ...item, message: 'No longer matches' });
    act(() => result.current.onErrorUpdateMessageChange('No longer matches'));
    await act(async () => result.current.onUpdateErrorMessageSubmit());
    expect(updateAdminErrorMessage).toHaveBeenCalled();
    expect(result.current.errorMessagesSuccessMessage).toBe('adminAccount.errorsCatalog.success.updated');
    expect(fetchAdminErrorMessages).toHaveBeenLastCalledWith({ locale: undefined, query: 'SIGN IN', page: 1, size: 5 });
  });
});
