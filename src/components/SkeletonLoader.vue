<template>
  <div
    :class="['skeleton-block', `skeleton-block--${type}`, { 'skeleton-block--rounded': rounded }]"
    :style="style"
    aria-hidden="true"
  />
</template>

<script>
export default {
  name: 'SkeletonLoader',
  props: {
    type: { type: String, default: 'rect' }, // rect | circle | text
    width: { type: String, default: '100%' },
    height: { type: String, default: '16px' },
    rounded: { type: Boolean, default: false },
  },
  computed: {
    style() {
      return { width: this.width, height: this.height };
    },
  },
};
</script>

<style>
@keyframes skeleton-shimmer {
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
}
</style>

<style scoped>
.skeleton-block {
  display: block;
  border-radius: 8px;
  background: linear-gradient(
    90deg,
    var(--skeleton-base, rgba(148,163,184,0.18)) 25%,
    var(--skeleton-shine, rgba(203,213,225,0.36)) 50%,
    var(--skeleton-base, rgba(148,163,184,0.18)) 75%
  );
  background-size: 1200px 100%;
  animation: skeleton-shimmer 1.6s ease-in-out infinite;
  flex-shrink: 0;
}
.skeleton-block--circle { border-radius: 50%; }
.skeleton-block--text   { border-radius: 6px; }
.skeleton-block--rounded { border-radius: 16px; }
</style>
