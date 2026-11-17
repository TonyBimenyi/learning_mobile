<template>
  <nav class="bottom-nav" aria-label="Main Navigation">
    <RouterLink
      v-for="(item, index) in items"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__item"
      :class="{ 'is-active': activeIndex === index }"
    >
      <span class="bottom-nav__icon">
        <i :class="item.icon"></i>
      </span>
      <span class="bottom-nav__label">{{ t(item.label) }}</span>
      <span v-if="activeIndex === index" class="bottom-nav__indicator"></span>
    </RouterLink>
  </nav>
</template>

<script>
export default {
  name: 'BottomNav',
  data() {
    return {
      items: [
        { to: '/home', label: 'navHome', icon: 'fa-solid fa-house' },
        { to: '/discover', label: 'navExplore', icon: 'fa-solid fa-compass' },
        { to: '/my-learning', label: 'navMyLearning', icon: 'fa-solid fa-graduation-cap' },
        { to: '/downloads', label: 'downloads', icon: 'fa-solid fa-download' },
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
