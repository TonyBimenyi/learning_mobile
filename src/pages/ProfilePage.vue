<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell">
        <section v-if="isLoading" class="surface-card profile-loading-card">
          <div class="loading-spinner"></div>
          <strong>{{ t('loadingProfile') }}</strong>
        </section>

        <template v-else>
          <!-- Profile Identity Hero -->
          <section class="profile-hero">
            <div class="profile-hero__top">
              <div class="profile-hero__identity">
                <div class="avatar-container">
                  <img :src="avatarUrl" alt="Profile avatar" />
                  <div class="avatar-badge online"></div>
                </div>
                <div class="identity-text">
                  <span class="pill pill--glass">
                    <i class="fa-solid fa-circle-check"></i> {{ t('connectedAccount') }}
                  </span>
                  <h1>{{ profileName }}</h1>
                  <p>{{ user?.email }}</p>
                </div>
              </div>

              <button class="profile-logout-btn" type="button" @click="logout">
                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                <span>{{ t('logout') }}</span>
              </button>
            </div>

            <div class="profile-hero__tags">
              <span class="meta-tag">
                <i class="fa-solid fa-shield-halved"></i>
                <span>Role: {{ user?.role || 'student' }}</span>
              </span>
              <span class="meta-tag">
                <i class="fa-regular fa-circle-check"></i>
                <span>Status: {{ approvalLabel }}</span>
              </span>
            </div>
          </section>

          <!-- Quick Stats -->
          <section class="profile-stats">
            <article class="surface-card stat-tile">
              <div class="stat-tile__icon stat-tile__icon--indigo">
                <i class="fa-solid fa-book-open"></i>
              </div>
              <div>
                <small>{{ t('enrolled') }}</small>
                <strong>{{ enrollments.length }}</strong>
              </div>
            </article>

            <article class="surface-card stat-tile">
              <div class="stat-tile__icon stat-tile__icon--amber">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div>
                <small>{{ t('resumes') }}</small>
                <strong>{{ continueWatchingCount }}</strong>
              </div>
            </article>

            <article
              class="surface-card stat-tile stat-tile--clickable"
              role="button"
              tabindex="0"
              @click="$router.push('/downloads')"
            >
              <div class="stat-tile__icon stat-tile__icon--emerald">
                <i class="fa-solid fa-cloud-arrow-down"></i>
              </div>
              <div>
                <small>{{ t('downloads') }}</small>
                <strong>{{ downloadsCount }}</strong>
              </div>
            </article>

            <article class="surface-card stat-tile">
              <div class="stat-tile__icon stat-tile__icon--purple">
                <i class="fa-solid fa-language"></i>
              </div>
              <div>
                <small>{{ t('language') }}</small>
                <strong>{{ currentLanguageLabel }}</strong>
              </div>
            </article>
          </section>

          <!-- Offline Downloads Entry Banner -->
          <section
            class="surface-card downloads-entry-card"
            role="button"
            tabindex="0"
            @click="$router.push('/downloads')"
          >
            <div class="downloads-entry-left">
              <div class="downloads-entry-icon">
                <i class="fa-solid fa-cloud-arrow-down"></i>
              </div>
              <div class="downloads-entry-text">
                <div class="downloads-entry-tags">
                  <span class="secure-badge">
                    <i class="fa-solid fa-shield-halved"></i> {{ t('sandboxedVault') }}
                  </span>
                  <span class="downloads-size-badge">{{ totalStorageFormatted }}</span>
                </div>
                <h3>{{ t('offlineDownloads') }}</h3>
                <p>
                  {{ downloadsCount }} {{ downloadsCount === 1 ? 'video lesson' : 'video lessons' }} stored inside app
                </p>
              </div>
            </div>
            <div class="downloads-entry-arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </section>

          <!-- Personal Details Card -->
          <section class="surface-card form-section-card">
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  <i class="fa-solid fa-user-pen"></i> {{ t('account') }}
                </p>
                <h3>{{ t('personalDetails') }}</h3>
              </div>
            </div>

            <div class="profile-inputs-grid">
              <label class="input-block">
                <span>{{ t('whatsappNumber') }}</span>
                <div class="input-field-wrap">
                  <i class="fa-brands fa-whatsapp input-icon"></i>
                  <input v-model="form.whatsapp" type="text" placeholder="+257 ..." />
                </div>
              </label>

              <label class="input-block">
                <span>{{ t('specialtyField') }}</span>
                <div class="input-field-wrap">
                  <i class="fa-solid fa-briefcase input-icon"></i>
                  <input v-model="form.specialty" type="text" :placeholder="t('specialtyPlaceholder')" />
                </div>
              </label>
            </div>

            <label class="input-block">
              <span>Bio & Goals</span>
              <textarea
                v-model="form.bio"
                class="modern-textarea"
                rows="3"
                :placeholder="t('bioPlaceholder')"
              ></textarea>
            </label>

            <div class="form-action-bar">
              <span class="status-helper-msg">{{ statusMessage }}</span>
              <button class="primary-button save-btn" type="button" @click="saveProfileChanges">
                <i class="fa-solid fa-check"></i>
                <span>{{ t('saveChanges') }}</span>
              </button>
            </div>
          </section>

          <!-- Preferences Card -->
          <section class="surface-card form-section-card">
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  <i class="fa-solid fa-sliders"></i> {{ t('settings') }}
                </p>
                <h3>{{ t('appPreferences') }}</h3>
              </div>
            </div>

            <!-- Appearance / Dark Mode Selector -->
            <div class="input-block theme-mode-block">
              <div class="theme-block-header">
                <span>Theme & Appearance</span>
                <span class="active-theme-label">
                  <i :class="themeIcon"></i>
                  {{ activeThemeLabel }}
                </span>
              </div>
              <div class="theme-segmented-control">
                <button
                  class="theme-segment-btn"
                  :class="{ 'is-active': currentTheme === 'light' }"
                  type="button"
                  @click="changeTheme('light')"
                >
                  <i class="fa-solid fa-sun"></i>
                  <span>{{ t('light') }}</span>
                </button>
                <button
                  class="theme-segment-btn"
                  :class="{ 'is-active': currentTheme === 'dark' }"
                  type="button"
                  @click="changeTheme('dark')"
                >
                  <i class="fa-solid fa-moon"></i>
                  <span>{{ t('dark') }}</span>
                </button>
                <button
                  class="theme-segment-btn"
                  :class="{ 'is-active': currentTheme === 'system' }"
                  type="button"
                  @click="changeTheme('system')"
                >
                  <i class="fa-solid fa-circle-half-stroke"></i>
                  <span>{{ t('system') }}</span>
                </button>
              </div>
            </div>

            <label class="input-block">
              <span>{{ t('displayLanguage') }}</span>
              <div class="select-field-wrap">
                <i class="fa-solid fa-globe input-icon"></i>
                <select v-model="settings.language" @change="updateSettingsValue('language', settings.language)">
                  <option
                    v-for="option in languageOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <i class="fa-solid fa-chevron-down select-arrow"></i>
              </div>
            </label>

            <div class="toggles-list">
              <label class="modern-toggle-row">
                <div class="toggle-text">
                  <strong>{{ t('autoplayPreviews') }}</strong>
                  <small>{{ t('autoplayHint') }}</small>
                </div>
                <div class="switch">
                  <input
                    :checked="settings.autoplayPreviews"
                    type="checkbox"
                    @change="toggleSetting('autoplayPreviews', $event)"
                  />
                  <span class="slider"></span>
                </div>
              </label>

              <label class="modern-toggle-row">
                <div class="toggle-text">
                  <strong>Push notifications & reminders</strong>
                  <small>{{ t('notifyNewLessons') }}</small>
                </div>
                <div class="switch">
                  <input
                    :checked="settings.notifyNewCourses"
                    type="checkbox"
                    @change="toggleSetting('notifyNewCourses', $event)"
                  />
                  <span class="slider"></span>
                </div>
              </label>

              <label class="modern-toggle-row">
                <div class="toggle-text">
                  <strong>{{ t('wifiOnlyDownloads') }}</strong>
                  <small>{{ t('wifiOnlyHint') }}</small>
                </div>
                <div class="switch">
                  <input
                    :checked="settings.wifiDownloadsOnly"
                    type="checkbox"
                    @change="toggleSetting('wifiDownloadsOnly', $event)"
                  />
                  <span class="slider"></span>
                </div>
              </label>
            </div>
          </section>

          <!-- Security & Password Card -->
          <section class="surface-card form-section-card security-card">
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  <i class="fa-solid fa-shield-halved"></i> {{ t('security') }}
                </p>
                <h3>Account & Password</h3>
              </div>
              <button
                class="ghost-button icon-text-btn security-toggle-btn"
                type="button"
                @click="showPasswordFields = !showPasswordFields"
              >
                <i :class="showPasswordFields ? 'fa-solid fa-chevron-up' : 'fa-solid fa-key'"></i>
                <span>{{ showPasswordFields ? 'Hide' : 'Change Password' }}</span>
              </button>
            </div>

            <div v-if="!showPasswordFields" class="security-status-row">
              <div class="security-status-indicator">
                <i class="fa-solid fa-circle-check text-emerald"></i>
                <div>
                  <strong>Session & Account Protected</strong>
                  <small>{{ t('secureSession') }}</small>
                </div>
              </div>
              <span class="security-badge">
                <i class="fa-solid fa-lock"></i> {{ t('protected') }}
              </span>
            </div>

            <div v-else class="password-change-form">
              <label class="input-block">
                <span>{{ t('currentPassword') }}</span>
                <div class="input-field-wrap">
                  <i class="fa-solid fa-lock input-icon"></i>
                  <input v-model="pwdForm.currentPassword" type="password" placeholder="••••••••" />
                </div>
              </label>
              <div class="profile-inputs-grid">
                <label class="input-block">
                  <span>{{ t('newPassword') }}</span>
                  <div class="input-field-wrap">
                    <i class="fa-solid fa-key input-icon"></i>
                    <input v-model="pwdForm.newPassword" type="password" :placeholder="t('minChars')" />
                  </div>
                </label>
                <label class="input-block">
                  <span>{{ t('confirmNewPassword') }}</span>
                  <div class="input-field-wrap">
                    <i class="fa-solid fa-check-double input-icon"></i>
                    <input v-model="pwdForm.confirmPassword" type="password" :placeholder="t('repeatPassword')" />
                  </div>
                </label>
              </div>
              <div class="password-action-row">
                <span class="pwd-feedback-msg" :class="{ 'is-error': pwdFeedback.error }">
                  {{ pwdFeedback.message }}
                </span>
                <button class="primary-button pwd-save-btn" type="button" @click="handlePasswordUpdate">
                  <i class="fa-solid fa-shield-check"></i>
                  <span>{{ t('updatePassword') }}</span>
                </button>
              </div>
            </div>
          </section>

          <!-- Help & Community Support Card -->
          <section class="surface-card form-section-card support-card">
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  <i class="fa-solid fa-headset"></i> {{ t('support') }}
                </p>
                <h3>Help & Community</h3>
              </div>
            </div>

            <div class="support-actions-grid">
              <a
                :href="whatsappSupportUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="support-action-tile support-action-tile--whatsapp"
              >
                <div class="support-action-icon">
                  <i class="fa-brands fa-whatsapp"></i>
                </div>
                <div class="support-action-text">
                  <strong>{{ t('whatsappAdvisor') }}</strong>
                  <small>{{ t('instantSupport') }}</small>
                </div>
                <i class="fa-solid fa-arrow-up-right-from-square support-ext-icon"></i>
              </a>

              <button class="support-action-tile" type="button" @click="handleShareApp">
                <div class="support-action-icon support-action-icon--purple">
                  <i class="fa-solid fa-share-nodes"></i>
                </div>
                <div class="support-action-text">
                  <strong>{{ t('shareTwige') }}</strong>
                  <small>Invite classmates & friends</small>
                </div>
                <i class="fa-solid fa-chevron-right support-ext-icon"></i>
              </button>
            </div>
          </section>

          <!-- Maintenance & Device Card -->
          <section class="surface-card form-section-card">
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  <i class="fa-solid fa-gear"></i> Device & Storage
                </p>
                <h3>{{ t('maintenance') }}</h3>
              </div>
            </div>

            <div class="maintenance-actions">
              <button class="ghost-button maintenance-btn" type="button" @click="clearOnlyProgress">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <span>{{ t('clearProgress') }}</span>
              </button>
              <button
                v-if="downloadsCount > 0"
                class="ghost-button maintenance-btn maintenance-btn--vault"
                type="button"
                @click="handleClearOfflineVault"
              >
                <i class="fa-solid fa-trash-can"></i>
                <span>Clear Offline Videos ({{ totalStorageFormatted }})</span>
              </button>
              <button class="ghost-button maintenance-btn" type="button" @click="clearAllCache">
                <i class="fa-solid fa-broom"></i>
                <span>{{ t('clearCache') }}</span>
              </button>
            </div>

          </section>


          <!-- App Version & Legal Info Footer -->
          <footer class="profile-app-footer">
            <div class="app-brand-pill">
              <span class="brand-dot"></span>
              <strong>{{ t('appNameFull') }}</strong>
              <span>v1.3.0 &bull; {{ currentTheme === 'dark' ? 'Dark Edition' : 'Light Edition' }}</span>
            </div>
            <p class="app-copyright">{{ t('appTagline') }}</p>
          </footer>
        </template>

        <BottomNav v-if="!isLoading" />
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { translate } from '@/services/i18n';
import { IonContent, IonPage } from '@ionic/vue';
import { onMounted, onUnmounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import BottomNav from '@/components/BottomNav.vue';
import { getEnrollments, getCurrentUser, updateProfile } from '@/services/api';
import {
  clearAuth,
  clearCache,
  clearProgress,
  getContinueWatchingList,
  getSettings,
  saveSettings,
} from '@/services/storage';
import { clearAllDownloads, getAllDownloads, getTotalOfflineStorageUsage } from '@/services/downloads';
import { setTheme } from '@/services/theme';
import { languageOptions, translations } from '@/data/translations';

export default {
  name: 'ProfilePage',
  components: { BottomNav, IonContent, IonPage },
  setup() {
    const router = useRouter();
    const isLoading = ref(true);
    const user = ref(null);
    const enrollments = ref([]);
    const form = ref({ whatsapp: '', specialty: '', bio: '' });
    const settings = ref(getSettings());
    const currentTheme = ref(settings.value.theme || 'light');
    const showPasswordFields = ref(false);
    const pwdForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const pwdFeedback = ref({ message: '', error: false });
    const statusMessage = ref(translate('profileSyncNote'));
    const downloadsCount = ref(0);
    const totalStorageFormatted = ref('0 B');

    const dictionary = computed(() => translations[settings.value.language] || translations.en);

    const avatarUrl = computed(() =>
      user.value?.avatar || 'https://ui-avatars.com/api/?name=Twige&background=4f46e5&color=fff&size=200'
    );

    const profileName = computed(() => user.value?.name || translate('learner'));
    const approvalLabel = computed(() => user.value?.approvalStatus || 'approved');
    const continueWatchingCount = computed(() => getContinueWatchingList().length);

    const currentLanguageLabel = computed(() =>
      languageOptions.find((option) => option.value === settings.value.language)?.label || translate('englishLabel')
    );

    const themeIcon = computed(() => {
      if (currentTheme.value === 'dark') return 'fa-solid fa-moon text-indigo';
      if (currentTheme.value === 'light') return 'fa-solid fa-sun text-amber';
      return 'fa-solid fa-circle-half-stroke text-cyan';
    });

    const activeThemeLabel = computed(() => {
      if (currentTheme.value === 'dark') return translate('darkModeActive');
      if (currentTheme.value === 'light') return translate('lightModeActive');
      return translate('systemAuto');
    });

    const changeTheme = (theme) => {
      currentTheme.value = theme;
      setTheme(theme);
      settings.value = saveSettings({ theme });
      statusMessage.value = `Appearance set to ${theme} mode.`;
    };

    const handlePasswordUpdate = async () => {
      pwdFeedback.value = { message: '', error: false };
      if (!pwdForm.value.newPassword) {
        pwdFeedback.value = { message: translate('enterNewPassword'), error: true };
        return;
      }
      if (pwdForm.value.newPassword.length < 6) {
        pwdFeedback.value = { message: 'Password must be at least 6 characters.', error: true };
        return;
      }
      if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
        pwdFeedback.value = { message: translate('passwordsMismatch'), error: true };
        return;
      }

      try {
        if (user.value?.id) {
          await updateProfile(user.value.id, { password: pwdForm.value.newPassword });
        }
        pwdFeedback.value = { message: 'Password updated successfully!', error: false };
        pwdForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => {
          showPasswordFields.value = false;
        }, 1600);
      } catch (err) {
        pwdFeedback.value = { message: err?.message || translate('passwordUpdateFailed'), error: true };
      }
    };

    const handleClearOfflineVault = async () => {
      if (confirm(`Are you sure you want to delete all offline videos and free up ${totalStorageFormatted.value}?`)) {
        await clearAllDownloads();
        await loadDownloadsData();
        statusMessage.value = translate('offlineRemoved');
      }
    };

    const saveServerUrl = () => {
      const val = customServerUrl.value.trim();
      if (val && !val.startsWith('http://') && !val.startsWith('https://')) {
        serverSaveStatus.value = 'error';
        setTimeout(() => { serverSaveStatus.value = 'idle'; }, 3000);
        return;
      }
      saveCustomBaseUrl(val);
      serverSaveStatus.value = 'saved';
      setTimeout(() => { serverSaveStatus.value = 'idle'; }, 3000);
    };

    const applyPreset = (url) => {
      customServerUrl.value = url;
      saveServerUrl();
    };

    const whatsappSupportUrl = computed(() => {
      const phone = '25769000000';
      const msg = encodeURIComponent(`Hello Twige Team, my account is ${user.value?.email || translate('student')}. I need help with my courses.`);
      return `https://wa.me/${phone}?text=${msg}`;
    });

    const handleShareApp = async () => {
      const shareData = {
        title: translate('appNameFull'),
        text: 'Learn practical tech and business skills on Twige with offline video downloads!',
        url: window.location.origin,
      };
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          // ignore share cancel
        }
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(window.location.origin);
          statusMessage.value = 'App link copied to clipboard!';
        } catch {
          statusMessage.value = 'Share link: ' + window.location.origin;
        }
      }
    };

    const loadDownloadsData = async () => {
      try {
        const [dList, usage] = await Promise.all([
          getAllDownloads(),
          getTotalOfflineStorageUsage(),
        ]);
        downloadsCount.value = dList?.length || 0;
        totalStorageFormatted.value = usage?.totalFormatted || '0 B';
      } catch (err) {
        console.warn(translate('loadDownloadsError'), err);
      }
    };

    const loadProfile = async () => {
      isLoading.value = true;
      try {
        const [u, e] = await Promise.all([getCurrentUser(), getEnrollments().catch(() => [])]);

        if (!u?.id) {
          router.replace({ name: 'login', query: { redirect: '/profile' } });
          return;
        }

        user.value = u;
        enrollments.value = e || [];
        form.value = {
          whatsapp: u?.whatsapp || '',
          specialty: u?.specialty || '',
          bio: u?.bio || '',
        };
      } finally {
        isLoading.value = false;
      }
    };

    const t = (key) => dictionary.value[key] || translations.en[key] || key;

    const saveProfileChanges = async () => {
      if (!user.value?.id) {
        statusMessage.value = translate('noSession');
        return;
      }
      try {
        user.value = await updateProfile(user.value.id, form.value);
        statusMessage.value = translate('profileUpdated');
      } catch (error) {
        statusMessage.value = error.message;
      }
    };

    const toggleSetting = (key, event) => {
      settings.value = saveSettings({ [key]: event.target.checked });
      statusMessage.value = translate('preferenceUpdated');
    };

    const updateSettingsValue = (key, value) => {
      settings.value = saveSettings({ [key]: value });
      statusMessage.value = translate('languageUpdated');
    };

    const clearOnlyProgress = () => {
      clearProgress();
      statusMessage.value = translate('historyRemoved');
    };

    const clearAllCache = () => {
      clearCache();
      router.replace({ name: 'login' });
    };

    const logout = () => {
      clearAuth();
      router.replace({ name: 'login' });
    };

    const handleStorageUpdate = () => {
      settings.value = getSettings();
      if (settings.value.theme) {
        currentTheme.value = settings.value.theme;
      }
    };

    onMounted(() => {
      loadProfile();
      loadDownloadsData();
      window.addEventListener('twige:update', handleStorageUpdate);
      window.addEventListener('twige:downloads-update', loadDownloadsData);
    });

    onUnmounted(() => {
      window.removeEventListener('twige:update', handleStorageUpdate);
      window.removeEventListener('twige:downloads-update', loadDownloadsData);
    });

    return {
      isLoading,
      user,
      enrollments,
      form,
      settings,
      currentTheme,
      themeIcon,
      activeThemeLabel,
      changeTheme,
      showPasswordFields,
      pwdForm,
      pwdFeedback,
      handlePasswordUpdate,
      handleClearOfflineVault,
      whatsappSupportUrl,
      handleShareApp,
      languageOptions,
      statusMessage,
      dictionary,
      avatarUrl,
      profileName,
      approvalLabel,
      continueWatchingCount,
      currentLanguageLabel,
      downloadsCount,
      totalStorageFormatted,
      loadProfile,
      loadDownloadsData,
      t,
      saveProfileChanges,
      toggleSetting,
      updateSettingsValue,
      clearOnlyProgress,
      clearAllCache,
      logout,
      handleStorageUpdate,
    };
  },
};
</script>

