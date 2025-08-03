<!--
  路由Provider
  提供Vue Router实例
-->
<template>
  <router-view v-slot="{ Component, route }">
    <transition
      name="page-transition"
      mode="out-in"
      appear
    >
      <component
        :is="Component"
        :key="route.path"
      />
    </transition>
  </router-view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

onMounted(() => {
  if (import.meta.env.DEV) {
    console.log('🛣️ RouterProvider 已挂载');
  }
});

// 组件元信息
defineOptions({
  name: 'RouterProvider'
});
</script>

<style scoped>
/* 页面切换动画 */
.page-transition-enter-active,
.page-transition-leave-active {
  transition: all 0.3s ease;
}

.page-transition-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.page-transition-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 禁用动画的情况 */
@media (prefers-reduced-motion: reduce) {
  .page-transition-enter-active,
  .page-transition-leave-active {
    transition: none;
  }
}
</style>