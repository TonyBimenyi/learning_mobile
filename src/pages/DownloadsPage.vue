<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell">
        <!-- Top Navigation Bar -->
        <header class="page-top-bar">
          <div class="top-bar-title">
            <span class="top-kicker"><i class="fa-solid fa-download"></i> {{ t('offlineLibrary') }}</span>
            <h2>{{ t('downloads') }}</h2>
          </div>
          <button
            v-if="downloads.length"
            class="ghost-button icon-only-btn clear-all-icon-btn"
            type="button"
            :title="t('clearAllDownloads')"
            :aria-label="t('clearAllDownloads')"
            @click="handleClearAll"
          >
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </header>

        <!-- Vault Hero Card -->
        <section class="vault-hero">
          <div class="vault-hero__glow"></div>
          <div class="vault-hero__grid"></div>

          <div class="vault-hero__head">
            <div class="vault-hero__icon">
              <i class="fa-solid fa-hard-drive"></i>
            </div>
            <div class="vault-hero__head-copy">
              <span class="secure-pill">
                <i class="fa-solid fa-shield-halved"></i> {{ t('appSandboxProtected') }}
              </span>
              <h3>{{ t('offlineVideoVault') }}</h3>
              <p>{{ t('offlineVaultDesc') }}</p>
            </div>
          </div>

          <div class="vault-hero__usage">
            <div class="usage-main">
              <small>{{ t('storageUsed') }}</small>
              <strong>{{ totalStorageUsed }}</strong>
            </div>
            <div class="usage-bar">
              <span :style="{ width: storagePercent + '%' }"></span>
            </div>
            <div class="usage-caption">
              <span>{{ downloads.length }} {{ downloads.length === 1 ? t('lessonOne') : t('lessons') }}</span>
              <span>{{ t('zeroMBOffline') }}</span>
            </div>
          </div>
        </section>

        <!-- Stats Row -->
        <section class="downloads-stats">
          <div class="stat-tile">
            <span class="stat-tile__icon stat-tile__icon--indigo"><i class="fa-solid fa-film"></i></span>
            <div class="stat-tile__copy">
              <strong>{{ downloads.length }}</strong>
              <small>{{ t('offlineLessons') }}</small>
            </div>
          </div>
          <div class="stat-tile">
            <span class="stat-tile__icon stat-tile__icon--emerald"><i class="fa-solid fa-shield-halved"></i></span>
            <div class="stat-tile__copy">
              <strong>{{ t('offline') }}</strong>
              <small>{{ t('networkNeeded') }}</small>
            </div>
          </div>
          <div class="stat-tile">
            <span class="stat-tile__icon stat-tile__icon--violet"><i class="fa-solid fa-database"></i></span>
            <div class="stat-tile__copy">
              <strong>{{ totalStorageUsed }}</strong>
              <small>{{ t('storageUsed') }}</small>
            </div>
          </div>
        </section>

        <!-- Section heading -->
        <div v-if="downloads.length" class="section-heading downloads-heading">
          <div>
            <p class="section-kicker"><i class="fa-solid fa-layer-group"></i> {{ t('offlineLibrary') }}</p>
            <h3>{{ t('yourDownloads') }}</h3>
          </div>
          <span class="section-caption">{{ downloads.length }} {{ downloads.length === 1 ? t('lessonOne') : t('lessons') }}</span>
        </div>

        <!-- Downloads List -->
        <section class="downloads-section">
          <div v-if="isLoading" class="downloads-grid">
            <SkeletonCard v-for="n in 3" :key="n" />
          </div>

          <div v-else-if="downloads.length" class="downloads-grid">
            <article
              v-for="item in downloads"
              :key="item.lessonId"
              class="surface-card download-item-card"
            >
              <div class="download-item-card__thumb" @click="playOfflineLesson(item)">
                <img :src="item.courseThumbnail" :alt="item.courseTitle" loading="lazy" />
                <span class="download-item-card__play"><i class="fa-solid fa-play"></i></span>
                <span class="offline-pill-badge"><i class="fa-solid fa-bolt"></i> {{ t('offline') }}</span>
              </div>

              <div class="download-item-card__body">
                <span class="download-item-card__course">{{ item.courseTitle }}</span>
                <strong class="download-item-card__title" @click="playOfflineLesson(item)">
                  {{ item.lessonTitle }}
                </strong>

                <div class="download-item-card__meta">
                  <span><i class="fa-regular fa-clock"></i> {{ item.duration }}</span>
                  <span class="size-tag">{{ item.fileSizeLabel }}</span>
                  <span v-if="item.downloadedAt" class="date-tag">{{ formatDate(item.downloadedAt) }}</span>
                </div>

                <div class="download-item-card__actions">
                  <button class="primary-button watch-btn" type="button" @click="playOfflineLesson(item)">
                    <i class="fa-solid fa-circle-play"></i>
                    <span>{{ t('watchOffline') }}</span>
                  </button>
                  <button
                    class="ghost-button delete-btn"
                    type="button"
                    :title="t('removeFromDownloads')"
                    :aria-label="t('removeOfflineDownload')"
                    @click="handleDelete(item.lessonId)"
                  >
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              </div>
            </article>
          </div>

          <!-- Empty State -->
          <article v-else class="surface-card empty-downloads-card">
            <div class="empty-illustration">
              <span class="empty-illustration__ring"></span>
              <i class="fa-solid fa-cloud-arrow-down"></i>
            </div>
            <h3>{{ t('noDownloads') }}</h3>
            <p>{{ t('noDownloadsHint') }}</p>
            <div class="empty-actions">
              <button class="primary-button" type="button" @click="$router.push('/discover')">
                <i class="fa-solid fa-compass"></i>
                <span>{{ t('exploreCourses') }}</span>
              </button>
              <button class="ghost-button" type="button" @click="$router.push('/my-learning')">
                <i class="fa-solid fa-book-open"></i>
                <span>{{ t('navMyLearning') }}</span>
              </button>
            </div>
          </article>
        </section>
      </div>

      <BottomNav />
    </ion-content>
  </ion-page>
