import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminContentCategoryEditorModal from '@/components/admin/content/AdminContentCategoryEditorModal';
import type { ComponentProps } from 'react';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => null }));
jest.mock('@/components/common/FlagIcon', () => ({ __esModule: true, default: () => null }));

const makeProps = (
  overrides: Partial<ComponentProps<typeof AdminContentCategoryEditorModal>> = {},
): ComponentProps<typeof AdminContentCategoryEditorModal> => ({
  t: key => key,
  isOpen: true,
  isSubmitting: false,
  mode: 'create',
  localeTabs: [
    { locale: 'en', available: true },
    { locale: 'tr', available: false },
  ],
  locale: 'en',
  onSwitchLocale: jest.fn(),
  onLocaleChange: jest.fn(),
  resolveLocaleLabel: value => value,
  id: 'games',
  onIDChange: jest.fn(),
  isIDInvalid: false,
  name: 'Games',
  onNameChange: jest.fn(),
  color: 'blue',
  onColorChange: jest.fn(),
  icon: 'gamepad',
  onIconChange: jest.fn(),
  link: '/games',
  onLinkChange: jest.fn(),
  canSubmit: true,
  onSubmit: jest.fn(),
  onHide: jest.fn(),
  ...overrides,
});

describe('AdminContentCategoryEditorModal', () => {
  it('renders create fields and routes locale, field, submit, and cancel actions', () => {
    const props = makeProps({ isIDInvalid: true });
    render(<AdminContentCategoryEditorModal {...props} />);

    expect(screen.getByText('adminAccount.content.modals.category.createTitle')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.validation.id')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'TR' }));
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.category.id'), {
      target: { value: 'sports' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.category.name'), {
      target: { value: 'Sports' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.category.color'), {
      target: { value: 'green' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.category.icon'), {
      target: { value: 'trophy' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.category.link'), {
      target: { value: '/sports' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.actions.createCategory' }));
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.profile.avatar.crop.cancel' }));

    expect(props.onSwitchLocale).toHaveBeenCalledWith('tr');
    expect(props.onIDChange).toHaveBeenCalledWith('sports');
    expect(props.onNameChange).toHaveBeenCalledWith('Sports');
    expect(props.onColorChange).toHaveBeenCalledWith('green');
    expect(props.onIconChange).toHaveBeenCalledWith('trophy');
    expect(props.onLinkChange).toHaveBeenCalledWith('/sports');
    expect(props.onSubmit).toHaveBeenCalled();
    expect(props.onHide).toHaveBeenCalled();
  });

  it('supports locale selection and update-mode submitting state without locale tabs', () => {
    const props = makeProps({
      localeTabs: [],
      locale: 'en',
      onLocaleChange: jest.fn(),
      mode: 'update',
      isSubmitting: true,
      canSubmit: false,
    });
    render(<AdminContentCategoryEditorModal {...props} />);

    expect(screen.getByText('adminAccount.content.modals.category.updateTitle')).toBeInTheDocument();
    expect(screen.getByLabelText('adminAccount.content.modals.category.locale')).toBeDisabled();
    expect(screen.getByLabelText('adminAccount.content.modals.category.id')).toBeDisabled();
    expect(screen.getByText('adminAccount.content.actions.saving')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'adminAccount.profile.avatar.crop.cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'adminAccount.content.actions.saving' })).toBeDisabled();
  });

  it('normalizes locale selection when creating without locale tabs', () => {
    const props = makeProps({ localeTabs: [] });
    render(<AdminContentCategoryEditorModal {...props} />);

    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.category.locale'), {
      target: { value: 'tr' },
    });

    expect(props.onLocaleChange).toHaveBeenCalledWith('tr');
  });
});
