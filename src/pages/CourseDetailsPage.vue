<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell">
        <section v-if="course && selectedLesson" class="course-details-shell">
          <section class="player-hero">
            <div class="player-hero__topline">
              <button class="player-back-btn" type="button" aria-label="Go back" @click="$router.back()">
                <i class="fa-solid fa-arrow-left"></i>
              </button>
              <div class="player-hero__topline-right">
                <button
                  class="player-info-btn"
                  type="button"
                  title="Video Player Guide"
                  aria-label="Video Player Guide"
                  @click="showVideoSplash = true"
                >
                  <i class="fa-solid fa-circle-info"></i>
                </button>
                <button class="player-discuss-btn" type="button" @click="scrollToCommunity">
                  <i class="fa-regular fa-comments"></i>
                  <span>Discuss</span>
                </button>
              </div>
            </div>

            <div class="player-stage">
              <div class="player-frame">
                <!-- Video First-time Splash Screen Overlay -->
                <transition name="splash-fade">
                  <div
                    v-if="showVideoSplash"
                    class="video-splash-overlay"
                    @click.stop
                  >
                    <div class="splash-backdrop-glow"></div>
                    <div class="splash-content-box">
                      <div class="splash-badge-icon">
                        <div class="splash-ring-pulse"></div>
                        <i class="fa-solid fa-play"></i>
                      </div>

                      <div class="splash-text-wrap">
                        <span class="splash-kicker">Twige Video Player</span>
                        <h3>Welcome to your lesson</h3>
                        <p class="splash-course-title">{{ selectedLesson.title }}</p>
                      </div>

                      <div class="splash-features-grid">
                        <div class="splash-feature-pill">
                          <i class="fa-solid fa-bolt text-amber"></i>
                          <span>Fast Progress Stream</span>
                        </div>
                        <div class="splash-feature-pill">
                          <i class="fa-solid fa-shield-halved text-emerald"></i>
                          <span>Sandboxed Offline</span>
                        </div>
                        <div class="splash-feature-pill">
                          <i class="fa-solid fa-clock text-indigo"></i>
                          <span>Time Comments</span>
                        </div>
                      </div>

                      <div class="splash-actions">
                        <button
                          class="primary-button splash-play-btn"
                          type="button"
                          @click="dismissSplashAndPlay"
                        >
                          <i class="fa-solid fa-circle-play"></i>
                          <span>Start Learning</span>
                        </button>
                        <button
                          class="ghost-button splash-close-btn"
                          type="button"
                          @click="dismissSplash"
                        >
                          <span>Dismiss</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </transition>

                <div class="video-overlay"></div>
                <CustomVideoPlayer
                  v-if="hasDbVideo"
                  ref="customVideoPlayer"
                  :src="selectedLessonSource"
                  :poster="course.thumbnail"
                  :start-at="getSavedSeconds()"
                  :is-offline="Boolean(offlineVideoUrl)"
                  :is-downloaded="isCurrentLessonDownloaded"
                  :is-downloading="isDownloadingCurrent"
                  :download-percent="currentDownloadPercent"
                  @download-click="handleDownloadToggle"
                  @loaded="handleVideoLoaded"
                  @timeupdate="handleVideoTimeUpdate"
                  @ended="handleVideoEnded"
                  @error="handleVideoError"
                />
                <iframe
                  v-else-if="selectedLesson.youtubeId"
                  :src="iframeUrl"
                  :title="selectedLesson.title"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
                <img
                  v-else
                  :src="course.thumbnail"
                  :alt="selectedLesson.title"
                />
              </div>
              <div class="lesson-chip">
                <span class="chip-dot"></span>
                <span>{{ selectedLesson.type || 'Video' }} &bull; {{ selectedLesson.duration || 'Flexible' }}</span>
              </div>
            </div>
          </section>

          <!-- Compact Modern Offline Download Bar -->
          <section class="surface-card offline-quick-bar">
            <div class="offline-quick-bar__main">
              <div
                class="offline-quick-icon"
                :class="{ 'is-downloaded': isCurrentLessonDownloaded, 'is-downloading': isDownloadingCurrent }"
              >
                <i v-if="isDownloadingCurrent" class="fa-solid fa-circle-notch fa-spin"></i>
                <i v-else-if="isCurrentLessonDownloaded" class="fa-solid fa-circle-check text-emerald"></i>
                <i v-else class="fa-solid fa-arrow-down-to-bracket"></i>
              </div>

              <div class="offline-quick-meta">
                <div class="offline-quick-heading">
                  <strong v-if="isDownloadingCurrent">Downloading... {{ currentDownloadPercent }}%</strong>
                  <strong v-else-if="isCurrentLessonDownloaded">Available Offline</strong>
                  <strong v-else>Download Lesson</strong>

                  <span v-if="currentLessonOfflineRecord?.fileSizeLabel" class="offline-mini-tag">
                    {{ currentLessonOfflineRecord.fileSizeLabel }}
                  </span>
                </div>
                <small v-if="isDownloadingCurrent">Saving into app</small>
                <small v-else-if="isCurrentLessonDownloaded">Ready without internet</small>
                <small v-else>Watch offline in app</small>
              </div>
            </div>

            <div class="offline-quick-bar__actions">
              <!-- Live Progress Bar when downloading -->
              <div v-if="isDownloadingCurrent" class="download-progress-container">
                <div class="download-progress-bar">
                  <div class="download-progress-fill" :style="{ width: `${currentDownloadPercent}%` }"></div>
                </div>
                <span class="download-progress-pct">{{ currentDownloadPercent }}%</span>
              </div>

              <button
                v-else-if="isCurrentLessonDownloaded"
                class="ghost-button compact-btn offline-remove-btn"
                type="button"
                title="Remove download"
                @click="removeCurrentDownload()"
              >
                <i class="fa-solid fa-trash-can"></i>
                <span>Remove</span>
              </button>

              <button
                v-else
                class="primary-button compact-btn offline-action-btn"
                type="button"
                @click="startDownloadCurrent()"
              >
                <i class="fa-solid fa-arrow-down-to-bracket"></i>
                <span>Download</span>
              </button>
            </div>
          </section>

          <section class="surface-card course-summary-card">
            <div class="course-summary__header">
              <div class="course-summary__heading">
                <span class="section-kicker">Video Lesson</span>
                <h2>{{ selectedLesson.title }}</h2>
                <p class="course-eyebrow">{{ course.title }} &bull; {{ instructorLabel }}</p>
              </div>
              <div class="course-summary__header-badges">
                <span class="status-badge" :class="`is-${enrollmentStatus}`">{{ enrollmentStatusLabel }}</span>
                <span class="price-badge">{{ priceLabel }}</span>
              </div>
            </div>

            <div class="summary-pills">
              <span class="summary-pill"><i class="fa-regular fa-circle-play"></i>{{ course.lessonsCount }} lessons</span>
              <span class="summary-pill"><i class="fa-regular fa-clock"></i>{{ course.duration }}</span>
              <span class="summary-pill"><i class="fa-solid fa-signal"></i>{{ course.level }}</span>
              <span class="summary-pill"><i class="fa-solid fa-star"></i>{{ course.rating || '4.8' }} rating</span>
            </div>

            <div class="summary-insights">
              <article class="summary-insight-card">
                <small>Checkout</small>
                <strong>AfriPay secure payment</strong>
                <span>Pay in BIF and unlock the course as soon as your payment is confirmed.</span>
              </article>
              <article class="summary-insight-card">
                <small>Course Focus</small>
                <strong>{{ course.category || 'General learning' }}</strong>
                <span>{{ focusTags.slice(0, 3).join(' • ') || 'Practical local learning' }}</span>
              </article>
            </div>

            <div class="category-bank">
              <div class="category-bank__section">
                <small class="summary-label">Skills and tags</small>
                <div class="category-bank__chips">
                  <span
                    v-for="tag in focusTags"
                    :key="`focus-${tag}`"
                    class="category-token category-token--current"
                  >
                    <i :class="getCategoryIcon(tag)"></i>
                    <span>{{ tag }}</span>
                  </span>
                </div>
              </div>

              <div v-if="databaseCategories.length" class="category-bank__section">
                <small class="summary-label">More categories in the database</small>
                <div class="category-bank__chips">
                  <button
                    v-for="category in databaseCategories"
                    :key="`db-category-${category}`"
                    class="category-token category-token--button"
                    @click="openCategory(category)"
                  >
                    <i :class="getCategoryIcon(category)"></i>
                    <span>{{ category }}</span>
                  </button>
                </div>
              </div>
            </div>

            <p v-if="paymentNotice" class="payment-notice" :class="`is-${paymentNoticeTone}`">
              {{ paymentNotice }}
            </p>

            <div class="course-summary__footer">
              <div class="course-summary__price">
                <small>Course price</small>
                <strong>{{ priceLabel }}</strong>
              </div>
              <div class="course-summary__actions">
                <button class="ghost-button reviews-btn" @click="goToReviews">
                  <i class="fa-regular fa-star"></i>
                  <span>Reviews</span>
                </button>
                <button class="primary-button enroll-btn" :disabled="isStartingCheckout" @click="enrollInCourse">
                  <i :class="enrollButtonIcon"></i>
                  <span>{{ enrollButtonLabel }}</span>
                </button>
              </div>
            </div>
          </section>

          <section class="content-section">
            <div class="section-heading">
              <div>
                <p class="section-kicker">Lessons</p>
                <h3>Course navigator</h3>
              </div>
              <span class="section-caption">{{ lessonPositionLabel }}</span>
            </div>

            <div class="lesson-tabs">
              <button
                v-for="(lesson, index) in course.curriculum || []"
                :key="`lesson-${course.id}-${index}`"
                class="lesson-tab"
                :class="{ 'is-active': selectedLessonIndex === index, 'is-complete': isLessonComplete(index) }"
                @click="selectLesson(index)"
              >
                <div class="lesson-tab__badge">{{ index + 1 }}</div>
                <div class="lesson-tab__copy">
                  <div class="lesson-tab__meta">
                    <span>{{ lesson.duration || 'Flexible' }} &bull; {{ lesson.type || 'video' }}</span>
                    <span v-if="isLessonDownloadedById(getLessonId(lesson, index))" class="lesson-offline-pill">
                      <i class="fa-solid fa-bolt"></i> Offline
                    </span>
                    <span v-else-if="isLessonDownloadingById(getLessonId(lesson, index))" class="lesson-downloading-pill">
                      <i class="fa-solid fa-circle-notch fa-spin"></i> Downloading
                    </span>
                  </div>
                  <strong>{{ lesson.title }}</strong>
                </div>
                <div class="lesson-tab__trailing">
                  <span class="lesson-progress">{{ getLessonProgress(index) }}%</span>
                  <i class="fa-solid fa-play"></i>
                </div>
              </button>
            </div>
          </section>

          <section ref="communitySection" class="content-section">
            <div class="section-heading">
              <div>
                <p class="section-kicker">Community</p>
                <h3>Discuss this lesson</h3>
              </div>
              <span class="section-caption">{{ discussions.length + reviews.length }} items</span>
            </div>

            <div class="community-tabs">
              <button
                class="community-tab"
                :class="{ 'is-active': activeCommunityTab === 'comments' }"
                @click="activeCommunityTab = 'comments'"
              >
                <i class="fa-regular fa-comments"></i>
                <span>Comments</span>
              </button>
              <button
                class="community-tab"
                :class="{ 'is-active': activeCommunityTab === 'reviews' }"
                @click="activeCommunityTab = 'reviews'"
              >
                <i class="fa-regular fa-star"></i>
                <span>Reviews</span>
              </button>
            </div>

            <article v-if="activeCommunityTab === 'comments'" class="surface-card community-composer">
              <div class="community-composer__header">
                <div>
                  <span class="section-kicker">New Comment</span>
                  <h4>Share a thought or ask a question</h4>
                </div>
                <div class="timestamp-toggle-wrap">
                  <button
                    class="filter-chip time-chip"
                    :class="{ 'is-active': questionForm.hasTimestamp }"
                    type="button"
                    title="Toggle video timestamp for this comment"
                    @click="questionForm.hasTimestamp = !questionForm.hasTimestamp"
                  >
                    <i class="fa-regular fa-clock"></i>
                    <span>{{ questionForm.hasTimestamp ? formatClock(questionForm.timeSec) : 'General' }}</span>
                  </button>
                </div>
              </div>

              <!-- Interactive Video Time Selector -->
              <div v-if="questionForm.hasTimestamp" class="comment-time-selector">
                <div class="time-selector-header">
                  <div class="time-selector-label">
                    <i class="fa-solid fa-stopwatch text-indigo"></i>
                    <span>Comment at video time:</span>
                  </div>
                  <strong class="time-selector-display">{{ formatClock(questionForm.timeSec) }}</strong>
                </div>

                <div class="time-selector-controls">
                  <button
                    class="ghost-button time-sync-btn"
                    type="button"
                    title="Snap to currently playing video position"
                    @click="useCurrentVideoTime"
                  >
                    <i class="fa-solid fa-crosshairs"></i>
                    <span>Snap to Current ({{ formatClock(currentVideoTime) }})</span>
                  </button>

                  <div class="time-quick-steppers">
                    <button class="ghost-button stepper-btn" type="button" @click="adjustQuestionTime(-15)">-15s</button>
                    <button class="ghost-button stepper-btn" type="button" @click="adjustQuestionTime(15)">+15s</button>
                    <button class="ghost-button stepper-btn" type="button" @click="questionForm.timeSec = 0">Start</button>
                  </div>
                </div>

                <div class="time-slider-row">
                  <span class="slider-limit">00:00</span>
                  <input
                    v-model.number="questionForm.timeSec"
                    type="range"
                    min="0"
                    :max="Math.max(currentVideoDuration, 60)"
                    step="1"
                    class="comment-time-slider"
                  />
                  <span class="slider-limit">{{ formatClock(Math.max(currentVideoDuration, 60)) }}</span>
                </div>
              </div>

              <div class="user-pill-card">
                <img :src="userAvatar" :alt="userDisplayName" />
                <div>
                  <strong>{{ userDisplayName }}</strong>
                  <span>{{ userProfileLabel }}</span>
                </div>
              </div>

              <label class="input-block">
                <span>Comment</span>
                <textarea
                  v-model="questionForm.text"
                  rows="4"
                  placeholder="Ask a question or write a comment about this part of the lesson..."
                ></textarea>
              </label>

              <div v-if="commentNotice" class="comment-status-notice" :class="`is-${commentNoticeTone}`">
                <i :class="commentNoticeTone === 'error' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-check'"></i>
                <span>{{ commentNotice }}</span>
              </div>

              <div class="comment-meta-row">
                <button class="ghost-button reviews-btn" type="button" @click="goToReviews">
                  <i class="fa-regular fa-star"></i>
                  <span>Open reviews</span>
                </button>
                <button
                  class="primary-button post-btn"
                  type="button"
                  :disabled="isSubmittingComment || !questionForm.text.trim()"
                  @click="submitQuestion"
                >
                  <i v-if="isSubmittingComment" class="fa-solid fa-circle-notch fa-spin"></i>
                  <span v-else>Post comment</span>
                </button>
              </div>
            </article>

            <article v-else class="surface-card community-composer">
              <div class="community-composer__header">
                <div>
                  <span class="section-kicker">Write Review</span>
                  <h4>Rate this lesson experience</h4>
                </div>
                <span class="rating-pill">
                  <i class="fa-solid fa-star"></i>
                  {{ averageRating }}
                </span>
              </div>

              <div class="user-pill-card">
                <img :src="userAvatar" :alt="userDisplayName" />
                <div>
                  <strong>{{ userDisplayName }}</strong>
                  <span>{{ userProfileLabel }}</span>
                </div>
              </div>

              <div class="rating-picker">
                <button
                  v-for="rating in [1, 2, 3, 4, 5]"
                  :key="rating"
                  class="rating-picker__button"
                  :class="{ 'is-active': reviewForm.rating >= rating }"
                  @click="reviewForm.rating = rating"
                >
                  <i class="fa-solid fa-star"></i>
                </button>
              </div>

              <label class="input-block">
                <span>Review</span>
                <textarea
                  v-model="reviewForm.text"
                  rows="4"
                  placeholder="Share what helped you in this lesson..."
                ></textarea>
              </label>

              <div class="comment-meta-row">
                <div class="review-meta">
                  <span class="stream-badge">{{ reviews.length }} reviews</span>
                  <span class="section-caption">{{ averageRating }}/5 average</span>
                </div>
                <button class="primary-button post-btn" @click="submitReview">
                  <span>Post review</span>
                </button>
              </div>
            </article>

            <article v-if="activeCommunityTab === 'comments'" class="surface-card community-stream">
              <div class="community-stream__header">
                <div>
                  <span class="section-kicker">Community Feed</span>
                  <h4>Recent discussion</h4>
                </div>
                <span class="stream-badge">{{ discussions.length }}</span>
              </div>

              <div v-if="discussions.length" class="community-list">
                <article
                  v-for="discussion in discussions"
                  :key="discussion.id"
                  class="discussion-card"
                >
                  <div class="discussion-card__header">
                    <div class="discussion-card__author">
                      <img :src="discussion.avatar || fallbackAvatar(discussion.authorName)" :alt="discussion.authorName" />
                      <div>
                        <strong>{{ discussion.authorName }}</strong>
                        <span>{{ discussion.date || 'Recent' }}</span>
                      </div>
                    </div>
                    <button
                      v-if="discussion.timeSec !== undefined && discussion.timeSec !== null && discussion.timeLabel && discussion.timeLabel !== 'General'"
                      class="time-badge time-badge--clickable"
                      type="button"
                      title="Jump to this video timestamp"
                      @click="seekVideoTo(discussion.timeSec)"
                    >
                      <i class="fa-solid fa-play"></i>
                      <span>{{ discussion.timeLabel }}</span>
                    </button>
                    <span v-else class="time-badge">{{ discussion.timeLabel || 'General' }}</span>
                  </div>
                  <p class="discussion-card__text">{{ discussion.text }}</p>
                  <div class="discussion-card__actions">
                    <button class="ghost-button compact-btn" @click="handleLikeDiscussion(discussion)">
                      <i class="fa-regular fa-thumbs-up"></i>
                      <span>{{ discussion.likes }}</span>
                    </button>
                    <button class="ghost-button compact-btn reply-btn" @click="discussion.showReply = !discussion.showReply">
                      <i class="fa-regular fa-comment"></i>
                      <span>{{ discussion.replies.length }} replies</span>
                    </button>
                  </div>

                  <div v-if="discussion.replies.length" class="reply-list">
                    <article
                      v-for="reply in discussion.replies"
                      :key="reply.id || `${discussion.id}-${reply.date}-${reply.authorName}`"
                      class="teacher-reply-card"
                    >
                      <strong>{{ reply.authorName || 'Teacher' }}</strong>
                      <p>{{ reply.text }}</p>
                    </article>
                  </div>

                  <div v-if="discussion.showReply" class="reply-composer">
                    <input
                      v-model="reviewReplies[discussion.id]"
                      type="text"
                      placeholder="Write a reply..."
                    />
                    <button class="primary-button post-btn reply-post-btn" @click="submitDiscussionReply(discussion)">
                      <span>Post</span>
                    </button>
                  </div>
                </article>
              </div>
              <div v-else class="empty-community">
                <div class="empty-icon"><i class="fa-regular fa-comment-dots"></i></div>
                <p>No comments yet. Be the first to start the discussion!</p>
              </div>
            </article>

            <article v-else class="surface-card community-stream">
              <div class="community-stream__header">
                <div>
                  <span class="section-kicker">Learner Reviews</span>
                  <h4>What students are saying</h4>
                </div>
                <span class="stream-badge">{{ reviews.length }}</span>
              </div>

              <div v-if="reviews.length" class="community-list">
                <article
                  v-for="review in reviews"
                  :key="review.id"
                  class="discussion-card"
                >
                  <div class="discussion-card__header">
                    <div class="discussion-card__author">
                      <img :src="review.avatar || fallbackAvatar(review.authorName)" :alt="review.authorName" />
                      <div>
                        <strong>{{ review.authorName }}</strong>
                        <span>{{ review.date || 'Recent' }}</span>
                      </div>
                    </div>
                    <span class="rating-chip">
                      <i class="fa-solid fa-star"></i>
                      {{ review.rating }}/5
                    </span>
                  </div>
                  <p class="discussion-card__text">{{ review.text }}</p>
                  <article v-if="review.reply" class="teacher-reply-card">
                    <strong>{{ review.reply.authorName || 'Teacher' }}</strong>
                    <p>{{ review.reply.text }}</p>
                  </article>
                </article>
              </div>
              <div v-else class="empty-community">
                <div class="empty-icon"><i class="fa-regular fa-star"></i></div>
                <p>No reviews yet. Share the first one for this lesson.</p>
              </div>
            </article>
          </section>
        </section>

        <section v-else-if="isLoading" class="surface-card empty-card">
          <div class="empty-icon"><i class="fa-solid fa-circle-notch fa-spin"></i></div>
          <strong>Loading course...</strong>
          <span class="section-caption">Preparing course and video details...</span>
        </section>

        <section v-else class="surface-card empty-card offline-fallback-card">
          <div class="empty-icon"><i class="fa-solid fa-cloud-arrow-down"></i></div>
          <strong>Course Unavailable Offline</strong>
          <span class="section-caption">This course has not been downloaded for offline viewing yet. Connect to the internet or view your downloaded lessons.</span>
          <div class="empty-actions" style="margin-top: 16px; display: flex; gap: 10px; justify-content: center;">
            <button class="primary-button compact-btn" type="button" @click="$router.push('/downloads')">
              <i class="fa-solid fa-arrow-down-to-bracket"></i>
              <span>View Downloads</span>
            </button>
            <button class="ghost-button compact-btn" type="button" @click="$router.back()">
              <span>Go Back</span>
            </button>
          </div>
        </section>
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
  createReview,
  getCourse,
  getCourses,
  getCurrentUser,
  getDiscussions,
  getEnrollments,
  getReviews,
  likeDiscussion,
  replyToDiscussion,
  startAfripayCheckout,
} from '@/services/api';
import { formatCurrency, getCategoryIcon } from '@/services/course-helpers';
import {
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

function formatClock(seconds) {
  const safe = Math.max(0, Math.floor(Number(seconds || 0)));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainder = safe % 60;
  if (hours) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function buildAvatar(name) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Learner')}&background=2446d8&color=fff&size=200`;
}

function normalizeDiscussion(discussion) {
  return {
    ...discussion,
    likes: Number(discussion?.likes || 0),
    replies: Array.isArray(discussion?.replies) ? discussion.replies : [],
    showReply: Boolean(discussion?.showReply),
  };
}

function normalizeReview(review) {
  return {
    ...review,
    likes: Number(review?.likes || 0),
    rating: Number(review?.rating || 0),
  };
}

export default {
  name: 'CourseDetailsPage',
  components: { IonContent, IonPage, CustomVideoPlayer },
  props: ['id'],
  setup(props) {
    const router = useRouter();
    const route = useRoute();
    const communitySection = ref(null);
    const customVideoPlayer = ref(null);
    const course = ref(null);
    const allCourses = ref([]);
    const enrollments = ref([]);
    const selectedLessonIndex = ref(0);
    const selectedLesson = ref(null);
    const activeCommunityTab = ref('comments');
    const discussions = ref([]);
    const reviews = ref([]);
    const reviewForm = ref({ rating: 5, text: '' });
    const questionForm = ref({ text: '', timeSec: 0 });
    const reviewReplies = ref({});
    const progressMap = ref(getProgressMap());
    const user = ref({ id: '', name: 'Learner', avatar: '', role: 'student', email: '', whatsapp: '' });
    const currentVideoTime = ref(0);
    const currentVideoDuration = ref(0);
    const lastPersistedSecond = ref(-1);
    const preferStreamSource = ref(true);
    const isStartingCheckout = ref(false);
    const paymentNotice = ref('');
    const paymentNoticeTone = ref('info');
    const isOfflineMode = ref(false);
    const isLoading = ref(true);

    const downloadedLessonIds = ref(new Set());
    const downloadingLessonIds = ref(new Map());
    const currentLessonOfflineRecord = ref(null);
    const offlineVideoUrl = ref(null);

    const getLessonId = (lesson = selectedLesson.value, index = selectedLessonIndex.value) => {
      if (!course.value) return '';
      return getLessonIdentifier(course.value.id, lesson, index);
    };

    const currentLessonId = computed(() => getLessonId(selectedLesson.value, selectedLessonIndex.value));

    const isCurrentLessonDownloaded = computed(() => {
      return downloadedLessonIds.value.has(currentLessonId.value);
    });

    const isDownloadingCurrent = computed(() => {
      return downloadingLessonIds.value.has(currentLessonId.value);
    });

    const currentDownloadPercent = computed(() => {
      return downloadingLessonIds.value.get(currentLessonId.value) || 0;
    });

    const isLessonDownloadedById = (lessonId) => downloadedLessonIds.value.has(String(lessonId));
    const isLessonDownloadingById = (lessonId) => downloadingLessonIds.value.has(String(lessonId));

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
          if (offlineVideoUrl.value && offlineVideoUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(offlineVideoUrl.value);
          }
          offlineVideoUrl.value = blobUrl;
        }
      } else {
        currentLessonOfflineRecord.value = null;
        if (offlineVideoUrl.value && offlineVideoUrl.value.startsWith('blob:')) {
          URL.revokeObjectURL(offlineVideoUrl.value);
        }
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
      if (!lesson || !course.value) {
        paymentNotice.value = 'Please select a lesson to download.';
        paymentNoticeTone.value = 'warning';
        return;
      }

      const streamUrl = lesson.streamUrl || (lesson.videoKey ? `/api/videos/stream/?key=${encodeURIComponent(lesson.videoKey)}` : '');
      const videoUrl = streamUrl || lesson.videoUrl || lesson.source || '';

      if (!videoUrl) {
        paymentNotice.value = 'No downloadable video source available for this lesson.';
        paymentNoticeTone.value = 'error';
        return;
      }

      const lessonId = getLessonId(lesson, index);
      if (downloadingLessonIds.value.has(lessonId)) return;

      downloadingLessonIds.value.set(lessonId, 0);

      try {
        const payloadLesson = {
          ...lesson,
          streamUrl,
          videoUrl: lesson.videoUrl || streamUrl,
          lessonIndex: index,
        };
        await downloadLessonVideo(payloadLesson, course.value, (percent) => {
          downloadingLessonIds.value.set(lessonId, percent);
        });

        downloadedLessonIds.value.add(lessonId);
        downloadingLessonIds.value.delete(lessonId);
        await syncOfflineStatusForCurrentLesson();
        paymentNotice.value = 'Lesson video downloaded for offline viewing.';
        paymentNoticeTone.value = 'success';
      } catch (error) {
        console.error('Download failed:', error);
        downloadingLessonIds.value.delete(lessonId);
        paymentNotice.value = `Download failed: ${error.message || 'Network error'}`;
        paymentNoticeTone.value = 'error';
      }
    };

    const removeCurrentDownload = async (targetLesson = null, targetIndex = null) => {
      const lesson = (targetLesson && typeof targetLesson === 'object' && !('target' in targetLesson) && !('preventDefault' in targetLesson))
        ? targetLesson
        : selectedLesson.value;
      const index = (typeof targetIndex === 'number') ? targetIndex : selectedLessonIndex.value;
      if (!lesson || !course.value) return;

      const lessonId = getLessonId(lesson, index);
      await deleteDownloadedLesson(lessonId);
      downloadedLessonIds.value.delete(lessonId);
      await syncOfflineStatusForCurrentLesson();
      paymentNotice.value = 'Lesson removed from offline downloads.';
      paymentNoticeTone.value = 'info';
    };

    const handleDownloadToggle = () => {
      if (isCurrentLessonDownloaded.value) {
        removeCurrentDownload();
      } else if (!isDownloadingCurrent.value) {
        startDownloadCurrent();
      }
    };

    const refreshProgressMap = () => {
      progressMap.value = getProgressMap();
    };

    const getLessonKey = (index = selectedLessonIndex.value) => {
      if (!course.value) {
        return '';
      }
      return `${course.value.id}-${index}`;
    };

    const getProgressEntry = (index = selectedLessonIndex.value) => {
      const key = getLessonKey(index);
      return key ? progressMap.value[key] || null : null;
    };

    const userAvatar = computed(() => user.value?.avatar || buildAvatar(user.value?.name));
    const userDisplayName = computed(() => user.value?.name || 'Learner');
    const userProfileLabel = computed(() => {
      const role = String(user.value?.role || 'student');
      return role.charAt(0).toUpperCase() + role.slice(1);
    });
    const questionTimeLabel = computed(() => formatClock(questionForm.value.timeSec || currentVideoTime.value || getSavedSeconds()));
    const focusTags = computed(() => {
      const tags = [course.value?.category, ...(course.value?.skills || [])]
        .filter(Boolean)
        .map((item) => String(item).trim())
        .filter(Boolean);
      return [...new Set(tags)].slice(0, 6);
    });
    const databaseCategories = computed(() => {
      const current = String(course.value?.category || '');
      const categories = allCourses.value
        .map((item) => String(item?.category || '').trim())
        .filter(Boolean)
        .filter((item) => item !== current);
      return [...new Set(categories)].slice(0, 8);
    });

    const selectedLessonSource = computed(() => {
      if (offlineVideoUrl.value) {
        return offlineVideoUrl.value;
      }
      if (!selectedLesson.value) {
        return '';
      }
      if (preferStreamSource.value) {
        return selectedLesson.value.streamUrl || selectedLesson.value.videoUrl || selectedLesson.value.source || '';
      }
      return selectedLesson.value.videoUrl || selectedLesson.value.streamUrl || selectedLesson.value.source || '';
    });

    const hasDbVideo = computed(() => Boolean(offlineVideoUrl.value || (selectedLesson.value && (selectedLesson.value.streamUrl || selectedLesson.value.videoUrl || selectedLesson.value.source))));

    const iframeUrl = computed(() => {
      if (!selectedLesson.value?.youtubeId) {
        return '';
      }
      return `https://www.youtube.com/embed/${selectedLesson.value.youtubeId}?rel=0&modestbranding=1`;
    });

    const instructorLabel = computed(() => course.value?.instructor || 'Twige Academy');
    const priceLabel = computed(() => formatCurrency(course.value?.price || 0));
    const lessonPositionLabel = computed(() => {
      if (!course.value || !selectedLesson.value) {
        return '';
      }
      return `Lesson ${selectedLessonIndex.value + 1} of ${(course.value.curriculum || []).length}`;
    });

    const averageRating = computed(() => {
      if (reviews.value.length) {
        const total = reviews.value.reduce((sum, review) => sum + Number(review.rating || 0), 0);
        return (total / reviews.value.length).toFixed(1);
      }
      return Number(course.value?.rating || 0).toFixed(1);
    });
    const currentEnrollment = computed(() => {
      if (!course.value) {
        return null;
      }
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
      if (status === 'success') {
        return 'success';
      }
      if (status === 'error' || status === 'failed') {
        return 'error';
      }
      if (currentEnrollment.value) {
        return 'pending';
      }
      return 'idle';
    });
    const enrollmentStatusLabel = computed(() => {
      if (enrollmentStatus.value === 'success') {
        return 'Already enrolled';
      }
      if (enrollmentStatus.value === 'pending') {
        return 'Payment pending';
      }
      if (enrollmentStatus.value === 'error') {
        return 'Payment failed';
      }
      return 'Ready to enroll';
    });
    const enrollButtonLabel = computed(() => {
      if (isStartingCheckout.value) {
        return 'Opening AfriPay...';
      }
      if (enrollmentStatus.value === 'success') {
        return 'Start Learning';
      }
      if (enrollmentStatus.value === 'pending') {
        return 'Continue Payment';
      }
      if (!getToken()) {
        return 'Login to Enroll';
      }
      return 'Pay with AfriPay';
    });
    const enrollButtonIcon = computed(() => {
      if (enrollmentStatus.value === 'success') {
        return 'fa-solid fa-circle-play';
      }
      if (!getToken()) {
        return 'fa-solid fa-right-to-bracket';
      }
      return 'fa-solid fa-bolt';
    });

    const getSavedSeconds = () => {
      const entry = getProgressEntry();
      if (!entry) {
        return 0;
      }
      const percent = Number(entry.progressPercent || 0);
      return percent >= 98 ? 0 : Number(entry.seconds || 0);
    };

    const persistLessonProgress = (currentTime, duration, force = false) => {
      if (!course.value || !selectedLesson.value) {
        return;
      }
      const safeTime = Math.max(0, Math.floor(Number(currentTime || 0)));
      const safeDuration = Math.max(0, Math.floor(Number(duration || 0)));
      if (!force && lastPersistedSecond.value >= 0 && Math.abs(safeTime - lastPersistedSecond.value) < 5) {
        return;
      }
      const progressPercent = safeDuration
        ? Math.min(100, Math.round((safeTime / safeDuration) * 100))
        : 0;

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

    const handleVideoLoaded = (payload) => {
      currentVideoTime.value = Number(payload?.currentTime || 0);
      currentVideoDuration.value = Number(payload?.duration || 0);
      if (!questionForm.value.timeSec) {
        questionForm.value.timeSec = currentVideoTime.value;
      }
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
      if (preferStreamSource.value && selectedLesson.value?.videoUrl) {
        preferStreamSource.value = false;
        return;
      }
      paymentNotice.value = 'The video is streaming progressively. Playback will continue as more data loads.';
      paymentNoticeTone.value = 'warning';
    };

    const isLessonComplete = (index) => Number(getProgressEntry(index)?.progressPercent || 0) >= 95;
    const getLessonProgress = (index) => Math.round(Number(getProgressEntry(index)?.progressPercent || 0));

    const selectLesson = async (index) => {
      selectedLessonIndex.value = index;
      selectedLesson.value = course.value?.curriculum?.[index] || null;
      preferStreamSource.value = true;
      const savedSeconds = Number(getProgressEntry(index)?.seconds || 0);
      currentVideoTime.value = savedSeconds;
      currentVideoDuration.value = 0;
      questionForm.value.timeSec = savedSeconds;
      lastPersistedSecond.value = -1;
      await syncOfflineStatusForCurrentLesson();

      // If offline and the selected lesson is not downloaded, alert user gracefully
      const lessonId = getLessonId(selectedLesson.value, index);
      if (isOfflineMode.value && !downloadedLessonIds.value.has(lessonId)) {
        paymentNotice.value = `"${selectedLesson.value?.title || 'Lesson'}" is not downloaded for offline viewing. Reconnect to internet to watch it.`;
        paymentNoticeTone.value = 'warning';
      }
    };

    const scrollToCommunity = () => {
      communitySection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const goToReviews = async () => {
      activeCommunityTab.value = 'reviews';
      await nextTick();
      scrollToCommunity();
    };

    const submitCheckoutForm = (action, fields) => {
      // On Capacitor (Android APK), form.submit() hijacks the WebView.
      // Instead, build a GET URL and open it with '_system' so Capacitor
      // routes it to the Android system browser. Falls back on web too.
      try {
        const params = new URLSearchParams();
        Object.entries(fields || {}).forEach(([key, value]) => {
          params.set(key, String(value ?? ''));
        });
        const checkoutUrl = action + '?' + params.toString();
        // '_system' → Capacitor opens Android system browser (not WebView)
        // '_blank'  → fallback for desktop/web browsers
        const win = window.open(checkoutUrl, '_system');
        if (!win) {
          // If blocked (e.g. strict browser), try _blank
          window.open(checkoutUrl, '_blank');
        }
      } catch {
        // Last resort: hidden form submit (web-only)
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

    const syncPaymentNotice = () => {
      const token = String(route.query.afripay || '').trim();
      if (!token) {
        return;
      }
      const matched = enrollments.value.find((entry) => entry.id === token);
      if (!matched) {
        paymentNotice.value = 'We are waiting for AfriPay confirmation for this course.';
        paymentNoticeTone.value = 'info';
        return;
      }
      const status = String(matched.paymentStatus || '').toLowerCase();
      if (status === 'success') {
        paymentNotice.value = 'Payment confirmed. Your course is now unlocked in My Learning.';
        paymentNoticeTone.value = 'success';
        return;
      }
      if (status === 'error') {
        paymentNotice.value = 'AfriPay reported a payment issue. You can retry checkout from here.';
        paymentNoticeTone.value = 'error';
        return;
      }
      paymentNotice.value = 'Your payment was created and is still waiting for confirmation.';
      paymentNoticeTone.value = 'warning';
    };

    const openCategory = (category) => {
      router.push({
        name: 'discover',
        query: { category },
      });
    };

    const enrollInCourse = async () => {
      if (enrollmentStatus.value === 'success') {
        router.push('/my-learning');
        return;
      }
      if (!getToken()) {
        router.push({
          name: 'login',
          query: { redirect: route.fullPath },
        });
        return;
      }
      if (!course.value) {
        return;
      }

      isStartingCheckout.value = true;
      paymentNotice.value = 'Preparing your AfriPay checkout...';
      paymentNoticeTone.value = 'info';

      try {
        const checkout = await startAfripayCheckout({
          courseId: course.value.id,
          studentName: userDisplayName.value,
          studentEmail: user.value?.email || '',
          studentWhatsapp: user.value?.whatsapp || '',
          amountPaid: course.value.price,
        });
        submitCheckoutForm(checkout.action, checkout.fields);
      } catch (error) {
        paymentNotice.value = error.message || 'We could not start AfriPay checkout.';
        paymentNoticeTone.value = 'error';
      } finally {
        isStartingCheckout.value = false;
      }
    };

    const useCurrentVideoTime = () => {
      questionForm.value.timeSec = Math.max(0, Math.floor(currentVideoTime.value || getSavedSeconds()));
    };

    const submitQuestion = async () => {
      const text = questionForm.value.text.trim();
      if (!text || !course.value || !selectedLesson.value) {
        return;
      }

      const created = await createDiscussion({
        courseId: course.value.id,
        lesson: selectedLesson.value.title,
        timeSec: questionForm.value.timeSec || 0,
        timeLabel: formatClock(questionForm.value.timeSec || 0),
        author_id: user.value?.id || '',
        authorName: userDisplayName.value,
        avatar: userAvatar.value,
        role: String(user.value?.role || 'student').toLowerCase(),
        text,
      });

      discussions.value = [normalizeDiscussion(created), ...discussions.value];
      questionForm.value.text = '';
    };

    const submitReview = async () => {
      const text = reviewForm.value.text.trim();
      if (!text || !course.value) {
        return;
      }

      const created = await createReview({
        courseId: course.value.id,
        author_id: user.value?.id || '',
        authorName: userDisplayName.value,
        avatar: userAvatar.value,
        rating: reviewForm.value.rating,
        text,
      });

      reviews.value = [normalizeReview(created), ...reviews.value];
      reviewForm.value = {
        rating: 5,
        text: '',
      };
    };

    const handleLikeDiscussion = async (discussion) => {
      const updated = await likeDiscussion(discussion.id);
      discussions.value = discussions.value.map((item) => (
        item.id === discussion.id ? normalizeDiscussion(updated) : item
      ));
    };

    const submitDiscussionReply = async (discussion) => {
      const text = String(reviewReplies.value[discussion.id] || '').trim();
      if (!text) {
        return;
      }

      const updated = await replyToDiscussion(discussion.id, text);
      discussions.value = discussions.value.map((item) => (
        item.id === discussion.id ? normalizeDiscussion(updated) : item
      ));
      reviewReplies.value[discussion.id] = '';
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

    const applyCourseData = (data) => {
      if (!data) return false;
      course.value = data;

      const qIndex = route.query.lessonIndex !== undefined ? Number(route.query.lessonIndex) : null;
      const latestEntry = Object.values(progressMap.value)
        .filter((entry) => entry.courseId === data.id)
        .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0];

      let initialIndex = 0;
      if (qIndex !== null && !isNaN(qIndex) && data.curriculum?.[qIndex]) {
        initialIndex = qIndex;
      } else if (latestEntry && data.curriculum?.[latestEntry.lessonIndex]) {
        initialIndex = latestEntry.lessonIndex;
      }

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

      // ── Step 1: Instant local cache check (0ms render) ──
      try {
        // A. From localStorage direct course cache
        const localCached = localStorage.getItem(`twige_course_meta_${props.id}`);
        if (localCached) {
          applyCourseData(JSON.parse(localCached));
        }

        // B. From all cached courses list
        if (!course.value) {
          const allCached = localStorage.getItem('twige_cached_all_courses');
          if (allCached) {
            const list = JSON.parse(allCached);
            const match = list.find((c) => String(c.id) === String(props.id));
            if (match) {
              applyCourseData(match);
            }
          }
        }

        // C. From offline downloads vault
        if (!course.value) {
          const offlineData = await getOfflineCourse(props.id);
          if (offlineData) {
            applyCourseData(offlineData);
            isOfflineMode.value = !navigator.onLine;
          }
        }

        if (course.value) {
          loadCourseDownloads();
        }
      } catch (err) {
        console.warn('Initial cache check warning:', err);
      }

      // ── Step 2: Fetch Course directly (Fast, independent of secondary data) ──
      try {
        const courseData = await getCourse(props.id).catch(() => null);
        if (courseData) {
          applyCourseData(courseData);
          isOfflineMode.value = false;
          loadCourseDownloads();

          getCourseDownloadedLessonIds(courseData.id).then((ids) => {
            if (ids && ids.length > 0) {
              saveOfflineCourse(courseData);
            }
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

      // ── Step 3: Fetch secondary data in background (never blocks page) ──
      getDiscussions(props.id)
        .then((d) => { discussions.value = (d || []).map(normalizeDiscussion); })
        .catch(() => {});

      getReviews(props.id)
        .then((r) => { reviews.value = (r || []).map(normalizeReview); })
        .catch(() => {});

      getCurrentUser()
        .then((u) => {
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

      getCourses()
        .then((c) => { allCourses.value = c || []; })
        .catch(() => {});
    });

    onBeforeUnmount(() => {
      window.removeEventListener('twige:downloads-update', handleDownloadsUpdate);
      if (offlineVideoUrl.value && offlineVideoUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(offlineVideoUrl.value);
      }
    });

    watch(
      () => route.query.lessonIndex,
      (newIdx) => {
        if (newIdx !== undefined && course.value?.curriculum?.[Number(newIdx)]) {
          selectLesson(Number(newIdx));
        }
      }
    );

    return {
      activeCommunityTab,
      averageRating,
      communitySection,
      course,
      currentDownloadPercent,
      currentLessonId,
      currentLessonOfflineRecord,
      currentVideoTime,
      customVideoPlayer,
      databaseCategories,
      discussions,
      enrollInCourse,
      enrollmentStatus,
      enrollmentStatusLabel,
      enrollButtonIcon,
      enrollButtonLabel,
      fallbackAvatar,
      focusTags,
      getCategoryIcon,
      getLessonId,
      getLessonProgress,
      getSavedSeconds,
      goToReviews,
      handleDownloadToggle,
      handleLikeDiscussion,
      handleVideoError,
      handleVideoEnded,
      handleVideoLoaded,
      handleVideoTimeUpdate,
      hasDbVideo,
      iframeUrl,
      instructorLabel,
      isCurrentLessonDownloaded,
      isDownloadingCurrent,
      isLoading,
      isLessonComplete,
      isLessonDownloadedById,
      isLessonDownloadingById,
      isOfflineMode,
      isStartingCheckout,
      lessonPositionLabel,
      offlineVideoUrl,
      openCategory,
      paymentNotice,
      paymentNoticeTone,
      priceLabel,
      questionForm,
      questionTimeLabel,
      removeCurrentDownload,
      reviewForm,
      reviewReplies,
      reviews,
      scrollToCommunity,
      selectLesson,
      selectedLesson,
      selectedLessonIndex,
      selectedLessonSource,
      startDownloadCurrent,
      submitDiscussionReply,
      submitQuestion,
      submitReview,
      useCurrentVideoTime,
      user,
      userAvatar,
      userDisplayName,
      userProfileLabel,
    };
  },
};
</script>


<style scoped>
.course-details-shell {
  display: grid;
  gap: 20px;
}

/* Player Hero */
.player-hero {
  display: grid;
  gap: 12px;
}

.player-hero__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.player-back-btn,
.player-discuss-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  background: var(--surface);
  border: 1px solid var(--line);
  color: var(--text-main);
  font-weight: 700;
  font-size: 0.85rem;
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.player-back-btn {
  width: 44px;
  height: 44px;
  padding: 0;
  justify-content: center;
  border-radius: var(--radius-md);
}

.player-back-btn:hover,
.player-discuss-btn:hover {
  background: var(--surface-soft);
  color: var(--brand);
  border-color: var(--brand-light);
}

.player-stage {
  position: relative;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  background: #020617;
}

.player-frame {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-2xl);
  background: #020617;
}

.player-frame iframe,
.player-frame img {
  width: 100%;
  min-height: 240px;
  max-height: 420px;
  border: none;
  display: block;
  object-fit: cover;
}

.lesson-chip {
  position: absolute;
  top: 12px;
  left: 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(12px);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.15);
  z-index: 2;
}

.chip-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #10b981;
}

/* Compact Modern Offline Download Bar */
.offline-quick-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  transition: all var(--transition-normal);
}

.offline-quick-bar__main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.offline-quick-icon {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--brand);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.offline-quick-icon.is-downloading {
  background: rgba(99, 102, 241, 0.12);
  border-color: rgba(99, 102, 241, 0.4);
  color: var(--brand);
}

.offline-quick-icon.is-downloaded {
  background: rgba(16, 185, 129, 0.12);
  border-color: rgba(16, 185, 129, 0.4);
  color: #10b981;
}

.offline-quick-meta {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.offline-quick-heading {
  display: flex;
  align-items: center;
  gap: 8px;
}

.offline-quick-heading strong {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text-main);
  white-space: nowrap;
}

.offline-mini-tag {
  display: inline-flex;
  padding: 1px 7px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 700;
  border: 1px solid var(--line);
}

.offline-quick-meta small {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 600;
}

.offline-quick-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.download-progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 130px;
}

.download-progress-bar {
  flex: 1;
  height: 6px;
  background: var(--line);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.download-progress-fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%);
  border-radius: var(--radius-full);
  transition: width 0.2s ease;
}

.download-progress-pct {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--brand);
  min-width: 32px;
  text-align: right;
}

.offline-action-btn {
  padding: 8px 14px;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.offline-remove-btn {
  padding: 7px 12px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: var(--radius-md);
}

.offline-remove-btn:hover {
  background: rgba(239, 68, 68, 0.16);
  border-color: #ef4444;
}

/* Course Summary Card */
.course-summary-card {
  display: grid;
  gap: 18px;
  padding: 22px;
  border-radius: var(--radius-2xl);
}

.course-summary__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.course-summary__heading {
  display: grid;
  gap: 6px;
}

.course-summary__heading h2 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.3;
}

.course-eyebrow {
  margin: 0;
  font-size: 0.84rem;
  color: var(--text-muted);
}

.course-summary__header-badges {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
}

.status-badge {
  padding: 5px 12px;
  border-radius: var(--radius-full);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-badge.is-success,
.status-badge.is-enrolled {
  background: var(--success-soft);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.status-badge.is-pending {
  background: var(--warning-soft);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.25);
}

.status-badge.is-idle,
.status-badge.is-preview {
  background: var(--surface-soft);
  color: var(--text-muted);
  border: 1px solid var(--line);
}

.price-badge {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--brand);
  font-family: 'Outfit', sans-serif;
}

.summary-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 600;
}

