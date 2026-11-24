<template>
  <div
    class="custom-video-player"
    :class="{
      'is-fullscreen': isFullscreen,
      'is-fullscreen-rotated': isFullscreenRotated
    }"
    @click="handleSurfaceTap"
    @mousemove="revealTemporarily"
    @touchstart.passive="revealTemporarily"
  >
    <!-- The shared <video> element is moved into this host by playerVideo.js
         so going to/from the floating player never reloads the stream. -->
    <div ref="videoHost" class="custom-video-player__media"></div>

    <!-- Dark gradient overlay for readable controls -->
    <div
      class="custom-video-player__shade"
      :class="{ 'is-clear': isPlaying && !controlsVisible }"
    ></div>



    <!-- Error State Overlay -->
    <div v-if="hasError" class="custom-video-player__error-overlay" @click.stop>
      <i class="fa-solid fa-triangle-exclamation"></i>
      <span>{{ t('videoUnavailable') }}</span>
      <button class="ghost-button error-retry-btn" type="button" @click="retryLoading">
        <i class="fa-solid fa-rotate-right"></i> {{ t('retry') }}
      </button>
    </div>

    <!-- Top Action Bar -->
    <div
      class="custom-video-player__topbar"
      :class="{ 'is-hidden': isPlaying && !controlsVisible }"
      @click.stop
    >
      <div class="custom-video-player__top-left">
        <button class="control-icon control-icon--ghost" type="button" :aria-label="t('muteToggle')" @click="toggleMute">
          <i :class="isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high'"></i>
        </button>

        <button
          class="control-icon control-icon--ghost download-action-btn"
          :class="{ 'is-downloading': isDownloading, 'is-downloaded': isDownloaded }"
          type="button"
          :aria-label="isDownloaded ? t('removeOfflineDownload') : t('downloadLessonOffline')"
          :title="isDownloaded ? t('removeOfflineTip') : t('downloadLessonOffline')"
          @click.stop="$emit('download-click')"
        >
          <span v-if="isDownloading" class="download-spinner-wrap">
            <i class="fa-solid fa-circle-notch fa-spin"></i>
            <span class="download-pct-badge">{{ downloadPercent }}%</span>
          </span>
          <i v-else-if="isDownloaded" class="fa-solid fa-circle-check text-emerald"></i>
          <i v-else class="fa-solid fa-download"></i>
        </button>

        <div v-if="isOfflinePlayback" class="offline-pill">
          <i class="fa-solid fa-bolt"></i>
          <span>Offline Ready</span>
        </div>
      </div>

      <div class="custom-video-player__top-actions">
        <button class="control-icon control-icon--ghost" type="button" :aria-label="t('settings')" @click="toggleSettings">
          <i class="fa-solid fa-gear"></i>
        </button>
      </div>
    </div>

    <!-- Settings Menu Overlay -->
    <div
      v-if="showSettings"
      class="custom-video-player__settings"
      @click.stop
    >
      <div class="settings-panel">
        <div class="settings-panel__section">
          <strong>Playback Speed</strong>
          <div class="settings-panel__options">
            <button
              v-for="speed in speedOptions"
              :key="speed.value"
              class="settings-chip"
              :class="{ 'is-active': playbackSpeed === speed.value }"
              type="button"
              @click="setPlaybackSpeed(speed.value)"
            >
              {{ speed.label }}
            </button>
          </div>
        </div>

        <div class="settings-panel__section">
          <strong>Video Quality</strong>
          <div class="settings-panel__options">
            <button
              v-for="quality in qualityOptions"
              :key="quality.value"
              class="settings-chip"
              :class="{ 'is-active': selectedQuality === quality.value }"
              type="button"
              @click="setQuality(quality.value)"
            >
              {{ quality.label }}
            </button>
          </div>
          <small>Stream uses progressive range requests to play instantly.</small>
        </div>
      </div>
    </div>

    <!-- Center Transport Controls (Rewind 10s, Play/Pause, Forward 10s) -->
    <div
      class="custom-video-player__transport"
      :class="{ 'is-hidden': isPlaying && !controlsVisible && !isBuffering && !(isLoading && isPlaying) }"
      @click.stop
    >
      <button class="transport-button" type="button" :aria-label="t('rewind10')" @click="seekRelative(-10)">
        <i class="fa-solid fa-rotate-left"></i>
        <span class="transport-subtext">10</span>
      </button>
      <button
        class="transport-button transport-button--primary"
        :class="{ 'is-loading': isBuffering || (isLoading && isPlaying) }"
        type="button"
        :aria-label="isPlaying ? t('pause') : t('play')"
        @click="togglePlay"
      >
        <i v-if="isBuffering || (isLoading && isPlaying)" class="fa-solid fa-circle-notch fa-spin transport-loader-icon"></i>
        <i v-else :class="isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'"></i>
      </button>
      <button class="transport-button" type="button" :aria-label="t('forward10')" @click="seekRelative(10)">
        <i class="fa-solid fa-rotate-right"></i>
        <span class="transport-subtext">10</span>
      </button>
    </div>

    <!-- Bottom Controls & Multi-layer Progress Scrubber -->
    <div
      class="custom-video-player__footer"
      :class="{ 'is-hidden': isPlaying && !controlsVisible }"
      @click.stop
    >
      <!-- Timecode and Fullscreen bar -->
      <div class="custom-video-player__bottomline">
        <div class="custom-video-player__time-pill">
          <span class="time-current">{{ formatClock(currentTime) }}</span>
          <span class="time-sep">/</span>
          <span class="time-total">{{ formatClock(duration) }}</span>
        </div>

        <button
          class="control-icon control-icon--bottom"
          type="button"
          :aria-label="isFullscreen || isFullscreenRotated ? t('exitFullscreen') : t('fullscreen')"
          @click="toggleFullscreen"
        >
          <i :class="(isFullscreen || isFullscreenRotated) ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
        </button>
      </div>

      <!-- Scrubber container: Base track + Gray Loaded progress line + Played progress line + Interactive range knob -->
      <div
        class="custom-video-player__scrubber"
        @click="handleScrubberClick"
      >
        <!-- Dark base background track -->
        <div class="scrubber-track scrubber-track--base"></div>

        <!-- The Gray Line: Loaded / Buffered Progress -->
        <div
          class="scrubber-track scrubber-track--buffered"
          :style="{ width: `${bufferedPercent}%` }"
          :title="t('loadedBuffer')"
        ></div>

        <!-- The Brand Line: Played Progress -->
        <div
          class="scrubber-track scrubber-track--played"
          :style="{ width: `${progressPercent}%` }"
        ></div>

        <!-- Invisible range slider for smooth touch, mouse drag, and instant seeking -->
        <input
          ref="rangeInput"
          v-model.number="progressValue"
          class="custom-video-player__progress-slider"
          type="range"
          min="0"
          :max="Math.max(duration, 1)"
          step="0.1"
          :aria-label="t('seekPosition')"
          @input="handleProgressInput"
          @change="handleProgressChange"
          @mousedown="isDragging = true"
          @mouseup="isDragging = false"
          @touchstart.passive="isDragging = true"
          @touchend="isDragging = false"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { mountVideoInto, parkVideo, setVideoSrc } from '@/services/playerVideo';

