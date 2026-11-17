

import { createApp } from 'vue';
import { IonicVue } from '@ionic/vue';
import '@ionic/vue/css/core.css';
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from './App.vue';
import router from './router';
import './theme/global.css';
import { initTheme } from './services/theme';
import { translate } from './services/i18n';

// ─────────────────────────────────────────────────────────────────────────────
// SERVER BASE URL — EDIT HERE (no .env needed)
//
// Uncomment ONE line below to choose your backend, or leave APP_BASE_URL = ''
// to use relative /api calls (Vite proxy in dev). A URL set from the app's
// Settings screen still overrides anything here.
//
// const APP_BASE_URL = '';                                   // local dev / Vite proxy
const APP_BASE_URL = 'http://127.0.0.1:8000';           // phone on same Wi-Fi
// const APP_BASE_URL = 'https://lying-schnapps-doorknob.ngrok-free.dev'; // ngrok / public tunnel
// const APP_BASE_URL = 'https://api.yourdomain.com';         // production
// const APP_BASE_URL = '';

window.__APP_BASE_URL__ = String(APP_BASE_URL || import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
// ─────────────────────────────────────────────────────────────────────────────

initTheme();

const app = createApp(App);
// Make both t('key') and translate('key') available in every template.
app.config.globalProperties.t = translate;
app.config.globalProperties.translate = translate;
app.use(IonicVue, { mode: 'ios' }).use(router).mount('#app');

