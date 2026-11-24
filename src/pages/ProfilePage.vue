<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell">
        <section v-if="isLoading" class="profile-skeleton">
          <div class="surface-card profile-skeleton__hero">
            <SkeletonLoader type="circle" width="78px" height="78px" />
            <div class="profile-skeleton__hero-lines">
              <SkeletonLoader type="text" width="45%" height="20px" rounded />
              <SkeletonLoader type="text" width="30%" height="13px" rounded />
            </div>
          </div>
          <div class="profile-skeleton__grid">
            <SkeletonCard v-for="n in 4" :key="n" />
          </div>
        </section>

        <template v-else>
          <!-- Profile Identity Hero -->
          <section class="profile-hero">
            <span class="profile-hero__orb profile-hero__orb--one"></span>
            <span class="profile-hero__orb profile-hero__orb--two"></span>

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
              <RouterLink to="/settings" class="meta-tag meta-tag--link">
                <i class="fa-solid fa-sliders"></i>
                <span>{{ t('settings') }}</span>
                <i class="fa-solid fa-chevron-right meta-tag__chev"></i>
              </RouterLink>
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

          <!-- Continue Learning -->
          <section v-if="continueLearning.length" class="surface-card form-section-card continue-card">
            <div class="section-heading">
              <div>
                <p class="section-kicker"><i class="fa-solid fa-circle-play"></i> {{ t('continueLearning') }}</p>
                <h3>{{ t('pickUpWhereYouLeftOff') }}</h3>
              </div>
              <button class="ghost-button compact view-all-btn" type="button" @click="$router.push('/my-learning')">
                {{ t('viewAll') }} <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            <div class="continue-list">
              <button
                v-for="item in continueLearning"
                :key="item.key"
                class="continue-item"
                type="button"
                @click="resumeCourse(item)"
              >
                <span class="continue-item__thumb">
                  <img v-if="item.courseThumbnail" :src="item.courseThumbnail" alt="" />
                  <i v-else class="fa-solid fa-graduation-cap"></i>
                </span>
                <span class="continue-item__body">
                  <strong>{{ item.courseTitle }}</strong>
                  <small>{{ item.lessonTitle }}</small>
                  <span class="continue-item__rail"><i :style="{ width: progressOf(item) + '%' }"></i></span>
                </span>
                <span class="continue-item__pct">{{ progressOf(item) }}%</span>
                <span class="continue-item__play"><i class="fa-solid fa-play"></i></span>
              </button>
            </div>
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

          <!-- Achievements -->
          <section class="surface-card form-section-card achievements-card">
            <div class="section-heading">
              <div>
                <p class="section-kicker"><i class="fa-solid fa-trophy"></i> {{ t('achievements') }}</p>
                <h3>{{ t('milestones') }}</h3>
              </div>
              <span class="achievements-count">
                <i class="fa-solid fa-circle-check"></i>
                {{ unlockedAchievementsCount }}/{{ achievements.length }}
              </span>
            </div>

            <div class="achievements-grid">
              <article
                v-for="badge in achievements"
                :key="badge.key"
                class="achievement"
                :class="{ 'is-unlocked': badge.unlocked }"
              >
                <span class="achievement__icon">
                  <i :class="badge.unlocked ? badge.icon : 'fa-solid fa-lock'"></i>
                </span>
                <strong>{{ badge.title }}</strong>
                <small>{{ badge.detail }}</small>
                <span class="achievement__state">
                  <i :class="badge.unlocked ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle'"></i>
                  {{ badge.unlocked ? t('unlocked') : t('locked') }}
                </span>
              </article>
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

            <label class="input-block photo-field">
              <span>{{ t('profilePhoto') }}</span>
              <div class="input-field-wrap">
                <i class="fa-solid fa-image input-icon"></i>
                <input v-model="form.avatar" type="url" :placeholder="t('photoPlaceholder')" />
              </div>
              <small>{{ t('photoHint') }}</small>
            </label>

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
                <i class="fa-solid fa-circle-check"></i>
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
                v-if="whatsappSupportUrl"
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

        <BottomNav />
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
import SkeletonCard from '@/components/SkeletonCard.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { getEnrollments, getCurrentUser, updateProfile } from '@/services/api';
import {
  clearAuth,
  clearCache,
  clearProgress,
  getContinueWatchingList,
  getSettings,
  getStoredUser,
  getToken,
  saveSettings,
} from '@/services/storage';
import { clearAllDownloads, getAllDownloads, getTotalOfflineStorageUsage } from '@/services/downloads';
import { setTheme } from '@/services/theme';
import { languageOptions, translations } from '@/data/translations';

