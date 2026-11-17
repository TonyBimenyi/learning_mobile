<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell">
        <!-- Hero Header Section -->
        <section class="home-hero">
          <div class="home-hero__top">
            <div class="home-hero__greeting">
              <div class="home-hero__tag">
                <span class="pulse-dot"></span>
                <span>{{ t('appName') }}</span>
              </div>
              <h1>{{ greetingText }}, {{ firstName }}</h1>
              <p>{{ heroDescription }}</p>
            </div>
            <div class="home-hero__actions">
              <button class="hero-icon-btn" type="button" :aria-label="t('notifications')" @click="goToProfile">
                <i class="fa-regular fa-bell"></i>
              </button>
              <button class="hero-avatar-btn" type="button" :aria-label="t('navProfile')" @click="goToProfile">
                {{ userInitial }}
              </button>
            </div>
          </div>

          <!-- Glass Search Box -->
          <div class="hero-search-card">
            <label class="hero-search-field">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('searchHomePlaceholder')"
                @keyup.enter="goToDiscover"
              />
            </label>
            <button class="hero-search-btn" type="button" @click="goToDiscover">
              <span>{{ t('navExplore') }}</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>

          <!-- Quick Metrics Banner -->
          <div class="hero-stat-grid">
            <article class="hero-stat-card">
              <div class="hero-stat-card__icon"><i class="fa-solid fa-book-open"></i></div>
              <div class="hero-stat-card__content">
                <small>{{ t('courses') }}</small>
                <strong>{{ courses.length }}</strong>
              </div>
            </article>
            <article class="hero-stat-card">
              <div class="hero-stat-card__icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
              <div class="hero-stat-card__content">
                <small>{{ t('inProgress') }}</small>
                <strong>{{ continueWatching.length }}</strong>
              </div>
            </article>
            <article class="hero-stat-card">
              <div class="hero-stat-card__icon"><i class="fa-solid fa-shapes"></i></div>
              <div class="hero-stat-card__content">
                <small>{{ t('tracks') }}</small>
                <strong>{{ categories.length }}</strong>
              </div>
            </article>
          </div>
        </section>

        <!-- Continue Learning Rail -->
        <section class="content-section">
          <div class="section-heading">
            <div>
              <p class="section-kicker">
                <i class="fa-solid fa-bolt"></i> {{ t('continueLearning') }}
              </p>
              <h3>{{ t('resumeFlow') }}</h3>
            </div>
            <RouterLink to="/my-learning" class="text-link">
              <span>{{ t('myLibrary') }}</span>
              <i class="fa-solid fa-chevron-right"></i>
            </RouterLink>
          </div>

<div v-if="isLoading" class="resume-rail">
  <CardSkeleton v-for="n in 3" :key="n" />
