<template>
  <div class="card-skeleton">
    <SkeletonLoader type="rect" :width="'100%'" :height="'150px'" :rounded="true" />
    <div class="skeleton-texts">
      <SkeletonLoader type="text" :width="'70%'" :height="'16px'" />
      <SkeletonLoader type="text" :width="'50%'" :height="'16px'" />
    </div>
  </div>
</template>

<script>
import SkeletonLoader from '@/components/SkeletonLoader.vue';
export default {
  name: 'CardSkeleton',
  components: { SkeletonLoader },
};
</script>

<style scoped>
.card-skeleton {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.skeleton-texts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
}
</style>