<style scoped>
/* Loading Card */
.profile-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 40px;
  text-align: center;
}

.loading-spinner {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid var(--brand-soft);
  border-top-color: var(--brand);
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Profile Hero */
.profile-hero {
  display: grid;
  gap: 18px;
  padding: 24px;
  border-radius: var(--radius-2xl);
  background: var(--brand-hero-gradient);
  color: #ffffff;
  box-shadow: 0 20px 48px -10px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  position: relative;
  overflow: hidden;
}

.profile-hero__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.profile-hero__identity {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-container {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
}

.avatar-container img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.avatar-badge.online {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
}

.identity-text h1 {
  margin: 6px 0 2px;
  font-size: 1.45rem;
  font-weight: 800;
  color: #ffffff;
}

.identity-text p {
  margin: 0;
  font-size: 0.84rem;
  color: rgba(226, 232, 240, 0.8);
}

.profile-logout-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.profile-logout-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.4);
}

.profile-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  font-size: 0.74rem;
  font-weight: 600;
  color: #ffffff;
}

/* Profile Stats Grid */
.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.stat-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-xl);
}

.stat-tile--clickable {
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}

.stat-tile--clickable:hover {
  transform: translateY(-2px);
  border-color: rgba(16, 185, 129, 0.4);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.12);
}

