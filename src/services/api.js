import { clearAuth, getApiBaseUrl, getGuestId, getToken, saveAuth, getStoredUser } from './storage';

// ─── Base URL ────────────────────────────────────────────────────────────────
// Set in main.js via window.__APP_BASE_URL__
// '' = local (Vite proxy → :8000) | 'https://...' = any remote server
// ─────────────────────────────────────────────────────────────────────────────
function getBaseUrl() {
  return getApiBaseUrl();
}

/** Build a full media/asset URL from a relative path. */
export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = getBaseUrl();
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

async function request(path, options = {}) {
  const base = getBaseUrl();
  const isNgrok = base.includes('ngrok-free') || base.includes('ngrok.io');

  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) headers.set('Authorization', `Token ${token}`);
  // Identifies likes coming from a guest (not logged-in) install.
  headers.set('X-Guest-Id', getGuestId());

  // Bypass ngrok browser warning page
  if (isNgrok) headers.set('ngrok-skip-browser-warning', 'true');

  const controller = new AbortController();
  const timeoutMs = options.timeout || 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${base}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (fetchErr) {
    if (fetchErr.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw fetchErr;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;
    let message = fallbackMessage;
    try {
      const payload = await response.json();
      message = payload.error || payload.detail || fallbackMessage;
    } catch (_) {
      // Non-JSON error body — keep the status-based message.
    }
    const error = new Error(String(message));
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;

  return response.json();
}


export async function getHomepageContent() {
  return request('/api/homepage/');
}

export async function getCourses() {
  try {
    const list = await request('/api/courses/');
    if (Array.isArray(list) && list.length > 0) {
      try {
        localStorage.setItem('twige_cached_all_courses', JSON.stringify(list));
      } catch (_) {}
    }
    return list;
  } catch (err) {
    try {
      const cached = localStorage.getItem('twige_cached_all_courses');
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    throw err;
  }
}

export async function getCourse(id) {
  try {
    const course = await request(`/api/courses/${id}/`);
    if (course && course.id) {
      try {
        localStorage.setItem(`twige_course_meta_${course.id}`, JSON.stringify(course));
      } catch (_) {}
    }
    return course;
  } catch (err) {
    // Instant fallback if network request fails or times out
    try {
      const cachedCourse = localStorage.getItem(`twige_course_meta_${id}`);
      if (cachedCourse) return JSON.parse(cachedCourse);

      const allCached = localStorage.getItem('twige_cached_all_courses');
      if (allCached) {
        const list = JSON.parse(allCached);
        const match = list.find((c) => String(c.id) === String(id));
        if (match) return match;
      }
    } catch (_) {}
    throw err;
  }
}

export async function getDiscussions(courseId) {
  return request(`/api/discussions/?course=${encodeURIComponent(courseId)}`);
}

export async function createDiscussion(payload) {
  return request('/api/discussions/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function replyToDiscussion(discussionId, text) {
  return request(`/api/discussions/${discussionId}/reply/`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function updateDiscussion(discussionId, payload) {
  return request(`/api/discussions/${encodeURIComponent(discussionId)}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteDiscussion(discussionId) {
  return request(`/api/discussions/${encodeURIComponent(discussionId)}/`, {
    method: 'DELETE',
  });
}

export async function likeDiscussion(discussionId) {
  return request(`/api/discussions/${discussionId}/like/`, {
    method: 'POST',
    body: JSON.stringify({ guestId: getGuestId() }),
  });
}

export async function getReviews(courseId) {
  return request(`/api/reviews/?course=${encodeURIComponent(courseId)}`);
}

export async function createReview(payload) {
  return request('/api/reviews/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function respondToReview(reviewId, text) {
  return request(`/api/reviews/${reviewId}/respond/`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function likeReview(reviewId) {
  return request(`/api/reviews/${reviewId}/like/`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getCurrentUser() {
  try {
    const user = await request('/api/auth/me/');
    saveAuth({ user });
    return user;
  } catch (error) {
    if (error?.status === 401 || String(error?.message || '').includes('401')) {
      clearAuth();
      return null;
    }
    return getStoredUser();
  }
}

export async function loginUser(payload) {
  const auth = await request('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  saveAuth({
    token: auth?.token,
    user: auth,
  });
  return auth;
}

export async function registerUser(payload) {
  const auth = await request('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  saveAuth({
    token: auth?.token,
    user: auth,
  });
  return auth;
}

export async function getEnrollments() {
  // Callers already handle failures; surface the error so auth issues aren't
  // silently reported as "no enrollment" (which would prompt users to pay twice).
  return request('/api/enrollments/');
}

export async function startAfripayCheckout(payload) {
  return request('/api/payments/afripay/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProfile(userId, payload) {
  const user = await request(`/api/users/${userId}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  saveAuth({ user });
  return user;
}
