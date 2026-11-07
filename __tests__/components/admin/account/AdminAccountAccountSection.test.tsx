import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminAccountAccountSection from '@/components/admin/account/AdminAccountAccountSection';
import type { ComponentProps } from 'react';

const t = (key: string) => key;
const makeProps = (
  overrides: Partial<ComponentProps<typeof AdminAccountAccountSection>> = {},
): ComponentProps<typeof AdminAccountAccountSection> => ({
  t,
  usernameErrorMessage: '',
  usernameSuccessMessage: '',
  handleUsernameSubmit: jest.fn(),
  usernameInput: 'reader-name',
  onUsernameInputChange: jest.fn(),
  clearUsernameFeedback: jest.fn(),
  showUsernameValidationError: false,
  usernameValidationError: 'Invalid username',
  minUsernameLength: 3,
  maxUsernameLength: 30,
  isUsernameSubmitting: false,
  deleteErrorMessage: '',
  deleteSuccessMessage: '',
  handleDeleteSubmit: jest.fn(),
  deleteCurrentPassword: 'password',
  onDeleteCurrentPasswordChange: jest.fn(),
  deleteConfirmation: 'DELETE',
  onDeleteConfirmationChange: jest.fn(),
  clearDeleteFeedback: jest.fn(),
  showDeletePassword: false,
  onToggleDeletePassword: jest.fn(),
  showDeletePasswordError: false,
  deletePasswordError: 'Password required',
  showDeleteConfirmError: false,
  deleteConfirmError: 'Confirmation required',
  deleteConfirmationValue: 'DELETE',
  isDeleteSubmitting: false,
  ...overrides,
});

describe('AdminAccountAccountSection', () => {
  it('renders feedback and validation, handles input changes and password visibility', () => {
    const props = makeProps({
      usernameErrorMessage: 'Username failed',
      usernameSuccessMessage: 'Username saved',
      showUsernameValidationError: true,
      isUsernameSubmitting: true,
      deleteErrorMessage: 'Delete failed',
      deleteSuccessMessage: 'Account deleted',
      showDeletePassword: true,
      isDeleteSubmitting: true,
      showDeletePasswordError: true,
      showDeleteConfirmError: true,
    });
    render(<AdminAccountAccountSection {...props} />);

    expect(screen.getByText('Username failed')).toBeInTheDocument();
    expect(screen.getByText('Username saved')).toBeInTheDocument();
    expect(screen.getByText('Delete failed')).toBeInTheDocument();
    expect(screen.getByText('Account deleted')).toBeInTheDocument();
    expect(screen.getByText('Invalid username')).toHaveClass('d-block');
    expect(screen.getByLabelText('adminAccount.form.hidePassword')).toBeInTheDocument();
    expect(screen.getByLabelText('adminAccount.account.delete.currentPassword')).toHaveAttribute('type', 'text');
    expect(screen.getByText('Password required')).toHaveClass('d-block');
    expect(screen.getByText('Confirmation required')).toHaveClass('d-block');
    expect(screen.getByRole('button', { name: 'adminAccount.account.username.submitting' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'adminAccount.account.delete.submitting' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('adminAccount.account.username.label'), { target: { value: 'new-name' } });
    fireEvent.change(screen.getByLabelText('adminAccount.account.delete.currentPassword'), {
      target: { value: 'new-password' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.account.delete.confirmLabel'), {
      target: { value: 'DELETE-ACCOUNT' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.form.hidePassword' }));
    fireEvent.submit(screen.getByLabelText('adminAccount.account.username.label').closest('form')!);
    fireEvent.submit(screen.getByLabelText('adminAccount.account.delete.confirmLabel').closest('form')!);

    expect(props.onUsernameInputChange).toHaveBeenCalledWith('new-name');
    expect(props.clearUsernameFeedback).toHaveBeenCalled();
    expect(props.onDeleteCurrentPasswordChange).toHaveBeenCalledWith('new-password');
    expect(props.onDeleteConfirmationChange).toHaveBeenCalledWith('DELETE-ACCOUNT');
    expect(props.clearDeleteFeedback).toHaveBeenCalledTimes(2);
    expect(props.onToggleDeletePassword).toHaveBeenCalled();
    expect(props.handleUsernameSubmit).toHaveBeenCalled();
    expect(props.handleDeleteSubmit).toHaveBeenCalled();
  });

  it('shows non-submitting controls and the password visibility prompt', () => {
    render(<AdminAccountAccountSection {...makeProps()} />);

    expect(screen.getByLabelText('adminAccount.form.showPassword')).toBeInTheDocument();
    expect(screen.getByLabelText('adminAccount.account.delete.currentPassword')).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'adminAccount.account.username.submit' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'adminAccount.account.delete.submit' })).toBeEnabled();
  });
});