.stat-tile--clickable:active {
  transform: scale(0.97);
}

.stat-tile__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.stat-tile__icon--indigo { background: #eef2ff; color: #4f46e5; }
.stat-tile__icon--amber { background: #fffbeb; color: #d97706; }
.stat-tile__icon--purple { background: #f5f3ff; color: #7c3aed; }
.stat-tile__icon--emerald { background: #ecfdf5; color: #10b981; }

.stat-tile strong {
  display: block;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
}

.stat-tile small {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
}

/* Offline Downloads Entry Card */
.downloads-entry-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-radius: var(--radius-2xl);
  cursor: pointer;
  background: linear-gradient(135deg, rgba(238, 242, 255, 0.7) 0%, rgba(236, 253, 245, 0.7) 100%);
  border: 1px solid rgba(79, 70, 229, 0.16);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}

:root[data-theme="dark"] .downloads-entry-card {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(6, 78, 59, 0.35) 100%);
  border-color: rgba(16, 185, 129, 0.25);
}

.downloads-entry-card:hover {
  transform: translateY(-2px);
  border-color: var(--brand);
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.12);
}

.downloads-entry-card:active {
  transform: scale(0.98);
}

.downloads-entry-left {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.downloads-entry-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-lg);
  background: var(--brand-gradient, linear-gradient(135deg, #4f46e5, #6366f1));
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.3);
  flex-shrink: 0;
}

.downloads-entry-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.downloads-entry-tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.secure-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  padding: 2px 8px;
  border-radius: 999px;
}

