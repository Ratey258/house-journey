<template>
  <div class="main-menu">
    <div class="menu-container">
      <div class="title-section">
        <h1 class="game-title">买房记</h1>
        <p class="game-version">v0.1.0</p>
      </div>

      <div class="menu-buttons">
        <button class="menu-button new-game-btn" @click="showNewGameDialog">
          <i class="menu-icon">🎮</i>
          <span>新游戏</span>
        </button>
        <button class="menu-button load-game-btn" @click="goToSaves">
          <i class="menu-icon">📂</i>
          <span>读取存档</span>
        </button>
        <button class="menu-button leaderboard-btn" @click="showInDevelopmentToast('排行榜')">
          <i class="menu-icon">🏆</i>
          <span>排行榜</span>
        </button>
        <button class="menu-button settings-btn" @click="showInDevelopmentToast('设置')">
          <i class="menu-icon">⚙️</i>
          <span>设置</span>
        </button>
        <button class="menu-button about-btn" @click="showAboutDialog">
          <i class="menu-icon">ℹ️</i>
          <span>关于</span>
        </button>
        <button class="menu-button exit-btn" @click="quitGame">
          <i class="menu-icon">🚪</i>
          <span>退出游戏</span>
        </button>
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

          <div class="form-group animate-item">
            <label>选择模式：</label>
            <div class="mode-options">
              <label class="radio-label">
                <input type="radio" v-model="gameMode" value="classic" />
                经典模式
              </label>
              <label class="radio-label">
                <input type="radio" v-model="gameMode" value="endless" />
                无尽模式
              </label>
            </div>
            <div class="mode-description">
              {{ gameModeDescription }}
            </div>
          </div>
        </div>

            <div class="dialog-actions animate-item">
          <button class="button" @click="cancelNewGame" :disabled="isLoading">取消</button>
          <button class="button primary" @click="startNewGame" :disabled="!playerName.trim() || isLoading">
            {{ isLoading ? '加载中...' : '开始游戏' }}
          </button>
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
        <button class="button primary" @click="closeDevToast">确定</button>
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
          <button class="button primary" @click="closeAboutDialog">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
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
const gameMode = ref('classic'); // 添加游戏模式选择，默认为经典模式
const isLoading = ref(false);
const currentTipIndex = ref(0);

// 开发中提示状态
const showDevToast = ref(false);
const devToastMessage = ref('');

// 关于对话框状态
const showAbout = ref(false);

// 游戏模式描述
const gameModeDescription = computed(() => {
  if (gameMode.value === 'classic') {
    return '经典模式：在52周内完成游戏目标，体验原汁原味的买房挑战。';
  } else {
    return '无尽模式：没有周数限制，可以无限游玩，慢慢积累财富。';
  }
});

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

    console.log('正在开始新游戏，玩家名称:', finalPlayerName, '难度:', difficulty.value, '模式:', gameMode.value);

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
    
    // 根据游戏模式设置周数限制
    if (gameMode.value === 'endless') {
      // 无尽模式，设置一个非常大的数字作为周数限制
      gameCore.maxWeeks = 999999;
    } else {
      // 经典模式，使用默认的52周
      gameCore.maxWeeks = 52;
    }

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

// 显示浮动开发工具窗口
function goToDevTools() {
  window.dispatchEvent(new CustomEvent('show-dev-tools'));
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
  position: relative;
  overflow: hidden;
}

