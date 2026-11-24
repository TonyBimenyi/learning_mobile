<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell">
        <!-- Top Toolbar & Search Area -->
        <section class="surface-card discover-toolbar">
          <span class="discover-toolbar__orb"></span>

          <div class="discover-toolbar__header">
            <div>
              <span class="section-kicker">
                <i class="fa-solid fa-compass"></i> {{ t('courseCatalog') }}
              </span>
              <h2>Explore & Discover</h2>
            </div>
            <span class="results-badge">{{ filteredCourses.length }} {{ filteredCourses.length === 1 ? translate('courseSingular') : translate('courses') }}</span>
          </div>

          <div class="discover-toolbar__search-row">
            <div class="input-chip discover-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('searchDiscoverPlaceholder')"
              />
              <button
                v-if="searchQuery"
                class="search-clear-btn"
                type="button"
                :aria-label="t('clearSearch')"
                @click="searchQuery = ''"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            <button
              class="filter-toggle-btn"
              :class="{ 'is-active': showFilters || appliedFilterCount > 0 }"
              type="button"
              :aria-label="t('filters')"
              @click="toggleFilters"
            >
              <i class="fa-solid fa-sliders"></i>
              <span v-if="appliedFilterCount" class="filter-toggle-btn__badge">{{ appliedFilterCount }}</span>
            </button>
          </div>

          <!-- Category Chips Horizontal Scroller -->
          <div class="chip-scroll-row">
            <button
              class="filter-chip"
              :class="{ 'is-active': activeCategory === '' }"
              type="button"
              @click="activeCategory = ''"
            >
              <i class="fa-solid fa-layer-group"></i>
              <span>{{ t('allTracks') }}</span>
            </button>
            <button
              v-for="category in categories"
              :key="category.name"
              class="filter-chip"
              :class="{ 'is-active': activeCategory === category.name }"
              type="button"
              @click="activeCategory = category.name"
            >
              <i :class="getCategoryIcon(category.name)"></i>
              <span>{{ category.name }}</span>
            </button>
          </div>

          <!-- Expandable Filter Panel -->
          <div v-if="showFilters" class="filter-drawer">
            <div class="filter-drawer__header">
              <div class="filter-drawer__title">
                <i class="fa-solid fa-filter"></i>
                <strong>{{ t('refineCatalog') }}</strong>
              </div>
              <button class="ghost-button filter-drawer__reset" type="button" @click="resetFilters">
                {{ t('resetFilters') }}
              </button>
            </div>

            <div class="filter-drawer__group">
              <small>{{ t('skillLevel') }}</small>
              <div class="filter-drawer__pills">
                <button
                  class="filter-chip filter-chip--sm"
                  :class="{ 'is-active': activeLevel === '' }"
                  type="button"
                  @click="activeLevel = ''"
                >
                  {{ t('allLevels') }}
                </button>
                <button
                  v-for="level in levels"
                  :key="level"
                  class="filter-chip filter-chip--sm"
                  :class="{ 'is-active': activeLevel === level }"
                  type="button"
                  @click="activeLevel = level"
                >
                  {{ level }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Loading Skeleton -->
        <section v-if="isLoading" class="discover-results">
          <div v-for="n in 4" :key="'skel-'+n" class="course-card" style="pointer-events:none">
            <div class="course-card__media">
              <SkeletonLoader type="rect" width="100%" height="130px" :rounded="true" />
            </div>
            <div class="course-card__body">
              <div class="course-card__topline">
                <SkeletonLoader type="text" width="60px" height="14px" />
                <SkeletonLoader type="text" width="80px" height="14px" />
                <SkeletonLoader type="text" width="50px" height="14px" />
              </div>
              <SkeletonLoader type="text" width="85%" height="18px" />
              <SkeletonLoader type="text" width="100%" height="14px" />
              <SkeletonLoader type="text" width="70%" height="14px" />
              <div class="course-card__footer" style="border:none;padding-top:8px">
                <SkeletonLoader type="text" width="80px" height="22px" />
                <SkeletonLoader type="rect" width="110px" height="36px" :rounded="true" />
              </div>
            </div>
          </div>
        </section>

        <!-- Course Cards List -->
        <section v-else class="discover-results">
          <article
            v-for="course in filteredCourses"
            :key="course.id"
            class="course-card"
            @click="openCourse(course.id)"
          >
            <div class="course-card__media">
              <img :src="course.thumbnail" :alt="course.title" loading="lazy" />
              <div class="course-card__overlay">
                <span class="pill pill--glass">{{ course.category }}</span>
                <span class="rating-chip">
                  <i class="fa-solid fa-star"></i> {{ course.rating || '4.8' }}
                </span>
              </div>
              <span class="course-card__open"><i class="fa-solid fa-arrow-up-right"></i></span>
            </div>

            <div class="course-card__body">
              <div class="course-card__topline">
                <span class="course-meta">
                  <i class="fa-regular fa-clock"></i> {{ course.duration }}
                </span>
                <span class="course-meta">
                  <i class="fa-regular fa-circle-play"></i> {{ course.lessonsCount }} lessons
                </span>
                <span class="course-level-tag">{{ course.level || 'All' }}</span>
              </div>

              <h3>{{ course.title }}</h3>
              <p>{{ shortDescription(course) }}</p>

              <div v-if="course.skills && course.skills.length" class="skills-row">
                <span v-for="skill in course.skills.slice(0, 3)" :key="skill" class="skill-tag">
                  {{ skill }}
                </span>
              </div>

              <div class="course-card__footer">
                <div class="course-card__price-box">
                  <small>{{ t('price') }}</small>
                  <strong>{{ formatCurrency(course.price) }}</strong>
                </div>
                <button class="primary-button course-card__btn" type="button">
                  <span>{{ t('viewDetails') }}</span>
                  <i class="fa-solid fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </article>

          <!-- Empty Results -->
          <article v-if="!isLoading && !filteredCourses.length" class="empty-card">
            <div class="empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
            <strong>{{ t('noMatchingCourses') }}</strong>
            <p>{{ t('noMatchingHint') }}</p>
            <button class="ghost-button" type="button" @click="resetFilters">
              {{ t('showAllCourses') }}
            </button>
          </article>
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
import { getCourses } from '@/services/api';
import { formatCurrency, getCategories } from '@/services/course-helpers';

export default {
  name: 'DiscoverPage',
  components: {
    BottomNav,
    IonContent,
    IonPage,
    CardSkeleton,
    SkeletonLoader,
  },
  data() {
    return {
      courses: [],
      searchQuery: this.$route.query.q || '',
      activeCategory: this.$route.query.category || '',
      activeLevel: '',
      showFilters: false,
      isLoading: true,
    };
  },
  computed: {
    categories() {
      return getCategories(this.courses);
    },
    levels() {
      return [...new Set(this.courses.map((course) => course.level).filter(Boolean))];
    },
    appliedFilterCount() {
      return [this.activeCategory, this.activeLevel].filter(Boolean).length;
    },
    filteredCourses() {
      const query = this.searchQuery.trim().toLowerCase();
      return this.courses.filter((course) => {
        const matchesCategory = !this.activeCategory || course.category === this.activeCategory;
        const matchesLevel = !this.activeLevel || course.level === this.activeLevel;
        const haystack = [
          course.title,
          course.category,
          course.description,
          ...(course.skills || []),
        ]
          .join(' ')
          .toLowerCase();
        const matchesQuery = !query || haystack.includes(query);
        return matchesCategory && matchesLevel && matchesQuery;
      });
    },
  },
  watch: {
    '$route.query': {
      deep: true,
      handler(query) {
        this.searchQuery = query.q || '';
        this.activeCategory = query.category || '';
      },
    },
  },
  mounted() {
    this.loadCourses();
  },
  methods: {
    async loadCourses() {
      this.isLoading = true;
      try {
        this.courses = (await getCourses()) || [];
      } catch (err) {
        console.warn('Could not load courses', err);
        this.courses = [];
      } finally {
        this.isLoading = false;
      }
    },
    formatCurrency,
    toggleFilters() {
      this.showFilters = !this.showFilters;
    },
    resetFilters() {
      this.searchQuery = '';
      this.activeCategory = '';
      this.activeLevel = '';
      this.showFilters = false;
    },
    shortDescription(course) {
      const text = String(course.longDescription || course.description || '').trim();
      if (!text) {
        return translate('heroDescription1');
      }
      return text.length > 92 ? `${text.slice(0, 92)}...` : text;
    },
    getCategoryIcon(category) {
      const key = String(category || '').toLowerCase();
      if (key.includes('ai') || key.includes('artificial')) return 'fa-solid fa-wand-magic-sparkles';
      if (key.includes('design')) return 'fa-solid fa-palette';
      if (key.includes('develop') || key.includes('code') || key.includes('programming')) return 'fa-solid fa-code';
      if (key.includes('business') || key.includes('marketing')) return 'fa-solid fa-briefcase';
      if (key.includes('language') || key.includes('english') || key.includes('french')) return 'fa-solid fa-language';
      if (key.includes('finance') || key.includes('money')) return 'fa-solid fa-wallet';
      return 'fa-solid fa-shapes';
    },
    openCourse(id) {
      this.$router.push(`/course/${id}`);
    },
  },
};
</script>

<style scoped>
/* Discover Toolbar */
.discover-toolbar {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 16px;
  padding: 22px 20px;
  border-radius: var(--radius-2xl);
  background: var(--brand-hero-gradient);
  color: #ffffff;
  border: none;
  box-shadow: 0 22px 46px -18px rgba(49, 46, 129, 0.6), inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

.discover-toolbar__orb {
  position: absolute;
  top: -120px;
  right: -70px;
  width: 280px;
  height: 280px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.26), transparent 65%);
  pointer-events: none;
}

