<template>
  <div class="main-menu">
    <div class="animated-bg"></div>

    <div class="menu-container">
      <div class="title-section">
        <h1 class="game-title">买房记</h1>
        <p class="game-version">v{{ version }}</p>
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
          <div class="dialog magic-card" v-if="showDialog">
            <h2 class="dialog-title animate-item">开始新游戏</h2>
            <div class="dialog-content">
              <div class="form-group animate-item">
                <label for="playerName">用户名：</label>
                <div class="input-container">
                  <input
                    type="text"
                    id="playerName"
                    v-model="playerName"
                    placeholder="请输入用户名"
                    maxlength="12"
                    @keydown.enter="startNewGame"
                    class="shine-input"
                  />
                  <div class="input-shine"></div>
                </div>
              </div>

              <div class="form-group animate-item">
                <label>选择难度：</label>
                <div class="difficulty-options">
                  <label class="menu-option-card" :class="{ 'selected': difficulty === 'easy' }">
                    <input type="radio" v-model="difficulty" value="easy" />
                    <span>简单</span>
                  </label>
                  <label class="menu-option-card" :class="{ 'selected': difficulty === 'standard' }">
                    <input type="radio" v-model="difficulty" value="standard" />
                    <span>标准</span>
                  </label>
                  <label class="menu-option-card" :class="{ 'selected': difficulty === 'hard' }">
                    <input type="radio" v-model="difficulty" value="hard" />
                    <span>困难</span>
                  </label>
                </div>
              </div>

              <div class="form-group animate-item">
                <label>选择模式：</label>
                <div class="mode-options">
                  <label class="menu-option-card" :class="{ 'selected': gameMode === 'classic' }">
                    <input type="radio" v-model="gameMode" value="classic" />
                    <span>经典模式</span>
                  </label>
                  <label class="menu-option-card" :class="{ 'selected': gameMode === 'endless' }">
                    <input type="radio" v-model="gameMode" value="endless" />
                    <span>无尽模式</span>
                  </label>
                </div>
                <!-- 移除模式描述框 -->
              </div>
            </div>

            <div class="dialog-actions animate-item">
              <button class="game-btn cancel-btn" @click="cancelNewGame" :disabled="isLoading">取消</button>
              <button class="game-btn primary-btn" @click="startNewGame" :disabled="!playerName.trim() || isLoading">
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
          <div class="about-version">版本：v{{ version }}</div>

          <div class="about-description">
            <p>这是一款模拟经营策略游戏，玩家将在游戏中体验市场变化带来的乐趣与挑战。</p>
          </div>

          <div class="about-history">
            <p>《买房记》原作是由郑昉开发的一款模拟经营类手机游戏，发布于2016年。本作者首次接触原作《买房记》是在2016年，通过观看B站UP主“敖厂长”发布的视频《【敖厂长】屌丝买房》。其玩法和创意带来的乐趣，时至今日仍记忆犹新。受条件限制，数年后才得以真正上手游玩，熟悉的玩法，却再也找不回曾经的感觉。原作最后一次更新在2022年，至今已有三年。出于对童年的回忆和对原作的致敬，遂决定开发同名PC端游戏。目前游戏仍处于早期开发阶段，感谢您的试玩。</p>
          </div>

          <div class="credits-section">
            <h4>制作团队</h4>
            <div class="developer-info">
              开发者： <span class="dev-name">春卷</span>
            </div>
          </div>
        </div>
        <div class="about-actions">
          <button class="about-close-btn" @click="closeAboutDialog">关闭</button>
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

// 从全局变量获取版本信息（由Vite构建时自动注入）
const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.1.4';
const appName = typeof __APP_NAME__ !== 'undefined' ? __APP_NAME__ : '买房记';
const appDescription = typeof __APP_DESCRIPTION__ !== 'undefined' ? __APP_DESCRIPTION__ : '模拟经营游戏';
const appAuthor = typeof __APP_AUTHOR__ !== 'undefined' ? __APP_AUTHOR__ : '开发者';

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
  // 在下一个事件循环添加鼠标跟踪效果
  setTimeout(() => {
    initMagicCard();
  }, 100);
}

