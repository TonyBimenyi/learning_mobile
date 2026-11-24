<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell">
        <!-- Hero Header -->
        <section class="learning-hero">
          <div class="learning-hero__info">
            <span class="pill pill--brand">
              <i class="fa-solid fa-graduation-cap"></i> {{ t('myDashboard') }}
            </span>
            <h1>{{ t('navMyLearning') }}</h1>
            <p>{{ t('myLearningSubtitle') }}</p>
          </div>
          <div class="learning-hero__tracks">
            <div class="tracks-icon">
              <i class="fa-solid fa-layer-group"></i>
            </div>
            <div>
              <small>{{ t('activeTracks') }}</small>
              <strong>{{ activeCourses.length }}</strong>
            </div>
          </div>
        </section>

        <!-- Segmented Tab Switch: Courses vs Downloads -->
        <div class="learning-tabs-dock">
          <button
            class="learning-tab-dock-btn"
            :class="{ 'is-active': activeTab === 'courses' }"
            type="button"
            @click="activeTab = 'courses'"
          >
            <i class="fa-solid fa-book-open"></i>
            <span>Courses ({{ activeCourses.length }})</span>
          </button>
          <button
            class="learning-tab-dock-btn"
            :class="{ 'is-active': activeTab === 'downloads' }"
            type="button"
            @click="activeTab = 'downloads'"
          >
            <i class="fa-solid fa-cloud-arrow-down"></i>
            <span>Downloads ({{ downloads.length }})</span>
          </button>
        </div>

        <!-- TAB 1: COURSES VIEW -->
        <template v-if="activeTab === 'courses'">
          <!-- Stats Overview Row -->
          <section v-if="isLoading" class="overview-stats-grid">
            <article v-for="n in 3" :key="'stat-skel-'+n" class="surface-card stat-item">
              <SkeletonLoader type="circle" width="42px" height="42px" />
              <div class="stat-item__data">
                <SkeletonLoader type="text" width="40px" height="20px" />
                <SkeletonLoader type="text" width="70px" height="12px" />
              </div>
            </article>
          </section>
          <section v-else class="overview-stats-grid">
            <article class="surface-card stat-item">
              <div class="stat-item__icon stat-item__icon--indigo">
                <i class="fa-solid fa-book-open"></i>
              </div>
              <div class="stat-item__data">
                <strong>{{ activeCourses.length }}</strong>
                <span>{{ t('activeCourses') }}</span>
              </div>
            </article>

            <article class="surface-card stat-item">
              <div class="stat-item__icon stat-item__icon--amber">
                <i class="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div class="stat-item__data">
                <strong>{{ continueWatching.length }}</strong>
                <span>{{ t('resumePoints') }}</span>
              </div>
            </article>

            <article class="surface-card stat-item">
              <div class="stat-item__icon stat-item__icon--emerald">
                <i class="fa-solid fa-circle-check"></i>
              </div>
              <div class="stat-item__data">
                <strong>{{ completedCourses }}</strong>
                <span>{{ t('nearComplete') }}</span>
              </div>
            </article>
          </section>

          <!-- Continue Learning Section -->
          <section class="content-section">
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  <i class="fa-solid fa-bolt"></i> {{ t('jumpBackIn') }}
                </p>
                <h3>{{ t('continueWatching') }}</h3>
              </div>
              <span v-if="continueWatching.length" class="section-caption">
                {{ continueWatching.length }} {{ continueWatching.length === 1 ? 'lesson' : 'lessons' }}
              </span>
            </div>

            <!-- Skeleton for continue watching -->
            <div v-if="isLoading" class="resume-stack">
              <div v-for="n in 2" :key="'cw-skel-'+n" class="resume-card" style="pointer-events:none">
                <div class="resume-card__thumb-container">
                  <SkeletonLoader type="rect" width="96px" height="84px" :rounded="true" />
                </div>
                <div class="resume-card__details">
                  <SkeletonLoader type="text" width="60%" height="12px" />
                  <SkeletonLoader type="text" width="90%" height="16px" />
                  <SkeletonLoader type="text" width="100%" height="10px" />
                  <SkeletonLoader type="rect" width="100%" height="6px" :rounded="true" />
                </div>
              </div>
            </div>

            <div v-else-if="continueWatching.length" class="resume-stack">
              <article
                v-for="entry in continueWatching"
                :key="entry.key"
                class="resume-card"
                @click="openCourse(entry.courseId)"
              >
                <div class="resume-card__thumb-container">
                  <img :src="entry.courseThumbnail" :alt="entry.courseTitle" loading="lazy" />
                  <div class="resume-card__play-btn">
                    <i class="fa-solid fa-play"></i>
                  </div>
                  <span class="resume-badge">{{ entry.progressPercent }}%</span>
                </div>

                <div class="resume-card__details">
                  <span class="resume-course-name">{{ entry.courseTitle }}</span>
                  <strong class="resume-lesson-title">{{ entry.lessonTitle }}</strong>

                  <div class="resume-meta">
                    <span><i class="fa-regular fa-clock"></i> {{ entry.durationLabel }}</span>
                    <span class="resume-pct">{{ entry.progressPercent }}% completed</span>
                  </div>

                  <div class="progress-track">
                    <span :style="{ width: `${entry.progressPercent}%` }"></span>
                  </div>
                </div>
              </article>
            </div>

            <article v-else-if="!isLoading" class="empty-card">
              <div class="empty-icon"><i class="fa-regular fa-clock"></i></div>
              <strong>{{ t('noWatchHistory') }}</strong>
              <p>{{ t('noWatchHistoryHint') }}</p>
              <RouterLink to="/discover" class="primary-button">
                <span>{{ t('findACourse') }}</span>
                <i class="fa-solid fa-arrow-right"></i>
              </RouterLink>
            </article>
          </section>

          <!-- Course Library Section -->
          <section class="content-section">
            <div class="section-heading">
              <div>
                <p class="section-kicker">
                  <i class="fa-solid fa-layer-group"></i> {{ t('myCourses') }}
                </p>
                <h3>{{ t('enrolledLibrary') }}</h3>
              </div>
              <span class="section-caption">{{ activeCourses.length }} total</span>
            </div>

            <!-- Skeleton for course library -->
            <div v-if="isLoading" class="course-library-grid">
              <div v-for="n in 3" :key="'lib-skel-'+n" class="course-lib-card" style="pointer-events:none">
                <div class="course-lib-card__media">
                  <SkeletonLoader type="rect" width="130px" height="100px" :rounded="true" />
                </div>
                <div class="course-lib-card__content">
                  <div class="course-lib-card__tags">
                    <SkeletonLoader type="text" width="50px" height="14px" />
                    <SkeletonLoader type="text" width="45px" height="14px" />
                  </div>
                  <SkeletonLoader type="text" width="85%" height="16px" />
                  <SkeletonLoader type="text" width="100%" height="10px" />
                  <SkeletonLoader type="rect" width="100%" height="6px" :rounded="true" />
                </div>
              </div>
            </div>

            <div v-else-if="activeCourses.length" class="course-library-grid">
              <article
                v-for="course in activeCourses"
                :key="course.id"
                class="course-lib-card"
                @click="openCourse(course.id)"
              >
                <div class="course-lib-card__media">
                  <img :src="course.thumbnail" :alt="course.title" loading="lazy" />
                  <span class="course-lib-card__category">{{ course.category }}</span>
                </div>

                <div class="course-lib-card__content">
                  <div class="course-lib-card__tags">
                    <span class="level-tag">{{ course.level || 'All' }}</span>
                    <span class="rating-chip">
                      <i class="fa-solid fa-star"></i> {{ course.rating || '4.8' }}
                    </span>
                  </div>

                  <h4>{{ course.title }}</h4>

                  <div class="course-lib-card__progress-info">
                    <div class="progress-text-row">
                      <small>{{ getProgress(course).completedLessons }} of {{ course.lessonsCount || 0 }} lessons</small>
                      <strong>{{ getProgress(course).progressPercent }}%</strong>
                    </div>
                    <div class="progress-track">
                      <span :style="{ width: `${getProgress(course).progressPercent}%` }"></span>
                    </div>
                  </div>
                </div>
              </article>
            </div>

            <article v-else-if="!isLoading" class="empty-card">
              <div class="empty-icon"><i class="fa-solid fa-book-open"></i></div>
              <strong>{{ t('noEnrolledCourses') }}</strong>
              <p>{{ t('noEnrolledHint') }}</p>
              <RouterLink to="/discover" class="primary-button">
                <span>{{ t('exploreCatalog') }}</span>
                <i class="fa-solid fa-compass"></i>
              </RouterLink>
            </article>
          </section>
        </template>

        <!-- TAB 2: OFFLINE DOWNLOADS VAULT VIEW -->
        <template v-else>
          <section class="content-section">
            <div class="surface-card downloads-vault-header">
              <div class="vault-info">
                <span class="vault-secure-pill">
                  <i class="fa-solid fa-shield-halved"></i> {{ t('appSandboxProtected') }}
                </span>
                <h3>{{ t('offlineDownloads') }}</h3>
                <p>
                  Videos are stored inside the app sandbox for offline watching. They cannot be shared or opened outside the Twige app.
                </p>
              </div>

              <div class="vault-meta-row">
                <span class="storage-tag">
                  <i class="fa-solid fa-hard-drive"></i>
                  <span>Storage: {{ totalStorageUsed }}</span>
                </span>
                <button
                  v-if="downloads.length"
                  class="ghost-button clear-vault-btn"
                  type="button"
                  @click="handleClearAllDownloads"
                >
                  <i class="fa-solid fa-trash-can"></i>
                  <span>Clear All</span>
                </button>
              </div>
            </div>

            <div v-if="downloads.length" class="downloads-stack">
              <article
                v-for="item in downloads"
                :key="item.lessonId"
                class="download-card"
              >
                <div class="download-card__thumb" @click="playOfflineLesson(item)">
                  <img :src="item.courseThumbnail" :alt="item.courseTitle" loading="lazy" />
                  <div class="download-card__play">
                    <i class="fa-solid fa-play"></i>
                  </div>
                  <span class="offline-ready-badge">
                    <i class="fa-solid fa-bolt"></i> {{ t('offline') }}
                  </span>
                </div>

                <div class="download-card__body">
                  <span class="download-card__course">{{ item.courseTitle }}</span>
                  <strong class="download-card__title" @click="playOfflineLesson(item)">
                    {{ item.lessonTitle }}
                  </strong>

                  <div class="download-card__meta">
                    <span><i class="fa-regular fa-clock"></i> {{ item.duration }}</span>
                    <span class="download-card__size">{{ item.fileSizeLabel }}</span>
                  </div>

                  <div class="download-card__actions">
                    <button class="primary-button watch-offline-btn" type="button" @click="playOfflineLesson(item)">
                      <i class="fa-solid fa-circle-play"></i>
                      <span>{{ t('watchOffline') }}</span>
                    </button>
                    <button
                      class="ghost-button delete-download-btn"
                      type="button"
                      title="Remove from offline vault"
                      @click="handleDeleteDownload(item.lessonId)"
                    >
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <article v-else class="empty-card">
              <div class="empty-icon"><i class="fa-solid fa-cloud-arrow-down"></i></div>
              <strong>No offline videos saved yet</strong>
              <p>Go to any course lesson and tap the <b>Download</b> button to save it securely for offline viewing without cellular data.</p>
              <button class="primary-button" type="button" @click="activeTab = 'courses'">
                <span>Browse My Courses</span>
                <i class="fa-solid fa-arrow-right"></i>
              </button>
            </article>
          </section>
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
import { useRouter, useRoute } from 'vue-router';
import BottomNav from '@/components/BottomNav.vue';
import CardSkeleton from '@/components/CardSkeleton.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { getCourses, getEnrollments } from '@/services/api';
import { getCourseProgress } from '@/services/course-helpers';
import { getContinueWatchingList, getProgressMap } from '@/services/storage';
import {
  getAllDownloads,
  deleteDownloadedLesson,
  clearAllDownloads,
  getTotalOfflineStorageUsage,
} from '@/services/downloads';

