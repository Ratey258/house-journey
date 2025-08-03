<!--
  主题Provider
  管理应用主题
-->
<template>
  <div :class="themeClasses">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';

// 主题状态
const theme = ref<'light' | 'dark' | 'auto'>('auto');
const systemTheme = ref<'light' | 'dark'>('light');

// 计算当前生效的主题
const effectiveTheme = computed(() => {
  if (theme.value === 'auto') {
    return systemTheme.value;
  }
  return theme.value;
});

// 主题类名
const themeClasses = computed(() => [
  'theme-provider',
  `theme-${effectiveTheme.value}`
]);

// 检测系统主题
const detectSystemTheme = () => {
  if (window.matchMedia) {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    systemTheme.value = isDark ? 'dark' : 'light';
  }
};

// 监听系统主题变化
const setupSystemThemeListener = () => {
  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', detectSystemTheme);
    
    // 返回清理函数
    return () => {
      mediaQuery.removeEventListener('change', detectSystemTheme);
    };
  }
  return () => {};
};

// 加载保存的主题设置
const loadThemeSettings = () => {
  try {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      theme.value = savedTheme as 'light' | 'dark' | 'auto';
    }
  } catch (error) {
    console.warn('Failed to load theme settings:', error);
  }
};

// 保存主题设置
const saveThemeSettings = () => {
  try {
    localStorage.setItem('app-theme', theme.value);
  } catch (error) {
    console.warn('Failed to save theme settings:', error);
  }
};

// 设置主题
const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
  theme.value = newTheme;
  saveThemeSettings();
};

// 切换主题
const toggleTheme = () => {
  const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];
  const currentIndex = themes.indexOf(theme.value);
  const nextIndex = (currentIndex + 1) % themes.length;
  setTheme(themes[nextIndex]);
};

// 生命周期
onMounted(() => {
  // 检测系统主题
  detectSystemTheme();
  
  // 加载保存的设置
  loadThemeSettings();
  
  // 监听系统主题变化
  const cleanup = setupSystemThemeListener();
  
  if ((import.meta as any).env.DEV) {
    console.log('🎨 ThemeProvider 已挂载');
  }
  
  // 清理函数
  return cleanup;
});

// 监听主题变化，更新文档类名
watch(effectiveTheme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme);
  
  if ((import.meta as any).env.DEV) {
    console.log(`🎨 主题已切换到: ${newTheme}`);
  }
}, { immediate: true });

// 暴露方法给父组件
defineExpose({
  theme: computed(() => theme.value),
  effectiveTheme,
  setTheme,
  toggleTheme
});

// 组件元信息
defineOptions({
  name: 'ThemeProvider'
});
</script>

<style scoped>
.theme-provider {
  width: 100%;
  height: 100%;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* 主题相关的全局样式将通过CSS变量在全局样式文件中定义 */
</style>