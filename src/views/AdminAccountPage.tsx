'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import ListGroup from 'react-bootstrap/ListGroup';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PaginationBar from '@/components/pagination/PaginationBar';
import FlagIcon from '@/components/common/FlagIcon';
import AdminContentManagementPanel from '@/components/admin/AdminContentManagementPanel';
import {
  changeAdminAvatar,
  changeAdminName,
  changeAdminPassword,
  changeAdminUsername,
  deleteAdminComment,
  createAdminErrorMessage,
  deleteAdminErrorMessage,
  deleteAdminNewsletterSubscriber,
  deleteAdminAccount,
  fetchAdminActiveSessions,
  fetchAdminComments,
  fetchAdminErrorMessages,
  fetchAdminGoogleAuthStatus,
  fetchAdminMe,
  fetchAdminNewsletterCampaignFailures,
  fetchAdminNewsletterCampaigns,
  fetchAdminNewsletterSubscribers,
  isAdminSessionError,
  startAdminGoogleConnect,
  requestAdminEmailChange,
  resolveAdminError,
  revokeAdminSession,
  revokeAllAdminSessions,
  sendAdminNewsletterTestEmail,
  disconnectAdminGoogle,
  triggerAdminNewsletterDispatch,
  updateAdminCommentStatus,
  updateAdminNewsletterSubscriberStatus,
  updateAdminErrorMessage,
  type AdminCommentItem,
  type AdminErrorMessageItem,
  type AdminNewsletterCampaignItem,
  type AdminNewsletterDeliveryFailureItem,
  type AdminNewsletterDispatchLocaleResult,
  type AdminNewsletterSubscriberItem,
} from '@/lib/adminApi';
import { withAdminAvatarSize } from '@/lib/adminAvatar';
import { ADMIN_ROUTES, buildAdminContentPostDetailRoute } from '@/lib/adminRoutes';
import { defaultLocale } from '@/i18n/settings';
import { withBasePath } from '@/lib/basePath';
import AdminLoadingState from '@/components/admin/AdminLoadingState';
import Link from '@/components/common/Link';
import { useAppDispatch, useAppSelector } from '@/config/store';
import { resetToSystemTheme, setTheme, type Theme } from '@/reducers/theme';
import { LOCALES, THEMES } from '@/config/constants';

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

