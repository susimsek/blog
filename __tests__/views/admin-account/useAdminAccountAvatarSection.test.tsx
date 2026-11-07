import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { changeAdminAvatar, isAdminSessionError, resolveAdminError } from '@/lib/adminApi';
import useAdminAccountAvatarSection from '@/views/admin-account/useAdminAccountAvatarSection';
import type { AdminSessionProfile } from '@/lib/adminSessionProfileCache';
import type { TFunction } from 'i18next';

jest.mock('@/lib/adminApi', () => ({
  changeAdminAvatar: jest.fn(),
  isAdminSessionError: jest.fn(() => false),
  resolveAdminError: jest.fn((error: unknown) => ({
    kind: 'unknown',
    message: error instanceof Error ? error.message : '',
  })),
}));

let imageBehavior = { width: 520, height: 520, fail: false };

class TestImage {
  width = imageBehavior.width;
  height = imageBehavior.height;
  naturalWidth = imageBehavior.width;
  naturalHeight = imageBehavior.height;
  onload: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  set src(_value: string) {
    if (imageBehavior.fail) {
      this.onerror?.(new Event('error'));
    } else {
      this.onload?.(new Event('load'));
    }
  }
}

const makeParams = (overrides: Partial<Parameters<typeof useAdminAccountAvatarSection>[0]> = {}) => ({
  adminUser: { username: 'admin', avatarUrl: 'https://example.com/avatar.webp' } as AdminSessionProfile,
  successMessageAutoHideMs: 5000,
  syncAdminUser: jest.fn(),
  onSessionExpired: jest.fn(),
  t: ((key: string) => key) as TFunction,
  ...overrides,
});

const changeFileEvent = (file?: File) => {
  const input = { files: file ? [file] : [], value: 'selected-file' };
  return { event: { currentTarget: input } as unknown as React.ChangeEvent<HTMLInputElement>, input };
};

const pointerEvent = (currentTarget: HTMLElement, overrides: Record<string, number> = {}) =>
  ({
    currentTarget,
    pointerId: 7,
    clientX: 100,
    clientY: 100,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    ...overrides,
  }) as unknown as React.PointerEvent<HTMLDivElement>;

