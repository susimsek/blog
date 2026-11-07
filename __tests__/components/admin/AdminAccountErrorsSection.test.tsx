import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminAccountErrorsSection from '@/components/admin/account/AdminAccountErrorsSection';
import type { AdminErrorMessageItem } from '@/lib/adminApi';

type ErrorsSectionProps = React.ComponentProps<typeof AdminAccountErrorsSection>;

const errorMessages: AdminErrorMessageItem[] = [
  { scope: 'admin_graphql', locale: 'en', code: 'AUTH_REQUIRED', message: 'Sign in again', updatedAt: '2026-11-01' },
  { scope: 'admin_graphql', locale: 'tr', code: 'RATE_LIMIT', message: 'Try later', updatedAt: null },
  { scope: 'admin_graphql', locale: 'fr', code: 'UNKNOWN', message: 'Unknown locale', updatedAt: null },
];

const createProps = (overrides: Partial<ErrorsSectionProps> = {}): ErrorsSectionProps => ({
  t: key => key,
  formatSessionDate: value => value,
  errorMessagesErrorMessage: '',
  errorMessagesSuccessMessage: '',
  isErrorMessagesLoading: false,
  isErrorCreateSubmitting: false,
  isErrorUpdateSubmitting: false,
  isErrorDeleteSubmitting: false,
  onOpenCreateErrorMessage: jest.fn(),
  errorMessagesListTopRef: React.createRef<HTMLDivElement>(),
  errorFilterLocale: 'all',
  onErrorFilterLocaleChange: jest.fn(),
  errorFilterQuery: '',
  onErrorFilterQueryChange: jest.fn(),
  onClearErrorFilterQuery: jest.fn(),
  totalErrorMessages: 0,
  errorMessages: [],
  deletingErrorMessageKey: '',
  getErrorMessageKey: item => `${item.scope}|${item.locale}|${item.code}`,
  onSelectErrorMessage: jest.fn(),
  onOpenUpdateErrorMessage: jest.fn(),
  onOpenDeleteErrorMessage: jest.fn(),
  errorMessagesPage: 1,
  totalErrorMessagePages: 1,
  errorMessagesPageSize: 10,
  onErrorMessagesPageChange: jest.fn(),
  onErrorMessagesPageSizeChange: jest.fn(),
  isErrorEditorModalOpen: false,
  onCloseErrorEditor: jest.fn(),
  errorCrudTab: 'create',
  selectedErrorMessage: null,
  errorCreateLocale: 'en',
  onErrorCreateLocaleChange: jest.fn(),
  errorCreateCode: '',
  onErrorCreateCodeChange: jest.fn(),
  normalizedErrorCreateCode: '',
  isErrorCreateCodeValid: false,
  errorCreateMessage: '',
  onErrorCreateMessageChange: jest.fn(),
  errorUpdateMessage: '',
  onErrorUpdateMessageChange: jest.fn(),
  canCreateErrorMessage: false,
  canUpdateErrorMessage: false,
  onCreateErrorMessageSubmit: jest.fn(),
  onUpdateErrorMessageSubmit: jest.fn(),
  pendingErrorMessageDelete: null,
  onCloseDeleteErrorMessage: jest.fn(),
  onDeleteErrorMessageSubmit: jest.fn(),
  ...overrides,
});

