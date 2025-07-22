<template>
  <div class="main-menu">
    <div class="menu-container">
      <div class="title-section">
        <h1 class="game-title">买房记</h1>
        <p class="game-version">v0.1.0</p>
      </div>

      <div class="menu-buttons">
        <button class="menu-button" @click="showNewGameDialog">新游戏</button>
        <button class="menu-button" @click="goToSaves">读取存档</button>
        <button class="menu-button" @click="showInDevelopmentToast('设置')">设置</button>
        <button class="menu-button" @click="showAboutDialog">关于</button>
        <button class="menu-button" @click="quitGame">退出游戏</button>

        <!-- 开发工具链接，仅在开发环境显示 -->
        <button v-if="isDev" class="menu-button dev-button" @click="goToDevTools">开发工具</button>
      </div>
    </div>

    <!-- 新游戏对话框 -->
    <transition name="dialog-fade">
      <div v-if="showDialog" class="dialog-overlay" @click.self="cancelNewGame">
        <transition name="dialog-zoom">
          <div class="dialog" v-if="showDialog">
            <h2 class="dialog-title animate-item">开始新游戏</h2>
        <div class="dialog-content">
              <div class="form-group animate-item">
            <label for="playerName">用户名：</label>
            <input
              type="text"
              id="playerName"
              v-model="playerName"
              placeholder="请输入用户名"
              maxlength="12"
              @keydown.enter="startNewGame"
            />
          </div>

              <div class="form-group animate-item">
            <label>选择难度：</label>
            <div class="difficulty-options">
              <label class="radio-label">
                <input type="radio" v-model="difficulty" value="easy" />
                简单
              </label>
              <label class="radio-label">
                <input type="radio" v-model="difficulty" value="standard" />
                标准
              </label>
              <label class="radio-label">
                <input type="radio" v-model="difficulty" value="hard" />
                困难
              </label>
            </div>
          </div>
        </div>

            <div class="dialog-actions animate-item">
          <button class="button primary" @click="startNewGame" :disabled="!playerName.trim() || isLoading">
            {{ isLoading ? '加载中...' : '开始游戏' }}
          </button>
          <button class="button" @click="cancelNewGame" :disabled="isLoading">取消</button>
        </div>
      </div>
        </transition>
    </div>
    </transition>

    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载游戏，请稍候...</p>
        <p class="loading-tip">{{ loadingTips[currentTipIndex] }}</p>
      </div>
    </div>

    <!-- 开发中提示弹窗 -->
    <div v-if="showDevToast" class="dialog-overlay" @click="closeDevToast">
      <div class="dev-toast" @click.stop>
        <div class="dev-toast-icon">🚧</div>
        <h3>功能开发中</h3>
        <p>{{ devToastMessage }}</p>
        <button class="button" @click="closeDevToast">确定</button>
      </div>
    </div>

    <!-- 关于对话框 -->
    <div v-if="showAbout" class="dialog-overlay" @click="closeAboutDialog">
      <div class="about-dialog" @click.stop>
        <div class="about-header">
          <h3>关于买房记</h3>
        </div>
        <div class="about-content">
          <div class="about-logo">买房记</div>
          <div class="about-version">版本：v0.1.0</div>
          <p>这是一款模拟房地产投资的经营策略游戏，玩家将在游戏中体验房产投资的乐趣与挑战。</p>

          <div class="about-history">
            <p>《买房记》原作是于2016推出的移动端游戏，您正游玩的是本作者根据其原作的创意进行重制的PC端游戏，本作者在2016接触到原作《买房记》时还在读小学，由于自己没有手机只能通过观看网上视频了解，但仍对当时幼小的我深有触动，直到大学阶段时仍不时勾起回忆。该作品是对原作的致敬，是对童年的回忆。</p>
          </div>

          <div class="about-credits">
            <h4>制作团队</h4>
            <p>开发者：春卷</p>
          </div>
        </div>
        <div class="about-actions">
          <button class="button" @click="closeAboutDialog">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameCoreStore } from '../../stores/gameCore';
import { usePlayerStore } from '../../stores/player';
import { useMarketStore } from '../../stores/market';
import { useEventStore } from '../../stores/events';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';

const router = useRouter();
const gameCore = useGameCoreStore();
const player = usePlayerStore();
const market = useMarketStore();
const events = useEventStore();

// 检查是否为开发环境
const isDev = import.meta.env.DEV;

