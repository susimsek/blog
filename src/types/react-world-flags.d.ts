declare module 'react-world-flags' {
  import React from 'react';

  const Flag: React.FC<{ code: string; style?: React.CSSProperties; className?: string }>;

  export default Flag;
}