describe('AdminAccountErrorsSection', () => {
  it('shows the loading and empty states and disables create during loading', () => {
    const { rerender } = render(<AdminAccountErrorsSection {...createProps({ isErrorMessagesLoading: true })} />);
    expect(screen.getByLabelText('adminAccount.errorsCatalog.loading')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'adminAccount.errorsCatalog.actions.create' })).toBeDisabled();

    rerender(<AdminAccountErrorsSection {...createProps()} />);
    expect(screen.getByText('adminAccount.errorsCatalog.empty')).toBeInTheDocument();
  });

  it('renders localized records, feedback, filters, actions, and pagination', () => {
    const props = createProps({
      errorMessagesErrorMessage: 'Load failed',
      errorMessagesSuccessMessage: 'Saved',
      errorFilterQuery: 'auth',
      totalErrorMessages: 12,
      totalErrorMessagePages: 2,
      errorMessagesPage: 1,
      errorMessages,
      isErrorDeleteSubmitting: true,
      deletingErrorMessageKey: 'admin_graphql|en|AUTH_REQUIRED',
    });
    render(<AdminAccountErrorsSection {...props} />);

    expect(screen.getByText('Load failed')).toBeInTheDocument();
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('AUTH_REQUIRED')).toBeInTheDocument();
    expect(screen.getByText('RATE_LIMIT')).toBeInTheDocument();
    expect(screen.getByText('FR')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.errorsCatalog.list.updatedAt')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.errorsCatalog.actions.deleting')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('adminAccount.errorsCatalog.filters.locale'), {
      target: { value: 'tr' },
    });
    fireEvent.change(screen.getByPlaceholderText('adminAccount.errorsCatalog.filters.queryPlaceholder'), {
      target: { value: 'rate' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.errorsCatalog.filters.query' }));
    expect(props.onErrorFilterLocaleChange).toHaveBeenCalledWith('tr');
    expect(props.onErrorFilterQueryChange).toHaveBeenCalledWith('rate');
    expect(props.onClearErrorFilterQuery).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /AUTH_REQUIRED/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.errorsCatalog.actions.update' })[0]!);
    expect(props.onSelectErrorMessage).toHaveBeenCalledWith(errorMessages[0]);
    expect(props.onOpenUpdateErrorMessage).toHaveBeenCalledWith(errorMessages[0]);
  });

  it('renders create and update editors, including validation, empty selection, and submit actions', () => {
    const createPropsWithModal = createProps({
      isErrorEditorModalOpen: true,
      normalizedErrorCreateCode: 'bad-code',
      isErrorCreateCodeValid: false,
      canCreateErrorMessage: true,
      errorCreateCode: 'bad-code',
      errorCreateMessage: 'Message body',
    });
    const { rerender } = render(<AdminAccountErrorsSection {...createPropsWithModal} />);

    expect(screen.getByText('adminAccount.errorsCatalog.create.codeValidation')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('adminAccount.errorsCatalog.create.code'), {
      target: { value: 'VALID_CODE' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.errorsCatalog.create.locale'), {
      target: { value: 'tr' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.errorsCatalog.create.message'), {
      target: { value: 'Updated copy' },
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.errorsCatalog.actions.create' })[1]!);
    expect(createPropsWithModal.onErrorCreateCodeChange).toHaveBeenCalledWith('VALID_CODE');
    expect(createPropsWithModal.onErrorCreateLocaleChange).toHaveBeenCalledWith('tr');
    expect(createPropsWithModal.onErrorCreateMessageChange).toHaveBeenCalledWith('Updated copy');
    expect(createPropsWithModal.onCreateErrorMessageSubmit).toHaveBeenCalledTimes(1);

    rerender(
      <AdminAccountErrorsSection
        {...createProps({
          isErrorEditorModalOpen: true,
          errorCrudTab: 'update',
          selectedErrorMessage: errorMessages[0],
          errorUpdateMessage: 'New text',
          canUpdateErrorMessage: true,
          isErrorUpdateSubmitting: true,
        })}
      />,
    );
    expect(screen.getByText('AUTH_REQUIRED')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.errorsCatalog.actions.updating')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('adminAccount.errorsCatalog.update.message'), {
      target: { value: 'Changed' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.errorsCatalog.actions.updating' }));
  });

  it('shows empty update and delete dialogs and forwards confirmation actions', () => {
    const props = createProps({
      isErrorEditorModalOpen: true,
      errorCrudTab: 'update',
      pendingErrorMessageDelete: errorMessages[1]!,
      totalErrorMessages: 1,
      errorMessages: [errorMessages[0]!],
    });
    render(<AdminAccountErrorsSection {...props} />);
    expect(screen.getByText('adminAccount.errorsCatalog.update.empty')).toBeInTheDocument();
    expect(screen.getByText('RATE_LIMIT')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.errorsCatalog.actions.delete' })[0]!);
    expect(props.onOpenDeleteErrorMessage).toHaveBeenCalledWith(errorMessages[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.errorsCatalog.actions.delete' }).at(-1)!);
    expect(props.onDeleteErrorMessageSubmit).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getAllByRole('button', { name: 'adminAccount.profile.avatar.crop.cancel' }).at(-1)!);
    expect(props.onCloseDeleteErrorMessage).toHaveBeenCalledTimes(1);
  });
});
