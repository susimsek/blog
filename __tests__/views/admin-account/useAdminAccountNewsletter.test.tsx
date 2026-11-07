import { act, renderHook, waitFor } from '@testing-library/react';
import type { TFunction } from 'i18next';
import {
  deleteAdminNewsletterSubscriber,
  fetchAdminNewsletterCampaignFailures,
  fetchAdminNewsletterCampaigns,
  fetchAdminNewsletterSubscribers,
  isAdminSessionError,
  resolveAdminError,
  sendAdminNewsletterTestEmail,
  triggerAdminNewsletterDispatch,
  updateAdminNewsletterSubscriberStatus,
} from '@/lib/adminApi';
import useAdminAccountNewsletterOverview from '@/views/admin-account/useAdminAccountNewsletterOverview';
import useAdminAccountNewsletterSubscribers from '@/views/admin-account/useAdminAccountNewsletterSubscribers';

jest.mock('@/lib/adminApi', () => ({
  deleteAdminNewsletterSubscriber: jest.fn(),
  fetchAdminNewsletterCampaignFailures: jest.fn(),
  fetchAdminNewsletterCampaigns: jest.fn(),
  fetchAdminNewsletterSubscribers: jest.fn(),
  isAdminSessionError: jest.fn(),
  resolveAdminError: jest.fn(),
  sendAdminNewsletterTestEmail: jest.fn(),
  triggerAdminNewsletterDispatch: jest.fn(),
  updateAdminNewsletterSubscriberStatus: jest.fn(),
}));

const subscriber = {
  email: 'reader@example.com',
  locale: 'en',
  status: 'ACTIVE' as const,
  tags: [],
  formName: null,
  source: null,
  updatedAt: null,
  createdAt: null,
  confirmedAt: null,
  unsubscribedAt: null,
};

const campaign = {
  locale: 'en',
  itemKey: 'sample-post',
  title: 'Sample post',
  summary: null,
  link: '/en/posts/sample-post',
  pubDate: null,
  rssUrl: null,
  status: 'SENT',
  sentCount: 1,
  failedCount: 0,
  lastRunAt: null,
  updatedAt: null,
  createdAt: null,
};

const failure = {
  locale: 'en',
  itemKey: 'sample-post',
  email: 'failed@example.com',
  status: 'FAILED',
  lastError: 'mailbox unavailable',
  lastAttemptAt: null,
  updatedAt: null,
  createdAt: null,
};

const t = ((key: string) => key) as TFunction;
const onSessionExpired = jest.fn();
const setNewsletterErrorMessage = jest.fn();
const setNewsletterSuccessMessage = jest.fn();
const renderOverview = (overrides: Partial<Parameters<typeof useAdminAccountNewsletterOverview>[0]> = {}) =>
  renderHook(() =>
    useAdminAccountNewsletterOverview({
      hasAdminUser: true,
      adminEmail: 'admin@example.com',
      isActive: true,
      newsletterFilterLocale: 'all',
      newsletterFilterQuery: '  sample  ',
      t,
      onSessionExpired,
      setNewsletterErrorMessage,
      setNewsletterSuccessMessage,
      ...overrides,
    }),
  );
const renderSubscribers = (overrides: Partial<Parameters<typeof useAdminAccountNewsletterSubscribers>[0]> = {}) =>
  renderHook(() =>
    useAdminAccountNewsletterSubscribers({
      hasAdminUser: true,
      isActive: true,
      t,
      onSessionExpired,
      setNewsletterErrorMessage,
      setNewsletterSuccessMessage,
      ...overrides,
    }),
  );

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
};

