import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminAccountProfileSection from '@/components/admin/account/AdminAccountProfileSection';
import type { AdminSessionProfile } from '@/lib/adminSessionProfileCache';
import type { ComponentProps } from 'react';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => null }));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

const adminUser: AdminSessionProfile = {
  id: 'admin-1',
  name: 'Admin Name',
  username: 'admin',
  avatarUrl: null,
  email: 'admin@example.com',
  pendingEmail: null,
  pendingEmailExpiresAt: null,
  googleLinked: false,
  googleEmail: null,
  googleLinkedAt: null,
  githubLinked: false,
  githubEmail: null,
  githubLinkedAt: null,
  roles: ['admin'],
};
const makeProps = (
  overrides: Partial<ComponentProps<typeof AdminAccountProfileSection>> = {},
): ComponentProps<typeof AdminAccountProfileSection> => ({
  adminUser,
  t: key => key,
  profileAvatarURL: '',
  profileName: '',
  profileUsername: '',
  profileRoles: '',
  nameErrorMessage: '',
  avatarErrorMessage: '',
  nameSuccessMessage: '',
  avatarSuccessMessage: '',
  maxAvatarFileSizeMb: 5,
  isAvatarSubmitting: false,
  avatarPendingAction: null,
  avatarFileInputRef: React.createRef<HTMLInputElement>(),
  onOpenAvatarPicker: jest.fn(),
  onRemoveAvatar: jest.fn(),
  onAvatarFileChange: jest.fn(),
  handleNameSubmit: jest.fn(),
  nameInput: 'Admin Name',
  onNameInputChange: jest.fn(),
  clearNameFeedback: jest.fn(),
  showNameValidationError: false,
  nameValidationError: 'Invalid name',
  minNameLength: 2,
  maxNameLength: 50,
  isNameSubmitting: false,
  ...overrides,
});

describe('AdminAccountProfileSection', () => {
  it('shows default avatar and profile fallbacks and handles name and file changes', () => {
    const props = makeProps({
      nameErrorMessage: 'Name failed',
      avatarErrorMessage: 'Avatar failed',
      nameSuccessMessage: 'Name saved',
      avatarSuccessMessage: 'Avatar saved',
      showNameValidationError: true,
    });
    render(<AdminAccountProfileSection {...props} />);

    expect(screen.getByText('Name failed')).toBeInTheDocument();
    expect(screen.getByText('Avatar failed')).toBeInTheDocument();
    expect(screen.getByText('Name saved')).toBeInTheDocument();
    expect(screen.getByText('Avatar saved')).toBeInTheDocument();
    expect(screen.getByText('Invalid name')).toHaveClass('d-block');
    expect(screen.getByText('adminAccount.profile.avatar.states.default')).toBeInTheDocument();
    expect(screen.getAllByText('adminAccount.profile.notSet')).toHaveLength(3);

    fireEvent.change(screen.getByLabelText('adminAccount.profile.name.label'), { target: { value: 'New Name' } });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.profile.avatar.edit' }));
    fireEvent.change(document.querySelector('input[type="file"]')!, {
      target: { files: [new File(['image'], 'avatar.png', { type: 'image/png' })] },
    });
    fireEvent.submit(screen.getByLabelText('adminAccount.profile.name.label').closest('form')!);

    expect(props.onNameInputChange).toHaveBeenCalledWith('New Name');
    expect(props.clearNameFeedback).toHaveBeenCalled();
    expect(props.onOpenAvatarPicker).toHaveBeenCalled();
    expect(props.onAvatarFileChange).toHaveBeenCalled();
    expect(props.handleNameSubmit).toHaveBeenCalled();
  });

  it('renders custom avatar and upload or removal progress states', () => {
    const props = makeProps({
      profileAvatarURL: '/avatar.webp',
      profileName: '',
      profileUsername: '',
      isAvatarSubmitting: true,
      avatarPendingAction: 'upload',
      isNameSubmitting: true,
    });
    const { rerender } = render(<AdminAccountProfileSection {...props} />);

    expect(screen.getByAltText('admin@example.com')).toHaveAttribute('src', '/avatar.webp');
    expect(screen.getByText('adminAccount.profile.avatar.uploading')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'adminAccount.profile.avatar.uploading' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'adminAccount.profile.name.submitting' })).toBeDisabled();
    expect(screen.getByText('adminAccount.profile.avatar.states.custom')).toBeInTheDocument();

    rerender(<AdminAccountProfileSection {...props} avatarPendingAction="remove" />);
    expect(screen.getByRole('button', { name: 'adminAccount.profile.avatar.remove' })).toBeDisabled();
  });
});