export default {
  name: 'ProfilePage',
  components: { BottomNav, IonContent, IonPage, SkeletonCard, SkeletonLoader },
  setup() {
    const router = useRouter();
    const isLoading = ref(true);
    const user = ref(null);
    const enrollments = ref([]);
    const form = ref({ whatsapp: '', specialty: '', bio: '', avatar: '' });
    const settings = ref(getSettings());
    const currentTheme = ref(settings.value.theme || 'light');
    const showPasswordFields = ref(false);
    const pwdForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const pwdFeedback = ref({ message: '', error: false });
    const statusMessage = ref(translate('profileSyncNote'));
    const downloadsCount = ref(0);
    const totalStorageFormatted = ref('0 B');
    const continueWatching = ref(getContinueWatchingList());

    const dictionary = computed(() => translations[settings.value.language] || translations.en);

    const avatarUrl = computed(() =>
      user.value?.avatar || 'https://ui-avatars.com/api/?name=Twige&background=4f46e5&color=fff&size=200'
    );

    const profileName = computed(() => user.value?.name || translate('learner'));
    const approvalLabel = computed(() => user.value?.approvalStatus || 'approved');
    const continueWatchingCount = computed(() => continueWatching.value.length);

    const continueLearning = computed(() => continueWatching.value
      .filter((entry) => Number(entry.progressPercent || 0) < 95)
      .slice(0, 3));

    const progressOf = (entry) => Math.min(100, Math.max(0, Math.round(Number(entry.progressPercent || 0))));

    const resumeCourse = (entry) => {
      router.push({ name: 'course-details', params: { id: entry.courseId } });
    };

    const achievements = computed(() => {
      const completed = continueWatching.value.filter(
        (entry) => Number(entry.progressPercent || 0) >= 95,
      ).length;
      return [
        {
          key: 'first-step',
          icon: 'fa-solid fa-graduation-cap',
          title: translate('firstStep'),
          detail: translate('firstStepHint'),
          unlocked: enrollments.value.length >= 1,
        },
        {
          key: 'five-lessons',
          icon: 'fa-solid fa-circle-check',
          title: translate('fiveLessons'),
          detail: translate('fiveLessonsHint'),
          unlocked: completed >= 5,
        },
        {
          key: 'offline-scholar',
          icon: 'fa-solid fa-download',
          title: translate('offlineScholar'),
          detail: translate('offlineScholarHint'),
          unlocked: downloadsCount.value >= 1,
        },
        {
          key: 'curious-explorer',
          icon: 'fa-solid fa-compass',
          title: translate('curiousExplorer'),
          detail: translate('curiousExplorerHint'),
          unlocked: continueWatching.value.length >= 3,
        },
      ];
    });

    const unlockedAchievementsCount = computed(() => achievements.value.filter((item) => item.unlocked).length);

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

    const whatsappSupportUrl = computed(() => {
      const phone = (import.meta.env.VITE_SUPPORT_WHATSAPP || '').replace(/[^0-9]/g, '');
      if (!phone) return '';
      const msg = encodeURIComponent(`Hello Twige Team, my account is ${user.value?.email || translate('student')}. I need help with my courses.`);
      return `https://wa.me/${phone}?text=${msg}`;
    });

    const handleShareApp = async () => {
      const shareData = {
        title: translate('appNameFull'),
        text: 'Learn practical tech and business skills on Twige with offline video downloads!',
        url: import.meta.env.VITE_SHARE_URL || 'https://soma.bi',
      };
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share(shareData);
        } catch {
          // ignore share cancel
        }
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareData.url);
          statusMessage.value = 'App link copied to clipboard!';
        } catch {
          statusMessage.value = 'Share link: ' + shareData.url;
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
        // Seed from the cached user so switching tabs never blanks the page.
        const cached = getStoredUser();
        const hasId = (value) => Boolean(value?.id || value?.extId);
        if (hasId(cached)) user.value = cached;

        const [u, e] = await Promise.all([
          getCurrentUser().catch(() => null),
          getEnrollments().catch(() => []),
        ]);

        enrollments.value = e || [];

        if (hasId(u) || hasId(cached)) {
          const profile = hasId(u) ? u : cached;
          user.value = profile;
          form.value = {
            whatsapp: profile?.whatsapp || '',
            specialty: profile?.specialty || '',
            bio: profile?.bio || '',
            avatar: profile?.avatar || '',
          };
        } else if (!getToken()) {
          // Genuinely signed out — go to login (the router now honours this
          // redirect instead of bouncing straight back to /profile).
          router.replace({ name: 'login', query: { redirect: '/profile' } });
          return;
        }
        // If a token exists but the fetch failed (offline / expired), stay put
        // rather than looping profile → login → profile.
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
      continueWatching.value = getContinueWatchingList();
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
      continueLearning,
      continueWatching,
      achievements,
      unlockedAchievementsCount,
      progressOf,
      resumeCourse,
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
/* Profile skeleton loading */
.profile-skeleton {
  display: grid;
  gap: 16px;
}

.profile-skeleton__hero {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-radius: var(--radius-2xl);
}

.profile-skeleton__hero-lines {
  display: grid;
  gap: 10px;
  flex: 1;
}

.profile-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (max-width: 480px) {
  .profile-skeleton__grid {
    grid-template-columns: 1fr;
  }
}

/* Profile Hero */
.profile-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 18px;
  padding: 26px 24px 22px;
  border-radius: var(--radius-2xl);
  background: var(--brand-hero-gradient);
  color: #ffffff;
  box-shadow:
    0 24px 48px -18px rgba(49, 46, 129, 0.6),
    inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.profile-hero__orb {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.profile-hero__orb--one {
  width: 190px;
  height: 190px;
  top: -80px;
  right: -55px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.32), transparent 65%);
}

