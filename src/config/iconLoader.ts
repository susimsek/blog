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
  faCircleCheck,
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

// SVG ikonları ekliyoruz
import { ReactComponent as JavaIcon } from '@/assets/icons/java.svg';
import { ReactComponent as KotlinIcon } from '@/assets/icons/kotlin.svg';
import { ReactComponent as GoIcon } from '@/assets/icons/go.svg';

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
    faCircleCheck,
  );
};

export const customIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  java: JavaIcon,
  kotlin: KotlinIcon,
  go: GoIcon,
};
