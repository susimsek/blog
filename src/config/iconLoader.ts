import { library } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faLinkedin, faMedium } from '@fortawesome/free-brands-svg-icons';
import {
  faAddressBook,
  faBars,
  faBook,
  faCalendarAlt,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faCircleCheck,
  faClipboardList,
  faClock,
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
  faPalette,
  faSave,
  faSearch,
  faSignInAlt,
  faSignOutAlt,
  faSort,
  faSun,
  faTags,
  faTimes,
  faTimesCircle,
  faTrash,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { faSidebar } from '@/lib/icons';

import { ReactComponent as JavaIcon } from '@/assets/icons/java.svg';
import { ReactComponent as KotlinIcon } from '@/assets/icons/kotlin.svg';
import { ReactComponent as GoIcon } from '@/assets/icons/go.svg';

import { ReactComponent as TrFlag } from '@/assets/flags/tr.svg';
import { ReactComponent as EnFlag } from '@/assets/flags/en.svg';

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
    faPalette,
    faTimesCircle,
    faCalendarAlt,
    faSort,
    faTags,
    faClock,
    faClipboardList,
    faChevronDown,
  );
};

export const customIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  java: JavaIcon,
  kotlin: KotlinIcon,
  go: GoIcon,
};

export const flags: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  tr: TrFlag,
  en: EnFlag,
};
