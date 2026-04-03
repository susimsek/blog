'use client';

import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import PaginationBar from '@/components/pagination/PaginationBar';
import type { AdminContentCategoryGroupItem, AdminContentCategoryItem } from '@/lib/adminApi';

type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type LocaleFilterValue = 'all' | 'en' | 'tr';

type AdminContentCategoriesTabProps = {
  t: AdminAccountTranslate;
  formatDate: (value: string) => string;
  categoryFilterLocale: LocaleFilterValue;
  onCategoryFilterLocaleChange: (value: LocaleFilterValue) => void;
  categoryFilterQuery: string;
  onCategoryFilterQueryChange: (value: string) => void;
  onClearCategoryFilterQuery: () => void;
  isCategoryListLoading: boolean;
  categoryTotal: number;
  categoryListItems: AdminContentCategoryGroupItem[];
  onOpenCreateCategory: () => void;
  onOpenUpdateCategory: (item: AdminContentCategoryItem) => void;
  onOpenDeleteCategory: (item: AdminContentCategoryItem) => void;
  resolveAccentColor: (value: string) => string;
  categoryPage: number;
  categoryTotalPages: number;
  categoryPageSize: number;
  onCategoryPageChange: (page: number) => void;
  onCategoryPageSizeChange: (size: number) => void;
};