export default {
  name: 'MyLearningPage',
  components: { BottomNav, IonContent, IonPage, CardSkeleton, SkeletonLoader },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const courses = ref([]);
    const enrollments = ref([]);
    const progressMap = ref(getProgressMap());
    const activeTab = ref(route.query.tab === 'downloads' ? 'downloads' : 'courses');
    const downloads = ref([]);
    const totalStorageUsed = ref('0 B');
    const isLoading = ref(true);

    const continueWatching = computed(() => {
      // Read progressMap so this recomputes when lesson progress is saved.
      void progressMap.value;
      // Only surface lessons that are genuinely in progress (< 95%).
      return getContinueWatchingList().filter(
        (entry) => Number(entry.progressPercent || 0) < 95,
      );
    });

    const enrolledCourseIds = computed(() =>
      enrollments.value.map((enrollment) => enrollment.courseId)
    );

    // Access comes from the backend (confirmed AfripayResponse), not from the
    // local payment-status string. A paid course appears only once unlocked.
    const activeCourses = computed(() => {
      const progressCourseIds = [...new Set(continueWatching.value.map((entry) => entry.courseId))];
      return courses.value.filter((course) => {
        const hasAccess = typeof course.hasAccess === 'boolean'
          ? course.hasAccess
          : enrolledCourseIds.value.includes(course.id);
        if (!hasAccess) return false;
        return Number(course.price || 0) === 0
          || enrolledCourseIds.value.includes(course.id)
          || progressCourseIds.includes(course.id);
      });
    });

    const completedCourses = computed(() =>
      activeCourses.value.filter((course) => getCourseProgress(course, progressMap.value).progressPercent >= 95).length
    );

    const loadDashboard = async () => {
      isLoading.value = true;
      try {
        const [c, e] = await Promise.all([
          getCourses().catch(() => []),
          getEnrollments().catch(() => []),
        ]);
        courses.value = c || [];
        enrollments.value = e || [];
      } catch (err) {
        console.warn('Could not load learning dashboard', err);
        courses.value = [];
        enrollments.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    const loadDownloads = async () => {
      try {
        const [dList, usage] = await Promise.all([
          getAllDownloads(),
          getTotalOfflineStorageUsage(),
        ]);
        downloads.value = dList || [];
        totalStorageUsed.value = usage.totalFormatted || '0 B';
      } catch (err) {
        console.warn(translate('loadDownloadsError'), err);
      }
    };

    const getProgress = (course) => getCourseProgress(course, progressMap.value);

    const openCourse = (id) => {
      router.push(`/course/${id}`);
    };

    const playOfflineLesson = (item) => {
      router.push({
        path: `/course/${item.courseId}`,
        query: { lessonIndex: item.lessonIndex ?? 0 },
      });
    };

    const handleDeleteDownload = async (lessonId) => {
      await deleteDownloadedLesson(lessonId);
      await loadDownloads();
    };

    const handleClearAllDownloads = async () => {
      await clearAllDownloads();
      await loadDownloads();
    };

    const handleStorageUpdate = () => {
      progressMap.value = getProgressMap();
    };

    onMounted(() => {
      loadDashboard();
      loadDownloads();
      window.addEventListener('twige:update', handleStorageUpdate);
      window.addEventListener('twige:downloads-update', loadDownloads);
    });

    onUnmounted(() => {
      window.removeEventListener('twige:update', handleStorageUpdate);
      window.removeEventListener('twige:downloads-update', loadDownloads);
    });

    return {
      isLoading,
      activeTab,
      courses,
      enrollments,
      progressMap,
      continueWatching,
      activeCourses,
      completedCourses,
      downloads,
      totalStorageUsed,
      getProgress,
      openCourse,
      playOfflineLesson,
      handleDeleteDownload,
      handleClearAllDownloads,
    };
  },
};
</script>

<style scoped>
/* Hero Header */
.learning-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
  border-radius: var(--radius-2xl);
  background: var(--brand-hero-gradient);
  color: #ffffff;
  box-shadow: 0 26px 52px -20px rgba(49, 46, 129, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.12);
  overflow: hidden;
}

