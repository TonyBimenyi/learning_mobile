<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell details-shell">
        <!-- ── Loading ── -->
        <section v-if="isLoading" class="skeleton">
          <div class="skeleton__player"></div>
          <div class="skeleton__card">
            <i class="sk sk--sm"></i><i class="sk sk--lg"></i><i class="sk sk--md"></i>
          </div>
          <div class="skeleton__list">
            <div v-for="n in 3" :key="n" class="skeleton__row"><i class="sk sk--row"></i></div>
          </div>
        </section>

        <!-- ── Offline fallback ── -->
        <section v-else-if="!course" class="surface-card empty-state">
          <div class="empty-state__icon"><i class="fa-solid fa-cloud-arrow-down"></i></div>
          <strong>{{ t('courseUnavailableOffline') }}</strong>
          <span>{{ t('offlineFallbackText') }}</span>
          <div class="empty-state__actions">
            <button class="primary-button compact" @click="$router.push('/downloads')">{{ t('viewDownloads') }}</button>
            <button class="ghost-button compact" @click="$router.back()">{{ t('goBack') }}</button>
          </div>
        </section>

        <!-- ── Course ── -->
        <article v-else class="details">
          <!-- Top bar -->
          <header class="topbar">
            <button class="topbar__back" type="button" :aria-label="t('goBack')" @click="$router.back()">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <span class="topbar__title">{{ t('videoLesson') }}</span>
          </header>

          <!-- Video hero -->
          <section ref="playerHero" class="hero">
            <div class="hero__frame">
              <div v-if="!isCurrentLessonLocked" class="hero__shade"></div>

              <CustomVideoPlayer
                v-if="hasDbVideo && !isCurrentLessonLocked"
                ref="customVideoPlayer"
                :src="selectedLessonSource"
                :poster="course.thumbnail"
                :start-at="getSavedSeconds()"
                :resume-from-mini="resumeFromMini"
                :is-offline="Boolean(offlineVideoUrl)"
                :is-downloaded="isCurrentLessonDownloaded"
                :is-downloading="isDownloadingCurrent"
                :download-percent="currentDownloadPercent"
                @download-click="handleDownloadToggle"
                @loaded="handleVideoLoaded"
                @canplay="startResumePlayback"
                @playing="handleVideoPlay"
                @timeupdate="handleVideoTimeUpdate"
                @ended="handleVideoEnded"
                @error="handleVideoError"
              />
              <iframe
                v-else-if="selectedLesson.youtubeId && !isCurrentLessonLocked"
                :src="iframeUrl"
                :title="selectedLesson.title"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
              <img v-else :src="course.thumbnail" :alt="selectedLesson.title" />

              <div v-if="isCurrentLessonLocked" class="hero__lock">
                <span class="hero__lock-icon"><i class="fa-solid fa-lock"></i></span>
                <strong>{{ t('courseLocked') }}</strong>
                <small>{{ t('courseLockedHint') }}</small>
                <button class="primary-button compact" type="button" @click="enrollInCourse">
                  <i :class="enrollButtonIcon"></i>{{ enrollButtonLabel }}
                </button>
              </div>
            </div>
          </section>

          <!-- Video summary card -->
          <section class="vsc">
            <div class="vsc__head">
              <span class="vsc__kicker"><i class="fa-solid fa-play-circle"></i>{{ t('videoLesson') }}</span>
              <span class="vsc__status" :class="`is-${enrollmentStatus}`">{{ enrollmentStatusLabel }}</span>
            </div>

            <h1 class="vsc__title">{{ selectedLesson?.title || course.title }}</h1>

            <div class="vsc__fields">
              <div class="vsc__field">
                <span class="vsc__label">{{ t('courseLabel') }}</span>
                <strong>{{ course.title }}</strong>
              </div>
              <div v-if="instructorLabel" class="vsc__field">
                <span class="vsc__label">{{ t('instructor') }}</span>
                <strong>{{ instructorLabel }}</strong>
              </div>
            </div>

            <div class="vsc__stats">
              <span><i class="fa-regular fa-play-circle"></i><b>{{ course.lessonsCount || (course.curriculum || []).length }}</b> {{ t('lessons') }}</span>
              <span v-if="course.duration"><i class="fa-regular fa-clock"></i>{{ course.duration }}</span>
              <span v-if="course.level"><i class="fa-solid fa-signal"></i>{{ course.level }}</span>
              <span><i class="fa-solid fa-star"></i>{{ course.rating || '4.8' }}</span>
            </div>

            <div v-if="focusTags.length" class="vsc__skills">
              <span class="vsc__label">{{ t('skillsLabel') }}</span>
              <div class="vsc__tags">
                <span v-for="tag in focusTags" :key="tag"><i :class="getCategoryIcon(tag)"></i>{{ tag }}</span>
              </div>
            </div>

            <p v-if="paymentNotice" class="vsc__notice" :class="`is-${paymentNoticeTone}`">{{ paymentNotice }}</p>

            <div class="vsc__cta">
              <div class="vsc__price">
                <small>{{ t('coursePrice') }}</small>
                <strong>{{ priceLabel }}</strong>
              </div>
              <button class="vsc__btn primary-button" :disabled="isStartingCheckout" @click="enrollInCourse">
                <i v-if="isStartingCheckout" class="fa-solid fa-circle-notch fa-spin"></i>
                <i v-else :class="enrollButtonIcon"></i>
                <span>{{ enrollButtonLabel }}</span>
              </button>
            </div>

            <div
              class="vsc__download"
              :class="{ 'is-busy': isDownloadingCurrent }"
              role="button"
              tabindex="0"
              @click="handleDownloadToggle"
              @keydown.enter="handleDownloadToggle"
            >
              <span class="vsc__dl-icon" :class="{ 'is-on': isCurrentLessonDownloaded, 'is-busy': isDownloadingCurrent }">
                <i v-if="isDownloadingCurrent" class="fa-solid fa-circle-notch fa-spin"></i>
                <i v-else-if="isCurrentLessonDownloaded" class="fa-solid fa-check"></i>
                <i v-else class="fa-solid fa-download"></i>
              </span>
              <span class="vsc__dl-copy">
                <strong>{{ downloadLabel }}</strong>
                <small v-if="currentLessonOfflineRecord?.fileSizeLabel">{{ currentLessonOfflineRecord.fileSizeLabel }}</small>
              </span>
              <span v-if="isDownloadingCurrent" class="vsc__dl-pct">{{ currentDownloadPercent }}%</span>
              <button
                v-if="isDownloadingCurrent"
                class="vsc__dl-cancel"
                type="button"
                :title="t('cancel')"
                :aria-label="t('cancel')"
                @click.stop="cancelDownload"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
              <i v-else-if="isCurrentLessonDownloaded" class="fa-solid fa-trash-can vsc__dl-trash"></i>
              <i v-else class="fa-solid fa-chevron-right vsc__dl-chev"></i>
              <span v-if="isDownloadingCurrent" class="vsc__dl-bar"><i :style="{ width: currentDownloadPercent + '%' }"></i></span>
            </div>
          </section>

          <!-- Lessons -->
          <section class="block">
            <div class="block__head">
              <h2>{{ t('lessons') }}</h2>
              <span class="lesson-count">{{ lessonPositionLabel }}</span>
            </div>

            <div v-if="totalLessons" class="lesson-summary">
              <div class="lesson-summary__head">
                <span class="lesson-summary__done">
                  <i class="fa-solid fa-circle-check"></i>
                  <strong>{{ completedLessons }}/{{ totalLessons }}</strong>
                  <span>{{ t('lessons') }}</span>
                </span>
                <span class="lesson-summary__pct">{{ courseProgressPercent }}%</span>
              </div>
              <div class="lesson-summary__rail">
                <i :style="{ width: courseProgressPercent + '%' }"></i>
              </div>
            </div>

            <div class="lesson-list">
              <button
                v-for="(lesson, index) in course.curriculum || []"
                :key="`lesson-${course.id}-${index}`"
                class="lesson"
                :class="{
                  'is-active': selectedLessonIndex === index,
                  'is-done': isLessonComplete(index),
                  'is-locked': !canPlayLesson(lesson),
                }"
                @click="selectLesson(index)"
              >
                <span class="lesson__no">
                  <i v-if="isLessonComplete(index)" class="fa-solid fa-check"></i>
                  <template v-else>{{ String(index + 1).padStart(2, '0') }}</template>
                </span>

                <span class="lesson__body">
                  <strong class="lesson__title">{{ lesson.title }}</strong>
                  <span class="lesson__meta">
                    <span><i class="fa-regular fa-clock"></i>{{ lesson.duration || t('flexible') }}</span>
                    <i class="lesson__dot"></i>
                    <span>{{ lesson.type || t('video') }}</span>
                    <em
                      v-if="lesson.freePreview && !hasCourseAccess"
                      class="lesson__tag lesson__tag--preview"
                    >
                      {{ t('freePreview') }}
                    </em>
                    <em
                      v-else-if="isLessonDownloadedById(getLessonId(lesson, index))"
                      class="lesson__tag lesson__tag--offline"
                    >
                      <i class="fa-solid fa-arrow-down"></i>{{ t('offline') }}
                    </em>
                  </span>
                </span>

                <span class="lesson__end">
                  <small v-if="getLessonProgress(index)" class="lesson__pct">{{ getLessonProgress(index) }}%</small>
                  <span
                    class="lesson__cta"
                    :class="{
                      'is-active': selectedLessonIndex === index,
                      'is-locked': !canPlayLesson(lesson),
                    }"
                  >
                    <i v-if="!canPlayLesson(lesson)" class="fa-solid fa-lock"></i>
                    <i v-else class="fa-solid fa-play"></i>
                  </span>
                </span>

                <span v-if="getLessonProgress(index)" class="lesson__bar">
                  <i :style="{ width: getLessonProgress(index) + '%' }"></i>
                </span>
              </button>
            </div>
          </section>

          <!-- Community: comments + one link to full reviews page -->
          <section class="block">
            <div class="block__head">
              <h2>{{ t('comments') }}</h2>
              <button class="block__link" type="button" @click="goToReviews">
                {{ t('reviews') }} <i class="fa-solid fa-square-arrow-up-right"></i>
              </button>
            </div>

            <div class="composer">
              <template v-if="isLoggedIn">
                <transition name="reveal" mode="out-in">
                  <div v-if="composerOpen" key="form" class="composer__form">
                    <img :src="userAvatar" :alt="userDisplayName" class="composer__avatar" />
                    <div class="composer__body">
                      <textarea v-model="questionForm.text" rows="2" :placeholder="t('commentPlaceholder')"></textarea>
                      <div class="composer__row">
                        <button class="composer__time" type="button" @click="insertCurrentVideoTime">
                          <i class="fa-solid fa-stopwatch"></i>{{ t('addTime', { time: formatClock(currentVideoTime) }) }}
                        </button>
                        <button class="composer__close" type="button" :aria-label="t('cancel')" @click="composerOpen = false">
                          <i class="fa-solid fa-xmark"></i>
                        </button>
                        <button class="composer__post" type="button" :disabled="isSubmittingComment || !questionForm.text.trim()" @click="submitQuestion">
                          <i v-if="isSubmittingComment" class="fa-solid fa-circle-notch fa-spin"></i>
                          <i v-else class="fa-solid fa-paper-plane"></i>
                          <span>{{ t('post') }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <button v-else key="peek" class="composer__peek" type="button" @click="composerOpen = true">
                    <i class="fa-regular fa-pen-to-square"></i>
                    <span>{{ t('commentPlaceholder') }}</span>
                  </button>
                </transition>
              </template>
              <RouterLink
                v-else
                :to="{ name: 'login', query: { redirect: $route.fullPath } }"
                class="composer__signin"
              >
                <span class="composer__signin-icon"><i class="fa-solid fa-lock"></i></span>
                <span class="composer__signin-copy">
                  <strong>{{ t('loginToComment') }}</strong>
                  <small>{{ t('loginToCommentHint') }}</small>
                </span>
                <i class="fa-solid fa-right-to-bracket"></i>
              </RouterLink>
            </div>

            <div class="feed">
              <div class="feed__sort">
                <button type="button" :class="{ 'is-on': commentSort === 'top' }" @click="commentSort = 'top'">
                  <i class="fa-solid fa-fire"></i>{{ t('topComments') }}
                </button>
                <button type="button" :class="{ 'is-on': commentSort === 'newest' }" @click="commentSort = 'newest'">
                  <i class="fa-solid fa-history"></i>{{ t('newest') }}
                </button>
              </div>

              <transition-group name="list" tag="div" class="comment-list">
              <article v-for="discussion in visibleDiscussions" :key="discussion.id" class="comment">
                <img :src="discussion.avatar || fallbackAvatar(discussion.authorName)" :alt="discussion.authorName" class="comment__avatar" />
                <div class="comment__body">
                  <div class="comment__top">
                    <strong>{{ discussion.authorName }}</strong>
                    <span v-if="discussion.isTeacher" class="tag">{{ t('instructor') }}</span>
                    <small>{{ discussion.relativeTime }}</small>
                  </div>

                  <p v-if="editingCommentId !== discussion.id" class="comment__text">
                    <template v-for="(segment, index) in discussion.segments" :key="`${discussion.id}-seg-${index}`">
                      <button
                        v-if="segment.type === 'time'"
                        class="time-chip"
                        type="button"
                        :title="t('jumpToTime', { time: segment.value })"
                        @click="seekVideoTo(segment.seconds)"
                      >
                        <i class="fa-solid fa-play"></i>{{ segment.value }}
                      </button>
                      <span v-else>{{ segment.value }}</span>
                    </template>
                  </p>

                  <div v-else class="comment__edit">
                    <textarea v-model="editCommentText" rows="3"></textarea>
                    <div>
                      <button class="ghost-button compact" @click="cancelEditComment">{{ t('cancel') }}</button>
                      <button class="primary-button compact" @click="saveCommentEdit(discussion)"><i class="fa-solid fa-check"></i>{{ t('save') }}</button>
                    </div>
                  </div>

                  <div v-if="editingCommentId !== discussion.id" class="comment__actions">
                    <button type="button" :class="{ 'is-liked': discussion.likedByMe }" :title="isLoggedIn ? null : t('loginToLike')" @click="handleLikeDiscussion(discussion)">
                      <i :class="discussion.likedByMe ? 'fa-solid fa-thumbs-up' : 'fa-regular fa-thumbs-up'"></i>{{ discussion.likes }}
                    </button>
                    <button type="button" @click="discussion.showReply = !discussion.showReply">
                      <i class="fa-regular fa-comment"></i>{{ discussion.replies.length }}
                    </button>
                    <span class="comment__spacer"></span>
                    <button v-if="canEditComment(discussion)" type="button" @click="startEditComment(discussion)" :title="t('editComment')">
                      <i class="fa-solid fa-pen"></i>
                    </button>
                    <button v-if="canModerateComments" type="button" @click="deleteComment(discussion)" :title="t('deleteComment')">
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  </div>

                  <transition name="reveal">
                    <div v-if="discussion.showReply" class="comment__reveal">
                      <div v-if="discussion.replies.length" class="replies">
                        <div v-for="reply in discussion.replies" :key="reply.id || `${discussion.id}-${reply.date}-${reply.authorName}`" class="reply">
                          <div class="reply__top">
                            <strong>{{ reply.authorName || t('instructor') }}</strong>
                            <span v-if="reply.isTeacher" class="tag">{{ t('instructor') }}</span>
                            <small>{{ reply.relativeTime }}</small>
                          </div>
                          <p>
                            <template v-for="(segment, index) in reply.segments" :key="`reply-${index}`">
                              <button v-if="segment.type === 'time'" class="time-chip" type="button" @click="seekVideoTo(segment.seconds)">
                                <i class="fa-solid fa-play"></i>{{ segment.value }}
                              </button>
                              <span v-else>{{ segment.value }}</span>
                            </template>
                          </p>
                        </div>
                      </div>

                      <div v-if="isLoggedIn" class="reply-composer">
                        <input v-model="reviewReplies[discussion.id]" type="text" :placeholder="t('writeReply')" />
                        <button class="primary-button compact" type="button" @click="submitDiscussionReply(discussion)">
                          <i class="fa-solid fa-paper-plane"></i>
                        </button>
                      </div>
                      <RouterLink
                        v-else
                        :to="{ name: 'login', query: { redirect: $route.fullPath } }"
                        class="reply-login-link"
                      >
                        <i class="fa-solid fa-right-to-bracket"></i>
                        <span>{{ t('loginToReply') }}</span>
                      </RouterLink>
                    </div>
                  </transition>
                </div>
              </article>
              </transition-group>

              <button v-if="hiddenCommentsCount > 0" class="more" type="button" @click="showAllComments = !showAllComments">
                {{ showAllComments ? t('showFewerComments') : t('seeAllComments', { count: discussions.length }) }}
                <i :class="showAllComments ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
              </button>

              <div v-if="!discussions.length" class="feed__empty">
                <i class="fa-regular fa-comment-dots"></i>
                <span>{{ t('noComments') }}</span>
              </div>
            </div>
          </section>
        </article>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { IonContent, IonPage } from '@ionic/vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CustomVideoPlayer from '@/components/CustomVideoPlayer.vue';
import {
  createDiscussion,
  deleteDiscussion,
  getCourse,
  getCurrentUser,
  getDiscussions,
  getEnrollments,
  likeDiscussion,
  mediaUrl,
  replyToDiscussion,
  startAfripayCheckout,
  updateDiscussion,
} from '@/services/api';
import { formatCurrency, getCategoryIcon } from '@/services/course-helpers';
import {
  cancelLessonDownload,
  deleteDownloadedLesson,
  downloadLessonVideo,
  getCourseDownloadedLessonIds,
  getDownloadedLesson,
  getLessonIdentifier,
  getOfflineCourse,
  getOfflinePlaybackUrl,
  saveOfflineCourse,
} from '@/services/downloads';
import { getProgressMap, getToken, saveLessonProgress } from '@/services/storage';
import { showToast } from '@/services/toast';
import { translate } from '@/services/i18n';
import {
  consumeResumeOnReturn,
  getMiniPlayerState,
  startMiniPlayer,
  stopMiniPlayer,
} from '@/services/miniPlayer';

function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds || 0)));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function buildAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Learner')}&background=2446d8&color=fff&size=200`;
}

