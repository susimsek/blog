'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PaginationBar from '@/components/pagination/PaginationBar';
import FlagIcon from '@/components/common/FlagIcon';
import {
  changeAdminAvatar,
  changeAdminName,
  changeAdminPassword,
  changeAdminUsername,
  createAdminErrorMessage,
  deleteAdminErrorMessage,
  deleteAdminNewsletterSubscriber,
  deleteAdminAccount,
  fetchAdminActiveSessions,
  fetchAdminErrorMessages,
  fetchAdminMe,
  fetchAdminNewsletterSubscribers,
  isAdminSessionError,
  resolveAdminError,
  revokeAdminSession,
  revokeAllAdminSessions,
  updateAdminNewsletterSubscriberStatus,
  updateAdminErrorMessage,
  type AdminErrorMessageItem,
  type AdminNewsletterSubscriberItem,
} from '@/lib/adminApi';
import { withAdminAvatarSize } from '@/lib/adminAvatar';
import { ADMIN_ROUTES } from '@/lib/adminRoutes';
import { defaultLocale } from '@/i18n/settings';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import Link from '@/components/common/Link';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { resetToSystemTheme, setTheme, type Theme } from '@/reducers/theme';
import { LOCALES, THEMES } from '@/config/constants';

type AdminAccountPageProps = {
  section: 'profile' | 'account' | 'appearance' | 'sessions' | 'newsletter' | 'security' | 'errors';
};

type AdminIdentity = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  email: string;
  roles: string[];
} | null;

type AdminSession = {
  id: string;
  device: string;
  ipAddress: string;
  countryCode: string;
  lastActivityAt: string;
  createdAt: string;
  expiresAt: string;
  persistent: boolean;
  current: boolean;
};

const MIN_PASSWORD_LENGTH = 8;
const STRONG_PASSWORD_LENGTH = 12;
const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 32;
const DELETE_CONFIRMATION_VALUE = 'DELETE';
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const ERROR_MESSAGE_CODE_PATTERN = /^[A-Z0-9_]{2,120}$/;
const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;
const MAX_AVATAR_FILE_BYTES = 2 * 1024 * 1024;
const MAX_AVATAR_FILE_SIZE_MB = Math.floor(MAX_AVATAR_FILE_BYTES / (1024 * 1024));
const AVATAR_CROP_VIEWPORT_SIZE = 260;
const AVATAR_CROP_MIN_SIZE = 96;
const DEFAULT_AVATAR_EXPORT_SIZE = 512;
const MIN_AVATAR_EXPORT_SIZE = 128;
const MIN_AVATAR_EXPORT_QUALITY = 0.5;
const ALLOWED_AVATAR_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

type AvatarCropOffset = {
  x: number;
  y: number;
};

type AvatarCropResizeState = {
  pointerID: number;
  centerX: number;
  centerY: number;
  startDistance: number;
  startCropSize: number;
};

const parseDateValue = (value: string) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return new Date(parsed);
};

const loadImageFromSource = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      resolve(image);
    };
    image.onerror = () => {
      reject(new Error('invalid image file'));
    };
    image.src = source;
  });

const estimateDataURLBytes = (dataURL: string) => {
  const encoded = dataURL.split(',', 2)[1] ?? '';
  return Math.floor((encoded.length * 3) / 4);
};

const clampAvatarCropOffset = (
  offset: AvatarCropOffset,
  options: {
    imageWidth: number;
    imageHeight: number;
    zoom: number;
    cropSize: number;
  },
) => {
  const { imageWidth, imageHeight, zoom, cropSize } = options;
  if (imageWidth <= 0 || imageHeight <= 0 || zoom <= 0 || cropSize <= 0) {
    return { x: 0, y: 0 };
  }

  const displayWidth = imageWidth * zoom;
  const displayHeight = imageHeight * zoom;
  const maxOffsetX = Math.max(0, (displayWidth - cropSize) / 2);
  const maxOffsetY = Math.max(0, (displayHeight - cropSize) / 2);

  return {
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, offset.x)),
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, offset.y)),
  };
};

const toCroppedAvatarDataURL = async (options: {
  source: string;
  imageWidth: number;
  imageHeight: number;
  zoom: number;
  offset: AvatarCropOffset;
  cropSize: number;
}) => {
  const image = await loadImageFromSource(options.source);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('image render failed');
  }

  let exportSize = DEFAULT_AVATAR_EXPORT_SIZE;
  while (exportSize >= MIN_AVATAR_EXPORT_SIZE) {
    canvas.width = exportSize;
    canvas.height = exportSize;
    ctx.clearRect(0, 0, exportSize, exportSize);

    const exportScale = exportSize / options.cropSize;
    const displayWidth = options.imageWidth * options.zoom;
    const displayHeight = options.imageHeight * options.zoom;
    const left = (options.cropSize - displayWidth) / 2 - options.offset.x;
    const top = (options.cropSize - displayHeight) / 2 - options.offset.y;

    ctx.drawImage(
      image,
      left * exportScale,
      top * exportScale,
      displayWidth * exportScale,
      displayHeight * exportScale,
    );

    let quality = 0.92;
    let dataURL = canvas.toDataURL('image/webp', quality);
    while (estimateDataURLBytes(dataURL) > MAX_AVATAR_FILE_BYTES && quality >= MIN_AVATAR_EXPORT_QUALITY) {
      quality = Number((quality - 0.08).toFixed(2));
      dataURL = canvas.toDataURL('image/webp', quality);
    }

    if (estimateDataURLBytes(dataURL) <= MAX_AVATAR_FILE_BYTES) {
      return dataURL;
    }

    exportSize = Math.floor(exportSize * 0.8);
  }

  throw new Error('avatar image too large');
};

const resolveSessionDeviceIcon = (deviceLabel: string) => {
  const normalized = deviceLabel.toLowerCase();
  if (normalized.includes('iphone') || normalized.includes('android') || normalized.includes('mobile')) {
    return 'mobile-screen-button';
  }
  if (normalized.includes('ipad') || normalized.includes('tablet')) {
    return 'tablet-screen-button';
  }
  if (normalized.includes('mac') || normalized.includes('windows') || normalized.includes('linux')) {
    return 'laptop';
  }

  return 'desktop';
};

const getPasswordStrength = (password: string) => {
  const value = password;
  if (value === '') {
    return { score: 0, tone: 'idle' as const };
  }

  const characterGroups = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

  let score = 1;
  if (value.length >= 6) score += 1;
  if (value.length >= MIN_PASSWORD_LENGTH) score += 1;
  if (value.length >= STRONG_PASSWORD_LENGTH) score += 1;
  if (characterGroups >= 3) score += 1;

  if (score <= 1) {
    return { score, tone: 'weak' as const };
  }
  if (score === 2) {
    return { score, tone: 'fair' as const };
  }
  if (score === 3) {
    return { score, tone: 'good' as const };
  }
  if (score === 4) {
    return { score, tone: 'strong' as const };
  }

  return { score, tone: 'excellent' as const };
};

const resolveAppearanceCardClass = (value: Theme | 'system') => {
  switch (value) {
    case 'light':
      return 'admin-account-appearance-option--light';
    case 'dark':
      return 'admin-account-appearance-option--dark';
    case 'oceanic':
      return 'admin-account-appearance-option--oceanic';
    case 'forest':
      return 'admin-account-appearance-option--forest';
    default:
      return 'admin-account-appearance-option--system';
  }
};

const resolveAppearanceMetaIcon = (value: Theme | 'system') => {
  switch (value) {
    case 'light':
      return 'sun';
    case 'dark':
      return 'moon';
    case 'oceanic':
      return 'water';
    case 'forest':
      return 'leaf';
    default:
      return 'desktop';
  }
};

const toAdminErrorMessageKey = (item: Pick<AdminErrorMessageItem, 'scope' | 'locale' | 'code'>) =>
  `${item.scope}|${item.locale}|${item.code}`;

