'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Nav from 'react-bootstrap/Nav';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FlagIcon from '@/components/common/FlagIcon';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type TopicEditorMode = 'create' | 'update';
type SupportedContentLocale = 'en' | 'tr';

type AdminContentTopicEditorModalProps = {
  t: AdminAccountTranslate;
  isOpen: boolean;
  isSubmitting: boolean;
  mode: TopicEditorMode;
  localeTabs: Array<{ locale: SupportedContentLocale; available: boolean }>;
  locale: SupportedContentLocale;
  onSwitchLocale: (locale: SupportedContentLocale) => void;
  onLocaleChange: (locale: SupportedContentLocale) => void;
  resolveLocaleLabel: (value: string) => string;
  id: string;
  onIDChange: (value: string) => void;
  isIDInvalid: boolean;
  name: string;
  onNameChange: (value: string) => void;
  color: string;
  onColorChange: (value: string) => void;
  link: string;
  onLinkChange: (value: string) => void;
  canSubmit: boolean;
  onSubmit: () => void;
  onHide: () => void;
};

export default function AdminContentTopicEditorModal({
  t,
  isOpen,
  isSubmitting,
  mode,
  localeTabs,
  locale,
  onSwitchLocale,
  onLocaleChange,
  resolveLocaleLabel,
  id,
  onIDChange,
  isIDInvalid,
  name,
  onNameChange,
  color,
  onColorChange,
  link,
  onLinkChange,
  canSubmit,
  onSubmit,
  onHide,
}: Readonly<AdminContentTopicEditorModalProps>) {
  return (
    <Modal show={isOpen} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === 'create'
            ? t('adminAccount.content.modals.topic.createTitle', { ns: 'admin-account' })
            : t('adminAccount.content.modals.topic.updateTitle', { ns: 'admin-account' })}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {localeTabs.length > 0 ? (
          <Nav
            variant="tabs"
            activeKey={locale}
            className="mb-3 admin-content-tabs"
            onSelect={eventKey => {
              if (eventKey === 'en' || eventKey === 'tr') {
                onSwitchLocale(eventKey);
              }
            }}
          >
            {localeTabs.map(item => (
              <Nav.Item key={`topic-editor-${item.locale}`}>
                <Nav.Link eventKey={item.locale}>
                  <span className="d-inline-flex align-items-center">
                    <FlagIcon
                      code={item.locale}
                      className="flex-shrink-0 me-2"
                      alt={`${resolveLocaleLabel(item.locale)} flag`}
                      width={14}
                      height={14}
                    />
                    <span>{item.locale.toUpperCase()}</span>
                  </span>
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
        ) : null}
        <div className="row g-2">
          {localeTabs.length === 0 ? (
            <div className="col-12 col-sm-4">
              <Form.Group controlId="admin-content-topic-locale">
                <Form.Label>{t('adminAccount.content.modals.topic.locale', { ns: 'admin-account' })}</Form.Label>
                <Form.Select
                  value={locale}
                  disabled={mode === 'update'}
                  onChange={event => {
                    onLocaleChange(event.currentTarget.value === 'tr' ? 'tr' : 'en');
                  }}
                >
                  <option value="en">{t('adminAccount.content.filters.locales.en', { ns: 'admin-account' })}</option>
                  <option value="tr">{t('adminAccount.content.filters.locales.tr', { ns: 'admin-account' })}</option>
                </Form.Select>
              </Form.Group>
            </div>
          ) : null}
          <div className={`col-12 ${localeTabs.length === 0 ? 'col-sm-8' : ''}`}>
            <Form.Group controlId="admin-content-topic-id">
              <Form.Label>{t('adminAccount.content.modals.topic.id', { ns: 'admin-account' })}</Form.Label>
              <Form.Control
                type="text"
                value={id}
                disabled={mode === 'update'}
                onChange={event => {
                  onIDChange(event.currentTarget.value);
                }}
              />
              {isIDInvalid ? (
                <Form.Text className="text-danger">
                  {t('adminAccount.content.validation.id', { ns: 'admin-account' })}
                </Form.Text>
              ) : null}
            </Form.Group>
          </div>
          <div className="col-12">
            <Form.Group controlId="admin-content-topic-name">
              <Form.Label>{t('adminAccount.content.modals.topic.name', { ns: 'admin-account' })}</Form.Label>
              <Form.Control
                type="text"
                value={name}
                onChange={event => {
                  onNameChange(event.currentTarget.value);
                }}
              />
            </Form.Group>
          </div>
          <div className="col-12 col-sm-6">
            <Form.Group controlId="admin-content-topic-color">
              <Form.Label>{t('adminAccount.content.modals.topic.color', { ns: 'admin-account' })}</Form.Label>
              <Form.Control
                type="text"
                value={color}
                onChange={event => {
                  onColorChange(event.currentTarget.value);
                }}
              />
            </Form.Group>
          </div>
          <div className="col-12 col-sm-6">
            <Form.Group controlId="admin-content-topic-link">
              <Form.Label>{t('adminAccount.content.modals.topic.link', { ns: 'admin-account' })}</Form.Label>
              <Form.Control
                type="url"
                value={link}
                onChange={event => {
                  onLinkChange(event.currentTarget.value);
                }}
                placeholder="https://"
              />
            </Form.Group>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onHide}>
          {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
        </Button>
        <Button type="button" variant="primary" disabled={!canSubmit || isSubmitting} onClick={onSubmit}>
          {isSubmitting ? (
            <span className="d-inline-flex align-items-center gap-2">
              <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
              <span>{t('adminAccount.content.actions.saving', { ns: 'admin-account' })}</span>
            </span>
          ) : (
            <>
              <FontAwesomeIcon icon="save" className="me-2" />
              {mode === 'create'
                ? t('adminAccount.content.actions.createTopic', { ns: 'admin-account' })
                : t('adminAccount.content.actions.update', { ns: 'admin-account' })}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
