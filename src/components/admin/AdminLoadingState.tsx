'use client';

import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

type AdminLoadingStateProps = {
  ariaLabel: string;
  className?: string;
};

export default function AdminLoadingState({ ariaLabel, className = '' }: Readonly<AdminLoadingStateProps>) {
  const resolvedClassName = className.trim();

  return (
    <div className={resolvedClassName} role="status" aria-live="polite" aria-label={ariaLabel}>
      <span className="visually-hidden">{ariaLabel}</span>
      <Spinner animation="border" aria-hidden="true" />
    </div>
  );
}