.learning-hero::before {
  content: '';
  position: absolute;
  top: -60%;
  right: -10%;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.35) 0%, transparent 70%);
  pointer-events: none;
}

.learning-hero__info {
  display: grid;
  gap: 10px;
  position: relative;
  z-index: 1;
}

.learning-hero .pill--brand {
  width: fit-content;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.learning-hero h1 {
  margin: 4px 0 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.03em;
  line-height: 1.15;
}

.learning-hero p {
  margin: 0;
  font-size: 0.88rem;
  color: rgba(241, 245, 249, 0.85);
  line-height: 1.5;
  max-width: 28rem;
}

.learning-hero__tracks {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 20px -6px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.tracks-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 1.15rem;
}

.learning-hero__tracks small {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  color: rgba(241, 245, 249, 0.8);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.learning-hero__tracks strong {
  display: block;
  font-size: 1.35rem;
  font-weight: 800;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  line-height: 1.2;
}

/* Tab Selector Dock */
.learning-tabs-dock {
  display: flex;
  gap: 4px;
  padding: 5px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.learning-tab-dock-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-full);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.learning-tab-dock-btn.is-active {
  background: var(--brand-gradient);
  color: #ffffff;
  box-shadow: var(--shadow-brand-sm);
}

/* Stats Overview */
.overview-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.stat-item {
  display: grid;
  justify-items: center;
  gap: 8px;
  padding: 14px 8px;
  border-radius: var(--radius-lg);
  text-align: center;
}

.stat-item__icon {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.stat-item__icon--indigo { background: var(--brand-soft); color: var(--brand); }
.stat-item__icon--amber { background: var(--warning-soft); color: #d97706; }
.stat-item__icon--emerald { background: var(--success-soft); color: #059669; }

.stat-item__data strong {
  display: block;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
  line-height: 1.2;
}

.stat-item__data span {
  display: block;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-subtle);
}

.content-section .section-kicker {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.63rem;
  font-weight: 800;
}

.content-section .section-heading h3 {
  margin-top: 8px;
  font-size: 1.2rem;
  letter-spacing: -0.015em;
}

/* Resume Stack */
.resume-stack {
  display: grid;
  gap: 14px;
}

.resume-card {
  display: grid;
  grid-template-columns: 92px 1fr;
  gap: 14px;
  padding: 12px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  align-items: center;
  transition: all var(--transition-normal);
}

.resume-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
  border-color: rgba(99, 102, 241, 0.3);
}

.resume-card__thumb-container {
  position: relative;
  width: 92px;
  height: 84px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.resume-card__thumb-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.resume-card:hover .resume-card__thumb-container img {
  transform: scale(1.06);
}

.resume-card__play-btn {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--brand-gradient);
  box-shadow: var(--shadow-brand-sm);
  border: 2px solid rgba(255, 255, 255, 0.6);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
}

.resume-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 800;
}

.resume-card__details {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.resume-course-name {
  width: fit-content;
  max-width: 100%;
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.resume-lesson-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resume-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-muted);
}

.resume-pct {
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--brand-soft);
  color: var(--brand);
  font-weight: 800;
}

.progress-track {
  height: 5px;
  border-radius: var(--radius-full);
  background: var(--line);
  overflow: hidden;
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--brand-gradient);
  transition: width 0.4s ease;
}

