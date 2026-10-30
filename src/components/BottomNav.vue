<template>
  <nav class="bottom-nav" aria-label="Main Navigation">
    <RouterLink
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="bottom-nav__item"
      :class="{ 'is-active': isActive(item.to) }"
    >
      <span class="bottom-nav__icon">
        <i :class="item.icon"></i>
      </span>
      <span class="bottom-nav__label">{{ item.label }}</span>
      <span v-if="isActive(item.to)" class="bottom-nav__dot"></span>
    </RouterLink>
  </nav>
</template>

<script>
export default {
  name: 'BottomNav',
  data() {
    return {
      items: [
        { to: '/home', label: 'Home', icon: 'fa-solid fa-house' },
        { to: '/discover', label: 'Explore', icon: 'fa-solid fa-compass' },
        { to: '/my-learning', label: 'My Learning', icon: 'fa-solid fa-graduation-cap' },
        { to: '/profile', label: 'Profile', icon: 'fa-solid fa-user' },
      ],
    };
  },
  methods: {
    isActive(path) {
      if (path === '/home') {
        return this.$route.path === '/home' || this.$route.path === '/';
      }
      return this.$route.path.startsWith(path);
    },
  },
};
</script>