.downloads-size-badge {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
}

.downloads-entry-text h3 {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
  font-family: 'Outfit', sans-serif;
}

.downloads-entry-text p {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.downloads-entry-arrow {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--text-muted);
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.downloads-entry-card:hover .downloads-entry-arrow {
  color: var(--brand);
  border-color: var(--brand);
  transform: translateX(3px);
}

/* Form Section Cards */
.form-section-card {
  display: grid;
  gap: 16px;
  padding: 22px;
  border-radius: var(--radius-2xl);
}

.profile-inputs-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.input-block {
  display: grid;
  gap: 7px;
}

.input-block span {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.input-field-wrap,
.select-field-wrap {
  display: flex;
  align-items: center;
  padding: 0 14px;
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  transition: all var(--transition-fast);
}

.input-field-wrap:focus-within,
.select-field-wrap:focus-within {
  background: var(--surface);
  border-color: var(--brand-light);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.input-icon {
  color: var(--text-subtle);
  font-size: 0.95rem;
  margin-right: 10px;
}

.input-field-wrap input,
.select-field-wrap select {
  width: 100%;
  padding: 12px 0;
  border: none;
  background: transparent;
  outline: none;
  color: var(--text-main);
  font-size: 0.9rem;
  font-weight: 500;
}

.select-field-wrap {
  position: relative;
}

.select-field-wrap select {
  appearance: none;
  cursor: pointer;
}

.select-arrow {
  position: absolute;
  right: 14px;
  color: var(--text-muted);
  font-size: 0.75rem;
  pointer-events: none;
}

.modern-textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-main);
  font-size: 0.9rem;
  outline: none;
  resize: vertical;
  transition: all var(--transition-fast);
}

.modern-textarea:focus {
  background: var(--surface);
  border-color: var(--brand-light);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.form-action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 6px;
}

.status-helper-msg {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 500;
}

.save-btn {
  padding: 10px 18px;
  font-size: 0.85rem;
  border-radius: var(--radius-md);
  white-space: nowrap;
}

/* iOS-style Modern Toggle Switches */
.toggles-list {
  display: grid;
  gap: 12px;
}

.modern-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  cursor: pointer;
}