.discover-toolbar__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.discover-toolbar .section-kicker {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 0.63rem;
  font-weight: 800;
}

.discover-toolbar__header h2 {
  margin: 8px 0 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: #ffffff;
}

.results-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #ffffff;
  font-size: 0.71rem;
  font-weight: 800;
}

.discover-toolbar__search-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

.discover-search.input-chip {
  flex: 1;
  min-width: 0;
  padding: 10px 14px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.97);
  border-color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 14px 28px -14px rgba(15, 23, 42, 0.55);
}

.discover-search input {
  background: transparent !important;
  color: var(--text-main);
  font-size: 0.86rem;
  font-weight: 600;
}

.discover-search input::placeholder { color: var(--text-muted); }

.discover-search > i { color: var(--brand); }

.search-clear-btn {
  color: var(--text-subtle);
  font-size: 0.9rem;
  display: grid;
  place-items: center;
  padding: 4px;
}

.search-clear-btn:hover { color: var(--brand); }

.filter-toggle-btn {
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.24);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 0.95rem;
  position: relative;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all var(--transition-fast);
}

.filter-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.28);
}

.filter-toggle-btn.is-active {
  background: #ffffff;
  border-color: transparent;
  color: var(--brand);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.2);
}

.filter-toggle-btn__badge {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #ffffff;
  color: var(--brand);
  font-size: 0.62rem;
  font-weight: 800;
  display: grid;
  place-items: center;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

/* Category Chip Scroll Row */
.chip-scroll-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.discover-toolbar .filter-chip {
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.18);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.discover-toolbar .filter-chip:hover {
  background: rgba(255, 255, 255, 0.24);
  border-color: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.discover-toolbar .filter-chip.is-active {
  background: #ffffff;
  color: var(--brand);
  border-color: transparent;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
}

/* Filter Drawer */
.filter-drawer {
  position: relative;
  z-index: 2;
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  animation: slideDown 0.25s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.discover-toolbar .filter-drawer .filter-chip {
  background: var(--surface-soft);
  border-color: var(--line);
  color: var(--text-secondary);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  font-size: 0.78rem;
}

.discover-toolbar .filter-drawer .filter-chip.is-active {
  background: var(--brand-gradient);
  color: #ffffff;
  border-color: transparent;
  box-shadow: var(--shadow-brand-sm);
}

.filter-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-drawer__title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-main);
  font-size: 0.88rem;
}

.filter-drawer__reset {
  padding: 6px 10px;
  font-size: 0.76rem;
}

.filter-drawer__group small {
  display: block;
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.filter-drawer__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-chip--sm {
  padding: 7px 12px;
  font-size: 0.78rem;
}

/* Course Results Grid */
.discover-results {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.course-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.course-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-float);
  border-color: rgba(99, 102, 241, 0.3);
}

.course-card__media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
}