</div>
<div v-else-if="continueWatching.length" class="resume-rail">
            <article
              v-for="item in continueWatching.slice(0, 3)"
              :key="item.key"
              class="resume-rail-card"
              @click="openCourse(item.courseId)"
            >
              <div class="resume-rail-card__thumb-wrap">
                <img :src="item.courseThumbnail" :alt="item.courseTitle" loading="lazy" />
                <div class="resume-rail-card__play">
                  <i class="fa-solid fa-play"></i>
                </div>
              </div>
              <div class="resume-rail-card__body">
                <span class="resume-rail-card__tag">{{ item.courseTitle }}</span>
                <strong>{{ item.lessonTitle }}</strong>
                <div class="resume-rail-card__meta">
                  <span><i class="fa-regular fa-clock"></i> {{ item.durationLabel }}</span>
                  <span class="progress-percent-badge">{{ item.progressPercent }}%</span>
                </div>
                <div class="progress-track">
                  <span :style="{ width: `${item.progressPercent}%` }"></span>
                </div>
              </div>
            </article>
          </div>
          <article v-else class="empty-card">
            <div class="empty-icon"><i class="fa-regular fa-compass"></i></div>
            <strong>{{ t('noActiveLessons') }}</strong>
            <p>{{ t('noActiveLessonsHint') }}</p>
          </article>
        </section>

        <!-- Category Grid / Rail -->
        <section class="content-section">
          <div class="section-heading">
            <div>
              <p class="section-kicker">
                <i class="fa-solid fa-layer-group"></i> {{ t('exploreTracks') }}
              </p>
              <h3>{{ t('browseBySubject') }}</h3>
            </div>
            <RouterLink to="/discover" class="text-link">
              <span>{{ t('viewAll') }}</span>
              <i class="fa-solid fa-chevron-right"></i>
            </RouterLink>
          </div>

          <div class="category-rail">
            <button
              v-for="category in categories.slice(0, 8)"
              :key="category.name"
              class="category-rail-card"
              :class="getCategoryTheme(category.name)"
              type="button"
              @click="openDiscover(category.name)"
            >
              <div class="category-rail-card__icon-box">
                <i :class="getCategoryIcon(category.name)"></i>
              </div>
              <div class="category-rail-card__info">
                <strong>{{ category.name }}</strong>
                <small>{{ category.courseCount }} {{ category.courseCount === 1 ? translate('courseSingular') : translate('courses') }}</small>
              </div>
            </button>
          </div>
        </section>

        <!-- Lesson Video Picks -->
        <section class="content-section">
          <div class="section-heading">
            <div>
              <p class="section-kicker">
                <i class="fa-solid fa-video"></i> {{ t('quickLessons') }}
              </p>
              <h3>{{ t('biteSizedPreviews') }}</h3>
            </div>
          </div>

          <div class="lesson-rail">
            <article
              v-for="lesson in featuredLessons.slice(0, 6)"
              :key="lesson.id"
              class="lesson-preview-card"
              @click="openCourse(lesson.courseId)"
            >
              <div class="lesson-preview-card__media">
                <img :src="getVideoPreview(lesson)" :alt="lesson.lessonTitle" loading="lazy" />
                <div class="lesson-preview-card__overlay">
                  <span class="lesson-preview-card__play">
                    <i class="fa-solid fa-play"></i>
                  </span>
                  <span class="lesson-preview-card__duration">
                    <i class="fa-regular fa-clock"></i> {{ lesson.duration || translate('video') }}
                  </span>
                </div>
              </div>
              <div class="lesson-preview-card__body">
                <small>{{ lesson.courseTitle }}</small>
                <strong>{{ lesson.lessonTitle }}</strong>
              </div>
            </article>
          </div>
        </section>

        <!-- Featured Courses -->
        <section class="content-section">
          <div class="section-heading">
            <div>
              <p class="section-kicker">
                <i class="fa-solid fa-award"></i> {{ t('featuredLearning') }}
              </p>
              <h3>{{ t('topRatedCourses') }}</h3>
            </div>
            <RouterLink to="/discover" class="text-link">
              <span>{{ t('seeCatalog') }}</span>
              <i class="fa-solid fa-chevron-right"></i>
            </RouterLink>
          </div>

          <!-- Featured courses skeleton -->
          <div v-if="isLoading" class="feature-course-stack">
            <div v-for="n in 3" :key="'feat-skel-'+n" class="feature-course-card" style="pointer-events:none">
              <div class="feature-course-card__media">
                <SkeletonLoader type="rect" width="100%" height="160px" :rounded="true" />
              </div>
              <div class="feature-course-card__body">
                <div class="feature-course-card__meta">
                  <SkeletonLoader type="text" width="70px" height="14px" />
                  <SkeletonLoader type="text" width="50px" height="14px" />
                </div>
                <SkeletonLoader type="text" width="85%" height="18px" />
                <SkeletonLoader type="text" width="100%" height="14px" />
                <div class="feature-course-card__footer" style="border:none;padding-top:8px">
                  <SkeletonLoader type="text" width="80px" height="22px" />
                  <SkeletonLoader type="rect" width="110px" height="36px" :rounded="true" />
                </div>
              </div>
            </div>
          </div>

          <div v-else class="feature-course-stack">
            <article
              v-for="course in featuredCourses.slice(0, 4)"
              :key="course.id"
              class="feature-course-card"
              @click="openCourse(course.id)"
            >
              <div class="feature-course-card__media">
                <img :src="course.thumbnail" :alt="course.title" loading="lazy" />
                <span class="feature-course-card__category">{{ course.category }}</span>
              </div>
              <div class="feature-course-card__body">
                <div class="feature-course-card__meta">
                  <span class="course-level-badge">{{ course.level || translate('allLevels') }}</span>
                  <span class="rating-chip">
                    <i class="fa-solid fa-star"></i> {{ course.rating || '4.8' }}
                  </span>
                </div>
                <h4>{{ course.title }}</h4>
                <p>{{ shortDescription(course) }}</p>
                <div class="feature-course-card__footer">
                  <div class="feature-course-card__price-group">
                    <small>{{ t('fullCourse') }}</small>
                    <strong>{{ formatCurrency(course.price) }}</strong>
                  </div>
                  <button class="primary-button feature-course-card__btn" type="button">
                    <span>{{ t('enrollNow') }}</span>
                    <i class="fa-solid fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <BottomNav />
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { translate } from '@/services/i18n';
import { IonContent, IonPage } from '@ionic/vue';
import BottomNav from '@/components/BottomNav.vue';
import CardSkeleton from '@/components/CardSkeleton.vue';
import SkeletonLoader from '@/components/SkeletonLoader.vue';
import { getCourses, getCurrentUser, getHomepageContent } from '@/services/api';
import {
  flattenLessons,
  formatCurrency,
  getCategories,
  getCategoryIcon,
  getVideoPreview,
} from '@/services/course-helpers';
import { getContinueWatchingList } from '@/services/storage';

