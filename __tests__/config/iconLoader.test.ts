// __tests__/config/iconLoader.test.tsx
import { library } from '@fortawesome/fontawesome-svg-core';
import { loadIcons } from '@/config/iconLoader';
import { faGithub, faLinkedin, faMedium } from '@fortawesome/free-brands-svg-icons';
import {
  faAddressBook,
  faBars,
  faBook,
  faCheckCircle,
  faCode,
  faDatabase,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faGlobe,
  faHome,
  faInfoCircle,
  faMoon,
  faSave,
  faSearch,
  faSignInAlt,
  faSignOutAlt,
  faSun,
  faTimes,
  faTrash,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { faSidebar } from '@/lib/icons';

jest.mock('@fortawesome/fontawesome-svg-core', () => ({
  library: {
    add: jest.fn(),
  },
}));

describe('Icon Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks to isolate each test
  });

  it('should add all icons to the library', () => {
    loadIcons();

    expect(library.add).toHaveBeenCalledWith(
      faGithub,
      faLinkedin,
      faMedium,
      faBook,
      faGlobe,
      faHome,
      faSave,
      faSearch,
      faSignOutAlt,
      faSignInAlt,
      faSun,
      faMoon,
      faBars,
      faExclamationTriangle,
      faInfoCircle,
      faCheckCircle,
      faExclamationCircle,
      faTrash,
      faDatabase,
      faCode,
      faEye,
      faEyeSlash,
      faTimes,
      faSidebar,
      faUser,
      faEnvelope,
      faAddressBook,
    );

    // Ensure the library.add function is called exactly once
    expect(library.add).toHaveBeenCalledTimes(1);
  });

  it('should not throw errors during execution', () => {
    expect(() => loadIcons()).not.toThrow();
  });
});
