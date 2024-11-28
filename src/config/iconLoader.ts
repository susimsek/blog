import {
  faBars,
  faBook,
  faCheckCircle,
  faCode,
  faDatabase,
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
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faSidebar } from '@/lib/icons';

// Load icons into FontAwesome library
export const loadIcons = () => {
  library.add(
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
    faCheckCircle,
    faExclamationCircle,
    faExclamationTriangle,
    faInfoCircle,
    faTimes,
    faSidebar,
    faUser
  );
};