function parseTimeSegments(text) {
  const source = String(text || '');
  const pattern = /\b(?:(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d))\b/g;
  const segments = [];
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) segments.push({ type: 'text', value: source.slice(lastIndex, match.index) });
    const hours = Number(match[1] || 0);
    const minutes = Number(match[2] || 0);
    const seconds = Number(match[3] || 0);
    segments.push({ type: 'time', value: match[0], seconds: hours * 3600 + minutes * 60 + seconds });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < source.length) segments.push({ type: 'text', value: source.slice(lastIndex) });
  return segments.length ? segments : [{ type: 'text', value: source }];
}

function isTeacherRole(role) {
  return ['teacher', 'instructor', 'admin', 'staff', 'tutor'].includes(String(role || '').toLowerCase());
}

function toTimestamp(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value < 1e12 ? value * 1000 : value;
  let text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text) && !/(Z|[+-]\d{2}:?\d{2})$/.test(text)) text += 'Z';
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function formatRelativeTime(value) {
  const timestamp = toTimestamp(value);
  if (!timestamp) return 'Recent';
  const diff = Date.now() - timestamp;
  if (diff < 0) return 'just now';
  const sec = Math.floor(diff / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec}sec ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h ago`;
  const day = Math.floor(hour / 24);
  if (day < 5) return `${day} ${day === 1 ? 'day' : 'days'} ago`;
  try {
    return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (_) {
    return String(value);
  }
}

function normalizeReply(reply) {
  const dateValue = reply?.createdAt || reply?.created_at || reply?.date || '';
  return {
    ...(reply || {}),
    isTeacher: isTeacherRole(reply?.role) || isTeacherRole(reply?.authorRole),
    relativeTime: formatRelativeTime(dateValue),
    sortTimestamp: toTimestamp(dateValue),
    segments: parseTimeSegments(reply?.text || ''),
  };
}

function normalizeDiscussion(discussion) {
  const dateValue = discussion?.createdAt || discussion?.created_at || discussion?.date || '';
  return {
    ...discussion,
    likes: Number(discussion?.likes || 0),
    replies: Array.isArray(discussion?.replies) ? discussion.replies.map(normalizeReply) : [],
    showReply: Boolean(discussion?.showReply),
    isTeacher: isTeacherRole(discussion?.role),
    likedByMe: Boolean(discussion?.likedByMe),
    relativeTime: formatRelativeTime(dateValue),
    sortTimestamp: toTimestamp(dateValue),
    segments: parseTimeSegments(discussion?.text || ''),
  };
}

export default {
  name: 'CourseDetailsPage',
  components: { IonContent, IonPage, CustomVideoPlayer },
  props: ['id'],
  setup(props) {
    const router = useRouter();
    const route = useRoute();
    const playerHero = ref(null);
    const customVideoPlayer = ref(null);
    const course = ref(null);
    const enrollments = ref([]);
    const selectedLessonIndex = ref(0);
    const selectedLesson = ref(null);
    const discussions = ref([]);
    const questionForm = ref({ text: '', timeSec: 0 });
    const composerOpen = ref(false);
    const reviewReplies = ref({});
    const commentSort = ref('top');
    const showAllComments = ref(false);
    const editingCommentId = ref(null);
    const editCommentText = ref('');
    const isSubmittingComment = ref(false);
    const progressMap = ref(getProgressMap());
    const user = ref({ id: '', name: 'Learner', avatar: '', role: 'student', email: '', whatsapp: '' });
    const isLoggedIn = ref(Boolean(getToken()));
    const currentVideoTime = ref(0);
    const currentVideoDuration = ref(0);
    const lastPersistedSecond = ref(-1);
    const useProxyStream = ref(false);
    const isStartingCheckout = ref(false);
    const paymentNotice = ref('');
    const paymentNoticeTone = ref('info');
    const isOfflineMode = ref(false);
    const isLoading = ref(true);
    let handedOffToMiniPlayer = false;
    const resumeFromMini = ref(consumeResumeOnReturn());
    let shouldResumePlayback = resumeFromMini.value;

    const downloadedLessonIds = ref(new Set());
    const downloadingLessonIds = ref(new Map());
    const currentLessonOfflineRecord = ref(null);
    const offlineVideoUrl = ref(null);

    const getLessonId = (lesson = selectedLesson.value, index = selectedLessonIndex.value) => {
      if (!course.value) return '';
      return getLessonIdentifier(course.value.id, lesson, index);
    };

    const currentLessonId = computed(() => getLessonId(selectedLesson.value, selectedLessonIndex.value));
    const isCurrentLessonDownloaded = computed(() => downloadedLessonIds.value.has(currentLessonId.value));
    const isDownloadingCurrent = computed(() => downloadingLessonIds.value.has(currentLessonId.value));
    const currentDownloadPercent = computed(() => downloadingLessonIds.value.get(currentLessonId.value) || 0);

    const downloadLabel = computed(() => {
      if (isDownloadingCurrent.value) return translate('downloading', { percent: currentDownloadPercent.value });
      if (isCurrentLessonDownloaded.value) return translate('availableOffline');
      return translate('downloadLesson');
    });

    const isLessonDownloadedById = (lessonId) => downloadedLessonIds.value.has(String(lessonId));

    const syncOfflineStatusForCurrentLesson = async () => {
      const lessonId = currentLessonId.value;
      if (!lessonId) return;
      const isSaved = downloadedLessonIds.value.has(lessonId);
      if (isSaved) {
        const [record, blobUrl] = await Promise.all([
          getDownloadedLesson(lessonId),
          getOfflinePlaybackUrl(lessonId),
        ]);
        currentLessonOfflineRecord.value = record;
        if (blobUrl) {
          if (offlineVideoUrl.value && offlineVideoUrl.value.startsWith('blob:')) URL.revokeObjectURL(offlineVideoUrl.value);
          offlineVideoUrl.value = blobUrl;
        }
      } else {
        currentLessonOfflineRecord.value = null;
        if (offlineVideoUrl.value && offlineVideoUrl.value.startsWith('blob:')) URL.revokeObjectURL(offlineVideoUrl.value);
        offlineVideoUrl.value = null;
      }
    };

    const loadCourseDownloads = async () => {
      if (!course.value) return;
      const ids = await getCourseDownloadedLessonIds(course.value.id);
      downloadedLessonIds.value = new Set(ids);
      await syncOfflineStatusForCurrentLesson();
    };

    const startDownloadCurrent = async (targetLesson = null, targetIndex = null) => {
      paymentNotice.value = '';
      const lesson = (targetLesson && typeof targetLesson === 'object' && !('target' in targetLesson) && !('preventDefault' in targetLesson))
        ? targetLesson
        : selectedLesson.value;
      const index = (typeof targetIndex === 'number') ? targetIndex : selectedLessonIndex.value;
      if (!canPlayLesson(lesson)) {
        paymentNotice.value = translate('lessonLocked');
        paymentNoticeTone.value = 'warning';
        return;
      }
      if (!lesson || !course.value) {
        paymentNotice.value = translate('selectLessonFirst');
        paymentNoticeTone.value = 'warning';
        return;
      }
      const streamUrl = lesson.streamUrl || (lesson.videoKey ? `/api/videos/stream/?key=${encodeURIComponent(lesson.videoKey)}` : '');
      const videoUrl = streamUrl || lesson.videoUrl || lesson.source || '';
      if (!videoUrl) {
        paymentNotice.value = translate('noVideoSource');
        paymentNoticeTone.value = 'error';
        return;
      }
      const lessonId = getLessonId(lesson, index);
      if (downloadingLessonIds.value.has(lessonId)) return;
      downloadingLessonIds.value.set(lessonId, 0);
      try {
        const payloadLesson = { ...lesson, streamUrl, videoUrl: lesson.videoUrl || streamUrl, lessonIndex: index };
        await downloadLessonVideo(payloadLesson, course.value, (percent) => {
          downloadingLessonIds.value.set(lessonId, percent);
        });
        downloadedLessonIds.value.add(lessonId);
        downloadingLessonIds.value.delete(lessonId);
        await syncOfflineStatusForCurrentLesson();
        paymentNotice.value = translate('lessonDownloaded');
        paymentNoticeTone.value = 'success';
      } catch (error) {
        downloadingLessonIds.value.delete(lessonId);
        if (error?.name === 'DownloadCancelledError') {
          paymentNotice.value = translate('downloadCancelled');
          paymentNoticeTone.value = 'info';
          return;
        }
        console.error('Download failed:', error);
        paymentNotice.value = translate('downloadFailed', { error: error.message || translate('networkError') });
        paymentNoticeTone.value = 'error';
      }
    };

    const cancelDownload = () => {
      const lessonId = currentLessonId.value;
      if (!lessonId || !isDownloadingCurrent.value) return;
      cancelLessonDownload(lessonId);
      downloadingLessonIds.value.delete(lessonId);
      paymentNotice.value = translate('downloadCancelled');
      paymentNoticeTone.value = 'info';
    };

    const removeCurrentDownload = async () => {
      const lesson = selectedLesson.value;
      if (!lesson || !course.value) return;
      const lessonId = getLessonId(lesson, selectedLessonIndex.value);
      await deleteDownloadedLesson(lessonId);
      downloadedLessonIds.value.delete(lessonId);
      await syncOfflineStatusForCurrentLesson();
      paymentNotice.value = translate('lessonRemoved');
      paymentNoticeTone.value = 'info';
    };

    const handleDownloadToggle = () => {
      if (isCurrentLessonDownloaded.value) removeCurrentDownload();
      else if (!isDownloadingCurrent.value) startDownloadCurrent();
    };

    const refreshProgressMap = () => { progressMap.value = getProgressMap(); };
    const getLessonKey = (index = selectedLessonIndex.value) => (course.value ? `${course.value.id}-${index}` : '');
    const getProgressEntry = (index = selectedLessonIndex.value) => {
      const key = getLessonKey(index);
      return key ? progressMap.value[key] || null : null;
    };

    const userAvatar = computed(() => user.value?.avatar || buildAvatar(user.value?.name));
    const userDisplayName = computed(() => user.value?.name || 'Learner');

    const selectedLessonSource = computed(() => {
      if (offlineVideoUrl.value) return offlineVideoUrl.value;
      if (!selectedLesson.value) return '';
      const direct = selectedLesson.value.videoUrl || selectedLesson.value.source || '';
      const proxied = selectedLesson.value.streamUrl ? mediaUrl(selectedLesson.value.streamUrl) : '';
      return useProxyStream.value ? (proxied || direct) : (direct || proxied);
    });

    const hasDbVideo = computed(() => Boolean(
      offlineVideoUrl.value || (selectedLesson.value && (selectedLesson.value.streamUrl || selectedLesson.value.videoUrl || selectedLesson.value.source)),
    ));

    const iframeUrl = computed(() => selectedLesson.value?.youtubeId
      ? `https://www.youtube.com/embed/${selectedLesson.value.youtubeId}?rel=0&modestbranding=1`
      : '');

    const instructorLabel = computed(() => course.value?.instructor || '');
    const priceLabel = computed(() => formatCurrency(course.value?.price || 0));

    const focusTags = computed(() => {
      const tags = [course.value?.category, ...(course.value?.skills || [])]
        .filter(Boolean)
        .map((item) => String(item).trim())
        .filter(Boolean);
      return [...new Set(tags)].slice(0, 3);
    });

    const hasCourseAccess = computed(() => course.value
      ? course.value.hasAccess === true || Number(course.value.price || 0) === 0
      : false);
    const canPlayLesson = (lesson) => hasCourseAccess.value || Boolean(lesson?.freePreview);
    const isCurrentLessonLocked = computed(() => !canPlayLesson(selectedLesson.value));

    const lessonPositionLabel = computed(() => {
      if (!course.value || !selectedLesson.value) return '';
      return translate('lessonPosition', {
        current: selectedLessonIndex.value + 1,
        total: (course.value.curriculum || []).length,
      });
    });

    const totalLessons = computed(() => (course.value?.curriculum || []).length);
    const completedLessons = computed(() => (course.value?.curriculum || []).filter(
      (_, index) => Number(getProgressEntry(index)?.progressPercent || 0) >= 95,
    ).length);
    const courseProgressPercent = computed(() => (
      totalLessons.value
        ? Math.round((completedLessons.value / totalLessons.value) * 100)
        : 0
    ));

    const canModerateComments = computed(() => {
      const role = String(user.value?.role || '').toLowerCase();
      return ['teacher', 'admin', 'staff', 'instructor'].includes(role);
    });

    const sortedDiscussions = computed(() => {
      const list = [...discussions.value];
      if (commentSort.value === 'newest') return list.sort((a, b) => Number(b.sortTimestamp || 0) - Number(a.sortTimestamp || 0));
      return list.sort((a, b) => (Number(b.likes || 0) - Number(a.likes || 0)) || (Number(b.sortTimestamp || 0) - Number(a.sortTimestamp || 0)));
    });

    const hiddenCommentsCount = computed(() => Math.max(0, discussions.value.length - 2));
    const visibleDiscussions = computed(() => (showAllComments.value ? sortedDiscussions.value : sortedDiscussions.value.slice(0, 2)));

    const canEditComment = (comment) => {
      if (canModerateComments.value) return true;
      const myId = String(user.value?.id || '');
      const authorId = String(comment?.authorId || comment?.author_id || '');
      if (myId && authorId === myId) return true;
      const myName = String(user.value?.name || '').trim().toLowerCase();
      const authorName = String(comment?.authorName || '').trim().toLowerCase();
      return Boolean(myName && authorName && myName === authorName);
    };

    const currentEnrollment = computed(() => {
      if (!course.value) return null;
      const matches = enrollments.value.filter((entry) => entry.courseId === course.value.id);
      return (
        matches.find((entry) => String(entry.paymentStatus || '').toLowerCase() === 'success')
        || matches.find((entry) => !String(entry.paymentStatus || '').trim() || String(entry.paymentStatus || '').toLowerCase() === 'pending')
        || matches[0]
        || null
      );
    });

    const enrollmentStatus = computed(() => {
      const status = String(currentEnrollment.value?.paymentStatus || '').toLowerCase();
      if (status === 'success') return 'success';
      if (status === 'error' || status === 'failed') return 'error';
      if (currentEnrollment.value) return 'pending';
      return 'idle';
    });

    const enrollmentStatusLabel = computed(() => {
      if (enrollmentStatus.value === 'success') return translate('alreadyEnrolled');
      if (enrollmentStatus.value === 'pending') return translate('paymentPending');
      if (enrollmentStatus.value === 'error') return translate('paymentFailed');
      return translate('readyToEnroll');
    });

    const enrollButtonLabel = computed(() => {
      if (isStartingCheckout.value) return translate('openingAfripay');
      if (enrollmentStatus.value === 'success') return translate('startLearning');
      if (enrollmentStatus.value === 'pending') return translate('continuePayment');
      if (!getToken()) return translate('loginToEnroll');
      return translate('payWithAfriPay');
    });

    const enrollButtonIcon = computed(() => {
      if (enrollmentStatus.value === 'success') return 'fa-solid fa-play-circle';
      if (!getToken()) return 'fa-solid fa-right-to-bracket';
      return 'fa-solid fa-bolt';
    });

    const getSavedSeconds = () => {
      const entry = getProgressEntry();
      if (!entry) return 0;
      const percent = Number(entry.progressPercent || 0);
      return percent >= 98 ? 0 : Number(entry.seconds || 0);
    };

    const persistLessonProgress = (currentTime, duration, force = false) => {
      if (!course.value || !selectedLesson.value) return;
      const safeTime = Math.max(0, Math.floor(Number(currentTime || 0)));
      const safeDuration = Math.max(0, Math.floor(Number(duration || 0)));
      if (!force && lastPersistedSecond.value >= 0 && Math.abs(safeTime - lastPersistedSecond.value) < 5) return;
      const progressPercent = safeDuration ? Math.min(100, Math.round((safeTime / safeDuration) * 100)) : 0;
      saveLessonProgress({
        key: getLessonKey(),
        courseId: course.value.id,
        courseTitle: course.value.title,
        courseThumbnail: course.value.thumbnail,
        lessonIndex: selectedLessonIndex.value,
        lessonTitle: selectedLesson.value.title,
        durationLabel: selectedLesson.value.duration || formatClock(safeDuration),
        progressPercent,
        seconds: safeTime,
        youtubeId: selectedLesson.value.youtubeId || '',
      });
      lastPersistedSecond.value = safeTime;
      refreshProgressMap();
    };

    let resumeRetryTimer = null;
    let resumeAttempts = 0;
    const playFromMiniPlayer = () => {
      const player = customVideoPlayer.value;
      if (!player || typeof player.playVideo !== 'function') return;
      player.playVideo();
      resumeAttempts += 1;
      if (resumeAttempts < 8) {
        resumeRetryTimer = window.setTimeout(() => {
          const state = typeof player.getPlaybackState === 'function' ? player.getPlaybackState() : null;
          if (state && !state.isPlaying) playFromMiniPlayer();
        }, 550);
      }
    };
    const startResumePlayback = () => {
      if (!shouldResumePlayback) return;
      shouldResumePlayback = false;
      resumeAttempts = 0;
      window.clearTimeout(resumeRetryTimer);
      nextTick(playFromMiniPlayer);
    };

    const handleVideoLoaded = (payload) => {
      currentVideoTime.value = Number(payload?.currentTime || 0);
      currentVideoDuration.value = Number(payload?.duration || 0);
      if (!questionForm.value.timeSec) questionForm.value.timeSec = currentVideoTime.value;
      startResumePlayback();
    };
    const handleVideoPlay = () => {
      if (shouldResumePlayback) {
        shouldResumePlayback = false;
        window.clearTimeout(resumeRetryTimer);
      }
      if (getMiniPlayerState().active) stopMiniPlayer();
    };
    const handleVideoTimeUpdate = (payload) => {
      currentVideoTime.value = Number(payload?.currentTime || 0);
      currentVideoDuration.value = Number(payload?.duration || 0);
      persistLessonProgress(currentVideoTime.value, currentVideoDuration.value);
    };
    const handleVideoEnded = (payload) => {
      currentVideoTime.value = Number(payload?.duration || payload?.currentTime || 0);
      currentVideoDuration.value = Number(payload?.duration || 0);
      persistLessonProgress(currentVideoTime.value, currentVideoDuration.value, true);
    };
    const handleVideoError = () => {
      if (!useProxyStream.value && selectedLesson.value?.streamUrl) {
        useProxyStream.value = true;
        return;
      }
      paymentNotice.value = translate('streamingNotice');
      paymentNoticeTone.value = 'warning';
    };

    const isLessonComplete = (index) => Number(getProgressEntry(index)?.progressPercent || 0) >= 95;
    const getLessonProgress = (index) => Math.round(Number(getProgressEntry(index)?.progressPercent || 0));

    const selectLesson = async (index) => {
      const lesson = course.value?.curriculum?.[index] || null;
      if (!canPlayLesson(lesson)) {
        paymentNotice.value = translate('lessonLocked');
        paymentNoticeTone.value = 'warning';
        return;
      }
      selectedLessonIndex.value = index;
      selectedLesson.value = lesson;
      useProxyStream.value = false;
      const savedSeconds = Number(getProgressEntry(index)?.seconds || 0);
      currentVideoTime.value = savedSeconds;
      currentVideoDuration.value = 0;
      questionForm.value.timeSec = savedSeconds;
      lastPersistedSecond.value = -1;
      await syncOfflineStatusForCurrentLesson();
      if (isOfflineMode.value && !downloadedLessonIds.value.has(getLessonId(selectedLesson.value, index))) {
        paymentNotice.value = translate('notDownloadedOffline', { lesson: selectedLesson.value?.title || translate('videoLesson') });
        paymentNoticeTone.value = 'warning';
      }
    };

    const goToReviews = () => router.push({ name: 'course-reviews', params: { id: course.value.id } });

    const submitCheckoutForm = (action, fields, redirectUrl) => {
      try {
        const params = new URLSearchParams();
        Object.entries(fields || {}).forEach(([key, value]) => params.set(key, String(value ?? '')));
        let checkoutUrl = redirectUrl || (action + '?' + params.toString());
        // ngrok free domains show a "Visit Site" interstitial in the system
        // browser; a query flag skips it so the auto-submitting form loads.
        if (/ngrok/i.test(checkoutUrl) && !checkoutUrl.includes('ngrok-skip-browser-warning')) {
          checkoutUrl += (checkoutUrl.includes('?') ? '&' : '?') + 'ngrok-skip-browser-warning=true';
        }
        const win = window.open(checkoutUrl, '_system');
        if (!win) window.open(checkoutUrl, '_blank');
      } catch {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = action;
        Object.entries(fields || {}).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(value ?? '');
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();
        form.remove();
      }
    };

    const formatGatewayMessage = (raw) => String(raw || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\r\n?/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const syncPaymentNotice = () => {
      const gatewayMessage = formatGatewayMessage(route.query.message);
      if (gatewayMessage) {
        paymentNotice.value = gatewayMessage;
        paymentNoticeTone.value = 'gateway';
        return;
      }
      const token = String(route.query.afripay || '').trim();
      if (!token) return;
      const matched = enrollments.value.find((entry) => entry.id === token);
      if (!matched) {
        paymentNotice.value = translate('waitingAfripay');
        paymentNoticeTone.value = 'info';
        return;
      }
      const status = String(matched.paymentStatus || '').toLowerCase();
      if (status === 'success') {
        paymentNotice.value = translate('paymentConfirmed');
        paymentNoticeTone.value = 'success';
      } else if (status === 'error') {
        paymentNotice.value = translate('afripayIssue');
        paymentNoticeTone.value = 'error';
      } else {
        paymentNotice.value = translate('paymentWaiting');
        paymentNoticeTone.value = 'warning';
      }
    };

    const enrollInCourse = async () => {
      if (enrollmentStatus.value === 'success') {
        router.push('/my-learning');
        return;
      }
      if (!getToken()) {
        router.push({ name: 'login', query: { redirect: route.fullPath } });
        return;
      }
      if (!course.value) return;
      isStartingCheckout.value = true;
      paymentNotice.value = translate('preparingCheckout');
      paymentNoticeTone.value = 'info';
      try {
        const checkout = await startAfripayCheckout({
          courseId: course.value.id,
          studentName: userDisplayName.value,
          studentEmail: user.value?.email || '',
          studentWhatsapp: user.value?.whatsapp || '',
          amountPaid: course.value.price,
        });
        submitCheckoutForm(checkout.action, checkout.fields, checkout.redirectUrl);
      } catch (error) {
        paymentNotice.value = error.message || translate('checkoutFailed');
        paymentNoticeTone.value = 'error';
      } finally {
        isStartingCheckout.value = false;
      }
    };

    const insertCurrentVideoTime = () => {
      const stamp = formatClock(currentVideoTime.value || getSavedSeconds());
      const current = String(questionForm.value.text || '').trim();
      questionForm.value.text = current ? `${current} ${stamp}` : `at ${stamp}`;
    };

    const seekVideoTo = (seconds) => {
      const target = Math.max(0, Number(seconds || 0));
      const player = customVideoPlayer.value;
      if (player && typeof player.seekTo === 'function') player.seekTo(target);
      playerHero.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const submitQuestion = async () => {
      if (!isLoggedIn.value) {
        router.replace({ name: 'login', query: { redirect: route.fullPath } });
        return;
      }
      const text = questionForm.value.text.trim();
      if (!text || !course.value || !selectedLesson.value || isSubmittingComment.value) return;
      isSubmittingComment.value = true;
      try {
        const firstTime = parseTimeSegments(text).find((segment) => segment.type === 'time');
        const created = await createDiscussion({
          courseId: course.value.id,
          lesson: selectedLesson.value.title,
          timeSec: firstTime?.seconds || 0,
          timeLabel: firstTime?.value || 'General',
          author_id: user.value?.id || '',
          authorName: userDisplayName.value,
          avatar: userAvatar.value,
          role: String(user.value?.role || 'student').toLowerCase(),
          text,
        });
        const freshComment = { ...(created || {}) };
        if (!freshComment.created_at && !freshComment.createdAt) freshComment.created_at = new Date().toISOString();
        discussions.value = [normalizeDiscussion(freshComment), ...discussions.value];
        questionForm.value.text = '';
        composerOpen.value = false;
        commentSort.value = 'newest';
        showAllComments.value = true;
        showToast(translate('commentPosted'), 'success');
      } catch (error) {
        showToast(error?.message || translate('commentPostFailed'), 'error');
      } finally {
        isSubmittingComment.value = false;
      }
    };

    const startEditComment = (comment) => {
      editingCommentId.value = comment.id;
      editCommentText.value = String(comment.text || '');
      comment.showReply = false;
    };
    const cancelEditComment = () => {
      editingCommentId.value = null;
      editCommentText.value = '';
    };
    const saveCommentEdit = async (comment) => {
      const text = String(editCommentText.value || '').trim();
      if (!text) {
        showToast(translate('commentEmpty'), 'warning');
        return;
      }
      try {
        const firstTime = parseTimeSegments(text).find((segment) => segment.type === 'time');
        const updated = await updateDiscussion(comment.id, {
          text,
          timeSec: firstTime?.seconds || 0,
          timeLabel: firstTime?.value || 'General',
        });
        discussions.value = discussions.value.map((item) => (
          item.id === comment.id ? normalizeDiscussion({ ...comment, ...(updated || {}), text }) : item
        ));
        cancelEditComment();
        showToast(translate('commentUpdated'), 'success');
      } catch (error) {
        showToast(error?.message || translate('commentUpdateFailed'), 'error');
      }
    };

    const deleteComment = async (comment) => {
      if (typeof window !== 'undefined' && !window.confirm('Delete this comment? This cannot be undone.')) return;
      try {
        await deleteDiscussion(comment.id);
        discussions.value = discussions.value.filter((item) => item.id !== comment.id);
        if (editingCommentId.value === comment.id) cancelEditComment();
        showToast(translate('commentDeleted'), 'info');
      } catch (error) {
        showToast(error?.message || translate('commentDeleteFailed'), 'error');
      }
    };

    const handleLikeDiscussion = async (discussion) => {
      if (!isLoggedIn.value) {
        showToast(translate('loginToLikeFirst'), 'warning');
        return;
      }
      try {
        const updated = await likeDiscussion(discussion.id);
        const wasLiked = Boolean(discussion.likedByMe);
        const nextLiked = typeof updated?.likedByMe === 'boolean' ? updated.likedByMe : !wasLiked;
        const nextLikes = typeof updated?.likes === 'number'
          ? updated.likes
          : Math.max(0, Number(discussion.likes || 0) + (nextLiked ? 1 : -1));
        discussions.value = discussions.value.map((item) => (
          item.id === discussion.id
            ? normalizeDiscussion({ ...discussion, ...(updated || {}), likedByMe: nextLiked, likes: nextLikes })
            : item
        ));
      } catch (error) {
        showToast(error?.message || translate('likeFailed'), 'error');
      }
    };

    const submitDiscussionReply = async (discussion) => {
      if (!isLoggedIn.value) {
        router.replace({ name: 'login', query: { redirect: route.fullPath } });
        return;
      }
      const text = String(reviewReplies.value[discussion.id] || '').trim();
      if (!text) return;
      try {
        const updated = await replyToDiscussion(discussion.id, text);
        const merged = { ...discussion, ...(updated || {}) };
        if (Array.isArray(merged.replies) && merged.replies.length) {
          const newest = merged.replies[merged.replies.length - 1];
          if (newest && !newest.date && !newest.createdAt && !newest.created_at) newest.date = new Date().toISOString();
        }
        discussions.value = discussions.value.map((item) => (item.id === discussion.id ? normalizeDiscussion(merged) : item));
        reviewReplies.value[discussion.id] = '';
        showToast(translate('replyPosted'), 'success');
      } catch (error) {
        showToast(error?.message || translate('replyFailed'), 'error');
      }
    };

    const fallbackAvatar = (name) => buildAvatar(name || 'Learner');

    const handleDownloadsUpdate = (event) => {
      const detail = event?.detail || {};
      if (detail.status === 'completed' || detail.status === 'deleted' || detail.status === 'cleared') {
        loadCourseDownloads();
      } else if (detail.status === 'downloading' && detail.lessonId) {
        downloadingLessonIds.value.set(String(detail.lessonId), detail.percent || 0);
      }
    };

    const handOffToMiniPlayer = () => {
      const playerRef = customVideoPlayer.value;
      if (!playerRef || typeof playerRef.getPlaybackState !== 'function') return;
      const playback = playerRef.getPlaybackState();
      const videoSrc = playback.src || selectedLessonSource.value;
      if (!playback.isPlaying || playback.ended || !videoSrc) return;
      handedOffToMiniPlayer = true;
      const lesson = selectedLesson.value;
      const courseData = course.value;
      startMiniPlayer({
        src: videoSrc,
        poster: courseData?.thumbnail || '',
        title: lesson?.title || 'Lesson',
        subtitle: courseData?.title || '',
        courseId: courseData?.id ?? props.id,
        lessonIndex: selectedLessonIndex.value,
        startAt: playback.currentTime,
        duration: playback.duration,
        muted: playback.muted,
        playbackRate: playback.playbackRate,
        isOffline: Boolean(offlineVideoUrl.value),
        revokeOnClose: Boolean(offlineVideoUrl.value && String(offlineVideoUrl.value).startsWith('blob:')),
        meta: {
          lessonKey: getLessonKey(),
          courseId: courseData?.id ?? props.id,
          courseTitle: courseData?.title || '',
          courseThumbnail: courseData?.thumbnail || '',
          lessonIndex: selectedLessonIndex.value,
          lessonTitle: lesson?.title || 'Lesson',
          durationLabel: lesson?.duration || formatClock(playback.duration),
          youtubeId: lesson?.youtubeId || '',
        },
      });
    };

    const warmedOrigins = new Set();
    const warmRemoteOrigin = (url) => {
      try {
        if (!url || !/^https?:\/\//i.test(url)) return;
        const origin = new URL(url).origin;
        if (warmedOrigins.has(origin)) return;
        warmedOrigins.add(origin);
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = origin;
        document.head.appendChild(link);
      } catch (_) {}
    };

    const applyCourseData = (data) => {
      if (!data) return false;
      course.value = data;
      warmRemoteOrigin(data.thumbnail);
      (data.curriculum || []).slice(0, 3).forEach((lesson) => warmRemoteOrigin(lesson?.videoUrl));
      const qIndex = route.query.lessonIndex !== undefined ? Number(route.query.lessonIndex) : null;
      const latestEntry = Object.values(progressMap.value)
        .filter((entry) => entry.courseId === data.id)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0];
      let initialIndex = 0;
      if (qIndex !== null && !isNaN(qIndex) && data.curriculum?.[qIndex]) initialIndex = qIndex;
      else if (latestEntry && data.curriculum?.[latestEntry.lessonIndex]) initialIndex = latestEntry.lessonIndex;
      selectedLessonIndex.value = initialIndex;
      selectedLesson.value = data.curriculum?.[initialIndex] || data.curriculum?.[0] || {
        id: `${data.id}-0`,
        title: data.title || 'Course Lesson',
        duration: data.duration || 'Flexible',
        type: 'video',
        videoUrl: '',
      };
      currentVideoTime.value = Number(latestEntry?.seconds || 0);
      questionForm.value.timeSec = currentVideoTime.value;
      isLoading.value = false;
      return true;
    };

    onMounted(async () => {
      window.addEventListener('twige:downloads-update', handleDownloadsUpdate);
      try {
        const localCached = localStorage.getItem(`twige_course_meta_${props.id}`);
        if (localCached) applyCourseData(JSON.parse(localCached));
        if (!course.value) {
          const allCached = localStorage.getItem('twige_cached_all_courses');
          if (allCached) {
            const match = JSON.parse(allCached).find((c) => String(c.id) === String(props.id));
            if (match) applyCourseData(match);
          }
        }
        if (!course.value) {
          const offlineData = await getOfflineCourse(props.id);
          if (offlineData) {
            applyCourseData(offlineData);
            isOfflineMode.value = !navigator.onLine;
          }
        }
        if (course.value) loadCourseDownloads();
      } catch (err) {
        console.warn('Initial cache check warning:', err);
      }
      try {
        const courseData = await getCourse(props.id).catch(() => null);
        if (courseData) {
          applyCourseData(courseData);
          isOfflineMode.value = false;
          loadCourseDownloads();
          getCourseDownloadedLessonIds(courseData.id).then((ids) => {
            if (ids && ids.length > 0) saveOfflineCourse(courseData);
          }).catch(() => {});
        } else if (!course.value) {
          const fallback = await getOfflineCourse(props.id);
          if (fallback) {
            applyCourseData(fallback);
            isOfflineMode.value = true;
            loadCourseDownloads();
          }
        }
      } catch (e) {
        console.warn('Failed to load course from API:', e);
      } finally {
        isLoading.value = false;
      }
      getDiscussions(props.id)
        .then((d) => { discussions.value = (d || []).map(normalizeDiscussion); })
        .catch(() => {});
      getCurrentUser()
        .then((u) => {
          isLoggedIn.value = Boolean(u);
          if (u) {
            user.value = {
              id: u.id || u.extId || '',
              name: u.name || 'Learner',
              avatar: u.avatar || '',
              role: u.role || 'student',
              email: u.email || '',
              whatsapp: u.whatsapp || '',
            };
          }
        })
        .catch(() => {});
      getEnrollments()
        .then((e) => {
          enrollments.value = e || [];
          syncPaymentNotice();
        })
        .catch(() => {});
    });

    onBeforeUnmount(() => {
      window.clearTimeout(resumeRetryTimer);
      handOffToMiniPlayer();
      window.removeEventListener('twige:downloads-update', handleDownloadsUpdate);
      if (!handedOffToMiniPlayer && offlineVideoUrl.value && offlineVideoUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(offlineVideoUrl.value);
      }
    });

    watch(() => route.query.lessonIndex, (newIdx) => {
      if (newIdx !== undefined && course.value?.curriculum?.[Number(newIdx)]) selectLesson(Number(newIdx));
    });

    watch(() => route.query.message, () => {
      syncPaymentNotice();
      getCourse(props.id).then((data) => { if (data) applyCourseData(data); }).catch(() => {});
      getEnrollments().then((e) => { enrollments.value = e || []; syncPaymentNotice(); }).catch(() => {});
    });

    return {
      cancelDownload,
      canEditComment,
      canModerateComments,
      canPlayLesson,
      cancelEditComment,
      commentSort,
      composerOpen,
      currentDownloadPercent,
      currentLessonOfflineRecord,
      currentVideoTime,
      customVideoPlayer,
      deleteComment,
      discussions,
      downloadLabel,
      editCommentText,
      editingCommentId,
      enrollButtonIcon,
      enrollButtonLabel,
      isLoggedIn,
      enrollInCourse,
      enrollmentStatus,
      enrollmentStatusLabel,
      formatClock,
      focusTags,
      getCategoryIcon,
      getLessonId,
      getLessonProgress,
      getSavedSeconds,
      goToReviews,
      handleDownloadToggle,
      handleLikeDiscussion,
      handleVideoEnded,
      handleVideoError,
      handleVideoLoaded,
      handleVideoPlay,
      handleVideoTimeUpdate,
      hasDbVideo,
      hasCourseAccess,
      hiddenCommentsCount,
      iframeUrl,
      instructorLabel,
      isCurrentLessonDownloaded,
      isCurrentLessonLocked,
      isDownloadingCurrent,
      isLessonComplete,
      isLessonDownloadedById,
      isLoading,
      isStartingCheckout,
      isSubmittingComment,
      insertCurrentVideoTime,
      lessonPositionLabel,
      totalLessons,
      completedLessons,
      courseProgressPercent,
      offlineVideoUrl,
      paymentNotice,
      paymentNoticeTone,
      playerHero,
      priceLabel,
      questionForm,
      resumeFromMini,
      reviewReplies,
      seekVideoTo,
      selectLesson,
      selectedLesson,
      selectedLessonIndex,
      selectedLessonSource,
      showAllComments,
      sortedDiscussions,
      startDownloadCurrent,
      startEditComment,
      startResumePlayback,
      submitDiscussionReply,
      submitQuestion,
      userAvatar,
      userDisplayName,
      visibleDiscussions,
      fallbackAvatar,
      course,
    };
  },
};
</script>