/* Course Library Grid */
.course-library-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.course-lib-card {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.course-lib-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
  border-color: rgba(99, 102, 241, 0.3);
}

.course-lib-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.course-lib-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.course-lib-card:hover .course-lib-card__media img {
  transform: scale(1.06);
}

.course-lib-card__category {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  color: var(--brand);
  font-size: 0.62rem;
  font-weight: 800;
  box-shadow: 0 3px 8px rgba(15, 23, 42, 0.15);
}

.course-lib-card__content {
  display: grid;
  gap: 7px;
  flex: 1;
  padding: 11px 4px 4px;
}

.course-lib-card__tags {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.level-tag {
  font-size: 0.64rem;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--surface-soft);
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

.course-lib-card h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.3;
  letter-spacing: -0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-lib-card__progress-info {
  display: grid;
  gap: 5px;
  margin-top: auto;
  padding-top: 4px;
}

.progress-text-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.68rem;
}

.progress-text-row small {
  color: var(--text-muted);
}

.progress-text-row strong {
  color: var(--brand);
  font-weight: 800;
}

/* Downloads Vault */
.downloads-vault-header {
  display: grid;
  gap: 16px;
  padding: 22px;
  border-radius: var(--radius-2xl);
  background: linear-gradient(135deg, rgba(238, 242, 255, 0.92) 0%, rgba(245, 243, 255, 0.92) 100%);
  border: 1px solid rgba(99, 102, 241, 0.16);
}

