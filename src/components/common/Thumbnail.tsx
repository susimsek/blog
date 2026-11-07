// components/common/Thumbnail.tsx
import Image from 'next/image';

type ThumbnailProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  noBottomMargin?: boolean;
};

export default function Thumbnail({
  src,
  alt,
  width = 1200,
  height = 630,
  className = '',
  priority = false,
  noBottomMargin = false,
}: Readonly<ThumbnailProps>) {
  return (
    <div className={`image-wrapper text-center ${noBottomMargin ? '' : 'mb-4'} ${className}`}>
      <Image
        src={src}
        alt={alt}
        className="img-fluid rounded"
        width={width}
        height={height}
        style={{ width: '100%', height: 'auto' }}
        priority={priority}
      />
    </div>
  );
}
