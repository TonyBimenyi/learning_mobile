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

// ─── Server Base URL ─────────────────────────────────────────────────────────
// Change this to switch between local and any remote server.
// Local  → leave as empty string '' (Vite proxy forwards to :8000)
// Ngrok  → 'https://lying-schnapps-doorknob.ngrok-free.dev'
// ─────────────────────────────────────────────────────────────────────────────
window.__APP_BASE_URL__ = 'https://lying-schnapps-doorknob.ngrok-free.dev';

initTheme();

createApp(App).use(IonicVue, { mode: 'ios' }).use(router).mount('#app');

