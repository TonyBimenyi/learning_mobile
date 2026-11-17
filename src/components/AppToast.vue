<template>
  <transition name="app-toast">
    <div
      v-if="state.visible"
      :key="state.id"
      class="app-toast"
      :class="`app-toast--${state.tone}`"
      role="status"
      aria-live="polite"
    >
      <span class="app-toast__icon"><i :class="icon"></i></span>
      <div class="app-toast__body">
        <strong>{{ t(title) }}</strong>
        <span>{{ state.message }}</span>
      </div>
      <button class="app-toast__close" type="button" :aria-label="t('closeNotification')" @click="hideToast">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <span
        class="app-toast__progress"
        :style="{ animationDuration: `${state.duration}ms` }"
      ></span>
    </div>
  </transition>
</template>

<script>
import { computed } from 'vue';
import { getToastState, hideToast } from '@/services/toast';

const TONES = {
  success: { icon: 'fa-solid fa-circle-check', title: 'toastDone' },
  error: { icon: 'fa-solid fa-circle-exclamation', title: 'toastError' },
  warning: { icon: 'fa-solid fa-triangle-exclamation', title: 'toastWarning' },
  info: { icon: 'fa-solid fa-circle-info', title: 'toastInfo' },
};

export default {
  name: 'AppToast',
  setup() {
    const state = getToastState();
    const icon = computed(() => (TONES[state.tone] || TONES.info).icon);
    const title = computed(() => (TONES[state.tone] || TONES.info).title);
    return { state, icon, title, hideToast };
  },
};
</script>

<style scoped>
.app-toast {
  --toast-color: var(--brand-light);
  --toast-soft: var(--brand-soft);
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 16px);
  left: 50%;
  z-index: 200000;
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(420px, calc(100vw - 32px));
  padding: 12px 14px 14px;
  border-radius: var(--radius-lg);
  background: var(--surface-glass);
  border: 1px solid var(--surface-glass-border);
  box-shadow: var(--shadow-float);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
  transform: translateX(-50%);
}

.app-toast::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--toast-color);
}

.app-toast--success {
  --toast-color: var(--success);
  --toast-soft: var(--success-soft);
}

.app-toast--error {
  --toast-color: var(--danger);
  --toast-soft: var(--danger-soft);
}

.app-toast--warning {
  --toast-color: var(--brand-light);
  --toast-soft: var(--brand-soft);
}

.app-toast__icon {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--toast-soft);
  color: var(--toast-color);
  font-size: 1.05rem;
}

.app-toast__body {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.app-toast__body strong {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--text-main);
}

.app-toast__body span {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1.35;
}

.app-toast__close {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: none;
  background: var(--surface-soft);
  color: var(--text-muted);
  display: grid;
  place-items: center;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.app-toast__close:hover {
  background: var(--toast-soft);
  color: var(--toast-color);
}

.app-toast__progress {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--toast-color);
  opacity: 0.85;
  transform-origin: left center;
  animation: app-toast-progress linear forwards;
}

@keyframes app-toast-progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

.app-toast-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.app-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.22s ease;
}

.app-toast-enter-from,
.app-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -24px) scale(0.94);
}
</style>
