/**
 * Lightweight global toast service for short action confirmations.
 * Mount <AppToast /> once in App.vue, then call showToast() from anywhere.
 */
import { reactive } from 'vue';

const state = reactive({
  visible: false,
  message: '',
  tone: 'info',
  duration: 3200,
  id: 0,
});

let dismissTimer = null;

export function getToastState() {
  return state;
}

export function showToast(message, tone = 'info', duration = 3200) {
  if (!message) return;
  window.clearTimeout(dismissTimer);
  state.message = String(message);
  state.tone = tone;
  state.duration = Math.max(1200, Number(duration) || 3200);
  state.id += 1;
  state.visible = true;
  dismissTimer = window.setTimeout(() => {
    state.visible = false;
  }, state.duration);
}

export function hideToast() {
  window.clearTimeout(dismissTimer);
  state.visible = false;
}
