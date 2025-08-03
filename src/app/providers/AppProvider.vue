<!--
  应用级Provider
  包装所有全局Provider
-->
<template>
  <DependencyInjectionProvider>
    <RouterProvider>
      <ThemeProvider>
        <ErrorBoundaryProvider>
          <slot />
        </ErrorBoundaryProvider>
      </ThemeProvider>
    </RouterProvider>
  </DependencyInjectionProvider>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import DependencyInjectionProvider from './DependencyInjectionProvider.vue';
import RouterProvider from './RouterProvider.vue';
import ThemeProvider from './ThemeProvider.vue';
import ErrorBoundaryProvider from './ErrorBoundaryProvider.vue';

onMounted(() => {
  if (import.meta.env.DEV) {
    console.log('🚀 AppProvider 已挂载 - 应用初始化完成');
  }
});

// 组件元信息
defineOptions({
  name: 'AppProvider'
});
</script>