/**
 * Twige Academy Sandboxed Offline Storage Service
 * Stores video blobs and full course/lesson metadata inside private browser/app IndexedDB & localStorage.
 * Videos are NOT saved to the device's public filesystem, gallery, or downloads folder,
 * preventing external extraction or file sharing while allowing full in-app offline playback.
 */

import { getApiBaseUrl, getToken } from './storage';

const DB_NAME = 'twige_offline_vault';
const DB_VERSION = 2;
const STORE_NAME = 'offline_lessons';
const COURSE_STORE_NAME = 'offline_courses';

let dbPromise = null;
const activeDownloads = new Map(); // tracks ongoing downloads & progress callbacks
const activeProgress = new Map(); // tracks current progress percent
const activeControllers = new Map(); // AbortControllers used to cancel a running download

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Get absolute base URL (from main.js window.__APP_BASE_URL__) */
function getBaseUrl() {
  return getApiBaseUrl();
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

    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('IndexedDB open timed out'));
      }
    }, 1500);

    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onblocked = () => {
        console.warn('IndexedDB upgrade blocked');
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(new Error('IndexedDB blocked'));
        }
      };

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

      request.onsuccess = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(request.result);
        }
      };

      request.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(request.error || new Error('IndexedDB error'));
        }
      };
    } catch (e) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(e);
      }
    }
  }).catch((err) => {
    dbPromise = null;
    throw err;
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

  // 1. Try localStorage synchronous cache FIRST (0ms, guaranteed non-blocking)
  try {
    const cached = localStorage.getItem(`twige_course_meta_${idStr}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  // 2. Try IndexedDB with safe timeout
  try {
    const db = await Promise.race([
      getDB(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 800)),
    ]);
    if (db && db.objectStoreNames.contains(COURSE_STORE_NAME)) {
      const result = await new Promise((resolve) => {
        const tx = db.transaction(COURSE_STORE_NAME, 'readonly');
        const store = tx.objectStore(COURSE_STORE_NAME);
        const req = store.get(idStr);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
      if (result) return result;
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
  if (!lessonId) return false;
  const idStr = String(lessonId);

  // Quick synchronous check
  try {
    const raw = localStorage.getItem('twige_downloaded_lesson_ids');
    if (raw) {
      const list = JSON.parse(raw);
      if (list.includes(idStr)) return true;
    }
  } catch (_) {}

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(idStr);
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
      req.onsuccess = () => {
        const item = req.result;
        if (item) {
          if (!item.videoBlob && item.videoBuffer) {
            item.videoBlob = new Blob([item.videoBuffer], { type: item.mimeType || 'video/mp4' });
          }
        }
        resolve(item || null);
      };
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
  if (!record) return null;
  if (record.videoBlob instanceof Blob) {
    return URL.createObjectURL(record.videoBlob);
  }
  if (record.videoBuffer) {
    const blob = new Blob([record.videoBuffer], { type: record.mimeType || 'video/mp4' });
    return URL.createObjectURL(blob);
  }
  return null;
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

  const controller = new AbortController();
  activeControllers.set(lessonId, controller);

  const downloadPromise = (async () => {
    try {
      activeProgress.set(lessonId, 0);
      emitDownloadsUpdate({ lessonId, status: 'downloading', percent: 0 });

      // Save complete course metadata and thumbnail offline in parallel
      saveOfflineCourse(course).catch(() => {});

      let response;
      try {
        response = await fetch(videoUrl, { headers: buildFetchHeaders(), signal: controller.signal });
      } catch (fetchErr) {
        if (controller.signal.aborted) throw fetchErr;
        if (altUrl && videoUrl !== altUrl) {
          response = await fetch(altUrl, { headers: buildFetchHeaders(), signal: controller.signal });
        } else {
          throw fetchErr;
        }
      }

      // If initial response was not ok (e.g., 404/502) and an alternative videoUrl exists, try it as fallback
      if (!response.ok && altUrl && videoUrl !== altUrl) {
        try {
          const fallbackResp = await fetch(altUrl, { headers: buildFetchHeaders(), signal: controller.signal });
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
          if (controller.signal.aborted) throw new DOMException('Download cancelled', 'DownloadCancelledError');
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

      // Sanitize snapshots to plain objects (eliminates Vue reactive proxy DataCloneError in IndexedDB)
      let cleanCourseSnapshot = null;
      try {
        cleanCourseSnapshot = JSON.parse(JSON.stringify({
          id: String(course.id),
          title: String(course.title || ''),
          thumbnail: String(course.thumbnail || ''),
          description: String(course.description || ''),
          instructor: String(course.instructor || 'Twige Academy'),
          duration: String(course.duration || ''),
          level: String(course.level || 'All levels'),
          category: String(course.category || 'General'),
          rating: Number(course.rating || 4.8),
          price: Number(course.price || 0),
          curriculum: Array.isArray(course.curriculum) ? course.curriculum : [],
        }));
      } catch (_) {}

      let cleanLessonSnapshot = null;
      try {
        cleanLessonSnapshot = JSON.parse(JSON.stringify({
          title: String(lesson.title || lesson.lessonTitle || 'Lesson'),
          duration: String(lesson.duration || 'Video'),
          description: String(lesson.description || ''),
          lessonIndex: Number(lessonIndex),
        }));
      } catch (_) {}

      // Convert blob to ArrayBuffer (guaranteed 100% cloneable in every IndexedDB implementation)
      let arrayBuffer = null;
      try {
        arrayBuffer = await blob.arrayBuffer();
      } catch (_) {}

      const record = {
        lessonId: String(lessonId),
        courseId: String(course.id),
        courseTitle: String(course.title || 'Course'),
        courseThumbnail: String(course.thumbnail || ''),
        lessonTitle: String(lesson.title || lesson.lessonTitle || 'Lesson'),
        lessonIndex: Number(lessonIndex),
        duration: String(lesson.duration || 'Video'),
        videoBlob: blob,
        videoBuffer: arrayBuffer,
        fileSize,
        fileSizeLabel,
        mimeType: blob.type || 'video/mp4',
        courseSnapshot: cleanCourseSnapshot,
        lessonSnapshot: cleanLessonSnapshot,
        downloadedAt: new Date().toISOString(),
      };

      try {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(record);

          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
          tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
          req.onerror = () => reject(req.error || new Error('Store put failed'));
        });
      } catch (putErr) {
        console.warn('Initial store.put with Blob failed, retrying with ArrayBuffer only:', putErr);
        // If storing with videoBlob threw DataCloneError, retry with only videoBuffer
        const fallbackRecord = { ...record };
        delete fallbackRecord.videoBlob;

        await new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          const req = store.put(fallbackRecord);

          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error || new Error('Transaction failed'));
          tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
          req.onerror = () => reject(req.error || new Error('Store put failed'));
        });
      }

      // Save to localStorage for instant synchronous fast lookup
      try {
        const raw = localStorage.getItem('twige_downloaded_lesson_ids') || '[]';
        const list = JSON.parse(raw);
        if (!list.includes(String(lessonId))) {
          list.push(String(lessonId));
          localStorage.setItem('twige_downloaded_lesson_ids', JSON.stringify(list));
        }
      } catch (_) {}

      emitDownloadsUpdate({ lessonId, status: 'completed', record });
      return record;
    } catch (err) {
      if (controller.signal.aborted || err?.name === 'DownloadCancelledError') {
        const cancelled = new DOMException('Download cancelled', 'DownloadCancelledError');
        emitDownloadsUpdate({ lessonId, status: 'cancelled' });
        throw cancelled;
      }
      emitDownloadsUpdate({ lessonId, status: 'error', error: err.message });
      throw err;
    } finally {
      activeDownloads.delete(lessonId);
      activeProgress.delete(lessonId);
      activeControllers.delete(lessonId);
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

    try {
      const raw = localStorage.getItem('twige_downloaded_lesson_ids') || '[]';
      const list = JSON.parse(raw).filter((id) => id !== String(lessonId));
      localStorage.setItem('twige_downloaded_lesson_ids', JSON.stringify(list));
    } catch (_) {}

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

    try {
      localStorage.removeItem('twige_downloaded_lesson_ids');
    } catch (_) {}

    emitDownloadsUpdate({ status: 'cleared' });
    return true;
  } catch (error) {
    console.error('Failed to clear downloads:', error);
    return false;
  }
}

/**
 * Cancel a running download. Returns true if a download was in progress.
 */
export function cancelLessonDownload(lessonId) {
  const controller = activeControllers.get(String(lessonId));
  if (!controller) return false;
  controller.abort();
  return true;
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
