<!--
  依赖注入Provider
  为整个应用提供DI容器
-->
<template>
  <slot />
</template>

<script setup lang="ts">
import { provide, onMounted, onUnmounted } from 'vue';
import { container, configureContainer, cleanupContainer } from '../di';

// 提供DI容器给子组件
provide('diContainer', container);

// 生命周期管理
onMounted(() => {
  // 配置依赖注入容器
  configureContainer();
  
  if (import.meta.env.DEV) {
    console.log('✅ DependencyInjectionProvider 已挂载');
  }
});

onUnmounted(() => {
  // 清理容器
  cleanupContainer();
  
  if (import.meta.env.DEV) {
    console.log('🧹 DependencyInjectionProvider 已卸载');
  }
});

// 组件元信息
defineOptions({
  name: 'DependencyInjectionProvider'
});
</script>