.summary-pill i {
  color: var(--brand);
}

.summary-insights {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-insight-card {
  display: grid;
  gap: 5px;
  padding: 14px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.summary-insight-card small,
.summary-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--brand);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-insight-card strong {
  font-size: 0.9rem;
  color: var(--text-main);
}

.summary-insight-card span {
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.4;
}

.category-bank {
  display: grid;
  gap: 12px;
}

.category-bank__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.category-token {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 600;
}

.category-token--current {
  background: var(--brand-soft);
  color: var(--brand);
  border-color: rgba(99, 102, 241, 0.25);
}

.category-token--button {
  cursor: pointer;
  transition: all var(--transition-fast);
}

.category-token--button:hover {
  background: var(--brand-soft);
  color: var(--brand);
}

.payment-notice {
  margin: 0;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.4;
}

.payment-notice.is-info {
  background: var(--brand-soft);
  color: var(--brand);
  border: 1px solid rgba(99, 102, 241, 0.2);
}

.payment-notice.is-success {
  background: var(--success-soft);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.payment-notice.is-warning {
  background: var(--warning-soft);
  color: #d97706;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.payment-notice.is-error {
  background: var(--danger-soft);
  color: var(--danger);
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.course-summary__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.course-summary__price small {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
}

.course-summary__price strong {
  display: block;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--brand);
  font-family: 'Outfit', sans-serif;
}

.course-summary__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reviews-btn {
  padding: 10px 14px;
  border-radius: var(--radius-md);
  font-size: 0.84rem;
}

.enroll-btn {
  padding: 11px 20px;
  border-radius: var(--radius-md);
  font-size: 0.88rem;
}

/* Lesson Tabs (Navigator) */
.lesson-tabs {
  display: grid;
  gap: 10px;
}

.lesson-tab {
  display: grid;
  grid-template-columns: 38px 1fr auto;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  text-align: left;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.lesson-tab:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  border-color: rgba(99, 102, 241, 0.3);
}

.lesson-tab__badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--surface-soft);
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.88rem;
  display: grid;
  place-items: center;
}

