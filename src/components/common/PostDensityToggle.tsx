import React from 'react';
import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

export type PostDensityMode = 'default' | 'editorial';

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
        <Button
          type="button"
          variant="light"
          className={value === 'default' ? 'is-active' : undefined}
          aria-pressed={value === 'default'}
          aria-label={t('common.viewDensity.default')}
          title={t('common.viewDensity.default')}
          onClick={() => onChange('default')}
        >
          <FontAwesomeIcon icon="desktop" />
        </Button>
        <Button
          type="button"
          variant="light"
          className={value === 'editorial' ? 'is-active' : undefined}
          aria-pressed={value === 'editorial'}
          aria-label={t('common.viewDensity.editorial')}
          title={t('common.viewDensity.editorial')}
          onClick={() => onChange('editorial')}
        >
          <FontAwesomeIcon icon="clipboard-list" />
        </Button>
      </ButtonGroup>
    </div>
  );
}