// The shared video element lives outside Vue, so its events are wired here.
const VIDEO_EVENTS = {
  loadstart: 'handleLoadStart',
  loadedmetadata: 'handleLoadedMetadata',
  loadeddata: 'handleLoadedData',
  canplay: 'handleCanPlay',
  playing: 'handlePlaying',
  waiting: 'handleWaiting',
  seeking: 'handleSeeking',
  seeked: 'handleSeeked',
  progress: 'handleProgress',
  timeupdate: 'handleTimeUpdate',
  play: 'handlePlay',
  pause: 'handlePause',
  ended: 'handleEnded',
  error: 'handleError',
};

export default {
  name: 'CustomVideoPlayer',
  props: {
    src: {
      type: String,
      required: true,
    },
    poster: {
      type: String,
      default: '',
    },
    startAt: {
      type: Number,
      default: 0,
    },
    resumeFromMini: {
      type: Boolean,
      default: false,
    },
    isOffline: {
      type: Boolean,
      default: false,
    },
    isDownloaded: {
      type: Boolean,
      default: false,
    },
    isDownloading: {
      type: Boolean,
      default: false,
    },
    downloadPercent: {
      type: Number,
      default: 0,
    },
  },
  emits: ['loaded', 'canplay', 'timeupdate', 'ended', 'error', 'download-click', 'playing'],
  data() {
    return {
      videoEl: null,
      isPlaying: false,
      isMuted: false,
      controlsVisible: true,
      isLoading: true,
      isBuffering: false,
      hasLoadedFrame: false,
      hasError: false,
      showSettings: false,
      isFullscreen: false,
      isFullscreenRotated: false,
      playbackSpeed: 1,
      selectedQuality: 'auto',
      currentTime: 0,
      duration: 0,
      progressValue: 0,
      bufferedPercent: 0,
      isDragging: false,
      hideControlsTimer: null,
      loadingSafetyTimer: null,
      speedOptions: [
        { label: '0.75x', value: 0.75 },
        { label: '1x', value: 1 },
        { label: '1.25x', value: 1.25 },
        { label: '1.5x', value: 1.5 },
      ],
      qualityOptions: [
        { label: 'Auto', value: 'auto' },
        { label: '1080p', value: '1080p' },
        { label: '720p', value: '720p' },
        { label: '480p', value: '480p' },
      ],
    };
  },
  computed: {
    isOfflinePlayback() {
      return this.isOffline || Boolean(this.src && String(this.src).startsWith('blob:'));
    },
    progressPercent() {
      if (!this.duration || this.duration === 0) {
        return 0;
      }
      return Math.min(100, Math.max(0, (this.progressValue / this.duration) * 100));
    },
    shouldShowLoader() {
      if (this.hasError) return false;
      if (this.isPlaying && (this.isBuffering || this.isLoading)) return true;
      if (!this.isPlaying) {
        if (this.duration > 0 || this.hasLoadedFrame || this.currentTime > 0) return false;
        return this.isLoading;
      }
      return false;
    },
  },
  watch: {
    src() {
      this.resetPlayerState();
      setVideoSrc(this.src);
    },
    poster(value) {
      if (this.videoEl) this.videoEl.poster = value || '';
    },
    startAt(val) {
      if (val > 0 && !this.isPlaying && this.videoEl && this.videoEl.readyState >= 1) {
        this.seekTo(val);
      }
    },
  },
  mounted() {
    // Adopt the single shared video element — it may already be playing from
    // the floating player, in which case there is nothing to reload.
    const player = mountVideoInto(this.$refs.videoHost);
    this.videoEl = player;
    this._boundHandlers = {};
    Object.entries(VIDEO_EVENTS).forEach(([event, method]) => {
      const handler = (...args) => this[method](...args);
      this._boundHandlers[event] = handler;
      player.addEventListener(event, handler);
    });

    player.poster = this.poster || '';
    player.muted = this.isMuted;
    player.playbackRate = this.playbackSpeed || 1;
    setVideoSrc(this.src);

    if (player.readyState >= 1) {
      this.duration = Math.floor(player.duration || 0);
      this.currentTime = Math.floor(player.currentTime || 0);
      this.progressValue = player.currentTime || 0;
      this.isPlaying = !player.paused && !player.ended;
      this.isLoading = false;
      this.hasLoadedFrame = true;
      this.updateBufferedProgress();
    }
    // Safety fallback: Never stay stuck in loading state on idle player
    window.setTimeout(() => {
      this.isLoading = false;
    }, 1000);

    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
  },
  beforeUnmount() {
    window.clearTimeout(this.hideControlsTimer);
    window.clearTimeout(this.loadingSafetyTimer);

    const player = this.videoEl;
    if (player && this._boundHandlers) {
      Object.entries(this._boundHandlers).forEach(([event, handler]) => {
        player.removeEventListener(event, handler);
      });
      this._boundHandlers = null;
    }
    // Keep the element alive in the document while the mini player takes over.
    parkVideo();
    this.videoEl = null;

    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);

    try {
      ScreenOrientation.unlock();
    } catch (_) {}
    try {
      screen.orientation?.unlock?.();
    } catch (_) {}
  },
  methods: {
    resetPlayerState() {
      this.isPlaying = false;
      this.controlsVisible = true;
      this.isLoading = true;
      this.isBuffering = false;
      this.hasLoadedFrame = false;
      this.hasError = false;
      this.showSettings = false;
      this.currentTime = 0;
      this.duration = 0;
      this.progressValue = 0;
      this.bufferedPercent = 0;
      window.clearTimeout(this.hideControlsTimer);
      window.clearTimeout(this.loadingSafetyTimer);
    },
    handleSurfaceTap() {
      if (this.isPlaying) {
        this.controlsVisible = !this.controlsVisible;
        if (this.controlsVisible) {
          this.scheduleControlsHide();
        }
        return;
      }
      this.togglePlay();
    },
    revealTemporarily() {
      this.controlsVisible = true;
      this.scheduleControlsHide();
    },
    scheduleControlsHide() {
      window.clearTimeout(this.hideControlsTimer);
      if (!this.isPlaying) {
        return;
      }
      this.hideControlsTimer = window.setTimeout(() => {
        this.controlsVisible = false;
      }, 2400);
    },
    handleLoadStart() {
      this.isLoading = true;
      this.isBuffering = false;
      this.hasError = false;
      window.clearTimeout(this.loadingSafetyTimer);
      // Failsafe: Never stay stuck in loading state for more than 1200ms
      this.loadingSafetyTimer = window.setTimeout(() => {
        this.isLoading = false;
      }, 1200);
    },
    handleLoadedMetadata() {
      const player = this.videoEl;
      if (!player) return;

      this.duration = Math.floor(player.duration || 0);
      this.isLoading = false;
      this.isBuffering = false;
      this.hasLoadedFrame = true;
      window.clearTimeout(this.loadingSafetyTimer);

      // With a #t= media fragment the browser already starts at the saved
      // position — only seek explicitly when it ended up somewhere else.
      const needsSeek = this.startAt > 0
        && this.startAt < this.duration
        && Math.abs((player.currentTime || 0) - this.startAt) > 1;
      if (needsSeek) {
        player.currentTime = this.startAt;
        this.currentTime = Math.floor(this.startAt);
      } else {
        this.currentTime = Math.floor(player.currentTime || 0);
      }

      this.progressValue = this.currentTime;
      this.updateBufferedProgress();

      this.$emit('loaded', {
        currentTime: this.currentTime,
        duration: this.duration,
      });
    },
    handleLoadedData() {
      this.hasLoadedFrame = true;
      this.isLoading = false;
      this.updateBufferedProgress();
    },
    handleCanPlay() {
      this.hasLoadedFrame = true;
      this.isLoading = false;
      this.isBuffering = false;
      this.updateBufferedProgress();
      this.$emit('canplay');
    },
    handlePlaying() {
      this.isPlaying = true;
      this.isLoading = false;
      this.isBuffering = false;
      this.hasLoadedFrame = true;
      this.updateBufferedProgress();
      // Let the app dismiss any floating mini player when a new video starts.
      this.$emit('playing');
    },
    handleWaiting() {
      // Triggered when video needs to buffer the next chunk
      this.isBuffering = true;
    },
    handleSeeking() {
      this.isBuffering = true;
    },
    handleSeeked() {
      this.isBuffering = false;
      this.updateBufferedProgress();
    },
    handleProgress() {
      // Updates the gray loaded buffer line
      this.updateBufferedProgress();
    },
    updateBufferedProgress() {
      const player = this.videoEl;
      if (!player || !player.duration || isNaN(player.duration) || player.duration === 0) {
        return;
      }

      const buffered = player.buffered;
      if (!buffered || buffered.length === 0) {
        this.bufferedPercent = 0;
        return;
      }

      const current = player.currentTime || 0;
      let bufferedEnd = 0;

      // Find the loaded range containing current playback or maximum loaded range
      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= current && current <= buffered.end(i)) {
          bufferedEnd = buffered.end(i);
          break;
        }
        if (buffered.end(i) > bufferedEnd) {
          bufferedEnd = buffered.end(i);
        }
      }

      this.bufferedPercent = Math.min(100, Math.max(0, (bufferedEnd / player.duration) * 100));
    },
    handleTimeUpdate() {
      const player = this.videoEl;
      if (!player) return;

      this.currentTime = Math.floor(player.currentTime || 0);
      this.duration = Math.floor(player.duration || this.duration || 0);

      if (!this.isDragging) {
        this.progressValue = player.currentTime;
      }

      this.updateBufferedProgress();

      this.$emit('timeupdate', {
        currentTime: this.currentTime,
        duration: this.duration,
      });
    },
    handleEnded() {
      this.isPlaying = false;
      this.controlsVisible = true;
      this.$emit('ended', {
        currentTime: this.duration,
        duration: this.duration,
      });
    },
    handleError() {
      this.isLoading = false;
      this.isBuffering = false;
      this.hasError = true;
      this.controlsVisible = true;
      this.$emit('error');
    },
    retryLoading() {
      this.hasError = false;
      this.isLoading = true;
      const player = this.videoEl;
      if (player) {
        const savedTime = this.currentTime;
        player.load();
        player.currentTime = savedTime;
      }
    },
    handlePlay() {
      this.isPlaying = true;
      this.isLoading = false;
      this.isBuffering = false;
      this.controlsVisible = true;
      this.scheduleControlsHide();
    },
    handlePause() {
      this.isPlaying = false;
      this.controlsVisible = true;
      this.isBuffering = false;
      window.clearTimeout(this.hideControlsTimer);
    },
    async togglePlay() {
      const player = this.videoEl;
      if (!player) return;

      if (player.paused) {
        try {
          this.isPlaying = true;
          await player.play();
          this.isLoading = false;
          this.isBuffering = false;
          this.scheduleControlsHide();
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.warn('Playback error:', error);
          }
          this.isPlaying = !player.paused;
        }
      } else {
        player.pause();
        this.isPlaying = false;
        this.controlsVisible = true;
      }
    },
    async playVideo() {
      const player = this.videoEl;
      if (!player) return;
      try {
        this.isPlaying = true;
        await player.play();
        this.isLoading = false;
        this.scheduleControlsHide();
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.warn('Play error:', error);
        }
        this.isPlaying = !player.paused;
      }
    },
    pauseVideo() {
      const player = this.videoEl;
      if (player && !player.paused) {
        player.pause();
        this.isPlaying = false;
        this.controlsVisible = true;
      }
    },
    // Snapshot of the live playback state. Used by the course page to hand the
    // video off to the global picture-in-picture mini player when navigating
    // away, so it can resume at the exact same position.
    getPlaybackState() {
      const player = this.videoEl;
      if (!player) {
        return {
          isPlaying: false,
          paused: true,
          ended: false,
          currentTime: 0,
          duration: 0,
          muted: this.isMuted,
          playbackRate: this.playbackSpeed,
          src: this.src,
        };
      }
      return {
        // Trust the real element state — the local flag can briefly lag when
        // the page is navigated away from.
        isPlaying: !player.paused && !player.ended,
        paused: player.paused,
        ended: player.ended,
        currentTime: Number(player.currentTime || 0),
        duration: Number(player.duration || 0),
        muted: player.muted,
        playbackRate: Number(player.playbackRate || 1),
        src: this.src,
      };
    },
    toggleMute() {
      const player = this.videoEl;
      if (!player) return;
      player.muted = !player.muted;
      this.isMuted = player.muted;
    },
    toggleSettings() {
      this.showSettings = !this.showSettings;
      this.controlsVisible = true;
    },
    setPlaybackSpeed(speed) {
      const player = this.videoEl;
      this.playbackSpeed = speed;
      if (player) {
        player.playbackRate = speed;
      }
    },
    setQuality(quality) {
      this.selectedQuality = quality;
    },
    handleProgressInput() {
      const player = this.videoEl;
      if (!player) return;

      this.currentTime = Math.floor(this.progressValue);
      player.currentTime = this.progressValue;
      this.updateBufferedProgress();
    },
    handleProgressChange() {
      const player = this.videoEl;
      if (!player) return;

      player.currentTime = this.progressValue;
      this.currentTime = Math.floor(this.progressValue);
      this.updateBufferedProgress();

      if (this.isPlaying) {
        player.play().catch(() => {});
      }
    },
    handleScrubberClick(event) {
      if (event.target === this.$refs.rangeInput) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const targetTime = ratio * (this.duration || 1);
      this.seekTo(targetTime);
    },
    seekRelative(offset) {
      const player = this.videoEl;
      if (!player) return;

      const target = Math.max(0, Math.min(this.duration || 0, (player.currentTime || 0) + offset));
      player.currentTime = target;
      this.currentTime = Math.floor(target);
      this.progressValue = target;
      this.updateBufferedProgress();

      if (this.isPlaying) {
        player.play().catch(() => {});
      }
      this.revealTemporarily();
    },
    seekTo(seconds) {
      const player = this.videoEl;
      if (!player) return;

      const next = Math.max(0, Math.min(this.duration || 0, Number(seconds || 0)));
      player.currentTime = next;
      this.currentTime = Math.floor(next);
      this.progressValue = next;
      this.updateBufferedProgress();

      if (this.isPlaying) {
        player.play().catch(() => {});
      }
    },
    formatClock(seconds) {
      const safe = Math.max(0, Math.floor(Number(seconds || 0)));
      const hours = Math.floor(safe / 3600);
      const minutes = Math.floor((safe % 3600) / 60);
      const remainder = safe % 60;
      if (hours) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
      }
      return `${minutes}:${String(remainder).padStart(2, '0')}`;
    },
    async toggleFullscreen() {
      const container = this.$el;
      const video = this.videoEl;

      const isFs =
        Boolean(document.fullscreenElement) ||
        Boolean(document.webkitFullscreenElement) ||
        Boolean(document.mozFullScreenElement) ||
        this.isFullscreen ||
        this.isFullscreenRotated;

      if (!isFs) {
        this.isFullscreen = true;

        // 1. Lock physical orientation to landscape on mobile
        try {
          await ScreenOrientation.lock({ orientation: 'landscape' });
        } catch (_) {
          try {
            await screen.orientation?.lock?.('landscape');
          } catch (_) {
            // CSS fallback rotation if orientation lock is unavailable in browser
            this.isFullscreenRotated = true;
          }
        }

        // 2. Request native HTML fullscreen
        try {
          if (container.requestFullscreen) {
            await container.requestFullscreen();
          } else if (container.webkitRequestFullscreen) {
            await container.webkitRequestFullscreen();
          } else if (video?.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
          }
        } catch (fsErr) {
          console.warn('Native requestFullscreen failed, using CSS rotation:', fsErr);
          this.isFullscreenRotated = true;
        }
      } else {
        this.isFullscreen = false;
        this.isFullscreenRotated = false;

        // Unlock orientation back to portrait / auto
        try {
          await ScreenOrientation.unlock();
        } catch (_) {
          try {
            await screen.orientation?.unlock?.();
          } catch (_) {}
        }

        try {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
          } else if (document.mozCancelFullScreen) {
            await document.mozCancelFullScreen();
          }
        } catch (_) {}
      }
    },
    async handleFullscreenChange() {
      const isFs = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement
      );
      if (!isFs && this.isFullscreen && !this.isFullscreenRotated) {
        this.isFullscreen = false;
        try {
          await ScreenOrientation.unlock();
        } catch (_) {
          try {
            screen.orientation?.unlock?.();
          } catch (_) {}
        }
      }
    },
  },
};
</script>

