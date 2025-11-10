if (typeof global.expect !== 'undefined') {
  require('@testing-library/jest-dom');
}

if (typeof jest !== 'undefined') {
  jest.mock('rehype-sanitize', () => ({
    __esModule: true,
    default: jest.fn(),
    defaultSchema: {},
  }));
}

global.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}

  unobserve() {}

  disconnect() {}
};

if (typeof global.Request === 'undefined') {
  global.Request = class {};
}

if (typeof global.Response === 'undefined') {
  global.Response = class {};
}

if (typeof global.Headers === 'undefined') {
  global.Headers = class {};
}

if (typeof global.fetch === 'undefined') {
  global.fetch = typeof jest !== 'undefined' ? jest.fn() : () => Promise.resolve();
}