/* 添加背景光效 */
.main-menu:before {
  content: '';
  position: absolute;
  width: 150%;
  height: 150%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  top: -25%;
  left: -25%;
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.menu-container {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  width: 500px;
  padding: 40px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.menu-container:hover {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  transform: translateY(-5px);
}

.title-section {
  margin-bottom: 40px;
  position: relative;
}

/* 添加标题光晕效果 */
.title-section:after {
  content: '';
  position: absolute;
  width: 100px;
  height: 5px;
  background: linear-gradient(90deg, transparent, #3498db, transparent);
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 2px;
}

.game-title {
  font-size: 56px;
  font-weight: bold;
  margin: 0;
  color: #1a2a6c;
  text-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
  letter-spacing: 2px;
  animation: title-glow 3s ease-in-out infinite;
}

@keyframes title-glow {
  0%, 100% { text-shadow: 0 2px 5px rgba(0, 0, 0, 0.15); }
  50% { text-shadow: 0 0 15px rgba(52, 152, 219, 0.5); }
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
  border-radius: 8px;
  padding: 16px 20px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.menu-icon {
  font-style: normal;
  font-size: 20px;
}

.menu-button:before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: all 0.6s;
}

.menu-button:hover:before {
  left: 100%;
}

.menu-button:hover {
  background-color: #2980b9;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
}

.menu-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 为不同按钮添加特定样式 */
.new-game-btn {
  background-color: #3498db;
}
.new-game-btn:hover {
  background-color: #2980b9;
}

.load-game-btn {
  background-color: #27ae60;
}
.load-game-btn:hover {
  background-color: #219653;
}

.leaderboard-btn {
  background-color: #f39c12;
}
.leaderboard-btn:hover {
  background-color: #d35400;
}

.settings-btn {
  background-color: #9b59b6;
}
.settings-btn:hover {
  background-color: #8e44ad;
}

.about-btn {
  background-color: #34495e;
}
.about-btn:hover {
  background-color: #2c3e50;
}

.exit-btn {
  background-color: #e74c3c;
}
.exit-btn:hover {
  background-color: #c0392b;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.dialog {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  width: 400px;
  padding: 30px;
  animation: dialogIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes dialogIn {
  from { opacity: 0; transform: scale(0.8) translateY(30px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.dialog-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #1a2a6c;
  text-align: center;
  position: relative;
}

.dialog-title:after {
  content: '';
  position: absolute;
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #3498db, transparent);
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 2px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 10px;
  font-weight: 500;
  color: #2c3e50;
}

.form-group input[type="text"] {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: all 0.3s;
  background-color: #f8f9fa;
}

.form-group input[type="text"]:focus {
  border-color: #3498db;
  outline: none;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  background-color: #fff;
}

.difficulty-options {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  gap: 10px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px 15px;
  border-radius: 6px;
  flex: 1;
  transition: all 0.3s;
  background-color: #f8f9fa;
  border: 2px solid #e0e0e0;
}

.radio-label:hover {
  background-color: #edf2f7;
}

.radio-label input {
  margin-right: 8px;
}

.radio-label input:checked + span {
  font-weight: 500;
}

.mode-options {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  gap: 10px;
}

.mode-description {
  margin-top: 12px;
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
  line-height: 1.4;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #3498db;
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
}

.button {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  min-width: 120px;
  font-weight: 500;
}

.button.primary {
  background-color: #3498db;
  color: white;
  box-shadow: 0 4px 6px rgba(52, 152, 219, 0.2);
}

.button.primary:hover {
  background-color: #2980b9;
  box-shadow: 0 6px 8px rgba(52, 152, 219, 0.3);
  transform: translateY(-2px);
}

.button.primary:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
}

.button.primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  box-shadow: none;
}

.button:not(.primary) {
  background-color: #f1f2f6;
  color: #34495e;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.button:not(.primary):hover {
  background-color: #dfe4ea;
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.button:not(.primary):active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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
  border-radius: 16px;
  padding: 30px;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
  animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dev-toast-icon {
  font-size: 60px;
  margin-bottom: 20px;
  display: block;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
  60% { transform: translateY(-10px); }
}

.dev-toast h3 {
  font-size: 24px;
  margin: 0 0 15px 0;
  color: #2c3e50;
}

.dev-toast p {
  margin: 0 0 25px 0;
  color: #7f8c8d;
  font-size: 18px;
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
  border-radius: 16px;
  padding: 0;
  width: 90%;
  max-width: 420px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: dialog-appear 0.4s ease-out;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  letter-spacing: 1px;
}

.about-content {
  padding: 25px 20px;
  text-align: center;
}

.about-logo {
  font-size: 2.2rem;
  font-weight: bold;
  color: #1a2a6c;
  margin-bottom: 5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.about-version {
  color: #7f8c8d;
  margin-bottom: 15px;
  font-size: 0.9rem;
}

.about-content p {
  margin: 12px 0;
  line-height: 1.5;
  color: #34495e;
  font-size: 0.95rem;
}

.about-history {
  margin-top: 18px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 10px;
  border: 1px solid #eee;
  text-align: left;
  font-size: 0.9rem;
  color: #2c3e50;
  line-height: 1.6;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.03);
}

.about-credits {
  margin-top: 18px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.about-credits h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
  font-size: 1.1rem;
}

.about-credits p {
  margin: 5px 0;
  font-size: 0.9rem;
  color: #34495e;
}

.about-actions {
  padding: 15px;
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
