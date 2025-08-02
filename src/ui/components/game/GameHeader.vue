<!--
  GameHeader 组件
  从 GameView.vue 拆分出来的游戏头部区域
  包含：周次显示、进度条、菜单按钮、通知系统
-->
<template>
  <div class="game-header-container">
    <!-- 顶部信息栏 -->
    <header class="game-header">
      <div class="left-info">
        <div class="week-indicator">
          <div class="week-label">{{ $t('game.week') }}</div>
          <div class="week-value">{{ currentWeek }}{{ isEndlessMode ? ' / ∞' : ' / ' + maxWeeks }}</div>
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${gameProgress}%` }"></div>
          </div>
        </div>
      </div>

      <div class="right-info">
        <button class="menu-button" @click="$emit('showGameMenu')">
          <span class="menu-icon">≡</span>
          <span class="menu-text">{{ $t('game.menu') }}</span>
        </button>
      </div>
    </header>

    <!-- 通知区域 -->
    <div class="notifications-container">
      <transition-group name="notification">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification"
          :class="notification.type"
        >
          <div class="notification-content">
            {{ notification.message }}
          </div>
          <button class="close-btn" @click="$emit('dismissNotification', notification.id)">×</button>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  currentWeek: number;
  maxWeeks: number;
  isEndlessMode?: boolean;
  notifications: Array<{
    id: string;
    type: string;
    message: string;
  }>;
}

interface Emits {
  (e: 'showGameMenu'): void;
  (e: 'dismissNotification', id: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 计算游戏进度
const gameProgress = computed(() => {
  if (props.isEndlessMode) return 100;
  return Math.round((props.currentWeek / props.maxWeeks) * 100);
});
</script>

<style scoped>
.game-header-container {
  position: relative;
  z-index: 100;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-radius: 0 0 16px 16px;
}

.left-info {
  display: flex;
  align-items: center;
}

.week-indicator {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.week-label {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-bottom: 2px;
}

.week-value {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.progress-bar {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #81C784);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.right-info {
  display: flex;
  align-items: center;
}

.menu-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.menu-button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.menu-icon {
  font-size: 1.2rem;
  font-weight: bold;
}

.menu-text {
  font-size: 0.9rem;
}

/* 通知系统样式 */
.notifications-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  max-width: 350px;
}

.notification {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  backdrop-filter: blur(10px);
  border-left: 4px solid transparent;
}

.notification.info {
  background: rgba(33, 150, 243, 0.9);
  border-left-color: #2196F3;
  color: white;
}

.notification.success {
  background: rgba(76, 175, 80, 0.9);
  border-left-color: #4CAF50;
  color: white;
}

.notification.warning {
  background: rgba(255, 193, 7, 0.9);
  border-left-color: #FFC107;
  color: #333;
}

.notification.error {
  background: rgba(244, 67, 54, 0.9);
  border-left-color: #F44336;
  color: white;
}

.notification-content {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.4;
}

.close-btn {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px;
  margin-left: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 通知动画 */
.notification-enter-active {
  transition: all 0.4s ease;
}

.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>