export default {
  name: 'HomePage',
  components: {
    BottomNav,
    IonContent,
    IonPage,
    CardSkeleton,
    SkeletonLoader,
  },
  data() {
    return {
      homepageContent: null,
      courses: [],
      user: null,
      searchQuery: '',
      continueWatching: getContinueWatchingList(),
      isLoading: true,
    };
  },
  computed: {
    firstName() {
      return (this.user?.name || translate('learner')).split(' ')[0];
    },
    userInitial() {
      return (this.firstName || 'L').charAt(0).toUpperCase();
    },
    greetingText() {
      const hour = new Date().getHours();
      if (hour < 12) return translate('goodMorning');
      if (hour < 18) return translate('goodAfternoon');
      return translate('goodEvening');
    },
    heroDescription() {
      return this.homepageContent?.heroDescription || translate('heroDescription2');
    },
    categories() {
      return getCategories(this.courses);
    },
    featuredCourses() {
      const featured = this.courses.filter((course) => course.featured);
      return featured.length ? featured : this.courses;
    },
    featuredLessons() {
      return flattenLessons(this.courses);
    },
  },
  mounted() {
    this.loadHome();
    window.addEventListener('twige:update', this.handleStorageUpdate);
  },
  beforeUnmount() {
    window.removeEventListener('twige:update', this.handleStorageUpdate);
  },
  methods: {
    formatCurrency,
    getCategoryIcon,
    getVideoPreview,
    getCategoryTheme(category) {
      const name = String(category || '').toLowerCase();
      if (name.includes('ai') || name.includes('artificial')) return 'theme-purple';
      if (name.includes('design')) return 'theme-rose';
      if (name.includes('code') || name.includes('dev') || name.includes('programming')) return 'theme-cyan';
      if (name.includes('business') || name.includes('marketing')) return 'theme-amber';
      if (name.includes('data')) return 'theme-indigo';
      return 'theme-emerald';
    },
    async loadHome() {
      const [homepageContent, courses, user] = await Promise.all([
        getHomepageContent().catch(() => null),
        getCourses().catch(() => []),
        getCurrentUser().catch(() => null),
      ]);

      this.homepageContent = homepageContent;
      this.courses = courses || [];
      this.user = user;
      this.continueWatching = getContinueWatchingList();
      this.isLoading = false; // loading complete
    },
    shortDescription(course) {
      const text = String(course.longDescription || course.description || '').trim();
      if (!text) {
        return translate('heroDescription1');
      }
      return text.length > 82 ? `${text.slice(0, 82)}...` : text;
    },
    goToDiscover() {
      const query = this.searchQuery.trim();
      this.$router.push({
        path: '/discover',
        query: query ? { q: query } : {},
      });
    },
    openCourse(id) {
      this.$router.push(`/course/${id}`);
    },
    openDiscover(category) {
      this.$router.push({
        path: '/discover',
        query: { category },
      });
    },
    goToProfile() {
      this.$router.push('/profile');
    },
    handleStorageUpdate() {
      this.continueWatching = getContinueWatchingList();
    },
  },
};
</script>

