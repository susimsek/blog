import '@testing-library/jest-dom';

global.IntersectionObserver = class {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {}

  unobserve() {}

  disconnect() {}
};
