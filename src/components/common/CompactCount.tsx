import React from 'react';

type CompactCountProps = {
  locale?: string;
  value: number;
  className?: string;
};

const formatDecimal = (value: number, locale?: string) =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
    trailingZeroDisplay: 'stripIfInteger',
  }).format(value);

const roundToSingleDecimal = (value: number) => Math.round(value * 10) / 10;

export const formatCompactCount = (value: number, locale?: string) => {
  const normalized = Math.max(0, Math.trunc(value));

  if (normalized < 1000) {
    return new Intl.NumberFormat(locale).format(normalized);
  }

  if (normalized < 1_000_000) {
    const scaledK = normalized / 1000;
    if (scaledK < 100) {
      const roundedK = roundToSingleDecimal(scaledK);
      if (roundedK >= 1000) {
        return '1M';
      }
      if (roundedK >= 100) {
        return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(roundedK)}K`;
      }
      return `${formatDecimal(roundedK, locale)}K`;
    }

    const roundedK = Math.round(scaledK);
    if (roundedK >= 1000) {
      return '1M';
    }
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(roundedK)}K`;
  }

  if (normalized < 1_000_000_000) {
    const roundedM = roundToSingleDecimal(normalized / 1_000_000);
    if (roundedM >= 1000) {
      return '1B';
    }
    return `${formatDecimal(roundedM, locale)}M`;
  }

  return `${formatDecimal(roundToSingleDecimal(normalized / 1_000_000_000), locale)}B`;
};

export default function CompactCount({ locale, value, className }: Readonly<CompactCountProps>) {
  const formattedValue = React.useMemo(() => formatCompactCount(value, locale), [locale, value]);
  const fullValue = React.useMemo(() => new Intl.NumberFormat(locale).format(value), [locale, value]);

  return (
    <span className={className} title={fullValue} aria-label={fullValue}>
      {formattedValue}
    </span>
  );
}