describe('newsletter account hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockReturnValue({ kind: 'unknown', message: 'Request failed' });
    jest
      .mocked(fetchAdminNewsletterSubscribers)
      .mockResolvedValue({ items: [subscriber], total: 1, page: 1, size: 10 });
    jest.mocked(fetchAdminNewsletterCampaigns).mockResolvedValue({ items: [campaign], total: 1, page: 1, size: 6 });
    jest
      .mocked(fetchAdminNewsletterCampaignFailures)
      .mockResolvedValue({ items: [failure], total: 1, page: 1, size: 25 });
    jest.mocked(triggerAdminNewsletterDispatch).mockResolvedValue({
      success: true,
      message: '',
      timestamp: '2026-11-07T10:00:00Z',
      results: [],
    });
    jest.mocked(sendAdminNewsletterTestEmail).mockResolvedValue({
      success: true,
      message: '',
      timestamp: '2026-11-07T10:00:00Z',
      email: 'admin@example.com',
      locale: campaign.locale,
      itemKey: campaign.itemKey,
      postTitle: campaign.title,
    });
    jest.mocked(updateAdminNewsletterSubscriberStatus).mockResolvedValue({ ...subscriber, status: 'UNSUBSCRIBED' });
    jest.mocked(deleteAdminNewsletterSubscriber).mockResolvedValue(true);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'sample-post', thumbnail: '/sample.webp' }],
    }) as jest.Mock;
    onSessionExpired.mockClear();
    setNewsletterErrorMessage.mockClear();
    setNewsletterSuccessMessage.mockClear();
  });

  it('loads newsletter metrics and campaign thumbnails from locale post indexes', async () => {
    const { result } = renderOverview();

    await waitFor(() =>
      expect(result.current.newsletterSubscriberSummary).toEqual({ total: 1, active: 1, pending: 1, unsubscribed: 1 }),
    );
    await waitFor(() =>
      expect(result.current.newsletterCampaignThumbnails).toEqual({ 'en:sample-post': '/sample.webp' }),
    );
    expect(fetchAdminNewsletterCampaigns).toHaveBeenCalledWith({
      locale: undefined,
      query: 'sample',
      page: 1,
      size: 6,
    });
    expect(result.current.isNewsletterSummaryLoading).toBe(false);
    expect(result.current.isNewsletterCampaignsLoading).toBe(false);
  });

  it('does not load inactive or unauthorized newsletter data', async () => {
    renderOverview({ isActive: false });
    expect(fetchAdminNewsletterSubscribers).not.toHaveBeenCalled();
    expect(fetchAdminNewsletterCampaigns).not.toHaveBeenCalled();

    jest.clearAllMocks();
    renderOverview({ hasAdminUser: false });
    await waitFor(() => expect(fetchAdminNewsletterSubscribers).not.toHaveBeenCalled());
    expect(fetchAdminNewsletterCampaigns).not.toHaveBeenCalled();
  });

  it('reports summary and campaign failures without leaving loading states set', async () => {
    jest.mocked(fetchAdminNewsletterSubscribers).mockRejectedValueOnce(new Error('offline'));
    jest.mocked(fetchAdminNewsletterCampaigns).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderOverview({ newsletterFilterLocale: 'tr' });
    await waitFor(() => expect(result.current.isNewsletterCampaignsLoading).toBe(false));
    expect(setNewsletterErrorMessage).toHaveBeenCalled();
    expect(result.current.newsletterCampaigns).toEqual([]);
  });

  it('clears thumbnails when a locale index cannot be loaded', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, json: async () => [] });
    const { result } = renderOverview();
    await waitFor(() => expect(result.current.newsletterCampaigns).toEqual([campaign]));
    await waitFor(() => expect(result.current.newsletterCampaignThumbnails).toEqual({}));
  });

  it('skips thumbnail requests for unsupported locales and links without post ids', async () => {
    jest.mocked(fetchAdminNewsletterCampaigns).mockResolvedValueOnce({
      items: [
        { ...campaign, locale: 'xx' },
        { ...campaign, locale: 'xx', itemKey: 'missing-link', link: '/about' },
      ],
      total: 2,
      page: 1,
      size: 6,
    });
    const { result } = renderOverview();
    await waitFor(() => expect(result.current.newsletterCampaigns).toHaveLength(2));
    await waitFor(() => expect(result.current.newsletterCampaignThumbnails).toEqual({}));
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('dispatches campaigns, refreshes the overview, and handles dispatch failure', async () => {
    const { result } = renderOverview();
    await waitFor(() => expect(result.current.newsletterCampaigns).toEqual([campaign]));
    await act(async () => result.current.handleTriggerNewsletterDispatch());
    expect(result.current.newsletterDispatchTimestamp).toBe('2026-11-07T10:00:00Z');
    expect(setNewsletterSuccessMessage).toHaveBeenCalledWith('adminAccount.newsletter.success.dispatchTriggered');
    expect(triggerAdminNewsletterDispatch).toHaveBeenCalledTimes(1);

    jest.mocked(triggerAdminNewsletterDispatch).mockRejectedValueOnce(new Error('dispatch failed'));
    await act(async () => result.current.handleTriggerNewsletterDispatch());
    expect(setNewsletterErrorMessage).toHaveBeenCalled();
    expect(result.current.isNewsletterDispatchRunning).toBe(false);
  });

  it('loads campaign failures and clears a selection when an ordinary request fails', async () => {
    const { result } = renderOverview();
    await act(async () => result.current.handleViewNewsletterFailures(campaign));
    expect(result.current.selectedNewsletterCampaign).toEqual(campaign);
    expect(result.current.newsletterCampaignFailures).toEqual([failure]);
    expect(result.current.newsletterFailuresTotal).toBe(1);
    act(() => result.current.handleCloseNewsletterFailures());
    expect(result.current.selectedNewsletterCampaign).toBeNull();

    jest.mocked(fetchAdminNewsletterCampaignFailures).mockRejectedValueOnce(new Error('failed'));
    await act(async () => result.current.handleViewNewsletterFailures(campaign));
    expect(result.current.selectedNewsletterCampaign).toBeNull();
    expect(result.current.isNewsletterFailuresLoading).toBe(false);
  });

  it('keeps a failures dialog open while loading and closes it after the request settles', async () => {
    const pending = deferred<{ items: (typeof failure)[]; total: number; page: number; size: number }>();
    jest.mocked(fetchAdminNewsletterCampaignFailures).mockReturnValueOnce(pending.promise);
    const { result } = renderOverview();
    let request!: Promise<void>;
    act(() => {
      request = result.current.handleViewNewsletterFailures(campaign);
    });
    act(() => result.current.handleCloseNewsletterFailures());
    expect(result.current.selectedNewsletterCampaign).toEqual(campaign);
    await act(async () => {
      pending.resolve({ items: [failure], total: 1, page: 1, size: 25 });
      await request;
    });
    act(() => result.current.handleCloseNewsletterFailures());
    expect(result.current.selectedNewsletterCampaign).toBeNull();
  });

  it('sends a test email with normalized input and handles guards and failures', async () => {
    const { result } = renderOverview();
    act(() => result.current.handleOpenNewsletterTest(campaign));
    expect(result.current.newsletterTestEmail).toBe('admin@example.com');
    act(() => result.current.setNewsletterTestEmail('  TEST@EXAMPLE.COM '));
    await act(async () => result.current.handleSendNewsletterTestEmail());
    expect(sendAdminNewsletterTestEmail).toHaveBeenCalledWith({
      email: 'test@example.com',
      locale: campaign.locale,
      itemKey: campaign.itemKey,
    });
    expect(result.current.pendingNewsletterTestCampaign).toBeNull();
    expect(setNewsletterSuccessMessage).toHaveBeenCalledWith('adminAccount.newsletter.testSend.success');

    await act(async () => result.current.handleSendNewsletterTestEmail());
    expect(sendAdminNewsletterTestEmail).toHaveBeenCalledTimes(1);
    act(() => result.current.handleOpenNewsletterTest(campaign));
    jest.mocked(sendAdminNewsletterTestEmail).mockRejectedValueOnce(new Error('send failed'));
    await act(async () => result.current.handleSendNewsletterTestEmail());
    expect(setNewsletterErrorMessage).toHaveBeenCalled();
    expect(result.current.isNewsletterTestSending).toBe(false);
  });

  it('blocks duplicate test sends and dialog close while a send is in progress', async () => {
    const pending = deferred<Awaited<ReturnType<typeof sendAdminNewsletterTestEmail>>>();
    jest.mocked(sendAdminNewsletterTestEmail).mockReturnValueOnce(pending.promise);
    const { result } = renderOverview();
    act(() => result.current.handleOpenNewsletterTest(campaign));
    act(() => result.current.setNewsletterTestEmail('reader@example.com'));

    let sending!: Promise<void>;
    act(() => {
      sending = result.current.handleSendNewsletterTestEmail();
    });
    await waitFor(() => expect(result.current.isNewsletterTestSending).toBe(true));
    act(() => result.current.handleCloseNewsletterTest());
    await act(async () => result.current.handleSendNewsletterTestEmail());
    expect(result.current.pendingNewsletterTestCampaign).toEqual(campaign);
    expect(sendAdminNewsletterTestEmail).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve({
        success: true,
        message: 'Sent',
        timestamp: '2026-11-07T10:00:00Z',
        email: 'reader@example.com',
        locale: campaign.locale,
        itemKey: campaign.itemKey,
        postTitle: campaign.title,
      });
      await sending;
    });
    expect(result.current.pendingNewsletterTestCampaign).toBeNull();
  });

  it('loads subscribers with server pagination and applies filter changes', async () => {
    jest.mocked(fetchAdminNewsletterSubscribers).mockImplementation(async filter => ({
      items: [subscriber],
      total: 25,
      page: filter?.query ? (filter.page ?? 1) : 2,
      size: filter?.size ?? 10,
    }));
    const { result } = renderSubscribers();
    await waitFor(() => expect(result.current.newsletterPage).toBe(2));
    expect(result.current.totalNewsletterPages).toBe(3);
    expect(result.current.newsletterSubscribers).toEqual([subscriber]);

    act(() => {
      result.current.handleNewsletterFilterLocaleChange('en');
      result.current.handleNewsletterFilterStatusChange('active');
      result.current.handleNewsletterFilterQueryChange('  reader  ');
    });
    await waitFor(() =>
      expect(fetchAdminNewsletterSubscribers).toHaveBeenLastCalledWith({
        locale: 'en',
        status: 'active',
        query: 'reader',
        page: 1,
        size: 10,
      }),
    );
    await waitFor(() => expect(result.current.isNewsletterLoading).toBe(false));
  });

  it('updates and deletes subscribers, moving back when the current page becomes empty', async () => {
    let deleted = false;
    jest.mocked(fetchAdminNewsletterSubscribers).mockImplementation(async filter => ({
      items: [subscriber],
      total: deleted ? 10 : 11,
      page: deleted ? (filter?.page ?? 1) : 2,
      size: 10,
    }));
    const { result } = renderSubscribers();
    await waitFor(() => expect(result.current.newsletterPage).toBe(2));
    await act(async () => result.current.handleNewsletterStatusUpdate(subscriber, 'unsubscribed'));
    expect(updateAdminNewsletterSubscriberStatus).toHaveBeenCalledWith({
      email: subscriber.email,
      status: 'unsubscribed',
    });

    act(() => result.current.handleOpenNewsletterDelete(subscriber));
    deleted = true;
    await act(async () => result.current.handleDeleteNewsletterSubscriber());
    await waitFor(() => expect(result.current.isNewsletterLoading).toBe(false));
    expect(result.current.newsletterPage).toBe(1);
    expect(result.current.pendingNewsletterDelete).toBeNull();
    expect(deleteAdminNewsletterSubscriber).toHaveBeenCalledWith({ email: subscriber.email });
  });

  it('handles subscriber request errors, rejected mutations, and empty delete responses', async () => {
    jest.mocked(fetchAdminNewsletterSubscribers).mockRejectedValueOnce(new Error('load failed'));
    const { result } = renderSubscribers();
    await waitFor(() => expect(result.current.isNewsletterLoading).toBe(false));
    expect(setNewsletterErrorMessage).toHaveBeenCalled();

    jest.mocked(updateAdminNewsletterSubscriberStatus).mockRejectedValueOnce(new Error('update failed'));
    await act(async () => result.current.handleNewsletterStatusUpdate(subscriber, 'active'));
    expect(result.current.updatingNewsletterEmail).toBe('');

    act(() => result.current.handleOpenNewsletterDelete(subscriber));
    jest.mocked(deleteAdminNewsletterSubscriber).mockResolvedValueOnce(false);
    await act(async () => result.current.handleDeleteNewsletterSubscriber());
    expect(result.current.deletingNewsletterEmail).toBe('');
    expect(result.current.pendingNewsletterDelete).toEqual(subscriber);
  });

  it('blocks conflicting subscriber mutations and keeps delete confirmation while deleting', async () => {
    const pending = deferred<typeof subscriber>();
    jest.mocked(updateAdminNewsletterSubscriberStatus).mockReturnValueOnce(pending.promise);
    const { result } = renderSubscribers();
    await waitFor(() => expect(result.current.newsletterSubscribers).toEqual([subscriber]));

    let updating!: Promise<void>;
    act(() => {
      updating = result.current.handleNewsletterStatusUpdate(subscriber, 'active');
    });
    await waitFor(() => expect(result.current.updatingNewsletterEmail).toBe(subscriber.email));
    act(() => result.current.handleOpenNewsletterDelete(subscriber));
    await act(async () => result.current.handleDeleteNewsletterSubscriber());
    expect(deleteAdminNewsletterSubscriber).not.toHaveBeenCalled();

    await act(async () => {
      pending.resolve({ ...subscriber, status: 'ACTIVE' });
      await updating;
    });
    expect(result.current.updatingNewsletterEmail).toBe('');

    const deletion = deferred<boolean>();
    jest.mocked(deleteAdminNewsletterSubscriber).mockReturnValueOnce(deletion.promise);
    let deleting!: Promise<void>;
    act(() => {
      deleting = result.current.handleDeleteNewsletterSubscriber();
    });
    await waitFor(() => expect(result.current.deletingNewsletterEmail).toBe(subscriber.email));
    act(() => result.current.handleCloseNewsletterDelete());
    expect(result.current.pendingNewsletterDelete).toEqual(subscriber);
    await act(async () => {
      deletion.resolve(true);
      await deleting;
    });
    expect(result.current.pendingNewsletterDelete).toBeNull();
  });

  it('ignores stale subscriber responses and errors', async () => {
    const oldRequest = deferred<{ items: (typeof subscriber)[]; total: number; page: number; size: number }>();
    const supersededRequest = deferred<{ items: (typeof subscriber)[]; total: number; page: number; size: number }>();
    const currentRequest = deferred<{ items: (typeof subscriber)[]; total: number; page: number; size: number }>();
    jest
      .mocked(fetchAdminNewsletterSubscribers)
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(supersededRequest.promise)
      .mockReturnValueOnce(currentRequest.promise);
    const { result } = renderSubscribers();
    act(() => result.current.handleNewsletterFilterStatusChange('pending'));
    act(() => result.current.handleNewsletterFilterStatusChange('active'));
    await waitFor(() => expect(fetchAdminNewsletterSubscribers).toHaveBeenCalledTimes(3));
    await act(async () => {
      oldRequest.reject(new Error('stale failure'));
      await oldRequest.promise.catch(() => undefined);
    });
    await act(async () => {
      supersededRequest.resolve({ items: [subscriber], total: 1, page: 1, size: 10 });
      await supersededRequest.promise;
    });
    expect(result.current.newsletterSubscribers).toEqual([]);
    expect(result.current.isNewsletterLoading).toBe(true);
  });

  it('supports page-size changes and scrolling controls', async () => {
    jest.mocked(fetchAdminNewsletterSubscribers).mockImplementation(async filter => ({
      items: [subscriber],
      total: 1,
      page: filter?.page ?? 1,
      size: filter?.size ?? 10,
    }));
    const { result } = renderSubscribers();
    await waitFor(() => expect(result.current.isNewsletterLoading).toBe(false));
    const target = document.createElement('div');
    target.scrollIntoView = jest.fn();
    result.current.newsletterListTopRef.current = target;
    act(() => {
      result.current.handleNewsletterPageChange(2);
      result.current.handleNewsletterPageSizeChange(25);
    });
    expect(target.scrollIntoView).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.isNewsletterLoading).toBe(false));
    act(() => {
      result.current.newsletterListTopRef.current = null;
      result.current.handleNewsletterPageChange(1);
    });
    await waitFor(() => expect(result.current.isNewsletterLoading).toBe(false));
  });
});