<style scoped>
.details-shell {
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 28px);
}

.details {
  display: grid;
  gap: 18px;
}
.details > * { animation: section-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
.details > *:nth-child(1) { animation-delay: 0.02s; }
.details > *:nth-child(2) { animation-delay: 0.08s; }
.details > *:nth-child(3) { animation-delay: 0.14s; }
.details > *:nth-child(4) { animation-delay: 0.2s; }
.details > *:nth-child(5) { animation-delay: 0.26s; }
@keyframes section-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .details > * { animation: none; }
}

/* ── Skeleton ── */
.skeleton { display: grid; gap: 16px; }
.skeleton__player {
  height: 210px;
  border-radius: var(--radius-2xl);
  background: var(--surface-soft);
}
.skeleton__card,
.skeleton__row {
  display: grid;
  gap: 12px;
  padding: 20px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
}
.skeleton__list { display: grid; gap: 10px; }
.sk {
  display: block;
  height: 12px;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--surface-soft), var(--line), var(--surface-soft));
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
}
.sk--sm { width: 35%; }
.sk--lg { width: 78%; height: 22px; }
.sk--md { width: 55%; }
.sk--row { height: 30px; }
@keyframes shimmer { to { background-position: -200% 0; } }

/* ── Empty state ── */
.empty-state { display: grid; place-items: center; text-align: center; gap: 10px; padding: 40px 24px; }
.empty-state__icon {
  width: 58px; height: 58px; border-radius: 50%;
  display: grid; place-items: center;
  background: var(--brand-soft); color: var(--brand); font-size: 1.4rem;
}
.empty-state strong { color: var(--text-main); font-size: 1.05rem; }
.empty-state span { color: var(--text-muted); font-size: 0.85rem; }
.empty-state__actions { display: flex; gap: 10px; margin-top: 10px; }
.compact { padding: 10px 16px; font-size: 0.84rem; }

