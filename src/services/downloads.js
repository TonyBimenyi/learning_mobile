/**
 * Twige Academy Sandboxed Offline Storage Service
 * Stores video blobs and full course/lesson metadata inside private browser/app IndexedDB & localStorage.
 * Videos are NOT saved to the device's public filesystem, gallery, or downloads folder,
 * preventing external extraction or file sharing while allowing full in-app offline playback.
 */

import { getToken } from './storage';

const DB_NAME = 'twige_offline_vault';
const DB_VERSION = 2;
const STORE_NAME = 'offline_lessons';
const COURSE_STORE_NAME = 'offline_courses';

let dbPromise = null;
const activeDownloads = new Map(); // tracks ongoing downloads & progress callbacks
const activeProgress = new Map(); // tracks current progress percent

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get absolute base URL (from main.js window.__APP_BASE_URL__) */
function getBaseUrl() {
  return (window.__APP_BASE_URL__ || '').replace(/\/$/, '');
}

/** Resolve a possibly-relative video URL to absolute */
function resolveVideoUrl(url) {
  if (!url) return url;
  if (url.startsWith('http')) return url; // already absolute
  const base = getBaseUrl();
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

/** Build fetch headers with auth token + ngrok bypass */
function buildFetchHeaders() {
  const base = getBaseUrl();
  const isNgrok = base.includes('ngrok-free') || base.includes('ngrok.io') || base.includes('ngrok.app');
  const headers = new Headers();
  const token = getToken();
  if (token) headers.set('Authorization', `Token ${token}`);
  if (isNgrok) headers.set('ngrok-skip-browser-warning', 'true');
  return headers;
}

/** Validate the response is actually a video (not ngrok HTML warning or error page) */
function assertVideoResponse(response, url) {
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
  }
  const ct = (response.headers.get('content-type') || '').toLowerCase();
  // Accept video/*, octet-stream, and no content-type (some servers omit it)
  if (ct && !ct.startsWith('video/') && !ct.includes('octet-stream') && ct.startsWith('text/')) {
    throw new Error(
      'Download returned an HTML page instead of a video file. ' +
      'Check the server URL and ngrok configuration.'
    );
  }
}

/** Optionally cache an image URL as a data URL for offline display */
async function cacheImageAsDataUrl(url) {
  if (!url || url.startsWith('data:')) return url;
  try {
    const fullUrl = resolveVideoUrl(url);
    const resp = await fetch(fullUrl, { headers: buildFetchHeaders() });
    if (!resp.ok) return url;
    const blob = await resp.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || url);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (_) {
    return url;
  }
}

function getDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported on this platform.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'lessonId' });
        store.createIndex('courseId', 'courseId', { unique: false });
        store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(COURSE_STORE_NAME)) {
        db.createObjectStore(COURSE_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function emitDownloadsUpdate(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('twige:downloads-update', { detail }));
  }
}

