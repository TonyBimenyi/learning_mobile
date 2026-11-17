/**
 * Tiny global translation helper (no extra dependency).
 * The active language follows the saved app settings and updates live.
 */
import { reactive } from 'vue';
import { translations } from '@/data/translations';
import { getSettings } from './storage';

const state = reactive({
  lang: getSettings().language || 'en',
});

function refreshLanguage() {
  const next = getSettings().language || 'en';
  if (next !== state.lang) state.lang = next;
}

if (typeof window !== 'undefined') {
  window.addEventListener('twige:update', (event) => {
    if (!event.detail || event.detail.scope === 'settings') refreshLanguage();
  });
}

export function translate(key, params = null) {
  const dictionary = translations[state.lang] || translations.en;
  let text = dictionary?.[key] || translations.en?.[key] || key;
  if (params && typeof text === 'string') {
    Object.entries(params).forEach(([name, value]) => {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    });
  }
  return text;
}

export function getLanguage() {
  return state.lang;
}

export { state as i18nState };