:root[data-theme="dark"] .downloads-vault-header {
  background: linear-gradient(135deg, rgba(49, 46, 129, 0.5) 0%, rgba(30, 41, 59, 0.6) 100%);
  border-color: rgba(129, 140, 248, 0.26);
}

.vault-info {
  display: grid;
  gap: 6px;
}

.vault-secure-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: var(--success-soft);
  color: var(--success);
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.vault-info h3 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
}

.vault-info p {
  margin: 0;
  font-size: 0.86rem;
  color: var(--text-muted);
  line-height: 1.5;
}

.vault-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--line);
}

.storage-tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.storage-tag i {
  color: var(--brand);
}

.clear-vault-btn {
  padding: 7px 12px;
  font-size: 0.78rem;
  border-radius: var(--radius-md);
  color: var(--danger);
  border-color: rgba(239, 68, 68, 0.2);
}

.clear-vault-btn:hover {
  background: var(--danger-soft);
}

/* Downloads Grid */
.downloads-stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.download-card {
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-normal);
}

.download-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
  border-color: rgba(99, 102, 241, 0.3);
}

.download-card__thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: pointer;
}

.download-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.35s ease;
}

.download-card:hover .download-card__thumb img {
  transform: scale(1.06);
}

.download-card__play {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--brand-gradient);
  box-shadow: var(--shadow-brand-sm);
  border: 2px solid rgba(255, 255, 255, 0.6);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 0.72rem;
}