// Magic Card 鼠标跟随效果
function initMagicCard() {
  const magicCard = document.querySelector('.magic-card');
  if (magicCard) {
    // 对话框鼠标跟随效果
    magicCard.addEventListener('mousemove', (e) => {
      const rect = magicCard.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      magicCard.style.setProperty('--x', `${x}%`);
      magicCard.style.setProperty('--y', `${y}%`);
    });

    // 初始化输入框光效
    const inputContainer = magicCard.querySelector('.input-container');
    if (inputContainer) {
      const shine = inputContainer.querySelector('.input-shine');

      inputContainer.addEventListener('mousemove', (e) => {
        const rect = inputContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (shine) {
          shine.style.opacity = '0.6';
          shine.style.left = `${x - 20}px`;
        }
      });

      inputContainer.addEventListener('mouseleave', () => {
        if (shine) {
          shine.style.opacity = '0';
        }
      });

      const input = inputContainer.querySelector('input');
      if (input) {
        input.addEventListener('focus', () => {
          inputContainer.style.transform = 'translateY(-2px)';
          inputContainer.style.boxShadow = '0 4px 15px rgba(58, 99, 184, 0.15), 0 0 0 1px rgba(58, 99, 184, 0.3)';
        });

        input.addEventListener('blur', () => {
          inputContainer.style.transform = '';
          inputContainer.style.boxShadow = '';
        });
      }
    }

    // 选项卡悬停效果增强
    const optionCards = magicCard.querySelectorAll('.menu-option-card');
    optionCards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        const span = card.querySelector('span');
        if (span) {
          span.style.transform = 'translateY(-2px)';
        }
      });

      card.addEventListener('mouseleave', () => {
        if (!card.classList.contains('selected')) {
          const span = card.querySelector('span');
          if (span) {
            span.style.transform = '';
          }
        }
      });
    });

    // 按钮增强效果
    const buttons = magicCard.querySelectorAll('.game-btn');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';

        if (button.classList.contains('primary-btn')) {
          const buttonRect = button.getBoundingClientRect();
          button.style.boxShadow = '0 6px 20px rgba(58, 99, 184, 0.3)';
        } else {
          button.style.boxShadow = '0 6px 15px rgba(0, 0, 0, 0.15)';
        }
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = '';
        button.style.boxShadow = '';
      });
    });
  }
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

    // 开始新游戏

    // 延迟一小段时间，让加载界面显示出来
    await new Promise(resolve => setTimeout(resolve, 100));

    // 根据游戏模式设置周数限制
    if (gameMode.value === 'endless') {
      // 无尽模式，设置一个非常大的数字作为周数限制
      gameCore.setMaxWeeks(999999);
    } else {
      // 经典模式，使用默认的52周
      gameCore.setMaxWeeks(52);
    }

    // 通过startNewGame方法来重置所有游戏状态和设置玩家名称
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

.animated-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%);
  animation: pulse 10s infinite;
  z-index: -1; /* 确保背景在其他内容下方 */
  overflow: hidden;
}

.animated-bg::before,
.animated-bg::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

