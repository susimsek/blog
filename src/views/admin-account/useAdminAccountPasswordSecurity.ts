'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import { changeAdminPassword, isAdminSessionError, resolveAdminError } from '@/lib/adminApi';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import { getAdminPasswordStrength, MIN_PASSWORD_LENGTH } from '@/lib/adminPassword';

type UseAdminAccountPasswordSecurityParams = {
  onSessionExpired: () => void;
  successMessageAutoHideMs: number;
  t: TFunction;
};

export default function useAdminAccountPasswordSecurity({
  onSessionExpired,
  successMessageAutoHideMs,
  t,
}: UseAdminAccountPasswordSecurityParams) {
  const [isSecuritySubmitting, setIsSecuritySubmitting] = React.useState(false);
  const [securityErrorMessage, setSecurityErrorMessage] = React.useState('');
  const [securitySuccessMessage, setSecuritySuccessMessage] = React.useState('');
  const [hasSecuritySubmitted, setHasSecuritySubmitted] = React.useState(false);
  const [securityTouchedFields, setSecurityTouchedFields] = React.useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSecurityPasswordExpanded, setIsSecurityPasswordExpanded] = React.useState(false);

  useAutoClearValue(securitySuccessMessage, setSecuritySuccessMessage, successMessageAutoHideMs);

  const securityCurrentPasswordError =
    currentPassword === '' ? t('adminAccount.validation.currentPasswordRequired', { ns: 'admin-account' }) : '';
  const securityNewPasswordError =
    newPassword === ''
      ? t('adminAccount.validation.newPasswordRequired', { ns: 'admin-account' })
      : newPassword.length < MIN_PASSWORD_LENGTH
        ? t('adminAccount.validation.newPasswordMin', { ns: 'admin-account', count: MIN_PASSWORD_LENGTH })
        : currentPassword !== '' && currentPassword === newPassword
          ? t('adminAccount.validation.newPasswordDifferent', { ns: 'admin-account' })
          : '';
  const securityConfirmPasswordError =
    confirmPassword === ''
      ? t('adminAccount.validation.confirmPasswordRequired', { ns: 'admin-account' })
      : confirmPassword !== newPassword
        ? t('adminAccount.validation.confirmPasswordMismatch', { ns: 'admin-account' })
        : '';
  const passwordStrength = getAdminPasswordStrength(newPassword);
  const showCurrentPasswordError =
    (hasSecuritySubmitted || securityTouchedFields.currentPassword) && securityCurrentPasswordError !== '';
  const showNewPasswordError =
    (hasSecuritySubmitted || securityTouchedFields.newPassword) && securityNewPasswordError !== '';
  const showConfirmPasswordError =
    (hasSecuritySubmitted || securityTouchedFields.confirmPassword) && securityConfirmPasswordError !== '';

  const clearSecuritySuccessMessage = React.useCallback(() => {
    if (securitySuccessMessage) {
      setSecuritySuccessMessage('');
    }
  }, [securitySuccessMessage]);

  const handleCurrentPasswordChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentPassword(event.currentTarget.value);
      setSecurityTouchedFields(previous => ({ ...previous, currentPassword: true }));
      if (securityErrorMessage) {
        setSecurityErrorMessage('');
      }
      clearSecuritySuccessMessage();
    },
    [clearSecuritySuccessMessage, securityErrorMessage],
  );

  const handleNewPasswordChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setNewPassword(event.currentTarget.value);
      setSecurityTouchedFields(previous => ({ ...previous, newPassword: true }));
      if (securityErrorMessage) {
        setSecurityErrorMessage('');
      }
      clearSecuritySuccessMessage();
    },
    [clearSecuritySuccessMessage, securityErrorMessage],
  );

  const handleConfirmPasswordChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setConfirmPassword(event.currentTarget.value);
      setSecurityTouchedFields(previous => ({ ...previous, confirmPassword: true }));
      if (securityErrorMessage) {
        setSecurityErrorMessage('');
      }
      clearSecuritySuccessMessage();
    },
    [clearSecuritySuccessMessage, securityErrorMessage],
  );

  const handleSecuritySubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSecuritySubmitting) {
        return;
      }

      setHasSecuritySubmitted(true);
      setSecurityErrorMessage('');
      setSecuritySuccessMessage('');

      if (securityCurrentPasswordError || securityNewPasswordError || securityConfirmPasswordError) {
        return;
      }

      setIsSecuritySubmitting(true);
      try {
        const payload = await changeAdminPassword({
          currentPassword,
          newPassword,
          confirmPassword,
        });

        if (!payload.success) {
          throw new Error(t('adminAccount.errorFallback', { ns: 'admin-account' }));
        }

        setSecuritySuccessMessage(t('adminAccount.success', { ns: 'admin-account' }));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setHasSecuritySubmitted(false);
        setSecurityTouchedFields({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false,
        });
        globalThis.setTimeout(() => {
          onSessionExpired();
        }, 900);
      } catch (error) {
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setSecurityErrorMessage(resolvedError.message || t('adminAccount.errorFallback', { ns: 'admin-account' }));
      } finally {
        setIsSecuritySubmitting(false);
      }
    },
    [
      confirmPassword,
      currentPassword,
      isSecuritySubmitting,
      newPassword,
      onSessionExpired,
      securityConfirmPasswordError,
      securityCurrentPasswordError,
      securityNewPasswordError,
      t,
    ],
  );

  return {
    securityErrorMessage,
    securitySuccessMessage,
    clearSecuritySuccessMessage,
    isSecurityPasswordExpanded,
    toggleSecurityPasswordExpanded: () => setIsSecurityPasswordExpanded(previous => !previous),
    handleSecuritySubmit,
    currentPassword,
    newPassword,
    confirmPassword,
    handleCurrentPasswordChange,
    handleNewPasswordChange,
    handleConfirmPasswordChange,
    showCurrentPassword,
    showNewPassword,
    showConfirmPassword,
    toggleCurrentPassword: () => setShowCurrentPassword(previous => !previous),
    toggleNewPassword: () => setShowNewPassword(previous => !previous),
    toggleConfirmPassword: () => setShowConfirmPassword(previous => !previous),
    showCurrentPasswordError,
    showNewPasswordError,
    showConfirmPasswordError,
    securityCurrentPasswordError,
    securityNewPasswordError,
    securityConfirmPasswordError,
    passwordStrength,
    isSecuritySubmitting,
  };
}