export default function AdminContentCategoriesTab({
  t,
  formatDate,
  categoryFilterLocale,
  onCategoryFilterLocaleChange,
  categoryFilterQuery,
  onCategoryFilterQueryChange,
  onClearCategoryFilterQuery,
  isCategoryListLoading,
  categoryTotal,
  categoryListItems,
  onOpenCreateCategory,
  onOpenUpdateCategory,
  onOpenDeleteCategory,
  resolveAccentColor,
  categoryPage,
  categoryTotalPages,
  categoryPageSize,
  onCategoryPageChange,
  onCategoryPageSizeChange,
}: Readonly<AdminContentCategoriesTabProps>) {
  return (
    <div className="pt-3">
      <div className="card d-block">
        <div className="card-body p-3 p-md-4 w-100">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h4 className="admin-dashboard-panel-title mb-0">
              {t('adminAccount.content.categories.title', { ns: 'admin-account' })}
            </h4>
            <Button type="button" size="sm" variant="primary" onClick={onOpenCreateCategory}>
              <FontAwesomeIcon icon="plus" className="me-2" />
              {t('adminAccount.content.actions.create', { ns: 'admin-account' })}
            </Button>
          </div>
          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-4">
              <Form.Group controlId="admin-content-categories-filter-locale">
                <Form.Label className="small fw-semibold mb-1">
                  {t('adminAccount.content.filters.locale', { ns: 'admin-account' })}
                </Form.Label>
                <Form.Select
                  value={categoryFilterLocale}
                  onChange={event => {
                    onCategoryFilterLocaleChange(event.currentTarget.value as LocaleFilterValue);
                  }}
                >
                  <option value="all">{t('adminAccount.content.filters.locales.all', { ns: 'admin-account' })}</option>
                  <option value="en">{t('adminAccount.content.filters.locales.en', { ns: 'admin-account' })}</option>
                  <option value="tr">{t('adminAccount.content.filters.locales.tr', { ns: 'admin-account' })}</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-12 col-lg-8">
              <Form.Group controlId="admin-content-categories-filter-query">
                <Form.Label className="small fw-semibold mb-1">
                  {t('adminAccount.content.filters.query', { ns: 'admin-account' })}
                </Form.Label>
                <div className="search-bar w-100 d-flex align-items-center">
                  <div className="search-icon">
                    <FontAwesomeIcon icon="search" />
                  </div>
                  <Form.Control
                    type="text"
                    className="search-input form-control"
                    value={categoryFilterQuery}
                    onChange={event => {
                      onCategoryFilterQueryChange(event.currentTarget.value);
                    }}
                    placeholder={t('adminAccount.content.filters.queryPlaceholder', { ns: 'admin-account' })}
                  />
                  {categoryFilterQuery ? (
                    <button
                      type="button"
                      className="search-clear-btn border-0 bg-transparent"
                      onClick={onClearCategoryFilterQuery}
                      aria-label={t('adminAccount.content.filters.query', { ns: 'admin-account' })}
                    >
                      <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                    </button>
                  ) : null}
                </div>
              </Form.Group>
            </div>
          </div>
          {isCategoryListLoading ? (
            <AdminLoadingState
              className="admin-loading-stack"
              ariaLabel={t('adminAccount.content.loading.taxonomy', { ns: 'admin-account' })}
            />
          ) : categoryTotal === 0 ? (
            <p className="small text-muted mb-0">
              {t('adminAccount.content.empty.categories', { ns: 'admin-account' })}
            </p>
          ) : (
            <div className="post-list-results post-list-results--editorial">
              {categoryListItems.map(group => {
                const item = group.preferred;
                const accentColor = resolveAccentColor(item.color);
                return (
                  <div
                    key={group.id.toLowerCase()}
                    className="post-card d-flex align-items-center post-summary-card admin-account-card admin-content-category-card"
                    style={{ '--topic-accent': accentColor } as React.CSSProperties}
                  >
                    <div className="post-card-content flex-grow-1">
                      <div className="post-summary-title-row">
                        <h4 className="fw-bold post-summary-title fs-4 mb-0 text-break">{item.name}</h4>
                      </div>

                      <p className="post-summary-meta mb-2">
                        <span className="text-muted d-flex align-items-center">
                          <FontAwesomeIcon icon="tags" className="me-2" />
                          {item.id}
                        </span>
                        <span className="text-muted d-flex align-items-center">
                          <FontAwesomeIcon icon="palette" className="me-2" />
                          {t('adminAccount.content.list.colorValue', {
                            ns: 'admin-account',
                            value: item.color,
                          })}
                        </span>
                        {item.icon ? (
                          <span className="text-muted d-flex align-items-center">
                            <FontAwesomeIcon icon="tag" className="me-2" />
                            {t('adminAccount.content.list.iconValue', {
                              ns: 'admin-account',
                              value: item.icon,
                            })}
                          </span>
                        ) : null}
                      </p>

                      {item.updatedAt ? (
                        <div className="post-summary-date text-muted d-flex align-items-center mb-3">
                          <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                          {t('adminAccount.content.list.updatedAt', {
                            ns: 'admin-account',
                            value: formatDate(item.updatedAt),
                          })}
                        </div>
                      ) : null}

                      <div className="post-summary-thumbnail">
                        <div className="ratio ratio-16x9 rounded-3 overflow-hidden border">
                          <div
                            className="w-100 h-100 d-flex align-items-end p-3"
                            style={{
                              background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 90%, var(--main-bg) 10%) 0%, color-mix(in srgb, ${accentColor} 58%, var(--main-bg) 42%) 100%)`,
                            }}
                          >
                            <div className="w-100 d-flex align-items-center justify-content-between gap-2">
                              <span className="badge rounded-pill text-bg-dark">{item.id}</span>
                              <span className="badge border border-light-subtle text-bg-light text-dark">
                                {t('adminAccount.content.categories.title', { ns: 'admin-account' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="post-summary-cta d-flex flex-wrap gap-2 mt-3">
                        <Button type="button" size="sm" variant="primary" onClick={() => onOpenUpdateCategory(item)}>
                          <FontAwesomeIcon icon="save" className="me-2" />
                          {t('adminAccount.content.actions.update', { ns: 'admin-account' })}
                        </Button>
                        <Button type="button" size="sm" variant="danger" onClick={() => onOpenDeleteCategory(item)}>
                          <FontAwesomeIcon icon="trash" className="me-2" />
                          {t('adminAccount.content.actions.delete', { ns: 'admin-account' })}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {!isCategoryListLoading && categoryTotal > 0 ? (
          <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
            <PaginationBar
              className="border-0 rounded-0 px-2 px-md-3 py-0 bg-transparent shadow-none"
              currentPage={categoryPage}
              totalPages={categoryTotalPages}
              totalResults={categoryTotal}
              size={categoryPageSize}
              onPageChange={onCategoryPageChange}
              onSizeChange={onCategoryPageSizeChange}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
