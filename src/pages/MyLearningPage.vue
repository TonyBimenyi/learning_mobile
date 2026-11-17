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
          <div class="learning-hero__streak">
            <div class="streak-icon">
              <i class="fa-solid fa-fire"></i>
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
            :class="{ 'is-active': activeTab === translate('courses') }"
            type="button"
            @click="activeTab = translate('courses')"
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
        <template v-if="activeTab === translate('courses')">
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
              <button class="primary-button" type="button" @click="activeTab = translate('courses')">
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
    const activeTab = ref(route.query.tab === 'downloads' ? 'downloads' : translate('courses'));
    const downloads = ref([]);
    const totalStorageUsed = ref('0 B');
    const isLoading = ref(true);

    const continueWatching = computed(() => getContinueWatchingList());

    const enrolledCourseIds = computed(() =>
      enrollments.value
        .filter((enrollment) => enrollment.paymentStatus === 'success')
        .map((enrollment) => enrollment.courseId)
    );

    const activeCourses = computed(() => {
      if (enrolledCourseIds.value.length) {
        return courses.value.filter((course) => enrolledCourseIds.value.includes(course.id));
      }
      const progressCourseIds = [...new Set(continueWatching.value.map((entry) => entry.courseId))];
      return courses.value.filter((course) => progressCourseIds.includes(course.id));
    });

    const completedCourses = computed(() =>
      activeCourses.value.filter((course) => getCourseProgress(course, progressMap.value).progressPercent >= 90).length
    );

    const loadDashboard = async () => {
      isLoading.value = true;
      const [c, e] = await Promise.all([getCourses(), getEnrollments()]);
      courses.value = c || [];
      enrollments.value = e || [];
      isLoading.value = false;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border-radius: var(--radius-2xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
}

.learning-hero__info {
  display: grid;
  gap: 8px;
}

.learning-hero h1 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: -0.02em;
}

.learning-hero p {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-muted);
  line-height: 1.5;
  max-width: 28rem;
}

.learning-hero__streak {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: var(--radius-xl);
  background: var(--brand-soft);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.streak-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #ffffff;
  color: #ea580c;
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  box-shadow: 0 4px 10px rgba(234, 88, 12, 0.15);
}

.learning-hero__streak small {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--brand);
  text-transform: uppercase;
}

.learning-hero__streak strong {
  display: block;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  font-family: 'Outfit', sans-serif;
}

/* Tab Selector Dock */
.learning-tabs-dock {
  display: flex;
  padding: 5px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  gap: 8px;
}

.learning-tab-dock-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: var(--radius-lg);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.86rem;
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
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-xl);
}

.stat-item__icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.stat-item__icon--indigo { background: #eef2ff; color: #4f46e5; }
.stat-item__icon--amber { background: #fffbeb; color: #d97706; }
.stat-item__icon--emerald { background: #ecfdf5; color: #059669; }

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
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--text-muted);
}

/* Resume Stack */
.resume-stack {
  display: grid;
  gap: 14px;
}

.resume-card {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 16px;
  padding: 14px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  align-items: center;
  transition: all var(--transition-normal);
}

.resume-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
  border-color: rgba(99, 102, 241, 0.3);
}

.resume-card__thumb-container {
  position: relative;
  width: 96px;
  height: 84px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.resume-card__thumb-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resume-card__play-btn {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 0.75rem;
}

.resume-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  background: rgba(15, 23, 42, 0.85);
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
}

.resume-card__details {
  display: grid;
  gap: 6px;
}

.resume-course-name {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.resume-lesson-title {
  font-size: 0.96rem;
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
  font-size: 0.76rem;
  color: var(--text-muted);
}

.resume-pct {
  font-weight: 700;
  color: var(--brand);
}

/* Course Library Grid */
.course-library-grid {
  display: grid;
  gap: 16px;
}

.course-lib-card {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 16px;
  padding: 14px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all var(--transition-normal);
  align-items: center;
}

.course-lib-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
  border-color: rgba(99, 102, 241, 0.3);
}

.course-lib-card__media {
  position: relative;
  height: 100px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.course-lib-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.course-lib-card__category {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(4px);
  color: var(--brand);
  font-size: 0.65rem;
  font-weight: 700;
}

.course-lib-card__content {
  display: grid;
  gap: 6px;
}

.course-lib-card__tags {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.level-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-soft);
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

.course-lib-card h4 {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-lib-card__progress-info {
  display: grid;
  gap: 4px;
  margin-top: 4px;
}

.progress-text-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.74rem;
}

.progress-text-row small {
  color: var(--text-muted);
}

.progress-text-row strong {
  color: var(--brand);
}

/* Downloads Vault */
.downloads-vault-header {
  display: grid;
  gap: 16px;
  padding: 22px;
  border-radius: var(--radius-2xl);
  background:
    radial-gradient(circle at top right, rgba(16, 185, 129, 0.1), transparent 30%),
    var(--surface);
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

/* Downloads Stack */
.downloads-stack {
  display: grid;
  gap: 14px;
}

.download-card {
  display: grid;
  grid-template-columns: 108px 1fr;
  gap: 16px;
  padding: 14px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  align-items: center;
  transition: all var(--transition-normal);
}

.download-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
  border-color: rgba(16, 185, 129, 0.3);
}

.download-card__thumb {
  position: relative;
  width: 108px;
  height: 94px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
}

.download-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.download-card__play {
  position: absolute;
  inset: 0;
  margin: auto;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 0.8rem;
}

.offline-ready-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  background: rgba(16, 185, 129, 0.9);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.download-card__body {
  display: grid;
  gap: 6px;
}

.download-card__course {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.download-card__title {
  font-size: 0.95rem;
  color: var(--text-main);
  line-height: 1.35;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 1;
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
  font-size: 0.76rem;
  color: var(--text-muted);
}

.download-card__size {
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--surface-soft);
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

.download-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.watch-offline-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 0.82rem;
  border-radius: var(--radius-md);
  gap: 6px;
}

.delete-download-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  color: var(--text-muted);
}

.delete-download-btn:hover {
  color: var(--danger);
  border-color: rgba(239, 68, 68, 0.3);
  background: var(--danger-soft);
}

@media (max-width: 540px) {
  .learning-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .learning-hero__streak {
    width: 100%;
    justify-content: center;
  }

  .overview-stats-grid {
    grid-template-columns: 1fr;
  }

  .course-lib-card {
    grid-template-columns: 1fr;
  }

  .course-lib-card__media {
    height: 140px;
  }

  .download-card {
    grid-template-columns: 1fr;
  }

  .download-card__thumb {
    width: 100%;
    height: 150px;
  }
}
</style>