<style scoped>
.custom-video-player {
  /* Control-bar surfaces — kept identical in light and dark mode so the
     player overlay always looks the same. */
  --vp-control-bg: rgba(15, 23, 42, 0.65);
  --vp-control-bg-strong: rgba(15, 23, 42, 0.78);
  --vp-control-border: rgba(255, 255, 255, 0.18);
  --vp-shade-top: rgba(15, 23, 42, 0.6);
  --vp-shade-bottom: rgba(15, 23, 42, 0.8);
  position: relative;
  overflow: hidden;
  min-height: 240px;
  border-radius: var(--radius-2xl, 28px);
  background: #020617;
  box-shadow: 0 20px 48px -10px rgba(15, 23, 42, 0.5);
  user-select: none;
}

.custom-video-player__media {
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 240px;
  max-height: 480px;
  display: block;
  overflow: hidden;
  background: #020617;
}

.custom-video-player__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, var(--vp-shade-top) 0%, rgba(15, 23, 42, 0.05) 40%, var(--vp-shade-bottom) 100%);
  pointer-events: none;
  transition: opacity 0.3s ease;
}

.custom-video-player__shade.is-clear {
  opacity: 0;
}

/* Centered Buffering / Loading Overlay */
.custom-video-player__loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 22px;
  border-radius: var(--radius-xl, 20px);
  background: rgba(15, 23, 42, 0.82);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  color: #ffffff;
  z-index: 5;
  pointer-events: none;
  animation: fadeIn 0.2s ease;
}