/* ── Top bar ── */
.topbar { display: flex; align-items: center; gap: 12px; }
.topbar__back {
  width: 38px; height: 38px; flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  color: var(--text-main);
  font-size: 0.9rem;
  transition: transform var(--transition-fast), color var(--transition-fast), border-color var(--transition-fast);
}
.topbar__back:hover { color: var(--brand); border-color: var(--brand-light); }
.topbar__back:active { transform: scale(0.92); }
.topbar__title {
  font-size: 0.95rem; font-weight: 800; color: var(--text-main);
}

/* ── Hero ── */
.hero { position: relative; }
.hero__frame {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  background: #020617;
  box-shadow: var(--shadow-card);
}
.hero__frame iframe,
.hero__frame img,
.hero__frame :deep(.shared-player-video) {
  width: 100%; height: 100%;
  display: block;
  border: none;
  object-fit: cover;
}
.hero__shade {
  position: absolute; inset: 0; z-index: 1;
  background: linear-gradient(to bottom, rgba(2, 6, 23, 0.18), transparent 26%, transparent 74%, rgba(2, 6, 23, 0.18));
  pointer-events: none;
}
.hero__lock {
  position: absolute; inset: 0; z-index: 4;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 20px; text-align: center;
  background: rgba(15, 23, 42, 0.88);
  backdrop-filter: blur(6px);
  color: #fff;
}
.hero__lock-icon {
  width: 54px; height: 54px; border-radius: 18px;
  display: grid; place-items: center;
  background: var(--brand-gradient);
  box-shadow: var(--shadow-brand);
  font-size: 1.3rem;
}
.hero__lock strong { font-size: 1.05rem; }
.hero__lock small {
  max-width: 240px;
  margin: -4px 0 2px;
  font-size: 0.72rem; line-height: 1.5;
  color: rgba(255, 255, 255, 0.72);
}
/* ── Video summary card ── */
.vsc {
  position: relative;
  display: grid;
  gap: 12px;
  padding: 18px 20px 0;
  border-radius: var(--radius-2xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}
.vsc::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--brand-gradient);
}
.vsc__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.vsc__kicker {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 0.68rem; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--brand-light);
}
.vsc__kicker i { font-size: 0.72rem; }
.vsc__status {
  padding: 3px 9px;
  border-radius: var(--radius-full);
  font-size: 0.6rem; font-weight: 800; letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
  background: var(--surface-soft); color: var(--text-muted);
  border: 1px solid var(--line);
}
.vsc__status.is-success { background: var(--success-soft); color: #059669; border-color: rgba(16, 185, 129, 0.25); }
.vsc__status.is-pending { background: var(--warning-soft); color: #b45309; border-color: rgba(245, 158, 11, 0.25); }
.vsc__status.is-error { background: var(--danger-soft); color: var(--danger); border-color: rgba(239, 68, 68, 0.25); }
.vsc__title {
  margin: 0;
  font-size: 1.5rem; font-weight: 800; line-height: 1.25;
  color: var(--text-main);
}
.vsc__label {
  display: block;
  font-size: 0.62rem; font-weight: 800; letter-spacing: 0.09em;
  text-transform: uppercase; color: var(--text-subtle);
}

.vsc__fields {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}
.vsc__field { min-width: 0; display: grid; gap: 3px; }
.vsc__field strong {
  font-size: 0.8rem; font-weight: 700; color: var(--text-main);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.vsc__stats { display: flex; flex-wrap: wrap; gap: 7px; }
.vsc__stats span {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 10px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-secondary);
  font-size: 0.7rem; font-weight: 600;
}
.vsc__stats b { color: var(--text-main); font-weight: 800; }
.vsc__stats i { color: var(--brand); font-size: 0.75rem; }

.vsc__skills { display: grid; gap: 7px; }
.vsc__tags { display: flex; flex-wrap: wrap; gap: 6px; }
.vsc__tags span {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.68rem; font-weight: 700;
}
.vsc__tags i { font-size: 0.7rem; }

.vsc__notice {
  margin: 0; padding: 11px 13px;
  border-radius: var(--radius-md);
  font-size: 0.8rem; font-weight: 600; line-height: 1.5;
  white-space: pre-line;
}
.vsc__notice.is-info, .vsc__notice.is-gateway { background: var(--brand-soft); color: var(--brand); border: 1px solid rgba(99, 102, 241, 0.2); }
.vsc__notice.is-success { background: var(--success-soft); color: var(--success); border: 1px solid rgba(16, 185, 129, 0.25); }
.vsc__notice.is-warning { background: var(--warning-soft); color: #b45309; border: 1px solid rgba(245, 158, 11, 0.25); }
.vsc__notice.is-error { background: var(--danger-soft); color: var(--danger); border: 1px solid rgba(239, 68, 68, 0.25); }

.vsc__cta {
  display: flex; align-items: center; justify-content: space-between; gap: 14px;
  margin: 0 -20px;
  padding: 16px 20px;
  background: linear-gradient(120deg, var(--brand-soft), transparent 75%);
  border-top: 1px solid var(--line);
}
.vsc__price { display: grid; gap: 2px; }
.vsc__price small {
  font-size: 0.66rem; font-weight: 800; letter-spacing: 0.09em;
  text-transform: uppercase; color: var(--text-muted);
}
.vsc__price strong { font-family: 'Outfit', sans-serif; font-size: 1.5rem; color: var(--brand); }
.vsc__btn { min-width: 170px; }

.vsc__download {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  width: calc(100% + 40px);
  margin: 0 -20px;
  padding: 13px 20px 15px;
  background: var(--surface-subtle);
  border-top: 1px solid var(--line);
  text-align: left;
  overflow: hidden;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.vsc__download:active { background: var(--surface-soft); }
.vsc__dl-cancel {
  width: 28px; height: 28px; flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 50%;
  background: var(--danger-soft);
  color: var(--danger);
  font-size: 0.75rem;
  transition: transform var(--transition-fast), background var(--transition-fast);
}
.vsc__dl-cancel:hover { background: rgba(239, 68, 68, 0.18); }
.vsc__dl-cancel:active { transform: scale(0.9); }
.vsc__dl-icon {
  width: 38px; height: 38px; flex-shrink: 0;
  display: grid; place-items: center;
  border-radius: 12px;
  background: var(--brand-soft); color: var(--brand);
  font-size: 0.95rem;
}
.vsc__dl-icon.is-on { background: var(--success-soft); color: #059669; }
.vsc__dl-icon.is-busy { background: var(--brand-soft); color: var(--brand); }
.vsc__dl-copy { display: grid; gap: 2px; min-width: 0; }
.vsc__dl-copy strong { font-size: 0.88rem; color: var(--text-main); }
.vsc__dl-copy small { font-size: 0.7rem; color: var(--text-muted); }
.vsc__dl-pct { margin-left: auto; font-size: 0.8rem; font-weight: 800; color: var(--brand); }
.vsc__dl-chev, .vsc__dl-trash { margin-left: auto; color: var(--text-subtle); font-size: 0.85rem; }
.vsc__dl-trash { color: var(--danger); }
.vsc__dl-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: var(--line); }
.vsc__dl-bar i { display: block; height: 100%; background: var(--brand-gradient); transition: width 0.2s ease; }

/* ── Block heading ── */
.block { display: grid; gap: 12px; }
.block__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.block__head h2 {
  margin: 0;
  font-size: 1.15rem; font-weight: 800; color: var(--text-main);
}
.block__head > span { font-size: 0.78rem; font-weight: 600; color: var(--text-muted); }
.block__link {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 0.8rem; font-weight: 700; color: var(--brand);
}
.block__link i { font-size: 0.7rem; }

/* ── Lessons ── */
.block__head .lesson-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  white-space: nowrap;
}

.lesson-summary {
  display: grid;
  gap: 8px;
  margin: 10px 0 12px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
}

.lesson-summary__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.lesson-summary__done {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-muted);
}

.lesson-summary__done i {
  color: var(--brand);
  font-size: 0.8rem;
}

.lesson-summary__done strong {
  color: var(--text-main);
  font-weight: 800;
}

.lesson-summary__pct {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--brand);
}

.lesson-summary__rail {
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--line);
  overflow: hidden;
}

