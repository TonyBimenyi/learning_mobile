<template>
  <ion-page>
    <ion-content :fullscreen="true" class="app-screen">
      <div class="screen-shell">
        <section v-if="course" class="reviews-shell">
          <div class="reviews-topbar">
            <button class="reviews-back-btn" @click="$router.back()">
              <i class="fa-solid fa-arrow-left"></i>
            </button>
            <div class="reviews-topbar__copy">
              <span class="section-kicker">{{ t('learnerReviews') }}</span>
              <h1>{{ course.title }}</h1>
            </div>
          </div>

          <section class="surface-card review-hero">
            <div class="review-hero__rating">
              <span class="section-kicker">{{ t('learnerFeedback') }}</span>
              <div class="rating-display">
                <span class="rating-value">{{ averageRating }}</span>
                <span class="rating-out-of">/5</span>
              </div>
              <div class="rating-stars">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
              </div>
            </div>
            <div class="review-hero__meta">
              <span class="rating-chip"><i class="fa-solid fa-star"></i>{{ reviews.length }} ratings</span>
              <span class="category-pill">{{ course.category }}</span>
            </div>
          </section>

          <section class="surface-card review-form-card">
            <div class="review-form__header">
              <span class="section-kicker">{{ t('shareThoughts') }}</span>
              <h3>{{ t('rateThisCourse') }}</h3>
            </div>

            <label class="input-block">
              <span>{{ t('yourName') }}</span>
              <input
                v-model="reviewForm.authorName"
                type="text"
                :placeholder="t('namePlaceholder')"
              />
            </label>

            <div class="rating-picker">
              <button
                v-for="rating in [5, 4, 3, 2, 1]"
                :key="rating"
                class="rating-picker__button"
                :class="{ 'is-active': reviewForm.rating >= rating }"
                @click="reviewForm.rating = rating"
              >
                <i class="fa-solid fa-star"></i>
              </button>
            </div>

            <label class="input-block">
              <span>{{ t('yourReview') }}</span>
              <textarea
                v-model="reviewForm.text"
                rows="4"
                :placeholder="t('courseReviewPlaceholder')"
              ></textarea>
            </label>

            <button class="primary-button post-review-btn" @click="submitReview">
              <span>{{ t('postReview') }}</span>
            </button>
          </section>

          <section class="reviews-list">
            <article
              v-for="review in reviews"
              :key="review.id"
              class="surface-card review-card"
            >
              <div class="review-card__header">
                <div class="review-card__author">
                  <img :src="review.avatar || fallbackAvatar(review.authorName)" :alt="review.authorName" />
                  <div>
                    <strong>{{ review.authorName }}</strong>
                    <small>{{ review.date || 'Recent review' }}</small>
                  </div>
                </div>
                <span class="rating-chip">
                  <i class="fa-solid fa-star"></i>
                  {{ review.rating }}/5
                </span>
              </div>

              <p class="review-card__text">{{ review.text }}</p>

              <div class="review-card__actions">
                <button class="ghost-button like-btn" @click="handleLikeReview(review)">
                  <i class="fa-regular fa-heart"></i>
                  <span>{{ review.likes }}</span>
                </button>
              </div>

              <article v-if="review.reply" class="teacher-reply-card">
                <strong>{{ review.reply.authorName || 'Teacher' }}</strong>
                <p>{{ review.reply.text }}</p>
              </article>

              <div class="reply-composer">
                <input
                  v-model="reviewReplies[review.id]"
                  type="text"
                  :placeholder="t('writeReply')"
                />
                <button class="primary-button post-review-btn reply-post-btn" @click="submitReviewReply(review)">
                  <span>{{ t('post') }}</span>
                </button>
              </div>
            </article>

            <article v-if="!reviews.length" class="empty-card">
              <div class="empty-icon"><i class="fa-regular fa-star"></i></div>
              <strong>{{ t('noReviewsShort') }}</strong>
              <p>{{ t('firstToRate') }}</p>
            </article>
          </section>
        </section>
      </div>
    </ion-content>
  </ion-page>
</template>

<script>
import { translate } from '@/services/i18n';
import { IonContent, IonPage } from '@ionic/vue';
import { useRoute } from 'vue-router';
import { ref, computed, onMounted } from 'vue';
import {
  createReview,
  getCourse,
  getCurrentUser,
  getReviews,
  likeReview,
  respondToReview,
} from '@/services/api';