.custom-video-player__spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: var(--brand, #4f46e5);
  animation: player-spin 0.75s linear infinite;
}

.custom-video-player__loader-text {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgba(241, 245, 249, 0.9);
  text-transform: uppercase;
}

/* Error Overlay */
.custom-video-player__error-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgba(15, 23, 42, 0.9);
  color: #ffffff;
  z-index: 6;
  padding: 20px;
  text-align: center;
}

.custom-video-player__error-overlay i {
  font-size: 2rem;
  color: #f43f5e;
}

.error-retry-btn {
  margin-top: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-md, 12px);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.85rem;
}

/* Top Action Bar */
.custom-video-player__topbar {
  position: absolute;
  top: 14px;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 3;
}

.custom-video-player__top-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.offline-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-full, 9999px);
  background: rgba(16, 185, 129, 0.9);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.text-emerald {
  color: #10b981 !important;
}

.download-action-btn {
  flex-shrink: 0;
}

.download-action-btn.is-downloading {
  width: auto;
  min-width: 58px;
  padding: 0 8px;
  border-radius: var(--radius-full, 9999px);
  border-color: rgba(99, 102, 241, 0.6);
  background: rgba(99, 102, 241, 0.25);
}

.download-action-btn.is-downloaded {
  border-color: rgba(16, 185, 129, 0.4);
  background: rgba(16, 185, 129, 0.15);
}

