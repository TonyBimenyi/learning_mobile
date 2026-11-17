<template>
  <transition name="pip">
    <div
      v-if="state.active"
      ref="pipRef"
      class="pip-player"
      :style="pipStyle"
      @pointerdown="onPointerDown"
    >
      <!-- The same <video> element from the lesson player is moved in here. -->
      <div ref="videoHost" class="pip-player__video"></div>

      <!-- Top gradient bar: lesson title + close -->
      <div class="pip-player__top">
        <span class="pip-player__title">{{ state.title }}</span>
        <button
          class="pip-btn pip-btn--close"
          type="button"
          :aria-label="t('closeMiniPlayer')"
          @pointerdown.stop
          @click.stop="close"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Bottom control bar -->
      <div class="pip-player__bottom">
        <button
          class="pip-btn"
          type="button"
          :aria-label="isPlaying ? t('pause') : t('play')"
          @pointerdown.stop
          @click.stop="togglePlay"
        >
          <i :class="isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
        </button>
        <div class="pip-player__progress">
          <div class="pip-player__progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <button
          class="pip-btn"
          type="button"
          :aria-label="t('returnToLesson')"
          :title="t('returnToLesson')"
          @pointerdown.stop
          @click.stop="expand"
        >
          <i class="fa-solid fa-expand"></i>
        </button>
      </div>

      <!-- Simple error state -->
      <div v-if="hasError" class="pip-player__error">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>{{ t('playbackUnavailable') }}</span>
        <button type="button" @pointerdown.stop @click.stop="close">{{ t('dismiss') }}</button>
      </div>
    </div>
  </transition>
</template>

<script>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  clearResumeOnReturn,
  getMiniPlayerState,
  requestResumeOnReturn,
  stopMiniPlayer,
  updateMiniPlayerProgress,
} from '@/services/miniPlayer';
import { mountVideoInto, parkVideo, setVideoSrc } from '@/services/playerVideo';
import { saveLessonProgress } from '@/services/storage';