.lesson-tab__copy {
  display: grid;
  gap: 2px;
}

.lesson-tab__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
}

.lesson-offline-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: rgba(16, 185, 129, 0.12);
  color: #10b981;
  font-size: 0.65rem;
  font-weight: 700;
}

.lesson-downloading-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  background: rgba(99, 102, 241, 0.12);
  color: var(--brand);
  font-size: 0.65rem;
  font-weight: 700;
}

.lesson-tab__copy strong {
  font-size: 0.92rem;
  color: var(--text-main);
  line-height: 1.35;
}

.lesson-tab__trailing {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lesson-progress {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--brand);
}

.lesson-tab__trailing i {
  color: var(--text-subtle);
  font-size: 0.8rem;
}

/* Active Lesson Style */
.lesson-tab.is-active {
  background: var(--brand-dark);
  border-color: var(--brand-light);
  color: #ffffff;
  box-shadow: var(--shadow-md);
}

.lesson-tab.is-active .lesson-tab__badge {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.lesson-tab.is-active .lesson-tab__meta {
  color: rgba(226, 232, 240, 0.7);
}

.lesson-tab.is-active .lesson-tab__copy strong {
  color: #ffffff;
}

.lesson-tab.is-active .lesson-progress {
  color: #a5b4fc;
}

.lesson-tab.is-active .lesson-tab__trailing i {
  color: #ffffff;
}

.lesson-tab.is-complete:not(.is-active) .lesson-tab__badge {
  background: var(--success-soft);
  color: var(--success);
}

/* Community Section */
.community-tabs {
  display: flex;
  padding: 4px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  gap: 6px;
}

.community-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.84rem;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.community-tab.is-active {
  background: var(--brand-gradient);
  color: #ffffff;
  box-shadow: var(--shadow-brand-sm);
}

.community-composer {
  display: grid;
  gap: 14px;
  padding: 20px;
  border-radius: var(--radius-2xl);
}

.community-composer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.community-composer__header h4 {
  margin: 2px 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-main);
}

