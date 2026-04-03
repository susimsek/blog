'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AdminContentManagementPanel from '@/components/admin/AdminContentManagementPanel';
import AdminAccountAccountSection from '@/components/admin/account/AdminAccountAccountSection';
import AdminAccountAppearanceSection from '@/components/admin/account/AdminAccountAppearanceSection';
import AdminAccountCommentsSection from '@/components/admin/account/AdminAccountCommentsSection';
import AdminAccountEmailSection from '@/components/admin/account/AdminAccountEmailSection';
import AdminAccountErrorsSection from '@/components/admin/account/AdminAccountErrorsSection';
import AdminAccountNewsletterSection from '@/components/admin/account/AdminAccountNewsletterSection';
import AdminAccountProfileSection from '@/components/admin/account/AdminAccountProfileSection';
import AdminAccountSecuritySection from '@/components/admin/account/AdminAccountSecuritySection';
import AdminAccountSessionsSection from '@/components/admin/account/AdminAccountSessionsSection';
import useDebounce from '@/hooks/useDebounce';
import useAutoClearValue from '@/hooks/useAutoClearValue';
import useAdminCommentsSection from '@/views/admin-account/useAdminCommentsSection';
import useAdminErrorsSection from '@/views/admin-account/useAdminErrorsSection';
import {
  changeAdminAvatar,
  changeAdminName,
  changeAdminPassword,
  changeAdminUsername,
  deleteAdminNewsletterSubscriber,
  deleteAdminAccount,
  fetchAdminActiveSessions,
  fetchAdminGithubAuthStatus,
  fetchAdminGoogleAuthStatus,
  fetchAdminMe,
  fetchAdminNewsletterCampaignFailures,
  fetchAdminNewsletterCampaigns,
  fetchAdminNewsletterSubscribers,
  isAdminSessionError,
  startAdminGithubConnect,
  startAdminGoogleConnect,
  disconnectAdminGithub,
  requestAdminEmailChange,
  resolveAdminError,
  revokeAdminSession,
  revokeAllAdminSessions,
  sendAdminNewsletterTestEmail,
  disconnectAdminGoogle,
  triggerAdminNewsletterDispatch,
  updateAdminNewsletterSubscriberStatus,
  type AdminNewsletterCampaignItem,
  type AdminNewsletterDeliveryFailureItem,
  type AdminNewsletterDispatchLocaleResult,
  type AdminNewsletterSubscriberItem,
} from '@/lib/adminApi';
import { withAdminAvatarSize } from '@/lib/adminAvatar';
import { getAdminPasswordStrength, MIN_PASSWORD_LENGTH } from '@/lib/adminPassword';
import { ADMIN_ROUTES } from '@/lib/adminRoutes';
import { defaultLocale } from '@/i18n/settings';
import { withBasePath } from '@/lib/basePath';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import Link from '@/components/common/Link';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { resetToSystemTheme, setTheme, type Theme } from '@/reducers/theme';
import { THEMES } from '@/config/constants';
import {
  clearAdminSessionProfileCache,
  readAdminSessionProfileCache,
  writeAdminSessionProfileCache,
  type AdminSessionProfile,
} from '@/lib/adminSessionProfileCache';
import { resolveConnectedAccountMessage } from '@/views/admin-account/helpers';

type AdminAccountPageProps = {
  section:
    | 'profile'
    | 'account'
    | 'email'
    | 'appearance'
    | 'sessions'
    | 'newsletter'
    | 'newsletterSubscribers'
    | 'comments'
    | 'security'
    | 'errors'
    | 'content';
};

type AdminIdentity = AdminSessionProfile | null;
type AdminAlertVariant = 'success' | 'danger' | 'info';
type NewsletterFilterStatus = 'all' | 'pending' | 'active' | 'unsubscribed';
type AdminEmailErrorField = 'currentPassword' | 'newEmail' | 'generic';
type AdminAccountTranslate = (key: string, options?: Record<string, unknown>) => string;
type AsyncSectionContentProps = {
  isLoading: boolean;
  loadingLabel: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
};

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

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 80;
const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 32;
const DELETE_CONFIRMATION_VALUE = 'DELETE';
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUCCESS_MESSAGE_AUTO_HIDE_MS = 3500;
const MAX_AVATAR_FILE_BYTES = 2 * 1024 * 1024;
const MAX_AVATAR_FILE_SIZE_MB = Math.floor(MAX_AVATAR_FILE_BYTES / (1024 * 1024));
const AVATAR_CROP_VIEWPORT_SIZE = 260;
const AVATAR_CROP_MIN_SIZE = 96;
const DEFAULT_AVATAR_EXPORT_SIZE = 512;
const MIN_AVATAR_EXPORT_SIZE = 128;
const MIN_AVATAR_EXPORT_QUALITY = 0.5;
const ALLOWED_AVATAR_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const resolveEmailValidationError = (email: string, profileEmail: string, translate: AdminAccountTranslate) => {
  if (email === '') {
    return translate('adminAccount.validation.emailRequired', { ns: 'admin-account' });
  }
  if (!EMAIL_PATTERN.test(email)) {
    return translate('adminAccount.validation.emailInvalid', { ns: 'admin-account' });
  }
  if (profileEmail === email) {
    return translate('adminAccount.validation.emailDifferent', { ns: 'admin-account' });
  }

  return '';
};

const resolveAdminEmailErrorField = (code?: string): AdminEmailErrorField => {
  if (code === 'ADMIN_CURRENT_PASSWORD_INCORRECT' || code === 'ADMIN_CURRENT_PASSWORD_REQUIRED') {
    return 'currentPassword';
  }
  if (code === 'ADMIN_EMAIL_INVALID' || code === 'ADMIN_EMAIL_SAME' || code === 'ADMIN_EMAIL_TAKEN') {
    return 'newEmail';
  }

  return 'generic';
};

const renderAsyncSectionContent = ({
  isLoading,
  loadingLabel,
  isEmpty,
  emptyMessage,
  children,
}: AsyncSectionContentProps) => {
  if (isLoading) {
    return (
      <div className="admin-account-sessions-loading">
        <AdminLoadingState className="admin-loading-stack" ariaLabel={loadingLabel} />
      </div>
    );
  }
  if (isEmpty) {
    return <p className="small text-muted mb-0">{emptyMessage}</p>;
  }

  return children;
};

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
    const image = new globalThis.Image();
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