.toggle-text strong {
  display: block;
  font-size: 0.88rem;
  color: var(--text-main);
}

.toggle-text small {
  display: block;
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--line-strong);
  transition: 0.3s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: var(--brand);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* Theme Segmented Control */
.theme-mode-block {
  margin-bottom: 4px;
}

.theme-block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.active-theme-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.theme-segmented-control {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 5px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}

.theme-segment-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.theme-segment-btn:hover {
  color: var(--text-main);
}

.theme-segment-btn.is-active {
  background: var(--surface);
  color: var(--brand);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--line);
}

:root[data-theme="dark"] .theme-segment-btn.is-active {
  background: var(--surface-soft);
  color: #a5b4fc;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.12);
}

/* Security & Password Section */
.security-card .section-heading {
  align-items: center;
}

.security-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--radius-md);
  font-size: 0.78rem;
  font-weight: 700;
}

.security-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
}

.security-status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.security-status-indicator i {
  font-size: 1.25rem;
}

.security-status-indicator strong {
  display: block;
  font-size: 0.86rem;
  color: var(--text-main);
}

.security-status-indicator small {
  display: block;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.security-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.7rem;
  font-weight: 700;
  color: #10b981;
  background: rgba(16, 185, 129, 0.12);
  padding: 4px 10px;
  border-radius: 999px;
}