describe('useAdminAccountAvatarSection', () => {
  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;
  let originalImage: PropertyDescriptor | undefined;
  let canvasContext: { clearRect: jest.Mock; drawImage: jest.Mock };
  let getContext: jest.SpyInstance;
  let toDataURL: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    imageBehavior = { width: 520, height: 520, fail: false };
    jest.mocked(isAdminSessionError).mockReturnValue(false);
    jest.mocked(resolveAdminError).mockImplementation((error: unknown) => ({
      kind: 'unknown',
      message: error instanceof Error ? error.message : '',
    }));
    originalImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
    Object.defineProperty(globalThis, 'Image', { configurable: true, writable: true, value: TestImage });
    createObjectURL = jest.fn(() => 'blob:avatar-test');
    revokeObjectURL = jest.fn();
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
    canvasContext = { clearRect: jest.fn(), drawImage: jest.fn() };
    getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext as never);
    toDataURL = jest.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/webp;base64,AAAA');
  });

  afterEach(() => {
    getContext.mockRestore();
    toDataURL.mockRestore();
    if (originalImage) {
      Object.defineProperty(globalThis, 'Image', originalImage);
    }
  });

  it('rejects missing or unsupported files and accepts a valid image for cropping', async () => {
    const { result } = renderHook(() => useAdminAccountAvatarSection(makeParams()));
    const empty = changeFileEvent();
    await act(async () => result.current.handleAvatarFileChange(empty.event));
    expect(empty.input.value).toBe('selected-file');

    const unsupported = changeFileEvent(new File(['data'], 'avatar.gif', { type: 'image/gif' }));
    await act(async () => result.current.handleAvatarFileChange(unsupported.event));
    expect(result.current.avatarErrorMessage).toBe('adminAccount.profile.avatar.errors.invalidFormat');
    expect(unsupported.input.value).toBe('');

    const valid = changeFileEvent(new File(['data'], 'avatar.webp', { type: 'image/webp' }));
    await act(async () => result.current.handleAvatarFileChange(valid.event));
    expect(result.current.isAvatarCropModalOpen).toBe(true);
    expect(result.current.avatarCropSource).toBe('blob:avatar-test');
    expect(result.current.avatarCropImageSize).toEqual({ width: 520, height: 520 });
    expect(
      (result.current.avatarCropStageStyle as React.CSSProperties & { '--avatar-crop-mask-size': string })[
        '--avatar-crop-mask-size'
      ],
    ).toBe('260px');
    expect(valid.input.value).toBe('');
  });

  it('supports crop dragging and resizing, exports the crop and syncs the profile', async () => {
    const params = makeParams();
    const dispatch = jest.spyOn(globalThis, 'dispatchEvent');
    jest.mocked(changeAdminAvatar).mockResolvedValueOnce({ success: true } as never);
    const { result } = renderHook(() => useAdminAccountAvatarSection(params));
    imageBehavior = { width: 1040, height: 520, fail: false };
    const file = changeFileEvent(new File(['data'], 'avatar.png', { type: 'image/png' }));
    await act(async () => result.current.handleAvatarFileChange(file.event));

    const stage = document.createElement('div');
    let hasCapture = false;
    Object.assign(stage, {
      setPointerCapture: jest.fn(() => {
        hasCapture = true;
      }),
      hasPointerCapture: jest.fn(() => hasCapture),
      releasePointerCapture: jest.fn(() => {
        hasCapture = false;
      }),
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 260, height: 260 }),
    });
    result.current.avatarCropStageRef.current = stage;

    act(() =>
      result.current.handleAvatarCropPointerDown(pointerEvent(stage, { pointerId: 7, clientX: 100, clientY: 100 })),
    );
    expect(result.current.isAvatarCropDragging).toBe(true);
    act(() =>
      result.current.handleAvatarCropPointerMove(pointerEvent(stage, { pointerId: 8, clientX: 250, clientY: 250 })),
    );
    expect(result.current.avatarCropBoxStyle.transform).toContain('+ 0px');
    act(() =>
      result.current.handleAvatarCropPointerMove(pointerEvent(stage, { pointerId: 7, clientX: 150, clientY: 130 })),
    );
    expect(result.current.avatarCropBoxStyle.transform).toContain('+ 50px');
    act(() => result.current.endAvatarCropDrag(pointerEvent(stage, { pointerId: 8 })));
    expect(result.current.isAvatarCropDragging).toBe(true);
    act(() => result.current.endAvatarCropDrag(pointerEvent(stage, { pointerId: 7 })));
    expect(result.current.isAvatarCropDragging).toBe(false);

    const resizeTarget = document.createElement('button');
    act(() =>
      result.current.handleAvatarCropResizeStart(pointerEvent(resizeTarget, { clientX: 260, clientY: 150 }) as never),
    );
    expect(result.current.isAvatarCropResizing).toBe(true);
    const move = new Event('pointermove');
    Object.defineProperties(move, { pointerId: { value: 7 }, clientX: { value: 240 }, clientY: { value: 150 } });
    act(() => window.dispatchEvent(move));
    expect(
      (result.current.avatarCropStageStyle as React.CSSProperties & { '--avatar-crop-mask-size': string })[
        '--avatar-crop-mask-size'
      ],
    ).not.toBe('260px');
    const pointerUp = new Event('pointerup');
    Object.defineProperty(pointerUp, 'pointerId', { value: 7 });
    act(() => window.dispatchEvent(pointerUp));
    expect(result.current.isAvatarCropResizing).toBe(false);

    await act(async () => result.current.handleAvatarCropSave());
    expect(canvasContext.clearRect).toHaveBeenCalled();
    expect(canvasContext.drawImage).toHaveBeenCalled();
    expect(changeAdminAvatar).toHaveBeenCalledWith({ avatarUrl: 'data:image/webp;base64,AAAA' });
    expect(params.syncAdminUser).toHaveBeenCalledWith(
      expect.objectContaining({ avatarUrl: 'data:image/webp;base64,AAAA' }),
    );
    expect(result.current.isAvatarCropModalOpen).toBe(false);
    expect(result.current.avatarSuccessMessage).toBe('adminAccount.profile.avatar.success.updated');
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'admin:user-updated' }));
    dispatch.mockRestore();
  });

  it('reports invalid images, zero dimensions and oversized cropped output', async () => {
    const { result } = renderHook(() => useAdminAccountAvatarSection(makeParams()));
    imageBehavior.fail = true;
    const failed = changeFileEvent(new File(['data'], 'broken.png', { type: 'image/png' }));
    await act(async () => result.current.handleAvatarFileChange(failed.event));
    expect(result.current.avatarErrorMessage).toBe('adminAccount.profile.avatar.errors.invalidImage');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:avatar-test');

    imageBehavior = { width: 0, height: 0, fail: false };
    const zero = changeFileEvent(new File(['data'], 'zero.png', { type: 'image/png' }));
    await act(async () => result.current.handleAvatarFileChange(zero.event));
    expect(result.current.avatarErrorMessage).toBe('adminAccount.profile.avatar.errors.invalidImage');

    imageBehavior = { width: 520, height: 520, fail: false };
    const valid = changeFileEvent(new File(['data'], 'valid.png', { type: 'image/png' }));
    await act(async () => result.current.handleAvatarFileChange(valid.event));
    toDataURL.mockReturnValue(`data:image/webp;base64,${'A'.repeat(4_000_000)}`);
    await act(async () => result.current.handleAvatarCropSave());
    expect(result.current.avatarErrorMessage).toBe('adminAccount.profile.avatar.errors.invalidSize');
    expect(changeAdminAvatar).not.toHaveBeenCalled();
  });

  it('reports crop rendering and avatar update errors, removes avatars, and handles session expiry', async () => {
    const params = makeParams();
    const { result } = renderHook(() => useAdminAccountAvatarSection(params));
    const valid = changeFileEvent(new File(['data'], 'valid.png', { type: 'image/png' }));
    await act(async () => result.current.handleAvatarFileChange(valid.event));
    getContext.mockReturnValueOnce(null);
    await act(async () => result.current.handleAvatarCropSave());
    expect(result.current.avatarErrorMessage).toBe('adminAccount.profile.avatar.errors.invalidImage');

    getContext.mockReturnValue(canvasContext as never);
    jest.mocked(changeAdminAvatar).mockRejectedValueOnce(new Error('upload failed'));
    await act(async () => result.current.handleAvatarCropSave());
    expect(result.current.avatarErrorMessage).toBe('upload failed');

    jest.mocked(changeAdminAvatar).mockResolvedValueOnce({ success: true } as never);
    await act(async () => result.current.handleRemoveAvatar());
    expect(changeAdminAvatar).toHaveBeenCalledWith({ avatarUrl: null });
    expect(params.syncAdminUser).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: null }));

    jest.mocked(changeAdminAvatar).mockRejectedValueOnce(new Error('expired'));
    jest.mocked(isAdminSessionError).mockReturnValueOnce(true);
    await act(async () => result.current.handleRemoveAvatar());
    expect(params.onSessionExpired).toHaveBeenCalledTimes(1);

    act(() => result.current.closeAvatarCropModal());
    expect(result.current.isAvatarCropModalOpen).toBe(false);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:avatar-test');
  });
});
