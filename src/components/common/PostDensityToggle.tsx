import React from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

export type PostDensityMode = 'default' | 'editorial' | 'grid';

interface PostDensityToggleProps {
  value: PostDensityMode;
  onChange: (mode: PostDensityMode) => void;
}

export default function PostDensityToggle({ value, onChange }: Readonly<PostDensityToggleProps>) {
  const { t } = useTranslation('common');
  const label = t('common.viewDensity.label');

  return (
    <div className="post-density-control" aria-label={label}>
      <ButtonGroup className="post-density-toggle" aria-label={label}>
        <button
          type="button"
          className={`btn${value === 'default' ? ' is-active' : ''}`}
          aria-pressed={value === 'default'}
          aria-label={t('common.viewDensity.default')}
          title={t('common.viewDensity.default')}
          onClick={() => onChange('default')}
        >
          <span className="post-density-toggle-icon" aria-hidden="true">
            <FontAwesomeIcon icon="desktop" className="fa-fw" />
          </span>
        </button>
        <button
          type="button"
          className={`btn${value === 'editorial' ? ' is-active' : ''}`}
          aria-pressed={value === 'editorial'}
          aria-label={t('common.viewDensity.editorial')}
          title={t('common.viewDensity.editorial')}
          onClick={() => onChange('editorial')}
        >
          <span className="post-density-toggle-icon" aria-hidden="true">
            <FontAwesomeIcon icon="clipboard-list" className="fa-fw" />
          </span>
        </button>
        <button
          type="button"
          className={`btn post-density-toggle-grid-btn${value === 'grid' ? ' is-active' : ''}`}
          aria-pressed={value === 'grid'}
          aria-label={t('common.viewDensity.grid')}
          title={t('common.viewDensity.grid')}
          onClick={() => onChange('grid')}
        >
          <span className="post-density-toggle-icon" aria-hidden="true">
            <FontAwesomeIcon icon="table-cells" className="fa-fw" />
          </span>
        </button>
      </ButtonGroup>
    </div>
  );
}