.profile-hero__orb--two {
  width: 160px;
  height: 160px;
  bottom: -90px;
  left: -50px;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.55), transparent 70%);
}

.profile-hero__top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.profile-hero__identity {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.avatar-container {
  position: relative;
  width: 76px;
  height: 76px;
  flex-shrink: 0;
}

.avatar-container::before {
  content: '';
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: conic-gradient(
    from 180deg,
    rgba(255, 255, 255, 0.8),
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.55),
    rgba(255, 255, 255, 0.06),
    rgba(255, 255, 255, 0.8)
  );
  opacity: 0.9;
}

.avatar-container img {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.28);
  box-shadow: 0 8px 22px rgba(2, 6, 23, 0.35);
}

.avatar-badge.online {
  position: absolute;
  z-index: 2;
  bottom: 3px;
  right: 3px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #10b981;
  border: 2px solid #ffffff;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}

.identity-text { min-width: 0; }

.identity-text .pill {
  padding: 4px 10px;
  font-size: 0.67rem;
  letter-spacing: 0.03em;
}

.identity-text h1 {
  margin: 7px 0 2px;
  font-size: 1.55rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.15;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-text p {
  margin: 0;
  font-size: 0.82rem;
  color: rgba(226, 232, 240, 0.78);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-logout-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 14px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #ffffff;
  font-size: 0.79rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.profile-logout-btn:hover {
  background: rgba(239, 68, 68, 0.24);
  border-color: rgba(248, 113, 113, 0.45);
}

.profile-hero__tags {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: var(--radius-full);
  background: rgba(15, 23, 42, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  font-size: 0.72rem;
  font-weight: 600;
  color: #ffffff;
}

.meta-tag i { font-size: 0.7rem; opacity: 0.9; }

.meta-tag--link {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.26);
  text-decoration: none;
  transition: all var(--transition-fast);
}

.meta-tag--link:hover { background: rgba(255, 255, 255, 0.3); }
.meta-tag--link:active { transform: scale(0.97); }

.meta-tag__chev { font-size: 0.58rem !important; margin-left: 1px; opacity: 0.75; }

/* Profile Stats Grid */
.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.stat-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 14px;
  border-radius: var(--radius-lg);
}

.stat-tile--clickable {
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}

.stat-tile--clickable:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.35);
  box-shadow: var(--shadow-card);
}

