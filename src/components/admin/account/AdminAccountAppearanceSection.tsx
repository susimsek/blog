'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { Theme } from '@/reducers/theme';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type AppearanceOption = {
  key: string;
  label: string;
  value: Theme | 'system';
};

type AdminAccountAppearanceSectionProps = {
  t: AdminAccountTranslate;
  activeAppearance: Theme | 'system';
  appearanceOptions: readonly AppearanceOption[];
  onAppearanceChange: (value: Theme | 'system') => void;
  resolveAppearanceCardClass: (value: Theme | 'system') => string;
  resolveAppearanceMetaIcon: (value: Theme | 'system') => React.ComponentProps<typeof FontAwesomeIcon>['icon'];
};

export default function AdminAccountAppearanceSection({
  t,
  activeAppearance,
  appearanceOptions,
  onAppearanceChange,
  resolveAppearanceCardClass,
  resolveAppearanceMetaIcon,
}: Readonly<AdminAccountAppearanceSectionProps>) {
  return (
    <section className="admin-account-appearance-section is-standalone">
      <h3 className="admin-dashboard-panel-title mb-2">
        {t('adminAccount.account.appearance.title', { ns: 'admin-account' })}
      </h3>
      <hr className="admin-section-divider mb-3" />
      <p className="admin-dashboard-panel-copy">{t('adminAccount.account.appearance.copy', { ns: 'admin-account' })}</p>
      <div
        className="admin-account-appearance-options"
        role="radiogroup"
        aria-label={t('adminAccount.account.appearance.title', { ns: 'admin-account' })}
      >
        {appearanceOptions.map(option => {
          const isActive = activeAppearance === option.value;

          return (
            <button
              key={option.key}
              type="button"
              className={`admin-account-appearance-option ${resolveAppearanceCardClass(option.value)}${
                isActive ? ' is-active' : ''
              }`}
              onClick={() => onAppearanceChange(option.value)}
              role="radio"
              aria-checked={isActive}
            >
              <span className="admin-account-appearance-preview" aria-hidden="true">
                <span className="admin-account-appearance-preview-header">
                  <span />
                  <span />
                  <span />
                </span>
                <span className="admin-account-appearance-preview-body">
                  <span className="admin-account-appearance-preview-title" />
                  <span className="admin-account-appearance-preview-main">
                    <span className="admin-account-appearance-preview-main-accent" />
                  </span>
                  <span className="admin-account-appearance-preview-side" />
                </span>
              </span>

              <span className="admin-account-appearance-option-footer">
                <FontAwesomeIcon
                  icon={isActive ? 'circle-check' : 'circle'}
                  className="admin-account-appearance-option-radio"
                />
                <span className="admin-account-appearance-option-label">{option.label}</span>
                <FontAwesomeIcon
                  icon={resolveAppearanceMetaIcon(option.value)}
                  className="admin-account-appearance-option-meta"
                />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