.lesson-summary__rail i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--brand-gradient);
  box-shadow: 0 0 10px var(--brand-glow);
  transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.lesson-list { display: grid; gap: 9px; }

.lesson {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 13px 13px 15px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  text-align: left;
  overflow: hidden;
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.lesson:active { transform: scale(0.985); }

.lesson.is-active {
  border-color: var(--brand-light);
  background: var(--brand-soft);
  box-shadow: 0 12px 26px -16px var(--brand-glow);
}

.lesson.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  bottom: 14px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--brand-gradient);
}

.lesson__no {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-muted);
  font-size: 0.73rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  transition: all var(--transition-fast);
}

.lesson__no i { font-size: 0.7rem; }

.lesson.is-active .lesson__no {
  background: var(--brand-gradient);
  border-color: transparent;
  color: #fff;
  box-shadow: var(--shadow-brand-sm);
}

.lesson.is-done .lesson__no {
  background: var(--brand-soft);
  border-color: transparent;
  color: var(--brand);
}

.lesson.is-done.is-active .lesson__no {
  background: var(--brand-gradient);
  color: #fff;
}

.lesson__body {
  display: grid;
  gap: 5px;
  min-width: 0;
  flex: 1;
}

.lesson__title {
  font-size: 0.87rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.lesson.is-active .lesson__title { color: var(--brand); }

.lesson__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 3px 8px;
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-muted);
}