export function formatBytes(bytes) {
  const size = Number(bytes || 0);
  if (size === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return `${parseFloat((size / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Uniform lesson identifier generator across all components
 */
export function getLessonIdentifier(courseId, lesson, fallbackIndex = 0) {
  if (!lesson) return '';
  if (lesson.lessonId) return String(lesson.lessonId);
  if (lesson.id) return String(lesson.id);
  const idx = lesson.lessonIndex !== undefined ? lesson.lessonIndex : fallbackIndex;
  return `${courseId}-${idx}`;
}

// ─── Course Details Offline Persistence ───────────────────────────────────────

/**
 * Save complete course snapshot for offline viewing (both IndexedDB & localStorage)
 */
export async function saveOfflineCourse(course) {
  if (!course || !course.id) return null;

  try {
    // Attempt to convert course thumbnail to data URL for guaranteed offline visibility
    let offlineThumb = course.thumbnail;
    try {
      offlineThumb = await cacheImageAsDataUrl(course.thumbnail);
    } catch (_) {}

    const courseRecord = {
      id: String(course.id),
      title: course.title || 'Course',
      thumbnail: offlineThumb || course.thumbnail,
      originalThumbnail: course.thumbnail,
      description: course.description || '',
      instructor: course.instructor || 'Twige Academy',
      duration: course.duration || '',
      level: course.level || 'All levels',
      category: course.category || 'General',
      rating: course.rating || 4.8,
      price: course.price || 0,
      skills: Array.isArray(course.skills) ? course.skills : [],
      curriculum: (course.curriculum || []).map((l, idx) => ({
        id: l.id || `${course.id}-${idx}`,
        lessonId: l.lessonId || `${course.id}-${idx}`,
        title: l.title || l.lessonTitle || `Lesson ${idx + 1}`,
        duration: l.duration || 'Video',
        type: l.type || 'Video',
        videoKey: l.videoKey || '',
        videoUrl: l.videoUrl || '',
        streamUrl: l.streamUrl || '',
        youtubeId: l.youtubeId || '',
        description: l.description || '',
        lessonIndex: idx,
      })),
      lessonsCount: (course.curriculum || []).length || course.lessonsCount || 0,
      savedAt: new Date().toISOString(),
    };

    // 1. Save in IndexedDB
    try {
      const db = await getDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(COURSE_STORE_NAME, 'readwrite');
        const store = tx.objectStore(COURSE_STORE_NAME);
        const req = store.put(courseRecord);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (dbErr) {
      console.warn('IndexedDB saveOfflineCourse failed, relying on localStorage', dbErr);
    }

    // 2. Synchronous fallback in localStorage
    try {
      localStorage.setItem(`twige_course_meta_${course.id}`, JSON.stringify(courseRecord));
    } catch (_) {}

    return courseRecord;
  } catch (err) {
    console.error('Failed to save offline course details:', err);
    return null;
  }
}

/**
 * Retrieve saved course details for offline use
 */
export async function getOfflineCourse(courseId) {
  if (!courseId) return null;
  const idStr = String(courseId);

  // 1. Try IndexedDB
  try {
    const db = await getDB();
    const result = await new Promise((resolve) => {
      const tx = db.transaction(COURSE_STORE_NAME, 'readonly');
      const store = tx.objectStore(COURSE_STORE_NAME);
      const req = store.get(idStr);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
    if (result) return result;
  } catch (_) {}

  // 2. Try localStorage synchronous cache
  try {
    const cached = localStorage.getItem(`twige_course_meta_${idStr}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  // 3. Fallback: Reconstruct minimal course from any saved offline lesson record
  try {
    const db = await getDB();
    const lessonResult = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('courseId');
      const req = index.getAll(idStr);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    if (lessonResult.length > 0) {
      const first = lessonResult[0];
      if (first.courseSnapshot) return first.courseSnapshot;

      return {
        id: idStr,
        title: first.courseTitle || 'Offline Course',
        thumbnail: first.courseThumbnail || '',
        instructor: 'Twige Academy',
        duration: '',
        level: 'All levels',
        category: 'General',
        rating: 4.8,
        price: 0,
        curriculum: lessonResult.map((item, idx) => ({
          lessonId: item.lessonId,
          title: item.lessonTitle || `Lesson ${idx + 1}`,
          duration: item.duration || 'Video',
          type: 'Video',
          lessonIndex: item.lessonIndex ?? idx,
        })),
        lessonsCount: lessonResult.length,
      };
    }
  } catch (_) {}

  return null;
}

// ─── Lesson Download Methods ──────────────────────────────────────────────────

/**
 * Check if a lesson is downloaded for offline playback
 */
export async function isLessonDownloaded(lessonId) {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(String(lessonId));
      req.onsuccess = () => resolve(Boolean(req.result));
      req.onerror = () => resolve(false);
    });
  } catch (error) {
    return false;
  }
}

/**
 * Get all downloaded lesson IDs for a specific course
 */
export async function getCourseDownloadedLessonIds(courseId) {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('courseId');
      const req = index.getAll(String(courseId));
      req.onsuccess = () => {
        const ids = (req.result || []).map((item) => String(item.lessonId));
        resolve(ids);
      };
      req.onerror = () => resolve([]);
    });
  } catch (error) {
    return [];
  }
}

/**
 * Get offline record with blob
 */
export async function getDownloadedLesson(lessonId) {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(String(lessonId));
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (error) {
    return null;
  }
}

/**
 * Creates a private in-memory object URL for offline playback
 */
export async function getOfflinePlaybackUrl(lessonId) {
  const record = await getDownloadedLesson(lessonId);
  if (!record || !record.videoBlob) return null;
  return URL.createObjectURL(record.videoBlob);
}

/**
 * Get all downloaded lessons (without full blobs for performance)
 */
export async function getAllDownloads() {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const list = (req.result || []).map((item) => ({
          lessonId: item.lessonId,
          courseId: item.courseId,
          courseTitle: item.courseTitle,
          courseThumbnail: item.courseThumbnail,
          lessonTitle: item.lessonTitle,
          lessonIndex: item.lessonIndex,
          duration: item.duration,
          fileSize: item.fileSize,
          fileSizeLabel: item.fileSizeLabel,
          downloadedAt: item.downloadedAt,
          mimeType: item.mimeType,
        }));
        resolve(list.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt)));
      };
      req.onerror = () => resolve([]);
    });
  } catch (error) {
    return [];
  }
}

/**
 * Calculate total offline storage usage
 */
export async function getTotalOfflineStorageUsage() {
  const list = await getAllDownloads();
  const totalBytes = list.reduce((sum, item) => sum + (item.fileSize || 0), 0);
  return {
    totalBytes,
    totalFormatted: formatBytes(totalBytes),
    count: list.length,
  };
}

/**
 * Download lesson video and save securely to sandboxed storage with full course metadata
 */