export default {
  name: 'MiniVideoPlayer',
  setup() {
    const router = useRouter();
    const state = getMiniPlayerState();
    const pipRef = ref(null);
    const videoHost = ref(null);
    const video = ref(null);
    const isPlaying = ref(false);
    const hasError = ref(false);
    const currentTime = ref(0);
    const playingDuration = ref(0);
    const lastPersisted = ref(-1);

    const progressPercent = computed(() => {
      const d = playingDuration.value || state.duration || 0;
      if (!d) return 0;
      return Math.min(100, Math.max(0, (currentTime.value / d) * 100));
    });

    // ── Dragging (touch + mouse) ──────────────────────────────────────────────
    const drag = reactive({ x: 0, y: 0, dragging: false, moved: false, sx: 0, sy: 0, ox: 0, oy: 0 });
    // Drag offsets are exposed as CSS variables so the enter/leave transition
    // can animate the window (scale + slide) without fighting an inline transform.
    const pipStyle = computed(() => ({
      '--pip-x': `${drag.x}px`,
      '--pip-y': `${drag.y}px`,
    }));
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    function onPointerDown(event) {
      if (event.target.closest('button')) return;
      drag.dragging = true;
      drag.moved = false;
      drag.sx = event.clientX;
      drag.sy = event.clientY;
      drag.ox = drag.x;
      drag.oy = drag.y;
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    }

    function onPointerMove(event) {
      if (!drag.dragging) return;
      const dx = event.clientX - drag.sx;
      const dy = event.clientY - drag.sy;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) drag.moved = true;
      const el = pipRef.value;
      const w = el?.offsetWidth || 200;
      const h = el?.offsetHeight || 150;
      drag.x = clamp(drag.ox + dx, -(window.innerWidth - w - 24), 8);
      drag.y = clamp(drag.oy + dy, -(window.innerHeight - h - 150), 40);
    }

    function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      if (!drag.dragging) return;
      drag.dragging = false;
      // A tap (no real movement) returns to the full lesson player.
      if (!drag.moved) expand();
    }

    // ── Progress persistence ──────────────────────────────────────────────────
    function persistProgress(force = false) {
      const player = video.value;
      const meta = state.meta || {};
      if (!meta.lessonKey) return;
      const time = Math.floor(player?.currentTime ?? currentTime.value ?? 0);
      const duration = Math.floor(player?.duration ?? playingDuration.value ?? state.duration ?? 0);
      if (!force && lastPersisted.value >= 0 && Math.abs(time - lastPersisted.value) < 5) {
        return;
      }
      lastPersisted.value = time;
      const pct = duration ? Math.min(100, Math.round((time / duration) * 100)) : 0;
      saveLessonProgress({
        key: meta.lessonKey,
        courseId: meta.courseId ?? state.courseId,
        courseTitle: meta.courseTitle || '',
        courseThumbnail: meta.courseThumbnail || '',
        lessonIndex: meta.lessonIndex ?? state.lessonIndex,
        lessonTitle: meta.lessonTitle || state.title,
        durationLabel: meta.durationLabel || '',
        progressPercent: pct,
        seconds: time,
        youtubeId: meta.youtubeId || '',
      });
    }

    // ── Shared element wiring ─────────────────────────────────────────────────
    let boundHandlers = null;

    function attachVideo(player) {
      boundHandlers = [
        ['loadedmetadata', onLoadedMetadata],
        ['timeupdate', onTimeUpdate],
        ['play', () => { isPlaying.value = true; }],
        ['pause', () => { isPlaying.value = false; }],
        ['ended', onEnded],
        ['error', onError],
      ];
      boundHandlers.forEach(([event, handler]) => player.addEventListener(event, handler));
    }

    function detachVideo(player) {
      if (boundHandlers && player) {
        boundHandlers.forEach(([event, handler]) => player.removeEventListener(event, handler));
      }
      boundHandlers = null;
    }

    // ── Playback startup (streaming sources need a few retries) ───────────────
    let playRetryTimer = null;
    let playAttempts = 0;

    function stopPlayRetries() {
      window.clearTimeout(playRetryTimer);
      playAttempts = 0;
    }

    function startPlayback() {
      const player = video.value;
      if (!player || !state.active) return;
      const duration = Number.isFinite(player.duration) && player.duration > 0
        ? player.duration
        : Infinity;
      const target = Math.min(Math.max(0, state.startAt || 0), duration);
      if (Math.abs((player.currentTime || 0) - target) > 1) {
        try {
          player.currentTime = target;
        } catch (_) {}
      }
      currentTime.value = Math.floor(player.currentTime || target);
      playingDuration.value = Math.floor(player.duration || 0);

      stopPlayRetries();
      const tryPlay = () => {
        if (!state.active || !video.value) return;
        const result = player.play();
        if (result && typeof result.catch === 'function') {
          result.catch(() => {
            // Remote streams often reject play() while the first chunks load.
            if (state.active && playAttempts < 12) {
              playAttempts += 1;
              playRetryTimer = window.setTimeout(tryPlay, 500);
            }
          });
        }
      };
      tryPlay();
    }

    // ── Video events ──────────────────────────────────────────────────────────
    function onLoadedMetadata() {
      const player = video.value;
      if (!player) return;
      playingDuration.value = Math.floor(player.duration || 0);
      hasError.value = false;
      if (state.active && player.paused) startPlayback();
    }

    function onTimeUpdate() {
      const player = video.value;
      if (!player) return;
      currentTime.value = Math.floor(player.currentTime || 0);
      playingDuration.value = Math.floor(player.duration || playingDuration.value || 0);
      updateMiniPlayerProgress(player.currentTime, player.duration);
      persistProgress(false);
    }

    function onEnded() {
      isPlaying.value = false;
      persistProgress(true);
      close();
    }

    function onError() {
      hasError.value = true;
      isPlaying.value = false;
    }

    function togglePlay() {
      const player = video.value;
      if (!player || hasError.value) return;
      if (player.paused) {
        player.play().catch(() => {});
      } else {
        player.pause();
      }
    }

    // ── Handoff setup: whenever a new session starts, resume at the saved time ─
    watch(
      () => [state.active, state.session],
      async () => {
        if (!state.active) {
          stopPlayRetries();
          detachVideo(video.value);
          // Park — never unload. The next player will adopt this same element.
          parkVideo();
          video.value = null;
          return;
        }
        await nextTick();
        const host = videoHost.value;
        if (!host) return;
        const player = mountVideoInto(host);
        video.value = player;
        detachVideo(player);
        attachVideo(player);

        hasError.value = false;
        lastPersisted.value = -1;
        player.muted = state.muted;
        player.playbackRate = state.playbackRate || 1;
        setVideoSrc(state.src);

        isPlaying.value = !player.paused && !player.ended;
        currentTime.value = Math.floor(player.currentTime || 0);
        playingDuration.value = Math.floor(player.duration || 0);

        if (player.readyState >= 1) {
          startPlayback();
        } else {
          player.addEventListener('loadedmetadata', startPlayback, { once: true });
        }
        // A retry hook for streams that fire canplay after metadata.
        player.addEventListener('canplay', startPlayback, { once: true });
      },
      { immediate: true }
    );

    // ── Actions ───────────────────────────────────────────────────────────────
    function expand() {
      const player = video.value;
      if (player) {
        updateMiniPlayerProgress(player.currentTime, player.duration);
        persistProgress(true);
        // No pause and no mute: this exact element is adopted by the full
        // player in a moment, so playback simply carries on.
      }
      const id = state.courseId;
      const lessonIndex = state.lessonIndex;
      requestResumeOnReturn();
      // If the full player never starts, don't leave a stale resume request.
      window.setTimeout(clearResumeOnReturn, 15000);
      if (id) {
        router.push({
          name: 'course-details',
          params: { id },
          query: { lessonIndex },
        });
      }
    }

    function close() {
      const player = video.value;
      if (player) {
        updateMiniPlayerProgress(player.currentTime, player.duration);
        persistProgress(false);
        player.pause();
      }
      stopMiniPlayer();
    }

    onBeforeUnmount(() => {
      stopPlayRetries();
      detachVideo(video.value);
      parkVideo();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    });

    return {
      state,
      pipRef,
      videoHost,
      video,
      isPlaying,
      hasError,
      progressPercent,
      pipStyle,
      onPointerDown,
      onLoadedMetadata,
      onTimeUpdate,
      onEnded,
      onError,
      togglePlay,
      expand,
      close,
    };
  },
};
</script>