.lesson__meta > span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.lesson__meta i { font-size: 0.62rem; opacity: 0.85; }

.lesson__dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--text-subtle);
  opacity: 0.5;
}

.lesson__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  font-size: 0.6rem;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.lesson__tag i { font-size: 0.55rem; opacity: 1; }

.lesson__tag--preview {
  background: var(--brand-soft);
  color: var(--brand);
}

.lesson__tag--offline {
  background: var(--success-soft);
  color: #059669;
}

.lesson__end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.lesson__end .lesson__pct {
  padding: 4px 7px;
  border-radius: var(--radius-xs);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.01em;
}

.lesson__cta {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-subtle);
  font-size: 0.6rem;
  transition: all var(--transition-fast);
}

.lesson__cta.is-active {
  background: var(--brand-gradient);
  border-color: transparent;
  color: #fff;
  box-shadow: var(--shadow-brand-sm);
}

.lesson.is-locked .lesson__cta {
  background: transparent;
  border-style: dashed;
  color: var(--text-muted);
}

.lesson.is-locked .lesson__title { color: var(--text-muted); }

/* Course progress rail */
.lesson__bar {
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 6px;
  height: 4px;
  border-radius: var(--radius-full);
  background: var(--line);
  overflow: hidden;
  pointer-events: none;
}

