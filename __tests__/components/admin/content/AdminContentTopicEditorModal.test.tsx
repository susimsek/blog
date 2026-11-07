import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminContentTopicEditorModal from '@/components/admin/content/AdminContentTopicEditorModal';
import type { ComponentProps } from 'react';

jest.mock('@fortawesome/react-fontawesome', () => ({ FontAwesomeIcon: () => null }));
jest.mock('@/components/common/FlagIcon', () => ({ __esModule: true, default: () => null }));

const makeProps = (
  overrides: Partial<ComponentProps<typeof AdminContentTopicEditorModal>> = {},
): ComponentProps<typeof AdminContentTopicEditorModal> => ({
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
  id: 'sports',
  onIDChange: jest.fn(),
  isIDInvalid: false,
  name: 'Sports',
  onNameChange: jest.fn(),
  color: 'green',
  onColorChange: jest.fn(),
  link: '/sports',
  onLinkChange: jest.fn(),
  canSubmit: true,
  onSubmit: jest.fn(),
  onHide: jest.fn(),
  ...overrides,
});

describe('AdminContentTopicEditorModal', () => {
  it('renders create fields and dispatches locale, field, submit, and cancel actions', () => {
    const props = makeProps({ isIDInvalid: true });
    render(<AdminContentTopicEditorModal {...props} />);

    expect(screen.getByText('adminAccount.content.modals.topic.createTitle')).toBeInTheDocument();
    expect(screen.getByText('adminAccount.content.validation.id')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'TR' }));
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.topic.id'), {
      target: { value: 'anime' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.topic.name'), {
      target: { value: 'Anime' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.topic.color'), {
      target: { value: 'purple' },
    });
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.topic.link'), {
      target: { value: '/anime' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.content.actions.createTopic' }));
    fireEvent.click(screen.getByRole('button', { name: 'adminAccount.profile.avatar.crop.cancel' }));

    expect(props.onSwitchLocale).toHaveBeenCalledWith('tr');
    expect(props.onIDChange).toHaveBeenCalledWith('anime');
    expect(props.onNameChange).toHaveBeenCalledWith('Anime');
    expect(props.onColorChange).toHaveBeenCalledWith('purple');
    expect(props.onLinkChange).toHaveBeenCalledWith('/anime');
    expect(props.onSubmit).toHaveBeenCalled();
    expect(props.onHide).toHaveBeenCalled();
  });

  it('handles locale dropdown and disables update actions while submitting', () => {
    const createProps = makeProps({ localeTabs: [] });
    const { rerender } = render(<AdminContentTopicEditorModal {...createProps} />);
    fireEvent.change(screen.getByLabelText('adminAccount.content.modals.topic.locale'), {
      target: { value: 'other' },
    });
    expect(createProps.onLocaleChange).toHaveBeenCalledWith('en');

    const updateProps = makeProps({ mode: 'update', localeTabs: [], isSubmitting: true, canSubmit: false });
    rerender(<AdminContentTopicEditorModal {...updateProps} />);

    expect(screen.getByText('adminAccount.content.modals.topic.updateTitle')).toBeInTheDocument();
    expect(screen.getByLabelText('adminAccount.content.modals.topic.locale')).toBeDisabled();
    expect(screen.getByLabelText('adminAccount.content.modals.topic.id')).toBeDisabled();
    expect(screen.getByText('adminAccount.content.actions.saving')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'adminAccount.profile.avatar.crop.cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'adminAccount.content.actions.saving' })).toBeDisabled();
  });
});
