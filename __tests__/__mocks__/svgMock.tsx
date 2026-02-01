import React from 'react';

export default function SvgMock(props: Readonly<React.SVGProps<SVGSVGElement>>) {
  return <svg {...props} />;
}