.time-chip {
  padding: 5px 10px;
  font-size: 0.74rem;
}

.user-pill-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-lg);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.user-pill-card img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.user-pill-card strong {
  display: block;
  font-size: 0.86rem;
  color: var(--text-main);
}

.user-pill-card span {
  display: block;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.community-composer textarea {
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

.community-composer textarea:focus {
  background: var(--surface);
  border-color: var(--brand-light);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.comment-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.post-btn {
  padding: 10px 18px;
  font-size: 0.85rem;
  border-radius: var(--radius-md);
}

.rating-picker {
  display: flex;
  gap: 8px;
}

.rating-picker__button {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  color: var(--text-subtle);
  font-size: 1rem;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.rating-picker__button.is-active {
  background: #fffbeb;
  border-color: #fde68a;
  color: #f59e0b;
}

/* Discussion Stream */
.community-stream {
  display: grid;
  gap: 14px;
}

.community-stream__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stream-badge {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--brand);
  background: var(--brand-soft);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}

.community-list {
  display: grid;
  gap: 12px;
}

.discussion-card {
  display: grid;
  gap: 10px;
  padding: 16px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
}

.discussion-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.discussion-card__author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.discussion-card__author img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.discussion-card__author strong {
  display: block;
  font-size: 0.88rem;
  color: var(--text-main);
}

.discussion-card__author small {
  display: block;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.discussion-role {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--brand);
  background: var(--brand-soft);
  padding: 3px 8px;
  border-radius: var(--radius-full);
}

.discussion-card__text {
  margin: 0;
  font-size: 0.88rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.discussion-card__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.like-btn,
.reply-btn {
  padding: 6px 12px;
  font-size: 0.78rem;
  border-radius: var(--radius-full);
}

.reply-list {
  display: grid;
  gap: 8px;
  margin-top: 6px;
  padding-left: 14px;
  border-left: 2px solid var(--line);
}

.reply-card {
  padding: 10px 12px;
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  font-size: 0.82rem;
}

.reply-card strong {
  display: block;
  color: var(--text-main);
  margin-bottom: 2px;
}

.reply-card p {
  margin: 0;
  color: var(--text-secondary);
}

.reply-composer {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.reply-composer input {
  flex: 1;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  background: var(--surface-soft);
  border: 1px solid var(--line);
  font-size: 0.82rem;
  outline: none;
}

.reply-composer input:focus {
  background: var(--surface);
  border-color: var(--brand-light);
}

.reply-post-btn {
  padding: 8px 14px;
  font-size: 0.78rem;
}

@media (max-width: 540px) {
  .course-summary__header {
    flex-direction: column;
  }

  .course-summary__header-badges {
    align-items: flex-start;
  }

  .summary-insights {
    grid-template-columns: 1fr;
  }

  .course-summary__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .course-summary__actions {
    flex-direction: column;
  }

  .enroll-btn,
  .reviews-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