.course-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.course-card:hover .course-card__media img {
  transform: scale(1.04);
}

.course-card__overlay {
  position: absolute;
  top: 9px;
  left: 9px;
  right: 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.course-card__overlay .pill {
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.62rem;
  padding: 4px 8px;
}

.course-card__open {
  position: absolute;
  right: 9px;
  bottom: 9px;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.94);
  color: var(--brand);
  font-size: 0.72rem;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.25);
  opacity: 0.9;
  transform: none;
  transition: all var(--transition-fast);
}

.course-card:hover .course-card__open {
  opacity: 1;
  transform: scale(1.08);
}

.course-card__body {
  display: grid;
  gap: 8px;
  flex: 1;
  padding: 13px;
}

.course-card__topline {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-size: 0.7rem;
  color: var(--text-muted);
}

.course-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.course-level-tag {
  font-size: 0.64rem;
  font-weight: 800;
  color: var(--brand);
  background: var(--brand-soft);
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

.course-card__body h3 {
  margin: 0;
  font-size: 0.94rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.3;
  letter-spacing: -0.01em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.course-card__body p {
  margin: 0;
  font-size: 0.74rem;
  color: var(--text-muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.skills-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: auto;
}

.skill-tag {
  font-size: 0.64rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  padding: 2px 7px;
  border-radius: var(--radius-full);
}

.course-card__footer {
  display: grid;
  gap: 9px;
  margin-top: 2px;
  padding-top: 11px;
  border-top: 1px solid var(--line);
}

.course-card__price-box {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

.course-card__price-box small {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.course-card__price-box strong {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--brand);
  font-family: 'Outfit', sans-serif;
}

.course-card__btn {
  width: 100%;
  justify-content: center;
  padding: 9px 12px;
  font-size: 0.76rem;
  border-radius: var(--radius-md);
}

.empty-card { grid-column: 1 / -1; }

@media (max-width: 380px) {
  .discover-results {
    grid-template-columns: 1fr;
  }

  .discover-toolbar__header h2 { font-size: 1.3rem; }
}

@media (min-width: 580px) {
  .course-card__media { aspect-ratio: 16 / 9; }
}
</style>