/* 闪烁星星效果 */
.animated-bg::before {
  background-image:
    radial-gradient(2px 2px at 40px 70px, #fff 100%, transparent),
    radial-gradient(2px 2px at 100px 150px, #fff 100%, transparent),
    radial-gradient(1px 1px at 200px 50px, #fff 100%, transparent),
    radial-gradient(1px 1px at 300px 250px, #fff 100%, transparent),
    radial-gradient(2px 2px at 400px 100px, #fff 100%, transparent),
    radial-gradient(1px 1px at 500px 200px, #fff 100%, transparent);
  background-repeat: repeat;
  background-size: 600px 600px;
  opacity: 0.3;
  animation: stars 6s linear infinite;
}

/* 流星效果 */
.animated-bg::after {
  background-image:
    linear-gradient(to bottom right, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
  transform: rotate(-45deg) translate(0, -100%) scale(2);
  animation: meteor 10s ease-in infinite;
}

@keyframes stars {
  0% { background-position: 0 0; opacity: 0.1; }
  50% { opacity: 0.3; }
  100% { background-position: 600px 600px; opacity: 0.1; }
}

@keyframes meteor {
  0% { transform: rotate(-45deg) translate(-100%, -100%) scale(0.5); opacity: 0; }
  10% { opacity: 0.8; }
  20% { transform: rotate(-45deg) translate(100%, 100%) scale(0.5); opacity: 0; }
  100% { transform: rotate(-45deg) translate(100%, 100%) scale(0.5); opacity: 0; }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.5; }
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
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 20px 35px rgba(0, 0, 0, 0.3);
  width: 450px;
  padding: 30px;
  animation: dialogIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
}

/* 对话框背景 */
.dialog-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(circle at 20% 20%, rgba(58, 99, 184, 0.1) 0%, transparent 60%),
    radial-gradient(circle at 80% 80%, rgba(58, 99, 184, 0.08) 0%, transparent 60%);
  z-index: -1;
}

/* Magic Card 效果 */
.magic-card:before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at var(--x, 50%) var(--y, 50%),
                            rgba(255, 255, 255, 0.3) 0%,
                            transparent 50%);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  z-index: 0;
}

.magic-card:hover:before {
  opacity: 1;
}

@keyframes dialogIn {
  from { opacity: 0; transform: scale(0.8) translateY(30px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.dialog-title {
  font-size: 28px;
  margin-bottom: 24px;
  color: #233863;
  text-align: center;
  position: relative;
  font-weight: bold;
  letter-spacing: 1px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* Aurora Text 效果 - 使用主菜单标题风格 */
.aurora-text {
  background-image: linear-gradient(90deg, #233863, #3a63b8, #233863);
  background-size: 300% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: aurora 4s ease infinite;
}

@keyframes aurora {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: #2c3e50;
  font-size: 16px;
}

/* 文本输入框样式 */
.input-container {
  position: relative;
  overflow: hidden;
  border-radius: 10px;
  transition: all 0.3s;
}

.shine-input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 16px;
  background-color: #fafafa;
  transition: all 0.3s;
  position: relative;
  z-index: 1;
}

.shine-input:focus {
  outline: none;
  border-color: #3a63b8;
  background-color: #fff;
}

/* 发光效果 */
.input-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 30px;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.6),
    transparent
  );
  transform: skewX(-15deg);
  animation: shine 6s infinite;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.input-container:hover .input-shine,
.shine-input:focus + .input-shine {
  opacity: 0.6;
}

@keyframes shine {
  0% { left: -100%; }
  20%, 100% { left: 100%; }
}

/* 单选按钮卡片样式 */
.difficulty-options,
.mode-options {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.menu-option-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  flex: 1;
  background-color: #f5f7fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  border: 1px solid transparent;
  color: #34495e;
  text-align: center;
}

.menu-option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 12px rgba(0, 0, 0, 0.08);
}

.menu-option-card input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.menu-option-card span {
  font-weight: 500;
  z-index: 1;
  transition: all 0.2s;
}

/* 选中效果 */
.menu-option-card.selected {
  background-color: #f0f4ff;
  border-color: #3a63b8;
  box-shadow: 0 2px 10px rgba(58, 99, 184, 0.2);
}

.menu-option-card.selected span {
  font-weight: 600;
}

/* Text Reveal 效果 */
.text-reveal {
  opacity: 0;
  animation: text-fade-in 1s ease forwards;
  animation-delay: 0.3s;
}

@keyframes text-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.dialog-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

/* 按钮样式 */
.game-btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  min-width: 120px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.cancel-btn {
  background-color: #f1f2f6;
  color: #34495e;
  border: 1px solid #e0e0e0;
}

.cancel-btn:hover {
  background-color: #e8ecf5;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.primary-btn {
  background-color: #3a63b8;
  color: #fff;
  position: relative;
}

.primary-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: all 0.6s;
}

.primary-btn:hover {
  background-color: #2d4f99;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(58, 99, 184, 0.25);
}

.primary-btn:hover::before {
  left: 100%;
}

.primary-btn:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
  box-shadow: none;
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

/* 关于对话框样式优化 */
.about-dialog {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 0;
  width: 92%;
  max-width: 460px; /* 增加宽度 */
  min-height: 650px; /* 增加最小高度 */
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: dialog-appear 0.4s ease-out;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(10px);
  display: flex; /* 使用flex布局 */
  flex-direction: column; /* 垂直排列 */
}

.about-header {
  background: linear-gradient(135deg, #1a2a6c, #b21f1f);
  color: white;
  padding: 16px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.about-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%);
  z-index: 1;
}

.about-header h3 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  letter-spacing: 1px;
  position: relative;
  z-index: 2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.about-content {
  padding: 20px;
  text-align: center;
  flex-grow: 1; /* 允许内容区域伸展 */
  display: flex;
  flex-direction: column;
}

.about-logo {
  font-size: 2.5rem;
  font-weight: bold;
  color: #1a2a6c;
  margin-bottom: 5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #1a2a6c, #b21f1f);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: title-glow 3s ease-in-out infinite;
}

.about-version {
  color: #7f8c8d;
  margin-bottom: 15px;
  font-size: 0.9rem;
  opacity: 0.8;
}

.about-description {
  margin-bottom: 15px;
}

.about-description p {
  margin: 0;
  line-height: 1.6;
  color: #34495e;
  font-size: 1rem;
}

.about-history {
  margin: 10px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #eee;
  text-align: left;
  font-size: 0.85rem; /* 稍微缩小字体 */
  color: #2c3e50;
  line-height: 1.5;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.03);
  max-height: 220px; /* 限制历史部分高度，确保后面内容可见 */
  overflow-y: auto; /* 添加滚动条 */
}

/* 自定义历史部分的滚动条 */
.about-history::-webkit-scrollbar {
  width: 5px;
}

.about-history::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.about-history::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.credits-section {
  margin-top: 15px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 12px;
  border: 1px solid #eee;
  margin-bottom: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
}

.developer-info {
  padding: 12px 0;
  font-size: 1.1rem;
  color: #34495e;
  text-align: center;
  margin-top: 10px;
}

.dev-name {
  font-weight: 600;
  color: #2c3e50;
}

.about-actions {
  padding: 15px 20px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #eee;
  background-color: #f9fafb;
  margin-top: auto; /* 将按钮推到底部 */
}

.about-close-btn {
  background: linear-gradient(135deg, #1a2a6c, #b21f1f);
  color: white;
  border: none;
  padding: 10px 30px;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(26, 42, 108, 0.2);
  position: relative;
  overflow: hidden;
}

.about-close-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: all 0.6s;
}

.about-close-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(26, 42, 108, 0.3);
}

.about-close-btn:hover::before {
  left: 100%;
}

.about-close-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(26, 42, 108, 0.2);
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
