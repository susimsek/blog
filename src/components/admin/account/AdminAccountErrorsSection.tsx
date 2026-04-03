'use client';

import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import FlagIcon from '@/components/common/FlagIcon';
import PaginationBar from '@/components/pagination/PaginationBar';
import { LOCALES } from '@/config/constants';
import type { AdminErrorMessageItem } from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;

type AdminAccountErrorsSectionProps = {
  t: AdminAccountTranslate;
  formatSessionDate: (value: string) => string;
  errorMessagesErrorMessage: string;
  errorMessagesSuccessMessage: string;
  isErrorMessagesLoading: boolean;
  isErrorCreateSubmitting: boolean;
  isErrorUpdateSubmitting: boolean;
  isErrorDeleteSubmitting: boolean;
  onOpenCreateErrorMessage: () => void;
  errorMessagesListTopRef: React.RefObject<HTMLDivElement | null>;
  errorFilterLocale: 'all' | 'en' | 'tr';
  onErrorFilterLocaleChange: (value: 'all' | 'en' | 'tr') => void;
  errorFilterQuery: string;
  onErrorFilterQueryChange: (value: string) => void;
  onClearErrorFilterQuery: () => void;
  totalErrorMessages: number;
  errorMessages: AdminErrorMessageItem[];
  deletingErrorMessageKey: string;
  getErrorMessageKey: (item: Pick<AdminErrorMessageItem, 'scope' | 'locale' | 'code'>) => string;
  onSelectErrorMessage: (item: AdminErrorMessageItem) => void;
  onOpenUpdateErrorMessage: (item: AdminErrorMessageItem) => void;
  onOpenDeleteErrorMessage: (item: AdminErrorMessageItem) => void;
  errorMessagesPage: number;
  totalErrorMessagePages: number;
  errorMessagesPageSize: number;
  onErrorMessagesPageChange: (page: number) => void;
  onErrorMessagesPageSizeChange: (size: number) => void;
  isErrorEditorModalOpen: boolean;
  onCloseErrorEditor: () => void;
  errorCrudTab: 'create' | 'update';
  selectedErrorMessage: AdminErrorMessageItem | null;
  errorCreateLocale: 'en' | 'tr';
  onErrorCreateLocaleChange: (value: 'en' | 'tr') => void;
  errorCreateCode: string;
  onErrorCreateCodeChange: (value: string) => void;
  normalizedErrorCreateCode: string;
  isErrorCreateCodeValid: boolean;
  errorCreateMessage: string;
  onErrorCreateMessageChange: (value: string) => void;
  errorUpdateMessage: string;
  onErrorUpdateMessageChange: (value: string) => void;
  canCreateErrorMessage: boolean;
  canUpdateErrorMessage: boolean;
  onCreateErrorMessageSubmit: () => void | Promise<void>;
  onUpdateErrorMessageSubmit: () => void | Promise<void>;
  pendingErrorMessageDelete: AdminErrorMessageItem | null;
  onCloseDeleteErrorMessage: () => void;
  onDeleteErrorMessageSubmit: () => void | Promise<void>;
};

