<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell settings-shell">
        <!-- ── Hero ──────────────────────────────────────────────── -->
        <header class="settings-hero">
          <div class="settings-hero__row">
            <button type="button" class="settings-hero__back" @click="goBack">
              <i class="fa-solid fa-chevron-left"></i>
              <span>{{ t('goBack') }}</span>
            </button>
            <span class="settings-hero__chip">
              <i class="fa-solid fa-sliders"></i>
              {{ t('settings') }}
            </span>
          </div>

          <div class="settings-hero__copy">
            <h1>{{ t('settings') }}</h1>
            <p>{{ t('settingsSubtitle') }}</p>
          </div>
        </header>

        <!-- ── Account ───────────────────────────────────────────── -->
        <section class="surface-card settings-card settings-account">
          <span class="settings-account__avatar">
            <i v-if="!isLoggedIn" class="fa-solid fa-graduation-cap"></i>
            <template v-else>{{ userInitial }}</template>
          </span>

          <div class="settings-account__identity">
            <strong>{{ isLoggedIn ? (user.name || t('learner')) : t('appName') }}</strong>
            <small>{{ isLoggedIn ? (user.email || user.whatsapp || '') : t('signInContinue') }}</small>
          </div>

          <button v-if="isLoggedIn" type="button" class="settings-account__btn" @click="logout">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <span>{{ t('logout') }}</span>
          </button>
          <RouterLink v-else to="/login" class="settings-account__btn is-primary">
            <i class="fa-solid fa-right-to-bracket"></i>
            <span>{{ t('signIn') }}</span>
          </RouterLink>
        </section>

        <!-- ── Appearance ────────────────────────────────────────── -->
        <section class="surface-card settings-card">
          <header class="settings-card__head">
            <span class="settings-card__icon"><i class="fa-solid fa-palette"></i></span>
            <div>
              <h3>{{ t('appearance') }}</h3>
              <p>{{ t('themeAndAppearance') }}</p>
            </div>
          </header>

          <div class="settings-theme-toggle" role="group" :aria-label="t('appearance')">
            <button
              v-for="option in themeOptions"
              :key="option.value"
              type="button"
              :class="{ 'is-active': currentTheme === option.value }"
              @click="changeTheme(option.value)"
            >
              <i :class="option.icon"></i>
              <span>{{ option.label }}</span>
            </button>
          </div>

          <div class="settings-row settings-row--between">
            <span class="settings-row__label">
              <i class="fa-solid fa-globe"></i>
              {{ t('displayLanguage') }}
            </span>
            <select v-model="settings.language" class="settings-select" @change="updateLanguage">
              <option v-for="option in languageOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
        </section>

        <!-- ── Playback & Downloads ──────────────────────────────── -->
        <section class="surface-card settings-card">
          <header class="settings-card__head">
            <span class="settings-card__icon"><i class="fa-solid fa-circle-play"></i></span>
            <div>
              <h3>{{ t('playbackAndDownloads') }}</h3>
              <p>{{ t('offlineDownloads') }}</p>
            </div>
          </header>

          <label class="settings-toggle-row">
            <span class="settings-toggle-row__text">
              <strong>{{ t('autoplayPreviews') }}</strong>
              <small>{{ t('autoplayHint') }}</small>
            </span>
            <span class="settings-switch">
              <input
                type="checkbox"
                :checked="settings.autoplayPreviews"
                @change="toggleSetting('autoplayPreviews', $event)"
              />
              <span class="settings-switch__track"></span>
            </span>
          </label>

          <label class="settings-toggle-row">
            <span class="settings-toggle-row__text">
              <strong>{{ t('wifiOnlyDownloads') }}</strong>
              <small>{{ t('wifiOnlyHint') }}</small>
            </span>
            <span class="settings-switch">
              <input
                type="checkbox"
                :checked="settings.wifiDownloadsOnly"
                @change="toggleSetting('wifiDownloadsOnly', $event)"
              />
              <span class="settings-switch__track"></span>
            </span>
          </label>
        </section>

        <!-- ── Notifications ─────────────────────────────────────── -->
        <section class="surface-card settings-card">
          <header class="settings-card__head">
            <span class="settings-card__icon"><i class="fa-solid fa-bell"></i></span>
            <div>
              <h3>{{ t('notifications') }}</h3>
              <p>{{ t('notifyNewLessons') }}</p>
            </div>
          </header>

          <label class="settings-toggle-row">
            <span class="settings-toggle-row__text">
              <strong>{{ t('pushNotifications') }}</strong>
              <small>{{ t('notifyNewLessons') }}</small>
            </span>
            <span class="settings-switch">
              <input
                type="checkbox"
                :checked="settings.notifyNewCourses"
                @change="toggleSetting('notifyNewCourses', $event)"
              />
              <span class="settings-switch__track"></span>
            </span>
          </label>
        </section>

        <!-- ── Data & Storage ────────────────────────────────────── -->
        <section class="surface-card settings-card">
          <header class="settings-card__head">
            <span class="settings-card__icon"><i class="fa-solid fa-database"></i></span>
            <div>
              <h3>{{ t('dataAndStorage') }}</h3>
              <p>{{ t('offlineVideoVault') }}</p>
            </div>
          </header>

          <div class="settings-storage">
            <span class="settings-row__label">
              <i class="fa-solid fa-hard-drive"></i>
              {{ t('storageUsed') }}
            </span>
            <span class="settings-storage__value">{{ storageUsedText }}</span>
            <button type="button" class="settings-icon-btn" :title="t('refresh')" @click="updateStorageText">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          <div class="settings-actions-grid">
            <button type="button" class="settings-action" @click="clearWatchHistory">
              <i class="fa-solid fa-clock-rotate-left"></i>
              <span>{{ t('clearProgress') }}</span>
            </button>
            <button type="button" class="settings-action settings-action--danger" @click="clearCache">
              <i class="fa-solid fa-trash-can"></i>
              <span>{{ t('clearCache') }}</span>
            </button>
          </div>
        </section>

        <!-- ── Privacy & Security ────────────────────────────────── -->
        <section class="surface-card settings-card">
          <header class="settings-card__head">
            <span class="settings-card__icon"><i class="fa-solid fa-shield-halved"></i></span>
            <div>
              <h3>{{ t('privacyAndSecurity') }}</h3>
              <p>{{ t('secureSession') }}</p>
            </div>
          </header>

          <div class="settings-info">
            <i class="fa-solid fa-lock"></i>
            <span>{{ t('appSandboxProtected') }}</span>
            <span class="settings-info__badge">{{ t('protected') }}</span>
          </div>
        </section>

        <!-- ── About ─────────────────────────────────────────────── -->
        <section class="surface-card settings-card settings-about">
          <div class="settings-about__brand">
            <span class="settings-about__mark"><i class="fa-solid fa-graduation-cap"></i></span>
            <div>
              <strong>{{ t('appNameFull') }}</strong>
              <small>{{ t('appTagline') }}</small>
            </div>
          </div>
          <span class="settings-about__version">v1.3.0</span>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { translate } from '@/services/i18n';
