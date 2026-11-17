





















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

// ─── Server Base URL ─────────────────────────────────────────────────────────
// Driven by VITE_API_BASE so the .env files are actually used.
//   .env.local  → VITE_API_BASE=''  → uses the Vite proxy (local backend :8000)
//   .env.ngrok  → VITE_API_BASE='https://<your-tunnel>.ngrok-free.dev'
// Keep it a single source of truth — editing here is no longer needed.
// ─────────────────────────────────────────────────────────────────────────────
window.__APP_BASE_URL__ = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

initTheme();

const app = createApp(App);
// Make both t('key') and translate('key') available in every template.
app.config.globalProperties.t = translate;
app.config.globalProperties.translate = translate;
app.use(IonicVue, { mode: 'ios' }).use(router).mount('#app');