</template>

<script>
import { translate } from '@/services/i18n';
import { IonContent, IonPage } from '@ionic/vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BottomNav from '@/components/BottomNav.vue';
import SkeletonCard from '@/components/SkeletonCard.vue';
import {
  clearAllDownloads,
  deleteDownloadedLesson,
  getAllDownloads,
  getTotalOfflineStorageUsage,
} from '@/services/downloads';

export default {
  name: 'DownloadsPage',
  components: {
    IonContent,
    IonPage,
    BottomNav,
    SkeletonCard,
  },
  setup() {
    const router = useRouter();
    const downloads = ref([]);
    const totalStorageUsed = ref('0 B');
    const storageBytes = ref(0);
    const isLoading = ref(true);

    // Decorative fill level — treat ~100 MB as a visually "full" vault.
    const storagePercent = computed(() => {
      const bytes = Number(storageBytes.value || 0);
      if (!bytes) return 0;
      return Math.min(100, Math.max(6, Math.round((bytes / (100 * 1024 * 1024)) * 100)));
    });

    const loadDownloads = async () => {
      try {
        const [dList, usage] = await Promise.all([
          getAllDownloads(),
          getTotalOfflineStorageUsage(),
        ]);
        downloads.value = dList || [];
        totalStorageUsed.value = usage.totalFormatted || '0 B';
        storageBytes.value = Number(usage.totalBytes || 0);
      } catch (err) {
        console.warn(translate('loadDownloadsError'), err);
      } finally {
        isLoading.value = false;
      }
    };

    const playOfflineLesson = (item) => {
      router.push({
        path: `/course/${item.courseId}`,
        query: { lessonIndex: item.lessonIndex ?? 0 },
      });
    };

    const handleDelete = async (lessonId) => {
      await deleteDownloadedLesson(lessonId);
      await loadDownloads();
    };

    const handleClearAll = async () => {
      if (confirm(translate('confirmClearAll'))) {
        await clearAllDownloads();
        await loadDownloads();
      }
    };

    const formatDate = (isoString) => {
      if (!isoString) return '';
      try {
        const date = new Date(isoString);
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } catch {
        return '';
      }
    };

    const handleStorageUpdate = () => {
      loadDownloads();
    };

    onMounted(() => {
      loadDownloads();
      window.addEventListener('twige:downloads-update', handleStorageUpdate);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('twige:downloads-update', handleStorageUpdate);
    });

    return {
      downloads,
      formatDate,
      isLoading,
      handleClearAll,
      handleDelete,
      playOfflineLesson,
      storagePercent,
      totalStorageUsed,
    };
  },
};
</script>

<style scoped>
/* Top bar */
.page-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
}

.top-kicker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--brand);
}

.top-bar-title {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.top-bar-title h2 {
  margin: 0;
  font-size: 1.55rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.clear-all-icon-btn {
  width: 42px;
  height: 42px;
  padding: 0;
  border-radius: var(--radius-md);
  color: var(--danger);
  border-color: rgba(239, 68, 68, 0.25);
  background: var(--danger-soft);
}

.clear-all-icon-btn:hover {
  background: rgba(239, 68, 68, 0.16);
  border-color: var(--danger);
}

/* Vault hero */
.vault-hero {
  position: relative;
  overflow: hidden;
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: var(--radius-2xl);
  background: var(--brand-hero-gradient);
  color: #ffffff;
  box-shadow: var(--shadow-float);
  margin-bottom: 16px;
  isolation: isolate;
}

.vault-hero__glow {
  position: absolute;
  top: -60px;
  right: -40px;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.5), transparent 70%);
  z-index: -1;
  pointer-events: none;
}

