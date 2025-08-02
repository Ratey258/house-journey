<!--
  GameModals 组件
  从 GameView.vue 拆分出来的所有模态框和对话框
  包含：事件模态框、游戏菜单、保存对话框、游戏结束对话框、交易提示
-->
<template>
  <div class="game-modals">
    <!-- 事件模态框 -->
    <EventModal ref="eventModal" />

    <!-- 游戏菜单对话框 -->
    <transition name="fade">
      <div v-if="showMenu" class="dialog-overlay" @click.self="$emit('hideGameMenu')">
        <transition name="zoom-bounce">
          <div class="dialog game-menu-dialog">
            <h2 class="dialog-title">{{ $t('gameMenu.title') }}</h2>
            <div class="menu-options">
              <transition-group name="menu-item">
                <button class="menu-option" @click="$emit('saveGame')" key="save">
                  <span class="menu-icon">💾</span>
                  {{ $t('gameMenu.save') }}
                </button>
                <button class="menu-option" @click="$emit('goToMainMenu')" key="main">
                  <span class="menu-icon">🏠</span>
                  {{ $t('gameMenu.mainMenu') }}
                </button>
                <button class="menu-option" @click="$emit('hideGameMenu')" key="continue">
                  <span class="menu-icon">▶️</span>
                  {{ $t('gameMenu.continue') }}
                </button>
              </transition-group>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 保存游戏对话框 -->
    <transition name="fade">
      <div v-if="showSaveDialog" class="dialog-overlay" @click.self="$emit('cancelSave')">
        <transition name="slide-up">
          <div class="dialog save-dialog">
            <h2 class="dialog-title">{{ $t('saveDialog.title') }}</h2>
            <div class="save-form">
              <input
                :value="saveName"
                @input="$emit('updateSaveName', $event.target.value)"
                type="text"
                class="save-input"
                :placeholder="$t('saveDialog.namePlaceholder')"
                ref="saveInput"
                @keyup.enter="$emit('confirmSave')"
              />
              <div class="dialog-buttons">
                <button 
                  class="dialog-button confirm" 
                  @click="$emit('confirmSave')" 
                  :disabled="!saveName"
                >
                  {{ $t('common.confirm') }}
                </button>
                <button class="dialog-button cancel" @click="$emit('cancelSave')">
                  {{ $t('common.cancel') }}
                </button>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 游戏结束对话框 -->
    <transition name="fade">
      <div v-if="gameOver && showGameOverDialog" class="dialog-overlay game-over-overlay">
        <transition name="scale-bounce">
          <GameOverView
            :gameState="gameState"
            :player="player"
            :gameStats="gameStats"
            @return-to-main="$emit('goToMainMenu')"
            @restart-game="$emit('restartGame')"
            @continue-game="$emit('continueFromVictory')"
          />
        </transition>
      </div>
    </transition>

    <!-- 交易Toast提示 -->
    <transition name="fade">
      <div 
        v-if="showTransactionToast" 
        class="transaction-toast" 
        :class="transactionToastClass"
      >
        <div class="toast-content">
          <span class="toast-icon">{{ transactionToastIcon }}</span>
          <span class="toast-message">{{ transactionToastMessage }}</span>
        </div>
        <div class="toast-progress-bar"></div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import EventModal from '../common/EventModal.vue';
import GameOverView from '../../views/GameOverView.vue';

interface Props {
  showMenu: boolean;
  showSaveDialog: boolean;
  showGameOverDialog: boolean;
  gameOver: boolean;
  saveName: string;
  gameState: any;
  player: any;
  gameStats: any;
  showTransactionToast: boolean;
  transactionToastClass: string;
  transactionToastIcon: string;
  transactionToastMessage: string;
}

interface Emits {
  (e: 'hideGameMenu'): void;
  (e: 'saveGame'): void;
  (e: 'goToMainMenu'): void;
  (e: 'cancelSave'): void;
  (e: 'confirmSave'): void;
  (e: 'updateSaveName', value: string): void;
  (e: 'restartGame'): void;
  (e: 'continueFromVictory'): void;
}

defineProps<Props>();
defineEmits<Emits>();

const eventModal = ref();

// 暴露事件模态框方法
defineExpose({
  showEventModal: (event: any) => eventModal.value?.showEvent(event)
});
</script>

<style scoped>
.game-modals {
  position: relative;
  z-index: 1000;
}

/* 对话框覆盖层 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.game-over-overlay {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
}

/* 对话框基础样式 */
.dialog {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  min-width: 300px;
  max-width: 500px;
  width: 90%;
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin: 0 0 24px 0;
  text-align: center;
}

/* 游戏菜单样式 */
.game-menu-dialog {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.game-menu-dialog .dialog-title {
  color: white;
}

.menu-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.menu-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-option:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}

.menu-icon {
  font-size: 1.2rem;
}

/* 保存对话框样式 */
.save-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.save-input {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.save-input:focus {
  outline: none;
  border-color: #667eea;
}

.dialog-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.dialog-button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dialog-button.confirm {
  background: #667eea;
  color: white;
}

.dialog-button.confirm:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-1px);
}

.dialog-button.confirm:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.dialog-button.cancel {
  background: #f5f5f5;
  color: #666;
}

.dialog-button.cancel:hover {
  background: #e0e0e0;
}

/* 交易Toast样式 */
.transaction-toast {
  position: fixed;
  top: 100px;
  right: 20px;
  z-index: 2000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  min-width: 300px;
  max-width: 400px;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
}

.toast-icon {
  font-size: 1.5rem;
}

.toast-message {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.4;
}

.toast-progress-bar {
  height: 3px;
  background: currentColor;
  opacity: 0.3;
  animation: progress-bar 3s linear forwards;
}

@keyframes progress-bar {
  from { width: 100%; }
  to { width: 0%; }
}

/* Toast颜色变化 */
.transaction-toast.success {
  border-left: 4px solid #4CAF50;
  color: #2E7D2E;
}

.transaction-toast.error {
  border-left: 4px solid #F44336;
  color: #C62828;
}

.transaction-toast.info {
  border-left: 4px solid #2196F3;
  color: #1565C0;
}

.transaction-toast.warning {
  border-left: 4px solid #FF9800;
  color: #E65100;
}

/* 动画效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.zoom-bounce-enter-active {
  animation: zoom-bounce 0.5s ease;
}

.zoom-bounce-leave-active {
  animation: zoom-bounce 0.3s reverse ease;
}

@keyframes zoom-bounce {
  0% {
    transform: scale(0) rotate(-360deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.1) rotate(-180deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.slide-up-enter-active, .slide-up-leave-active {
  transition: all 0.4s ease;
}

.slide-up-enter-from {
  transform: translateY(100px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-100px);
  opacity: 0;
}

.scale-bounce-enter-active {
  animation: scale-bounce 0.6s ease;
}

.scale-bounce-leave-active {
  animation: scale-bounce 0.4s reverse ease;
}

@keyframes scale-bounce {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.menu-item-enter-active {
  transition: all 0.3s ease;
  transition-delay: calc(var(--i) * 0.1s);
}

.menu-item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dialog {
    padding: 24px;
    margin: 20px;
  }
  
  .transaction-toast {
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }
}
</style>