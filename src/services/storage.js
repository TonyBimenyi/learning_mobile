const APP_KEYS = {
  settings: 'twige_settings',
  progress: 'twige_progress',
  user: 'twige_user',
  token: 'twige_token',
  serverUrl: 'twige_server_url',
};

const defaultSettings = {
  language: 'en',
  theme: 'light',
  autoplayPreviews: true,
  notifyNewCourses: true,
  wifiDownloadsOnly: true,
};

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

function writeJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function emitUpdate(scope) {
  window.dispatchEvent(new CustomEvent('twige:update', { detail: { scope } }));
}

export function getSettings() {
  return {
    ...defaultSettings,
    ...readJson(APP_KEYS.settings, {}),
  };
}

export function saveSettings(patch) {
  const nextSettings = {
    ...getSettings(),
    ...patch,
  };
  writeJson(APP_KEYS.settings, nextSettings);
  emitUpdate('settings');
  return nextSettings;
}

export function getToken() {
  return window.localStorage.getItem(APP_KEYS.token) || '';
}

export function saveAuth(payload) {
  if (payload?.token) {
    window.localStorage.setItem(APP_KEYS.token, payload.token);
  }
  if (payload?.user) {
    writeJson(APP_KEYS.user, payload.user);
  }
  emitUpdate('auth');
}

export function clearAuth() {
  window.localStorage.removeItem(APP_KEYS.token);
  window.localStorage.removeItem(APP_KEYS.user);
  emitUpdate('auth');
}

export function getStoredUser() {
  return readJson(APP_KEYS.user, null);
}

export function getProgressMap() {
  return readJson(APP_KEYS.progress, {});
}

export function seedDemoProgress(courses) {
  const current = getProgressMap();
  if (Object.keys(current).length || !(courses || []).length) {
    return current;
  }

  const demo = {};
  (courses || []).slice(0, 2).forEach((course, courseIndex) => {
    const lesson = (course.curriculum || []).find((item) => item.type === 'video');
    if (!lesson) {
      return;
    }
    const key = `${course.id}-0`;
    demo[key] = {
      key,
      courseId: course.id,
      courseTitle: course.title,
      courseThumbnail: course.thumbnail,
      lessonIndex: 0,
      lessonTitle: lesson.title,
      durationLabel: lesson.duration || '12:00',
      progressPercent: courseIndex === 0 ? 48 : 82,
      seconds: courseIndex === 0 ? 420 : 1220,
      youtubeId: lesson.youtubeId || '',
      updatedAt: new Date().toISOString(),
    };
  });

  writeJson(APP_KEYS.progress, demo);
  return demo;
}

export function saveLessonProgress(entry) {
  const current = getProgressMap();
  current[entry.key] = {
    ...(current[entry.key] || {}),
    ...entry,
    updatedAt: new Date().toISOString(),
  };
  writeJson(APP_KEYS.progress, current);
  emitUpdate('progress');
  return current[entry.key];
}

export function clearProgress() {
  window.localStorage.removeItem(APP_KEYS.progress);
  emitUpdate('progress');
}

export function getContinueWatchingList() {
  return Object.values(getProgressMap()).sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function clearCache() {
  Object.values(APP_KEYS).forEach((key) => window.localStorage.removeItem(key));
  emitUpdate('cache');
}

// ─── Custom Server URL ───────────────────────────────────────────────────────
/** Returns the custom server base URL set by the user, or null if not set. */
export function getCustomBaseUrl() {
  return window.localStorage.getItem(APP_KEYS.serverUrl) || null;
}

/** Saves a custom server base URL. Pass null or empty string to reset to default. */
export function saveCustomBaseUrl(url) {
  const cleaned = (url || '').trim().replace(/\/$/, '');
  if (cleaned) {
    window.localStorage.setItem(APP_KEYS.serverUrl, cleaned);
  } else {
    window.localStorage.removeItem(APP_KEYS.serverUrl);
  }
  emitUpdate('serverUrl');
}
