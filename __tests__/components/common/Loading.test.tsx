import { render, screen } from '@testing-library/react';
import Loading from '@/components/common/Loading';

describe('Loading Component', () => {
  it('renders a container with the correct class and style', () => {
    render(<Loading />);

    const container = document.querySelector('.d-flex.justify-content-center.align-items-center');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('container');
    expect(container).toHaveStyle('height: 100vh');
  });

  it('renders a spinner inside the container', () => {
    render(<Loading />);

    const spinnerContainer = screen.getByRole('status');
    expect(spinnerContainer).toBeInTheDocument();

    const spinner = spinnerContainer.querySelector('.spinner-border');
    expect(spinner).toBeInTheDocument();
  });
});
