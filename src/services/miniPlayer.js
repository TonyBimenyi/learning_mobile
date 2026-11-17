/**
 * Picture-in-Picture (mini player) shared state.
 *
 * The app has no global store (no Pinia/Vuex), so this tiny reactive module is
 * the single source of truth shared between the course player (hands the video
 * off when you navigate away) and the global <MiniVideoPlayer> mounted in
 * App.vue (keeps playing in the bottom-right corner across route changes).
 */
import { reactive } from 'vue';

function isBlobUrl(url) {
  return typeof url === 'string' && url.startsWith('blob:');
}

const state = reactive({
  active: false,
  // Incremented on every start so the player can tell a "new" session from a
  // simple progress update even when the video src string stays identical.
  session: 0,
  src: '',
  poster: '',
  title: '',
  subtitle: '',
  courseId: '',
  lessonIndex: 0,
  startAt: 0,
  duration: 0,
  muted: false,
  playbackRate: 1,
  isOffline: false,
  // Offline blob URLs are created by CourseDetailsPage. Whoever owns the
  // mini player is responsible for revoking it when the handoff ends.
  revokeOnClose: false,
  // Set when the user taps the mini player to return to the lesson. Tells the
  // freshly mounted course page to resume playback instead of showing a paused
  // video.
  resumeOnReturn: false,
  // Metadata used to persist progress while playing in the mini player.
  meta: {
    lessonKey: '',
    courseId: '',
    courseTitle: '',
    courseThumbnail: '',
    lessonIndex: 0,
    lessonTitle: '',
    durationLabel: '',
    youtubeId: '',
  },
});

export function getMiniPlayerState() {
  return state;
}

export function startMiniPlayer(payload = {}) {
  // If a previous offline blob was ours, release it before replacing it.
  if (state.active && state.revokeOnClose && isBlobUrl(state.src)) {
    try {
      URL.revokeObjectURL(state.src);
    } catch (_) {}
  }

  Object.assign(state, {
    active: true,
    session: state.session + 1,
    src: payload.src || '',
    poster: payload.poster || '',
    title: payload.title || 'Lesson',
    subtitle: payload.subtitle || '',
    courseId: payload.courseId ?? '',
    lessonIndex: Number(payload.lessonIndex || 0),
    startAt: Math.max(0, Number(payload.startAt || 0)),
    duration: Math.max(0, Number(payload.duration || 0)),
    muted: Boolean(payload.muted),
    playbackRate: Number(payload.playbackRate || 1),
    isOffline: Boolean(payload.isOffline),
    revokeOnClose: Boolean(payload.revokeOnClose),
    resumeOnReturn: false,
    meta: { ...(payload.meta || {}) },
  });
}

export function updateMiniPlayerProgress(time, duration) {
  state.startAt = Math.max(0, Number(time || 0));
  if (duration && Number.isFinite(Number(duration))) {
    state.duration = Math.max(0, Number(duration));
  }
}

export function stopMiniPlayer() {
  if (state.revokeOnClose && isBlobUrl(state.src)) {
    try {
      URL.revokeObjectURL(state.src);
    } catch (_) {}
  }
  state.active = false;
  state.src = '';
  state.revokeOnClose = false;
}

export function isMiniPlayerForCourse(courseId) {
  return state.active && String(state.courseId) === String(courseId);
}

/** Ask the next course page to continue playing when it opens. */
export function requestResumeOnReturn() {
  state.resumeOnReturn = true;
}

/** Read + clear the resume request (called once by the course page setup). */
export function consumeResumeOnReturn() {
  const shouldResume = state.resumeOnReturn;
  state.resumeOnReturn = false;
  return shouldResume;
}
