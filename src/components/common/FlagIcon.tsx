import React from 'react';
import { flags } from '@/config/iconLoader';

interface FlagIconProps {
  code: string; // ISO 3166-1 alpha-2 country code
  alt?: string;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
  className?: string;
}

const FlagIcon: React.FC<Readonly<FlagIconProps>> = ({ code, alt, width = 20, height = 20, style, className }) => {
  const FlagComponent = flags[code];

  if (!FlagComponent) {
    console.error(`Flag icon for "${code}" not found`);
    return null;
  }

  return (
    <FlagComponent
      width={width}
      height={height}
      style={{ ...style, display: 'inline-block' }}
      className={className}
      aria-label={alt ?? `${code} flag`}
    >
      <title>{alt ?? `${code} flag`}</title>
    </FlagComponent>
  );
};

export default FlagIcon;