import { IonContent, IonPage } from '@ionic/vue';
import { languageOptions } from '@/data/translations';
import {
  getSettings,
  saveSettings,
  clearProgress,
  clearCache,
  getStoredUser,
  getToken,
  clearAuth,
} from '@/services/storage';
import { setTheme } from '@/services/theme';
import { showToast } from '@/services/toast';

export default {
  name: 'SettingsPage',
  components: { IonContent, IonPage },
  data() {
    return {
      user: getStoredUser() || {},
      isLoggedIn: Boolean(getToken()),
      settings: getSettings(),
      currentTheme: getSettings().theme || 'light',
      storageUsedText: '',
      languageOptions,
    };
  },
  computed: {
    themeOptions() {
      return [
        { value: 'light', icon: 'fa-solid fa-sun', label: translate('light') },
        { value: 'dark', icon: 'fa-solid fa-moon', label: translate('dark') },
        { value: 'system', icon: 'fa-solid fa-circle-half-stroke', label: translate('system') },
      ];
    },
    userInitial() {
      const name = (this.user && this.user.name) || '';
      return name.trim().charAt(0).toUpperCase() || 'T';
    },
  },
  created() {
    this.updateStorageText();
  },
  mounted() {
    window.addEventListener('twige:update', this.handleAuthUpdate);
  },
  beforeUnmount() {
    window.removeEventListener('twige:update', this.handleAuthUpdate);
  },
  methods: {
    handleAuthUpdate(event) {
      if (!event.detail || event.detail.scope !== 'auth') return;
      this.user = getStoredUser() || {};
      this.isLoggedIn = Boolean(getToken());
    },
    computeStorageUsed() {
      const ls = window.localStorage;
      let bytes = 0;
      for (let i = 0; i < ls.length; i += 1) {
        const key = ls.key(i);
        if (key) {
          const value = ls.getItem(key);
          bytes += key.length + (value ? value.length : 0);
        }
      }
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },
    updateStorageText() {
      this.storageUsedText = this.computeStorageUsed();
    },
    toggleSetting(key, event) {
      this.settings = saveSettings({ [key]: event.target.checked });
      showToast(translate('preferenceUpdated'), 'success');
    },
    changeTheme(theme) {
      setTheme(theme);
      this.currentTheme = theme;
      this.settings = getSettings();
      showToast(translate('preferenceUpdated'), 'success');
    },
    updateLanguage() {
      this.settings = saveSettings({ language: this.settings.language });
      showToast(translate('languageUpdated'), 'success');
    },
    clearWatchHistory() {
      clearProgress();
      this.updateStorageText();
      showToast(translate('historyRemoved'), 'success');
    },
    clearCache() {
      clearCache();
      this.$router.replace({ name: 'login' });
    },
    logout() {
      clearAuth();
      this.$router.replace({ name: 'login' });
    },
    goBack() {
      this.$router.back();
    },
  },
};
</script>