export default {
  name: 'CourseReviewsPage',
  components: { IonContent, IonPage },
  props: ['id'],
  setup(props) {
    const route = useRoute();

    const course = ref(null);
    const user = ref(null);
    const reviews = ref([]);
    const reviewReplies = ref({});
    const reviewForm = ref({ authorName: '', rating: 5, text: '' });

    const averageRating = computed(() => {
      if (!reviews.value.length) return '0.0';
      const total = reviews.value.reduce((sum, r) => sum + Number(r.rating || 0), 0);
      return (total / reviews.value.length).toFixed(1);
    });

    onMounted(async () => {
      try {
        const [c, u, r] = await Promise.all([
          getCourse(props.id),
          getCurrentUser(),
          getReviews(props.id),
        ]);
        course.value = c;
        user.value = u;
        reviews.value = r || [];
        reviewForm.value.authorName = u?.name || '';
      } catch (e) {
        console.error(translate('failedLoadReviews'), e);
      }
    });

    const fallbackAvatar = (name) => {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=312e81&color=fff&size=200`;
    };

    const submitReview = async () => {
      if (!reviewForm.value.text.trim()) return;
      try {
        const review = await createReview({
          courseId: course.value?.id || props.id,
          author_id: user.value?.id || '',
          authorName: reviewForm.value.authorName || user.value?.name || translate('student'),
          avatar: user.value?.avatar || '',
          rating: reviewForm.value.rating,
          text: reviewForm.value.text.trim(),
        });
        reviews.value = [review, ...reviews.value];
        reviewForm.value.text = '';
        reviewForm.value.rating = 5;
      } catch (e) {
        console.error(translate('failedSubmitReview'), e);
      }
    };

    const handleLikeReview = async (review) => {
      try {
        const updated = await likeReview(review.id);
        reviews.value = reviews.value.map((item) => (item.id === updated.id ? updated : item));
      } catch (e) {
        console.error(translate('failedLikeReview'), e);
      }
    };

    const submitReviewReply = async (review) => {
      const text = (reviewReplies.value[review.id] || '').trim();
      if (!text) return;
      try {
        const updated = await respondToReview(review.id, text);
        reviews.value = reviews.value.map((item) => (item.id === updated.id ? updated : item));
        reviewReplies.value[review.id] = '';
      } catch (e) {
        console.error(translate('failedSubmitReply'), e);
      }
    };

    return {
      course,
      user,
      reviews,
      reviewReplies,
      reviewForm,
      averageRating,
      fallbackAvatar,
      submitReview,
      handleLikeReview,
      submitReviewReply,
    };
  },
};
</script>

<style scoped>
.reviews-shell {
  display: grid;
  gap: 18px;
}

.reviews-topbar {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--surface);
  padding: 12px 16px;
  border-radius: var(--radius-xl);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
}

.reviews-back-btn {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--text-main);
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 1rem;
  transition: all var(--transition-fast);
}

.reviews-back-btn:hover {
  background: var(--brand-soft);
  color: var(--brand);
}

.reviews-topbar__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reviews-topbar__copy h1 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.3;
}

.review-hero {
  padding: 24px;
  border-radius: var(--radius-2xl);
  background: var(--brand-hero-gradient);
  color: #ffffff;
  box-shadow: 0 20px 48px -10px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.review-hero__rating {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.review-hero__rating .section-kicker {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #a5b4fc;
}

.rating-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.rating-value {
  font-family: 'Outfit', sans-serif;
  font-size: 3.2rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1;
}

.rating-out-of {
  font-size: 1.2rem;
  color: rgba(226, 232, 240, 0.75);
}

.rating-stars {
  display: flex;
  gap: 4px;
  color: #f59e0b;
}

.rating-stars i {
  font-size: 1.15rem;
}

.review-hero__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.category-pill {
  font-size: 0.74rem;
  font-weight: 700;
  color: #ffffff;
  background: rgba(255, 255, 255, 0.15);
  padding: 5px 12px;
  border-radius: var(--radius-full);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.review-form-card {
  padding: 22px;
  border-radius: var(--radius-2xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
}

.review-form__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 16px;
}

.review-form__header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
}

.input-block {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
}

.input-block span {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.input-block input,
.input-block textarea {
  width: 100%;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--text-main);
  outline: none;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all var(--transition-fast);
}

.input-block input:focus,
.input-block textarea:focus {
  background: var(--surface);
  border-color: var(--brand-light);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.rating-picker {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.rating-picker__button {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--text-subtle);
  cursor: pointer;
  font-size: 1.2rem;
  transition: all var(--transition-fast);
  display: grid;
  place-items: center;
}

.rating-picker__button.is-active {
  background: #fffbeb;
  border-color: #fde68a;
  color: #f59e0b;
  transform: scale(1.05);
}

.post-review-btn {
  width: 100%;
  padding: 13px;
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
}

.reviews-list {
  display: grid;
  gap: 14px;
}

.review-card {
  padding: 18px;
  border-radius: var(--radius-xl);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-card);
  transition: all var(--transition-normal);
}

.review-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-float);
  border-color: rgba(99, 102, 241, 0.3);
}

.review-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.review-card__author {
  display: flex;
  align-items: center;
  gap: 10px;
}

.review-card__author img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.review-card__author div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.review-card__author strong {
  font-size: 0.92rem;
  color: var(--text-main);
}

.review-card__author small {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.review-card__text {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.55;
}

.review-card__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.like-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-full);
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.like-btn:hover {
  background: #fff1f2;
  border-color: #fecdd3;
  color: #e11d48;
}

.like-btn i {
  color: #ef4444;
  font-size: 0.85rem;
}

.teacher-reply-card {
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--brand-soft);
  border: 1px solid rgba(99, 102, 241, 0.2);
  margin-top: 12px;
}

.teacher-reply-card strong {
  font-size: 0.82rem;
  color: var(--brand-deep);
  font-weight: 700;
}

.teacher-reply-card p {
  margin: 4px 0 0 0;
  font-size: 0.84rem;
  color: var(--text-secondary);
  line-height: 1.45;
}

.reply-composer {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.reply-composer input {
  flex: 1;
  padding: 9px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--text-main);
  font-size: 0.84rem;
  outline: none;
}

.reply-composer input:focus {
  background: var(--surface);
  border-color: var(--brand-light);
}

.reply-post-btn {
  padding: 9px 16px;
  border-radius: var(--radius-md);
  font-size: 0.82rem;
  white-space: nowrap;
}

@media (max-width: 540px) {
  .review-hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .review-hero__meta {
    align-items: flex-start;
  }
}
</style>
