'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import { changeAdminUsername, deleteAdminAccount, isAdminSessionError, resolveAdminError } from '@/lib/adminApi';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import type { AdminIdentity } from './adminAccountShared';
import {
  DELETE_CONFIRMATION_VALUE,
  MAX_USERNAME_LENGTH,
  MIN_USERNAME_LENGTH,
  USERNAME_PATTERN,
} from './adminAccountShared';

type UseAdminAccountAccountSectionParams = {
  adminUser: AdminIdentity;
  usernameInput: string;
  setUsernameInput: React.Dispatch<React.SetStateAction<string>>;
  syncAdminUser: (nextUser: AdminIdentity) => void;
  onSessionExpired: () => void;
  successMessageAutoHideMs: number;
  t: TFunction;
};

export default function useAdminAccountAccountSection({
  adminUser,
  usernameInput,
  setUsernameInput,
  syncAdminUser,
  onSessionExpired,
  successMessageAutoHideMs,
  t,
}: UseAdminAccountAccountSectionParams) {
  const [isUsernameSubmitting, setIsUsernameSubmitting] = React.useState(false);
  const [usernameSubmitted, setUsernameSubmitted] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [usernameSuccessMessage, setUsernameSuccessMessage] = React.useState('');
  const [deleteCurrentPassword, setDeleteCurrentPassword] = React.useState('');
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const [showDeletePassword, setShowDeletePassword] = React.useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = React.useState(false);
  const [deleteSubmitted, setDeleteSubmitted] = React.useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = React.useState('');
  const [deleteSuccessMessage, setDeleteSuccessMessage] = React.useState('');

  useAutoClearValue(usernameSuccessMessage, setUsernameSuccessMessage, successMessageAutoHideMs);
  useAutoClearValue(deleteSuccessMessage, setDeleteSuccessMessage, successMessageAutoHideMs);

  const resolvedUsernameInput = usernameInput.trim();
  const profileUsername = adminUser?.username?.trim() ?? '';
  const isUsernameDirty = resolvedUsernameInput.toLowerCase() !== profileUsername.toLowerCase();
  const usernameValidationError =
    resolvedUsernameInput === ''
      ? t('adminAccount.validation.usernameRequired', { ns: 'admin-account' })
      : resolvedUsernameInput.length < MIN_USERNAME_LENGTH || resolvedUsernameInput.length > MAX_USERNAME_LENGTH
        ? t('adminAccount.validation.usernameLength', {
            ns: 'admin-account',
            min: MIN_USERNAME_LENGTH,
            max: MAX_USERNAME_LENGTH,
          })
        : !USERNAME_PATTERN.test(resolvedUsernameInput)
          ? t('adminAccount.validation.usernamePattern', { ns: 'admin-account' })
          : profileUsername.toLowerCase() === resolvedUsernameInput.toLowerCase()
            ? t('adminAccount.validation.usernameDifferent', { ns: 'admin-account' })
            : '';
  const showUsernameValidationError = (usernameSubmitted || isUsernameDirty) && usernameValidationError !== '';
  const deletePasswordError =
    deleteCurrentPassword === '' ? t('adminAccount.validation.currentPasswordRequired', { ns: 'admin-account' }) : '';
  const deleteConfirmError =
    deleteConfirmation.trim().toUpperCase() !== DELETE_CONFIRMATION_VALUE
      ? t('adminAccount.validation.deleteConfirmation', { ns: 'admin-account', value: DELETE_CONFIRMATION_VALUE })
      : '';
  const showDeletePasswordError = deleteSubmitted && deletePasswordError !== '';
  const showDeleteConfirmError = deleteSubmitted && deleteConfirmError !== '';

  const clearUsernameFeedback = React.useCallback(() => {
    if (usernameErrorMessage) {
      setUsernameErrorMessage('');
    }
    if (usernameSuccessMessage) {
      setUsernameSuccessMessage('');
    }
  }, [usernameErrorMessage, usernameSuccessMessage]);

  const clearDeleteFeedback = React.useCallback(() => {
    if (deleteErrorMessage) {
      setDeleteErrorMessage('');
    }
    if (deleteSuccessMessage) {
      setDeleteSuccessMessage('');
    }
  }, [deleteErrorMessage, deleteSuccessMessage]);

  const handleUsernameSubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isUsernameSubmitting) {
        return;
      }

      setUsernameSubmitted(true);
      setUsernameErrorMessage('');
      setUsernameSuccessMessage('');
      if (usernameValidationError) {
        return;
      }

      setIsUsernameSubmitting(true);
      try {
        const payload = await changeAdminUsername({ newUsername: resolvedUsernameInput });
        if (!payload.success) {
          throw new Error(t('adminAccount.account.errors.usernameUpdate', { ns: 'admin-account' }));
        }

        const nextUsername = payload.user?.username ?? resolvedUsernameInput;
        const updatedUser: AdminIdentity =
          payload.user ??
          (adminUser
            ? {
                ...adminUser,
                username: nextUsername,
              }
            : null);

        syncAdminUser(updatedUser);
        setUsernameInput(nextUsername);
        setUsernameSubmitted(false);
        setUsernameSuccessMessage(t('adminAccount.account.success.usernameUpdated', { ns: 'admin-account' }));
        globalThis.dispatchEvent(new CustomEvent('admin:user-updated', { detail: { user: updatedUser } }));
      } catch (error) {
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setUsernameErrorMessage(
          resolvedError.message || t('adminAccount.account.errors.usernameUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setIsUsernameSubmitting(false);
      }
    },
    [
      adminUser,
      isUsernameSubmitting,
      onSessionExpired,
      resolvedUsernameInput,
      setUsernameInput,
      syncAdminUser,
      t,
      usernameValidationError,
    ],
  );

  const handleDeleteSubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isDeleteSubmitting) {
        return;
      }

      setDeleteSubmitted(true);
      setDeleteErrorMessage('');
      setDeleteSuccessMessage('');
      if (deletePasswordError || deleteConfirmError) {
        return;
      }

      setIsDeleteSubmitting(true);
      try {
        const payload = await deleteAdminAccount({ currentPassword: deleteCurrentPassword });
        if (!payload.success) {
          throw new Error(t('adminAccount.account.errors.deleteAccount', { ns: 'admin-account' }));
        }

        setDeleteSuccessMessage(t('adminAccount.account.success.deleted', { ns: 'admin-account' }));
        globalThis.setTimeout(() => {
          onSessionExpired();
        }, 900);
      } catch (error) {
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setDeleteErrorMessage(
          resolvedError.message || t('adminAccount.account.errors.deleteAccount', { ns: 'admin-account' }),
        );
      } finally {
        setIsDeleteSubmitting(false);
      }
    },
    [deleteConfirmError, deleteCurrentPassword, deletePasswordError, isDeleteSubmitting, onSessionExpired, t],
  );

  return {
    usernameErrorMessage,
    usernameSuccessMessage,
    handleUsernameSubmit,
    clearUsernameFeedback,
    showUsernameValidationError,
    usernameValidationError,
    minUsernameLength: MIN_USERNAME_LENGTH,
    maxUsernameLength: MAX_USERNAME_LENGTH,
    isUsernameSubmitting,
    deleteErrorMessage,
    deleteSuccessMessage,
    handleDeleteSubmit,
    deleteCurrentPassword,
    setDeleteCurrentPassword,
    deleteConfirmation,
    setDeleteConfirmation,
    clearDeleteFeedback,
    showDeletePassword,
    toggleDeletePassword: () => setShowDeletePassword(previous => !previous),
    showDeletePasswordError,
    deletePasswordError,
    showDeleteConfirmError,
    deleteConfirmError,
    deleteConfirmationValue: DELETE_CONFIRMATION_VALUE,
    isDeleteSubmitting,
  };
}