.lesson__bar i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--brand-gradient);
  box-shadow: 0 0 8px var(--brand-glow);
  transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.lesson.is-done .lesson__bar i { box-shadow: 0 0 10px var(--brand-glow); }

/* ── Composer — slim until tapped ── */
.composer {
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  overflow: hidden;
}
.composer__peek {
  display: flex; align-items: center; gap: 9px;
  width: 100%;
  padding: 10px 12px;
  color: var(--text-subtle);
  font-size: 0.78rem;
  text-align: left;
}
.composer__peek i { color: var(--brand); font-size: 0.85rem; }
.composer__peek span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Logged-out visitors: invite them to sign in before commenting. */
.composer__signin {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  text-decoration: none;
}
.composer__signin-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.85rem;
}
.composer__signin-copy {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}
.composer__signin-copy strong {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--text-main);
}
.composer__signin-copy small {
  font-size: 0.72rem;
  line-height: 1.4;
  color: var(--text-muted);
}
.composer__signin > i {
  flex-shrink: 0;
  color: var(--brand);
  font-size: 0.85rem;
}
.reply-login-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 10px;
  border-radius: var(--radius-full);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.74rem;
  font-weight: 700;
  text-decoration: none;
}

.composer__form { display: flex; align-items: flex-start; gap: 9px; padding: 10px; }
.composer__avatar { width: 28px; height: 28px; flex-shrink: 0; border-radius: 50%; object-fit: cover; }
.composer__body { flex: 1; min-width: 0; display: grid; gap: 7px; }
.composer textarea {
  width: 100%; resize: none; min-height: 44px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-main); font-size: 0.78rem; outline: none;
}
.composer textarea:focus { border-color: var(--brand-light); }
.composer__row { display: flex; align-items: center; gap: 6px; }
.composer__time {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 6px 9px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-secondary);
  font-size: 0.66rem; font-weight: 700;
}
.composer__time i { color: var(--brand); }
.composer__close {
  width: 28px; height: 28px;
  display: grid; place-items: center;
  border-radius: var(--radius-sm);
  background: var(--surface-soft);
  color: var(--text-muted);
}
.composer__post {
  display: inline-flex; align-items: center; gap: 5px;
  margin-left: auto;
  padding: 7px 11px;
  border-radius: var(--radius-sm);
  background: var(--brand-gradient);
  color: #fff; font-size: 0.74rem; font-weight: 700;
}
.composer__post:disabled { opacity: 0.5; box-shadow: none; cursor: not-allowed; }