.password-change-form {
  display: grid;
  gap: 14px;
}

.password-action-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.pwd-feedback-msg {
  font-size: 0.78rem;
  font-weight: 600;
  color: #10b981;
}

.pwd-feedback-msg.is-error {
  color: #ef4444;
}

.pwd-save-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 0.84rem;
  border-radius: var(--radius-md);
}

/* Support & Community Section */
.support-actions-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.support-action-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-decoration: none;
  transition: all var(--transition-normal);
}

.support-action-tile:hover {
  background: var(--surface);
  border-color: var(--brand-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

.support-action-tile:active {
  transform: scale(0.98);
}

.support-action-tile--whatsapp:hover {
  border-color: #25d366;
}

.support-action-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #ecfdf5;
  color: #10b981;
  display: grid;
  place-items: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.support-action-icon--purple {
  background: #f5f3ff;
  color: #8b5cf6;
}

.support-action-text {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.support-action-text strong {
  display: block;
  font-size: 0.86rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.support-action-text small {
  display: block;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.support-ext-icon {
  font-size: 0.8rem;
  color: var(--text-subtle);
  flex-shrink: 0;
}

/* Maintenance */
.maintenance-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.maintenance-btn {
  padding: 12px;
  border-radius: var(--radius-lg);
  font-size: 0.84rem;
}

.maintenance-btn--vault {
  color: #ef4444;
}

.maintenance-btn--vault:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.api-status-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.api-status-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #eef2ff;
  color: var(--brand);
  display: grid;
  place-items: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.api-status-copy strong {
  display: block;
  font-size: 0.86rem;
  color: var(--text-main);
}

.api-status-copy p {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.api-status-copy small {
  display: block;
  margin-top: 3px;
  font-family: monospace;
  font-size: 0.72rem;
  color: var(--brand);
}

/* App Footer */
.profile-app-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 10px 0 20px;
}

.app-brand-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.brand-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand-light);
  box-shadow: 0 0 8px var(--brand-light);
}

.app-brand-pill strong {
  color: var(--text-main);
}

.app-copyright {
  font-size: 0.72rem;
  color: var(--text-subtle);
  margin: 0;
}

@media (max-width: 540px) {
  .profile-hero__top {
    flex-direction: column;
    align-items: stretch;
  }

  .profile-logout-btn {
    justify-content: center;
  }

  .profile-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .support-actions-grid {
    grid-template-columns: 1fr;
  }

  .profile-inputs-grid {
    grid-template-columns: 1fr;
  }

  .form-action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .save-btn {
    width: 100%;
  }

  .maintenance-actions {
    grid-template-columns: 1fr;
  }
}

/* ── Server Settings Panel ──────────────────────────────────────────────── */
.server-settings-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 4px;
}

.server-settings-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.server-settings-header > div {
  flex: 1;
}

.server-settings-header strong {
  font-size: 0.95rem;
  color: var(--text-primary);
}

.server-settings-header p {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.server-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--brand-soft);
  color: var(--brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

/* Status dot */
.server-status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background 0.3s;
}
.dot--blue  { background: var(--brand); }
.dot--green { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.2); }
.dot--red   { background: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.2); }

