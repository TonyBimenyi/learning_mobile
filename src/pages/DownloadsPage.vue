<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell">
        <!-- Top Navigation Bar -->
        <header class="page-top-bar">
          <button class="back-btn" type="button" aria-label="Go back" @click="$router.back()">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="top-bar-title">
            <h2>Downloads</h2>
            <span class="sub-caption">{{ downloads.length }} {{ downloads.length === 1 ? 'lesson' : 'lessons' }} &bull; {{ totalStorageUsed }}</span>
          </div>
          <button
            v-if="downloads.length"
            class="ghost-button icon-only-btn clear-all-icon-btn"
            type="button"
            title="Clear all downloads"
            aria-label="Clear all downloads"
            @click="handleClearAll"
          >
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </header>

        <!-- Storage & Sandbox Status Card -->
        <section class="surface-card storage-vault-card">
          <div class="vault-header">
            <div class="vault-icon-badge">
              <i class="fa-solid fa-hard-drive"></i>
            </div>
            <div class="vault-heading">
              <div class="vault-tags">
                <span class="secure-pill">
                  <i class="fa-solid fa-shield-halved"></i> App Sandbox Protected
                </span>
                <span class="usage-pill">{{ totalStorageUsed }}</span>
              </div>
              <h3>Offline Video Vault</h3>
              <p>Stored privately inside the app sandbox for offline watching without cellular data.</p>
            </div>
          </div>

          <div v-if="downloads.length" class="vault-stats-row">
            <div class="vault-stat">
              <small>Offline Lessons</small>
              <strong>{{ downloads.length }}</strong>
            </div>
            <div class="vault-stat">
              <small>Storage Used</small>
              <strong>{{ totalStorageUsed }}</strong>
            </div>
            <div class="vault-stat">
              <small>Network Needed</small>
              <strong class="text-emerald">0 MB (Offline)</strong>
            </div>
          </div>
        </section>

        <!-- Downloads List -->
        <section class="downloads-section">
          <div v-if="downloads.length" class="downloads-grid">
            <article
              v-for="item in downloads"
              :key="item.lessonId"
              class="surface-card download-item-card"
            >
              <div class="download-item-card__thumb" @click="playOfflineLesson(item)">
                <img :src="item.courseThumbnail" :alt="item.courseTitle" loading="lazy" />
                <div class="download-item-card__play">
                  <i class="fa-solid fa-play"></i>
                </div>
                <span class="offline-pill-badge">
                  <i class="fa-solid fa-bolt"></i> Offline
                </span>
              </div>

              <div class="download-item-card__body">
                <span class="download-item-card__course">{{ item.courseTitle }}</span>
                <strong class="download-item-card__title" @click="playOfflineLesson(item)">
                  {{ item.lessonTitle }}
                </strong>

                <div class="download-item-card__meta">
                  <span><i class="fa-regular fa-clock"></i> {{ item.duration }}</span>
                  <span class="size-tag">{{ item.fileSizeLabel }}</span>
                  <span v-if="item.downloadedAt" class="date-tag">
                    {{ formatDate(item.downloadedAt) }}
                  </span>
                </div>

                <div class="download-item-card__actions">
                  <button
                    class="primary-button watch-btn"
                    type="button"
                    @click="playOfflineLesson(item)"
                  >
                    <i class="fa-solid fa-circle-play"></i>
                    <span>Watch Offline</span>
                  </button>
                  <button
                    class="ghost-button delete-btn"
                    type="button"
                    title="Remove from downloads"
                    aria-label="Remove download"
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
            <div class="empty-icon-circle">
              <i class="fa-solid fa-cloud-arrow-down"></i>
            </div>
            <h3>No downloaded videos yet</h3>
            <p>
              When you download lessons, they will be saved here in your offline vault so you can watch them without internet.
            </p>
            <div class="empty-actions">
              <button class="primary-button" type="button" @click="$router.push('/discover')">
                <i class="fa-solid fa-compass"></i>
                <span>Explore Courses</span>
              </button>
              <button class="ghost-button" type="button" @click="$router.push('/my-learning')">
                <i class="fa-solid fa-book-open"></i>
                <span>My Learning</span>
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
import { IonContent, IonPage } from '@ionic/vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BottomNav from '@/components/BottomNav.vue';
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
  },
  setup() {
    const router = useRouter();
    const downloads = ref([]);
    const totalStorageUsed = ref('0 B');

    const loadDownloads = async () => {
      try {
        const [dList, usage] = await Promise.all([
          getAllDownloads(),
          getTotalOfflineStorageUsage(),
        ]);
        downloads.value = dList || [];
        totalStorageUsed.value = usage.totalFormatted || '0 B';
      } catch (err) {
        console.warn('Could not load offline downloads', err);
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
      if (confirm('Are you sure you want to remove all offline videos to free up storage?')) {
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
      handleClearAll,
      handleDelete,
      playOfflineLesson,
      totalStorageUsed,
    };
  },
};
</script>

<style scoped>
.page-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
}

.back-btn {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-btn:hover {
  background: var(--surface-soft);
  color: var(--brand);
  border-color: var(--brand-light);
}

.top-bar-title {
  flex: 1;
  min-width: 0;
}

.top-bar-title h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.25;
}

.sub-caption {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
}

.clear-all-icon-btn {
  width: 42px;
  height: 42px;
  padding: 0;
  border-radius: var(--radius-md);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.08);
}

.clear-all-icon-btn:hover {
  background: rgba(239, 68, 68, 0.16);
  border-color: #ef4444;
}

/* Vault Status Card */
.storage-vault-card {
  padding: 20px;
  border-radius: var(--radius-2xl);
  display: grid;
  gap: 16px;
  margin-bottom: 22px;
}

.vault-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.vault-icon-badge {
  width: 46px;
  height: 46px;
  border-radius: var(--radius-lg);
  background: rgba(99, 102, 241, 0.12);
  border: 1px solid rgba(99, 102, 241, 0.3);
  color: var(--brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.vault-heading {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.vault-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.secure-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: var(--radius-full);
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.usage-pill {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  color: var(--text-main);
  font-size: 0.68rem;
  font-weight: 800;
  border: 1px solid var(--line);
}

.vault-heading h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text-main);
}

.vault-heading p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.vault-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.vault-stat {
  display: grid;
  gap: 2px;
}

.vault-stat small {
  font-size: 0.68rem;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.vault-stat strong {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-main);
}

.text-emerald {
  color: #10b981 !important;
}

/* Downloads List */
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
  border-color: rgba(99, 102, 241, 0.3);
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
}

.download-item-card__play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.45);
  color: #ffffff;
  font-size: 1.1rem;
  opacity: 0.9;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.download-item-card__thumb:hover .download-item-card__play {
  opacity: 1;
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
  background: rgba(16, 185, 129, 0.92);
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

.date-tag {
  color: var(--text-muted);
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
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.delete-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  font-size: 0.8rem;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.16);
  border-color: #ef4444;
}

/* Empty State Card */
.empty-downloads-card {
  padding: 40px 24px;
  border-radius: var(--radius-2xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.1);
  color: var(--brand);
  font-size: 1.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
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
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

@media (max-width: 480px) {
  .download-item-card {
    flex-direction: column;
  }
  .download-item-card__thumb {
    width: 100%;
    height: 140px;
  }
  .vault-stats-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
