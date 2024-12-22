// components/common/Thumbnail.tsx
import Image from 'next/image';

type ThumbnailProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export default function Thumbnail({
  src,
  alt,
  width = 800,
  height = 600,
  className = '',
  priority = true,
}: Readonly<ThumbnailProps>) {
  return (
    <div className={`image-wrapper text-center mb-4 ${className}`}>
      <Image
        src={src}
        alt={alt}
        className="img-fluid"
        width={width}
        height={height}
        style={{ width: '100%', height: 'auto' }}
        priority={priority}
      />
    </div>
  );
}
