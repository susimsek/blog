import { render } from '@testing-library/react';
import MyApp from '@/pages/_app';
import '@testing-library/jest-dom';
import React from 'react';

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

jest.mock('@/config/store', () => ({
  __esModule: true,
  default: { getState: jest.fn(), subscribe: jest.fn(), dispatch: jest.fn() },
}));

jest.mock('@/components/theme/ThemeProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('next-i18next', () => ({
  appWithTranslation: (component: React.ComponentType) => component,
}));

describe('MyApp', () => {
  it('renders child components with all providers', () => {
    const DummyComponent = () => <div>Test Component</div>;
    const { container, getByText } = render(<MyApp Component={DummyComponent} pageProps={{}} router={{} as any} />);

    expect(container).toBeInTheDocument();

    expect(getByText('Test Component')).toBeInTheDocument();
  });
});
