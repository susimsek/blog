// components/common/Thumbnail.tsx
import Image from 'next/image';

interface ThumbnailProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function Thumbnail({ src, alt, width = 800, height = 600, className = '' }: ThumbnailProps) {
  return (
    <div className={`text-center mb-4 ${className}`}>
      <Image
        src={src}
        alt={alt}
        className="img-fluid rounded"
        width={width}
        height={height}
        style={{ width: '100%', height: 'auto' }}
        priority={true}
      />
    </div>
  );
}