<style scoped>
/* Hero Section */
.home-hero {
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

.home-hero::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, transparent 70%);
  pointer-events: none;
}

.home-hero__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.home-hero__greeting {
  display: grid;
  gap: 6px;
}

.home-hero__tag {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.3);
  animation: pulseAnimation 2s infinite;
}

@keyframes pulseAnimation {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(52, 211, 153, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(52, 211, 153, 0); }
}

.home-hero h1 {
  margin: 2px 0 0;
  color: #ffffff;
  font-size: 1.68rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.home-hero p {
  margin: 0;
  color: rgba(241, 245, 249, 0.85);
  font-size: 0.88rem;
  line-height: 1.5;
  max-width: 32rem;
}

.home-hero__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hero-icon-btn,
.hero-avatar-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.hero-avatar-btn {
  background: linear-gradient(135deg, #6366f1, #a855f7);
  font-size: 1.05rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
}

.hero-icon-btn:hover,
.hero-avatar-btn:hover {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.22);
}

/* Glass Search Card */
.hero-search-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 8px 7px 16px;
  border-radius: var(--radius-xl);
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  position: relative;
  z-index: 1;
}

.hero-search-field {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.hero-search-field i {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.95rem;
}

/* Higher specificity so the dark-mode form rule can't add a background. */
.hero-search-field input[type='text'] {
  width: 100%;
  border: none;
  outline: none;
  background: transparent !important;
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 500;
}

.hero-search-field input::placeholder {
  color: rgba(241, 245, 249, 0.65);
}

.hero-search-btn {
  padding: 10px 18px;
  border-radius: var(--radius-md);
  background: #ffffff;
  color: var(--brand-deep);
  font-weight: 700;
  font-size: 0.86rem;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all var(--transition-fast);
}

.hero-search-btn:hover {
  background: #f8fafc;
  transform: translateX(2px);
}

/* Stat Grid */
.hero-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  position: relative;
  z-index: 1;
}

.hero-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
}

.hero-stat-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  display: grid;
  place-items: center;
  font-size: 0.9rem;
  color: #ffffff;
}

.hero-stat-card__content small {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: rgba(226, 232, 240, 0.75);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.hero-stat-card__content strong {
  display: block;
  font-size: 1.22rem;
  font-weight: 800;
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
}

/* Resume Rail */
.resume-rail {
  display: grid;
  gap: 12px;
}

.resume-rail-card {
  display: grid;
  grid-template-columns: 84px 1fr;
  gap: 16px;
  padding: 12px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  align-items: center;
  transition: all var(--transition-normal);
}

.resume-rail-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
  border-color: rgba(99, 102, 241, 0.3);
}

