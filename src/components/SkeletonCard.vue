<template>
  <article class="skeleton-card">
    <div class="skeleton-thumb">
      <SkeletonLoader type="rect" width="100%" height="180px" />
    </div>
    <div class="skeleton-body">
      <SkeletonLoader type="text" width="70%" height="16px" rounded />
      <SkeletonLoader type="text" width="50%" height="14px" rounded />
    </div>
  </article>
</template>

<script>
import SkeletonLoader from './SkeletonLoader.vue';
export default { name: 'SkeletonCard', components: { SkeletonLoader } };
</script>

<style scoped>
.skeleton-card { display: flex; flex-direction: column; gap: 8px; }
.skeleton-thumb { border-radius: var(--radius-md); overflow: hidden; }
.skeleton-body { display: flex; flex-direction: column; gap: 4px; }
</style>