<style scoped>
.settings-shell {
  display: grid;
  gap: 16px;
}

/* ── Hero ────────────────────────────────────────────────────── */
.settings-hero {
  display: grid;
  gap: 16px;
  margin-bottom: 4px;
}

.settings-hero__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.settings-hero__back {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-full);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-fast);
}

.settings-hero__back:active {
  transform: scale(0.97);
}

.settings-hero__chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-hero__copy {
  display: grid;
  gap: 6px;
}

.settings-hero h1 {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1.1;
  color: var(--text-main);
}

.settings-hero p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-muted);
}

/* ── Cards ───────────────────────────────────────────────────── */
.settings-card {
  display: grid;
  gap: 16px;
  padding: 20px;
}

.settings-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-card__head h3 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-main);
}

.settings-card__head p {
  margin: 2px 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: var(--text-muted);
}

.settings-card__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 1rem;
}

/* ── Account ─────────────────────────────────────────────────── */
.settings-account {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  background: var(--brand-hero-gradient);
  border: none;
  color: #ffffff;
  box-shadow: 0 16px 36px -14px rgba(15, 23, 42, 0.55);
}

.settings-account__avatar {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  font-size: 1.05rem;
  font-weight: 800;
}

.settings-account__identity {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.settings-account__identity strong {
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.settings-account__identity small {
  font-size: 0.76rem;
  color: rgba(241, 245, 249, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-account__btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 800;
  text-decoration: none;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.settings-account__btn.is-primary {
  background: #ffffff;
  color: var(--brand);
  border-color: transparent;
}

.settings-account__btn:active {
  transform: scale(0.96);
}

/* ── Rows ────────────────────────────────────────────────────── */
.settings-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-row--between {
  justify-content: space-between;
}

.settings-row__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-main);
}

.settings-row__label i {
  color: var(--brand);
  font-size: 0.85rem;
}

/* ── Theme toggle ────────────────────────────────────────────── */
.settings-theme-toggle {
  display: flex;
  gap: 6px;
  padding: 5px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.settings-theme-toggle button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.settings-theme-toggle button.is-active {
  background: var(--brand-gradient);
  color: #ffffff;
  box-shadow: var(--shadow-brand-sm);
}

.settings-theme-toggle button:active:not(.is-active) {
  transform: scale(0.97);
}

/* ── Select ──────────────────────────────────────────────────── */
.settings-select {
  appearance: none;
  min-width: 132px;
  padding: 10px 34px 10px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 15px;
  color: var(--text-main);
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.settings-select:focus {
  outline: none;
  border-color: var(--brand-light);
  box-shadow: 0 0 0 4px var(--brand-glow);
}

/* ── Toggle switch ───────────────────────────────────────────── */
.settings-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  cursor: pointer;
}

.settings-toggle-row__text {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.settings-toggle-row__text strong {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-main);
}

.settings-toggle-row__text small {
  font-size: 0.76rem;
  line-height: 1.4;
  color: var(--text-muted);
}

.settings-switch {
  position: relative;
  flex-shrink: 0;
  width: 50px;
  height: 30px;
}

.settings-switch input {
  position: absolute;
  inset: 0;
  opacity: 0;
  margin: 0;
  cursor: pointer;
  z-index: 2;
}

.settings-switch__track {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  transition: all var(--transition-normal);
}

.settings-switch__track::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.25);
  transition: transform var(--transition-spring);
}

.settings-switch input:checked + .settings-switch__track {
  background: var(--brand-gradient);
  border-color: transparent;
  box-shadow: var(--shadow-brand-sm);
}

.settings-switch input:checked + .settings-switch__track::after {
  transform: translateX(20px);
}

.settings-switch input:focus-visible + .settings-switch__track {
  outline: 2px solid var(--brand-light);
  outline-offset: 2px;
}

/* ── Storage row ─────────────────────────────────────────────── */
.settings-storage {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.settings-storage__value {
  flex: 1;
  text-align: right;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--text-secondary);
}

.settings-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--surface);
  color: var(--text-subtle);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.settings-icon-btn:active {
  transform: scale(0.94);
  color: var(--brand);
  border-color: var(--brand-light);
}

