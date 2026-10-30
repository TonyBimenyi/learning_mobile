import { getSettings, saveSettings } from './storage';

/**
 * Applies the selected theme ('light', 'dark', or 'system') to the document root and body.
 */
export function applyTheme(theme) {
  let isDark = false;
  if (theme === 'dark') {
    isDark = true;
  } else if (theme === 'light') {
    isDark = false;
  } else {
    // 'system' mode
    isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  const root = document.documentElement;
  if (root) {
    if (isDark) {
      root.setAttribute('data-theme', 'dark');
      root.classList.add('dark-mode');
      document.body?.classList?.add('dark-mode');
    } else {
      root.setAttribute('data-theme', 'light');
      root.classList.remove('dark-mode');
      document.body?.classList?.remove('dark-mode');
    }
  }

  // Update mobile browser status-bar theme color
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme && typeof document !== 'undefined') {
    metaTheme = document.createElement('meta');
    metaTheme.name = 'theme-color';
    document.head.appendChild(metaTheme);
  }
  if (metaTheme) {
    metaTheme.setAttribute('content', isDark ? '#090D16' : '#F8FAFC');
  }

  return isDark;
}

/**
 * Initializes the theme on application bootstrap and sets up system preference listeners.
 */
export function initTheme() {
  const settings = getSettings();
  applyTheme(settings.theme || 'light');

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      const current = getSettings();
      if (current.theme === 'system') {
        applyTheme('system');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemChange);
    }
  }

  window.addEventListener('twige:update', (event) => {
    if (!event.detail || event.detail.scope === 'settings') {
      const current = getSettings();
      applyTheme(current.theme || 'light');
    }
  });
}

/**
 * Manually updates and saves the theme.
 */
export function setTheme(theme) {
  saveSettings({ theme });
  return applyTheme(theme);
}