.resume-rail-card__thumb-wrap {
  position: relative;
  width: 84px;
  height: 84px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.resume-rail-card__thumb-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.resume-rail-card__play {
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
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.resume-rail-card__body {
  display: grid;
  gap: 6px;
  padding-right: 4px;
}

.resume-rail-card__tag {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.resume-rail-card__body strong {
  font-size: 0.95rem;
  color: var(--text-main);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.resume-rail-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.progress-percent-badge {
  font-weight: 700;
  color: var(--brand);
}

.progress-track {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  overflow: hidden;
  border: 1px solid rgba(226, 232, 240, 0.8);
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--brand-gradient);
  transition: width 0.4s ease;
}

/* Category Rail */
.category-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 160px;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 2px 10px;
  scrollbar-width: thin;
}

.category-rail-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.category-rail-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
}

.category-rail-card__icon-box {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  display: grid;
  place-items: center;
  font-size: 1.15rem;
  transition: transform var(--transition-spring);
}

.category-rail-card:hover .category-rail-card__icon-box {
  transform: scale(1.1);
}

.category-rail-card__info strong {
  display: block;
  font-size: 0.94rem;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-rail-card__info small {
  display: block;
  font-size: 0.76rem;
  color: var(--text-muted);
  margin-top: 2px;
}

/* Category Theme Tints */
.theme-purple .category-rail-card__icon-box { background: #f5f3ff; color: #7c3aed; }
.theme-rose .category-rail-card__icon-box { background: #fff1f2; color: #e11d48; }
.theme-cyan .category-rail-card__icon-box { background: #ecfeff; color: #0891b2; }
.theme-amber .category-rail-card__icon-box { background: #fffbeb; color: #d97706; }
.theme-indigo .category-rail-card__icon-box { background: #eef2ff; color: #4f46e5; }
.theme-emerald .category-rail-card__icon-box { background: #ecfdf5; color: #059669; }

/* Lesson Video Rail */
.lesson-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 200px;
  gap: 14px;
  overflow-x: auto;
  padding: 4px 2px 10px;
}

.lesson-preview-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.lesson-preview-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
  border-color: rgba(99, 102, 241, 0.3);
}

.lesson-preview-card__media {
  position: relative;
  height: 120px;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.lesson-preview-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.lesson-preview-card:hover .lesson-preview-card__media img {
  transform: scale(1.05);
}

.lesson-preview-card__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(15, 23, 42, 0.7) 0%, transparent 60%);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 10px;
}

.lesson-preview-card__play {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ffffff;
  color: var(--brand);
  display: grid;
  place-items: center;
  font-size: 0.8rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.lesson-preview-card__duration {
  font-size: 0.7rem;
  font-weight: 700;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(4px);
  padding: 4px 8px;
  border-radius: var(--radius-full);
}

.lesson-preview-card__body {
  display: grid;
  gap: 4px;
}

.lesson-preview-card__body small {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.lesson-preview-card__body strong {
  font-size: 0.88rem;
  color: var(--text-main);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Featured Course Stack */
.feature-course-stack {
  display: grid;
  gap: 16px;
}

.feature-course-card {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 16px;
  padding: 14px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: all var(--transition-normal);
  align-items: stretch;
}

.feature-course-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-float);
  border-color: rgba(99, 102, 241, 0.3);
}

.feature-course-card__media {
  position: relative;
  border-radius: var(--radius-lg);
  overflow: hidden;
  min-height: 140px;
}

.feature-course-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.feature-course-card__category {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
  color: var(--brand);
  font-size: 0.7rem;
  font-weight: 700;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.feature-course-card__body {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.feature-course-card__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.course-level-badge {
  font-size: 0.74rem;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-soft);
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.feature-course-card h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--text-main);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feature-course-card p {
  margin: 0;
  font-size: 0.84rem;
  color: var(--text-muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.feature-course-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.feature-course-card__price-group small {
  display: block;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.feature-course-card__price-group strong {
  display: block;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--brand);
  font-family: 'Outfit', sans-serif;
}

.feature-course-card__btn {
  padding: 9px 15px;
  font-size: 0.82rem;
  border-radius: var(--radius-md);
  white-space: nowrap;
}

@media (max-width: 540px) {
  .home-hero {
    padding: 20px;
  }

  .home-hero h1 {
    font-size: 1.45rem;
  }

  .hero-search-card {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
  }

  .hero-search-btn {
    width: 100%;
    justify-content: center;
  }

  .hero-stat-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .hero-stat-card {
    flex-direction: column;
    text-align: center;
    padding: 10px 6px;
    gap: 6px;
  }

  .hero-stat-card__icon {
    display: none;
  }

  .feature-course-card {
    grid-template-columns: 1fr;
  }

  .feature-course-card__media {
    height: 160px;
  }
}
</style>