.offline-ready-badge {
  position: absolute;
  top: 7px;
  left: 7px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: rgba(16, 185, 129, 0.92);
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.download-card__body {
  display: grid;
  gap: 7px;
  flex: 1;
  padding: 11px 4px 4px;
}

.download-card__course {
  width: fit-content;
  max-width: 100%;
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.download-card__title {
  font-size: 0.86rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.3;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.download-card__title:hover {
  color: var(--brand);
}

.download-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.68rem;
  color: var(--text-muted);
}

.download-card__size {
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--surface-soft);
  padding: 2px 7px;
  border-radius: var(--radius-full);
  border: 1px solid var(--line);
}

.download-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  padding-top: 6px;
}

.watch-offline-btn {
  flex: 1;
  min-width: 0;
  justify-content: center;
  padding: 8px 10px;
  font-size: 0.74rem;
  border-radius: var(--radius-md);
  gap: 6px;
}

.delete-download-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: var(--radius-full);
  display: grid;
  place-items: center;
  color: var(--danger);
  background: var(--danger-soft);
  border: 1px solid rgba(239, 68, 68, 0.2);
  font-size: 0.74rem;
}

.delete-download-btn:hover {
  color: var(--danger);
  border-color: rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.16);
}

@media (max-width: 540px) {
  .learning-hero {
    flex-direction: column;
    align-items: stretch;
    padding: 22px 18px 20px;
  }

  .learning-hero h1 {
    font-size: 1.5rem;
  }

  .learning-hero__tracks {
    width: 100%;
    justify-content: flex-start;
  }

  .overview-stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .stat-item {
    padding: 12px 5px;
  }

  .downloads-vault-header {
    padding: 18px;
  }
}

@media (max-width: 400px) {
  .course-library-grid,
  .downloads-stack {
    grid-template-columns: 1fr;
  }
}
</style>
