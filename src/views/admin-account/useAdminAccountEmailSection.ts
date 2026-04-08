'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import { isAdminSessionError, requestAdminEmailChange, resolveAdminError } from '@/lib/adminApi';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import type { AdminIdentity, AdminEmailErrorField } from './adminAccountShared';
import { resolveAdminEmailErrorField, resolveEmailValidationError } from './adminAccountShared';

type UseAdminAccountEmailSectionParams = {
  adminUser: AdminIdentity;
  locale: string;
  patchAdminUser: (updater: (previous: AdminIdentity) => AdminIdentity) => void;
  onSessionExpired: () => void;
  successMessageAutoHideMs: number;
  t: TFunction;
};

export default function useAdminAccountEmailSection({
  adminUser,
  locale,
  patchAdminUser,
  onSessionExpired,
  successMessageAutoHideMs,
  t,
}: UseAdminAccountEmailSectionParams) {
  const [emailInput, setEmailInput] = React.useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = React.useState('');
  const [emailTouchedFields, setEmailTouchedFields] = React.useState({
    newEmail: false,
    currentPassword: false,
  });
  const [isEmailSubmitting, setIsEmailSubmitting] = React.useState(false);
  const [emailSubmitted, setEmailSubmitted] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [emailErrorField, setEmailErrorField] = React.useState<AdminEmailErrorField | null>(null);
  const [emailSuccessMessage, setEmailSuccessMessage] = React.useState('');

  useAutoClearValue(emailSuccessMessage, setEmailSuccessMessage, successMessageAutoHideMs);

  const profileEmail = adminUser?.email?.trim().toLowerCase() ?? '';
  const pendingEmail = adminUser?.pendingEmail?.trim().toLowerCase() ?? '';
  const resolvedEmailInput = emailInput.trim().toLowerCase();
  const emailValidationError = resolveEmailValidationError(resolvedEmailInput, profileEmail, t);
  const emailCurrentPasswordError =
    emailCurrentPassword === '' ? t('adminAccount.validation.currentPasswordRequired', { ns: 'admin-account' }) : '';
  const showEmailValidationError = (emailSubmitted || emailTouchedFields.newEmail) && emailValidationError !== '';
  const showEmailCurrentPasswordError =
    (emailSubmitted || emailTouchedFields.currentPassword) && emailCurrentPasswordError !== '';

  const clearEmailFeedback = React.useCallback(() => {
    if (emailErrorMessage) {
      setEmailErrorMessage('');
      setEmailErrorField(null);
    }
    if (emailSuccessMessage) {
      setEmailSuccessMessage('');
    }
  }, [emailErrorMessage, emailSuccessMessage]);

  const handleEmailInputChange = React.useCallback(
    (value: string) => {
      setEmailInput(value);
      setEmailTouchedFields(previous => ({
        ...previous,
        newEmail: true,
      }));

      if (emailErrorMessage && (emailErrorField === 'newEmail' || emailErrorField === 'generic')) {
        setEmailErrorMessage('');
        setEmailErrorField(null);
      }
      if (emailSuccessMessage) {
        setEmailSuccessMessage('');
      }
    },
    [emailErrorField, emailErrorMessage, emailSuccessMessage],
  );

  const handleEmailInputBlur = React.useCallback(() => {
    setEmailTouchedFields(previous => ({
      ...previous,
      newEmail: true,
    }));
  }, []);

  const handleEmailCurrentPasswordChange = React.useCallback(
    (value: string) => {
      setEmailCurrentPassword(value);
      setEmailTouchedFields(previous => ({
        ...previous,
        currentPassword: true,
      }));

      if (emailErrorMessage && (emailErrorField === 'currentPassword' || emailErrorField === 'generic')) {
        setEmailErrorMessage('');
        setEmailErrorField(null);
      }
    },
    [emailErrorField, emailErrorMessage],
  );

  const handleEmailCurrentPasswordBlur = React.useCallback(() => {
    setEmailTouchedFields(previous => ({
      ...previous,
      currentPassword: true,
    }));
  }, []);

  const handleEmailSubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isEmailSubmitting) {
        return;
      }

      setEmailSubmitted(true);
      setEmailErrorMessage('');
      setEmailErrorField(null);
      setEmailSuccessMessage('');
      if (emailValidationError || emailCurrentPasswordError) {
        return;
      }

      setIsEmailSubmitting(true);
      try {
        const payload = await requestAdminEmailChange({
          newEmail: resolvedEmailInput,
          currentPassword: emailCurrentPassword,
          locale,
        });
        if (!payload.success) {
          throw new Error(t('adminAccount.account.errors.emailUpdate', { ns: 'admin-account' }));
        }

        patchAdminUser(previous =>
          previous
            ? {
                ...previous,
                pendingEmail: payload.pendingEmail,
                pendingEmailExpiresAt: payload.expiresAt,
              }
            : previous,
        );
        setEmailInput('');
        setEmailCurrentPassword('');
        setEmailTouchedFields({
          newEmail: false,
          currentPassword: false,
        });
        setEmailSubmitted(false);
        setEmailErrorField(null);
        setEmailSuccessMessage(
          t('adminAccount.account.success.emailChangeRequested', {
            ns: 'admin-account',
            email: payload.pendingEmail,
          }),
        );
      } catch (error) {
        if (isAdminSessionError(error)) {
          onSessionExpired();
          return;
        }
        const resolvedError = resolveAdminError(error);
        setEmailErrorField(resolveAdminEmailErrorField(resolvedError.code));
        setEmailErrorMessage(
          resolvedError.message || t('adminAccount.account.errors.emailUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setIsEmailSubmitting(false);
      }
    },
    [
      emailCurrentPassword,
      emailCurrentPasswordError,
      emailValidationError,
      isEmailSubmitting,
      locale,
      onSessionExpired,
      patchAdminUser,
      resolvedEmailInput,
      t,
    ],
  );

  return {
    pendingEmail,
    emailInput,
    emailCurrentPassword,
    emailErrorMessage,
    emailSuccessMessage,
    showEmailValidationError,
    emailValidationError,
    showEmailCurrentPasswordError,
    emailCurrentPasswordError,
    isEmailSubmitting,
    handleEmailSubmit,
    handleEmailInputChange,
    handleEmailInputBlur,
    handleEmailCurrentPasswordChange,
    handleEmailCurrentPasswordBlur,
    clearEmailFeedback,
  };
}
