import { createRouter, createWebHistory } from 'vue-router';
import { getToken } from '@/services/storage';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/home' },
    { path: '/login', name: 'login', component: () => import('@/pages/LoginPage.vue') },
    // Open to everyone — usable even while logged out.
    { path: '/settings', name: 'settings', component: () => import('@/pages/SettingsPage.vue') },
    { path: '/home', name: 'home', component: () => import('@/pages/HomePage.vue') },
    { path: '/discover', name: 'discover', component: () => import('@/pages/DiscoverPage.vue') },
    { path: '/my-learning', name: 'my-learning', component: () => import('@/pages/MyLearningPage.vue') },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/pages/ProfilePage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/downloads',
      name: 'downloads',
      component: () => import('@/pages/DownloadsPage.vue'),
    },
    {
      path: '/course/:id',
      name: 'course-details',
      component: () => import('@/pages/CourseDetailsPage.vue'),
      props: true,
    },
    {
      path: '/course/:id/reviews',
      name: 'course-reviews',
      component: () => import('@/pages/CourseReviewsPage.vue'),
      props: true,
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  const hasToken = Boolean(getToken());
  if (to.meta.requiresAuth && !hasToken) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    };
  }
  // Only bounce an already-logged-in user away from the bare /login page.
  // If a redirect target was supplied (e.g. /profile asked for login because a
  // session expired), honour it — otherwise we create a profile↔login loop.
  if (to.name === 'login' && hasToken && !to.query.redirect) {
    return { name: 'profile' };
  }
  return true;
});

export default router;
