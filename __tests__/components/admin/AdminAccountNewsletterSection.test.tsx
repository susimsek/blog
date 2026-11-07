import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import AdminAccountNewsletterSection from '@/components/admin/account/AdminAccountNewsletterSection';
import type {
  AdminNewsletterCampaignItem,
  AdminNewsletterDeliveryFailureItem,
  AdminNewsletterDispatchLocaleResult,
  AdminNewsletterSubscriberItem,
} from '@/lib/adminApi';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    unoptimized: _unoptimized,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => <img {...props} />,
}));

type NewsletterSectionProps = React.ComponentProps<typeof AdminAccountNewsletterSection>;

const campaigns: AdminNewsletterCampaignItem[] = [
  {
    locale: 'en',
    itemKey: 'sent-post',
    title: 'Sent campaign',
    summary: null,
    link: null,
    pubDate: null,
    rssUrl: null,
    status: 'SENT',
    sentCount: 1,
    failedCount: 0,
    lastRunAt: null,
    updatedAt: null,
    createdAt: null,
  },
  {
    locale: 'tr',
    itemKey: 'partial-post',
    title: 'Partial campaign',
    summary: 'Campaign summary',
    link: '/tr/posts/partial-post',
    pubDate: null,
    rssUrl: null,
    status: 'PARTIAL',
    sentCount: 2,
    failedCount: 1,
    lastRunAt: '2026-11-06T10:00:00Z',
    updatedAt: null,
    createdAt: null,
  },
  {
    locale: 'xx',
    itemKey: 'processing-post',
    title: 'Processing campaign',
    summary: null,
    link: null,
    pubDate: null,
    rssUrl: null,
    status: 'PROCESSING',
    sentCount: 0,
    failedCount: 1,
    lastRunAt: null,
    updatedAt: null,
    createdAt: null,
  },
];

const subscribers: AdminNewsletterSubscriberItem[] = [
  {
    email: 'pending@example.com',
    locale: 'en',
    status: 'PENDING',
    tags: [],
    formName: null,
    source: null,
    updatedAt: '2026-11-01T10:00:00Z',
    createdAt: null,
    confirmedAt: null,
    unsubscribedAt: null,
  },
  {
    email: 'active@example.com',
    locale: 'tr',
    status: 'ACTIVE',
    tags: [],
    formName: null,
    source: null,
    updatedAt: null,
    createdAt: null,
    confirmedAt: null,
    unsubscribedAt: null,
  },
  {
    email: 'unsubscribed@example.com',
    locale: 'xx',
    status: 'UNSUBSCRIBED',
    tags: [],
    formName: null,
    source: null,
    updatedAt: null,
    createdAt: null,
    confirmedAt: null,
    unsubscribedAt: null,
  },
];

const failures: AdminNewsletterDeliveryFailureItem[] = [
  {
    locale: 'tr',
    itemKey: 'partial-post',
    email: 'failed@example.com',
    status: 'FAILED',
    lastError: 'Mailbox unavailable',
    lastAttemptAt: '2026-11-06T10:00:00Z',
    updatedAt: null,
    createdAt: null,
  },
];

const dispatchResults: AdminNewsletterDispatchLocaleResult[] = [
  {
    locale: 'en',
    rssUrl: null,
    itemKey: 'sent-post',
    postTitle: 'Sent campaign',
    sentCount: 2,
    failedCount: 0,
    skipped: false,
    reason: null,
  },
  {
    locale: 'tr',
    rssUrl: null,
    itemKey: null,
    postTitle: null,
    sentCount: 0,
    failedCount: 0,
    skipped: true,
    reason: 'no-new-items',
  },
];

