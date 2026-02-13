import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VoiceToggler from '@/components/voice/VoiceToggler';
import { setVoiceEnabled } from '@/reducers/voice';
import { useAppDispatch, useAppSelector } from '@/config/store';

const useAppDispatchMock = useAppDispatch as unknown as jest.Mock;
const useAppSelectorMock = useAppSelector as unknown as jest.Mock;

jest.mock('@/config/store', () => ({
  useAppDispatch: jest.fn(),
  useAppSelector: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key: string) => key),
  })),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className }: { icon: string; className?: string }) => (
    <span data-testid={`font-awesome-icon-${icon}`} className={className} />
  ),
}));

describe('VoiceToggler', () => {
  const mockDispatch = jest.fn();
  const mockPlay = jest.fn().mockResolvedValue(undefined);
  const mockState = {
    voice: { isEnabled: true },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as typeof globalThis & { Audio: jest.Mock }).Audio = jest.fn().mockImplementation(() => ({
      currentTime: 0,
      play: mockPlay,
      pause: jest.fn(),
      volume: 1,
      playbackRate: 1,
      preload: 'auto',
    }));
    useAppDispatchMock.mockReturnValue(mockDispatch);
    useAppSelectorMock.mockImplementation((selector: (state: typeof mockState) => unknown) => selector(mockState));
    mockState.voice.isEnabled = true;
  });

  it('renders enabled state label and icon', () => {
    render(<VoiceToggler />);

    expect(screen.getByRole('button', { name: /common.header.voice.enabled/i })).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-volume-high')).toBeInTheDocument();
  });

  it('renders disabled state label and icon', () => {
    mockState.voice.isEnabled = false;
    render(<VoiceToggler />);

    expect(screen.getByRole('button', { name: /common.header.voice.disabled/i })).toBeInTheDocument();
    expect(screen.getByTestId('font-awesome-icon-volume-xmark')).toBeInTheDocument();
  });

  it('plays disable sound and dispatches disabled when turning off', () => {
    mockState.voice.isEnabled = true;
    render(<VoiceToggler />);

    const button = screen.getByRole('button', { name: /common.header.voice.enabled/i });
    fireEvent.click(button);

    expect(global.Audio).toHaveBeenCalledWith('/sounds/disable-sound.mp3');
    expect(mockDispatch).toHaveBeenCalledWith(setVoiceEnabled(false));
  });

  it('plays enable sound and dispatches enabled when turning on', () => {
    mockState.voice.isEnabled = false;
    render(<VoiceToggler />);

    const button = screen.getByRole('button', { name: /common.header.voice.disabled/i });
    fireEvent.click(button);

    expect(global.Audio).toHaveBeenCalledWith('/sounds/enable-sound.mp3');
    expect(mockDispatch).toHaveBeenCalledWith(setVoiceEnabled(true));
  });

  it('renders boop classes on voice icon button', () => {
    render(<VoiceToggler />);

    const button = screen.getByRole('button', { name: /common.header.voice.enabled/i });
    expect(button).toHaveClass('nav-icon-boop');
    expect(screen.getByTestId('font-awesome-icon-volume-high')).toHaveClass('icon-boop-target');
  });
});
