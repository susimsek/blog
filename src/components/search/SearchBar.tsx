import React, { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

interface SearchBarProps {
  query: string;
  onChange: (query: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  showShortcutHint?: boolean;
  expanded?: boolean;
  controlsId?: string;
  activeDescendantId?: string;
}

export default function SearchBar({
  query,
  onChange,
  onKeyDown,
  className,
  inputRef,
  showShortcutHint = false,
  expanded = false,
  controlsId,
  activeDescendantId,
}: Readonly<SearchBarProps>) {
  const { t } = useTranslation('common');
  const shortcutHint = React.useMemo(() => {
    if (typeof navigator === 'undefined') {
      return { modifier: 'Ctrl', key: 'K' };
    }

    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    const platform = (nav.userAgentData?.platform ?? nav.platform ?? '').toLowerCase();
    const isApplePlatform = /(mac|iphone|ipad|ipod)/.test(platform);
    return { modifier: isApplePlatform ? '⌘' : 'Ctrl', key: 'K' };
  }, []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <div className={`search-bar w-100 d-flex align-items-center ${className ?? ''}`}>
      <div className="search-icon">
        <FontAwesomeIcon icon="search" />
      </div>
      <input
        ref={inputRef}
        type="text"
        className="search-input form-control"
        placeholder={t('common.searchBar.placeholder')}
        value={query}
        onChange={handleInputChange}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={controlsId}
        aria-activedescendant={activeDescendantId}
      />
      {showShortcutHint && !query && (
        <span className="search-shortcut-hint" data-testid="search-shortcut-hint" aria-hidden="true">
          <kbd>{shortcutHint.modifier}</kbd>
          <kbd>{shortcutHint.key}</kbd>
        </span>
      )}
      {query && (
        <button
          type="button"
          className="search-clear-btn border-0 bg-transparent"
          onClick={handleClear}
          aria-label={t('common.searchBar.clear')}
        >
          <FontAwesomeIcon icon="times-circle" className="clear-icon" />
        </button>
      )}
    </div>
  );
}
