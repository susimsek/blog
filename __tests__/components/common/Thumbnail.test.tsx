import { render, screen } from '@testing-library/react';
import Thumbnail from '@/components/common/Thumbnail';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({
    src,
    alt,
    width,
    height,
    style,
    priority,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    style?: React.CSSProperties;
    priority?: boolean;
  }) => (
    <img src={src} alt={alt} width={width} height={height} style={style} data-priority={priority ? 'true' : 'false'} />
  ),
}));

describe('Thumbnail Component', () => {
  it('renders the image with default dimensions', () => {
    render(<Thumbnail src="/test-image.jpg" alt="Test Image" />);

    const image = screen.getByAltText('Test Image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
    expect(image).toHaveAttribute('width', '1200');
    expect(image).toHaveAttribute('height', '630');
  });

  it('renders the image with custom dimensions', () => {
    render(<Thumbnail src="/test-image.jpg" alt="Test Image" width={400} height={300} />);

    const image = screen.getByAltText('Test Image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
    expect(image).toHaveAttribute('width', '400');
    expect(image).toHaveAttribute('height', '300');
  });

  it('applies additional class names', () => {
    render(<Thumbnail src="/test-image.jpg" alt="Test Image" className="custom-class" />);

    const container = screen.getByAltText('Test Image').closest('div');
    expect(container).toHaveClass('custom-class');
  });

  it('renders the image with full responsiveness', () => {
    render(<Thumbnail src="/test-image.jpg" alt="Test Image" />);

    const image = screen.getByAltText('Test Image');
    expect(image).toHaveStyle('width: 100%; height: auto;');
  });

  it('sets priority loading when passed as a prop', () => {
    render(<Thumbnail src="/test-image.jpg" alt="Test Image" priority />);

    const image = screen.getByAltText('Test Image');
    // Check if the 'priority' prop is passed correctly by looking for a data-priority attribute
    expect(image).toHaveAttribute('data-priority', 'true'); // should be 'true' when priority is passed
  });
});