.download-spinner-wrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #818cf8;
}

.download-pct-badge {
  font-size: 0.65rem;
  font-weight: 800;
  color: #e0e7ff;
}

.custom-video-player__top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-video-player__topbar.is-hidden,
.custom-video-player__transport.is-hidden,
.custom-video-player__footer.is-hidden {
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
}

/* Transport Controls */
.custom-video-player__transport {
  position: absolute;
  top: 50%;
  left: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  transform: translateY(-50%);
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 7;
}

.transport-button {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--vp-control-bg-strong);
  border: 1px solid var(--vp-control-border);
  color: #ffffff;
  font-size: 1.1rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.2s ease;
}

.transport-subtext {
  font-size: 0.62rem;
  font-weight: 800;
  line-height: 1;
  margin-top: 1px;
}

.transport-button--primary {
  width: 68px;
  height: 68px;
  font-size: 1.45rem;
  background: var(--brand-gradient, linear-gradient(135deg, #4f46e5, #6366f1));
  border: 2px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 10px 30px rgba(79, 70, 229, 0.55);
}

.transport-button--primary.is-loading {
  background: linear-gradient(135deg, var(--brand-deep, #4338ca), var(--brand, #4f46e5));
  box-shadow: 0 0 25px var(--brand-glow);
}

.transport-loader-icon {
  font-size: 1.6rem;
  color: #ffffff;
}

.transport-button:hover {
  transform: scale(1.08);
}

.transport-button:active,
.control-icon:active {
  transform: scale(0.94);
}

.control-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--vp-control-bg);
  border: 1px solid var(--vp-control-border);
  color: #ffffff;
  font-size: 0.9rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(12px);
  cursor: pointer;
  transition: all 0.2s ease;
}

.control-icon:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.control-icon--bottom {
  background: var(--vp-control-bg-strong);
}

/* Settings Menu */
.custom-video-player__settings {
  position: absolute;
  top: 64px;
  right: 16px;
  display: flex;
  justify-content: flex-end;
  z-index: 10;
}

.settings-panel {
  width: min(280px, 100%);
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: var(--radius-xl, 20px);
  background: rgba(15, 23, 42, 0.94);
  color: #ffffff;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.settings-panel__section {
  display: grid;
  gap: 8px;
}

.settings-panel__section strong {
  font-size: 0.85rem;
}

.settings-panel__section small {
  color: rgba(226, 232, 240, 0.7);
  font-size: 0.74rem;
  line-height: 1.4;
}

.settings-panel__options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.settings-chip {
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--radius-full, 9999px);
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-chip.is-active {
  background: var(--brand-gradient, linear-gradient(135deg, #4f46e5, #6366f1));
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* Footer & Scrubber */
.custom-video-player__footer {
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 12px;
  display: grid;
  gap: 8px;
  transition: opacity 0.25s ease, transform 0.25s ease;
  z-index: 3;
}

.custom-video-player__bottomline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.custom-video-player__time-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: var(--radius-full, 9999px);
  background: var(--vp-control-bg-strong);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
  border: 1px solid var(--vp-control-border);
}

.time-current {
  color: #ffffff;
}

.time-sep {
  color: rgba(255, 255, 255, 0.4);
}

.time-total {
  color: rgba(226, 232, 240, 0.75);
}

/* Scrubber Container */
.custom-video-player__scrubber {
  position: relative;
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
}

.scrubber-track {
  position: absolute;
  left: 0;
  height: 5px;
  border-radius: 999px;
  pointer-events: none;
  transition: height 0.15s ease;
}

.custom-video-player__scrubber:hover .scrubber-track {
  height: 7px;
}

/* 1. Base dark track */
.scrubber-track--base {
  width: 100%;
  background: rgba(255, 255, 255, 0.22);
}

/* 2. THE GRAY LINE: Loaded / Buffered chunk progress */
.scrubber-track--buffered {
  background: rgba(203, 213, 225, 0.58);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.15);
  transition: width 0.25s linear, height 0.15s ease;
}

/* 3. Played Progress (brand gradient line) */
.scrubber-track--played {
  background: var(--brand-gradient, linear-gradient(90deg, #4f46e5, #6366f1));
  z-index: 1;
  box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
  transition: height 0.15s ease;
}

/* 4. Interactive Range Slider Knob Overlay */
.custom-video-player__progress-slider {
  position: absolute;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  outline: none;
  cursor: pointer;
  z-index: 2;
}

.custom-video-player__progress-slider::-webkit-slider-runnable-track {
  background: transparent;
  border: none;
}

.custom-video-player__progress-slider::-moz-range-track {
  background: transparent;
  border: none;
}

.custom-video-player__progress-slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 0 3px var(--brand, #4f46e5), 0 2px 8px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.custom-video-player__progress-slider:active::-webkit-slider-thumb,
.custom-video-player__scrubber:hover .custom-video-player__progress-slider::-webkit-slider-thumb {
  transform: scale(1.25);
  box-shadow: 0 0 0 4px var(--brand, #4f46e5), 0 4px 12px rgba(99, 102, 241, 0.6);
}

.custom-video-player__progress-slider::-moz-range-thumb {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #ffffff;
  border: none;
  box-shadow: 0 0 0 3px var(--brand, #4f46e5), 0 2px 8px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: transform 0.15s ease;
}

@keyframes player-spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -46%); }
  to { opacity: 1; transform: translate(-50%, -50%); }
}

@media (max-width: 540px) {
  .transport-button {
    width: 44px;
    height: 44px;
    font-size: 0.95rem;
  }

  .transport-button--primary {
    width: 58px;
    height: 58px;
    font-size: 1.3rem;
  }

  .custom-video-player__transport {
    gap: 16px;
  }
}

/* Fullscreen styling for modern landscape playback */
.custom-video-player:fullscreen,
.custom-video-player:-webkit-full-screen {
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0 !important;
  background: #000000 !important;
  max-height: none !important;
  z-index: 999999 !important;
}

.custom-video-player:fullscreen .custom-video-player__media,
.custom-video-player:-webkit-full-screen .custom-video-player__media {
  width: 100% !important;
  height: 100% !important;
  max-height: 100vh !important;
  object-fit: contain !important;
}

/* CSS fallback rotation if device orientation lock is restricted */
.custom-video-player.is-fullscreen-rotated {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: 999999 !important;
  border-radius: 0 !important;
  background: #000000 !important;
  max-height: none !important;
}

.custom-video-player.is-fullscreen-rotated .custom-video-player__media {
  width: 100% !important;
  height: 100% !important;
  max-height: 100vh !important;
  object-fit: contain !important;
}
</style>