export default function AdminAccountPage({ section }: Readonly<AdminAccountPageProps>) {
  const { t } = useTranslation(['admin-account', 'admin-common']);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const isProfileSection = section === 'profile';
  const isAccountSection = section === 'account';
  const isAppearanceSection = section === 'appearance';
  const isSessionsSection = section === 'sessions';
  const isNewsletterSection = section === 'newsletter';
  const isSecuritySection = section === 'security';
  const isErrorsSection = section === 'errors';

  const [adminUser, setAdminUser] = React.useState<AdminIdentity>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isSecuritySubmitting, setIsSecuritySubmitting] = React.useState(false);
  const [securityErrorMessage, setSecurityErrorMessage] = React.useState('');
  const [securitySuccessMessage, setSecuritySuccessMessage] = React.useState('');
  const [hasSecuritySubmitted, setHasSecuritySubmitted] = React.useState(false);
  const [securityTouchedFields, setSecurityTouchedFields] = React.useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const [activeSessions, setActiveSessions] = React.useState<AdminSession[]>([]);
  const [isSessionsLoading, setIsSessionsLoading] = React.useState(isSessionsSection);
  const [sessionErrorMessage, setSessionErrorMessage] = React.useState('');
  const [sessionSuccessMessage, setSessionSuccessMessage] = React.useState('');
  const [revokingSessionID, setRevokingSessionID] = React.useState('');
  const [isRevokingAllSessions, setIsRevokingAllSessions] = React.useState(false);
  const [newsletterSubscribers, setNewsletterSubscribers] = React.useState<AdminNewsletterSubscriberItem[]>([]);
  const [isNewsletterLoading, setIsNewsletterLoading] = React.useState(isNewsletterSection);
  const [newsletterErrorMessage, setNewsletterErrorMessage] = React.useState('');
  const [newsletterSuccessMessage, setNewsletterSuccessMessage] = React.useState('');
  const [newsletterFilterLocale, setNewsletterFilterLocale] = React.useState<'all' | 'en' | 'tr'>('all');
  const [newsletterFilterStatus, setNewsletterFilterStatus] = React.useState<
    'all' | 'pending' | 'active' | 'unsubscribed'
  >('all');
  const [newsletterFilterQuery, setNewsletterFilterQuery] = React.useState('');
  const [newsletterFilterQueryDebounced, setNewsletterFilterQueryDebounced] = React.useState('');
  const [newsletterPage, setNewsletterPage] = React.useState(1);
  const [newsletterPageSize, setNewsletterPageSize] = React.useState(10);
  const [totalNewsletterSubscribers, setTotalNewsletterSubscribers] = React.useState(0);
  const [updatingNewsletterEmail, setUpdatingNewsletterEmail] = React.useState('');
  const [deletingNewsletterEmail, setDeletingNewsletterEmail] = React.useState('');
  const [pendingNewsletterDelete, setPendingNewsletterDelete] = React.useState<AdminNewsletterSubscriberItem | null>(
    null,
  );
  const [errorMessages, setErrorMessages] = React.useState<AdminErrorMessageItem[]>([]);
  const [isErrorMessagesLoading, setIsErrorMessagesLoading] = React.useState(isErrorsSection);
  const [errorMessagesErrorMessage, setErrorMessagesErrorMessage] = React.useState('');
  const [errorMessagesSuccessMessage, setErrorMessagesSuccessMessage] = React.useState('');
  const [errorFilterLocale, setErrorFilterLocale] = React.useState<'all' | 'en' | 'tr'>('all');
  const [errorFilterQuery, setErrorFilterQuery] = React.useState('');
  const [errorFilterQueryDebounced, setErrorFilterQueryDebounced] = React.useState('');
  const [errorCrudTab, setErrorCrudTab] = React.useState<'create' | 'update'>('update');
  const [isErrorEditorModalOpen, setIsErrorEditorModalOpen] = React.useState(false);
  const [selectedErrorMessageKey, setSelectedErrorMessageKey] = React.useState('');
  const [errorMessagesPage, setErrorMessagesPage] = React.useState(1);
  const [errorMessagesPageSize, setErrorMessagesPageSize] = React.useState(5);
  const [totalErrorMessages, setTotalErrorMessages] = React.useState(0);
  const [errorCreateLocale, setErrorCreateLocale] = React.useState<'en' | 'tr'>('en');
  const [errorCreateCode, setErrorCreateCode] = React.useState('');
  const [errorCreateMessage, setErrorCreateMessage] = React.useState('');
  const [isErrorCreateSubmitting, setIsErrorCreateSubmitting] = React.useState(false);
  const [errorUpdateMessage, setErrorUpdateMessage] = React.useState('');
  const [isErrorUpdateSubmitting, setIsErrorUpdateSubmitting] = React.useState(false);
  const [isErrorDeleteSubmitting, setIsErrorDeleteSubmitting] = React.useState(false);
  const [deletingErrorMessageKey, setDeletingErrorMessageKey] = React.useState('');
  const [pendingErrorMessageDelete, setPendingErrorMessageDelete] = React.useState<AdminErrorMessageItem | null>(null);

  const [usernameInput, setUsernameInput] = React.useState('');
  const [isUsernameSubmitting, setIsUsernameSubmitting] = React.useState(false);
  const [usernameSubmitted, setUsernameSubmitted] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [usernameSuccessMessage, setUsernameSuccessMessage] = React.useState('');
  const [nameInput, setNameInput] = React.useState('');
  const [isNameSubmitting, setIsNameSubmitting] = React.useState(false);
  const [nameSubmitted, setNameSubmitted] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [nameSuccessMessage, setNameSuccessMessage] = React.useState('');
  const [isAvatarSubmitting, setIsAvatarSubmitting] = React.useState(false);
  const [avatarPendingAction, setAvatarPendingAction] = React.useState<'upload' | 'remove' | null>(null);
  const [avatarErrorMessage, setAvatarErrorMessage] = React.useState('');
  const [avatarSuccessMessage, setAvatarSuccessMessage] = React.useState('');
  const [isAvatarCropModalOpen, setIsAvatarCropModalOpen] = React.useState(false);
  const [avatarCropSource, setAvatarCropSource] = React.useState('');
  const [avatarCropImageSize, setAvatarCropImageSize] = React.useState({ width: 0, height: 0 });
  const [avatarCropOffset, setAvatarCropOffset] = React.useState<AvatarCropOffset>({ x: 0, y: 0 });
  const [avatarCropZoom, setAvatarCropZoom] = React.useState(1);
  const [avatarCropSize, setAvatarCropSize] = React.useState(AVATAR_CROP_VIEWPORT_SIZE);
  const [avatarCropSizeBounds, setAvatarCropSizeBounds] = React.useState({
    min: AVATAR_CROP_MIN_SIZE,
    max: AVATAR_CROP_VIEWPORT_SIZE,
  });
  const [isAvatarCropSaving, setIsAvatarCropSaving] = React.useState(false);
  const [isAvatarCropDragging, setIsAvatarCropDragging] = React.useState(false);
  const [isAvatarCropResizing, setIsAvatarCropResizing] = React.useState(false);
  const avatarCropStageRef = React.useRef<HTMLDivElement | null>(null);
  const newsletterListTopRef = React.useRef<HTMLDivElement | null>(null);
  const errorMessagesListTopRef = React.useRef<HTMLDivElement | null>(null);
  const avatarCropDragRef = React.useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const avatarCropResizeRef = React.useRef<AvatarCropResizeState | null>(null);
  const avatarFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const selectedErrorMessageKeyRef = React.useRef('');
  const errorMessagesRequestIDRef = React.useRef(0);
  const newsletterRequestIDRef = React.useRef(0);

  const [deleteCurrentPassword, setDeleteCurrentPassword] = React.useState('');
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const [showDeletePassword, setShowDeletePassword] = React.useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = React.useState(false);
  const [deleteSubmitted, setDeleteSubmitted] = React.useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = React.useState('');
  const [deleteSuccessMessage, setDeleteSuccessMessage] = React.useState('');
  const selectedTheme = useAppSelector(state => state.theme.theme);
  const hasExplicitTheme = useAppSelector(state => state.theme.hasExplicitTheme);

  const sessionDateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    [locale],
  );

  React.useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const me = await fetchAdminMe();
        if (!isMounted) {
          return;
        }

        if (!me.authenticated || !me.user) {
          router.replace(`/${locale}/admin/login`);
          return;
        }

        setAdminUser(me.user);
        setNameInput(me.user.name ?? '');
        setUsernameInput(me.user.username ?? '');
        if (!isSessionsSection) {
          return;
        }

        setIsSessionsLoading(true);
        try {
          const sessions = await fetchAdminActiveSessions();
          if (!isMounted) {
            return;
          }
          setActiveSessions(sessions);
          setSessionErrorMessage('');
        } catch (error) {
          if (!isMounted) {
            return;
          }
          if (isAdminSessionError(error)) {
            router.replace(`/${locale}/admin/login`);
            return;
          }
          const resolvedError = resolveAdminError(error);
          setSessionErrorMessage(
            resolvedError.kind === 'network'
              ? t('adminCommon.errors.network', { ns: 'admin-common' })
              : resolvedError.message || t('adminAccount.sessions.errors.load', { ns: 'admin-account' }),
          );
        } finally {
          if (isMounted) {
            setIsSessionsLoading(false);
          }
        }
      } catch {
        if (isMounted) {
          router.replace(`/${locale}/admin/login`);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [isSessionsSection, locale, router, t]);

  React.useEffect(() => {
    if (!nameSuccessMessage) {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setNameSuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [nameSuccessMessage]);

  React.useEffect(() => {
    if (!usernameSuccessMessage) {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setUsernameSuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [usernameSuccessMessage]);

  React.useEffect(() => {
    if (!sessionSuccessMessage) {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setSessionSuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [sessionSuccessMessage]);

  React.useEffect(() => {
    if (!securitySuccessMessage) {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setSecuritySuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [securitySuccessMessage]);

  React.useEffect(() => {
    if (!deleteSuccessMessage) {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setDeleteSuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [deleteSuccessMessage]);

  React.useEffect(() => {
    if (!avatarSuccessMessage) {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setAvatarSuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [avatarSuccessMessage]);

  React.useEffect(() => {
    const timeoutID = globalThis.setTimeout(() => {
      setNewsletterFilterQueryDebounced(newsletterFilterQuery.trim());
    }, 220);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [newsletterFilterQuery]);

  React.useEffect(() => {
    if (!newsletterSuccessMessage) {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setNewsletterSuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [newsletterSuccessMessage]);

  React.useEffect(() => {
    setNewsletterPage(1);
  }, [newsletterFilterLocale, newsletterFilterQueryDebounced, newsletterFilterStatus]);

  React.useEffect(() => {
    const timeoutID = globalThis.setTimeout(() => {
      setErrorFilterQueryDebounced(errorFilterQuery.trim());
    }, 220);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [errorFilterQuery]);

  React.useEffect(() => {
    if (!errorMessagesSuccessMessage) {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setErrorMessagesSuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [errorMessagesSuccessMessage]);

  React.useEffect(() => {
    selectedErrorMessageKeyRef.current = selectedErrorMessageKey;
  }, [selectedErrorMessageKey]);

  React.useEffect(() => {
    setErrorMessagesPage(1);
  }, [errorFilterLocale, errorFilterQueryDebounced]);

  React.useEffect(
    () => () => {
      if (avatarCropSource) {
        URL.revokeObjectURL(avatarCropSource);
      }
    },
    [avatarCropSource],
  );

  const securityCurrentPasswordError =
    currentPassword === '' ? t('adminAccount.validation.currentPasswordRequired', { ns: 'admin-account' }) : '';
  const securityNewPasswordError =
    newPassword === ''
      ? t('adminAccount.validation.newPasswordRequired', { ns: 'admin-account' })
      : newPassword.length < MIN_PASSWORD_LENGTH
        ? t('adminAccount.validation.newPasswordMin', { ns: 'admin-account', count: MIN_PASSWORD_LENGTH })
        : currentPassword !== '' && currentPassword === newPassword
          ? t('adminAccount.validation.newPasswordDifferent', { ns: 'admin-account' })
          : '';
  const securityConfirmPasswordError =
    confirmPassword === ''
      ? t('adminAccount.validation.confirmPasswordRequired', { ns: 'admin-account' })
      : confirmPassword !== newPassword
        ? t('adminAccount.validation.confirmPasswordMismatch', { ns: 'admin-account' })
        : '';
  const passwordStrength = getPasswordStrength(newPassword);
  const showCurrentPasswordError =
    (hasSecuritySubmitted || securityTouchedFields.currentPassword) && securityCurrentPasswordError !== '';
  const showNewPasswordError =
    (hasSecuritySubmitted || securityTouchedFields.newPassword) && securityNewPasswordError !== '';
  const showConfirmPasswordError =
    (hasSecuritySubmitted || securityTouchedFields.confirmPassword) && securityConfirmPasswordError !== '';

  const resolvedUsernameInput = usernameInput.trim();
  const resolvedNameInput = nameInput.trim();
  const profileName = adminUser?.name?.trim() ?? '';
  const profileUsername = adminUser?.username?.trim() ?? '';
  const profileAvatarURL = withAdminAvatarSize(adminUser?.avatarUrl, 200);
  const settingsSidebarAvatarURL = withAdminAvatarSize(adminUser?.avatarUrl, 48);
  const profileRoles = adminUser?.roles?.join(', ') ?? '';
  const isNameDirty = resolvedNameInput !== profileName;
  const isUsernameDirty = resolvedUsernameInput.toLowerCase() !== profileUsername.toLowerCase();
  const nameValidationError =
    resolvedNameInput === ''
      ? t('adminAccount.validation.nameRequired', { ns: 'admin-account' })
      : resolvedNameInput.length < MIN_NAME_LENGTH || resolvedNameInput.length > MAX_NAME_LENGTH
        ? t('adminAccount.validation.nameLength', {
            ns: 'admin-account',
            min: MIN_NAME_LENGTH,
            max: MAX_NAME_LENGTH,
          })
        : '';
  const showNameValidationError = (nameSubmitted || isNameDirty) && nameValidationError !== '';
  const usernameValidationError =
    resolvedUsernameInput === ''
      ? t('adminAccount.validation.usernameRequired', { ns: 'admin-account' })
      : resolvedUsernameInput.length < MIN_USERNAME_LENGTH || resolvedUsernameInput.length > MAX_USERNAME_LENGTH
        ? t('adminAccount.validation.usernameLength', {
            ns: 'admin-account',
            min: MIN_USERNAME_LENGTH,
            max: MAX_USERNAME_LENGTH,
          })
        : !USERNAME_PATTERN.test(resolvedUsernameInput)
          ? t('adminAccount.validation.usernamePattern', { ns: 'admin-account' })
          : profileUsername.toLowerCase() === resolvedUsernameInput.toLowerCase()
            ? t('adminAccount.validation.usernameDifferent', { ns: 'admin-account' })
            : '';
  const showUsernameValidationError = (usernameSubmitted || isUsernameDirty) && usernameValidationError !== '';

  const deletePasswordError =
    deleteCurrentPassword === '' ? t('adminAccount.validation.currentPasswordRequired', { ns: 'admin-account' }) : '';
  const deleteConfirmError =
    deleteConfirmation.trim().toUpperCase() !== DELETE_CONFIRMATION_VALUE
      ? t('adminAccount.validation.deleteConfirmation', { ns: 'admin-account', value: DELETE_CONFIRMATION_VALUE })
      : '';
  const showDeletePasswordError = deleteSubmitted && deletePasswordError !== '';
  const showDeleteConfirmError = deleteSubmitted && deleteConfirmError !== '';
  const activeAppearance = hasExplicitTheme ? selectedTheme : 'system';
  const selectedErrorMessage = React.useMemo(
    () => errorMessages.find(item => toAdminErrorMessageKey(item) === selectedErrorMessageKey) ?? null,
    [errorMessages, selectedErrorMessageKey],
  );
  const totalNewsletterPages = Math.max(1, Math.ceil(totalNewsletterSubscribers / newsletterPageSize));
  const totalErrorMessagePages = Math.max(1, Math.ceil(totalErrorMessages / errorMessagesPageSize));
  const doesErrorMessageMatchFilters = React.useCallback(
    (item: Pick<AdminErrorMessageItem, 'scope' | 'locale' | 'code' | 'message'>) => {
      const normalizedLocale = item.locale.trim().toLowerCase();
      if (errorFilterLocale !== 'all' && normalizedLocale !== errorFilterLocale) {
        return false;
      }

      if (!errorFilterQueryDebounced) {
        return true;
      }

      const normalizedQuery = errorFilterQueryDebounced.toLowerCase();
      return [item.scope, item.locale, item.code, item.message].some(part =>
        part.trim().toLowerCase().includes(normalizedQuery),
      );
    },
    [errorFilterLocale, errorFilterQueryDebounced],
  );
  const normalizedErrorCreateCode = errorCreateCode.trim().toUpperCase();
  const normalizedErrorCreateMessage = errorCreateMessage.trim();
  const normalizedErrorUpdateMessage = errorUpdateMessage.trim();
  const isErrorCreateCodeValid = ERROR_MESSAGE_CODE_PATTERN.test(normalizedErrorCreateCode);
  const canCreateErrorMessage =
    normalizedErrorCreateCode !== '' &&
    isErrorCreateCodeValid &&
    normalizedErrorCreateMessage !== '' &&
    !isErrorCreateSubmitting;
  const canUpdateErrorMessage =
    selectedErrorMessage !== null &&
    normalizedErrorUpdateMessage !== '' &&
    normalizedErrorUpdateMessage !== selectedErrorMessage.message &&
    !isErrorUpdateSubmitting &&
    !isErrorDeleteSubmitting;
  const avatarCropDisplayWidth = avatarCropImageSize.width * avatarCropZoom;
  const avatarCropDisplayHeight = avatarCropImageSize.height * avatarCropZoom;
  const avatarCropImageStyle = React.useMemo<React.CSSProperties>(
    () => ({
      width: `${avatarCropDisplayWidth}px`,
      height: `${avatarCropDisplayHeight}px`,
      transform: 'translate(-50%, -50%)',
    }),
    [avatarCropDisplayHeight, avatarCropDisplayWidth],
  );
  const avatarCropBoxStyle = React.useMemo<React.CSSProperties>(
    () => ({
      transform: `translate(calc(-50% + ${avatarCropOffset.x}px), calc(-50% + ${avatarCropOffset.y}px))`,
    }),
    [avatarCropOffset.x, avatarCropOffset.y],
  );
  const avatarCropStageStyle = React.useMemo<React.CSSProperties>(
    () =>
      ({
        '--avatar-crop-mask-size': `${avatarCropSize}px`,
        width: `${Math.max(1, Math.round(avatarCropDisplayWidth))}px`,
        height: `${Math.max(1, Math.round(avatarCropDisplayHeight))}px`,
      }) as React.CSSProperties,
    [avatarCropDisplayHeight, avatarCropDisplayWidth, avatarCropSize],
  );

  const resolveClampedAvatarCropOffset = React.useCallback(
    (offset: AvatarCropOffset, cropSize = avatarCropSize, zoom = avatarCropZoom) =>
      clampAvatarCropOffset(offset, {
        imageWidth: avatarCropImageSize.width,
        imageHeight: avatarCropImageSize.height,
        zoom,
        cropSize,
      }),
    [avatarCropImageSize.height, avatarCropImageSize.width, avatarCropSize, avatarCropZoom],
  );

  const closeAvatarCropModal = React.useCallback(() => {
    setIsAvatarCropModalOpen(false);
    setIsAvatarCropSaving(false);
    setIsAvatarCropDragging(false);
    setIsAvatarCropResizing(false);
    avatarCropDragRef.current = null;
    avatarCropResizeRef.current = null;
    setAvatarCropOffset({ x: 0, y: 0 });
    setAvatarCropZoom(1);
    setAvatarCropSize(AVATAR_CROP_VIEWPORT_SIZE);
    setAvatarCropSizeBounds({
      min: AVATAR_CROP_MIN_SIZE,
      max: AVATAR_CROP_VIEWPORT_SIZE,
    });
    setAvatarCropImageSize({ width: 0, height: 0 });
    setAvatarCropSource(previous => {
      if (previous) {
        URL.revokeObjectURL(previous);
      }
      return '';
    });
  }, []);

  const handleAvatarCropPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!avatarCropSource || isAvatarCropSaving || isAvatarSubmitting || isAvatarCropResizing) {
        return;
      }

      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      avatarCropDragRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startOffsetX: avatarCropOffset.x,
        startOffsetY: avatarCropOffset.y,
      };
      setIsAvatarCropDragging(true);
    },
    [
      avatarCropOffset.x,
      avatarCropOffset.y,
      avatarCropSource,
      isAvatarCropResizing,
      isAvatarCropSaving,
      isAvatarSubmitting,
    ],
  );

  const handleAvatarCropPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isAvatarCropResizing) {
        return;
      }

      const activeDrag = avatarCropDragRef.current;
      if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      const nextOffset = resolveClampedAvatarCropOffset({
        x: activeDrag.startOffsetX + (event.clientX - activeDrag.startClientX),
        y: activeDrag.startOffsetY + (event.clientY - activeDrag.startClientY),
      });

      setAvatarCropOffset(nextOffset);
    },
    [isAvatarCropResizing, resolveClampedAvatarCropOffset],
  );

  const endAvatarCropDrag = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const activeDrag = avatarCropDragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    avatarCropDragRef.current = null;
    setIsAvatarCropDragging(false);
  }, []);

  const handleAvatarCropResizeStart = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      if (!avatarCropSource || isAvatarCropSaving || isAvatarSubmitting) {
        return;
      }

      const stageElement = avatarCropStageRef.current;
      if (!stageElement) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const stageRect = stageElement.getBoundingClientRect();
      const centerX = stageRect.left + stageRect.width / 2;
      const centerY = stageRect.top + stageRect.height / 2;
      const cropCenterX = centerX + avatarCropOffset.x;
      const cropCenterY = centerY + avatarCropOffset.y;
      const startDistance = Math.hypot(event.clientX - cropCenterX, event.clientY - cropCenterY);

      if (startDistance <= 0) {
        return;
      }

      avatarCropResizeRef.current = {
        pointerID: event.pointerId,
        centerX: cropCenterX,
        centerY: cropCenterY,
        startDistance,
        startCropSize: avatarCropSize,
      };
      setIsAvatarCropResizing(true);
    },
    [avatarCropOffset.x, avatarCropOffset.y, avatarCropSize, avatarCropSource, isAvatarCropSaving, isAvatarSubmitting],
  );

  React.useEffect(() => {
    if (!isAvatarCropResizing) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const activeResize = avatarCropResizeRef.current;
      if (!activeResize || activeResize.pointerID !== event.pointerId) {
        return;
      }

      const currentDistance = Math.hypot(event.clientX - activeResize.centerX, event.clientY - activeResize.centerY);
      if (!Number.isFinite(currentDistance) || currentDistance <= 0) {
        return;
      }

      const distanceRatio = currentDistance / activeResize.startDistance;
      const unclampedCropSize = activeResize.startCropSize * distanceRatio;
      const nextCropSize = Math.min(avatarCropSizeBounds.max, Math.max(avatarCropSizeBounds.min, unclampedCropSize));
      setAvatarCropSize(nextCropSize);
      setAvatarCropOffset(previous => resolveClampedAvatarCropOffset(previous, nextCropSize));
    };

    const handlePointerUp = (event: PointerEvent) => {
      const activeResize = avatarCropResizeRef.current;
      if (!activeResize || activeResize.pointerID !== event.pointerId) {
        return;
      }

      avatarCropResizeRef.current = null;
      setIsAvatarCropResizing(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [avatarCropSizeBounds.max, avatarCropSizeBounds.min, isAvatarCropResizing, resolveClampedAvatarCropOffset]);

  const clearSecuritySuccessMessage = React.useCallback(() => {
    if (securitySuccessMessage) {
      setSecuritySuccessMessage('');
    }
  }, [securitySuccessMessage]);

  const handleCurrentPasswordChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value;
      setCurrentPassword(nextValue);
      setSecurityTouchedFields(previous => ({ ...previous, currentPassword: true }));
      if (securityErrorMessage) {
        setSecurityErrorMessage('');
      }
      clearSecuritySuccessMessage();
    },
    [clearSecuritySuccessMessage, securityErrorMessage],
  );

  const handleNewPasswordChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value;
      setNewPassword(nextValue);
      setSecurityTouchedFields(previous => ({ ...previous, newPassword: true }));
      if (securityErrorMessage) {
        setSecurityErrorMessage('');
      }
      clearSecuritySuccessMessage();
    },
    [clearSecuritySuccessMessage, securityErrorMessage],
  );

  const handleConfirmPasswordChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.currentTarget.value;
      setConfirmPassword(nextValue);
      setSecurityTouchedFields(previous => ({ ...previous, confirmPassword: true }));
      if (securityErrorMessage) {
        setSecurityErrorMessage('');
      }
      clearSecuritySuccessMessage();
    },
    [clearSecuritySuccessMessage, securityErrorMessage],
  );

  const formatSessionDate = React.useCallback(
    (value: string) => {
      const parsed = parseDateValue(value);
      if (!parsed) {
        return value;
      }

      return sessionDateFormatter.format(parsed);
    },
    [sessionDateFormatter],
  );

  const loadAdminNewsletterSubscribers = React.useCallback(
    async (options?: { page?: number }): Promise<AdminNewsletterSubscriberItem[]> => {
      if (!isNewsletterSection || !adminUser) {
        return [];
      }

      const requestedPage = options?.page && options.page > 0 ? options.page : newsletterPage;
      const requestID = newsletterRequestIDRef.current + 1;
      newsletterRequestIDRef.current = requestID;
      setIsNewsletterLoading(true);
      setNewsletterErrorMessage('');

      try {
        const payload = await fetchAdminNewsletterSubscribers({
          locale: newsletterFilterLocale === 'all' ? undefined : newsletterFilterLocale,
          status: newsletterFilterStatus === 'all' ? undefined : newsletterFilterStatus,
          query: newsletterFilterQueryDebounced,
          page: requestedPage,
          size: newsletterPageSize,
        });

        if (requestID !== newsletterRequestIDRef.current) {
          return [];
        }

        const items = payload.items ?? [];
        setNewsletterSubscribers(items);
        setTotalNewsletterSubscribers(payload.total ?? 0);

        const resolvedPage = payload.page > 0 ? payload.page : requestedPage;
        if (resolvedPage !== newsletterPage) {
          setNewsletterPage(resolvedPage);
        }
        if (payload.size > 0 && payload.size !== newsletterPageSize) {
          setNewsletterPageSize(payload.size);
        }

        return items;
      } catch (error) {
        if (requestID !== newsletterRequestIDRef.current) {
          return [];
        }
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return [];
        }
        const resolvedError = resolveAdminError(error);
        setNewsletterErrorMessage(
          resolvedError.kind === 'network'
            ? t('adminCommon.errors.network', { ns: 'admin-common' })
            : resolvedError.message || t('adminAccount.newsletter.errors.load', { ns: 'admin-account' }),
        );
        return [];
      } finally {
        if (requestID === newsletterRequestIDRef.current) {
          setIsNewsletterLoading(false);
        }
      }
    },
    [
      adminUser,
      isNewsletterSection,
      locale,
      newsletterFilterLocale,
      newsletterFilterQueryDebounced,
      newsletterFilterStatus,
      newsletterPage,
      newsletterPageSize,
      router,
      t,
    ],
  );

  React.useEffect(() => {
    if (!isNewsletterSection || !adminUser) {
      return;
    }

    void loadAdminNewsletterSubscribers();
  }, [adminUser, isNewsletterSection, loadAdminNewsletterSubscribers, newsletterPage, newsletterPageSize]);

  const scrollToNewsletterListStart = React.useCallback(() => {
    const target = newsletterListTopRef.current;
    if (!target) {
      return;
    }

    const currentWindow = globalThis.window;
    const prefersReducedMotion = currentWindow?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const handleNewsletterStatusUpdate = React.useCallback(
    async (item: AdminNewsletterSubscriberItem, status: 'active' | 'unsubscribed') => {
      if (updatingNewsletterEmail || deletingNewsletterEmail) {
        return;
      }

      setUpdatingNewsletterEmail(item.email);
      setNewsletterErrorMessage('');
      setNewsletterSuccessMessage('');

      try {
        const updated = await updateAdminNewsletterSubscriberStatus({
          email: item.email,
          status,
        });

        setNewsletterSubscribers(previous =>
          previous.map(current => (current.email === updated.email ? updated : current)),
        );
        setNewsletterSuccessMessage(
          t('adminAccount.newsletter.success.statusUpdated', {
            ns: 'admin-account',
            email: updated.email,
          }),
        );
      } catch (error) {
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return;
        }
        const resolvedError = resolveAdminError(error);
        setNewsletterErrorMessage(
          resolvedError.kind === 'network'
            ? t('adminCommon.errors.network', { ns: 'admin-common' })
            : resolvedError.message || t('adminAccount.newsletter.errors.statusUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setUpdatingNewsletterEmail('');
      }
    },
    [deletingNewsletterEmail, locale, router, t, updatingNewsletterEmail],
  );

  const handleDeleteNewsletterSubscriber = React.useCallback(async () => {
    const item = pendingNewsletterDelete;
    if (!item || deletingNewsletterEmail || updatingNewsletterEmail) {
      return;
    }

    setDeletingNewsletterEmail(item.email);
    setNewsletterErrorMessage('');
    setNewsletterSuccessMessage('');

    try {
      const deleted = await deleteAdminNewsletterSubscriber({ email: item.email });
      if (!deleted) {
        throw new Error(t('adminAccount.newsletter.errors.delete', { ns: 'admin-account' }));
      }

      const nextTotal = Math.max(0, totalNewsletterSubscribers - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / newsletterPageSize));
      const nextPage = Math.min(newsletterPage, nextTotalPages);

      if (nextPage !== newsletterPage) {
        setNewsletterPage(nextPage);
      } else {
        setNewsletterSubscribers(previous => previous.filter(current => current.email !== item.email));
      }

      setTotalNewsletterSubscribers(nextTotal);
      setPendingNewsletterDelete(null);
      setNewsletterSuccessMessage(
        t('adminAccount.newsletter.success.deleted', {
          ns: 'admin-account',
          email: item.email,
        }),
      );

      if (nextTotal > 0) {
        await loadAdminNewsletterSubscribers({ page: nextPage });
      }
    } catch (error) {
      if (isAdminSessionError(error)) {
        router.replace(`/${locale}/admin/login`);
        return;
      }
      const resolvedError = resolveAdminError(error);
      setNewsletterErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.newsletter.errors.delete', { ns: 'admin-account' }),
      );
    } finally {
      setDeletingNewsletterEmail('');
    }
  }, [
    deletingNewsletterEmail,
    loadAdminNewsletterSubscribers,
    locale,
    newsletterPage,
    newsletterPageSize,
    pendingNewsletterDelete,
    router,
    t,
    totalNewsletterSubscribers,
    updatingNewsletterEmail,
  ]);

  const loadAdminErrorMessages = React.useCallback(
    async (options?: { page?: number; preferredSelectedKey?: string }): Promise<AdminErrorMessageItem[]> => {
      if (!isErrorsSection || !adminUser) {
        return [];
      }

      const requestedPage = options?.page && options.page > 0 ? options.page : errorMessagesPage;
      const requestID = errorMessagesRequestIDRef.current + 1;
      errorMessagesRequestIDRef.current = requestID;
      setIsErrorMessagesLoading(true);
      setErrorMessagesErrorMessage('');

      try {
        const payload = await fetchAdminErrorMessages({
          locale: errorFilterLocale === 'all' ? undefined : errorFilterLocale,
          query: errorFilterQueryDebounced,
          page: requestedPage,
          size: errorMessagesPageSize,
        });

        if (requestID !== errorMessagesRequestIDRef.current) {
          return [];
        }

        const items = payload.items ?? [];
        setErrorMessages(items);
        setTotalErrorMessages(payload.total ?? 0);

        const resolvedPage = payload.page > 0 ? payload.page : requestedPage;
        if (resolvedPage !== errorMessagesPage) {
          setErrorMessagesPage(resolvedPage);
        }

        if (payload.size > 0 && payload.size !== errorMessagesPageSize) {
          setErrorMessagesPageSize(payload.size);
        }

        const preferredSelectedKey = options?.preferredSelectedKey?.trim() ?? '';
        const currentSelectedKey = preferredSelectedKey || selectedErrorMessageKeyRef.current;
        const hasCurrentSelection = items.some(item => toAdminErrorMessageKey(item) === currentSelectedKey);
        const nextSelectedKey = hasCurrentSelection
          ? currentSelectedKey
          : items[0]
            ? toAdminErrorMessageKey(items[0])
            : '';
        setSelectedErrorMessageKey(nextSelectedKey);
        selectedErrorMessageKeyRef.current = nextSelectedKey;

        const nextSelectedItem = items.find(item => toAdminErrorMessageKey(item) === nextSelectedKey) ?? null;
        setErrorUpdateMessage((nextSelectedItem?.message ?? '').trim());
        setErrorMessagesErrorMessage('');
        return items;
      } catch (error) {
        if (requestID !== errorMessagesRequestIDRef.current) {
          return [];
        }
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return [];
        }
        const resolvedError = resolveAdminError(error);
        setErrorMessagesErrorMessage(
          resolvedError.kind === 'network'
            ? t('adminCommon.errors.network', { ns: 'admin-common' })
            : resolvedError.message || t('adminAccount.errorsCatalog.errors.load', { ns: 'admin-account' }),
        );
        return [];
      } finally {
        if (requestID === errorMessagesRequestIDRef.current) {
          setIsErrorMessagesLoading(false);
        }
      }
    },
    [
      adminUser,
      errorFilterLocale,
      errorFilterQueryDebounced,
      errorMessagesPage,
      errorMessagesPageSize,
      isErrorsSection,
      locale,
      router,
      t,
    ],
  );

  React.useEffect(() => {
    if (!isErrorsSection || !adminUser) {
      return;
    }

    void loadAdminErrorMessages();
  }, [adminUser, errorMessagesPage, errorMessagesPageSize, isErrorsSection, loadAdminErrorMessages]);

  const handleSelectErrorMessage = React.useCallback((item: AdminErrorMessageItem) => {
    const key = toAdminErrorMessageKey(item);
    setSelectedErrorMessageKey(key);
    setErrorCrudTab('update');
    setErrorUpdateMessage(item.message.trim());
    setErrorMessagesSuccessMessage('');
    setErrorMessagesErrorMessage('');
  }, []);

  const scrollToErrorMessagesListStart = React.useCallback(() => {
    const target = errorMessagesListTopRef.current;
    if (!target) {
      return;
    }

    const currentWindow = globalThis.window;
    const prefersReducedMotion = currentWindow?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    target.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  }, []);

  const handleCreateErrorMessageSubmit = React.useCallback(async () => {
    if (!canCreateErrorMessage) {
      return;
    }

    setIsErrorCreateSubmitting(true);
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');

    try {
      const created = await createAdminErrorMessage({
        key: {
          scope: 'admin_graphql',
          locale: errorCreateLocale,
          code: normalizedErrorCreateCode,
        },
        message: normalizedErrorCreateMessage,
      });

      const createdKey = toAdminErrorMessageKey(created);
      setErrorCrudTab('update');
      setErrorCreateCode('');
      setErrorCreateMessage('');
      setErrorMessagesSuccessMessage(t('adminAccount.errorsCatalog.success.created', { ns: 'admin-account' }));
      setIsErrorEditorModalOpen(false);

      if (doesErrorMessageMatchFilters(created)) {
        setSelectedErrorMessageKey(createdKey);
        selectedErrorMessageKeyRef.current = createdKey;
        setTotalErrorMessages(previous => previous + 1);
        await loadAdminErrorMessages({
          page: errorMessagesPage,
          preferredSelectedKey: createdKey,
        });
      }
    } catch (error) {
      if (isAdminSessionError(error)) {
        router.replace(`/${locale}/admin/login`);
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessagesErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.errorsCatalog.errors.create', { ns: 'admin-account' }),
      );
    } finally {
      setIsErrorCreateSubmitting(false);
    }
  }, [
    canCreateErrorMessage,
    doesErrorMessageMatchFilters,
    errorCreateLocale,
    errorMessagesPage,
    loadAdminErrorMessages,
    locale,
    normalizedErrorCreateCode,
    normalizedErrorCreateMessage,
    router,
    t,
  ]);

  const handleUpdateErrorMessageSubmit = React.useCallback(async () => {
    if (!selectedErrorMessage || !canUpdateErrorMessage) {
      return;
    }

    setIsErrorUpdateSubmitting(true);
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');

    try {
      const updated = await updateAdminErrorMessage({
        key: {
          scope: selectedErrorMessage.scope,
          locale: selectedErrorMessage.locale,
          code: selectedErrorMessage.code,
        },
        message: normalizedErrorUpdateMessage,
      });

      if (doesErrorMessageMatchFilters(updated)) {
        const updatedKey = toAdminErrorMessageKey(updated);
        setErrorMessages(previous =>
          previous.map(item => (toAdminErrorMessageKey(item) === updatedKey ? updated : item)),
        );
        if (selectedErrorMessageKeyRef.current === updatedKey) {
          setErrorUpdateMessage(updated.message.trim());
        }
      } else {
        const updatedKey = toAdminErrorMessageKey(updated);
        setErrorMessages(previous => previous.filter(item => toAdminErrorMessageKey(item) !== updatedKey));
        setTotalErrorMessages(previous => Math.max(0, previous - 1));
        await loadAdminErrorMessages({
          page: errorMessagesPage,
          preferredSelectedKey: selectedErrorMessageKeyRef.current,
        });
      }

      setErrorMessagesSuccessMessage(t('adminAccount.errorsCatalog.success.updated', { ns: 'admin-account' }));
      setIsErrorEditorModalOpen(false);
    } catch (error) {
      if (isAdminSessionError(error)) {
        router.replace(`/${locale}/admin/login`);
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessagesErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.errorsCatalog.errors.update', { ns: 'admin-account' }),
      );
    } finally {
      setIsErrorUpdateSubmitting(false);
    }
  }, [
    canUpdateErrorMessage,
    doesErrorMessageMatchFilters,
    errorMessagesPage,
    loadAdminErrorMessages,
    locale,
    normalizedErrorUpdateMessage,
    router,
    selectedErrorMessage,
    t,
  ]);

  const openDeleteErrorMessageConfirm = React.useCallback(
    (targetItem?: AdminErrorMessageItem) => {
      const item = targetItem ?? selectedErrorMessage;
      if (!item || isErrorDeleteSubmitting || isErrorUpdateSubmitting) {
        return;
      }

      setPendingErrorMessageDelete(item);
    },
    [isErrorDeleteSubmitting, isErrorUpdateSubmitting, selectedErrorMessage],
  );

  const handleDeleteErrorMessageSubmit = React.useCallback(async () => {
    const item = pendingErrorMessageDelete;
    if (!item || isErrorDeleteSubmitting || isErrorUpdateSubmitting) {
      return;
    }

    setIsErrorDeleteSubmitting(true);
    setDeletingErrorMessageKey(toAdminErrorMessageKey(item));
    setErrorMessagesErrorMessage('');
    setErrorMessagesSuccessMessage('');

    try {
      const selectedKey = toAdminErrorMessageKey(item);
      const deleted = await deleteAdminErrorMessage({
        scope: item.scope,
        locale: item.locale,
        code: item.code,
      });
      if (!deleted) {
        throw new Error(t('adminAccount.errorsCatalog.errors.delete', { ns: 'admin-account' }));
      }

      const remainingItems = errorMessages.filter(candidate => toAdminErrorMessageKey(candidate) !== selectedKey);
      const nextTotal = Math.max(0, totalErrorMessages - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / errorMessagesPageSize));
      const nextPage = Math.min(errorMessagesPage, nextTotalPages);
      const fallbackSelectionKey = remainingItems[0] ? toAdminErrorMessageKey(remainingItems[0]) : '';
      const preferredSelectedKey =
        selectedErrorMessageKeyRef.current === selectedKey ? fallbackSelectionKey : selectedErrorMessageKeyRef.current;

      setErrorMessages(remainingItems);
      setTotalErrorMessages(nextTotal);
      setSelectedErrorMessageKey(preferredSelectedKey);
      selectedErrorMessageKeyRef.current = preferredSelectedKey;
      setErrorUpdateMessage(
        (
          remainingItems.find(candidate => toAdminErrorMessageKey(candidate) === preferredSelectedKey)?.message ?? ''
        ).trim(),
      );
      if (nextPage !== errorMessagesPage) {
        setErrorMessagesPage(nextPage);
      }

      if (nextTotal > 0) {
        await loadAdminErrorMessages({
          page: nextPage,
          preferredSelectedKey,
        });
      }

      setErrorMessagesSuccessMessage(t('adminAccount.errorsCatalog.success.deleted', { ns: 'admin-account' }));
      setIsErrorEditorModalOpen(false);
      setPendingErrorMessageDelete(null);
    } catch (error) {
      if (isAdminSessionError(error)) {
        router.replace(`/${locale}/admin/login`);
        return;
      }
      const resolvedError = resolveAdminError(error);
      setErrorMessagesErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.errorsCatalog.errors.delete', { ns: 'admin-account' }),
      );
    } finally {
      setIsErrorDeleteSubmitting(false);
      setDeletingErrorMessageKey('');
    }
  }, [
    errorMessages,
    errorMessagesPage,
    errorMessagesPageSize,
    isErrorDeleteSubmitting,
    isErrorUpdateSubmitting,
    loadAdminErrorMessages,
    locale,
    pendingErrorMessageDelete,
    router,
    totalErrorMessages,
    t,
  ]);

  const handleRevokeSession = React.useCallback(
    async (sessionItem: AdminSession) => {
      if (revokingSessionID || isRevokingAllSessions) {
        return;
      }

      setSessionErrorMessage('');
      setSessionSuccessMessage('');
      setRevokingSessionID(sessionItem.id);

      try {
        const success = await revokeAdminSession(sessionItem.id);
        if (!success) {
          throw new Error(t('adminAccount.sessions.errors.revokeSingle', { ns: 'admin-account' }));
        }

        if (sessionItem.current) {
          router.replace(`/${locale}/admin/login`);
          return;
        }

        setActiveSessions(previous => previous.filter(candidate => candidate.id !== sessionItem.id));
        setSessionSuccessMessage(t('adminAccount.sessions.success.revokeSingle', { ns: 'admin-account' }));
      } catch (error) {
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return;
        }
        const resolvedError = resolveAdminError(error);
        setSessionErrorMessage(
          resolvedError.message || t('adminAccount.sessions.errors.revokeSingle', { ns: 'admin-account' }),
        );
      } finally {
        setRevokingSessionID('');
      }
    },
    [isRevokingAllSessions, locale, revokingSessionID, router, t],
  );

  const handleRevokeAllSessions = React.useCallback(async () => {
    if (isRevokingAllSessions || revokingSessionID) {
      return;
    }

    setSessionErrorMessage('');
    setSessionSuccessMessage('');
    setIsRevokingAllSessions(true);

    try {
      const success = await revokeAllAdminSessions();
      if (!success) {
        throw new Error(t('adminAccount.sessions.errors.revokeAll', { ns: 'admin-account' }));
      }

      router.replace(`/${locale}/admin/login`);
    } catch (error) {
      if (isAdminSessionError(error)) {
        router.replace(`/${locale}/admin/login`);
        return;
      }
      const resolvedError = resolveAdminError(error);
      setSessionErrorMessage(
        resolvedError.message || t('adminAccount.sessions.errors.revokeAll', { ns: 'admin-account' }),
      );
    } finally {
      setIsRevokingAllSessions(false);
    }
  }, [isRevokingAllSessions, locale, revokingSessionID, router, t]);

  const handleSecuritySubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isSecuritySubmitting) {
        return;
      }

      setHasSecuritySubmitted(true);
      setSecurityErrorMessage('');
      setSecuritySuccessMessage('');

      if (securityCurrentPasswordError || securityNewPasswordError || securityConfirmPasswordError) {
        return;
      }

      setIsSecuritySubmitting(true);
      try {
        const payload = await changeAdminPassword({
          currentPassword,
          newPassword,
          confirmPassword,
        });

        if (!payload.success) {
          throw new Error(t('adminAccount.errorFallback', { ns: 'admin-account' }));
        }

        setSecuritySuccessMessage(t('adminAccount.success', { ns: 'admin-account' }));
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setHasSecuritySubmitted(false);
        setSecurityTouchedFields({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false,
        });
        globalThis.setTimeout(() => {
          router.replace(`/${locale}/admin/login`);
        }, 900);
      } catch (error) {
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return;
        }
        const resolvedError = resolveAdminError(error);
        setSecurityErrorMessage(resolvedError.message || t('adminAccount.errorFallback', { ns: 'admin-account' }));
      } finally {
        setIsSecuritySubmitting(false);
      }
    },
    [
      confirmPassword,
      currentPassword,
      isSecuritySubmitting,
      locale,
      newPassword,
      router,
      securityConfirmPasswordError,
      securityCurrentPasswordError,
      securityNewPasswordError,
      t,
    ],
  );

  const handleUsernameSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isUsernameSubmitting) {
        return;
      }

      setUsernameSubmitted(true);
      setUsernameErrorMessage('');
      setUsernameSuccessMessage('');
      if (usernameValidationError) {
        return;
      }

      setIsUsernameSubmitting(true);
      try {
        const payload = await changeAdminUsername({ newUsername: resolvedUsernameInput });
        if (!payload.success) {
          throw new Error(t('adminAccount.account.errors.usernameUpdate', { ns: 'admin-account' }));
        }

        const nextUsername = payload.user?.username ?? resolvedUsernameInput;
        const updatedUser: AdminIdentity =
          payload.user ??
          (adminUser
            ? {
                ...adminUser,
                username: nextUsername,
              }
            : null);

        setAdminUser(updatedUser);
        setUsernameInput(nextUsername);
        setUsernameSubmitted(false);
        setUsernameSuccessMessage(t('adminAccount.account.success.usernameUpdated', { ns: 'admin-account' }));
        globalThis.dispatchEvent(new CustomEvent('admin:user-updated', { detail: { user: updatedUser } }));
      } catch (error) {
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return;
        }
        const resolvedError = resolveAdminError(error);
        setUsernameErrorMessage(
          resolvedError.message || t('adminAccount.account.errors.usernameUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setIsUsernameSubmitting(false);
      }
    },
    [adminUser, isUsernameSubmitting, locale, resolvedUsernameInput, router, t, usernameValidationError],
  );

  const handleNameSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isNameSubmitting) {
        return;
      }

      setNameSubmitted(true);
      setNameErrorMessage('');
      setNameSuccessMessage('');
      if (nameValidationError) {
        return;
      }

      setIsNameSubmitting(true);
      try {
        const payload = await changeAdminName({ name: resolvedNameInput });
        if (!payload.success) {
          throw new Error(t('adminAccount.profile.errors.nameUpdate', { ns: 'admin-account' }));
        }

        const nextName = payload.user?.name ?? resolvedNameInput;
        setAdminUser(previous =>
          previous
            ? {
                ...previous,
                name: nextName,
              }
            : previous,
        );
        setNameInput(nextName);
        setNameSubmitted(false);
        setNameSuccessMessage(t('adminAccount.profile.success.nameUpdated', { ns: 'admin-account' }));
      } catch (error) {
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return;
        }
        const resolvedError = resolveAdminError(error);
        setNameErrorMessage(
          resolvedError.message || t('adminAccount.profile.errors.nameUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setIsNameSubmitting(false);
      }
    },
    [isNameSubmitting, locale, nameValidationError, resolvedNameInput, router, t],
  );

  const handleAvatarUpdate = React.useCallback(
    async (avatarUrl: string | null, action: 'upload' | 'remove') => {
      if (isAvatarSubmitting) {
        return false;
      }

      setAvatarErrorMessage('');
      setAvatarSuccessMessage('');
      setAvatarPendingAction(action);
      setIsAvatarSubmitting(true);

      try {
        const payload = await changeAdminAvatar({ avatarUrl });
        if (!payload.success) {
          throw new Error(t('adminAccount.profile.avatar.errors.update', { ns: 'admin-account' }));
        }

        const nextUser: AdminIdentity =
          payload.user ??
          (adminUser
            ? {
                ...adminUser,
                avatarUrl: avatarUrl ?? null,
              }
            : null);

        setAdminUser(nextUser);
        setAvatarSuccessMessage(t('adminAccount.profile.avatar.success.updated', { ns: 'admin-account' }));
        globalThis.dispatchEvent(new CustomEvent('admin:user-updated', { detail: { user: nextUser } }));
        return true;
      } catch (error) {
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return false;
        }
        const resolvedError = resolveAdminError(error);
        setAvatarErrorMessage(
          resolvedError.message || t('adminAccount.profile.avatar.errors.update', { ns: 'admin-account' }),
        );
        return false;
      } finally {
        setIsAvatarSubmitting(false);
        setAvatarPendingAction(null);
      }
    },
    [adminUser, isAvatarSubmitting, locale, router, t],
  );

  const handleAvatarFileChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const input = event.currentTarget;
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      if (!ALLOWED_AVATAR_MIME_TYPES.has(file.type)) {
        setAvatarErrorMessage(t('adminAccount.profile.avatar.errors.invalidFormat', { ns: 'admin-account' }));
        setAvatarSuccessMessage('');
        input.value = '';
        return;
      }

      const objectURL = URL.createObjectURL(file);
      try {
        const image = await loadImageFromSource(objectURL);
        const imageWidth = image.naturalWidth || image.width;
        const imageHeight = image.naturalHeight || image.height;

        if (imageWidth <= 0 || imageHeight <= 0) {
          throw new Error('invalid image file');
        }

        const minZoom = Math.max(AVATAR_CROP_VIEWPORT_SIZE / imageWidth, AVATAR_CROP_VIEWPORT_SIZE / imageHeight);
        const maxCropSize = Math.min(AVATAR_CROP_VIEWPORT_SIZE, imageWidth * minZoom, imageHeight * minZoom);
        const minCropSize = Math.min(maxCropSize, Math.max(AVATAR_CROP_MIN_SIZE, maxCropSize * 0.45));

        setAvatarCropSource(previous => {
          if (previous) {
            URL.revokeObjectURL(previous);
          }
          return objectURL;
        });
        setAvatarCropImageSize({ width: imageWidth, height: imageHeight });
        setAvatarCropZoom(minZoom);
        setAvatarCropSizeBounds({ min: minCropSize, max: maxCropSize });
        setAvatarCropSize(maxCropSize);
        setAvatarCropOffset({ x: 0, y: 0 });
        setIsAvatarCropModalOpen(true);
        setAvatarErrorMessage('');
        setAvatarSuccessMessage('');
      } catch (error) {
        URL.revokeObjectURL(objectURL);
        const message = error instanceof Error ? error.message.trim().toLowerCase() : '';
        setAvatarErrorMessage(
          message === 'avatar image too large'
            ? t('adminAccount.profile.avatar.errors.invalidSize', {
                ns: 'admin-account',
                sizeMB: MAX_AVATAR_FILE_SIZE_MB,
              })
            : t('adminAccount.profile.avatar.errors.invalidImage', { ns: 'admin-account' }),
        );
        setAvatarSuccessMessage('');
      } finally {
        input.value = '';
      }
    },
    [t],
  );

  const handleAvatarCropSave = React.useCallback(async () => {
    if (!avatarCropSource || isAvatarSubmitting || isAvatarCropSaving) {
      return;
    }

    setAvatarErrorMessage('');
    setIsAvatarCropSaving(true);

    try {
      const avatarDataURL = await toCroppedAvatarDataURL({
        source: avatarCropSource,
        imageWidth: avatarCropImageSize.width,
        imageHeight: avatarCropImageSize.height,
        zoom: avatarCropZoom,
        offset: avatarCropOffset,
        cropSize: avatarCropSize,
      });

      const success = await handleAvatarUpdate(avatarDataURL, 'upload');
      if (success) {
        closeAvatarCropModal();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message.trim().toLowerCase() : '';
      setAvatarErrorMessage(
        message === 'avatar image too large'
          ? t('adminAccount.profile.avatar.errors.invalidSize', {
              ns: 'admin-account',
              sizeMB: MAX_AVATAR_FILE_SIZE_MB,
            })
          : t('adminAccount.profile.avatar.errors.invalidImage', { ns: 'admin-account' }),
      );
      setAvatarSuccessMessage('');
    } finally {
      setIsAvatarCropSaving(false);
    }
  }, [
    avatarCropImageSize.height,
    avatarCropImageSize.width,
    avatarCropOffset,
    avatarCropSource,
    avatarCropSize,
    avatarCropZoom,
    closeAvatarCropModal,
    handleAvatarUpdate,
    isAvatarCropSaving,
    isAvatarSubmitting,
    t,
  ]);

  const handleDeleteSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isDeleteSubmitting) {
        return;
      }

      setDeleteSubmitted(true);
      setDeleteErrorMessage('');
      setDeleteSuccessMessage('');
      if (deletePasswordError || deleteConfirmError) {
        return;
      }

      setIsDeleteSubmitting(true);
      try {
        const payload = await deleteAdminAccount({ currentPassword: deleteCurrentPassword });
        if (!payload.success) {
          throw new Error(t('adminAccount.account.errors.deleteAccount', { ns: 'admin-account' }));
        }

        setDeleteSuccessMessage(t('adminAccount.account.success.deleted', { ns: 'admin-account' }));
        globalThis.setTimeout(() => {
          router.replace(`/${locale}/admin/login`);
        }, 900);
      } catch (error) {
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return;
        }
        const resolvedError = resolveAdminError(error);
        setDeleteErrorMessage(
          resolvedError.message || t('adminAccount.account.errors.deleteAccount', { ns: 'admin-account' }),
        );
      } finally {
        setIsDeleteSubmitting(false);
      }
    },
    [deleteConfirmError, deleteCurrentPassword, deletePasswordError, isDeleteSubmitting, locale, router, t],
  );

  const handleAppearanceChange = React.useCallback(
    (value: Theme | 'system') => {
      if (value === 'system') {
        dispatch(resetToSystemTheme());
        return;
      }

      dispatch(setTheme(value));
    },
    [dispatch],
  );

  const settingsSidebar = (
    <aside className="post-card admin-account-card admin-settings-sidebar">
      <div className="post-card-content">
        {adminUser ? (
          <div className="admin-settings-profile-summary">
            <div className="admin-settings-profile-avatar rounded-circle overflow-hidden d-flex align-items-center justify-content-center">
              {settingsSidebarAvatarURL ? (
                <Image
                  src={settingsSidebarAvatarURL}
                  alt={profileName || profileUsername || adminUser.email}
                  width={48}
                  height={48}
                  sizes="48px"
                  unoptimized
                  className="w-100 h-100 object-fit-cover"
                />
              ) : (
                <FontAwesomeIcon icon="user" />
              )}
            </div>
            <div className="admin-settings-profile-meta">
              <div className="admin-settings-profile-title">
                <span>{profileName || profileUsername || adminUser.email}</span>
                {profileUsername ? <span className="admin-settings-profile-username">({profileUsername})</span> : null}
              </div>
            </div>
          </div>
        ) : null}
        <h2 className="admin-dashboard-panel-title mb-2">
          {t('adminAccount.settings.title', { ns: 'admin-account' })}
        </h2>
        <p className="admin-dashboard-panel-copy mb-3">{t('adminAccount.settings.copy', { ns: 'admin-account' })}</p>
        <nav className="admin-settings-nav" aria-label={t('adminAccount.settings.navLabel', { ns: 'admin-account' })}>
          <Link
            href={ADMIN_ROUTES.settings.profile}
            className={`admin-settings-nav-link${isProfileSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="user" fixedWidth />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.profile', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.account}
            className={`admin-settings-nav-link${isAccountSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="gear" fixedWidth />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.account', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.appearance}
            className={`admin-settings-nav-link${isAppearanceSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="palette" fixedWidth />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.appearance', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.sessions}
            className={`admin-settings-nav-link${isSessionsSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="desktop" fixedWidth />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.sessions', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.newsletter}
            className={`admin-settings-nav-link${isNewsletterSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="envelope" fixedWidth />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.newsletter', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.errors}
            className={`admin-settings-nav-link${isErrorsSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="exclamation-triangle" fixedWidth />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.errors', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.security}
            className={`admin-settings-nav-link${isSecuritySection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="lock" fixedWidth />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.security', { ns: 'admin-account' })}
            </span>
          </Link>
        </nav>
      </div>
    </aside>
  );

  if (isLoading) {
    return (
      <section className="admin-account-shell">
        <div className="admin-settings-layout">
          {settingsSidebar}
          <div className="post-card admin-account-card admin-account-loading-card">
            <div className="post-card-content admin-account-loading-panel">
              <AdminLoadingState
                className="admin-loading-stack"
                ariaLabel={t('adminCommon.status.loading', { ns: 'admin-common' })}
              />
              <div className="admin-loading-line admin-loading-line-lg" />
              <div className="admin-loading-line admin-loading-line-md" />
              <div className="admin-account-loading-fields">
                <div className="admin-account-loading-field" />
                <div className="admin-account-loading-field" />
                <div className="admin-account-loading-field" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!adminUser) {
    return null;
  }

  return (
    <section className="admin-account-shell">
      <div className="admin-settings-layout">
        {settingsSidebar}

        <div className="admin-settings-content">
          <div className="post-card admin-account-card admin-account-form-card">
            <div className="post-card-content">
              {isProfileSection ? (
                <>
                  <h3 className="admin-dashboard-panel-title mb-3">
                    {t('adminAccount.profile.title', { ns: 'admin-account' })}
                  </h3>
                  <hr className="admin-section-divider mb-3" />
                  <p className="admin-dashboard-panel-copy mb-3">
                    {t('adminAccount.profile.copy', { ns: 'admin-account' })}
                  </p>
                  {nameErrorMessage ? (
                    <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
                      {nameErrorMessage}
                    </Alert>
                  ) : null}
                  {avatarErrorMessage ? (
                    <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
                      {avatarErrorMessage}
                    </Alert>
                  ) : null}
                  {nameSuccessMessage ? (
                    <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
                      {nameSuccessMessage}
                    </Alert>
                  ) : null}
                  {avatarSuccessMessage ? (
                    <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
                      {avatarSuccessMessage}
                    </Alert>
                  ) : null}

                  <div className="row g-3 align-items-start mb-4">
                    <aside className="col-12 col-lg-4 col-xl-3 order-1 order-lg-2">
                      <div className="admin-account-avatar-card rounded-4 p-3 h-100">
                        <h4 className="admin-dashboard-panel-title mb-2">
                          {t('adminAccount.profile.avatar.title', { ns: 'admin-account' })}
                        </h4>
                        <p className="admin-dashboard-panel-copy mb-3">
                          {t('adminAccount.profile.avatar.copy', {
                            ns: 'admin-account',
                            sizeMB: MAX_AVATAR_FILE_SIZE_MB,
                          })}
                        </p>
                        <div
                          className="admin-account-avatar-frame position-relative mx-auto rounded-circle overflow-hidden d-flex align-items-center justify-content-center"
                          style={{ width: '200px', height: '200px', maxWidth: '100%' }}
                        >
                          {profileAvatarURL ? (
                            <Image
                              src={profileAvatarURL}
                              alt={profileName || profileUsername || adminUser.email}
                              width={200}
                              height={200}
                              sizes="(max-width: 576px) 160px, 200px"
                              unoptimized
                              className="w-100 h-100 object-fit-cover"
                            />
                          ) : (
                            <span className="admin-account-avatar-placeholder fs-1" aria-hidden="true">
                              <FontAwesomeIcon icon="user" />
                            </span>
                          )}
                        </div>
                        <div className="d-flex flex-wrap gap-2 mt-3 justify-content-center">
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isAvatarSubmitting}
                            onClick={() => avatarFileInputRef.current?.click()}
                          >
                            {isAvatarSubmitting && avatarPendingAction === 'upload' ? (
                              <span className="d-inline-flex align-items-center gap-2">
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  className="me-2 flex-shrink-0 admin-action-spinner"
                                  aria-hidden="true"
                                />
                                <span>{t('adminAccount.profile.avatar.uploading', { ns: 'admin-account' })}</span>
                              </span>
                            ) : (
                              <span className="d-inline-flex align-items-center gap-2">
                                <FontAwesomeIcon icon="camera" />
                                <span>{t('adminAccount.profile.avatar.edit', { ns: 'admin-account' })}</span>
                              </span>
                            )}
                          </Button>
                          {profileAvatarURL ? (
                            <Button
                              variant="danger"
                              size="sm"
                              disabled={isAvatarSubmitting}
                              onClick={() => {
                                void handleAvatarUpdate(null, 'remove');
                              }}
                            >
                              {isAvatarSubmitting && avatarPendingAction === 'remove' ? (
                                <span className="d-inline-flex align-items-center gap-2">
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    className="me-2 flex-shrink-0 admin-action-spinner"
                                    aria-hidden="true"
                                  />
                                  <span>{t('adminAccount.profile.avatar.remove', { ns: 'admin-account' })}</span>
                                </span>
                              ) : (
                                <span className="d-inline-flex align-items-center gap-2">
                                  <FontAwesomeIcon icon="trash" />
                                  <span>{t('adminAccount.profile.avatar.remove', { ns: 'admin-account' })}</span>
                                </span>
                              )}
                            </Button>
                          ) : null}
                        </div>
                        <input
                          ref={avatarFileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={event => {
                            void handleAvatarFileChange(event);
                          }}
                          className="d-none"
                        />
                      </div>
                    </aside>

                    <div className="col-12 col-lg-8 col-xl-9 order-2 order-lg-1">
                      <Form noValidate onSubmit={handleNameSubmit}>
                        <Form.Group className="mb-3" controlId="admin-profile-name">
                          <Form.Label>{t('adminAccount.profile.name.label', { ns: 'admin-account' })}</Form.Label>
                          <Form.Control
                            type="text"
                            value={nameInput}
                            onChange={event => {
                              setNameInput(event.currentTarget.value);
                              if (nameErrorMessage) {
                                setNameErrorMessage('');
                              }
                              if (nameSuccessMessage) {
                                setNameSuccessMessage('');
                              }
                            }}
                            placeholder={t('adminAccount.profile.name.placeholder', { ns: 'admin-account' })}
                            autoComplete="name"
                            isInvalid={showNameValidationError}
                            required
                            minLength={MIN_NAME_LENGTH}
                            maxLength={MAX_NAME_LENGTH}
                          />
                          <Form.Control.Feedback type="invalid" className={showNameValidationError ? 'd-block' : ''}>
                            {nameValidationError}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <div className="post-summary-cta mb-0">
                          <Button type="submit" className="post-summary-read-more" disabled={isNameSubmitting}>
                            {isNameSubmitting ? (
                              <span className="d-inline-flex align-items-center gap-2">
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  className="me-2 flex-shrink-0 admin-action-spinner"
                                  aria-hidden="true"
                                />
                                <span className="read-more-label">
                                  {t('adminAccount.profile.name.submitting', { ns: 'admin-account' })}
                                </span>
                              </span>
                            ) : (
                              <span className="read-more-label">
                                {t('adminAccount.profile.name.submit', { ns: 'admin-account' })}
                              </span>
                            )}
                          </Button>
                        </div>
                      </Form>

                      <dl className="admin-dashboard-meta-list admin-dashboard-meta-list-no-first-divider mb-0 mt-3">
                        <div>
                          <dt>{t('adminAccount.profile.labels.name', { ns: 'admin-account' })}</dt>
                          <dd>{profileName || t('adminAccount.profile.notSet', { ns: 'admin-account' })}</dd>
                        </div>
                        <div>
                          <dt>{t('adminAccount.profile.labels.username', { ns: 'admin-account' })}</dt>
                          <dd>{profileUsername || t('adminAccount.profile.notSet', { ns: 'admin-account' })}</dd>
                        </div>
                        <div>
                          <dt>{t('adminAccount.profile.labels.email', { ns: 'admin-account' })}</dt>
                          <dd>{adminUser.email}</dd>
                        </div>
                        <div>
                          <dt>{t('adminAccount.profile.labels.role', { ns: 'admin-account' })}</dt>
                          <dd>{profileRoles || t('adminAccount.profile.notSet', { ns: 'admin-account' })}</dd>
                        </div>
                        <div>
                          <dt>{t('adminAccount.profile.labels.id', { ns: 'admin-account' })}</dt>
                          <dd>{adminUser.id}</dd>
                        </div>
                        <div>
                          <dt>{t('adminAccount.profile.labels.picture', { ns: 'admin-account' })}</dt>
                          <dd>
                            {profileAvatarURL
                              ? t('adminAccount.profile.avatar.states.custom', { ns: 'admin-account' })
                              : t('adminAccount.profile.avatar.states.default', { ns: 'admin-account' })}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </>
              ) : null}

              {isAccountSection ? (
                <div className="admin-account-section-stack">
                  <section>
                    <h3 className="admin-dashboard-panel-title mb-2">
                      {t('adminAccount.account.username.title', { ns: 'admin-account' })}
                    </h3>
                    <p className="admin-dashboard-panel-copy">
                      {t('adminAccount.account.username.copy', { ns: 'admin-account' })}
                    </p>

                    {usernameErrorMessage ? (
                      <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
                        {usernameErrorMessage}
                      </Alert>
                    ) : null}
                    {usernameSuccessMessage ? (
                      <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
                        {usernameSuccessMessage}
                      </Alert>
                    ) : null}

                    <Form noValidate onSubmit={handleUsernameSubmit}>
                      <Form.Group className="mb-3" controlId="admin-account-username">
                        <Form.Label>{t('adminAccount.account.username.label', { ns: 'admin-account' })}</Form.Label>
                        <Form.Control
                          type="text"
                          value={usernameInput}
                          onChange={event => {
                            setUsernameInput(event.currentTarget.value);
                            if (usernameErrorMessage) {
                              setUsernameErrorMessage('');
                            }
                            if (usernameSuccessMessage) {
                              setUsernameSuccessMessage('');
                            }
                          }}
                          placeholder={t('adminAccount.account.username.placeholder', { ns: 'admin-account' })}
                          autoComplete="username"
                          isInvalid={showUsernameValidationError}
                          required
                          minLength={MIN_USERNAME_LENGTH}
                          maxLength={MAX_USERNAME_LENGTH}
                        />
                        <Form.Control.Feedback type="invalid" className={showUsernameValidationError ? 'd-block' : ''}>
                          {usernameValidationError}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <div className="post-summary-cta mb-0">
                        <Button type="submit" className="post-summary-read-more" disabled={isUsernameSubmitting}>
                          {isUsernameSubmitting ? (
                            <span className="d-inline-flex align-items-center gap-2">
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                className="me-2 flex-shrink-0 admin-action-spinner"
                                aria-hidden="true"
                              />
                              <span className="read-more-label">
                                {t('adminAccount.account.username.submitting', { ns: 'admin-account' })}
                              </span>
                            </span>
                          ) : (
                            <span className="read-more-label">
                              {t('adminAccount.account.username.submit', { ns: 'admin-account' })}
                            </span>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </section>

                  <section className="admin-account-delete-section">
                    <h3 className="admin-dashboard-panel-title mb-2">
                      {t('adminAccount.account.delete.title', { ns: 'admin-account' })}
                    </h3>
                    <hr className="admin-section-divider mb-3" />
                    <p className="admin-dashboard-panel-copy">
                      {t('adminAccount.account.delete.copy', { ns: 'admin-account' })}
                    </p>

                    {deleteErrorMessage ? (
                      <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
                        {deleteErrorMessage}
                      </Alert>
                    ) : null}
                    {deleteSuccessMessage ? (
                      <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
                        {deleteSuccessMessage}
                      </Alert>
                    ) : null}

                    <Form noValidate onSubmit={handleDeleteSubmit}>
                      <Form.Group className="mb-3" controlId="admin-account-delete-password">
                        <Form.Label>
                          {t('adminAccount.account.delete.currentPassword', { ns: 'admin-account' })}
                        </Form.Label>
                        <InputGroup>
                          <Form.Control
                            type={showDeletePassword ? 'text' : 'password'}
                            value={deleteCurrentPassword}
                            onChange={event => {
                              setDeleteCurrentPassword(event.currentTarget.value);
                              if (deleteErrorMessage) {
                                setDeleteErrorMessage('');
                              }
                              if (deleteSuccessMessage) {
                                setDeleteSuccessMessage('');
                              }
                            }}
                            placeholder={t('adminAccount.account.delete.currentPasswordPlaceholder', {
                              ns: 'admin-account',
                            })}
                            autoComplete="current-password"
                            isInvalid={showDeletePasswordError}
                            required
                          />
                          <Button
                            variant="outline-secondary"
                            type="button"
                            onClick={() => setShowDeletePassword(previous => !previous)}
                            aria-label={
                              showDeletePassword
                                ? t('adminAccount.form.hidePassword', { ns: 'admin-account' })
                                : t('adminAccount.form.showPassword', { ns: 'admin-account' })
                            }
                          >
                            <FontAwesomeIcon icon={showDeletePassword ? 'eye-slash' : 'eye'} />
                          </Button>
                        </InputGroup>
                        <Form.Control.Feedback type="invalid" className={showDeletePasswordError ? 'd-block' : ''}>
                          {deletePasswordError}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-4" controlId="admin-account-delete-confirm">
                        <Form.Label>
                          {t('adminAccount.account.delete.confirmLabel', { ns: 'admin-account' })}
                        </Form.Label>
                        <Form.Control
                          type="text"
                          value={deleteConfirmation}
                          onChange={event => {
                            setDeleteConfirmation(event.currentTarget.value);
                            if (deleteErrorMessage) {
                              setDeleteErrorMessage('');
                            }
                            if (deleteSuccessMessage) {
                              setDeleteSuccessMessage('');
                            }
                          }}
                          placeholder={t('adminAccount.account.delete.confirmPlaceholder', {
                            ns: 'admin-account',
                            value: DELETE_CONFIRMATION_VALUE,
                          })}
                          isInvalid={showDeleteConfirmError}
                          required
                        />
                        <Form.Control.Feedback type="invalid" className={showDeleteConfirmError ? 'd-block' : ''}>
                          {deleteConfirmError}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <div className="post-summary-cta mb-0">
                        <Button
                          type="submit"
                          variant="danger"
                          className="post-summary-read-more admin-account-danger-action"
                          disabled={isDeleteSubmitting}
                        >
                          {isDeleteSubmitting ? (
                            <span className="d-inline-flex align-items-center gap-2">
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                className="me-2 flex-shrink-0 admin-action-spinner"
                                aria-hidden="true"
                              />
                              <span className="read-more-label">
                                {t('adminAccount.account.delete.submitting', { ns: 'admin-account' })}
                              </span>
                            </span>
                          ) : (
                            <span className="read-more-label">
                              {t('adminAccount.account.delete.submit', { ns: 'admin-account' })}
                            </span>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </section>
                </div>
              ) : null}

              {isAppearanceSection ? (
                <section className="admin-account-appearance-section is-standalone">
                  <h3 className="admin-dashboard-panel-title mb-2">
                    {t('adminAccount.account.appearance.title', { ns: 'admin-account' })}
                  </h3>
                  <hr className="admin-section-divider mb-3" />
                  <p className="admin-dashboard-panel-copy">
                    {t('adminAccount.account.appearance.copy', { ns: 'admin-account' })}
                  </p>
                  <div
                    className="admin-account-appearance-options"
                    role="radiogroup"
                    aria-label={t('adminAccount.account.appearance.title', { ns: 'admin-account' })}
                  >
                    {(
                      [
                        {
                          key: 'system',
                          label: t('adminAccount.account.appearance.options.system', { ns: 'admin-account' }),
                          value: 'system' as const,
                        },
                        ...THEMES.map(option => ({
                          key: option.key,
                          label: t(`adminAccount.account.appearance.options.${option.key}`, { ns: 'admin-account' }),
                          value: option.key,
                        })),
                      ] as const
                    ).map(option => {
                      const isActive = activeAppearance === option.value;

                      return (
                        <button
                          key={option.key}
                          type="button"
                          className={`admin-account-appearance-option ${resolveAppearanceCardClass(option.value)}${
                            isActive ? ' is-active' : ''
                          }`}
                          onClick={() => handleAppearanceChange(option.value)}
                          role="radio"
                          aria-checked={isActive}
                        >
                          <span className="admin-account-appearance-preview" aria-hidden="true">
                            <span className="admin-account-appearance-preview-header">
                              <span />
                              <span />
                              <span />
                            </span>
                            <span className="admin-account-appearance-preview-body">
                              <span className="admin-account-appearance-preview-title" />
                              <span className="admin-account-appearance-preview-main">
                                <span className="admin-account-appearance-preview-main-accent" />
                              </span>
                              <span className="admin-account-appearance-preview-side" />
                            </span>
                          </span>

                          <span className="admin-account-appearance-option-footer">
                            <FontAwesomeIcon
                              icon={isActive ? 'circle-check' : 'circle'}
                              className="admin-account-appearance-option-radio"
                            />
                            <span className="admin-account-appearance-option-label">{option.label}</span>
                            <FontAwesomeIcon
                              icon={resolveAppearanceMetaIcon(option.value)}
                              className="admin-account-appearance-option-meta"
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {isSessionsSection ? (
                <>
                  <h3 className="admin-dashboard-panel-title mb-3">
                    {t('adminAccount.sessions.title', { ns: 'admin-account' })}
                  </h3>
                  <hr className="admin-section-divider mb-3" />
                  <p className="admin-dashboard-panel-copy mb-3">
                    {t('adminAccount.sessions.copy', { ns: 'admin-account' })}
                  </p>

                  <div className="d-flex justify-content-end mb-3">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        void handleRevokeAllSessions();
                      }}
                      disabled={
                        isSessionsLoading ||
                        activeSessions.length === 0 ||
                        isRevokingAllSessions ||
                        revokingSessionID !== ''
                      }
                    >
                      {isRevokingAllSessions ? (
                        <span className="d-inline-flex align-items-center gap-2">
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            className="me-2 flex-shrink-0 admin-action-spinner"
                            aria-hidden="true"
                          />
                          <span>{t('adminAccount.sessions.actions.revokingAll', { ns: 'admin-account' })}</span>
                        </span>
                      ) : (
                        <>
                          <FontAwesomeIcon icon="right-from-bracket" className="me-2" />
                          {t('adminAccount.sessions.actions.revokeAll', { ns: 'admin-account' })}
                        </>
                      )}
                    </Button>
                  </div>

                  {sessionErrorMessage ? (
                    <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
                      {sessionErrorMessage}
                    </Alert>
                  ) : null}
                  {sessionSuccessMessage ? (
                    <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
                      {sessionSuccessMessage}
                    </Alert>
                  ) : null}

                  {isSessionsLoading ? (
                    <div className="admin-account-sessions-loading">
                      <AdminLoadingState
                        className="admin-loading-stack"
                        ariaLabel={t('adminAccount.sessions.loading', { ns: 'admin-account' })}
                      />
                    </div>
                  ) : activeSessions.length === 0 ? (
                    <p className="small text-muted mb-0">{t('adminAccount.sessions.empty', { ns: 'admin-account' })}</p>
                  ) : (
                    <div className="admin-session-list">
                      {activeSessions.map(sessionItem => (
                        <div key={sessionItem.id} className="admin-session-item">
                          <div className="admin-session-icon" aria-hidden="true">
                            <FontAwesomeIcon icon={resolveSessionDeviceIcon(sessionItem.device)} fixedWidth />
                          </div>
                          <div className="admin-session-main">
                            <div className="admin-session-title-row">
                              <strong>{sessionItem.device}</strong>
                              {sessionItem.current ? (
                                <span className="admin-session-chip admin-session-chip-current">
                                  {t('adminAccount.sessions.labels.current', { ns: 'admin-account' })}
                                </span>
                              ) : null}
                              {sessionItem.persistent ? (
                                <span className="admin-session-chip">
                                  {t('adminAccount.sessions.labels.remembered', { ns: 'admin-account' })}
                                </span>
                              ) : null}
                            </div>
                            <div className="admin-session-meta">
                              <span>
                                {t('adminAccount.sessions.labels.ip', {
                                  ns: 'admin-account',
                                  value: sessionItem.ipAddress,
                                })}
                              </span>
                              <span>
                                {t('adminAccount.sessions.labels.country', {
                                  ns: 'admin-account',
                                  value: sessionItem.countryCode,
                                })}
                              </span>
                              <span>
                                {t('adminAccount.sessions.labels.lastActivity', {
                                  ns: 'admin-account',
                                  value: formatSessionDate(sessionItem.lastActivityAt),
                                })}
                              </span>
                              <span>
                                {t('adminAccount.sessions.labels.expires', {
                                  ns: 'admin-account',
                                  value: formatSessionDate(sessionItem.expiresAt),
                                })}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant={sessionItem.current ? 'danger' : 'secondary'}
                            size="sm"
                            disabled={isRevokingAllSessions || revokingSessionID === sessionItem.id}
                            onClick={() => {
                              void handleRevokeSession(sessionItem);
                            }}
                          >
                            {revokingSessionID === sessionItem.id ? (
                              <span className="d-inline-flex align-items-center gap-2">
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  className="me-2 flex-shrink-0 admin-action-spinner"
                                  aria-hidden="true"
                                />
                                <span>
                                  {t('adminAccount.sessions.actions.revokingSingle', { ns: 'admin-account' })}
                                </span>
                              </span>
                            ) : (
                              <>
                                <FontAwesomeIcon icon="right-from-bracket" className="me-2" />
                                {t('adminAccount.sessions.actions.revokeSingle', {
                                  ns: 'admin-account',
                                  context: sessionItem.current ? 'current' : 'other',
                                })}
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}

              {isNewsletterSection ? (
                <>
                  <h3 className="admin-dashboard-panel-title mb-3">
                    {t('adminAccount.newsletter.title', { ns: 'admin-account' })}
                  </h3>
                  <hr className="admin-section-divider mb-3" />
                  <p className="admin-dashboard-panel-copy mb-3">
                    {t('adminAccount.newsletter.copy', { ns: 'admin-account' })}
                  </p>

                  {newsletterErrorMessage ? (
                    <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
                      {newsletterErrorMessage}
                    </Alert>
                  ) : null}
                  {newsletterSuccessMessage ? (
                    <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
                      {newsletterSuccessMessage}
                    </Alert>
                  ) : null}

                  <div className="d-grid gap-3">
                    <div ref={newsletterListTopRef} />
                    <div className="card d-block">
                      <div className="card-body p-3 w-100">
                        <div className="row g-3">
                          <div className="col-12 col-md-3">
                            <Form.Group controlId="admin-newsletter-filter-locale">
                              <Form.Label className="small fw-semibold mb-1">
                                {t('adminAccount.newsletter.filters.locale', { ns: 'admin-account' })}
                              </Form.Label>
                              <Form.Select
                                value={newsletterFilterLocale}
                                onChange={event => {
                                  setNewsletterFilterLocale(event.currentTarget.value as 'all' | 'en' | 'tr');
                                  setNewsletterErrorMessage('');
                                  setNewsletterSuccessMessage('');
                                }}
                              >
                                <option value="all">
                                  {t('adminAccount.newsletter.filters.locales.all', { ns: 'admin-account' })}
                                </option>
                                <option value="en">
                                  {t('adminAccount.newsletter.filters.locales.en', { ns: 'admin-account' })}
                                </option>
                                <option value="tr">
                                  {t('adminAccount.newsletter.filters.locales.tr', { ns: 'admin-account' })}
                                </option>
                              </Form.Select>
                            </Form.Group>
                          </div>
                          <div className="col-12 col-md-3">
                            <Form.Group controlId="admin-newsletter-filter-status">
                              <Form.Label className="small fw-semibold mb-1">
                                {t('adminAccount.newsletter.filters.status', { ns: 'admin-account' })}
                              </Form.Label>
                              <Form.Select
                                value={newsletterFilterStatus}
                                onChange={event => {
                                  setNewsletterFilterStatus(
                                    event.currentTarget.value as 'all' | 'pending' | 'active' | 'unsubscribed',
                                  );
                                  setNewsletterErrorMessage('');
                                  setNewsletterSuccessMessage('');
                                }}
                              >
                                <option value="all">
                                  {t('adminAccount.newsletter.filters.statuses.all', { ns: 'admin-account' })}
                                </option>
                                <option value="pending">
                                  {t('adminAccount.newsletter.filters.statuses.pending', { ns: 'admin-account' })}
                                </option>
                                <option value="active">
                                  {t('adminAccount.newsletter.filters.statuses.active', { ns: 'admin-account' })}
                                </option>
                                <option value="unsubscribed">
                                  {t('adminAccount.newsletter.filters.statuses.unsubscribed', { ns: 'admin-account' })}
                                </option>
                              </Form.Select>
                            </Form.Group>
                          </div>
                          <div className="col-12 col-md-6">
                            <Form.Group controlId="admin-newsletter-filter-query">
                              <Form.Label className="small fw-semibold mb-1">
                                {t('adminAccount.newsletter.filters.query', { ns: 'admin-account' })}
                              </Form.Label>
                              <div className="search-bar w-100 d-flex align-items-center">
                                <div className="search-icon">
                                  <FontAwesomeIcon icon="search" />
                                </div>
                                <Form.Control
                                  type="text"
                                  className="search-input form-control"
                                  value={newsletterFilterQuery}
                                  onChange={event => {
                                    setNewsletterFilterQuery(event.currentTarget.value);
                                    setNewsletterErrorMessage('');
                                  }}
                                  placeholder={t('adminAccount.newsletter.filters.queryPlaceholder', {
                                    ns: 'admin-account',
                                  })}
                                />
                                {newsletterFilterQuery ? (
                                  <button
                                    type="button"
                                    className="search-clear-btn border-0 bg-transparent"
                                    onClick={() => {
                                      setNewsletterFilterQuery('');
                                      setNewsletterErrorMessage('');
                                    }}
                                    aria-label={t('adminAccount.newsletter.filters.query', { ns: 'admin-account' })}
                                  >
                                    <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                                  </button>
                                ) : null}
                              </div>
                            </Form.Group>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card d-block">
                      <div className="card-body p-3 w-100">
                        {isNewsletterLoading ? (
                          <div className="admin-account-sessions-loading">
                            <AdminLoadingState
                              className="admin-loading-stack"
                              ariaLabel={t('adminAccount.newsletter.loading', { ns: 'admin-account' })}
                            />
                          </div>
                        ) : totalNewsletterSubscribers === 0 ? (
                          <p className="small text-muted mb-0">
                            {t('adminAccount.newsletter.empty', { ns: 'admin-account' })}
                          </p>
                        ) : (
                          <div className="d-grid gap-2">
                            {newsletterSubscribers.map(item => {
                              const isUpdatingCurrentItem = updatingNewsletterEmail === item.email;
                              const isDeletingCurrentItem = deletingNewsletterEmail === item.email;
                              const normalizedStatus = item.status.toLowerCase();
                              const canActivate = normalizedStatus !== 'active';
                              const canUnsubscribe = normalizedStatus !== 'unsubscribed';
                              const localeCode = item.locale.toLowerCase();
                              const localeLabel =
                                localeCode === 'en'
                                  ? LOCALES.en.name
                                  : localeCode === 'tr'
                                    ? LOCALES.tr.name
                                    : item.locale.toUpperCase();

                              return (
                                <div key={item.email} className="border rounded-3 p-3">
                                  <div className="fw-bold fs-5 text-break">{item.email}</div>
                                  <div className="mt-2 d-flex align-items-center flex-wrap gap-2">
                                    <span className="d-inline-flex align-items-center gap-2 text-muted">
                                      {localeCode === 'en' || localeCode === 'tr' ? (
                                        <FlagIcon
                                          className="flex-shrink-0"
                                          code={localeCode}
                                          alt={`${localeLabel} flag`}
                                          width={18}
                                          height={18}
                                        />
                                      ) : (
                                        <FontAwesomeIcon icon="globe" className="text-muted" />
                                      )}
                                      <span>{localeLabel}</span>
                                    </span>
                                    <span className="badge text-bg-secondary">
                                      {t(`adminAccount.newsletter.filters.statuses.${normalizedStatus}`, {
                                        ns: 'admin-account',
                                      })}
                                    </span>
                                  </div>
                                  {item.updatedAt ? (
                                    <div className="small mt-2 text-muted d-flex align-items-center flex-wrap">
                                      <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                                      {t('adminAccount.newsletter.list.updatedAt', {
                                        ns: 'admin-account',
                                        value: formatSessionDate(item.updatedAt),
                                      })}
                                    </div>
                                  ) : null}
                                  <div className="d-flex flex-wrap gap-2 mt-3">
                                    {canActivate ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="success"
                                        disabled={isUpdatingCurrentItem || isDeletingCurrentItem}
                                        onClick={() => {
                                          void handleNewsletterStatusUpdate(item, 'active');
                                        }}
                                      >
                                        {isUpdatingCurrentItem ? (
                                          <span className="d-inline-flex align-items-center gap-2">
                                            <Spinner
                                              as="span"
                                              animation="border"
                                              size="sm"
                                              className="me-2 flex-shrink-0 admin-action-spinner"
                                              aria-hidden="true"
                                            />
                                            <span>
                                              {t('adminAccount.newsletter.actions.updating', { ns: 'admin-account' })}
                                            </span>
                                          </span>
                                        ) : (
                                          <>
                                            <FontAwesomeIcon icon="check" className="me-2" />
                                            {t('adminAccount.newsletter.actions.setActive', { ns: 'admin-account' })}
                                          </>
                                        )}
                                      </Button>
                                    ) : null}

                                    {canUnsubscribe ? (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        disabled={isUpdatingCurrentItem || isDeletingCurrentItem}
                                        onClick={() => {
                                          void handleNewsletterStatusUpdate(item, 'unsubscribed');
                                        }}
                                      >
                                        {isUpdatingCurrentItem ? (
                                          <span className="d-inline-flex align-items-center gap-2">
                                            <Spinner
                                              as="span"
                                              animation="border"
                                              size="sm"
                                              className="me-2 flex-shrink-0 admin-action-spinner"
                                              aria-hidden="true"
                                            />
                                            <span>
                                              {t('adminAccount.newsletter.actions.updating', { ns: 'admin-account' })}
                                            </span>
                                          </span>
                                        ) : (
                                          <>
                                            <FontAwesomeIcon icon="times-circle" className="me-2" />
                                            {t('adminAccount.newsletter.actions.unsubscribe', { ns: 'admin-account' })}
                                          </>
                                        )}
                                      </Button>
                                    ) : null}

                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="danger"
                                      disabled={isUpdatingCurrentItem || isDeletingCurrentItem}
                                      onClick={() => {
                                        setPendingNewsletterDelete(item);
                                      }}
                                    >
                                      {isDeletingCurrentItem ? (
                                        <span className="d-inline-flex align-items-center gap-2">
                                          <Spinner
                                            as="span"
                                            animation="border"
                                            size="sm"
                                            className="me-2 flex-shrink-0 admin-action-spinner"
                                            aria-hidden="true"
                                          />
                                          <span>
                                            {t('adminAccount.newsletter.actions.deleting', { ns: 'admin-account' })}
                                          </span>
                                        </span>
                                      ) : (
                                        <>
                                          <FontAwesomeIcon icon="trash" className="me-2" />
                                          {t('adminAccount.newsletter.actions.delete', { ns: 'admin-account' })}
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {!isNewsletterLoading && totalNewsletterSubscribers > 0 ? (
                        <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
                          <PaginationBar
                            className="border-0 rounded-0 px-2 px-md-3 py-0 bg-transparent shadow-none"
                            currentPage={newsletterPage}
                            totalPages={totalNewsletterPages}
                            totalResults={totalNewsletterSubscribers}
                            size={newsletterPageSize}
                            onPageChange={page => {
                              setNewsletterPage(page);
                              scrollToNewsletterListStart();
                            }}
                            onSizeChange={size => {
                              setNewsletterPageSize(size);
                              setNewsletterPage(1);
                              scrollToNewsletterListStart();
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Modal
                    show={pendingNewsletterDelete !== null}
                    onHide={() => {
                      if (deletingNewsletterEmail) {
                        return;
                      }
                      setPendingNewsletterDelete(null);
                    }}
                    centered
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>
                        {t('adminAccount.newsletter.deleteConfirm.title', { ns: 'admin-account' })}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <p className="small text-muted mb-0">
                        {t('adminAccount.newsletter.deleteConfirm.copy', {
                          ns: 'admin-account',
                          email: pendingNewsletterDelete?.email ?? '',
                        })}
                      </p>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={deletingNewsletterEmail !== ''}
                        onClick={() => {
                          setPendingNewsletterDelete(null);
                        }}
                      >
                        {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={pendingNewsletterDelete === null || deletingNewsletterEmail !== ''}
                        onClick={() => {
                          void handleDeleteNewsletterSubscriber();
                        }}
                      >
                        {deletingNewsletterEmail ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              className="me-2 flex-shrink-0 admin-action-spinner"
                              aria-hidden="true"
                            />
                            <span>{t('adminAccount.newsletter.actions.deleting', { ns: 'admin-account' })}</span>
                          </span>
                        ) : (
                          <>
                            <FontAwesomeIcon icon="trash" className="me-2" />
                            {t('adminAccount.newsletter.actions.delete', { ns: 'admin-account' })}
                          </>
                        )}
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </>
              ) : null}

              {isErrorsSection ? (
                <>
                  <h3 className="admin-dashboard-panel-title mb-3">
                    {t('adminAccount.errorsCatalog.title', { ns: 'admin-account' })}
                  </h3>
                  <hr className="admin-section-divider mb-3" />
                  <p className="admin-dashboard-panel-copy mb-3">
                    {t('adminAccount.errorsCatalog.copy', { ns: 'admin-account' })}
                  </p>

                  <div className="d-flex justify-content-end mb-3">
                    <Button
                      variant="primary"
                      size="sm"
                      className="d-inline-flex align-items-center"
                      disabled={isErrorMessagesLoading || isErrorCreateSubmitting}
                      onClick={() => {
                        setErrorCrudTab('create');
                        setErrorMessagesErrorMessage('');
                        setErrorMessagesSuccessMessage('');
                        setIsErrorEditorModalOpen(true);
                      }}
                    >
                      <FontAwesomeIcon icon="plus" className="me-2" />
                      {t('adminAccount.errorsCatalog.actions.create', { ns: 'admin-account' })}
                    </Button>
                  </div>

                  {errorMessagesErrorMessage ? (
                    <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
                      {errorMessagesErrorMessage}
                    </Alert>
                  ) : null}
                  {errorMessagesSuccessMessage ? (
                    <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
                      {errorMessagesSuccessMessage}
                    </Alert>
                  ) : null}

                  <div className="d-grid gap-3">
                    <div ref={errorMessagesListTopRef} />
                    <div className="card shadow-sm d-block">
                      <div className="card-body p-3 w-100">
                        <div className="row g-3">
                          <div className="col-12 col-md-4">
                            <Form.Group controlId="admin-error-filter-locale">
                              <Form.Label className="small fw-semibold mb-1">
                                {t('adminAccount.errorsCatalog.filters.locale', { ns: 'admin-account' })}
                              </Form.Label>
                              <Form.Select
                                value={errorFilterLocale}
                                onChange={event => {
                                  setErrorFilterLocale(event.currentTarget.value as 'all' | 'en' | 'tr');
                                  setErrorMessagesErrorMessage('');
                                  setErrorMessagesSuccessMessage('');
                                }}
                              >
                                <option value="all">
                                  {t('adminAccount.errorsCatalog.filters.locales.all', { ns: 'admin-account' })}
                                </option>
                                <option value="en">
                                  {t('adminAccount.errorsCatalog.filters.locales.en', { ns: 'admin-account' })}
                                </option>
                                <option value="tr">
                                  {t('adminAccount.errorsCatalog.filters.locales.tr', { ns: 'admin-account' })}
                                </option>
                              </Form.Select>
                            </Form.Group>
                          </div>
                          <div className="col-12 col-md-8">
                            <Form.Group controlId="admin-error-filter-query">
                              <Form.Label className="small fw-semibold mb-1">
                                {t('adminAccount.errorsCatalog.filters.query', { ns: 'admin-account' })}
                              </Form.Label>
                              <div className="search-bar w-100 d-flex align-items-center">
                                <div className="search-icon">
                                  <FontAwesomeIcon icon="search" />
                                </div>
                                <Form.Control
                                  type="text"
                                  className="search-input form-control"
                                  value={errorFilterQuery}
                                  onChange={event => {
                                    setErrorFilterQuery(event.currentTarget.value);
                                    setErrorMessagesErrorMessage('');
                                  }}
                                  placeholder={t('adminAccount.errorsCatalog.filters.queryPlaceholder', {
                                    ns: 'admin-account',
                                  })}
                                />
                                {errorFilterQuery ? (
                                  <button
                                    type="button"
                                    className="search-clear-btn border-0 bg-transparent"
                                    onClick={() => {
                                      setErrorFilterQuery('');
                                      setErrorMessagesErrorMessage('');
                                    }}
                                    aria-label={t('adminAccount.errorsCatalog.filters.query', { ns: 'admin-account' })}
                                  >
                                    <FontAwesomeIcon icon="times-circle" className="clear-icon" />
                                  </button>
                                ) : null}
                              </div>
                            </Form.Group>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card shadow-sm d-block">
                      <div className="card-body p-3 w-100">
                        {isErrorMessagesLoading ? (
                          <div className="admin-account-sessions-loading">
                            <AdminLoadingState
                              className="admin-loading-stack"
                              ariaLabel={t('adminAccount.errorsCatalog.loading', { ns: 'admin-account' })}
                            />
                          </div>
                        ) : totalErrorMessages === 0 ? (
                          <p className="small text-muted mb-0">
                            {t('adminAccount.errorsCatalog.empty', { ns: 'admin-account' })}
                          </p>
                        ) : (
                          <>
                            <div className="d-grid gap-2">
                              {errorMessages.map(item => {
                                const itemKey = toAdminErrorMessageKey(item);
                                const previewMessage = item.message;
                                const isDeletingCurrentItem =
                                  isErrorDeleteSubmitting && deletingErrorMessageKey === itemKey;

                                return (
                                  <div key={itemKey} className="border rounded-3 p-3">
                                    <button
                                      type="button"
                                      className="border-0 bg-transparent p-0 text-start text-reset text-decoration-none w-100"
                                      onClick={() => {
                                        handleSelectErrorMessage(item);
                                      }}
                                    >
                                      <div className="fw-bold fs-5 text-break">{item.code}</div>
                                      <div className="mt-2 d-flex align-items-center flex-wrap gap-2">
                                        <span className="d-inline-flex align-items-center gap-2 text-muted">
                                          {item.locale.toLowerCase() === 'en' || item.locale.toLowerCase() === 'tr' ? (
                                            <FlagIcon
                                              className="flex-shrink-0"
                                              code={item.locale.toLowerCase()}
                                              alt={`${LOCALES[item.locale.toLowerCase() as 'en' | 'tr'].name} flag`}
                                              width={18}
                                              height={18}
                                            />
                                          ) : (
                                            <FontAwesomeIcon icon="globe" className="text-muted" />
                                          )}
                                          <span>
                                            {item.locale.toLowerCase() === 'en'
                                              ? LOCALES.en.name
                                              : item.locale.toLowerCase() === 'tr'
                                                ? LOCALES.tr.name
                                                : item.locale.toUpperCase()}
                                          </span>
                                        </span>
                                      </div>
                                      <div className="small mt-2 text-break text-muted">{previewMessage}</div>
                                      {item.updatedAt ? (
                                        <div className="small mt-2 text-muted d-flex align-items-center flex-wrap">
                                          <FontAwesomeIcon icon="calendar-alt" className="me-2" />
                                          {t('adminAccount.errorsCatalog.list.updatedAt', {
                                            ns: 'admin-account',
                                            value: formatSessionDate(item.updatedAt),
                                          })}
                                        </div>
                                      ) : null}
                                    </button>

                                    <div className="row g-2 mt-3">
                                      <div className="col-12 col-md-auto">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="primary"
                                          className="w-100"
                                          onClick={() => {
                                            handleSelectErrorMessage(item);
                                            setErrorCrudTab('update');
                                            setIsErrorEditorModalOpen(true);
                                          }}
                                        >
                                          <FontAwesomeIcon icon="save" className="me-2" />
                                          {t('adminAccount.errorsCatalog.actions.update', { ns: 'admin-account' })}
                                        </Button>
                                      </div>
                                      <div className="col-12 col-md-auto">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="danger"
                                          className="w-100"
                                          disabled={isErrorDeleteSubmitting || isErrorUpdateSubmitting}
                                          onClick={() => {
                                            handleSelectErrorMessage(item);
                                            openDeleteErrorMessageConfirm(item);
                                          }}
                                        >
                                          {!isDeletingCurrentItem ? (
                                            <FontAwesomeIcon icon="trash" className="me-2" />
                                          ) : null}
                                          {isDeletingCurrentItem ? (
                                            <span className="d-inline-flex align-items-center gap-2">
                                              <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                className="me-2 flex-shrink-0 admin-action-spinner"
                                                aria-hidden="true"
                                              />
                                              <span>
                                                {t('adminAccount.errorsCatalog.actions.deleting', {
                                                  ns: 'admin-account',
                                                })}
                                              </span>
                                            </span>
                                          ) : (
                                            t('adminAccount.errorsCatalog.actions.delete', { ns: 'admin-account' })
                                          )}
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                      {!isErrorMessagesLoading && totalErrorMessages > 0 ? (
                        <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top border-bottom">
                          <PaginationBar
                            className="border-0 rounded-0 px-2 px-md-3 py-0 bg-transparent shadow-none"
                            currentPage={errorMessagesPage}
                            totalPages={totalErrorMessagePages}
                            totalResults={totalErrorMessages}
                            size={errorMessagesPageSize}
                            onPageChange={page => {
                              setErrorMessagesPage(page);
                              scrollToErrorMessagesListStart();
                            }}
                            onSizeChange={size => {
                              setErrorMessagesPageSize(size);
                              setErrorMessagesPage(1);
                              scrollToErrorMessagesListStart();
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Modal
                    show={isErrorEditorModalOpen}
                    onHide={() => {
                      if (isErrorCreateSubmitting || isErrorUpdateSubmitting || isErrorDeleteSubmitting) {
                        return;
                      }
                      setIsErrorEditorModalOpen(false);
                    }}
                    centered
                    dialogClassName="admin-error-editor-modal"
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>
                        {errorCrudTab === 'create'
                          ? t('adminAccount.errorsCatalog.tabs.create', { ns: 'admin-account' })
                          : t('adminAccount.errorsCatalog.tabs.update', { ns: 'admin-account' })}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {errorCrudTab === 'create' ? (
                        <>
                          <p className="small text-muted mb-3">
                            {t('adminAccount.errorsCatalog.create.copy', { ns: 'admin-account' })}
                          </p>
                          <div className="row g-2 mb-3">
                            <div className="col-12 col-sm-4">
                              <Form.Group controlId="admin-error-create-locale">
                                <Form.Label className="small fw-semibold mb-1">
                                  {t('adminAccount.errorsCatalog.create.locale', { ns: 'admin-account' })}
                                </Form.Label>
                                <Form.Select
                                  value={errorCreateLocale}
                                  onChange={event => {
                                    setErrorCreateLocale(event.currentTarget.value as 'en' | 'tr');
                                    setErrorMessagesErrorMessage('');
                                    setErrorMessagesSuccessMessage('');
                                  }}
                                >
                                  <option value="en">
                                    {t('adminAccount.errorsCatalog.filters.locales.en', { ns: 'admin-account' })}
                                  </option>
                                  <option value="tr">
                                    {t('adminAccount.errorsCatalog.filters.locales.tr', { ns: 'admin-account' })}
                                  </option>
                                </Form.Select>
                              </Form.Group>
                            </div>
                            <div className="col-12 col-sm-8">
                              <Form.Group controlId="admin-error-create-code">
                                <Form.Label className="small fw-semibold mb-1">
                                  {t('adminAccount.errorsCatalog.create.code', { ns: 'admin-account' })}
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  value={errorCreateCode}
                                  placeholder={t('adminAccount.errorsCatalog.create.codePlaceholder', {
                                    ns: 'admin-account',
                                  })}
                                  onChange={event => {
                                    setErrorCreateCode(event.currentTarget.value);
                                    setErrorMessagesErrorMessage('');
                                    setErrorMessagesSuccessMessage('');
                                  }}
                                  autoCapitalize="characters"
                                  maxLength={120}
                                />
                                {normalizedErrorCreateCode !== '' && !isErrorCreateCodeValid ? (
                                  <Form.Text className="text-danger">
                                    {t('adminAccount.errorsCatalog.create.codeValidation', { ns: 'admin-account' })}
                                  </Form.Text>
                                ) : null}
                              </Form.Group>
                            </div>
                          </div>

                          <Form.Group controlId="admin-error-create-message">
                            <Form.Label>
                              {t('adminAccount.errorsCatalog.create.message', { ns: 'admin-account' })}
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={5}
                              value={errorCreateMessage}
                              onChange={event => {
                                setErrorCreateMessage(event.currentTarget.value);
                                setErrorMessagesErrorMessage('');
                                setErrorMessagesSuccessMessage('');
                              }}
                              maxLength={500}
                            />
                            <Form.Text className="text-muted">
                              {t('adminAccount.errorsCatalog.create.messageHint', { ns: 'admin-account', count: 500 })}
                            </Form.Text>
                          </Form.Group>
                        </>
                      ) : selectedErrorMessage ? (
                        <>
                          <p className="small text-muted mb-3">
                            {t('adminAccount.errorsCatalog.update.copy', { ns: 'admin-account' })}
                          </p>
                          <dl className="row mb-3 small">
                            <dt className="col-4 text-uppercase text-muted">
                              {t('adminAccount.errorsCatalog.update.labels.code', { ns: 'admin-account' })}
                            </dt>
                            <dd className="col-8 mb-2">{selectedErrorMessage.code}</dd>
                            <dt className="col-4 text-uppercase text-muted">
                              {t('adminAccount.errorsCatalog.update.labels.scope', { ns: 'admin-account' })}
                            </dt>
                            <dd className="col-8 mb-2">{selectedErrorMessage.scope}</dd>
                            <dt className="col-4 text-uppercase text-muted">
                              {t('adminAccount.errorsCatalog.update.labels.locale', { ns: 'admin-account' })}
                            </dt>
                            <dd className="col-8 mb-2">{selectedErrorMessage.locale}</dd>
                          </dl>

                          <Form.Group controlId="admin-error-update-message">
                            <Form.Label>
                              {t('adminAccount.errorsCatalog.update.message', { ns: 'admin-account' })}
                            </Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={5}
                              value={errorUpdateMessage}
                              onChange={event => {
                                setErrorUpdateMessage(event.currentTarget.value);
                                setErrorMessagesErrorMessage('');
                                setErrorMessagesSuccessMessage('');
                              }}
                              maxLength={500}
                            />
                            <Form.Text className="text-muted">
                              {t('adminAccount.errorsCatalog.update.messageHint', { ns: 'admin-account', count: 500 })}
                            </Form.Text>
                          </Form.Group>
                        </>
                      ) : (
                        <p className="small text-muted mb-0">
                          {t('adminAccount.errorsCatalog.update.empty', { ns: 'admin-account' })}
                        </p>
                      )}
                    </Modal.Body>
                    <Modal.Footer className="justify-content-between">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setIsErrorEditorModalOpen(false);
                        }}
                        disabled={isErrorCreateSubmitting || isErrorUpdateSubmitting || isErrorDeleteSubmitting}
                      >
                        {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
                      </Button>

                      <div className="d-flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="primary"
                          disabled={errorCrudTab === 'create' ? !canCreateErrorMessage : !canUpdateErrorMessage}
                          onClick={() => {
                            if (errorCrudTab === 'create') {
                              void handleCreateErrorMessageSubmit();
                              return;
                            }
                            void handleUpdateErrorMessageSubmit();
                          }}
                        >
                          {errorCrudTab === 'create' ? (
                            isErrorCreateSubmitting ? (
                              <span className="d-inline-flex align-items-center gap-2">
                                <Spinner
                                  as="span"
                                  animation="border"
                                  size="sm"
                                  className="me-2 flex-shrink-0 admin-action-spinner"
                                  aria-hidden="true"
                                />
                                <span>{t('adminAccount.errorsCatalog.actions.creating', { ns: 'admin-account' })}</span>
                              </span>
                            ) : (
                              <>
                                <FontAwesomeIcon icon="plus" className="me-2" />
                                {t('adminAccount.errorsCatalog.actions.create', { ns: 'admin-account' })}
                              </>
                            )
                          ) : isErrorUpdateSubmitting ? (
                            <span className="d-inline-flex align-items-center gap-2">
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                className="me-2 flex-shrink-0 admin-action-spinner"
                                aria-hidden="true"
                              />
                              <span>{t('adminAccount.errorsCatalog.actions.updating', { ns: 'admin-account' })}</span>
                            </span>
                          ) : (
                            <>
                              <FontAwesomeIcon icon="save" className="me-2" />
                              {t('adminAccount.errorsCatalog.actions.update', { ns: 'admin-account' })}
                            </>
                          )}
                        </Button>
                      </div>
                    </Modal.Footer>
                  </Modal>

                  <Modal
                    show={pendingErrorMessageDelete !== null}
                    onHide={() => {
                      if (isErrorDeleteSubmitting) {
                        return;
                      }
                      setPendingErrorMessageDelete(null);
                    }}
                    centered
                    dialogClassName="admin-error-editor-modal"
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>
                        {t('adminAccount.errorsCatalog.actions.delete', { ns: 'admin-account' })}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <p className="small text-muted mb-3">
                        {t('adminAccount.errorsCatalog.actions.confirmDelete', {
                          ns: 'admin-account',
                          code: pendingErrorMessageDelete?.code ?? '',
                          locale: pendingErrorMessageDelete?.locale ?? '',
                        })}
                      </p>
                      <dl className="row mb-0 small">
                        <dt className="col-4 text-uppercase text-muted">
                          {t('adminAccount.errorsCatalog.update.labels.code', { ns: 'admin-account' })}
                        </dt>
                        <dd className="col-8 mb-2">{pendingErrorMessageDelete?.code ?? '-'}</dd>
                        <dt className="col-4 text-uppercase text-muted">
                          {t('adminAccount.errorsCatalog.update.labels.scope', { ns: 'admin-account' })}
                        </dt>
                        <dd className="col-8 mb-2">{pendingErrorMessageDelete?.scope ?? '-'}</dd>
                        <dt className="col-4 text-uppercase text-muted">
                          {t('adminAccount.errorsCatalog.update.labels.locale', { ns: 'admin-account' })}
                        </dt>
                        <dd className="col-8 mb-0">{pendingErrorMessageDelete?.locale ?? '-'}</dd>
                      </dl>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isErrorDeleteSubmitting}
                        onClick={() => {
                          setPendingErrorMessageDelete(null);
                        }}
                      >
                        {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={pendingErrorMessageDelete === null || isErrorDeleteSubmitting}
                        onClick={() => {
                          void handleDeleteErrorMessageSubmit();
                        }}
                      >
                        {isErrorDeleteSubmitting ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              className="me-2 flex-shrink-0 admin-action-spinner"
                              aria-hidden="true"
                            />
                            <span>{t('adminAccount.errorsCatalog.actions.deleting', { ns: 'admin-account' })}</span>
                          </span>
                        ) : (
                          <>
                            <FontAwesomeIcon icon="trash" className="me-2" />
                            {t('adminAccount.errorsCatalog.actions.delete', { ns: 'admin-account' })}
                          </>
                        )}
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </>
              ) : null}

              {isSecuritySection ? (
                <>
                  <h3 className="admin-dashboard-panel-title mb-3">
                    {t('adminCommon.actions.changePassword', { ns: 'admin-common' })}
                  </h3>
                  <hr className="admin-section-divider mb-3" />
                  <p className="admin-dashboard-panel-copy">{t('adminAccount.form.copy', { ns: 'admin-account' })}</p>

                  {securityErrorMessage ? (
                    <Alert variant="danger" className="mb-4 px-4 py-3 lh-base">
                      {securityErrorMessage}
                    </Alert>
                  ) : null}
                  {securitySuccessMessage ? (
                    <Alert variant="success" className="mb-4 px-4 py-3 lh-base">
                      {securitySuccessMessage}
                    </Alert>
                  ) : null}

                  <Form noValidate onSubmit={handleSecuritySubmit}>
                    <Form.Group className="mb-3" controlId="admin-account-current-password">
                      <Form.Label>{t('adminAccount.form.currentPassword', { ns: 'admin-account' })}</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={handleCurrentPasswordChange}
                          placeholder={t('adminAccount.form.currentPasswordPlaceholder', { ns: 'admin-account' })}
                          autoComplete="current-password"
                          isInvalid={showCurrentPasswordError}
                          required
                          autoFocus
                        />
                        <Button
                          variant="outline-secondary"
                          type="button"
                          onClick={() => setShowCurrentPassword(previous => !previous)}
                          aria-label={
                            showCurrentPassword
                              ? t('adminAccount.form.hidePassword', { ns: 'admin-account' })
                              : t('adminAccount.form.showPassword', { ns: 'admin-account' })
                          }
                        >
                          <FontAwesomeIcon icon={showCurrentPassword ? 'eye-slash' : 'eye'} />
                        </Button>
                      </InputGroup>
                      <Form.Control.Feedback type="invalid" className={showCurrentPasswordError ? 'd-block' : ''}>
                        {securityCurrentPasswordError}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3" controlId="admin-account-new-password">
                      <Form.Label>{t('adminAccount.form.newPassword', { ns: 'admin-account' })}</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={handleNewPasswordChange}
                          placeholder={t('adminAccount.form.newPasswordPlaceholder', { ns: 'admin-account' })}
                          autoComplete="new-password"
                          isInvalid={showNewPasswordError}
                          required
                          minLength={MIN_PASSWORD_LENGTH}
                        />
                        <Button
                          variant="outline-secondary"
                          type="button"
                          onClick={() => setShowNewPassword(previous => !previous)}
                          aria-label={
                            showNewPassword
                              ? t('adminAccount.form.hidePassword', { ns: 'admin-account' })
                              : t('adminAccount.form.showPassword', { ns: 'admin-account' })
                          }
                        >
                          <FontAwesomeIcon icon={showNewPassword ? 'eye-slash' : 'eye'} />
                        </Button>
                      </InputGroup>
                      <div
                        className={`admin-password-strength admin-password-strength-${passwordStrength.tone}`}
                        aria-live="polite"
                      >
                        <div className="admin-password-strength-head">
                          <span>{t('adminAccount.strength.title', { ns: 'admin-account' })}</span>
                        </div>
                        <div className="admin-password-strength-track" aria-hidden="true">
                          {Array.from({ length: 5 }, (_, index) => (
                            <span
                              key={`strength:${index + 1}`}
                              className={`admin-password-strength-segment${
                                index < passwordStrength.score ? ' is-active' : ''
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <Form.Control.Feedback type="invalid" className={showNewPasswordError ? 'd-block' : ''}>
                        {securityNewPasswordError}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="admin-account-confirm-password">
                      <Form.Label>{t('adminAccount.form.confirmPassword', { ns: 'admin-account' })}</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={handleConfirmPasswordChange}
                          placeholder={t('adminAccount.form.confirmPasswordPlaceholder', { ns: 'admin-account' })}
                          autoComplete="new-password"
                          isInvalid={showConfirmPasswordError}
                          required
                          minLength={MIN_PASSWORD_LENGTH}
                        />
                        <Button
                          variant="outline-secondary"
                          type="button"
                          onClick={() => setShowConfirmPassword(previous => !previous)}
                          aria-label={
                            showConfirmPassword
                              ? t('adminAccount.form.hidePassword', { ns: 'admin-account' })
                              : t('adminAccount.form.showPassword', { ns: 'admin-account' })
                          }
                        >
                          <FontAwesomeIcon icon={showConfirmPassword ? 'eye-slash' : 'eye'} />
                        </Button>
                      </InputGroup>
                      <Form.Control.Feedback type="invalid" className={showConfirmPasswordError ? 'd-block' : ''}>
                        {securityConfirmPasswordError}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <div className="post-summary-cta">
                      <Button type="submit" className="post-summary-read-more" disabled={isSecuritySubmitting}>
                        {isSecuritySubmitting ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              className="me-2 flex-shrink-0 admin-action-spinner"
                              aria-hidden="true"
                            />
                            <span className="read-more-label">
                              {t('adminAccount.form.submitting', { ns: 'admin-account' })}
                            </span>
                          </span>
                        ) : (
                          <span className="read-more-label">
                            {t('adminAccount.form.submit', { ns: 'admin-account' })}
                          </span>
                        )}
                      </Button>
                    </div>
                  </Form>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={isAvatarCropModalOpen}
        onHide={closeAvatarCropModal}
        centered
        backdrop="static"
        backdropClassName="admin-avatar-crop-backdrop"
        dialogClassName="admin-avatar-crop-dialog"
      >
        <Modal.Header closeButton>
          <Modal.Title>{t('adminAccount.profile.avatar.crop.title', { ns: 'admin-account' })}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="small text-body-secondary mb-3">
            {t('adminAccount.profile.avatar.crop.copy', { ns: 'admin-account' })}
          </p>
          <div
            className={`admin-avatar-crop-stage crop-container position-relative mx-auto overflow-hidden${
              isAvatarCropDragging ? ' is-dragging' : isAvatarCropResizing ? ' is-resizing' : ''
            }`}
            ref={avatarCropStageRef}
            style={avatarCropStageStyle}
            onPointerDown={handleAvatarCropPointerDown}
            onPointerMove={handleAvatarCropPointerMove}
            onPointerUp={endAvatarCropDrag}
            onPointerCancel={endAvatarCropDrag}
            onLostPointerCapture={endAvatarCropDrag}
            role="presentation"
          >
            {avatarCropSource ? (
              <Image
                src={avatarCropSource}
                alt={t('adminAccount.profile.avatar.title', { ns: 'admin-account' })}
                width={Math.max(1, avatarCropImageSize.width)}
                height={Math.max(1, avatarCropImageSize.height)}
                unoptimized
                draggable={false}
                className="position-absolute top-50 start-50 user-select-none pe-none"
                style={avatarCropImageStyle}
              />
            ) : null}
            <div data-crop-box="" className="crop-box" style={avatarCropBoxStyle}>
              <div className="crop-outline" />
              {(['nw', 'ne', 'sw', 'se'] as const).map(direction => (
                <button
                  key={`avatar-crop-handle:${direction}`}
                  type="button"
                  data-direction={direction}
                  className={`handle ${direction}`}
                  onPointerDown={handleAvatarCropResizeStart}
                  disabled={isAvatarCropSaving || isAvatarSubmitting}
                  aria-label={t('adminAccount.profile.avatar.crop.zoom', { ns: 'admin-account' })}
                />
              ))}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="admin-avatar-crop-footer">
          <Button
            variant="success"
            className="admin-avatar-crop-submit"
            onClick={() => void handleAvatarCropSave()}
            disabled={isAvatarCropSaving || isAvatarSubmitting}
          >
            {isAvatarCropSaving || (isAvatarSubmitting && avatarPendingAction === 'upload') ? (
              <span className="d-inline-flex align-items-center gap-2">
                <Spinner as="span" animation="border" size="sm" className="me-2 flex-shrink-0" aria-hidden="true" />
                <span>{t('adminAccount.profile.avatar.crop.saving', { ns: 'admin-account' })}</span>
              </span>
            ) : (
              t('adminAccount.profile.avatar.crop.save', { ns: 'admin-account' })
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