const createProps = (overrides: Partial<NewsletterSectionProps> = {}): NewsletterSectionProps => ({
  t: key => key,
  formatSessionDate: value => value,
  newsletterErrorMessage: '',
  newsletterSuccessMessage: '',
  newsletterTab: 'overview',
  onNewsletterTabSelect: jest.fn(),
  isNewsletterDispatchRunning: false,
  onTriggerNewsletterDispatch: jest.fn(),
  newsletterDispatchTimestamp: '',
  newsletterDispatchResults: [],
  isNewsletterSummaryLoading: false,
  newsletterSubscriberSummary: { total: 3, active: 1, pending: 1, unsubscribed: 1 },
  isNewsletterCampaignsLoading: false,
  newsletterCampaigns: campaigns,
  newsletterCampaignThumbnails: { 'tr:partial-post': '/partial.webp' },
  renderAsyncSectionContent: ({ isLoading, loadingLabel, isEmpty, emptyMessage, children }) =>
    isLoading ? <p>{loadingLabel}</p> : isEmpty ? <p>{emptyMessage}</p> : children,
  onOpenNewsletterTest: jest.fn(),
  onViewNewsletterFailures: jest.fn(),
  newsletterFilterLocale: 'all',
  onNewsletterFilterLocaleChange: jest.fn(),
  newsletterFilterStatus: 'all',
  onNewsletterFilterStatusChange: jest.fn(),
  newsletterFilterQuery: '',
  onNewsletterFilterQueryChange: jest.fn(),
  newsletterListTopRef: React.createRef<HTMLDivElement>(),
  isNewsletterLoading: false,
  totalNewsletterSubscribers: subscribers.length,
  newsletterSubscribers: subscribers,
  updatingNewsletterEmail: '',
  deletingNewsletterEmail: '',
  onNewsletterStatusUpdate: jest.fn(),
  onOpenNewsletterDelete: jest.fn(),
  newsletterPage: 1,
  totalNewsletterPages: 2,
  newsletterPageSize: 10,
  onNewsletterPageChange: jest.fn(),
  onNewsletterPageSizeChange: jest.fn(),
  pendingNewsletterDelete: null,
  onCloseNewsletterDelete: jest.fn(),
  onDeleteNewsletterSubscriber: jest.fn(),
  selectedNewsletterCampaign: null,
  onCloseNewsletterFailures: jest.fn(),
  isNewsletterFailuresLoading: false,
  newsletterCampaignFailures: failures,
  newsletterFailuresTotal: failures.length,
  pendingNewsletterTestCampaign: null,
  onCloseNewsletterTest: jest.fn(),
  isNewsletterTestSending: false,
  newsletterTestEmail: '',
  onNewsletterTestEmailChange: jest.fn(),
  onSendNewsletterTestEmail: jest.fn(),
  ...overrides,
});