<style scoped>
.pip-player {
  position: fixed;
  right: 16px;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 100px);
  z-index: 200;
  width: min(210px, 48vw);
  border-radius: 16px;
  overflow: hidden;
  background: #020617;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 18px 40px -8px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(99, 102, 241, 0.25);
  touch-action: none;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  transform: translate(var(--pip-x, 0px), var(--pip-y, 0px));
  transform-origin: bottom right;
}

.pip-player:active {
  cursor: grabbing;
}

/* Short glow pulse when the window pops in */
.pip-player::after {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  pointer-events: none;
  animation: pip-glow 1.1s ease-out 1;
}

@keyframes pip-glow {
  0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.55), 0 0 22px rgba(99, 102, 241, 0.55); }
  100% { box-shadow: 0 0 0 16px rgba(99, 102, 241, 0), 0 0 0 rgba(99, 102, 241, 0); }
}

.pip-player__video {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  background: #020617;
  transition: transform 0.4s ease;
}

.pip-player__top,
.pip-player__bottom {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  pointer-events: none;
}

.pip-player__top {
  top: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), transparent);
}

.pip-player__bottom {
  bottom: 0;
  background: linear-gradient(0deg, rgba(15, 23, 42, 0.94), transparent);
}

.pip-player__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #ffffff;
  font-size: 0.7rem;
  font-weight: 700;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.7);
}

.pip-btn {
  pointer-events: auto;
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 0.72rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.pip-btn:active {
  transform: scale(0.92);
}

.pip-btn--close {
  background: rgba(244, 63, 94, 0.85);
  border-color: rgba(255, 255, 255, 0.3);
}

.pip-player__progress {
  pointer-events: none;
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.28);
  overflow: hidden;
}

.pip-player__progress-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--brand-gradient, linear-gradient(90deg, #4f46e5, #6366f1));
  transition: width 0.2s linear;
}

.pip-player__error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.92);
  color: #ffffff;
  font-size: 0.72rem;
  text-align: center;
  padding: 8px;
}

.pip-player__error i {
  font-size: 1.2rem;
  color: #f43f5e;
}

.pip-player__error button {
  pointer-events: auto;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
}

/* Entrance / exit animation — scales up from the bottom-right corner on open
   and shrinks/fades away on close. Drag offsets are preserved via CSS vars. */
.pip-enter-active {
  transition:
    opacity 0.28s ease,
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pip-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.28s cubic-bezier(0.4, 0, 1, 1);
}

.pip-enter-from {
  opacity: 0;
  transform: translate(var(--pip-x, 0px), calc(var(--pip-y, 0px) + 60px)) scale(0.5);
}

.pip-leave-to {
  opacity: 0;
  transform: translate(var(--pip-x, 0px), calc(var(--pip-y, 0px) + 36px)) scale(0.68);
}

.pip-enter-from .pip-player__video {
  transform: scale(1.2);
}

/* Dark mode: keep the floating control bar readable against dark pages */
:root[data-theme="dark"] .pip-player,
body.dark-mode .pip-player {
  border-color: var(--line-strong);
  box-shadow: 0 18px 40px -8px rgba(0, 0, 0, 0.8), 0 0 0 1px var(--brand-glow);
}

:root[data-theme="dark"] .pip-player__top,
body.dark-mode .pip-player__top {
  background: linear-gradient(180deg, rgba(9, 13, 22, 0.95), transparent);
}

:root[data-theme="dark"] .pip-player__bottom,
body.dark-mode .pip-player__bottom {
  background: linear-gradient(0deg, rgba(9, 13, 22, 0.96), transparent);
}

:root[data-theme="dark"] .pip-btn,
body.dark-mode .pip-btn {
  background: rgba(30, 41, 59, 0.92);
  border-color: var(--line-strong);
}

:root[data-theme="dark"] .pip-btn:hover,
body.dark-mode .pip-btn:hover {
  background: var(--brand-soft);
  color: var(--brand-light);
}
</style>