.vault-hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(to bottom, #000, transparent 80%);
  -webkit-mask-image: linear-gradient(to bottom, #000, transparent 80%);
  z-index: -1;
  pointer-events: none;
}

.vault-hero__head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.vault-hero__icon {
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 16px;
  display: grid;
  place-items: center;
  font-size: 1.3rem;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.26);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.vault-hero__head-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.secure-pill {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border-radius: var(--radius-full);
  background: rgba(16, 185, 129, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #6ee7b7;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.vault-hero__head-copy h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
}

.vault-hero__head-copy p {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.45;
}

.vault-hero__usage {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.09);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
}

.usage-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.usage-main small {
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.8);
}

.usage-main strong {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.usage-bar {
  height: 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  overflow: hidden;
}

.usage-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #a5b4fc, #f0abfc);
  box-shadow: 0 0 12px rgba(196, 181, 253, 0.7);
  transition: width 0.6s cubic-bezier(0.34, 1.3, 0.45, 1);
}

.usage-caption {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.72);
}

/* Stats */
.downloads-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}

.stat-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  min-width: 0;
}

.stat-tile__icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  font-size: 0.9rem;
}

.stat-tile__icon--indigo { background: var(--brand-soft); color: var(--brand); }
.stat-tile__icon--emerald { background: var(--success-soft); color: var(--success); }
.stat-tile__icon--violet { background: var(--accent-purple-soft); color: var(--accent-purple); }

.stat-tile__copy {
  display: grid;
  gap: 1px;
  min-width: 0;
}

.stat-tile__copy strong {
  font-size: 0.85rem;
  font-weight: 800;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-tile__copy small {
  font-size: 0.63rem;
  font-weight: 650;
  color: var(--text-muted);
  line-height: 1.2;
}

/* Section heading */
.downloads-heading {
  margin-bottom: 14px;
}

/* Downloads list */
.downloads-grid {
  display: grid;
  gap: 14px;
}

.download-item-card {
  display: flex;
  gap: 14px;
  padding: 12px;
  border-radius: var(--radius-xl);
  transition: all var(--transition-normal);
}

.download-item-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--brand-light);
}

.download-item-card__thumb {
  position: relative;
  width: 120px;
  min-width: 120px;
  height: 84px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: #020617;
  cursor: pointer;
}

.download-item-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.35s ease;
}

.download-item-card:hover .download-item-card__thumb img {
  transform: scale(1.06);
}

.download-item-card__play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.55));
  color: #ffffff;
  font-size: 1.1rem;
  transition: transform 0.2s ease;
}

.download-item-card:hover .download-item-card__play {
  transform: scale(1.08);
}

.offline-pill-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: var(--success);
  color: #ffffff;
  font-size: 0.62rem;
  font-weight: 800;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.4);
}

.download-item-card__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
}

.download-item-card__course {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.download-item-card__title {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.3;
  cursor: pointer;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.download-item-card__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 600;
}

.size-tag {
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  color: var(--text-main);
  font-weight: 700;
  border: 1px solid var(--line);
}

.download-item-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.watch-btn {
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-brand-sm);
}

.delete-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--danger);
  background: var(--danger-soft);
  border: 1px solid rgba(239, 68, 68, 0.25);
  font-size: 0.8rem;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.16);
  border-color: var(--danger);
}

/* Empty state */
.empty-downloads-card {
  padding: 44px 24px;
  border-radius: var(--radius-2xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-illustration {
  position: relative;
  width: 78px;
  height: 78px;
  display: grid;
  place-items: center;
  color: var(--brand);
  font-size: 2rem;
  margin-bottom: 4px;
}

.empty-illustration__ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: var(--brand-soft);
  border: 1px dashed var(--brand-light);
  animation: empty-pulse 3s ease-in-out infinite;
}

@keyframes empty-pulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.08); opacity: 0.5; }
}

.empty-downloads-card h3 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-main);
}

.empty-downloads-card p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  max-width: 320px;
  line-height: 1.45;
}

.empty-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

/* Responsive */
@media (max-width: 480px) {
  .download-item-card { flex-direction: column; }
  .download-item-card__thumb { width: 100%; height: 150px; }
  .downloads-stats { grid-template-columns: 1fr 1fr; }
  .stat-tile:last-child { grid-column: 1 / -1; }
}
</style>
