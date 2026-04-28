import React from 'react';

export const getCommentInitial = (authorName: string) => {
  const normalized = authorName.trim();
  return normalized ? normalized.charAt(0).toUpperCase() : '?';
};

export const renderCommentContent = (value: string) => {
  const lines = value.split('\n');

  return lines.map((line, index) => (
    <React.Fragment key={`${line}-${index + 1}`}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </React.Fragment>
  ));
};

export const formatCommentDate = (value: string, locale: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsed);
};
