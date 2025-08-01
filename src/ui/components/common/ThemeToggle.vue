<!--
  智能主题切换组件
  支持亮色/暗色/自动三种模式的切换
  提供简洁美观的用户界面
-->

<template>
  <div class="theme-toggle">
    <!-- 主题切换按钮 -->
    <button
      class="theme-button"
      :class="{ 'active': isMenuOpen }"
      @click="toggleMenu"
      :title="`当前主题: ${getThemeDisplayName()}`"
    >
      <span class="theme-icon">{{ getThemeIcon() }}</span>
      <span class="theme-label">{{ getThemeDisplayName() }}</span>
      <span class="dropdown-arrow" :class="{ 'rotated': isMenuOpen }">▼</span>
    </button>

    <!-- 主题选择菜单 -->
    <Transition name="theme-menu">
      <div v-if="isMenuOpen" class="theme-menu" @click.stop>
        <div
          v-for="option in themeOptions"
          :key="option.value"
          class="theme-option"
          :class="{
            'active': themeConfig.theme === option.value,
            'current': themeConfig.effectiveTheme === option.effective
          }"
          @click="selectTheme(option.value)"
        >
          <span class="option-icon">{{ option.icon }}</span>
          <div class="option-content">
            <span class="option-label">{{ option.label }}</span>
            <span class="option-description">{{ option.description }}</span>
          </div>
          <span v-if="themeConfig.theme === option.value" class="check-mark">✓</span>
        </div>
      </div>
    </Transition>

    <!-- 点击外部关闭菜单 -->
    <div
      v-if="isMenuOpen"
      class="theme-overlay"
      @click="closeMenu"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useTheme } from '../../composables/useTheme';

// 组件属性
defineProps<{
  compact?: boolean; // 紧凑模式，只显示图标
  showLabel?: boolean; // 是否显示标签，默认true
}>();

// 主题系统
const {
  themeConfig,
  setTheme,
  getThemeDisplayName,
  getThemeIcon,
  initTheme
} = useTheme();

// 菜单状态
const isMenuOpen = ref(false);

// 主题选项配置
const themeOptions = computed(() => [
  {
    value: 'light' as const,
    label: '亮色主题',
    description: '经典的亮色界面',
    icon: '☀️',
    effective: 'light' as const
  },
  {
    value: 'dark' as const,
    label: '暗色主题',
    description: '护眼的暗色界面',
    icon: '🌙',
    effective: 'dark' as const
  },
  {
    value: 'auto' as const,
    label: '跟随系统',
    description: '自动跟随系统主题',
    icon: '🔄',
    effective: themeConfig.value.systemPrefersDark ? 'dark' : 'light'
  }
]);

// 方法
function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

function selectTheme(theme: 'light' | 'dark' | 'auto') {
  setTheme(theme);
  closeMenu();
}

// 键盘事件处理
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && isMenuOpen.value) {
    closeMenu();
  }
}

// 生命周期
onMounted(() => {
  initTheme();
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
});
</script>

<style scoped>
.theme-toggle {
  position: relative;
  display: inline-block;
}

.theme-button {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all var(--transition-fast) var(--ease-default);
  font-size: var(--font-size-sm);
  min-width: 120px;
}

.theme-button:hover {
  background-color: var(--color-bg-tertiary);
  border-color: var(--color-brand-blue);
}

.theme-button.active {
  background-color: var(--color-brand-blue);
  color: var(--color-text-inverse);
  border-color: var(--color-brand-blue);
}

.theme-icon {
  font-size: var(--font-size-md);
  line-height: 1;
}

.theme-label {
  flex: 1;
  text-align: left;
  font-weight: var(--font-weight-medium);
}

.dropdown-arrow {
  font-size: var(--font-size-xs);
  transition: transform var(--transition-fast) var(--ease-default);
  margin-left: var(--space-1);
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

/* 主题菜单 */
.theme-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--space-1);
  background-color: var(--color-surface-elevated);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-index-dropdown);
  overflow: hidden;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  cursor: pointer;
  transition: background-color var(--transition-fast) var(--ease-default);
  border-bottom: 1px solid var(--color-border-secondary);
}

.theme-option:last-child {
  border-bottom: none;
}

.theme-option:hover {
  background-color: var(--color-bg-tertiary);
}

.theme-option.active {
  background-color: rgba(52, 152, 219, 0.1);
  color: var(--color-brand-blue);
}

.theme-option.current:not(.active) {
  background-color: rgba(52, 152, 219, 0.05);
}

.option-icon {
  font-size: var(--font-size-lg);
  line-height: 1;
  width: 24px;
  text-align: center;
}

.option-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.option-label {
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.option-description {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  line-height: var(--line-height-tight);
}

.check-mark {
  color: var(--color-brand-blue);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-md);
}

/* 遮罩层 */
.theme-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-index-base);
}

/* 动画 */
.theme-menu-enter-active,
.theme-menu-leave-active {
  transition: all var(--transition-normal) var(--ease-default);
  transform-origin: top;
}

.theme-menu-enter-from,
.theme-menu-leave-to {
  opacity: 0;
  transform: scaleY(0.8) translateY(-8px);
}

.theme-menu-enter-to,
.theme-menu-leave-from {
  opacity: 1;
  transform: scaleY(1) translateY(0);
}

/* 紧凑模式 */
.theme-toggle.compact .theme-button {
  min-width: auto;
  padding: var(--space-2);
}

.theme-toggle.compact .theme-label,
.theme-toggle.compact .dropdown-arrow {
  display: none;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .theme-menu {
    position: fixed;
    top: auto;
    bottom: 80px;
    left: var(--space-4);
    right: var(--space-4);
    margin-top: 0;
    max-width: none;
  }

  .theme-option {
    padding: var(--space-4);
  }

  .option-icon {
    font-size: var(--font-size-xl);
    width: 32px;
  }
}

/* 暗色主题下的特殊调整 */
[data-theme="dark"] .theme-menu {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.8);
}

[data-theme="dark"] .theme-option.active {
  background-color: rgba(78, 179, 244, 0.15);
}

[data-theme="dark"] .theme-option.current:not(.active) {
  background-color: rgba(78, 179, 244, 0.08);
}
</style>