// 新游戏对话框状态
const showDialog = ref(false);
const playerName = ref('');
const difficulty = ref('standard');
const isLoading = ref(false);
const currentTipIndex = ref(0);

// 开发中提示状态
const showDevToast = ref(false);
const devToastMessage = ref('');

// 关于对话框状态
const showAbout = ref(false);

// 加载提示
const loadingTips = [
  "正在准备市场数据...",
  "正在生成商品价格...",
  "正在初始化玩家数据...",
  "正在加载游戏界面...",
  "准备开始您的买房之旅..."
];

// 显示新游戏对话框
function showNewGameDialog() {
  showDialog.value = true;
}

// 显示开发中提示
function showInDevelopmentToast(feature) {
  devToastMessage.value = `${feature}功能正在开发中，敬请期待！`;
  showDevToast.value = true;
}

// 关闭开发中提示
function closeDevToast() {
  showDevToast.value = false;
}

// 显示关于对话框
function showAboutDialog() {
  showAbout.value = true;
}

// 关闭关于对话框
function closeAboutDialog() {
  showAbout.value = false;
}

// 开始新游戏
async function startNewGame() {
  try {
    // 显示加载状态
    isLoading.value = true;

    // 启动加载提示轮播
    startLoadingTips();

    // 确保玩家名有效，否则使用默认名称
    const finalPlayerName = playerName.value.trim() || '玩家';

    console.log('正在开始新游戏，玩家名称:', finalPlayerName, '难度:', difficulty.value);

    // 延迟一小段时间，让加载界面显示出来
    await new Promise(resolve => setTimeout(resolve, 100));

    // 重置游戏状态
    gameCore.currentWeek = 1;
    gameCore.gameStarted = true;
    gameCore.gamePaused = false;
    gameCore.gameOver = false;
    gameCore.victoryAchieved = false;
    gameCore.gameResult = null;
    gameCore.notifications = [];

    // 确保调用startNewGame方法来设置玩家名称，并等待其完成
    await gameCore.startNewGame(finalPlayerName);

    // 双重检查玩家名称已被设置
    if (!player.name) {
      player.name = finalPlayerName;
    }

    // 设置难度
    if (difficulty.value === 'hard') {
      // 困难模式
      player.money = 2000;
      player.debt = 5000;
    } else if (difficulty.value === 'easy') {
      // 简单模式
      player.money = 5000;
      player.debt = 2000;
    }

    // 保存玩家名称到本地存储
    localStorage.setItem('lastPlayerName', finalPlayerName);

    // 导航到游戏页面
    router.push('/game');
  } catch (error) {
    handleError(error, 'MainMenu (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('初始化游戏时出错:', error);
    // 显示错误提示
    alert('初始化游戏时出错: ' + error.message);
    isLoading.value = false;
  }
}

// 预加载数据
async function preloadData() {
  try {
    // 预加载一些可能的重资源
    const promises = [
      // 可以在这里添加一些预加载操作
      new Promise(resolve => setTimeout(resolve, 300)) // 模拟一些预加载时间
    ];

    await Promise.all(promises);
  } catch (error) {
    handleError(error, 'MainMenu (views)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
    console.warn('预加载数据时出错:', error);
  }
}

// 启动加载提示轮播
function startLoadingTips() {
  currentTipIndex.value = 0;
  const interval = setInterval(() => {
    currentTipIndex.value = (currentTipIndex.value + 1) % loadingTips.length;
    if (!isLoading.value) {
      clearInterval(interval);
    }
  }, 1500);
}

// 取消新游戏
function cancelNewGame() {
  if (!isLoading.value) {
    showDialog.value = false;
    playerName.value = '';
  }
}

// 跳转到存档页面
function goToSaves() {
  router.push('/saves');
}

// 跳转到设置页面 - 现在不再直接使用
function goToSettings() {
  router.push('/settings');
}

// 跳转到开发工具页面
function goToDevTools() {
  router.push('/dev-tools');
}

// 退出游戏
async function quitGame() {
  try {
    await window.electronAPI.quitApp();
  } catch (error) {
    handleError(error, 'MainMenu (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('Error quitting app:', error);
  }
}

// 组件挂载时，处理初始化逻辑
onMounted(() => {
  // 从本地存储中恢复上次使用的玩家名称
  const savedName = localStorage.getItem('lastPlayerName');
  if (savedName) {
    playerName.value = savedName;
  }

  // 检查是否有查询参数，决定是否自动执行操作
  const { action } = router.currentRoute.value.query;

  if (action === 'new-game') {
    // 延迟一点显示，等待页面完全加载
    setTimeout(() => {
      showNewGameDialog();
    }, 300);
  }
});
</script>

<style scoped>
.main-menu {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.menu-container {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 500px;
  padding: 40px;
  text-align: center;
}

.title-section {
  margin-bottom: 40px;
}

.game-title {
  font-size: 48px;
  font-weight: bold;
  margin: 0;
  color: #1a2a6c;
}

.game-version {
  font-size: 16px;
  color: #666;
  margin: 8px 0 0;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.menu-button {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 14px 20px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
}

.dev-button {
  margin-top: 20px;
  background-color: #9b59b6;
  font-size: 16px;
  padding: 10px 16px;
  position: relative;
}

.dev-button:hover {
  background-color: #8e44ad;
}

.dev-button::before {
  content: "DEV";
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: #e74c3c;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.dialog {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 400px;
  padding: 24px;
}

.dialog-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #1a2a6c;
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.difficulty-options {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.radio-label input {
  margin-right: 6px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.button {
  padding: 10px 16px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.button.primary {
  background-color: #3498db;
  color: white;
}

.button.primary:hover {
  background-color: #2980b9;
}

.button.primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.button:not(.primary) {
  background-color: #ecf0f1;
  color: #34495e;
}

.button:not(.primary):hover {
  background-color: #bdc3c7;
}

/* 加载指示器样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.loading-container {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(255, 255, 255, 0.2);
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: white;
  font-size: 20px;
  margin-bottom: 15px;
  text-align: center;
}

.loading-tip {
  color: #3498db;
  font-size: 16px;
  text-align: center;
  min-height: 20px;
}

/* 开发中提示样式 */
.dev-toast {
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  animation: toast-in 0.3s ease-out;
}

.dev-toast-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.dev-toast h3 {
  font-size: 20px;
  margin: 0 0 12px 0;
  color: #333;
}

.dev-toast p {
  margin: 0 0 20px 0;
  color: #666;
}

.dev-toast button {
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dev-toast button:hover {
  background-color: #3a7bc8;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 关于对话框样式 */
.about-dialog {
  background-color: white;
  border-radius: 12px;
  padding: 0;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: dialog-appear 0.3s ease-out;
  overflow: hidden;
}

.about-header {
  background: linear-gradient(135deg, #1a2a6c, #b21f1f);
  color: white;
  padding: 16px 20px;
  text-align: center;
}

.about-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.about-content {
  padding: 24px;
  text-align: center;
}

.about-logo {
  font-size: 2rem;
  font-weight: bold;
  color: #1a2a6c;
  margin-bottom: 8px;
}

.about-version {
  color: #666;
  margin-bottom: 20px;
}

.about-content p {
  margin: 12px 0;
  line-height: 1.5;
  color: #333;
}

.about-history {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #eee;
  text-align: left;
  font-size: 0.9rem;
  color: #555;
  line-height: 1.6;
}

.about-credits {
  margin-top: 24px;
  border-top: 1px solid #eee;
  padding-top: 16px;
}

.about-credits h4 {
  margin: 0 0 12px 0;
  color: #555;
}

.about-credits p {
  margin: 6px 0;
  font-size: 0.9rem;
  color: #666;
}

.about-actions {
  padding: 16px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #eee;
}

.about-actions button {
  min-width: 100px;
}

@keyframes dialog-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 对话框动画 */
.dialog-fade-enter-active {
  transition: opacity 0.3s ease;
}
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-fade-enter-from, .dialog-fade-leave-to {
  opacity: 0;
}

.dialog-zoom-enter-active {
  animation: dialog-zoom-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.dialog-zoom-leave-active {
  animation: dialog-zoom-out 0.3s ease forwards;
}

@keyframes dialog-zoom-in {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }
  70% {
    opacity: 1;
    transform: scale(1.05) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes dialog-zoom-out {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
}

/* 对话框内部元素动画 */
.animate-item {
  animation: fade-slide-up 0.5s ease forwards;
  opacity: 0;
}

.animate-item:nth-child(1) {
  animation-delay: 0.1s;
}

.animate-item:nth-child(2) {
  animation-delay: 0.2s;
}

.animate-item:nth-child(3) {
  animation-delay: 0.3s;
}

.animate-item:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes fade-slide-up {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
