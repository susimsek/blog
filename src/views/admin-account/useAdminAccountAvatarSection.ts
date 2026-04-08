'use client';

import React from 'react';
import type { TFunction } from 'i18next';
import { changeAdminAvatar, isAdminSessionError, resolveAdminError } from '@/lib/adminApi';
import type { AdminSessionProfile } from '@/lib/adminSessionProfileCache';
import useAutoClearValue from '@/hooks/useAutoClearValue';

type AdminIdentity = AdminSessionProfile | null;

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

type UseAdminAccountAvatarSectionParams = {
  adminUser: AdminIdentity;
  successMessageAutoHideMs: number;
  syncAdminUser: (nextUser: AdminIdentity) => void;
  onSessionExpired: () => void;
  t: TFunction;
};

const MAX_AVATAR_FILE_BYTES = 2 * 1024 * 1024;
const MAX_AVATAR_FILE_SIZE_MB = Math.floor(MAX_AVATAR_FILE_BYTES / (1024 * 1024));
const AVATAR_CROP_VIEWPORT_SIZE = 260;
const AVATAR_CROP_MIN_SIZE = 96;
const DEFAULT_AVATAR_EXPORT_SIZE = 512;
const MIN_AVATAR_EXPORT_SIZE = 128;
const MIN_AVATAR_EXPORT_QUALITY = 0.5;
const ALLOWED_AVATAR_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

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

export default function useAdminAccountAvatarSection({
  adminUser,
  successMessageAutoHideMs,
  syncAdminUser,
  onSessionExpired,
  t,
}: UseAdminAccountAvatarSectionParams) {
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
  const avatarCropDragRef = React.useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const avatarCropResizeRef = React.useRef<AvatarCropResizeState | null>(null);
  const avatarFileInputRef = React.useRef<HTMLInputElement | null>(null);

  useAutoClearValue(avatarSuccessMessage, setAvatarSuccessMessage, successMessageAutoHideMs);

  React.useEffect(
    () => () => {
      if (avatarCropSource) {
        URL.revokeObjectURL(avatarCropSource);
      }
    },
    [avatarCropSource],
  );

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
          onSessionExpired();
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
    [adminUser, isAvatarSubmitting, onSessionExpired, syncAdminUser, t],
  );

  const openAvatarPicker = React.useCallback(() => {
    avatarFileInputRef.current?.click();
  }, []);

  const handleRemoveAvatar = React.useCallback(() => {
    void handleAvatarUpdate(null, 'remove');
  }, [handleAvatarUpdate]);

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

  return {
    maxAvatarFileSizeMb: MAX_AVATAR_FILE_SIZE_MB,
    isAvatarSubmitting,
    avatarPendingAction,
    avatarErrorMessage,
    avatarSuccessMessage,
    avatarFileInputRef,
    openAvatarPicker,
    handleRemoveAvatar,
    handleAvatarFileChange,
    isAvatarCropModalOpen,
    closeAvatarCropModal,
    isAvatarCropSaving,
    isAvatarCropDragging,
    isAvatarCropResizing,
    avatarCropStageRef,
    avatarCropStageStyle,
    avatarCropSource,
    avatarCropImageSize,
    avatarCropImageStyle,
    avatarCropBoxStyle,
    handleAvatarCropPointerDown,
    handleAvatarCropPointerMove,
    endAvatarCropDrag,
    handleAvatarCropResizeStart,
    handleAvatarCropSave,
  };
}
