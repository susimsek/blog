import { render, screen } from '@testing-library/react';
import Layout from '@/components/common/Layout';

// Mock Header and Footer components
jest.mock('@/components/common/Header', () => ({
  __esModule: true,
  default: () => <header data-testid="header">Header</header>,
}));

jest.mock('@/components/common/Footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer">Footer</footer>,
}));

describe('Layout Component', () => {
  it('renders the Header component', () => {
    render(
      <Layout>
        <div data-testid="child">Content</div>
      </Layout>,
    );

    const header = screen.getByTestId('header');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Header');
  });

  it('renders the Footer component', () => {
    render(
      <Layout>
        <div data-testid="child">Content</div>
      </Layout>,
    );

    const footer = screen.getByTestId('footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent('Footer');
  });

  it('renders the children passed to the Layout', () => {
    render(
      <Layout>
        <div data-testid="child">Content</div>
      </Layout>,
    );

    const child = screen.getByTestId('child');
    expect(child).toBeInTheDocument();
    expect(child).toHaveTextContent('Content');
  });

  it('renders the main container with the correct className', () => {
    render(
      <Layout>
        <div data-testid="child">Content</div>
      </Layout>,
    );

    const mainContainer = screen.getByRole('main').querySelector('.container');
    expect(mainContainer).toBeInTheDocument();
    expect(mainContainer).toHaveClass('py-5');
  });
});