/* ── Reveal / list animations ── */
.reveal-enter-active,
.reveal-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease, max-height 0.32s ease;
  max-height: 800px;
  overflow: hidden;
}
.reveal-enter-from,
.reveal-leave-to {
  opacity: 0;
  transform: translateY(-6px);
  max-height: 0;
}
.comment-list { display: grid; gap: 7px; }
.list-enter-active,
.list-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.list-enter-from { opacity: 0; transform: translateY(-10px); }
.list-leave-to { opacity: 0; transform: translateX(24px); }
.list-move { transition: transform 0.3s ease; }
.comment__reveal { display: grid; gap: 8px; margin-top: 2px; }

/* ── Feed ── */
.feed { display: grid; gap: 10px; margin-top: 4px; }

.feed__sort {
  display: flex;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.feed__sort button {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: var(--radius-full);
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  transition: all var(--transition-fast);
}

.feed__sort button i { font-size: 0.66rem; }

.feed__sort button.is-on {
  background: var(--surface);
  color: var(--brand);
  box-shadow: var(--shadow-xs);
}

.comment-list { display: grid; gap: 10px; }

.comment {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 13px 14px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.comment:hover {
  border-color: var(--line-focus);
  box-shadow: var(--shadow-card);
  transform: translateY(-1px);
}

.comment__avatar {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--surface);
  box-shadow: 0 0 0 3px var(--brand-soft);
}

.comment__body { flex: 1; min-width: 0; display: grid; gap: 7px; }

.comment__top { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }

.comment__top strong {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-main);
}

.comment__top small {
  font-size: 0.62rem;
  font-weight: 600;
  color: var(--text-subtle);
  margin-left: auto;
}

.tag {
  padding: 2px 7px;
  border-radius: var(--radius-xs);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.comment__text {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.55;
  color: var(--text-secondary);
}

.comment__edit { display: grid; gap: 8px; }

.comment__edit textarea {
  width: 100%;
  resize: none;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-main);
  font-size: 0.8rem;
  line-height: 1.5;
  transition: all var(--transition-fast);
}

.comment__edit textarea:focus {
  outline: none;
  border-color: var(--brand-light);
  box-shadow: 0 0 0 4px var(--brand-glow);
}

.comment__edit > div { display: flex; gap: 6px; justify-content: flex-end; }

.time-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  margin: 0 2px;
  border-radius: var(--radius-xs);
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.68rem;
  font-weight: 800;
}

.time-chip i { font-size: 0.55rem; }

.comment__actions { display: flex; align-items: center; gap: 6px; }

.comment__actions button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid transparent;
  color: var(--text-muted);
  font-size: 0.68rem;
  font-weight: 700;
  transition: all var(--transition-fast);
}

.comment__actions button:hover {
  background: var(--brand-soft);
  color: var(--brand);
}

.comment__actions button.is-liked {
  background: var(--brand-soft);
  color: var(--brand);
  border-color: rgba(99, 102, 241, 0.2);
}

.comment__actions button i { font-size: 0.7rem; }

.comment__spacer { flex: 1; }

.comment__reveal { display: grid; gap: 8px; }

.replies {
  display: grid;
  gap: 8px;
  padding-left: 12px;
  border-left: 2px solid var(--brand-soft);
}

.reply {
  padding: 9px 11px;
  border-radius: var(--radius-md);
  background: var(--surface-soft);
}

.reply__top { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }

.reply__top strong { font-size: 0.74rem; font-weight: 800; color: var(--text-main); }

.reply__top small { font-size: 0.58rem; color: var(--text-subtle); margin-left: auto; }

.reply p { margin: 3px 0 0; font-size: 0.76rem; line-height: 1.5; color: var(--text-secondary); }

.reply-composer { display: flex; align-items: center; gap: 6px; }

.reply-composer input {
  flex: 1;
  min-width: 0;
  padding: 9px 12px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-main);
  font-size: 0.76rem;
  transition: all var(--transition-fast);
}

.reply-composer input:focus {
  outline: none;
  background: var(--surface);
  border-color: var(--brand-light);
  box-shadow: 0 0 0 4px var(--brand-glow);
}

.reply-composer .primary-button.compact {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  padding: 0;
  display: grid;
  place-items: center;
  border-radius: 50%;
}

.more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 11px;
  border-radius: var(--radius-full);
  background: var(--brand-soft);
  color: var(--brand);
  border: 1px solid transparent;
  font-size: 0.76rem;
  font-weight: 800;
  transition: all var(--transition-fast);
}

.more:hover { background: var(--brand-gradient); color: #fff; }

.feed__empty {
  display: grid;
  place-items: center;
  gap: 8px;
  padding: 28px 20px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px dashed var(--line-strong);
  color: var(--text-muted);
  font-size: 0.8rem;
  text-align: center;
}

.feed__empty i {
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 1.15rem;
  opacity: 1;
}

@media (max-width: 380px) {
  .vsc__head { flex-wrap: wrap; }
  .vsc__cta { flex-direction: column; align-items: stretch; }
  .vsc__btn { width: 100%; }
}
</style>