describe('AdminAccountNewsletterSection', () => {
  it('shows dispatch feedback, results, summary metrics, and campaign states', () => {
    const props = createProps({
      newsletterErrorMessage: 'Dispatch failed',
      newsletterSuccessMessage: 'Dispatch complete',
      newsletterDispatchTimestamp: '2026-11-07T10:00:00Z',
      newsletterDispatchResults: dispatchResults,
    });
    render(<AdminAccountNewsletterSection {...props} />);

    expect(screen.getByText('Dispatch failed')).toBeInTheDocument();
    expect(screen.getByText('Dispatch complete')).toBeInTheDocument();
    expect(screen.getAllByText('adminAccount.newsletter.operations.result.meta')).toHaveLength(2);
    expect(screen.getByText('adminAccount.newsletter.operations.result.skipped')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.operations.result.completed')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.operations.lastRun')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.summary.metrics.total')).toBeInTheDocument();
    expect(screen.getByText('Sent campaign')).toBeInTheDocument();
    expect(screen.getByText('Partial campaign')).toBeInTheDocument();
    expect(screen.getByText('Processing campaign')).toBeInTheDocument();
    expect(screen.getByText('Campaign summary')).toBeInTheDocument();
    expect(screen.getByAltText('Partial campaign')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.campaigns.statuses.sent')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.campaigns.statuses.partial')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.campaigns.statuses.processing')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.newsletter.operations.trigger' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.newsletter.campaigns.actions.sendTest' })[0]!);
    fireEvent.click(
      screen.getAllByRole('button', { name: 'adminAccount.newsletter.campaigns.actions.viewFailures' })[0]!,
    );
    expect(props.onTriggerNewsletterDispatch).toHaveBeenCalledTimes(1);
    expect(props.onOpenNewsletterTest).toHaveBeenCalledWith(campaigns[0]);
    expect(props.onViewNewsletterFailures).toHaveBeenCalledWith(campaigns[1]);
  });

  it('shows loading and empty overview states and disables an active dispatch', () => {
    const props = createProps({
      isNewsletterDispatchRunning: true,
      isNewsletterSummaryLoading: true,
      isNewsletterCampaignsLoading: true,
      newsletterCampaigns: [],
    });
    render(<AdminAccountNewsletterSection {...props} />);
    expect(screen.getByLabelText('adminAccount.newsletter.summary.loading')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.campaigns.loading')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'adminAccount.newsletter.operations.running' })).toBeDisabled();
    expect(screen.queryByText('adminAccount.newsletter.campaigns.empty')).not.toBeInTheDocument();
  });

  it('renders subscriber filters, locale/status variations, actions, and pagination', () => {
    const props = createProps({
      newsletterTab: 'subscribers',
      newsletterFilterLocale: 'en',
      newsletterFilterStatus: 'active',
      newsletterFilterQuery: 'reader',
      updatingNewsletterEmail: 'active@example.com',
      deletingNewsletterEmail: 'unsubscribed@example.com',
    });
    render(<AdminAccountNewsletterSection {...props} />);

    expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    expect(screen.getByText('active@example.com')).toBeInTheDocument();
    expect(screen.getByText('unsubscribed@example.com')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.list.updatedAt')).toBeInTheDocument();
    expect(screen.getByText('XX')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.actions.updating')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.actions.deleting')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('adminAccount.newsletter.filters.locale'), {
      target: { value: 'tr' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.newsletter.filters.status'), {
      target: { value: 'unsubscribed' },
    });
    fireEvent.change(screen.getByPlaceholderText('adminAccount.newsletter.filters.queryPlaceholder'), {
      target: { value: 'active' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.newsletter.filters.query' }));
    expect(props.onNewsletterFilterLocaleChange).toHaveBeenCalledWith('tr');
    expect(props.onNewsletterFilterStatusChange).toHaveBeenCalledWith('unsubscribed');
    expect(props.onNewsletterFilterQueryChange).toHaveBeenCalledWith('active');
    expect(props.onNewsletterFilterQueryChange).toHaveBeenCalledWith('');

    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.newsletter.actions.setActive' })[0]!);
    expect(props.onNewsletterStatusUpdate).toHaveBeenCalledWith(subscribers[0], 'active');
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.newsletter.actions.unsubscribe' })[0]!);
    expect(props.onNewsletterStatusUpdate).toHaveBeenCalledWith(subscribers[0], 'unsubscribed');
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.newsletter.actions.delete' })[0]!);
    expect(props.onOpenNewsletterDelete).toHaveBeenCalledWith(subscribers[0]);
  });

  it('shows subscriber empty/loading states and deletion, failure, and test-send dialogs', () => {
    const props = createProps({
      newsletterTab: 'subscribers',
      isNewsletterLoading: true,
      totalNewsletterSubscribers: 0,
      newsletterSubscribers: [],
      pendingNewsletterDelete: subscribers[0]!,
      selectedNewsletterCampaign: campaigns[1]!,
      pendingNewsletterTestCampaign: campaigns[1]!,
      newsletterTestEmail: 'test@example.com',
    });
    render(<AdminAccountNewsletterSection {...props} />);

    expect(screen.getByText('adminAccount.newsletter.loading')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.failures.total')).toBeInTheDocument();
    expect(screen.getByText('failed@example.com')).toBeInTheDocument();
    expect(screen.getByText('Mailbox unavailable')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.newsletter.testSend.title')).toBeInTheDocument();

    const modals = screen.getAllByRole('dialog');
    fireEvent.change(within(modals[2]!).getByLabelText('adminAccount.newsletter.testSend.emailLabel'), {
      target: { value: 'new@example.com' },
    });
    fireEvent.click(within(modals[2]!).getByRole('button', { name: 'adminAccount.newsletter.testSend.submit' }));
    fireEvent.click(within(modals[1]!).getByRole('button', { name: 'adminAccount.profile.avatar.crop.cancel' }));
    fireEvent.click(within(modals[0]!).getByRole('button', { name: 'adminAccount.newsletter.actions.delete' }));
    expect(props.onNewsletterTestEmailChange).toHaveBeenCalledWith('new@example.com');
    expect(props.onSendNewsletterTestEmail).toHaveBeenCalledTimes(1);
    expect(props.onCloseNewsletterFailures).toHaveBeenCalledTimes(1);
    expect(props.onDeleteNewsletterSubscriber).toHaveBeenCalledTimes(1);
  });
});