/* Preset buttons */
.server-presets {
  display: flex;
  gap: 8px;
}

.preset-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface-alt);
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.preset-btn:hover {
  border-color: var(--brand);
  color: var(--brand);
}

.preset-btn--active {
  background: var(--brand-soft);
  border-color: var(--brand);
  color: var(--brand);
  font-weight: 600;
}

/* URL input row */
.server-url-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.server-input-wrap {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.server-input-icon {
  position: absolute;
  left: 12px;
  color: var(--text-muted);
  font-size: 0.8rem;
  pointer-events: none;
}

.server-url-input {
  width: 100%;
  padding: 10px 36px 10px 32px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--surface-alt);
  color: var(--text-primary);
  font-size: 0.82rem;
  font-family: 'SF Mono', 'Fira Code', monospace;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.server-url-input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-soft);
}

.server-url-input::placeholder {
  color: var(--text-muted);
  font-family: inherit;
}

.server-clear-btn {
  position: absolute;
  right: 8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: var(--border);
  color: var(--text-muted);
  font-size: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: background 0.2s;
}

.server-clear-btn:hover {
  background: #ef4444;
  color: white;
}

.server-save-btn {
  padding: 10px 16px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--brand);
  color: white;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  transition: opacity 0.2s, transform 0.15s;
  flex-shrink: 0;
}

.server-save-btn:hover { opacity: 0.88; transform: translateY(-1px); }
.server-save-btn:active { transform: scale(0.97); }

/* Active URL display */
.server-active-url {
  font-size: 0.77rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.server-active-url code {
  background: var(--surface-alt);
  padding: 2px 7px;
  border-radius: 5px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.75rem;
  color: var(--brand);
  word-break: break-all;
}

/* Feedback */
.server-feedback {
  font-size: 0.8rem;
  margin: 0;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fadeIn 0.2s ease;
}

.server-feedback--ok  { background: rgba(34,197,94,0.1);  color: #16a34a; }
.server-feedback--err { background: rgba(239,68,68,0.1);  color: #dc2626; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
</style>