.stat-tile--clickable:active {
  transform: scale(0.97);
}

.stat-tile__icon {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.stat-tile__icon--indigo { background: var(--brand-soft); color: var(--brand); }
.stat-tile__icon--amber { background: var(--warning-soft); color: #d97706; }
.stat-tile__icon--purple { background: var(--accent-purple-soft); color: #7c3aed; }
.stat-tile__icon--emerald { background: var(--success-soft); color: #059669; }

.stat-tile > div:last-child {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.stat-tile strong {
  display: block;
  font-size: 1.28rem;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.stat-tile small {
  display: block;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

/* Continue Learning */
.view-all-btn {
  gap: 6px;
  padding: 6px 10px;
  border-radius: var(--radius-full);
  font-size: 0.74rem;
  font-weight: 700;
}

.view-all-btn i { font-size: 0.62rem; }

.continue-list { display: grid; gap: 8px; }

.continue-item {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 10px 12px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  text-align: left;
  transition: all var(--transition-fast);
}

.continue-item:hover {
  background: var(--surface);
  border-color: rgba(99, 102, 241, 0.3);
  transform: translateY(-1px);
}

.continue-item:active { transform: scale(0.99); }

.continue-item__thumb {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--brand-soft);
  color: var(--brand);
  overflow: hidden;
}

.continue-item__thumb img { width: 100%; height: 100%; object-fit: cover; }

.continue-item__body {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 3px;
}

.continue-item__body strong {
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.continue-item__body small {
  font-size: 0.7rem;
  color: var(--text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.continue-item__rail {
  height: 4px;
  margin-top: 3px;
  border-radius: var(--radius-full);
  background: var(--line);
  overflow: hidden;
}

.continue-item__rail i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--brand-gradient);
}

.continue-item__pct {
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 800;
  color: var(--brand);
}

.continue-item__play {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand-gradient);
  color: #ffffff;
  font-size: 0.58rem;
  box-shadow: var(--shadow-brand-sm);
}

/* Achievements */
.achievements-count {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.72rem;
  font-weight: 800;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.achievement {
  display: grid;
  gap: 4px;
  justify-items: center;
  text-align: center;
  padding: 14px 8px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  opacity: 0.72;
  transition: all var(--transition-fast);
}

.achievement.is-unlocked {
  opacity: 1;
  background: var(--brand-soft);
  border-color: rgba(99, 102, 241, 0.18);
}

.achievement__icon {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--text-muted);
  font-size: 0.95rem;
}

.achievement.is-unlocked .achievement__icon {
  background: var(--brand-gradient);
  border-color: transparent;
  color: #ffffff;
  box-shadow: var(--shadow-brand-sm);
}

.achievement strong {
  font-size: 0.74rem;
  font-weight: 800;
  line-height: 1.25;
  color: var(--text-main);
}

.achievement small {
  font-size: 0.64rem;
  line-height: 1.35;
  color: var(--text-muted);
}

.achievement__state {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.achievement.is-unlocked .achievement__state { color: var(--brand); }

.photo-field small {
  font-size: 0.68rem;
  line-height: 1.4;
  color: var(--text-subtle);
}

/* Offline Downloads Entry Card */
.downloads-entry-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: var(--radius-2xl);
  cursor: pointer;
  background: linear-gradient(135deg, rgba(238, 242, 255, 0.92) 0%, rgba(245, 243, 255, 0.92) 100%);
  border: 1px solid rgba(99, 102, 241, 0.16);
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease;
}

:root[data-theme="dark"] .downloads-entry-card {
  background: linear-gradient(135deg, rgba(49, 46, 129, 0.5) 0%, rgba(30, 41, 59, 0.6) 100%);
  border-color: rgba(129, 140, 248, 0.26);
}

.downloads-entry-card:hover {
  transform: translateY(-2px);
  border-color: rgba(99, 102, 241, 0.4);
  box-shadow: 0 14px 32px -12px rgba(79, 70, 229, 0.35);
}

.downloads-entry-card:active {
  transform: scale(0.98);
}

.downloads-entry-left {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.downloads-entry-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  background: var(--brand-gradient, linear-gradient(135deg, #4f46e5, #6366f1));
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 1.2rem;
  box-shadow: var(--shadow-brand-sm);
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
  gap: 18px;
  padding: 22px;
  border-radius: var(--radius-2xl);
}

.form-section-card .section-heading {
  align-items: center;
}

.form-section-card .section-kicker {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.63rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.form-section-card .section-kicker i { font-size: 0.62rem; }

.form-section-card .section-heading h3 {
  margin-top: 8px;
  font-size: 1.18rem;
  letter-spacing: -0.015em;
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

.input-block > span {
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.01em;
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
  gap: 0;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  overflow: hidden;
}

.modern-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 13px 15px;
  border-radius: 0;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--line);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.modern-toggle-row:last-child { border-bottom: none; }
.modern-toggle-row:hover { background: rgba(99, 102, 241, 0.04); }

.toggle-text strong {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-main);
}

.toggle-text small {
  display: block;
  font-size: 0.73rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 46px;
  height: 27px;
  flex-shrink: 0;
}

.switch input {
  position: absolute;
  inset: 0;
  opacity: 0;
  margin: 0;
  cursor: pointer;
  z-index: 2;
}

.slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: var(--line-strong);
  transition: background 0.3s ease, box-shadow 0.3s ease;
  border-radius: var(--radius-full);
}

.slider:before {
  position: absolute;
  content: "";
  height: 21px;
  width: 21px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25);
}

input:checked + .slider {
  background: var(--brand-gradient);
  box-shadow: var(--shadow-brand-sm);
}

input:checked + .slider:before {
  transform: translateX(19px);
}

input:focus-visible + .slider {
  outline: 2px solid var(--brand-light);
  outline-offset: 2px;
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
  background: var(--brand-gradient);
  color: #ffffff;
  border: 1px solid transparent;
  box-shadow: var(--shadow-brand-sm);
}

:root[data-theme="dark"] .theme-segment-btn.is-active {
  background: var(--brand-gradient);
  color: #ffffff;
  box-shadow: var(--shadow-brand-sm);
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
  gap: 12px;
  padding: 14px 16px;
  background: var(--brand-soft);
  border: 1px solid rgba(99, 102, 241, 0.16);
  border-radius: var(--radius-lg);
}

.security-status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.security-status-indicator i {
  font-size: 1.25rem;
  color: var(--brand);
}

.security-status-indicator strong {
  display: block;
  font-size: 0.84rem;
  color: var(--text-main);
}

.security-status-indicator small {
  display: block;
  font-size: 0.73rem;
  color: var(--text-muted);
}

.security-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: var(--brand);
  background: var(--surface);
  border: 1px solid rgba(99, 102, 241, 0.2);
  padding: 4px 10px;
  border-radius: var(--radius-full);
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
  padding: 14px 15px;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-decoration: none;
  transition: all var(--transition-normal);
}

.support-action-tile:hover {
  background: var(--surface);
  border-color: rgba(99, 102, 241, 0.35);
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.support-action-tile:active {
  transform: scale(0.98);
}

.support-action-tile--whatsapp:hover {
  border-color: rgba(37, 211, 102, 0.5);
}

.support-action-icon {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--success-soft);
  color: #059669;
  display: grid;
  place-items: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.support-action-icon--purple {
  background: var(--accent-purple-soft);
  color: #7c3aed;
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
  justify-content: flex-start;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  font-size: 0.82rem;
  font-weight: 700;
}

.maintenance-btn:hover {
  background: var(--brand-soft);
  border-color: rgba(99, 102, 241, 0.3);
  color: var(--brand);
}

.maintenance-btn--vault {
  color: #ef4444;
}

.maintenance-btn--vault:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
  color: #ef4444;
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
  .profile-hero {
    padding: 22px 18px 20px;
  }

  .profile-hero__identity {
    gap: 14px;
  }

  .avatar-container {
    width: 66px;
    height: 66px;
  }

  .identity-text h1 {
    font-size: 1.35rem;
  }

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

  .achievements-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .continue-item {
    padding: 9px 10px;
  }

  .stat-tile {
    padding: 13px;
  }

  .form-section-card {
    padding: 18px;
    gap: 16px;
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

  .security-status-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

</style>