export default function AdminAccountPage({ section }: Readonly<AdminAccountPageProps>) {
  const { t } = useTranslation(['admin-account', 'admin-common']);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ locale?: string | string[] }>();
  const routeLocale = Array.isArray(params?.locale) ? params.locale[0] : params?.locale;
  const locale = routeLocale ?? defaultLocale;
  const isProfileSection = section === 'profile';
  const isAccountSection = section === 'account';
  const isEmailSection = section === 'email';
  const isAppearanceSection = section === 'appearance';
  const isSessionsSection = section === 'sessions';
  const isNewsletterOverviewSection = section === 'newsletter';
  const isNewsletterSubscribersSection = section === 'newsletterSubscribers';
  const isNewsletterSection = isNewsletterOverviewSection || isNewsletterSubscribersSection;
  const isCommentsSection = section === 'comments';
  const isSecuritySection = section === 'security';
  const isErrorsSection = section === 'errors';
  const isContentSection = section === 'content';
  const newsletterTab = isNewsletterSubscribersSection ? 'subscribers' : 'overview';

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
  const [googleAuthStatus, setGoogleAuthStatus] = React.useState({
    enabled: false,
    loginAvailable: false,
  });
  const [githubAuthStatus, setGithubAuthStatus] = React.useState({
    enabled: false,
    loginAvailable: false,
  });
  const [isGoogleAuthStatusLoading, setIsGoogleAuthStatusLoading] = React.useState(isSecuritySection);
  const [isGithubAuthStatusLoading, setIsGithubAuthStatusLoading] = React.useState(isSecuritySection);
  const [googleActionErrorMessage, setGoogleActionErrorMessage] = React.useState('');
  const [githubActionErrorMessage, setGithubActionErrorMessage] = React.useState('');
  const [isGoogleConnectSubmitting, setIsGoogleConnectSubmitting] = React.useState(false);
  const [isGoogleDisconnectSubmitting, setIsGoogleDisconnectSubmitting] = React.useState(false);
  const [isGithubConnectSubmitting, setIsGithubConnectSubmitting] = React.useState(false);
  const [isGithubDisconnectSubmitting, setIsGithubDisconnectSubmitting] = React.useState(false);
  const [isSecurityPasswordExpanded, setIsSecurityPasswordExpanded] = React.useState(false);
  const [isGoogleDisconnectModalOpen, setIsGoogleDisconnectModalOpen] = React.useState(false);
  const [isGithubDisconnectModalOpen, setIsGithubDisconnectModalOpen] = React.useState(false);
  const [googleConnectMessage, setGoogleConnectMessage] = React.useState('');
  const [githubConnectMessage, setGithubConnectMessage] = React.useState('');
  const [googleConnectMessageVariant, setGoogleConnectMessageVariant] = React.useState<AdminAlertVariant>('info');
  const [githubConnectMessageVariant, setGithubConnectMessageVariant] = React.useState<AdminAlertVariant>('info');
  const [newsletterSubscribers, setNewsletterSubscribers] = React.useState<AdminNewsletterSubscriberItem[]>([]);
  const [isNewsletterLoading, setIsNewsletterLoading] = React.useState(isNewsletterSubscribersSection);
  const [newsletterErrorMessage, setNewsletterErrorMessage] = React.useState('');
  const [newsletterSuccessMessage, setNewsletterSuccessMessage] = React.useState('');
  const [newsletterFilterLocale, setNewsletterFilterLocale] = React.useState<'all' | 'en' | 'tr'>('all');
  const [newsletterFilterStatus, setNewsletterFilterStatus] = React.useState<NewsletterFilterStatus>('all');
  const [newsletterFilterQuery, setNewsletterFilterQuery] = React.useState('');
  const [newsletterPage, setNewsletterPage] = React.useState(1);
  const [newsletterPageSize, setNewsletterPageSize] = React.useState(10);
  const [totalNewsletterSubscribers, setTotalNewsletterSubscribers] = React.useState(0);
  const [newsletterSubscriberSummary, setNewsletterSubscriberSummary] = React.useState({
    total: 0,
    active: 0,
    pending: 0,
    unsubscribed: 0,
  });
  const [isNewsletterSummaryLoading, setIsNewsletterSummaryLoading] = React.useState(isNewsletterOverviewSection);
  const [newsletterCampaigns, setNewsletterCampaigns] = React.useState<AdminNewsletterCampaignItem[]>([]);
  const [newsletterCampaignThumbnails, setNewsletterCampaignThumbnails] = React.useState<Record<string, string>>({});
  const [isNewsletterCampaignsLoading, setIsNewsletterCampaignsLoading] = React.useState(isNewsletterOverviewSection);
  const [isNewsletterDispatchRunning, setIsNewsletterDispatchRunning] = React.useState(false);
  const [newsletterDispatchResults, setNewsletterDispatchResults] = React.useState<
    AdminNewsletterDispatchLocaleResult[]
  >([]);
  const [newsletterDispatchTimestamp, setNewsletterDispatchTimestamp] = React.useState('');
  const [selectedNewsletterCampaign, setSelectedNewsletterCampaign] =
    React.useState<AdminNewsletterCampaignItem | null>(null);
  const [newsletterCampaignFailures, setNewsletterCampaignFailures] = React.useState<
    AdminNewsletterDeliveryFailureItem[]
  >([]);
  const [isNewsletterFailuresLoading, setIsNewsletterFailuresLoading] = React.useState(false);
  const [newsletterFailuresTotal, setNewsletterFailuresTotal] = React.useState(0);
  const [pendingNewsletterTestCampaign, setPendingNewsletterTestCampaign] =
    React.useState<AdminNewsletterCampaignItem | null>(null);
  const [newsletterTestEmail, setNewsletterTestEmail] = React.useState('');
  const [isNewsletterTestSending, setIsNewsletterTestSending] = React.useState(false);
  const [updatingNewsletterEmail, setUpdatingNewsletterEmail] = React.useState('');
  const [deletingNewsletterEmail, setDeletingNewsletterEmail] = React.useState('');
  const [pendingNewsletterDelete, setPendingNewsletterDelete] = React.useState<AdminNewsletterSubscriberItem | null>(
    null,
  );

  const [usernameInput, setUsernameInput] = React.useState('');
  const [isUsernameSubmitting, setIsUsernameSubmitting] = React.useState(false);
  const [usernameSubmitted, setUsernameSubmitted] = React.useState(false);
  const [usernameErrorMessage, setUsernameErrorMessage] = React.useState('');
  const [usernameSuccessMessage, setUsernameSuccessMessage] = React.useState('');
  const [emailInput, setEmailInput] = React.useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = React.useState('');
  const [emailTouchedFields, setEmailTouchedFields] = React.useState({
    newEmail: false,
    currentPassword: false,
  });
  const [isEmailSubmitting, setIsEmailSubmitting] = React.useState(false);
  const [emailSubmitted, setEmailSubmitted] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [emailErrorField, setEmailErrorField] = React.useState<'newEmail' | 'currentPassword' | 'generic' | null>(null);
  const [emailSuccessMessage, setEmailSuccessMessage] = React.useState('');
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
  const avatarCropDragRef = React.useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const avatarCropResizeRef = React.useRef<AvatarCropResizeState | null>(null);
  const avatarFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const newsletterRequestIDRef = React.useRef(0);
  const newsletterCampaignRequestIDRef = React.useRef(0);

  const [deleteCurrentPassword, setDeleteCurrentPassword] = React.useState('');
  const [deleteConfirmation, setDeleteConfirmation] = React.useState('');
  const [showDeletePassword, setShowDeletePassword] = React.useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = React.useState(false);
  const [deleteSubmitted, setDeleteSubmitted] = React.useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = React.useState('');
  const [deleteSuccessMessage, setDeleteSuccessMessage] = React.useState('');
  const selectedTheme = useAppSelector(state => state.theme.theme);
  const hasExplicitTheme = useAppSelector(state => state.theme.hasExplicitTheme);
  const newsletterFilterQueryDebounced = useDebounce(newsletterFilterQuery.trim(), 220);

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

  const redirectToAdminLoginRef = React.useRef<() => void>(() => {});

  const syncAdminUser = React.useCallback((nextUser: AdminIdentity) => {
    setAdminUser(nextUser);
    writeAdminSessionProfileCache(nextUser);
  }, []);

  const patchAdminUser = React.useCallback((updater: (previous: AdminIdentity) => AdminIdentity) => {
    setAdminUser(previous => {
      const nextUser = updater(previous);
      writeAdminSessionProfileCache(nextUser);
      return nextUser;
    });
  }, []);

  React.useEffect(() => {
    redirectToAdminLoginRef.current = () => {
      clearAdminSessionProfileCache();
      router.replace(`/${locale}/admin/login`);
    };
  }, [locale, router]);

  const handleAdminSessionExpired = React.useCallback(() => {
    redirectToAdminLoginRef.current();
  }, []);

  const commentsSection = useAdminCommentsSection({
    isActive: isCommentsSection,
    hasAdminUser: adminUser !== null,
    t,
    onSessionExpired: handleAdminSessionExpired,
    successMessageAutoHideMs: SUCCESS_MESSAGE_AUTO_HIDE_MS,
  });

  const errorsSection = useAdminErrorsSection({
    isActive: isErrorsSection,
    hasAdminUser: adminUser !== null,
    t,
    onSessionExpired: handleAdminSessionExpired,
    successMessageAutoHideMs: SUCCESS_MESSAGE_AUTO_HIDE_MS,
  });

  React.useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const cachedUser = readAdminSessionProfileCache();
        const resolvedUser = (() => {
          if (cachedUser) {
            return cachedUser;
          }

          return null;
        })();

        if (resolvedUser) {
          syncAdminUser(resolvedUser);
          setNameInput(resolvedUser.name ?? '');
          setUsernameInput(resolvedUser.username ?? '');
        } else {
          const me = await fetchAdminMe();
          if (!isMounted) {
            return;
          }

          if (!me.authenticated || !me.user) {
            redirectToAdminLoginRef.current();
            return;
          }

          syncAdminUser(me.user);
          setNameInput(me.user.name ?? '');
          setUsernameInput(me.user.username ?? '');
        }
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
            redirectToAdminLoginRef.current();
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
          redirectToAdminLoginRef.current();
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
  }, [isSessionsSection, syncAdminUser, t]);

  React.useEffect(() => {
    if (!isSecuritySection) {
      return;
    }

    let isMounted = true;
    setIsGoogleAuthStatusLoading(true);

    void fetchAdminGoogleAuthStatus()
      .then(payload => {
        if (!isMounted) {
          return;
        }
        setGoogleAuthStatus(payload);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setGoogleAuthStatus({
          enabled: false,
          loginAvailable: false,
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsGoogleAuthStatusLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isSecuritySection]);

  React.useEffect(() => {
    if (!isSecuritySection) {
      return;
    }

    let isMounted = true;
    setIsGithubAuthStatusLoading(true);

    void fetchAdminGithubAuthStatus()
      .then(payload => {
        if (!isMounted) {
          return;
        }
        setGithubAuthStatus(payload);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }
        setGithubAuthStatus({
          enabled: false,
          loginAvailable: false,
        });
      })
      .finally(() => {
        if (isMounted) {
          setIsGithubAuthStatusLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isSecuritySection]);

  React.useEffect(() => {
    if (!isSecuritySection || !searchParams) {
      return;
    }

    const googleStatus = (searchParams.get('google') ?? '').trim().toLowerCase();
    if (googleStatus === '') {
      return;
    }

    const { message: nextMessage, variant: nextVariant } = resolveConnectedAccountMessage('google', googleStatus, t);
    setGoogleConnectMessage(nextMessage);
    setGoogleConnectMessageVariant(nextVariant);
    router.replace(pathname, { scroll: false });
  }, [isSecuritySection, pathname, router, searchParams, t]);

  React.useEffect(() => {
    if (!isSecuritySection || !searchParams) {
      return;
    }

    const githubStatus = (searchParams.get('github') ?? '').trim().toLowerCase();
    if (githubStatus === '') {
      return;
    }

    const { message: nextMessage, variant: nextVariant } = resolveConnectedAccountMessage('github', githubStatus, t);
    setGithubConnectMessage(nextMessage);
    setGithubConnectMessageVariant(nextVariant);
    router.replace(pathname, { scroll: false });
  }, [isSecuritySection, pathname, router, searchParams, t]);

  useAutoClearValue(nameSuccessMessage, setNameSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);
  useAutoClearValue(usernameSuccessMessage, setUsernameSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);
  useAutoClearValue(sessionSuccessMessage, setSessionSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);
  useAutoClearValue(googleConnectMessage, setGoogleConnectMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS, {
    when: googleConnectMessageVariant === 'success',
  });
  useAutoClearValue(githubConnectMessage, setGithubConnectMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS, {
    when: githubConnectMessageVariant === 'success',
  });
  useAutoClearValue(securitySuccessMessage, setSecuritySuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);
  useAutoClearValue(deleteSuccessMessage, setDeleteSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);
  useAutoClearValue(avatarSuccessMessage, setAvatarSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);
  useAutoClearValue(newsletterSuccessMessage, setNewsletterSuccessMessage, SUCCESS_MESSAGE_AUTO_HIDE_MS);

  React.useEffect(() => {
    setNewsletterPage(1);
  }, [newsletterFilterLocale, newsletterFilterQueryDebounced, newsletterFilterStatus]);

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
  const passwordStrength = getAdminPasswordStrength(newPassword);
  const showCurrentPasswordError =
    (hasSecuritySubmitted || securityTouchedFields.currentPassword) && securityCurrentPasswordError !== '';
  const showNewPasswordError =
    (hasSecuritySubmitted || securityTouchedFields.newPassword) && securityNewPasswordError !== '';
  const showConfirmPasswordError =
    (hasSecuritySubmitted || securityTouchedFields.confirmPassword) && securityConfirmPasswordError !== '';

  const resolvedUsernameInput = usernameInput.trim();
  const resolvedNameInput = nameInput.trim();
  const resolvedEmailInput = emailInput.trim().toLowerCase();
  const profileName = adminUser?.name?.trim() ?? '';
  const profileUsername = adminUser?.username?.trim() ?? '';
  const profileEmail = adminUser?.email?.trim().toLowerCase() ?? '';
  const pendingEmail = adminUser?.pendingEmail?.trim().toLowerCase() ?? '';
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
  const emailValidationError = resolveEmailValidationError(resolvedEmailInput, profileEmail, t);
  const emailCurrentPasswordError =
    emailCurrentPassword === '' ? t('adminAccount.validation.currentPasswordRequired', { ns: 'admin-account' }) : '';
  const showEmailValidationError = (emailSubmitted || emailTouchedFields.newEmail) && emailValidationError !== '';
  const showEmailCurrentPasswordError =
    (emailSubmitted || emailTouchedFields.currentPassword) && emailCurrentPasswordError !== '';
  const deletePasswordError =
    deleteCurrentPassword === '' ? t('adminAccount.validation.currentPasswordRequired', { ns: 'admin-account' }) : '';
  const deleteConfirmError =
    deleteConfirmation.trim().toUpperCase() !== DELETE_CONFIRMATION_VALUE
      ? t('adminAccount.validation.deleteConfirmation', { ns: 'admin-account', value: DELETE_CONFIRMATION_VALUE })
      : '';
  const showDeletePasswordError = deleteSubmitted && deletePasswordError !== '';
  const showDeleteConfirmError = deleteSubmitted && deleteConfirmError !== '';
  const activeAppearance = hasExplicitTheme ? selectedTheme : 'system';
  const totalNewsletterPages = Math.max(1, Math.ceil(totalNewsletterSubscribers / newsletterPageSize));
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

    globalThis.window.addEventListener('pointermove', handlePointerMove);
    globalThis.window.addEventListener('pointerup', handlePointerUp);
    globalThis.window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      globalThis.window.removeEventListener('pointermove', handlePointerMove);
      globalThis.window.removeEventListener('pointerup', handlePointerUp);
      globalThis.window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [avatarCropSizeBounds.max, avatarCropSizeBounds.min, isAvatarCropResizing, resolveClampedAvatarCropOffset]);

  const clearSecuritySuccessMessage = React.useCallback(() => {
    if (securitySuccessMessage) {
      setSecuritySuccessMessage('');
    }
  }, [securitySuccessMessage]);

  const clearGoogleConnectMessage = React.useCallback(() => {
    if (googleConnectMessage) {
      setGoogleConnectMessage('');
      setGoogleConnectMessageVariant('info');
    }
  }, [googleConnectMessage]);

  const clearGithubConnectMessage = React.useCallback(() => {
    if (githubConnectMessage) {
      setGithubConnectMessage('');
      setGithubConnectMessageVariant('info');
    }
  }, [githubConnectMessage]);

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

  const openGoogleDisconnectModal = React.useCallback(() => {
    setGoogleActionErrorMessage('');
    setIsGoogleDisconnectModalOpen(true);
  }, []);

  const closeGoogleDisconnectModal = React.useCallback(() => {
    if (isGoogleDisconnectSubmitting) {
      return;
    }

    setIsGoogleDisconnectModalOpen(false);
    setGoogleActionErrorMessage('');
  }, [isGoogleDisconnectSubmitting]);

  const openGithubDisconnectModal = React.useCallback(() => {
    setGithubActionErrorMessage('');
    setIsGithubDisconnectModalOpen(true);
  }, []);

  const closeGithubDisconnectModal = React.useCallback(() => {
    if (isGithubDisconnectSubmitting) {
      return;
    }

    setIsGithubDisconnectModalOpen(false);
    setGithubActionErrorMessage('');
  }, [isGithubDisconnectSubmitting]);

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
    // NOSONAR
    async (options?: { page?: number }): Promise<AdminNewsletterSubscriberItem[]> => {
      if (!isNewsletterSubscribersSection || !adminUser) {
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
          redirectToAdminLoginRef.current();
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
      isNewsletterSubscribersSection,
      newsletterFilterLocale,
      newsletterFilterQueryDebounced,
      newsletterFilterStatus,
      newsletterPage,
      newsletterPageSize,
      t,
    ],
  );

  const loadAdminNewsletterSummary = React.useCallback(async () => {
    if (!isNewsletterOverviewSection || !adminUser) {
      return;
    }

    setIsNewsletterSummaryLoading(true);

    try {
      const [allPayload, activePayload, pendingPayload, unsubscribedPayload] = await Promise.all([
        fetchAdminNewsletterSubscribers({ page: 1, size: 1 }),
        fetchAdminNewsletterSubscribers({ status: 'active', page: 1, size: 1 }),
        fetchAdminNewsletterSubscribers({ status: 'pending', page: 1, size: 1 }),
        fetchAdminNewsletterSubscribers({ status: 'unsubscribed', page: 1, size: 1 }),
      ]);

      setNewsletterSubscriberSummary({
        total: allPayload.total ?? 0,
        active: activePayload.total ?? 0,
        pending: pendingPayload.total ?? 0,
        unsubscribed: unsubscribedPayload.total ?? 0,
      });
    } catch (error) {
      if (isAdminSessionError(error)) {
        redirectToAdminLoginRef.current();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setNewsletterErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.newsletter.errors.summary', { ns: 'admin-account' }),
      );
    } finally {
      setIsNewsletterSummaryLoading(false);
    }
  }, [adminUser, isNewsletterOverviewSection, t]);

  const loadAdminNewsletterCampaigns = React.useCallback(async (): Promise<AdminNewsletterCampaignItem[]> => {
    if (!isNewsletterOverviewSection || !adminUser) {
      return [];
    }

    const requestID = newsletterCampaignRequestIDRef.current + 1;
    newsletterCampaignRequestIDRef.current = requestID;
    setIsNewsletterCampaignsLoading(true);

    try {
      const payload = await fetchAdminNewsletterCampaigns({
        locale: newsletterFilterLocale === 'all' ? undefined : newsletterFilterLocale,
        query: newsletterFilterQueryDebounced,
        page: 1,
        size: 6,
      });

      if (requestID !== newsletterCampaignRequestIDRef.current) {
        return [];
      }

      const items = payload.items ?? [];
      setNewsletterCampaigns(items);
      return items;
    } catch (error) {
      if (requestID !== newsletterCampaignRequestIDRef.current) {
        return [];
      }
      if (isAdminSessionError(error)) {
        redirectToAdminLoginRef.current();
        return [];
      }
      const resolvedError = resolveAdminError(error);
      setNewsletterErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.newsletter.errors.campaigns', { ns: 'admin-account' }),
      );
      return [];
    } finally {
      if (requestID === newsletterCampaignRequestIDRef.current) {
        setIsNewsletterCampaignsLoading(false);
      }
    }
  }, [adminUser, isNewsletterOverviewSection, newsletterFilterLocale, newsletterFilterQueryDebounced, t]);

  React.useEffect(() => {
    if (!isNewsletterSubscribersSection || !adminUser) {
      return;
    }

    void loadAdminNewsletterSubscribers();
  }, [adminUser, isNewsletterSubscribersSection, loadAdminNewsletterSubscribers, newsletterPage, newsletterPageSize]);

  React.useEffect(() => {
    if (!isNewsletterOverviewSection || !adminUser) {
      return;
    }

    void Promise.all([loadAdminNewsletterSummary(), loadAdminNewsletterCampaigns()]);
  }, [adminUser, isNewsletterOverviewSection, loadAdminNewsletterCampaigns, loadAdminNewsletterSummary]);

  React.useEffect(() => {
    if (!isNewsletterOverviewSection || newsletterCampaigns.length === 0) {
      setNewsletterCampaignThumbnails({});
      return;
    }

    const localeSet = Array.from(
      new Set(
        newsletterCampaigns
          .map(item => item.locale.trim().toLowerCase())
          .filter((value): value is 'en' | 'tr' => value === 'en' || value === 'tr'),
      ),
    );
    if (localeSet.length === 0) {
      setNewsletterCampaignThumbnails({});
      return;
    }

    let cancelled = false;

    void Promise.all(
      localeSet.map(async currentLocale => {
        const response = await fetch(`/data/posts.${currentLocale}.json`);
        if (!response.ok) {
          throw new Error(`posts-${currentLocale}-load-failed`);
        }

        const payload = (await response.json()) as Array<{ id?: string; thumbnail?: string | null }>;
        return [currentLocale, payload] as const;
      }),
    )
      .then(entries => {
        if (cancelled) {
          return;
        }

        const thumbnailsByLocale = new Map<string, Map<string, string>>();
        for (const [currentLocale, posts] of entries) {
          const thumbnailMap = new Map<string, string>();
          for (const post of posts) {
            const postID = post.id?.trim();
            const thumbnail = post.thumbnail?.trim();
            if (!postID || !thumbnail) {
              continue;
            }
            thumbnailMap.set(postID, thumbnail);
          }
          thumbnailsByLocale.set(currentLocale, thumbnailMap);
        }

        const nextThumbnails: Record<string, string> = {};
        for (const item of newsletterCampaigns) {
          const campaignKey = `${item.locale}:${item.itemKey}`;
          const postID = item.link?.trim().split('/posts/')[1]?.split('/')[0]?.trim();
          if (!postID) {
            continue;
          }

          const normalizedLocale = item.locale.trim().toLowerCase();
          const thumbnail = thumbnailsByLocale.get(normalizedLocale)?.get(postID);
          if (thumbnail) {
            nextThumbnails[campaignKey] = thumbnail;
          }
        }

        setNewsletterCampaignThumbnails(nextThumbnails);
      })
      .catch(() => {
        if (!cancelled) {
          setNewsletterCampaignThumbnails({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isNewsletterOverviewSection, newsletterCampaigns]);

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
          redirectToAdminLoginRef.current();
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
    [deletingNewsletterEmail, t, updatingNewsletterEmail],
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

      if (nextPage === newsletterPage) {
        setNewsletterSubscribers(previous => previous.filter(current => current.email !== item.email));
      } else {
        setNewsletterPage(nextPage);
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
        redirectToAdminLoginRef.current();
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
    newsletterPage,
    newsletterPageSize,
    pendingNewsletterDelete,
    t,
    totalNewsletterSubscribers,
    updatingNewsletterEmail,
  ]);

  const handleTriggerNewsletterDispatch = React.useCallback(async () => {
    if (isNewsletterDispatchRunning) {
      return;
    }

    setIsNewsletterDispatchRunning(true);
    setNewsletterErrorMessage('');
    setNewsletterSuccessMessage('');

    try {
      const payload = await triggerAdminNewsletterDispatch();
      setNewsletterDispatchResults(payload.results ?? []);
      setNewsletterDispatchTimestamp(payload.timestamp ?? '');
      setNewsletterSuccessMessage(
        payload.message || t('adminAccount.newsletter.success.dispatchTriggered', { ns: 'admin-account' }),
      );
      await Promise.all([loadAdminNewsletterCampaigns(), loadAdminNewsletterSummary()]);
    } catch (error) {
      if (isAdminSessionError(error)) {
        redirectToAdminLoginRef.current();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setNewsletterErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.newsletter.errors.dispatch', { ns: 'admin-account' }),
      );
    } finally {
      setIsNewsletterDispatchRunning(false);
    }
  }, [isNewsletterDispatchRunning, loadAdminNewsletterCampaigns, loadAdminNewsletterSummary, t]);

  const handleViewNewsletterFailures = React.useCallback(
    async (campaign: AdminNewsletterCampaignItem) => {
      setSelectedNewsletterCampaign(campaign);
      setIsNewsletterFailuresLoading(true);
      setNewsletterCampaignFailures([]);
      setNewsletterFailuresTotal(0);
      setNewsletterErrorMessage('');

      try {
        const payload = await fetchAdminNewsletterCampaignFailures({
          locale: campaign.locale,
          itemKey: campaign.itemKey,
          page: 1,
          size: 25,
        });
        setNewsletterCampaignFailures(payload.items ?? []);
        setNewsletterFailuresTotal(payload.total ?? 0);
      } catch (error) {
        if (isAdminSessionError(error)) {
          redirectToAdminLoginRef.current();
          return;
        }
        setSelectedNewsletterCampaign(null);
        const resolvedError = resolveAdminError(error);
        setNewsletterErrorMessage(
          resolvedError.kind === 'network'
            ? t('adminCommon.errors.network', { ns: 'admin-common' })
            : resolvedError.message || t('adminAccount.newsletter.errors.failures', { ns: 'admin-account' }),
        );
      } finally {
        setIsNewsletterFailuresLoading(false);
      }
    },
    [t],
  );

  const handleSendNewsletterTestEmail = React.useCallback(async () => {
    const campaign = pendingNewsletterTestCampaign;
    const resolvedEmail = newsletterTestEmail.trim().toLowerCase();
    if (!campaign || !resolvedEmail || isNewsletterTestSending) {
      return;
    }

    setIsNewsletterTestSending(true);
    setNewsletterErrorMessage('');
    setNewsletterSuccessMessage('');

    try {
      const payload = await sendAdminNewsletterTestEmail({
        email: resolvedEmail,
        locale: campaign.locale,
        itemKey: campaign.itemKey,
      });
      setPendingNewsletterTestCampaign(null);
      setNewsletterTestEmail(adminUser?.email ?? resolvedEmail);
      setNewsletterSuccessMessage(
        payload.message ||
          t('adminAccount.newsletter.testSend.success', {
            ns: 'admin-account',
            email: payload.email,
          }),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        redirectToAdminLoginRef.current();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setNewsletterErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.newsletter.errors.testSend', { ns: 'admin-account' }),
      );
    } finally {
      setIsNewsletterTestSending(false);
    }
  }, [adminUser?.email, isNewsletterTestSending, newsletterTestEmail, pendingNewsletterTestCampaign, t]);

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
          redirectToAdminLoginRef.current();
          return;
        }

        setActiveSessions(previous => previous.filter(candidate => candidate.id !== sessionItem.id));
        setSessionSuccessMessage(t('adminAccount.sessions.success.revokeSingle', { ns: 'admin-account' }));
      } catch (error) {
        if (isAdminSessionError(error)) {
          redirectToAdminLoginRef.current();
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
    [isRevokingAllSessions, revokingSessionID, t],
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

      redirectToAdminLoginRef.current();
    } catch (error) {
      if (isAdminSessionError(error)) {
        redirectToAdminLoginRef.current();
        return;
      }
      const resolvedError = resolveAdminError(error);
      setSessionErrorMessage(
        resolvedError.message || t('adminAccount.sessions.errors.revokeAll', { ns: 'admin-account' }),
      );
    } finally {
      setIsRevokingAllSessions(false);
    }
  }, [isRevokingAllSessions, revokingSessionID, t]);

  const handleSecuritySubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
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
          redirectToAdminLoginRef.current();
        }, 900);
      } catch (error) {
        if (isAdminSessionError(error)) {
          redirectToAdminLoginRef.current();
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
      newPassword,
      securityConfirmPasswordError,
      securityCurrentPasswordError,
      securityNewPasswordError,
      t,
    ],
  );

  const handleEmailSubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isEmailSubmitting) {
        return;
      }

      setEmailSubmitted(true);
      setEmailErrorMessage('');
      setEmailErrorField(null);
      setEmailSuccessMessage('');
      if (emailValidationError || emailCurrentPasswordError) {
        return;
      }

      setIsEmailSubmitting(true);
      try {
        const payload = await requestAdminEmailChange({
          newEmail: resolvedEmailInput,
          currentPassword: emailCurrentPassword,
          locale,
        });
        if (!payload.success) {
          throw new Error(t('adminAccount.account.errors.emailUpdate', { ns: 'admin-account' }));
        }

        patchAdminUser(previous =>
          previous
            ? {
                ...previous,
                pendingEmail: payload.pendingEmail,
                pendingEmailExpiresAt: payload.expiresAt,
              }
            : previous,
        );
        setEmailInput('');
        setEmailCurrentPassword('');
        setEmailTouchedFields({
          newEmail: false,
          currentPassword: false,
        });
        setEmailSubmitted(false);
        setEmailErrorField(null);
        setEmailSuccessMessage(
          t('adminAccount.account.success.emailChangeRequested', {
            ns: 'admin-account',
            email: payload.pendingEmail,
          }),
        );
      } catch (error) {
        if (isAdminSessionError(error)) {
          redirectToAdminLoginRef.current();
          return;
        }
        const resolvedError = resolveAdminError(error);
        const resolvedErrorField = resolveAdminEmailErrorField(resolvedError.code);
        setEmailErrorField(resolvedErrorField);
        setEmailErrorMessage(
          resolvedError.message || t('adminAccount.account.errors.emailUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setIsEmailSubmitting(false);
      }
    },
    [
      emailCurrentPassword,
      emailCurrentPasswordError,
      emailValidationError,
      isEmailSubmitting,
      locale,
      patchAdminUser,
      resolvedEmailInput,
      t,
    ],
  );

  const handleGoogleConnect = React.useCallback(async () => {
    if (isGoogleConnectSubmitting || isGoogleDisconnectSubmitting) {
      return;
    }

    setGoogleActionErrorMessage('');
    clearGoogleConnectMessage();
    clearSecuritySuccessMessage();

    setIsGoogleConnectSubmitting(true);
    try {
      const payload = await startAdminGoogleConnect({
        locale,
      });
      globalThis.location.assign(withBasePath(payload.url));
    } catch (error) {
      if (isAdminSessionError(error)) {
        redirectToAdminLoginRef.current();
        return;
      }

      const resolvedError = resolveAdminError(error);
      setGoogleActionErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message ||
              t('adminAccount.connectedAccounts.google.messages.failed', { ns: 'admin-account' }),
      );
    } finally {
      setIsGoogleConnectSubmitting(false);
    }
  }, [
    clearGoogleConnectMessage,
    clearSecuritySuccessMessage,
    isGoogleConnectSubmitting,
    isGoogleDisconnectSubmitting,
    locale,
    t,
  ]);

  const handleGoogleDisconnect = React.useCallback(async () => {
    if (isGoogleConnectSubmitting || isGoogleDisconnectSubmitting) {
      return;
    }

    setGoogleActionErrorMessage('');
    clearGoogleConnectMessage();
    clearSecuritySuccessMessage();

    setIsGoogleDisconnectSubmitting(true);
    try {
      const payload = await disconnectAdminGoogle();
      if (!payload.success) {
        throw new Error(t('adminAccount.connectedAccounts.google.messages.failed', { ns: 'admin-account' }));
      }

      syncAdminUser(payload.user);
      setIsGoogleDisconnectModalOpen(false);
      setGoogleConnectMessage(
        t('adminAccount.connectedAccounts.google.messages.disconnected', { ns: 'admin-account' }),
      );
      setGoogleConnectMessageVariant('success');

      try {
        const nextStatus = await fetchAdminGoogleAuthStatus();
        setGoogleAuthStatus(nextStatus);
      } catch {
        setGoogleAuthStatus({
          enabled: false,
          loginAvailable: false,
        });
      }
    } catch (error) {
      if (isAdminSessionError(error)) {
        redirectToAdminLoginRef.current();
        return;
      }

      const resolvedError = resolveAdminError(error);
      setGoogleActionErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message ||
              t('adminAccount.connectedAccounts.google.messages.failed', { ns: 'admin-account' }),
      );
    } finally {
      setIsGoogleDisconnectSubmitting(false);
    }
  }, [
    clearGoogleConnectMessage,
    clearSecuritySuccessMessage,
    isGoogleConnectSubmitting,
    isGoogleDisconnectSubmitting,
    syncAdminUser,
    t,
  ]);

  const handleGithubConnect = React.useCallback(async () => {
    if (isGithubConnectSubmitting || isGithubDisconnectSubmitting) {
      return;
    }

    setGithubActionErrorMessage('');
    clearGithubConnectMessage();
    clearSecuritySuccessMessage();

    setIsGithubConnectSubmitting(true);
    try {
      const payload = await startAdminGithubConnect({
        locale,
      });
      globalThis.location.assign(withBasePath(payload.url));
    } catch (error) {
      if (isAdminSessionError(error)) {
        redirectToAdminLoginRef.current();
        return;
      }

      const resolvedError = resolveAdminError(error);
      setGithubActionErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message ||
              t('adminAccount.connectedAccounts.github.messages.failed', { ns: 'admin-account' }),
      );
    } finally {
      setIsGithubConnectSubmitting(false);
    }
  }, [
    clearGithubConnectMessage,
    clearSecuritySuccessMessage,
    isGithubConnectSubmitting,
    isGithubDisconnectSubmitting,
    locale,
    t,
  ]);

  const handleGithubDisconnect = React.useCallback(async () => {
    if (isGithubConnectSubmitting || isGithubDisconnectSubmitting) {
      return;
    }

    setGithubActionErrorMessage('');
    clearGithubConnectMessage();
    clearSecuritySuccessMessage();

    setIsGithubDisconnectSubmitting(true);
    try {
      const payload = await disconnectAdminGithub();
      if (!payload.success) {
        throw new Error(t('adminAccount.connectedAccounts.github.messages.failed', { ns: 'admin-account' }));
      }

      syncAdminUser(payload.user);
      setIsGithubDisconnectModalOpen(false);
      setGithubConnectMessage(
        t('adminAccount.connectedAccounts.github.messages.disconnected', { ns: 'admin-account' }),
      );
      setGithubConnectMessageVariant('success');

      try {
        const nextStatus = await fetchAdminGithubAuthStatus();
        setGithubAuthStatus(nextStatus);
      } catch {
        setGithubAuthStatus({
          enabled: false,
          loginAvailable: false,
        });
      }
    } catch (error) {
      if (isAdminSessionError(error)) {
        redirectToAdminLoginRef.current();
        return;
      }

      const resolvedError = resolveAdminError(error);
      setGithubActionErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message ||
              t('adminAccount.connectedAccounts.github.messages.failed', { ns: 'admin-account' }),
      );
    } finally {
      setIsGithubDisconnectSubmitting(false);
    }
  }, [
    clearGithubConnectMessage,
    clearSecuritySuccessMessage,
    isGithubConnectSubmitting,
    isGithubDisconnectSubmitting,
    syncAdminUser,
    t,
  ]);

  const handleUsernameSubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
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

        syncAdminUser(updatedUser);
        setUsernameInput(nextUsername);
        setUsernameSubmitted(false);
        setUsernameSuccessMessage(t('adminAccount.account.success.usernameUpdated', { ns: 'admin-account' }));
        globalThis.dispatchEvent(new CustomEvent('admin:user-updated', { detail: { user: updatedUser } }));
      } catch (error) {
        if (isAdminSessionError(error)) {
          redirectToAdminLoginRef.current();
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
    [adminUser, isUsernameSubmitting, resolvedUsernameInput, syncAdminUser, t, usernameValidationError],
  );

  const handleNameSubmit = React.useCallback(
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
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
        patchAdminUser(previous =>
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
          redirectToAdminLoginRef.current();
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
    [isNameSubmitting, nameValidationError, patchAdminUser, resolvedNameInput, t],
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

        syncAdminUser(nextUser);
        setAvatarSuccessMessage(t('adminAccount.profile.avatar.success.updated', { ns: 'admin-account' }));
        globalThis.dispatchEvent(new CustomEvent('admin:user-updated', { detail: { user: nextUser } }));
        return true;
      } catch (error) {
        if (isAdminSessionError(error)) {
          redirectToAdminLoginRef.current();
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
    [adminUser, isAvatarSubmitting, syncAdminUser, t],
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
    async (event: React.SyntheticEvent<HTMLFormElement>) => {
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
          redirectToAdminLoginRef.current();
        }, 900);
      } catch (error) {
        if (isAdminSessionError(error)) {
          redirectToAdminLoginRef.current();
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
    [deleteConfirmError, deleteCurrentPassword, deletePasswordError, isDeleteSubmitting, t],
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

  const handleNewsletterTabSelect = React.useCallback(
    (key: string | null) => {
      if (key === 'subscribers') {
        router.push(`/${locale}${ADMIN_ROUTES.settings.newsletterSubscribers}`);
        return;
      }

      router.push(`/${locale}${ADMIN_ROUTES.settings.newsletter}`);
    },
    [locale, router],
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
              <FontAwesomeIcon icon="user" />
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
              <FontAwesomeIcon icon="gear" />
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
              <FontAwesomeIcon icon="palette" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.appearance', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.email}
            className={`admin-settings-nav-link${isEmailSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="envelope" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.email', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.sessions}
            className={`admin-settings-nav-link${isSessionsSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="desktop" />
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
              <FontAwesomeIcon icon="envelope" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.newsletter', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.comments}
            className={`admin-settings-nav-link${isCommentsSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="comments" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.comments', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.errors}
            className={`admin-settings-nav-link${isErrorsSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="exclamation-triangle" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.errors', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.content}
            className={`admin-settings-nav-link${isContentSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="layer-group" />
            </span>
            <span className="admin-settings-nav-label">
              {t('adminAccount.settings.content', { ns: 'admin-account' })}
            </span>
          </Link>
          <Link
            href={ADMIN_ROUTES.settings.security}
            className={`admin-settings-nav-link${isSecuritySection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="lock" />
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
                <AdminAccountProfileSection
                  adminUser={adminUser}
                  t={t}
                  profileAvatarURL={profileAvatarURL}
                  profileName={profileName}
                  profileUsername={profileUsername}
                  profileRoles={profileRoles}
                  nameErrorMessage={nameErrorMessage}
                  avatarErrorMessage={avatarErrorMessage}
                  nameSuccessMessage={nameSuccessMessage}
                  avatarSuccessMessage={avatarSuccessMessage}
                  maxAvatarFileSizeMb={MAX_AVATAR_FILE_SIZE_MB}
                  isAvatarSubmitting={isAvatarSubmitting}
                  avatarPendingAction={avatarPendingAction}
                  avatarFileInputRef={avatarFileInputRef}
                  onOpenAvatarPicker={() => avatarFileInputRef.current?.click()}
                  onRemoveAvatar={() => {
                    void handleAvatarUpdate(null, 'remove');
                  }}
                  onAvatarFileChange={handleAvatarFileChange}
                  handleNameSubmit={handleNameSubmit}
                  nameInput={nameInput}
                  onNameInputChange={setNameInput}
                  clearNameFeedback={() => {
                    if (nameErrorMessage) {
                      setNameErrorMessage('');
                    }
                    if (nameSuccessMessage) {
                      setNameSuccessMessage('');
                    }
                  }}
                  showNameValidationError={showNameValidationError}
                  nameValidationError={nameValidationError}
                  minNameLength={MIN_NAME_LENGTH}
                  maxNameLength={MAX_NAME_LENGTH}
                  isNameSubmitting={isNameSubmitting}
                />
              ) : null}

              {isEmailSection ? (
                <AdminAccountEmailSection
                  adminUser={adminUser}
                  t={t}
                  formatSessionDate={formatSessionDate}
                  pendingEmail={pendingEmail}
                  emailErrorMessage={emailErrorMessage}
                  emailSuccessMessage={emailSuccessMessage}
                  handleEmailSubmit={handleEmailSubmit}
                  emailInput={emailInput}
                  onEmailInputChange={value => {
                    setEmailInput(value);
                    setEmailTouchedFields(previous => ({
                      ...previous,
                      newEmail: true,
                    }));
                    if (emailErrorMessage && (emailErrorField === 'newEmail' || emailErrorField === 'generic')) {
                      setEmailErrorMessage('');
                      setEmailErrorField(null);
                    }
                    if (emailSuccessMessage) {
                      setEmailSuccessMessage('');
                    }
                  }}
                  onEmailInputBlur={() => {
                    setEmailTouchedFields(previous => ({
                      ...previous,
                      newEmail: true,
                    }));
                  }}
                  showEmailValidationError={showEmailValidationError}
                  emailValidationError={emailValidationError}
                  emailCurrentPassword={emailCurrentPassword}
                  onEmailCurrentPasswordChange={value => {
                    setEmailCurrentPassword(value);
                    setEmailTouchedFields(previous => ({
                      ...previous,
                      currentPassword: true,
                    }));
                    if (emailErrorMessage && (emailErrorField === 'currentPassword' || emailErrorField === 'generic')) {
                      setEmailErrorMessage('');
                      setEmailErrorField(null);
                    }
                  }}
                  onEmailCurrentPasswordBlur={() => {
                    setEmailTouchedFields(previous => ({
                      ...previous,
                      currentPassword: true,
                    }));
                  }}
                  showEmailCurrentPasswordError={showEmailCurrentPasswordError}
                  emailCurrentPasswordError={emailCurrentPasswordError}
                  isEmailSubmitting={isEmailSubmitting}
                />
              ) : null}

              {isAccountSection ? (
                <AdminAccountAccountSection
                  t={t}
                  usernameErrorMessage={usernameErrorMessage}
                  usernameSuccessMessage={usernameSuccessMessage}
                  handleUsernameSubmit={handleUsernameSubmit}
                  usernameInput={usernameInput}
                  onUsernameInputChange={setUsernameInput}
                  clearUsernameFeedback={() => {
                    if (usernameErrorMessage) {
                      setUsernameErrorMessage('');
                    }
                    if (usernameSuccessMessage) {
                      setUsernameSuccessMessage('');
                    }
                  }}
                  showUsernameValidationError={showUsernameValidationError}
                  usernameValidationError={usernameValidationError}
                  minUsernameLength={MIN_USERNAME_LENGTH}
                  maxUsernameLength={MAX_USERNAME_LENGTH}
                  isUsernameSubmitting={isUsernameSubmitting}
                  deleteErrorMessage={deleteErrorMessage}
                  deleteSuccessMessage={deleteSuccessMessage}
                  handleDeleteSubmit={handleDeleteSubmit}
                  deleteCurrentPassword={deleteCurrentPassword}
                  onDeleteCurrentPasswordChange={setDeleteCurrentPassword}
                  deleteConfirmation={deleteConfirmation}
                  onDeleteConfirmationChange={setDeleteConfirmation}
                  clearDeleteFeedback={() => {
                    if (deleteErrorMessage) {
                      setDeleteErrorMessage('');
                    }
                    if (deleteSuccessMessage) {
                      setDeleteSuccessMessage('');
                    }
                  }}
                  showDeletePassword={showDeletePassword}
                  onToggleDeletePassword={() => setShowDeletePassword(previous => !previous)}
                  showDeletePasswordError={showDeletePasswordError}
                  deletePasswordError={deletePasswordError}
                  showDeleteConfirmError={showDeleteConfirmError}
                  deleteConfirmError={deleteConfirmError}
                  deleteConfirmationValue={DELETE_CONFIRMATION_VALUE}
                  isDeleteSubmitting={isDeleteSubmitting}
                />
              ) : null}

              {isAppearanceSection ? (
                <AdminAccountAppearanceSection
                  t={t}
                  activeAppearance={activeAppearance}
                  appearanceOptions={[
                    {
                      key: 'system',
                      label: t('adminAccount.account.appearance.options.system', { ns: 'admin-account' }),
                      value: 'system',
                    },
                    ...THEMES.map(option => ({
                      key: option.key,
                      label: t(`adminAccount.account.appearance.options.${option.key}`, { ns: 'admin-account' }),
                      value: option.key,
                    })),
                  ]}
                  onAppearanceChange={handleAppearanceChange}
                  resolveAppearanceCardClass={resolveAppearanceCardClass}
                  resolveAppearanceMetaIcon={resolveAppearanceMetaIcon}
                />
              ) : null}

              {isSessionsSection ? (
                <AdminAccountSessionsSection
                  t={t}
                  formatSessionDate={formatSessionDate}
                  sessionErrorMessage={sessionErrorMessage}
                  sessionSuccessMessage={sessionSuccessMessage}
                  isSessionsLoading={isSessionsLoading}
                  activeSessions={activeSessions}
                  isRevokingAllSessions={isRevokingAllSessions}
                  revokingSessionID={revokingSessionID}
                  onRevokeAllSessions={handleRevokeAllSessions}
                  onRevokeSession={handleRevokeSession}
                  resolveSessionDeviceIcon={resolveSessionDeviceIcon}
                />
              ) : null}

              {isNewsletterSection ? (
                <AdminAccountNewsletterSection
                  t={t}
                  formatSessionDate={formatSessionDate}
                  newsletterErrorMessage={newsletterErrorMessage}
                  newsletterSuccessMessage={newsletterSuccessMessage}
                  newsletterTab={newsletterTab}
                  onNewsletterTabSelect={handleNewsletterTabSelect}
                  isNewsletterDispatchRunning={isNewsletterDispatchRunning}
                  onTriggerNewsletterDispatch={handleTriggerNewsletterDispatch}
                  newsletterDispatchTimestamp={newsletterDispatchTimestamp}
                  newsletterDispatchResults={newsletterDispatchResults}
                  isNewsletterSummaryLoading={isNewsletterSummaryLoading}
                  newsletterSubscriberSummary={newsletterSubscriberSummary}
                  isNewsletterCampaignsLoading={isNewsletterCampaignsLoading}
                  newsletterCampaigns={newsletterCampaigns}
                  newsletterCampaignThumbnails={newsletterCampaignThumbnails}
                  renderAsyncSectionContent={renderAsyncSectionContent}
                  onOpenNewsletterTest={item => {
                    setNewsletterTestEmail(adminUser.email);
                    setPendingNewsletterTestCampaign(item);
                  }}
                  onViewNewsletterFailures={handleViewNewsletterFailures}
                  newsletterFilterLocale={newsletterFilterLocale}
                  onNewsletterFilterLocaleChange={value => {
                    setNewsletterFilterLocale(value);
                    setNewsletterPage(1);
                  }}
                  newsletterFilterStatus={newsletterFilterStatus}
                  onNewsletterFilterStatusChange={value => {
                    setNewsletterFilterStatus(value);
                    setNewsletterPage(1);
                  }}
                  newsletterFilterQuery={newsletterFilterQuery}
                  onNewsletterFilterQueryChange={value => {
                    setNewsletterFilterQuery(value);
                    setNewsletterPage(1);
                  }}
                  newsletterListTopRef={newsletterListTopRef}
                  isNewsletterLoading={isNewsletterLoading}
                  totalNewsletterSubscribers={totalNewsletterSubscribers}
                  newsletterSubscribers={newsletterSubscribers}
                  updatingNewsletterEmail={updatingNewsletterEmail}
                  deletingNewsletterEmail={deletingNewsletterEmail}
                  onNewsletterStatusUpdate={handleNewsletterStatusUpdate}
                  onOpenNewsletterDelete={item => {
                    setPendingNewsletterDelete(item);
                  }}
                  newsletterPage={newsletterPage}
                  totalNewsletterPages={totalNewsletterPages}
                  newsletterPageSize={newsletterPageSize}
                  onNewsletterPageChange={page => {
                    setNewsletterPage(page);
                    scrollToNewsletterListStart();
                  }}
                  onNewsletterPageSizeChange={size => {
                    setNewsletterPageSize(size);
                    setNewsletterPage(1);
                    scrollToNewsletterListStart();
                  }}
                  pendingNewsletterDelete={pendingNewsletterDelete}
                  onCloseNewsletterDelete={() => {
                    if (deletingNewsletterEmail) {
                      return;
                    }
                    setPendingNewsletterDelete(null);
                  }}
                  onDeleteNewsletterSubscriber={handleDeleteNewsletterSubscriber}
                  selectedNewsletterCampaign={selectedNewsletterCampaign}
                  onCloseNewsletterFailures={() => {
                    if (isNewsletterFailuresLoading) {
                      return;
                    }
                    setSelectedNewsletterCampaign(null);
                  }}
                  isNewsletterFailuresLoading={isNewsletterFailuresLoading}
                  newsletterCampaignFailures={newsletterCampaignFailures}
                  newsletterFailuresTotal={newsletterFailuresTotal}
                  pendingNewsletterTestCampaign={pendingNewsletterTestCampaign}
                  onCloseNewsletterTest={() => {
                    if (isNewsletterTestSending) {
                      return;
                    }
                    setPendingNewsletterTestCampaign(null);
                  }}
                  isNewsletterTestSending={isNewsletterTestSending}
                  newsletterTestEmail={newsletterTestEmail}
                  onNewsletterTestEmailChange={setNewsletterTestEmail}
                  onSendNewsletterTestEmail={handleSendNewsletterTestEmail}
                />
              ) : null}

              {isCommentsSection ? (
                <AdminAccountCommentsSection
                  t={t}
                  locale={locale}
                  formatSessionDate={formatSessionDate}
                  commentsErrorMessage={commentsSection.commentsErrorMessage}
                  commentsSuccessMessage={commentsSection.commentsSuccessMessage}
                  commentsListTopRef={commentsSection.commentsListTopRef}
                  commentFilterStatus={commentsSection.commentFilterStatus}
                  onCommentFilterStatusChange={commentsSection.onCommentFilterStatusChange}
                  commentFilterQuery={commentsSection.commentFilterQuery}
                  onCommentFilterQueryChange={commentsSection.onCommentFilterQueryChange}
                  onClearCommentFilterQuery={commentsSection.onClearCommentFilterQuery}
                  comments={commentsSection.comments}
                  isCommentsLoading={commentsSection.isCommentsLoading}
                  totalComments={commentsSection.totalComments}
                  renderAsyncSectionContent={renderAsyncSectionContent}
                  allVisibleCommentsSelected={commentsSection.allVisibleCommentsSelected}
                  hasSelectedComments={commentsSection.hasSelectedComments}
                  selectedCommentCount={commentsSection.selectedCommentCount}
                  isBulkCommentActionPending={commentsSection.isBulkCommentActionPending}
                  bulkCommentActionStatus={commentsSection.bulkCommentActionStatus}
                  isBulkCommentDeleting={commentsSection.isBulkCommentDeleting}
                  onToggleVisibleCommentsSelection={commentsSection.onToggleVisibleCommentsSelection}
                  onClearSelectedComments={commentsSection.onClearSelectedComments}
                  onBulkCommentStatusUpdate={commentsSection.onBulkCommentStatusUpdate}
                  onOpenBulkCommentDelete={commentsSection.onOpenBulkCommentDelete}
                  selectedCommentIDs={commentsSection.selectedCommentIDs}
                  onToggleCommentSelection={commentsSection.onToggleCommentSelection}
                  resolveCommentStatusVariant={commentsSection.resolveCommentStatusVariant}
                  commentActionID={commentsSection.commentActionID}
                  commentActionStatus={commentsSection.commentActionStatus}
                  deletingCommentID={commentsSection.deletingCommentID}
                  onCommentStatusUpdate={commentsSection.onCommentStatusUpdate}
                  onOpenCommentDelete={commentsSection.onOpenCommentDelete}
                  commentsPage={commentsSection.commentsPage}
                  totalCommentPages={commentsSection.totalCommentPages}
                  commentsPageSize={commentsSection.commentsPageSize}
                  onCommentsPageChange={commentsSection.onCommentsPageChange}
                  onCommentsPageSizeChange={commentsSection.onCommentsPageSizeChange}
                  pendingBulkCommentDeleteCount={commentsSection.pendingBulkCommentDeleteCount}
                  onCloseBulkCommentDelete={commentsSection.onCloseBulkCommentDelete}
                  onConfirmBulkCommentDelete={commentsSection.onConfirmBulkCommentDelete}
                  pendingCommentDelete={commentsSection.pendingCommentDelete}
                  onCloseCommentDelete={commentsSection.onCloseCommentDelete}
                  onConfirmCommentDelete={commentsSection.onConfirmCommentDelete}
                />
              ) : null}

              {isErrorsSection ? (
                <AdminAccountErrorsSection
                  t={t}
                  formatSessionDate={formatSessionDate}
                  errorMessagesErrorMessage={errorsSection.errorMessagesErrorMessage}
                  errorMessagesSuccessMessage={errorsSection.errorMessagesSuccessMessage}
                  isErrorMessagesLoading={errorsSection.isErrorMessagesLoading}
                  isErrorCreateSubmitting={errorsSection.isErrorCreateSubmitting}
                  isErrorUpdateSubmitting={errorsSection.isErrorUpdateSubmitting}
                  isErrorDeleteSubmitting={errorsSection.isErrorDeleteSubmitting}
                  onOpenCreateErrorMessage={errorsSection.onOpenCreateErrorMessage}
                  errorMessagesListTopRef={errorsSection.errorMessagesListTopRef}
                  errorFilterLocale={errorsSection.errorFilterLocale}
                  onErrorFilterLocaleChange={errorsSection.onErrorFilterLocaleChange}
                  errorFilterQuery={errorsSection.errorFilterQuery}
                  onErrorFilterQueryChange={errorsSection.onErrorFilterQueryChange}
                  onClearErrorFilterQuery={errorsSection.onClearErrorFilterQuery}
                  totalErrorMessages={errorsSection.totalErrorMessages}
                  errorMessages={errorsSection.errorMessages}
                  deletingErrorMessageKey={errorsSection.deletingErrorMessageKey}
                  getErrorMessageKey={errorsSection.getErrorMessageKey}
                  onSelectErrorMessage={errorsSection.onSelectErrorMessage}
                  onOpenUpdateErrorMessage={errorsSection.onOpenUpdateErrorMessage}
                  onOpenDeleteErrorMessage={errorsSection.onOpenDeleteErrorMessage}
                  errorMessagesPage={errorsSection.errorMessagesPage}
                  totalErrorMessagePages={errorsSection.totalErrorMessagePages}
                  errorMessagesPageSize={errorsSection.errorMessagesPageSize}
                  onErrorMessagesPageChange={errorsSection.onErrorMessagesPageChange}
                  onErrorMessagesPageSizeChange={errorsSection.onErrorMessagesPageSizeChange}
                  isErrorEditorModalOpen={errorsSection.isErrorEditorModalOpen}
                  onCloseErrorEditor={errorsSection.onCloseErrorEditor}
                  errorCrudTab={errorsSection.errorCrudTab}
                  selectedErrorMessage={errorsSection.selectedErrorMessage}
                  errorCreateLocale={errorsSection.errorCreateLocale}
                  onErrorCreateLocaleChange={errorsSection.onErrorCreateLocaleChange}
                  errorCreateCode={errorsSection.errorCreateCode}
                  onErrorCreateCodeChange={errorsSection.onErrorCreateCodeChange}
                  normalizedErrorCreateCode={errorsSection.normalizedErrorCreateCode}
                  isErrorCreateCodeValid={errorsSection.isErrorCreateCodeValid}
                  errorCreateMessage={errorsSection.errorCreateMessage}
                  onErrorCreateMessageChange={errorsSection.onErrorCreateMessageChange}
                  errorUpdateMessage={errorsSection.errorUpdateMessage}
                  onErrorUpdateMessageChange={errorsSection.onErrorUpdateMessageChange}
                  canCreateErrorMessage={errorsSection.canCreateErrorMessage}
                  canUpdateErrorMessage={errorsSection.canUpdateErrorMessage}
                  onCreateErrorMessageSubmit={errorsSection.onCreateErrorMessageSubmit}
                  onUpdateErrorMessageSubmit={errorsSection.onUpdateErrorMessageSubmit}
                  pendingErrorMessageDelete={errorsSection.pendingErrorMessageDelete}
                  onCloseDeleteErrorMessage={errorsSection.onCloseDeleteErrorMessage}
                  onDeleteErrorMessageSubmit={errorsSection.onDeleteErrorMessageSubmit}
                />
              ) : null}

              {isContentSection ? (
                <AdminContentManagementPanel
                  formatDate={formatSessionDate}
                  onSessionExpired={() => {
                    redirectToAdminLoginRef.current();
                  }}
                />
              ) : null}

              {isSecuritySection ? (
                <AdminAccountSecuritySection
                  adminUser={adminUser}
                  t={t}
                  formatSessionDate={formatSessionDate}
                  securityErrorMessage={securityErrorMessage}
                  securitySuccessMessage={securitySuccessMessage}
                  googleConnectMessage={googleConnectMessage}
                  googleConnectMessageVariant={googleConnectMessageVariant}
                  githubConnectMessage={githubConnectMessage}
                  githubConnectMessageVariant={githubConnectMessageVariant}
                  googleActionErrorMessage={googleActionErrorMessage}
                  githubActionErrorMessage={githubActionErrorMessage}
                  isSecurityPasswordExpanded={isSecurityPasswordExpanded}
                  onToggleSecurityPassword={() => setIsSecurityPasswordExpanded(previous => !previous)}
                  onManageEmail={() => router.push(`/${locale}${ADMIN_ROUTES.settings.email}`)}
                  handleSecuritySubmit={handleSecuritySubmit}
                  currentPassword={currentPassword}
                  newPassword={newPassword}
                  confirmPassword={confirmPassword}
                  handleCurrentPasswordChange={handleCurrentPasswordChange}
                  handleNewPasswordChange={handleNewPasswordChange}
                  handleConfirmPasswordChange={handleConfirmPasswordChange}
                  showCurrentPassword={showCurrentPassword}
                  showNewPassword={showNewPassword}
                  showConfirmPassword={showConfirmPassword}
                  onToggleCurrentPassword={() => setShowCurrentPassword(previous => !previous)}
                  onToggleNewPassword={() => setShowNewPassword(previous => !previous)}
                  onToggleConfirmPassword={() => setShowConfirmPassword(previous => !previous)}
                  showCurrentPasswordError={showCurrentPasswordError}
                  showNewPasswordError={showNewPasswordError}
                  showConfirmPasswordError={showConfirmPasswordError}
                  securityCurrentPasswordError={securityCurrentPasswordError}
                  securityNewPasswordError={securityNewPasswordError}
                  securityConfirmPasswordError={securityConfirmPasswordError}
                  passwordStrength={passwordStrength}
                  isSecuritySubmitting={isSecuritySubmitting}
                  googleAuthStatus={googleAuthStatus}
                  githubAuthStatus={githubAuthStatus}
                  isGoogleAuthStatusLoading={isGoogleAuthStatusLoading}
                  isGithubAuthStatusLoading={isGithubAuthStatusLoading}
                  isGoogleConnectSubmitting={isGoogleConnectSubmitting}
                  isGoogleDisconnectSubmitting={isGoogleDisconnectSubmitting}
                  isGithubConnectSubmitting={isGithubConnectSubmitting}
                  isGithubDisconnectSubmitting={isGithubDisconnectSubmitting}
                  onGoogleConnect={handleGoogleConnect}
                  onOpenGoogleDisconnectModal={openGoogleDisconnectModal}
                  onCloseGoogleDisconnectModal={closeGoogleDisconnectModal}
                  onGoogleDisconnect={handleGoogleDisconnect}
                  onGithubConnect={handleGithubConnect}
                  onOpenGithubDisconnectModal={openGithubDisconnectModal}
                  onCloseGithubDisconnectModal={closeGithubDisconnectModal}
                  onGithubDisconnect={handleGithubDisconnect}
                  isGoogleDisconnectModalOpen={isGoogleDisconnectModalOpen}
                  isGithubDisconnectModalOpen={isGithubDisconnectModalOpen}
                />
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