type AdminIdentity = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  email: string;
  pendingEmail: string | null;
  pendingEmailExpiresAt: string | null;
  googleLinked: boolean;
  googleEmail: string | null;
  googleLinkedAt: string | null;
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
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
  const [isGoogleAuthStatusLoading, setIsGoogleAuthStatusLoading] = React.useState(isSecuritySection);
  const [googleActionErrorMessage, setGoogleActionErrorMessage] = React.useState('');
  const [isGoogleConnectSubmitting, setIsGoogleConnectSubmitting] = React.useState(false);
  const [isGoogleDisconnectSubmitting, setIsGoogleDisconnectSubmitting] = React.useState(false);
  const [isSecurityPasswordExpanded, setIsSecurityPasswordExpanded] = React.useState(false);
  const [isGoogleDisconnectModalOpen, setIsGoogleDisconnectModalOpen] = React.useState(false);
  const [googleConnectMessage, setGoogleConnectMessage] = React.useState('');
  const [googleConnectMessageVariant, setGoogleConnectMessageVariant] = React.useState<'success' | 'danger' | 'info'>(
    'info',
  );
  const [newsletterSubscribers, setNewsletterSubscribers] = React.useState<AdminNewsletterSubscriberItem[]>([]);
  const [isNewsletterLoading, setIsNewsletterLoading] = React.useState(isNewsletterSubscribersSection);
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
  const [comments, setComments] = React.useState<AdminCommentItem[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = React.useState(isCommentsSection);
  const [commentsErrorMessage, setCommentsErrorMessage] = React.useState('');
  const [commentsSuccessMessage, setCommentsSuccessMessage] = React.useState('');
  const [commentFilterLocale, setCommentFilterLocale] = React.useState<'all' | 'en' | 'tr'>('all');
  const [commentFilterStatus, setCommentFilterStatus] = React.useState<
    'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM'
  >('all');
  const [commentFilterQuery, setCommentFilterQuery] = React.useState('');
  const [commentFilterQueryDebounced, setCommentFilterQueryDebounced] = React.useState('');
  const [commentsPage, setCommentsPage] = React.useState(1);
  const [commentsPageSize, setCommentsPageSize] = React.useState(10);
  const [totalComments, setTotalComments] = React.useState(0);
  const [commentActionID, setCommentActionID] = React.useState('');
  const [commentActionStatus, setCommentActionStatus] = React.useState<AdminCommentItem['status'] | null>(null);
  const [deletingCommentID, setDeletingCommentID] = React.useState('');
  const [pendingCommentDelete, setPendingCommentDelete] = React.useState<AdminCommentItem | null>(null);
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
  const commentsListTopRef = React.useRef<HTMLDivElement | null>(null);
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
  const commentsRequestIDRef = React.useRef(0);
  const errorMessagesRequestIDRef = React.useRef(0);
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
    if (!isSecuritySection || !searchParams) {
      return;
    }

    const googleStatus = (searchParams.get('google') ?? '').trim().toLowerCase();
    if (googleStatus === '') {
      return;
    }

    let nextVariant: 'success' | 'danger' | 'info' = 'info';
    let nextMessage = '';
    switch (googleStatus) {
      case 'connected':
        nextVariant = 'success';
        nextMessage = t('adminAccount.connectedAccounts.google.messages.connected', { ns: 'admin-account' });
        break;
      case 'cancelled':
        nextMessage = t('adminAccount.connectedAccounts.google.messages.cancelled', { ns: 'admin-account' });
        break;
      case 'not-linked':
        nextVariant = 'danger';
        nextMessage = t('adminAccount.connectedAccounts.google.messages.notLinked', { ns: 'admin-account' });
        break;
      case 'conflict':
        nextVariant = 'danger';
        nextMessage = t('adminAccount.connectedAccounts.google.messages.conflict', { ns: 'admin-account' });
        break;
      default:
        nextVariant = 'danger';
        nextMessage = t('adminAccount.connectedAccounts.google.messages.failed', { ns: 'admin-account' });
        break;
    }

    setGoogleConnectMessage(nextMessage);
    setGoogleConnectMessageVariant(nextVariant);
    router.replace(pathname, { scroll: false });
  }, [isSecuritySection, pathname, router, searchParams, t]);

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
    if (!googleConnectMessage || googleConnectMessageVariant !== 'success') {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setGoogleConnectMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [googleConnectMessage, googleConnectMessageVariant]);

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
    const timeoutID = globalThis.setTimeout(() => {
      setCommentFilterQueryDebounced(commentFilterQuery.trim());
    }, 220);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [commentFilterQuery]);

  React.useEffect(() => {
    if (!commentsSuccessMessage) {
      return;
    }

    const timeoutID = globalThis.setTimeout(() => {
      setCommentsSuccessMessage('');
    }, SUCCESS_MESSAGE_AUTO_HIDE_MS);

    return () => {
      globalThis.clearTimeout(timeoutID);
    };
  }, [commentsSuccessMessage]);

  React.useEffect(() => {
    setCommentsPage(1);
  }, [commentFilterLocale, commentFilterQueryDebounced, commentFilterStatus]);

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
  const emailValidationError =
    resolvedEmailInput === ''
      ? t('adminAccount.validation.emailRequired', { ns: 'admin-account' })
      : !EMAIL_PATTERN.test(resolvedEmailInput)
        ? t('adminAccount.validation.emailInvalid', { ns: 'admin-account' })
        : profileEmail === resolvedEmailInput
          ? t('adminAccount.validation.emailDifferent', { ns: 'admin-account' })
          : '';
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
  const selectedErrorMessage = React.useMemo(
    () => errorMessages.find(item => toAdminErrorMessageKey(item) === selectedErrorMessageKey) ?? null,
    [errorMessages, selectedErrorMessageKey],
  );
  const totalCommentPages = Math.max(1, Math.ceil(totalComments / commentsPageSize));
  const totalNewsletterPages = Math.max(1, Math.ceil(totalNewsletterSubscribers / newsletterPageSize));
  const totalErrorMessagePages = Math.max(1, Math.ceil(totalErrorMessages / errorMessagesPageSize));
  const resolveCommentStatusVariant = React.useCallback((status: AdminCommentItem['status']) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'REJECTED':
        return 'secondary';
      case 'SPAM':
        return 'danger';
      default:
        return 'warning';
    }
  }, []);
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

  const clearGoogleConnectMessage = React.useCallback(() => {
    if (googleConnectMessage) {
      setGoogleConnectMessage('');
      setGoogleConnectMessageVariant('info');
    }
  }, [googleConnectMessage]);

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
      isNewsletterSubscribersSection,
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
        router.replace(`/${locale}/admin/login`);
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
  }, [adminUser, isNewsletterOverviewSection, locale, router, t]);

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
        router.replace(`/${locale}/admin/login`);
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
  }, [
    adminUser,
    isNewsletterOverviewSection,
    locale,
    newsletterFilterLocale,
    newsletterFilterQueryDebounced,
    router,
    t,
  ]);

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
        router.replace(`/${locale}/admin/login`);
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
  }, [isNewsletterDispatchRunning, loadAdminNewsletterCampaigns, loadAdminNewsletterSummary, locale, router, t]);

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
          router.replace(`/${locale}/admin/login`);
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
    [locale, router, t],
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
        router.replace(`/${locale}/admin/login`);
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
  }, [
    adminUser?.email,
    isNewsletterTestSending,
    locale,
    newsletterTestEmail,
    pendingNewsletterTestCampaign,
    router,
    t,
  ]);

  const loadAdminComments = React.useCallback(
    async (options?: { page?: number }): Promise<AdminCommentItem[]> => {
      if (!isCommentsSection || !adminUser) {
        return [];
      }

      const requestedPage = options?.page && options.page > 0 ? options.page : commentsPage;
      const requestID = commentsRequestIDRef.current + 1;
      commentsRequestIDRef.current = requestID;
      setIsCommentsLoading(true);
      setCommentsErrorMessage('');

      try {
        const payload = await fetchAdminComments({
          locale: commentFilterLocale === 'all' ? undefined : commentFilterLocale,
          status: commentFilterStatus === 'all' ? undefined : commentFilterStatus,
          query: commentFilterQueryDebounced,
          page: requestedPage,
          size: commentsPageSize,
        });

        if (requestID !== commentsRequestIDRef.current) {
          return [];
        }

        const items = payload.items ?? [];
        setComments(items);
        setTotalComments(payload.total ?? 0);

        const resolvedPage = payload.page > 0 ? payload.page : requestedPage;
        if (resolvedPage !== commentsPage) {
          setCommentsPage(resolvedPage);
        }

        if (payload.size > 0 && payload.size !== commentsPageSize) {
          setCommentsPageSize(payload.size);
        }

        return items;
      } catch (error) {
        if (requestID !== commentsRequestIDRef.current) {
          return [];
        }
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return [];
        }
        const resolvedError = resolveAdminError(error);
        setCommentsErrorMessage(
          resolvedError.kind === 'network'
            ? t('adminCommon.errors.network', { ns: 'admin-common' })
            : resolvedError.message || t('adminAccount.comments.errors.load', { ns: 'admin-account' }),
        );
        return [];
      } finally {
        if (requestID === commentsRequestIDRef.current) {
          setIsCommentsLoading(false);
        }
      }
    },
    [
      adminUser,
      commentFilterLocale,
      commentFilterQueryDebounced,
      commentFilterStatus,
      commentsPage,
      commentsPageSize,
      isCommentsSection,
      locale,
      router,
      t,
    ],
  );

  React.useEffect(() => {
    if (!isCommentsSection || !adminUser) {
      return;
    }

    void loadAdminComments();
  }, [adminUser, commentsPage, commentsPageSize, isCommentsSection, loadAdminComments]);

  const scrollToCommentsListStart = React.useCallback(() => {
    const target = commentsListTopRef.current;
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

  const handleCommentStatusUpdate = React.useCallback(
    async (commentId: string, status: AdminCommentItem['status']) => {
      if (deletingCommentID) {
        return;
      }

      setCommentActionID(commentId);
      setCommentActionStatus(status);
      setCommentsErrorMessage('');
      setCommentsSuccessMessage('');

      try {
        const updatedComment = await updateAdminCommentStatus({ commentId, status });
        const refreshedItems = await loadAdminComments();

        if (refreshedItems.length === 0 && commentsPage > 1) {
          setCommentsPage(previous => Math.max(1, previous - 1));
        }

        setCommentsSuccessMessage(
          t(`adminAccount.comments.success.${status.toLowerCase()}`, {
            ns: 'admin-account',
            author: updatedComment.authorName,
          }),
        );
      } catch (error) {
        if (isAdminSessionError(error)) {
          router.replace(`/${locale}/admin/login`);
          return;
        }
        const resolvedError = resolveAdminError(error);
        setCommentsErrorMessage(
          resolvedError.kind === 'network'
            ? t('adminCommon.errors.network', { ns: 'admin-common' })
            : resolvedError.message || t('adminAccount.comments.errors.statusUpdate', { ns: 'admin-account' }),
        );
      } finally {
        setCommentActionID('');
        setCommentActionStatus(null);
      }
    },
    [commentsPage, deletingCommentID, loadAdminComments, locale, router, t],
  );

  const handleDeleteCommentSubmit = React.useCallback(async () => {
    const item = pendingCommentDelete;
    if (!item || deletingCommentID || commentActionID) {
      return;
    }

    setDeletingCommentID(item.id);
    setCommentsErrorMessage('');
    setCommentsSuccessMessage('');

    try {
      const deleted = await deleteAdminComment({ commentId: item.id });
      if (!deleted) {
        throw new Error(t('adminAccount.comments.errors.delete', { ns: 'admin-account' }));
      }

      const remainingItems = comments.filter(candidate => candidate.id !== item.id);
      const nextTotal = Math.max(0, totalComments - 1);
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / commentsPageSize));
      const nextPage = Math.min(commentsPage, nextTotalPages);

      if (nextPage !== commentsPage) {
        setCommentsPage(nextPage);
      } else {
        setComments(remainingItems);
      }

      setTotalComments(nextTotal);
      setPendingCommentDelete(null);
      setCommentsSuccessMessage(
        t('adminAccount.comments.success.deleted', {
          ns: 'admin-account',
          author: item.authorName,
        }),
      );
    } catch (error) {
      if (isAdminSessionError(error)) {
        router.replace(`/${locale}/admin/login`);
        return;
      }
      const resolvedError = resolveAdminError(error);
      setCommentsErrorMessage(
        resolvedError.kind === 'network'
          ? t('adminCommon.errors.network', { ns: 'admin-common' })
          : resolvedError.message || t('adminAccount.comments.errors.delete', { ns: 'admin-account' }),
      );
    } finally {
      setDeletingCommentID('');
    }
  }, [
    commentActionID,
    comments,
    commentsPage,
    commentsPageSize,
    deletingCommentID,
    locale,
    pendingCommentDelete,
    router,
    t,
    totalComments,
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

  const handleEmailSubmit = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
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

        setAdminUser(previous =>
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
          router.replace(`/${locale}/admin/login`);
          return;
        }
        const resolvedError = resolveAdminError(error);
        const resolvedErrorField =
          resolvedError.code === 'ADMIN_CURRENT_PASSWORD_INCORRECT' ||
          resolvedError.code === 'ADMIN_CURRENT_PASSWORD_REQUIRED'
            ? 'currentPassword'
            : resolvedError.code === 'ADMIN_EMAIL_INVALID' ||
                resolvedError.code === 'ADMIN_EMAIL_SAME' ||
                resolvedError.code === 'ADMIN_EMAIL_TAKEN'
              ? 'newEmail'
              : 'generic';
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
      resolvedEmailInput,
      router,
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
        router.replace(`/${locale}/admin/login`);
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
    router,
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

      setAdminUser(payload.user);
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
        router.replace(`/${locale}/admin/login`);
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
    locale,
    router,
    t,
  ]);

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

  const newsletterFeedback = (
    <>
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
    </>
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
            href={ADMIN_ROUTES.settings.email}
            className={`admin-settings-nav-link${isEmailSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="envelope" fixedWidth />
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
            href={ADMIN_ROUTES.settings.comments}
            className={`admin-settings-nav-link${isCommentsSection ? ' is-active' : ''}`}
          >
            <span className="admin-settings-nav-icon" aria-hidden="true">
              <FontAwesomeIcon icon="comments" fixedWidth />
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
              <FontAwesomeIcon icon="exclamation-triangle" fixedWidth />
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
              <FontAwesomeIcon icon="layer-group" fixedWidth />
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

              {isEmailSection ? (
                <div className="admin-account-section-stack">
                  <section>
                    <h3 className="admin-dashboard-panel-title mb-2">
                      {t('adminAccount.account.email.title', { ns: 'admin-account' })}
                    </h3>
                    <p className="admin-dashboard-panel-copy">
                      {t('adminAccount.account.email.copy', { ns: 'admin-account' })}
                    </p>

                    {emailErrorMessage ? (
                      <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
                        {emailErrorMessage}
                      </Alert>
                    ) : null}
                    {emailSuccessMessage ? (
                      <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
                        {emailSuccessMessage}
                      </Alert>
                    ) : null}
                    {pendingEmail ? (
                      <Alert variant="info" className="mb-3 px-4 py-3 lh-base">
                        <div className="fw-semibold mb-1">
                          {t('adminAccount.account.email.pending.title', { ns: 'admin-account' })}
                        </div>
                        <div>
                          {t('adminAccount.account.email.pending.copy', {
                            ns: 'admin-account',
                            email: pendingEmail,
                          })}
                        </div>
                        {adminUser?.pendingEmailExpiresAt ? (
                          <div className="small mt-2">
                            {t('adminAccount.account.email.pending.expiresAt', {
                              ns: 'admin-account',
                              value: formatSessionDate(adminUser.pendingEmailExpiresAt),
                            })}
                          </div>
                        ) : null}
                      </Alert>
                    ) : null}

                    <Form noValidate onSubmit={handleEmailSubmit}>
                      <Form.Group className="mb-3" controlId="admin-account-current-email">
                        <Form.Label>{t('adminAccount.account.email.currentLabel', { ns: 'admin-account' })}</Form.Label>
                        <Form.Control type="email" value={adminUser?.email ?? ''} readOnly plaintext={false} disabled />
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="admin-account-email">
                        <Form.Label>{t('adminAccount.account.email.label', { ns: 'admin-account' })}</Form.Label>
                        <Form.Control
                          type="email"
                          value={emailInput}
                          onChange={event => {
                            setEmailInput(event.currentTarget.value);
                            setEmailTouchedFields(previous => ({
                              ...previous,
                              newEmail: true,
                            }));
                            if (
                              emailErrorMessage &&
                              (emailErrorField === 'newEmail' || emailErrorField === 'generic')
                            ) {
                              setEmailErrorMessage('');
                              setEmailErrorField(null);
                            }
                            if (emailSuccessMessage) {
                              setEmailSuccessMessage('');
                            }
                          }}
                          onBlur={() => {
                            setEmailTouchedFields(previous => ({
                              ...previous,
                              newEmail: true,
                            }));
                          }}
                          placeholder={t('adminAccount.account.email.placeholder', { ns: 'admin-account' })}
                          autoComplete="email"
                          isInvalid={showEmailValidationError}
                          required
                        />
                        <Form.Control.Feedback type="invalid" className={showEmailValidationError ? 'd-block' : ''}>
                          {emailValidationError}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3" controlId="admin-account-email-password">
                        <Form.Label>
                          {t('adminAccount.account.email.currentPassword', { ns: 'admin-account' })}
                        </Form.Label>
                        <Form.Control
                          type="password"
                          value={emailCurrentPassword}
                          onChange={event => {
                            setEmailCurrentPassword(event.currentTarget.value);
                            setEmailTouchedFields(previous => ({
                              ...previous,
                              currentPassword: true,
                            }));
                            if (
                              emailErrorMessage &&
                              (emailErrorField === 'currentPassword' || emailErrorField === 'generic')
                            ) {
                              setEmailErrorMessage('');
                              setEmailErrorField(null);
                            }
                          }}
                          onBlur={() => {
                            setEmailTouchedFields(previous => ({
                              ...previous,
                              currentPassword: true,
                            }));
                          }}
                          placeholder={t('adminAccount.account.email.currentPasswordPlaceholder', {
                            ns: 'admin-account',
                          })}
                          autoComplete="current-password"
                          isInvalid={showEmailCurrentPasswordError}
                          required
                        />
                        <Form.Control.Feedback
                          type="invalid"
                          className={showEmailCurrentPasswordError ? 'd-block' : ''}
                        >
                          {emailCurrentPasswordError}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <div className="post-summary-cta mb-0">
                        <Button type="submit" className="post-summary-read-more" disabled={isEmailSubmitting}>
                          {isEmailSubmitting ? (
                            <span className="d-inline-flex align-items-center gap-2">
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                className="me-2 flex-shrink-0 admin-action-spinner"
                                aria-hidden="true"
                              />
                              <span className="read-more-label">
                                {t('adminAccount.account.email.submitting', { ns: 'admin-account' })}
                              </span>
                            </span>
                          ) : (
                            <span className="read-more-label">
                              {t('adminAccount.account.email.submit', { ns: 'admin-account' })}
                            </span>
                          )}
                        </Button>
                      </div>
                    </Form>
                  </section>
                </div>
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
                  <p className="admin-dashboard-panel-copy mb-4">
                    {t('adminAccount.newsletter.copy', { ns: 'admin-account' })}
                  </p>
                  <Tabs
                    id="admin-newsletter-tabs"
                    activeKey={newsletterTab}
                    onSelect={handleNewsletterTabSelect}
                    className="mb-3 admin-content-tabs"
                    mountOnEnter
                  >
                    <Tab
                      eventKey="overview"
                      title={
                        <span className="d-inline-flex align-items-center">
                          <FontAwesomeIcon icon="chart-line" className="me-2" />
                          {t('adminAccount.newsletter.tabs.overview', { ns: 'admin-account' })}
                        </span>
                      }
                    >
                      <div className="pt-3">
                        {newsletterFeedback}
                        <div className="admin-account-section-stack">
                          <section className="card border shadow-sm admin-newsletter-panel">
                            <div className="card-body p-4">
                              <div className="admin-newsletter-operations-layout">
                                <div className="admin-newsletter-operations-copy">
                                  <h4 className="admin-dashboard-panel-title mb-2">
                                    {t('adminAccount.newsletter.operations.title', { ns: 'admin-account' })}
                                  </h4>
                                  <p className="admin-dashboard-panel-copy mb-0">
                                    {t('adminAccount.newsletter.operations.copy', { ns: 'admin-account' })}
                                  </p>
                                </div>
                                <div className="admin-newsletter-operations-action">
                                  <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    className="d-inline-flex align-items-center"
                                    disabled={isNewsletterDispatchRunning}
                                    onClick={() => {
                                      void handleTriggerNewsletterDispatch();
                                    }}
                                  >
                                    {isNewsletterDispatchRunning ? (
                                      <span className="d-inline-flex align-items-center gap-2">
                                        <Spinner
                                          as="span"
                                          animation="border"
                                          size="sm"
                                          className="me-2 flex-shrink-0 admin-action-spinner"
                                          aria-hidden="true"
                                        />
                                        <span>
                                          {t('adminAccount.newsletter.operations.running', { ns: 'admin-account' })}
                                        </span>
                                      </span>
                                    ) : (
                                      <>
                                        <FontAwesomeIcon icon="paper-plane" className="me-2" />
                                        {t('adminAccount.newsletter.operations.trigger', { ns: 'admin-account' })}
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {newsletterDispatchTimestamp ? (
                                <div className="small text-muted mt-3">
                                  {t('adminAccount.newsletter.operations.lastRun', {
                                    ns: 'admin-account',
                                    value: formatSessionDate(newsletterDispatchTimestamp),
                                  })}
                                </div>
                              ) : null}

                              {newsletterDispatchResults.length > 0 ? (
                                <div className="d-grid gap-2 mt-3">
                                  {newsletterDispatchResults.map(result => (
                                    <div key={result.locale} className="border rounded-3 p-3">
                                      <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
                                        <span className="fw-semibold text-uppercase">{result.locale}</span>
                                        <span
                                          className={
                                            result.skipped ? 'badge text-bg-secondary' : 'badge text-bg-success'
                                          }
                                        >
                                          {result.skipped
                                            ? t('adminAccount.newsletter.operations.result.skipped', {
                                                ns: 'admin-account',
                                              })
                                            : t('adminAccount.newsletter.operations.result.completed', {
                                                ns: 'admin-account',
                                              })}
                                        </span>
                                      </div>
                                      <div className="small text-muted mt-2">
                                        {t('adminAccount.newsletter.operations.result.meta', {
                                          ns: 'admin-account',
                                          locale: result.locale.toUpperCase(),
                                          sent: result.sentCount,
                                          failed: result.failedCount,
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          </section>

                          <section className="card border shadow-sm admin-newsletter-panel">
                            <div className="card-body p-4">
                              <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap mb-3">
                                <div>
                                  <h4 className="admin-dashboard-panel-title mb-2">
                                    {t('adminAccount.newsletter.summary.title', { ns: 'admin-account' })}
                                  </h4>
                                  <p className="small text-muted mb-0">
                                    {t('adminAccount.newsletter.summary.copy', { ns: 'admin-account' })}
                                  </p>
                                </div>
                              </div>

                              {isNewsletterSummaryLoading ? (
                                <div className="admin-account-sessions-loading">
                                  <AdminLoadingState
                                    className="admin-loading-stack"
                                    ariaLabel={t('adminAccount.newsletter.summary.loading', { ns: 'admin-account' })}
                                  />
                                </div>
                              ) : (
                                <div className="row g-3">
                                  {[
                                    {
                                      key: 'total',
                                      label: t('adminAccount.newsletter.summary.metrics.total', {
                                        ns: 'admin-account',
                                      }),
                                      value: newsletterSubscriberSummary.total,
                                    },
                                    {
                                      key: 'active',
                                      label: t('adminAccount.newsletter.summary.metrics.active', {
                                        ns: 'admin-account',
                                      }),
                                      value: newsletterSubscriberSummary.active,
                                    },
                                    {
                                      key: 'pending',
                                      label: t('adminAccount.newsletter.summary.metrics.pending', {
                                        ns: 'admin-account',
                                      }),
                                      value: newsletterSubscriberSummary.pending,
                                    },
                                    {
                                      key: 'unsubscribed',
                                      label: t('adminAccount.newsletter.summary.metrics.unsubscribed', {
                                        ns: 'admin-account',
                                      }),
                                      value: newsletterSubscriberSummary.unsubscribed,
                                    },
                                  ].map(item => (
                                    <div key={item.key} className="col-12 col-sm-6 col-xl-3">
                                      <div
                                        className={`admin-newsletter-summary-metric admin-newsletter-summary-metric--${item.key} h-100`}
                                      >
                                        <div className="admin-newsletter-summary-label">{item.label}</div>
                                        <div className="admin-newsletter-summary-value">{item.value}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </section>

                          <section className="card border shadow-sm admin-newsletter-panel">
                            <div className="card-body p-4">
                              <h4 className="admin-dashboard-panel-title mb-2">
                                {t('adminAccount.newsletter.campaigns.title', { ns: 'admin-account' })}
                              </h4>
                              <p className="small text-muted mb-3">
                                {t('adminAccount.newsletter.campaigns.copy', { ns: 'admin-account' })}
                              </p>

                              {isNewsletterCampaignsLoading ? (
                                <div className="admin-account-sessions-loading">
                                  <AdminLoadingState
                                    className="admin-loading-stack"
                                    ariaLabel={t('adminAccount.newsletter.campaigns.loading', { ns: 'admin-account' })}
                                  />
                                </div>
                              ) : newsletterCampaigns.length === 0 ? (
                                <p className="small text-muted mb-0">
                                  {t('adminAccount.newsletter.campaigns.empty', { ns: 'admin-account' })}
                                </p>
                              ) : (
                                <div className="d-grid gap-3">
                                  {newsletterCampaigns.map(item => {
                                    const campaignKey = `${item.locale}:${item.itemKey}`;
                                    const campaignThumbnail = newsletterCampaignThumbnails[campaignKey];
                                    const statusVariant =
                                      item.failedCount === 0
                                        ? 'secondary'
                                        : item.sentCount > 0
                                          ? 'warning'
                                          : 'secondary';
                                    const statusLabel =
                                      item.failedCount === 0
                                        ? t('adminAccount.newsletter.campaigns.statuses.sent', { ns: 'admin-account' })
                                        : item.sentCount > 0
                                          ? t('adminAccount.newsletter.campaigns.statuses.partial', {
                                              ns: 'admin-account',
                                            })
                                          : t('adminAccount.newsletter.campaigns.statuses.processing', {
                                              ns: 'admin-account',
                                            });

                                    return (
                                      <div
                                        key={`${item.locale}-${item.itemKey}`}
                                        className="admin-newsletter-campaign-card"
                                      >
                                        <div className="fw-bold fs-4 text-break">
                                          {item.link ? (
                                            <Link href={item.link} className="link">
                                              {item.title}
                                            </Link>
                                          ) : (
                                            item.title
                                          )}
                                        </div>
                                        <div className="mt-3 d-flex align-items-center flex-wrap gap-2">
                                          {item.locale === 'en' || item.locale === 'tr' ? (
                                            <span className="d-inline-flex align-items-center gap-2">
                                              <FlagIcon
                                                className="flex-shrink-0"
                                                code={item.locale}
                                                alt={`${item.locale.toUpperCase()} flag`}
                                                width={22}
                                                height={22}
                                              />
                                              <span className="fs-4">
                                                {item.locale === 'en' ? LOCALES.en.name : LOCALES.tr.name}
                                              </span>
                                            </span>
                                          ) : null}
                                          <span className={`badge text-bg-${statusVariant}`}>{statusLabel}</span>
                                        </div>
                                        <div className="d-flex flex-column gap-2 mt-3">
                                          <div className="d-flex align-items-center flex-wrap gap-4">
                                            <span className="d-inline-flex align-items-center gap-2 fs-5">
                                              <FontAwesomeIcon icon="paper-plane" className="text-muted" />
                                              <span>
                                                {t('adminAccount.newsletter.campaigns.metrics.sent', {
                                                  ns: 'admin-account',
                                                  count: item.sentCount,
                                                })}
                                              </span>
                                            </span>
                                            <span className="d-inline-flex align-items-center gap-2 fs-5">
                                              <FontAwesomeIcon icon="exclamation-triangle" className="text-muted" />
                                              <span>
                                                {t('adminAccount.newsletter.campaigns.metrics.failed', {
                                                  ns: 'admin-account',
                                                  count: item.failedCount,
                                                })}
                                              </span>
                                            </span>
                                          </div>
                                          {item.lastRunAt ? (
                                            <span className="d-inline-flex align-items-center gap-2 fs-5">
                                              <FontAwesomeIcon icon="calendar-alt" className="text-muted" />
                                              {t('adminAccount.newsletter.campaigns.metrics.lastRunAt', {
                                                ns: 'admin-account',
                                                value: formatSessionDate(item.lastRunAt),
                                              })}
                                            </span>
                                          ) : null}
                                        </div>
                                        {campaignThumbnail ? (
                                          <div className="admin-newsletter-campaign-thumbnail mt-3 overflow-hidden">
                                            <Image
                                              src={campaignThumbnail}
                                              alt={item.title}
                                              width={640}
                                              height={360}
                                              unoptimized
                                              className="w-100 h-100 object-fit-cover"
                                            />
                                          </div>
                                        ) : null}
                                        {item.summary ? (
                                          <p className="post-summary-text mt-3 mb-0 text-muted">{item.summary}</p>
                                        ) : null}
                                        <div className="d-flex flex-wrap gap-2 mt-3">
                                          <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            className="d-inline-flex align-items-center justify-content-center"
                                            onClick={() => {
                                              setNewsletterTestEmail(adminUser?.email ?? '');
                                              setPendingNewsletterTestCampaign(item);
                                            }}
                                          >
                                            <FontAwesomeIcon icon="envelope" className="me-2" />
                                            {t('adminAccount.newsletter.campaigns.actions.sendTest', {
                                              ns: 'admin-account',
                                            })}
                                          </Button>
                                          {item.failedCount > 0 ? (
                                            <Button
                                              type="button"
                                              variant="outline-secondary"
                                              size="sm"
                                              className="d-inline-flex align-items-center justify-content-center"
                                              onClick={() => {
                                                void handleViewNewsletterFailures(item);
                                              }}
                                            >
                                              <FontAwesomeIcon icon="exclamation-triangle" className="me-2" />
                                              {t('adminAccount.newsletter.campaigns.actions.viewFailures', {
                                                ns: 'admin-account',
                                              })}
                                            </Button>
                                          ) : null}
                                          {item.link ? (
                                            <Link
                                              href={item.link}
                                              className="btn btn-success btn-sm d-inline-flex align-items-center"
                                            >
                                              <FontAwesomeIcon icon="up-right-from-square" className="me-2" />
                                              {t('adminAccount.newsletter.campaigns.actions.openPost', {
                                                ns: 'admin-account',
                                              })}
                                            </Link>
                                          ) : null}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </section>
                        </div>
                      </div>
                    </Tab>
                    <Tab
                      eventKey="subscribers"
                      title={
                        <span className="d-inline-flex align-items-center">
                          <FontAwesomeIcon icon="address-book" className="me-2" />
                          {t('adminAccount.newsletter.tabs.subscribers', { ns: 'admin-account' })}
                        </span>
                      }
                    >
                      <div className="pt-3">
                        {newsletterFeedback}
                        <div className="d-grid gap-3">
                          <div className="card shadow-sm d-block">
                            <div className="card-body p-3 w-100">
                              <div className="row g-3">
                                <div className="col-12 col-md-4">
                                  <Form.Group controlId="admin-newsletter-filter-locale">
                                    <Form.Label className="small fw-semibold mb-1">
                                      {t('adminAccount.newsletter.filters.locale', { ns: 'admin-account' })}
                                    </Form.Label>
                                    <Form.Select
                                      value={newsletterFilterLocale}
                                      onChange={event => {
                                        setNewsletterFilterLocale(event.currentTarget.value as 'all' | 'en' | 'tr');
                                        setNewsletterPage(1);
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
                                <div className="col-12 col-md-4">
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
                                        setNewsletterPage(1);
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
                                        {t('adminAccount.newsletter.filters.statuses.unsubscribed', {
                                          ns: 'admin-account',
                                        })}
                                      </option>
                                    </Form.Select>
                                  </Form.Group>
                                </div>
                                <div className="col-12 col-md-4">
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
                                        placeholder={t('adminAccount.newsletter.filters.queryPlaceholder', {
                                          ns: 'admin-account',
                                        })}
                                        onChange={event => {
                                          setNewsletterFilterQuery(event.currentTarget.value);
                                          setNewsletterPage(1);
                                        }}
                                      />
                                      {newsletterFilterQuery ? (
                                        <button
                                          type="button"
                                          className="search-clear-btn border-0 bg-transparent"
                                          onClick={() => {
                                            setNewsletterFilterQuery('');
                                            setNewsletterPage(1);
                                          }}
                                          aria-label={t('adminAccount.newsletter.filters.query', {
                                            ns: 'admin-account',
                                          })}
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

                          <div ref={newsletterListTopRef} className="card shadow-sm d-block">
                            <div className="card-body p-3 w-100">
                              <div className="mb-3">
                                <div>
                                  <h4 className="admin-dashboard-panel-title mb-2">
                                    {t('adminAccount.newsletter.subscribers.title', { ns: 'admin-account' })}
                                  </h4>
                                  <p className="small text-muted mb-0">
                                    {t('adminAccount.newsletter.subscribers.copy', { ns: 'admin-account' })}
                                  </p>
                                </div>
                              </div>

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
                                      <div key={item.email} className="border rounded-3 p-3 w-100">
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
                                        <div className="row g-2 mt-3">
                                          {canActivate ? (
                                            <div className="col-12 col-md-auto">
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="success"
                                                className="w-100"
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
                                                      {t('adminAccount.newsletter.actions.updating', {
                                                        ns: 'admin-account',
                                                      })}
                                                    </span>
                                                  </span>
                                                ) : (
                                                  <>
                                                    <FontAwesomeIcon icon="check" className="me-2" />
                                                    {t('adminAccount.newsletter.actions.setActive', {
                                                      ns: 'admin-account',
                                                    })}
                                                  </>
                                                )}
                                              </Button>
                                            </div>
                                          ) : null}

                                          {canUnsubscribe ? (
                                            <div className="col-12 col-md-auto">
                                              <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                className="w-100"
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
                                                      {t('adminAccount.newsletter.actions.updating', {
                                                        ns: 'admin-account',
                                                      })}
                                                    </span>
                                                  </span>
                                                ) : (
                                                  <>
                                                    <FontAwesomeIcon icon="times-circle" className="me-2" />
                                                    {t('adminAccount.newsletter.actions.unsubscribe', {
                                                      ns: 'admin-account',
                                                    })}
                                                  </>
                                                )}
                                              </Button>
                                            </div>
                                          ) : null}

                                          <div className="col-12 col-md-auto">
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="danger"
                                              className="w-100"
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
                                                    {t('adminAccount.newsletter.actions.deleting', {
                                                      ns: 'admin-account',
                                                    })}
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
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                            {!isNewsletterLoading && totalNewsletterSubscribers > 0 ? (
                              <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
                                <PaginationBar
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
                      </div>
                    </Tab>
                  </Tabs>

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

                  <Modal
                    show={selectedNewsletterCampaign !== null}
                    onHide={() => {
                      if (isNewsletterFailuresLoading) {
                        return;
                      }
                      setSelectedNewsletterCampaign(null);
                    }}
                    centered
                    size="lg"
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>{t('adminAccount.newsletter.failures.title', { ns: 'admin-account' })}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <div className="small text-muted mb-3">
                        {t('adminAccount.newsletter.failures.copy', {
                          ns: 'admin-account',
                          title: selectedNewsletterCampaign?.title ?? '',
                        })}
                      </div>

                      {isNewsletterFailuresLoading ? (
                        <div className="admin-account-sessions-loading">
                          <AdminLoadingState
                            className="admin-loading-stack"
                            ariaLabel={t('adminAccount.newsletter.failures.loading', { ns: 'admin-account' })}
                          />
                        </div>
                      ) : newsletterCampaignFailures.length === 0 ? (
                        <p className="small text-muted mb-0">
                          {t('adminAccount.newsletter.failures.empty', { ns: 'admin-account' })}
                        </p>
                      ) : (
                        <div className="d-grid gap-2">
                          <div className="small text-muted">
                            {t('adminAccount.newsletter.failures.total', {
                              ns: 'admin-account',
                              count: newsletterFailuresTotal,
                            })}
                          </div>
                          {newsletterCampaignFailures.map(item => (
                            <div key={`${item.itemKey}-${item.email}`} className="border rounded-3 p-3">
                              <div className="fw-semibold text-break">{item.email}</div>
                              {item.lastAttemptAt ? (
                                <div className="small text-muted mt-2">
                                  {t('adminAccount.newsletter.failures.lastAttemptAt', {
                                    ns: 'admin-account',
                                    value: formatSessionDate(item.lastAttemptAt),
                                  })}
                                </div>
                              ) : null}
                              {item.lastError ? <div className="small text-muted mt-2">{item.lastError}</div> : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isNewsletterFailuresLoading}
                        onClick={() => {
                          setSelectedNewsletterCampaign(null);
                        }}
                      >
                        {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
                      </Button>
                    </Modal.Footer>
                  </Modal>

                  <Modal
                    show={pendingNewsletterTestCampaign !== null}
                    onHide={() => {
                      if (isNewsletterTestSending) {
                        return;
                      }
                      setPendingNewsletterTestCampaign(null);
                    }}
                    centered
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>{t('adminAccount.newsletter.testSend.title', { ns: 'admin-account' })}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <p className="small text-muted mb-3">
                        {t('adminAccount.newsletter.testSend.copy', {
                          ns: 'admin-account',
                          title: pendingNewsletterTestCampaign?.title ?? '',
                        })}
                      </p>
                      <Form.Group controlId="admin-newsletter-test-email">
                        <Form.Label className="small fw-semibold mb-1">
                          {t('adminAccount.newsletter.testSend.emailLabel', { ns: 'admin-account' })}
                        </Form.Label>
                        <Form.Control
                          type="email"
                          value={newsletterTestEmail}
                          placeholder={t('adminAccount.newsletter.testSend.emailPlaceholder', {
                            ns: 'admin-account',
                          })}
                          disabled={isNewsletterTestSending}
                          onChange={event => {
                            setNewsletterTestEmail(event.currentTarget.value);
                          }}
                        />
                      </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={isNewsletterTestSending}
                        onClick={() => {
                          setPendingNewsletterTestCampaign(null);
                        }}
                      >
                        {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        disabled={isNewsletterTestSending || newsletterTestEmail.trim() === ''}
                        onClick={() => {
                          void handleSendNewsletterTestEmail();
                        }}
                      >
                        {isNewsletterTestSending ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              className="me-2 flex-shrink-0 admin-action-spinner"
                              aria-hidden="true"
                            />
                            <span>{t('adminAccount.newsletter.testSend.sending', { ns: 'admin-account' })}</span>
                          </span>
                        ) : (
                          <>
                            <FontAwesomeIcon icon="paper-plane" className="me-2" />
                            {t('adminAccount.newsletter.testSend.submit', { ns: 'admin-account' })}
                          </>
                        )}
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </>
              ) : null}

              {isCommentsSection ? (
                <>
                  <h3 className="admin-dashboard-panel-title mb-3">
                    {t('adminAccount.comments.title', { ns: 'admin-account' })}
                  </h3>
                  <hr className="admin-section-divider mb-3" />
                  <p className="admin-dashboard-panel-copy mb-3">
                    {t('adminAccount.comments.copy', { ns: 'admin-account' })}
                  </p>

                  {commentsErrorMessage ? (
                    <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
                      {commentsErrorMessage}
                    </Alert>
                  ) : null}
                  {commentsSuccessMessage ? (
                    <Alert variant="success" className="mb-3 px-4 py-3 lh-base">
                      {commentsSuccessMessage}
                    </Alert>
                  ) : null}

                  <div className="d-grid gap-3">
                    <div ref={commentsListTopRef} />

                    <div className="card shadow-sm d-block">
                      <div className="card-body p-3 w-100">
                        <div className="row g-3">
                          <div className="col-12 col-md-3">
                            <Form.Group controlId="admin-comments-filter-locale">
                              <Form.Label className="small fw-semibold mb-1">
                                {t('adminAccount.comments.filters.locale', { ns: 'admin-account' })}
                              </Form.Label>
                              <Form.Select
                                value={commentFilterLocale}
                                onChange={event => {
                                  setCommentFilterLocale(event.currentTarget.value as 'all' | 'en' | 'tr');
                                  setCommentsErrorMessage('');
                                  setCommentsSuccessMessage('');
                                }}
                              >
                                <option value="all">
                                  {t('adminAccount.comments.filters.locales.all', { ns: 'admin-account' })}
                                </option>
                                <option value="en">
                                  {t('adminAccount.comments.filters.locales.en', { ns: 'admin-account' })}
                                </option>
                                <option value="tr">
                                  {t('adminAccount.comments.filters.locales.tr', { ns: 'admin-account' })}
                                </option>
                              </Form.Select>
                            </Form.Group>
                          </div>
                          <div className="col-12 col-md-3">
                            <Form.Group controlId="admin-comments-filter-status">
                              <Form.Label className="small fw-semibold mb-1">
                                {t('adminAccount.comments.filters.status', { ns: 'admin-account' })}
                              </Form.Label>
                              <Form.Select
                                value={commentFilterStatus}
                                onChange={event => {
                                  setCommentFilterStatus(
                                    event.currentTarget.value as 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SPAM',
                                  );
                                  setCommentsErrorMessage('');
                                  setCommentsSuccessMessage('');
                                }}
                              >
                                <option value="all">
                                  {t('adminAccount.comments.filters.statuses.all', { ns: 'admin-account' })}
                                </option>
                                <option value="PENDING">
                                  {t('adminAccount.comments.filters.statuses.pending', { ns: 'admin-account' })}
                                </option>
                                <option value="APPROVED">
                                  {t('adminAccount.comments.filters.statuses.approved', { ns: 'admin-account' })}
                                </option>
                                <option value="REJECTED">
                                  {t('adminAccount.comments.filters.statuses.rejected', { ns: 'admin-account' })}
                                </option>
                                <option value="SPAM">
                                  {t('adminAccount.comments.filters.statuses.spam', { ns: 'admin-account' })}
                                </option>
                              </Form.Select>
                            </Form.Group>
                          </div>
                          <div className="col-12 col-md-6">
                            <Form.Group controlId="admin-comments-filter-query">
                              <Form.Label className="small fw-semibold mb-1">
                                {t('adminAccount.comments.filters.query', { ns: 'admin-account' })}
                              </Form.Label>
                              <div className="search-bar w-100 d-flex align-items-center">
                                <div className="search-icon">
                                  <FontAwesomeIcon icon="search" />
                                </div>
                                <Form.Control
                                  type="text"
                                  className="search-input form-control"
                                  value={commentFilterQuery}
                                  onChange={event => {
                                    setCommentFilterQuery(event.currentTarget.value);
                                    setCommentsErrorMessage('');
                                  }}
                                  placeholder={t('adminAccount.comments.filters.queryPlaceholder', {
                                    ns: 'admin-account',
                                  })}
                                />
                                {commentFilterQuery ? (
                                  <button
                                    type="button"
                                    className="search-clear-btn border-0 bg-transparent"
                                    onClick={() => {
                                      setCommentFilterQuery('');
                                      setCommentsErrorMessage('');
                                    }}
                                    aria-label={t('adminAccount.comments.filters.query', { ns: 'admin-account' })}
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
                        {isCommentsLoading ? (
                          <div className="admin-account-sessions-loading">
                            <AdminLoadingState
                              className="admin-loading-stack"
                              ariaLabel={t('adminAccount.comments.loading', { ns: 'admin-account' })}
                            />
                          </div>
                        ) : totalComments === 0 ? (
                          <p className="small text-muted mb-0">
                            {t('adminAccount.comments.empty', { ns: 'admin-account' })}
                          </p>
                        ) : (
                          <div className="d-grid gap-3">
                            {comments.map(item => {
                              const normalizedLocale = item.locale.trim().toLowerCase();
                              const isKnownLocale = normalizedLocale === 'en' || normalizedLocale === 'tr';
                              const isActionPending = commentActionID === item.id;
                              const isDeletePending = deletingCommentID === item.id;
                              const isApprovePending = isActionPending && commentActionStatus === 'APPROVED';
                              const isRejectPending = isActionPending && commentActionStatus === 'REJECTED';
                              const isSpamPending = isActionPending && commentActionStatus === 'SPAM';
                              const statusLabel = t(
                                `adminAccount.comments.filters.statuses.${item.status.toLowerCase()}`,
                                { ns: 'admin-account' },
                              );
                              const postHref = buildAdminContentPostDetailRoute(
                                isKnownLocale ? normalizedLocale : item.locale,
                                item.postId,
                              );

                              return (
                                <div
                                  key={item.id}
                                  className={`admin-newsletter-campaign-card admin-comments-card admin-comments-card--${item.status.toLowerCase()}`}
                                >
                                  <div className="d-flex align-items-start justify-content-between gap-3 flex-wrap">
                                    <div className="d-grid gap-2">
                                      <div className="d-flex align-items-center gap-2 flex-wrap">
                                        <strong className="text-break">{item.authorName}</strong>
                                        <span className={`badge text-bg-${resolveCommentStatusVariant(item.status)}`}>
                                          {statusLabel}
                                        </span>
                                        <span className="badge text-bg-light">
                                          {item.parentId
                                            ? t('adminAccount.comments.list.replyLabel', { ns: 'admin-account' })
                                            : t('adminAccount.comments.list.rootLabel', { ns: 'admin-account' })}
                                        </span>
                                      </div>
                                      <div className="small text-muted d-flex align-items-center gap-2 flex-wrap">
                                        <span className="d-inline-flex align-items-center gap-2">
                                          {isKnownLocale ? (
                                            <FlagIcon
                                              className="flex-shrink-0"
                                              code={normalizedLocale}
                                              alt={`${LOCALES[normalizedLocale].name} flag`}
                                              width={18}
                                              height={18}
                                            />
                                          ) : (
                                            <FontAwesomeIcon icon="globe" className="text-muted" />
                                          )}
                                          <span>
                                            {isKnownLocale ? LOCALES[normalizedLocale].name : item.locale.toUpperCase()}
                                          </span>
                                        </span>
                                        <span className="d-inline-flex align-items-center gap-2">
                                          <FontAwesomeIcon icon="envelope" className="text-muted" />
                                          <span>{item.authorEmail}</span>
                                        </span>
                                        <span className="d-inline-flex align-items-center gap-2">
                                          <FontAwesomeIcon icon="calendar-alt" className="text-muted" />
                                          <span>
                                            {t('adminAccount.comments.list.submittedAt', {
                                              ns: 'admin-account',
                                              value: formatSessionDate(item.createdAt),
                                            })}
                                          </span>
                                        </span>
                                        {item.updatedAt && item.updatedAt !== item.createdAt ? (
                                          <span className="d-inline-flex align-items-center gap-2">
                                            <FontAwesomeIcon icon="clock" className="text-muted" />
                                            <span>
                                              {t('adminAccount.comments.list.updatedAt', {
                                                ns: 'admin-account',
                                                value: formatSessionDate(item.updatedAt),
                                              })}
                                            </span>
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>

                                    <Link
                                      href={postHref}
                                      className="btn btn-success btn-sm d-inline-flex align-items-center admin-newsletter-action admin-newsletter-action--external"
                                    >
                                      <FontAwesomeIcon icon="up-right-from-square" className="me-2" />
                                      {t('adminAccount.comments.actions.openPost', { ns: 'admin-account' })}
                                    </Link>
                                  </div>

                                  <div className="small text-muted mt-3 d-inline-flex align-items-center gap-2 flex-wrap">
                                    <FontAwesomeIcon icon="book" className="text-muted" />
                                    <span>
                                      {t('adminAccount.comments.list.post', {
                                        ns: 'admin-account',
                                        title: item.postTitle || item.postId,
                                      })}
                                    </span>
                                  </div>
                                  <p className="mb-0 mt-2 text-break">{item.content}</p>

                                  <div className="row g-2 mt-3">
                                    <div className="col-12 col-md-auto">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="success"
                                        className="w-100"
                                        disabled={isActionPending || isDeletePending || item.status === 'APPROVED'}
                                        onClick={() => {
                                          void handleCommentStatusUpdate(item.id, 'APPROVED');
                                        }}
                                      >
                                        {isApprovePending ? (
                                          <span className="d-inline-flex align-items-center gap-2">
                                            <Spinner
                                              as="span"
                                              animation="border"
                                              size="sm"
                                              className="me-2 flex-shrink-0 admin-action-spinner"
                                              aria-hidden="true"
                                            />
                                            <span>
                                              {t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}
                                            </span>
                                          </span>
                                        ) : (
                                          <>
                                            <FontAwesomeIcon icon="check" className="me-2" />
                                            {t('adminAccount.comments.actions.approve', { ns: 'admin-account' })}
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    <div className="col-12 col-md-auto">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="secondary"
                                        className="w-100 admin-newsletter-action admin-newsletter-action--secondary"
                                        disabled={isActionPending || isDeletePending || item.status === 'REJECTED'}
                                        onClick={() => {
                                          void handleCommentStatusUpdate(item.id, 'REJECTED');
                                        }}
                                      >
                                        {!isRejectPending ? (
                                          <FontAwesomeIcon icon="times-circle" className="me-2" />
                                        ) : null}
                                        {isRejectPending ? (
                                          <span className="d-inline-flex align-items-center gap-2">
                                            <Spinner
                                              as="span"
                                              animation="border"
                                              size="sm"
                                              className="me-2 flex-shrink-0 admin-action-spinner"
                                              aria-hidden="true"
                                            />
                                            <span>
                                              {t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}
                                            </span>
                                          </span>
                                        ) : (
                                          t('adminAccount.comments.actions.reject', { ns: 'admin-account' })
                                        )}
                                      </Button>
                                    </div>
                                    <div className="col-12 col-md-auto">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="danger"
                                        className="w-100 admin-newsletter-action admin-newsletter-action--danger"
                                        disabled={isActionPending || isDeletePending || item.status === 'SPAM'}
                                        onClick={() => {
                                          void handleCommentStatusUpdate(item.id, 'SPAM');
                                        }}
                                      >
                                        {!isSpamPending ? (
                                          <FontAwesomeIcon icon="shield-halved" className="me-2" />
                                        ) : null}
                                        {isSpamPending ? (
                                          <span className="d-inline-flex align-items-center gap-2">
                                            <Spinner
                                              as="span"
                                              animation="border"
                                              size="sm"
                                              className="me-2 flex-shrink-0 admin-action-spinner"
                                              aria-hidden="true"
                                            />
                                            <span>
                                              {t('adminAccount.comments.actions.updating', { ns: 'admin-account' })}
                                            </span>
                                          </span>
                                        ) : (
                                          t('adminAccount.comments.actions.spam', { ns: 'admin-account' })
                                        )}
                                      </Button>
                                    </div>
                                    <div className="col-12 col-md-auto">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="danger"
                                        className="w-100"
                                        disabled={isActionPending || isDeletePending}
                                        onClick={() => {
                                          setPendingCommentDelete(item);
                                        }}
                                      >
                                        {isDeletePending ? (
                                          <span className="d-inline-flex align-items-center gap-2">
                                            <Spinner
                                              as="span"
                                              animation="border"
                                              size="sm"
                                              className="me-2 flex-shrink-0 admin-action-spinner"
                                              aria-hidden="true"
                                            />
                                            <span>
                                              {t('adminAccount.comments.actions.deleting', { ns: 'admin-account' })}
                                            </span>
                                          </span>
                                        ) : (
                                          <>
                                            <FontAwesomeIcon icon="trash" className="me-2" />
                                            {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {!isCommentsLoading && totalComments > 0 ? (
                        <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
                          <PaginationBar
                            currentPage={commentsPage}
                            totalPages={totalCommentPages}
                            totalResults={totalComments}
                            size={commentsPageSize}
                            onPageChange={page => {
                              setCommentsPage(page);
                              scrollToCommentsListStart();
                            }}
                            onSizeChange={size => {
                              setCommentsPageSize(size);
                              setCommentsPage(1);
                              scrollToCommentsListStart();
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <Modal
                    show={pendingCommentDelete !== null}
                    onHide={() => {
                      if (deletingCommentID) {
                        return;
                      }
                      setPendingCommentDelete(null);
                    }}
                    centered
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>
                        {t('adminAccount.comments.deleteConfirm.title', { ns: 'admin-account' })}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <p className="small text-muted mb-3">
                        {t('adminAccount.comments.deleteConfirm.copy', {
                          ns: 'admin-account',
                          author: pendingCommentDelete?.authorName ?? '',
                        })}
                      </p>
                      <dl className="row mb-0 small">
                        <dt className="col-4 text-uppercase text-muted">
                          {t('adminAccount.comments.deleteConfirm.labels.author', { ns: 'admin-account' })}
                        </dt>
                        <dd className="col-8 mb-2">{pendingCommentDelete?.authorName ?? '-'}</dd>
                        <dt className="col-4 text-uppercase text-muted">
                          {t('adminAccount.comments.deleteConfirm.labels.email', { ns: 'admin-account' })}
                        </dt>
                        <dd className="col-8 mb-2 text-break">{pendingCommentDelete?.authorEmail ?? '-'}</dd>
                        <dt className="col-4 text-uppercase text-muted">
                          {t('adminAccount.comments.deleteConfirm.labels.post', { ns: 'admin-account' })}
                        </dt>
                        <dd className="col-8 mb-0 text-break">
                          {pendingCommentDelete?.postTitle || pendingCommentDelete?.postId || '-'}
                        </dd>
                      </dl>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={deletingCommentID !== ''}
                        onClick={() => {
                          setPendingCommentDelete(null);
                        }}
                      >
                        {t('adminAccount.profile.avatar.crop.cancel', { ns: 'admin-account' })}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={pendingCommentDelete === null || deletingCommentID !== ''}
                        onClick={() => {
                          void handleDeleteCommentSubmit();
                        }}
                      >
                        {deletingCommentID ? (
                          <span className="d-inline-flex align-items-center gap-2">
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              className="me-2 flex-shrink-0 admin-action-spinner"
                              aria-hidden="true"
                            />
                            <span>{t('adminAccount.comments.actions.deleting', { ns: 'admin-account' })}</span>
                          </span>
                        ) : (
                          <>
                            <FontAwesomeIcon icon="trash" className="me-2" />
                            {t('adminAccount.comments.actions.delete', { ns: 'admin-account' })}
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
                        <div className="card-footer bg-transparent py-3 px-3 px-md-4 border-top">
                          <PaginationBar
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

              {isContentSection ? (
                <AdminContentManagementPanel
                  formatDate={formatSessionDate}
                  onSessionExpired={() => {
                    router.replace(`/${locale}/admin/login`);
                  }}
                />
              ) : null}

              {isSecuritySection ? (
                <>
                  <h3 className="admin-dashboard-panel-title mb-3">
                    {t('adminAccount.connectedAccounts.title', { ns: 'admin-account' })}
                  </h3>
                  <hr className="admin-section-divider mb-3" />
                  <p className="admin-dashboard-panel-copy">
                    {t('adminAccount.connectedAccounts.copy', { ns: 'admin-account' })}
                  </p>

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
                  {googleConnectMessage ? (
                    <Alert variant={googleConnectMessageVariant} className="mb-4 px-4 py-3 lh-base">
                      {googleConnectMessage}
                    </Alert>
                  ) : null}
                  {googleActionErrorMessage ? (
                    <Alert variant="danger" className="mb-4 px-4 py-3 lh-base">
                      {googleActionErrorMessage}
                    </Alert>
                  ) : null}

                  <ListGroup className="rounded-4 overflow-hidden border shadow-sm">
                    <ListGroup.Item className="px-4 py-4">
                      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                        <div className="d-flex align-items-start gap-3">
                          <span className="fs-4 text-body-secondary">
                            <FontAwesomeIcon icon="envelope" fixedWidth />
                          </span>
                          <div>
                            <div className="fw-semibold mb-1">
                              {t('adminAccount.account.email.title', { ns: 'admin-account' })}
                            </div>
                            <div className="text-body-secondary">{adminUser.pendingEmail ?? adminUser.email}</div>
                            {adminUser.pendingEmail ? (
                              <div className="small text-body-secondary mt-1">
                                {t('adminAccount.account.email.pending.copy', {
                                  ns: 'admin-account',
                                  email: adminUser.pendingEmail,
                                })}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="d-flex justify-content-lg-end">
                          <Button
                            variant="primary"
                            onClick={() => router.push(`/${locale}${ADMIN_ROUTES.settings.email}`)}
                          >
                            {t('adminAccount.connectedAccounts.actions.manage', { ns: 'admin-account' })}
                          </Button>
                        </div>
                      </div>
                    </ListGroup.Item>

                    <ListGroup.Item className="px-4 py-4">
                      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                        <div className="d-flex align-items-start gap-3">
                          <span className="fs-4 text-body-secondary">
                            <FontAwesomeIcon icon="lock" fixedWidth />
                          </span>
                          <div>
                            <div className="fw-semibold mb-1">
                              {t('adminCommon.actions.changePassword', { ns: 'admin-common' })}
                            </div>
                            <div className="text-body-secondary">
                              {t('adminAccount.connectedAccounts.password.copy', { ns: 'admin-account' })}
                            </div>
                          </div>
                        </div>
                        <div className="d-flex justify-content-lg-end">
                          <Button
                            variant="primary"
                            onClick={() => setIsSecurityPasswordExpanded(previous => !previous)}
                          >
                            {isSecurityPasswordExpanded
                              ? t('adminAccount.connectedAccounts.actions.hide', { ns: 'admin-account' })
                              : t('adminAccount.connectedAccounts.password.action', { ns: 'admin-account' })}
                          </Button>
                        </div>
                      </div>

                      {isSecurityPasswordExpanded ? (
                        <Form noValidate onSubmit={handleSecuritySubmit} className="mt-4 pt-4 border-top">
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

                          <div className="d-flex flex-wrap gap-2">
                            <Button
                              type="submit"
                              className="admin-newsletter-action admin-newsletter-action--primary"
                              disabled={isSecuritySubmitting}
                            >
                              {isSecuritySubmitting ? (
                                <span className="d-inline-flex align-items-center gap-2">
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    className="me-2 flex-shrink-0 admin-action-spinner"
                                    aria-hidden="true"
                                  />
                                  <span>{t('adminAccount.form.submitting', { ns: 'admin-account' })}</span>
                                </span>
                              ) : (
                                t('adminAccount.form.submit', { ns: 'admin-account' })
                              )}
                            </Button>
                          </div>
                        </Form>
                      ) : null}
                    </ListGroup.Item>

                    <ListGroup.Item className="px-4 py-4">
                      <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                        <div className="d-flex align-items-start gap-3">
                          <span className="fs-4 text-body-secondary">
                            <FontAwesomeIcon icon={['fab', 'google']} fixedWidth />
                          </span>
                          <div>
                            <div className="fw-semibold mb-1">
                              {t('adminAccount.connectedAccounts.google.title', { ns: 'admin-account' })}
                              {adminUser.googleLinked ? (
                                <Badge bg="success" className="ms-2">
                                  {t('adminAccount.connectedAccounts.google.connectedBadge', { ns: 'admin-account' })}
                                </Badge>
                              ) : null}
                            </div>
                            <div className="text-body-secondary">
                              {adminUser.googleLinked
                                ? t('adminAccount.connectedAccounts.google.connectedCopy', {
                                    ns: 'admin-account',
                                    email: adminUser.googleEmail ?? adminUser.email,
                                  })
                                : t('adminAccount.connectedAccounts.google.disconnectedCopy', { ns: 'admin-account' })}
                            </div>
                            {adminUser.googleLinkedAt ? (
                              <div className="small text-body-secondary mt-1 d-inline-flex align-items-center gap-2">
                                <FontAwesomeIcon icon="calendar-alt" />
                                {t('adminAccount.connectedAccounts.google.linkedAt', {
                                  ns: 'admin-account',
                                  value: formatSessionDate(adminUser.googleLinkedAt),
                                })}
                              </div>
                            ) : null}
                            {adminUser.googleLinked && googleAuthStatus.loginAvailable ? (
                              <div className="small text-body-secondary mt-1">
                                {t('adminAccount.connectedAccounts.google.loginEnabled', { ns: 'admin-account' })}
                              </div>
                            ) : null}
                            {!googleAuthStatus.enabled && !isGoogleAuthStatusLoading ? (
                              <div className="small text-body-secondary mt-1">
                                {t('adminAccount.connectedAccounts.google.unavailableBadge', { ns: 'admin-account' })}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="d-flex justify-content-lg-end">
                          {isGoogleAuthStatusLoading ? (
                            <div className="small text-muted d-inline-flex align-items-center">
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                className="me-2 flex-shrink-0 admin-action-spinner"
                                aria-hidden="true"
                              />
                              {t('adminCommon.status.loading', { ns: 'admin-common' })}
                            </div>
                          ) : adminUser.googleLinked ? (
                            <Button
                              variant="danger"
                              className="admin-newsletter-action admin-newsletter-action--danger"
                              onClick={openGoogleDisconnectModal}
                              disabled={isGoogleConnectSubmitting || isGoogleDisconnectSubmitting}
                            >
                              {t('adminAccount.connectedAccounts.google.disconnect', { ns: 'admin-account' })}
                            </Button>
                          ) : googleAuthStatus.enabled ? (
                            <Button
                              className="admin-newsletter-action admin-newsletter-action--primary"
                              onClick={handleGoogleConnect}
                              disabled={isGoogleConnectSubmitting || isGoogleDisconnectSubmitting}
                            >
                              <FontAwesomeIcon icon={['fab', 'google']} className="me-2" />
                              {t('adminAccount.connectedAccounts.google.connect', { ns: 'admin-account' })}
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </ListGroup.Item>
                  </ListGroup>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <Modal show={isGoogleDisconnectModalOpen} onHide={closeGoogleDisconnectModal} centered>
        <Modal.Header closeButton={!isGoogleDisconnectSubmitting}>
          <Modal.Title>
            {t('adminAccount.connectedAccounts.google.disconnectConfirmTitle', { ns: 'admin-account' })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            {t('adminAccount.connectedAccounts.google.disconnectConfirmCopy', {
              ns: 'admin-account',
              email: adminUser?.googleEmail ?? adminUser?.email ?? '',
            })}
          </p>
          {googleActionErrorMessage ? (
            <Alert variant="danger" className="mb-3 px-4 py-3 lh-base">
              {googleActionErrorMessage}
            </Alert>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            className="admin-newsletter-action admin-newsletter-action--secondary"
            onClick={closeGoogleDisconnectModal}
            disabled={isGoogleDisconnectSubmitting}
          >
            {t('adminCommon.actions.cancel', { ns: 'admin-common' })}
          </Button>
          <Button
            variant="danger"
            className="admin-newsletter-action admin-newsletter-action--danger"
            onClick={handleGoogleDisconnect}
            disabled={isGoogleConnectSubmitting || isGoogleDisconnectSubmitting}
          >
            {isGoogleDisconnectSubmitting ? (
              <span className="d-inline-flex align-items-center">
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  className="me-2 flex-shrink-0 admin-action-spinner"
                  aria-hidden="true"
                />
                {t('adminAccount.connectedAccounts.google.disconnecting', { ns: 'admin-account' })}
              </span>
            ) : (
              t('adminAccount.connectedAccounts.google.disconnect', { ns: 'admin-account' })
            )}
          </Button>
        </Modal.Footer>
      </Modal>

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
