import '@testing-library/jest-dom';

jest.mock('rehype-sanitize', () => ({
  __esModule: true,
  default: jest.fn(),
  defaultSchema: {},
}));

global.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}

  unobserve() {}

  disconnect() {}
};