/* ── Action buttons ──────────────────────────────────────────── */
.settings-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.settings-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.settings-action:active {
  transform: scale(0.97);
}

.settings-action--danger {
  background: var(--danger-soft);
  color: var(--danger);
  border-color: rgba(239, 68, 68, 0.22);
}

/* ── Privacy info row ────────────────────────────────────────── */
.settings-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--success-soft);
  border: 1px solid rgba(16, 185, 129, 0.2);
  font-size: 0.84rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.settings-info > i {
  color: var(--success);
  font-size: 0.9rem;
}

.settings-info span:not(.settings-info__badge) {
  flex: 1;
  min-width: 0;
}

.settings-info__badge {
  flex-shrink: 0;
  padding: 4px 9px;
  border-radius: var(--radius-full);
  background: var(--success);
  color: #ffffff;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* ── About ───────────────────────────────────────────────────── */
.settings-about {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
}

.settings-about__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.settings-about__mark {
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-md);
  background: var(--brand-gradient);
  color: #ffffff;
  font-size: 1.05rem;
  box-shadow: var(--shadow-brand-sm);
}

.settings-about__brand strong {
  display: block;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-main);
}

.settings-about__brand small {
  display: block;
  margin-top: 2px;
  font-size: 0.74rem;
  line-height: 1.35;
  color: var(--text-muted);
}

.settings-about__version {
  flex-shrink: 0;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-subtle);
  font-size: 0.72rem;
  font-weight: 800;
}

@media (max-width: 360px) {
  .settings-hero h1 {
    font-size: 1.9rem;
  }

  .settings-actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
