import { library } from '@fortawesome/fontawesome-svg-core';
import { faGithub, faLinkedin, faMedium } from '@fortawesome/free-brands-svg-icons';
import {
  faAddressBook,
  faArrowUp,
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
  faDesktop,
  faEnvelope,
  faExclamationCircle,
  faExclamationTriangle,
  faEye,
  faEyeSlash,
  faLeaf,
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
  faRss,
  faTimes,
  faTimesCircle,
  faTrash,
  faUser,
  faWater,
} from '@fortawesome/free-solid-svg-icons';
import { faSidebar } from '@/lib/icons';

import JavaIcon from '@/assets/icons/java.svg';
import KotlinIcon from '@/assets/icons/kotlin.svg';
import GoIcon from '@/assets/icons/go.svg';
import MavenIcon from '@/assets/icons/maven.svg';
import GradleIcon from '@/assets/icons/gradle.svg';
import JavaScriptIcon from '@/assets/icons/javascript.svg';
import TypeScriptIcon from '@/assets/icons/typescript.svg';

import TrFlag from '@/assets/flags/tr.svg';
import EnFlag from '@/assets/flags/en.svg';

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
    faArrowUp,
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
    faRss,
    faWater,
    faLeaf,
    faDesktop,
  );
};

export const customIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  java: JavaIcon,
  kotlin: KotlinIcon,
  go: GoIcon,
  maven: MavenIcon,
  gradle: GradleIcon,
  javascript: JavaScriptIcon,
  typescript: TypeScriptIcon,
};

export const flags: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  tr: TrFlag,
  en: EnFlag,
};