export default function AdminAccountErrorsSection({
  t,
  formatSessionDate,
  errorMessagesErrorMessage,
  errorMessagesSuccessMessage,
  isErrorMessagesLoading,
  isErrorCreateSubmitting,
  isErrorUpdateSubmitting,
  isErrorDeleteSubmitting,
  onOpenCreateErrorMessage,
  errorMessagesListTopRef,
  errorFilterLocale,
  onErrorFilterLocaleChange,
  errorFilterQuery,
  onErrorFilterQueryChange,
  onClearErrorFilterQuery,
  totalErrorMessages,
  errorMessages,
  deletingErrorMessageKey,
  getErrorMessageKey,
  onSelectErrorMessage,
  onOpenUpdateErrorMessage,
  onOpenDeleteErrorMessage,
  errorMessagesPage,
  totalErrorMessagePages,
  errorMessagesPageSize,
  onErrorMessagesPageChange,
  onErrorMessagesPageSizeChange,
  isErrorEditorModalOpen,
  onCloseErrorEditor,
  errorCrudTab,
  selectedErrorMessage,
  errorCreateLocale,
  onErrorCreateLocaleChange,
  errorCreateCode,
  onErrorCreateCodeChange,
  normalizedErrorCreateCode,
  isErrorCreateCodeValid,
  errorCreateMessage,
  onErrorCreateMessageChange,
  errorUpdateMessage,
  onErrorUpdateMessageChange,
  canCreateErrorMessage,
  canUpdateErrorMessage,
  onCreateErrorMessageSubmit,
  onUpdateErrorMessageSubmit,
  pendingErrorMessageDelete,
  onCloseDeleteErrorMessage,
  onDeleteErrorMessageSubmit,
}: Readonly<AdminAccountErrorsSectionProps>) {
  return (
    <>
      <h3 className="admin-dashboard-panel-title mb-3">
        {t('adminAccount.errorsCatalog.title', { ns: 'admin-account' })}
      </h3>
      <hr className="admin-section-divider mb-3" />
      <p className="admin-dashboard-panel-copy mb-3">{t('adminAccount.errorsCatalog.copy', { ns: 'admin-account' })}</p>

      <div className="d-flex justify-content-end mb-3">
        <Button
          variant="primary"
          size="sm"
          className="d-inline-flex align-items-center"
          disabled={isErrorMessagesLoading || isErrorCreateSubmitting}
          onClick={onOpenCreateErrorMessage}
        >
          <FontAwesomeIcon icon="plus" className="me-2" />
          {t('adminAccount.errorsCatalog.actions.create', { ns: 'admin-account' })}
        </Button>
      </div>

      {errorMessagesErrorMessage ? (
        <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
          {errorMessagesErrorMessage}
        </Alert>
      ) : null}
      {errorMessagesSuccessMessage ? (
        <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
          {errorMessagesSuccessMessage}
        </Alert>
      ) : null}

      <div className="d-grid gap-3">
        <div ref={errorMessagesListTopRef} />
        <div className="card shadow-sm d-block">
          <div className="card-body p-3 w-100">
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <Form.Group controlId="admin-error-filter-locale">
                  <Form.Label className="small fw-semibold mb-1">
                    {t('adminAccount.errorsCatalog.filters.locale', { ns: 'admin-account' })}
                  </Form.Label>
                  <Form.Select
                    value={errorFilterLocale}
                    onChange={event => {
                      onErrorFilterLocaleChange(event.currentTarget.value as 'all' | 'en' | 'tr');
                    }}
                  >
                    <option value="all">
                      {t('adminAccount.errorsCatalog.filters.locales.all', { ns: 'admin-account' })}
                    </option>
                    <option value="en">
                      {t('adminAccount.errorsCatalog.filters.locales.en', { ns: 'admin-account' })}
                    </option>
                    <option value="tr">
                      {t('adminAccount.errorsCatalog.filters.locales.tr', { ns: 'admin-account' })}
                    </option>
                  </Form.Select>
                </Form.Group>
              </div>
              <div className="col-12 col-md-8">
                <Form.Group controlId="admin-error-filter-query">
                  <Form.Label className="small fw-semibold mb-1">
                    {t('adminAccount.errorsCatalog.filters.query', { ns: 'admin-account' })}
                  </Form.Label>
                  <div className="search-bar w-100 d-flex align-items-center">
                    <div className="search-icon">
                      <FontAwesomeIcon icon="search" />
                    </div>
                    <Form.Control
                      type="text"
                      className="search-input form-control"
                      value={errorFilterQuery}
                      onChange={event => {
                        onErrorFilterQueryChange(event.currentTarget.value);
                      }}
                      placeholder={t('adminAccount.errorsCatalog.filters.queryPlaceholder', {
                        ns: 'admin-account',
                      })}
                    />
                    {errorFilterQuery ? (
                      <button
                        type="button"
                        className="search-clear-btn border-0 bg-transparent"
                        onClick={onClearErrorFilterQuery}
                        aria-label={t('adminAccount.errorsCatalog.filters.query', { ns: 'admin-account' })}
                      >
                        <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                      </button>
                    ) : null}
                  </div>
                </Form.Group>
              </div>
            </div>
          </div>
        </div>

        <div className="card shadow-sm d-block">
          <div className="card-body p-3 w-100">
            {isErrorMessagesLoading ? (
              <div className="admin-account-sessions-loading">
                <AdminLoadingState
                  className="admin-loading-stack"
                  ariaLabel={t('adminAccount.errorsCatalog.loading', { ns: 'admin-account' })}
                />
              </div>
            ) : totalErrorMessages === 0 ? (
              <p className="small text-muted mb-0">{t('adminAccount.errorsCatalog.empty', { ns: 'admin-account' })}</p>
            ) : (
              <div className="d-grid gap-2">
                {errorMessages.map(item => {
                  const itemKey = getErrorMessageKey(item);
                  const isDeletingCurrentItem = isErrorDeleteSubmitting && deletingErrorMessageKey === itemKey;
                  const localeCode = item.locale.toLowerCase();

                  return (
                    <div key={itemKey} className="border rounded-3 p-3">
                      <button
                        type="button"
                        className="border-0 bg-transparent p-0 text-start text-reset text-decoration-none w-100"
                        onClick={() => {
                          onSelectErrorMessage(item);
                        }}
                      >
                        <div className="fw-bold fs-5 text-break">{item.code}</div>
                        <div className="mt-2 d-flex align-items-center flex-wrap gap-2">
                          <span className="d-inline-flex align-items-center gap-2 text-muted">
                            {localeCode === 'en' || localeCode === 'tr' ? (
                              <FlagIcon
                                className="flex-shrink-0"
                                code={localeCode}
                                alt={`${LOCALES[localeCode as 'en' | 'tr'].name} flag`}
                                width={18}
                                height={18}
                              />
                            ) : (
                              <FontAwesomeIcon icon="globe" className="text-muted" />
                            )}
                            <span>
                              {localeCode === 'en'
                                ? LOCALES.en.name
                                : localeCode === 'tr'
                                  ? LOCALES.tr.name
                                  : item.locale.toUpperCase()}
                            </span>
                          </span>
                        </div>
                        <div className="small mt-2 text-break text-muted">{item.message}</div>
                        {item.updatedAt ? (
                          <div className="small mt-2 text-muted d-flex align-items-center flex-wrap">
                            <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                            {t('adminAccount.errorsCatalog.list.updatedAt', {
                              ns: 'admin-account',
                              value: formatSessionDate(item.updatedAt),
                            })}
                          </div>
                        ) : null}
                      </button>

                      <div className="row g-2 mt-3">
                        <div className="col-12 col-md-auto">
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            className="w-100"
                            onClick={() => {
                              onOpenUpdateErrorMessage(item);
                            }}
                          >
                            <FontAwesomeIcon icon="save" className="me-2" />
                            {t('adminAccount.errorsCatalog.actions.update', { ns: 'admin-account' })}
                          </Button>
                        </div>
                        <div className="col-12 col-md-auto">
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            className="w-100"
                            disabled={isErrorDeleteSubmitting || isErrorUpdateSubmitting}
                            onClick={() => {
                              onOpenDeleteErrorMessage(item);
                            }}
                          >
                            {!isDeletingCurrentItem ? <FontAwesomeIcon icon="trash" className="me-2" /> : null}
                            {isDeletingCurrentItem ? (
                              <span className="d-inline-flex align-items-center gap-2">
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  className="me-2 flex-shrink-0 admin-action-spinner"
                                  aria-hidden="true"
                                />
                                <span>{t('adminAccount.errorsCatalog.actions.deleting', { ns: 'admin-account' })}</span>
                              </span>
                            ) : (
                              t('adminAccount.errorsCatalog.actions.delete', { ns: 'admin-account' })
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {!isErrorMessagesLoading && totalErrorMessages > 0 ? (
            <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
              <PaginationBar
                currentPage={errorMessagesPage}
                totalPages={totalErrorMessagePages}
                totalResults={totalErrorMessages}
                size={errorMessagesPageSize}
                onPageChange={onErrorMessagesPageChange}
                onSizeChange={onErrorMessagesPageSizeChange}
              />
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        show={isErrorEditorModalOpen}
        onHide={onCloseErrorEditor}
        centered
        dialogClassName="admin-error-editor-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {errorCrudTab === 'create'
              ? t('adminAccount.errorsCatalog.tabs.create', { ns: 'admin-account' })
              : t('adminAccount.errorsCatalog.tabs.update', { ns: 'admin-account' })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorCrudTab === 'create' ? (
            <>
              <p className="small text-muted mb-3">
                {t('adminAccount.errorsCatalog.create.copy', { ns: 'admin-account' })}
              </p>
              <div className="row g-2 mb-3">
                <div className="col-12 col-sm-4">
                  <Form.Group controlId="admin-error-create-locale">
                    <Form.Label className="small fw-semibold mb-1">
                      {t('adminAccount.errorsCatalog.create.locale', { ns: 'admin-account' })}
                    </Form.Label>
                    <Form.Select
                      value={errorCreateLocale}
                      onChange={event => {
                        onErrorCreateLocaleChange(event.currentTarget.value as 'en' | 'tr');
                      }}
                    >
                      <option value="en">
                        {t('adminAccount.errorsCatalog.filters.locales.en', { ns: 'admin-account' })}
                      </option>
                      <option value="tr">
                        {t('adminAccount.errorsCatalog.filters.locales.tr', { ns: 'admin-account' })}
                      </option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-12 col-sm-8">
                  <Form.Group controlId="admin-error-create-code">
                    <Form.Label className="small fw-semibold mb-1">
                      {t('adminAccount.errorsCatalog.create.code', { ns: 'admin-account' })}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      value={errorCreateCode}
                      placeholder={t('adminAccount.errorsCatalog.create.codePlaceholder', {
                        ns: 'admin-account',
                      })}
                      onChange={event => {
                        onErrorCreateCodeChange(event.currentTarget.value);
                      }}
                      autoCapitalize="characters"
                      maxLength={120}
                    />
                    {normalizedErrorCreateCode !== '' && !isErrorCreateCodeValid ? (
                      <Form.Text className="text-danger">
                        {t('adminAccount.errorsCatalog.create.codeValidation', { ns: 'admin-account' })}
                      </Form.Text>
                    ) : null}
                  </Form.Group>
                </div>
              </div>

              <Form.Group controlId="admin-error-create-message">
                <Form.Label>{t('adminAccount.errorsCatalog.create.message', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={errorCreateMessage}
                  onChange={event => {
                    onErrorCreateMessageChange(event.currentTarget.value);
                  }}
                  maxLength={500}
                />
                <Form.Text className="text-muted">
                  {t('adminAccount.errorsCatalog.create.messageHint', { ns: 'admin-account', count: 500 })}
                </Form.Text>
              </Form.Group>
            </>
          ) : selectedErrorMessage ? (
            <>
              <p className="small text-muted mb-3">
                {t('adminAccount.errorsCatalog.update.copy', { ns: 'admin-account' })}
              </p>
              <dl className="row mb-3 small">
                <dt className="col-4 text-uppercase text-muted">
                  {t('adminAccount.errorsCatalog.update.labels.code', { ns: 'admin-account' })}
                </dt>
                <dd className="col-8 mb-2">{selectedErrorMessage.code}</dd>
                <dt className="col-4 text-uppercase text-muted">
                  {t('adminAccount.errorsCatalog.update.labels.scope', { ns: 'admin-account' })}
                </dt>
                <dd className="col-8 mb-2">{selectedErrorMessage.scope}</dd>
                <dt className="col-4 text-uppercase text-muted">
                  {t('adminAccount.errorsCatalog.update.labels.locale', { ns: 'admin-account' })}
                </dt>
                <dd className="col-8 mb-2">{selectedErrorMessage.locale}</dd>
              </dl>

              <Form.Group controlId="admin-error-update-message">
                <Form.Label>{t('adminAccount.errorsCatalog.update.message', { ns: 'admin-account' })}</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  value={errorUpdateMessage}
                  onChange={event => {
                    onErrorUpdateMessageChange(event.currentTarget.value);
                  }}
                  maxLength={500}
                />
                <Form.Text className="text-muted">
                  {t('adminAccount.errorsCatalog.update.messageHint', { ns: 'admin-account', count: 500 })}
                </Form.Text>
              </Form.Group>
            </>
          ) : (
            <p className="small text-muted mb-0">
              {t('adminAccount.errorsCatalog.update.empty', { ns: 'admin-account' })}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button
            type="button"
            variant="secondary"
            onClick={onCloseErrorEditor}
            disabled={isErrorCreateSubmitting || isErrorUpdateSubmitting || isErrorDeleteSubmitting}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>

          <div className="d-flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              disabled={errorCrudTab === 'create' ? !canCreateErrorMessage : !canUpdateErrorMessage}
              onClick={() => {
                if (errorCrudTab === 'create') {
                  void onCreateErrorMessageSubmit();
                  return;
                }
                void onUpdateErrorMessageSubmit();
              }}
            >
              {errorCrudTab === 'create' ? (
                isErrorCreateSubmitting ? (
                  <span className="d-inline-flex align-items-center gap-2">
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      className="me-2 flex-shrink-0 admin-action-spinner"
                      aria-hidden="true"
                    />
                    <span>{t('adminAccount.errorsCatalog.actions.creating', { ns: 'admin-account' })}</span>
                  </span>
                ) : (
                  <>
                    <FontAwesomeIcon icon="plus" className="me-2" />
                    {t('adminAccount.errorsCatalog.actions.create', { ns: 'admin-account' })}
                  </>
                )
              ) : isErrorUpdateSubmitting ? (
                <span className="d-inline-flex align-items-center gap-2">
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    className="me-2 flex-shrink-0 admin-action-spinner"
                    aria-hidden="true"
                  />
                  <span>{t('adminAccount.errorsCatalog.actions.updating', { ns: 'admin-account' })}</span>
                </span>
              ) : (
                <>
                  <FontAwesomeIcon icon="save" className="me-2" />
                  {t('adminAccount.errorsCatalog.actions.update', { ns: 'admin-account' })}
                </>
              )}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <Modal
        show={pendingErrorMessageDelete !== null}
        onHide={onCloseDeleteErrorMessage}
        centered
        dialogClassName="admin-error-editor-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.errorsCatalog.actions.delete', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-muted mb-3">
            {t('adminAccount.errorsCatalog.actions.confirmDelete', {
              ns: 'admin-account',
              code: pendingErrorMessageDelete?.code ?? '',
              locale: pendingErrorMessageDelete?.locale ?? '',
            })}
          </p>
          <dl className="row mb-0 small">
            <dt className="col-4 text-uppercase text-muted">
              {t('adminAccount.errorsCatalog.update.labels.code', { ns: 'admin-account' })}
            </dt>
            <dd className="col-8 mb-2">{pendingErrorMessageDelete?.code ?? '-'}</dd>
            <dt className="col-4 text-uppercase text-muted">
              {t('adminAccount.errorsCatalog.update.labels.scope', { ns: 'admin-account' })}
            </dt>
            <dd className="col-8 mb-2">{pendingErrorMessageDelete?.scope ?? '-'}</dd>
            <dt className="col-4 text-uppercase text-muted">
              {t('adminAccount.errorsCatalog.update.labels.locale', { ns: 'admin-account' })}
            </dt>
            <dd className="col-8 mb-0">{pendingErrorMessageDelete?.locale ?? '-'}</dd>
          </dl>
        </Modal.Body>
        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            disabled={isErrorDeleteSubmitting}
            onClick={onCloseDeleteErrorMessage}
          >
            {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={pendingErrorMessageDelete === null || isErrorDeleteSubmitting}
            onClick={() => {
              void onDeleteErrorMessageSubmit();
            }}
          >
            {isErrorDeleteSubmitting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2 flex-shrink-0 admin-action-spinner"
                  aria-hidden="true"
                />
                <span>{t('adminAccount.errorsCatalog.actions.deleting', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              <>
                <FontAwesomeIcon icon="trash" className="me-2" />
                {t('adminAccount.errorsCatalog.actions.delete', { ns: 'admin-account' })}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
