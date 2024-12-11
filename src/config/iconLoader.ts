// config/iconLoader.tsx
import { library } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faLinkedin, faMedium } from '@fortawesome/free-brands-svg-icons';
import {
  faAddressBook,
  faBars,
  faBook,
  faCheck,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faCode,
  faCopy,
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

export const loadIcons = () => {
  library.add(
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
    faCircle,
    faChevronLeft,
    faChevronRight,
    faCopy,
    faCheck,
  );
};