export async function downloadLessonVideo(lesson, course, onProgress = null) {
  const lessonIndex = lesson.lessonIndex !== undefined ? lesson.lessonIndex : 0;
  const lessonId = getLessonIdentifier(course.id, lesson, lessonIndex);

  // Determine best URL: prefer streamUrl (same origin proxy, avoiding browser CORS restrictions)
  let videoUrl = lesson.streamUrl;
  if (!videoUrl && lesson.videoKey) {
    videoUrl = `/api/videos/stream/?key=${encodeURIComponent(lesson.videoKey)}`;
  }
  if (!videoUrl) {
    videoUrl = lesson.videoUrl || lesson.source;
  }

  if (!videoUrl) {
    throw new Error('No video source available for this lesson.');
  }

  // Resolve to absolute URL — critical on Android APK where relative URLs
  // resolve to localhost (the Capacitor WebView) instead of the real server.
  videoUrl = resolveVideoUrl(videoUrl);
  const altUrl = lesson.videoUrl ? resolveVideoUrl(lesson.videoUrl) : null;

  // Prevent duplicate simultaneous downloads
  if (activeDownloads.has(lessonId)) {
    return activeDownloads.get(lessonId);
  }

  const downloadPromise = (async () => {
    try {
      activeProgress.set(lessonId, 0);
      emitDownloadsUpdate({ lessonId, status: 'downloading', percent: 0 });

      // Save complete course metadata and thumbnail offline in parallel
      saveOfflineCourse(course).catch(() => {});

      let response;
      try {
        response = await fetch(videoUrl, { headers: buildFetchHeaders() });
      } catch (fetchErr) {
        if (altUrl && videoUrl !== altUrl) {
          response = await fetch(altUrl, { headers: buildFetchHeaders() });
        } else {
          throw fetchErr;
        }
      }

      // If initial response was not ok (e.g., 404/502) and an alternative videoUrl exists, try it as fallback
      if (!response.ok && altUrl && videoUrl !== altUrl) {
        try {
          const fallbackResp = await fetch(altUrl, { headers: buildFetchHeaders() });
          if (fallbackResp.ok) {
            response = fallbackResp;
          }
        } catch (_) {
          // ignore fallback error and report original
        }
      }

      // Validate: throws if response is an HTML error page (e.g. ngrok warning)
      assertVideoResponse(response, videoUrl);

      const contentLength = Number(response.headers.get('content-length')) || 0;
      const reader = response.body ? response.body.getReader() : null;
      let blob;

      if (reader && contentLength) {
        const chunks = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          const percent = Math.min(100, Math.round((received / contentLength) * 100));

          activeProgress.set(lessonId, percent);
          if (onProgress) onProgress(percent);
          emitDownloadsUpdate({ lessonId, status: 'downloading', percent });
        }

        const mimeType = response.headers.get('content-type') || 'video/mp4';
        blob = new Blob(chunks, { type: mimeType });
      } else {
        // Fallback if streaming body or content-length is absent
        blob = await response.blob();
        activeProgress.set(lessonId, 100);
        if (onProgress) onProgress(100);
      }

      const db = await getDB();
      const fileSize = blob.size;
      const fileSizeLabel = formatBytes(fileSize);

      const courseSnapshot = {
        id: String(course.id),
        title: course.title,
        thumbnail: course.thumbnail,
        description: course.description,
        instructor: course.instructor,
        duration: course.duration,
        level: course.level,
        category: course.category,
        rating: course.rating,
        price: course.price,
        curriculum: course.curriculum,
      };

      const record = {
        lessonId,
        courseId: String(course.id),
        courseTitle: course.title,
        courseThumbnail: course.thumbnail,
        lessonTitle: lesson.title || lesson.lessonTitle,
        lessonIndex,
        duration: lesson.duration || 'Video',
        videoBlob: blob, // sandboxed binary blob inside origin database
        fileSize,
        fileSizeLabel,
        mimeType: blob.type || 'video/mp4',
        courseSnapshot,
        lessonSnapshot: {
          title: lesson.title || lesson.lessonTitle,
          duration: lesson.duration || 'Video',
          description: lesson.description || '',
          lessonIndex,
        },
        downloadedAt: new Date().toISOString(),
      };

      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });

      emitDownloadsUpdate({ lessonId, status: 'completed', record });
      return record;
    } catch (err) {
      emitDownloadsUpdate({ lessonId, status: 'error', error: err.message });
      throw err;
    } finally {
      activeDownloads.delete(lessonId);
      activeProgress.delete(lessonId);
    }
  })();

  activeDownloads.set(lessonId, downloadPromise);
  return downloadPromise;
}

/**
 * Delete a downloaded lesson from sandboxed storage
 */
export async function deleteDownloadedLesson(lessonId) {
  try {
    const db = await getDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(String(lessonId));
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
    emitDownloadsUpdate({ lessonId, status: 'deleted' });
    return true;
  } catch (error) {
    console.error('Failed to delete offline lesson:', error);
    return false;
  }
}

/**
 * Remove all downloaded lessons
 */
export async function clearAllDownloads() {
  try {
    const db = await getDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
    emitDownloadsUpdate({ status: 'cleared' });
    return true;
  } catch (error) {
    console.error('Failed to clear downloads:', error);
    return false;
  }
}

/**
 * Check if a download is currently running
 */
export function isDownloading(lessonId) {
  return activeDownloads.has(String(lessonId));
}

/**
 * Get active download progress percentage (0 - 100) or null if not downloading
 */
export function getActiveDownloadPercent(lessonId) {
  return activeProgress.get(String(lessonId)) ?? null;
}
