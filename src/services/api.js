import { clearAuth, getToken, saveAuth, getStoredUser } from './storage';

// ─── Base URL ────────────────────────────────────────────────────────────────
// Set in main.js via window.__APP_BASE_URL__
// '' = local (Vite proxy → :8000) | 'https://...' = any remote server
// ─────────────────────────────────────────────────────────────────────────────
function getBaseUrl() {
  return (window.__APP_BASE_URL__ || '').replace(/\/$/, '');
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

  // Bypass ngrok browser warning page
  if (isNgrok) headers.set('ngrok-skip-browser-warning', 'true');

  const response = await fetch(`${base}${path}`, { ...options, headers });

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      throw new Error(payload.error || payload.detail || fallbackMessage);
    } catch (error) {
      if (error instanceof Error && error.message !== 'Unexpected end of JSON input') {
        throw error;
      }
      throw new Error(fallbackMessage);
    }
  }

  if (response.status === 204) return null;

  return response.json();
}


export async function getHomepageContent() {
  return request('/api/homepage/');
}

export async function getCourses() {
  return request('/api/courses/');
}

export async function getCourse(id) {
  return request(`/api/courses/${id}/`);
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

export async function likeDiscussion(discussionId) {
  return request(`/api/discussions/${discussionId}/like/`, {
    method: 'POST',
    body: JSON.stringify({}),
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
    if (error instanceof Error && String(error.message).includes('401')) {
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

export async function getEnrollments() {
  try {
    return await request('/api/enrollments/');
  } catch (error) {
    return [];
  }
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
