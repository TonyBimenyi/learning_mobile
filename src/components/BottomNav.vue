<template>
  <nav class="bottom-nav" :style="{ '--nav-index': activeIndex }" aria-label="Main Navigation">
    <!-- Sliding gradient capsule behind the active tab -->
    <span class="bottom-nav__slider" aria-hidden="true">
      <span class="bottom-nav__slider-sheen"></span>
    </span>

    <RouterLink
      v-for="(item, index) in items"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__item"
      :class="{ 'is-active': activeIndex === index }"
      @click="pulse = index"
    >
      <span class="bottom-nav__icon">
        <i :class="item.icon"></i>
        <span v-if="pulse === index" class="bottom-nav__ripple" :key="pulse"></span>
      </span>
      <span class="bottom-nav__label">{{ t(item.label) }}</span>
      <span v-if="activeIndex === index" class="bottom-nav__dot"></span>
    </RouterLink>
  </nav>
</template>

<script>
export default {
  name: 'BottomNav',
  data() {
    return {
      pulse: -1,
      items: [
        { to: '/home', label: 'navHome', icon: 'fa-solid fa-house' },
        { to: '/discover', label: 'navExplore', icon: 'fa-solid fa-compass' },
        { to: '/my-learning', label: 'navMyLearning', icon: 'fa-solid fa-graduation-cap' },
        { to: '/profile', label: 'navProfile', icon: 'fa-solid fa-user' },
      ],
    };
  },
  computed: {
    activeIndex() {
      const path = this.$route.path;
      let idx = this.items.findIndex((item) => {
        if (item.to === '/home') return path === '/home' || path === '/';
        return path.startsWith(item.to);
      });
      if (idx < 0) idx = 0;
      return idx;
    },
  },
};
</script>
