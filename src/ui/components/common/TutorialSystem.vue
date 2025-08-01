<template>
  <div class="tutorial-system">
    <!-- 教程提示弹窗 -->
    <div v-if="showTutorialTip && currentTip" class="tutorial-tip" :class="{ 'minimized': minimized }">
      <div class="tip-header" @click="toggleMinimize">
        <div class="tip-title">
          <span class="tip-icon">💡</span>
          <span>{{ currentTip.title }}</span>
        </div>
        <div class="tip-controls">
          <button v-if="!minimized" class="minimize-btn" @click.stop="minimized = true">
            <span class="minimize-icon"></span>
          </button>
          <button class="close-btn" @click.stop="closeTip">×</button>
        </div>
      </div>

      <div v-if="!minimized" class="tip-content">
        <div class="tip-body" v-html="currentTip.content"></div>

        <div class="tip-footer">
          <div class="tip-navigation">
            <button
              class="nav-btn prev"
              @click="showPreviousTip"
              :disabled="currentTipIndex <= 0"
            >
              ← {{ $t('tutorial.help.prev') }}
            </button>
            <span class="tip-counter">{{ currentTipIndex + 1 }}/{{ filteredTips.length }}</span>
            <button
              class="nav-btn next"
              @click="showNextTip"
              :disabled="currentTipIndex >= filteredTips.length - 1"
            >
              {{ $t('tutorial.help.next') }} →
            </button>
          </div>
          <div class="tip-actions">
            <label class="dont-show-again">
              <input type="checkbox" v-model="dontShowAgain" />
              {{ $t('tutorial.help.dontShowAgain') }}
            </label>
            <button class="got-it-btn" @click="acknowledgeTip">{{ $t('tutorial.help.gotIt') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 帮助按钮 -->
    <div class="help-button-container">
      <button class="help-button" @click="toggleHelpPanel">
        <span class="help-icon">?</span>
      </button>
    </div>

    <!-- 帮助面板 -->
    <div v-if="showHelpPanel" class="help-panel-overlay" @click.self="closeHelpPanel">
      <div class="help-panel">
        <div class="help-header">
          <h2>{{ $t('tutorial.help.title') }}</h2>
          <button class="close-btn" @click="closeHelpPanel">×</button>
        </div>

        <div class="help-content">
          <div class="help-tabs">
            <button
              v-for="(tab, index) in helpTabs"
              :key="index"
              class="tab-btn"
              :class="{ active: activeHelpTab === tab.id }"
              @click="activeHelpTab = tab.id"
            >
              {{ tab.name }}
            </button>
          </div>

          <div class="tab-content">
            <!-- 游戏基础 -->
            <div v-if="activeHelpTab === 'basics'" class="help-section">
              <h3>{{ $t('game.title') }}</h3>
              <p>在《买房记》中，你的目标是在52周的游戏时间内，通过商品交易赚取足够的资金来购买房产。游戏结束时，你的表现将根据获得的资产、购买的房屋和其他因素进行评分。</p>

              <h3>基本操作</h3>
              <ul>
                <li><strong>交易商品</strong>：在市场标签页中，你可以买入商品；在库存标签页中，你可以卖出商品。</li>
                <li><strong>切换地点</strong>：在市场页面顶部的下拉菜单中选择不同地点，每个地点有不同的商品和价格。</li>
                <li><strong>进入下一周</strong>：点击右上角的"下一周"按钮，游戏将进入下一周，商品价格会发生变化。</li>
                <li><strong>购买房产</strong>：当你积累了足够的资金后，可以在房产标签页中购买房屋。</li>
              </ul>
            </div>

            <!-- 交易技巧 -->
            <div v-if="activeHelpTab === 'trading'" class="help-section">
              <h3>价格波动</h3>
              <p>商品价格会随时间波动，关注价格趋势是获利的关键。价格趋势分为以下几种：</p>
              <ul>
                <li><strong>{{ $t('trends.rising_strong') }}</strong>：价格快速上涨，可能是卖出的好时机。</li>
                <li><strong>{{ $t('trends.rising') }}</strong>：价格稳步上涨，可以考虑持有或卖出。</li>
                <li><strong>{{ $t('trends.stable_high') }}</strong>：价格略有上涨，可能会继续上涨。</li>
                <li><strong>{{ $t('trends.stable') }}</strong>：价格相对稳定，波动较小。</li>
                <li><strong>{{ $t('trends.stable_low') }}</strong>：价格略有下跌，可能是买入的好时机。</li>
                <li><strong>{{ $t('trends.falling') }}</strong>：价格稳步下跌，可以考虑等待更低价格再买入。</li>
                <li><strong>{{ $t('trends.falling_strong') }}</strong>：价格快速下跌，可能是买入的好时机，但也要小心可能继续下跌。</li>
                <li><strong>{{ $t('trends.volatile') }}</strong>：价格波动较大，风险较高。</li>
              </ul>

              <h3>交易策略</h3>
              <ul>
                <li><strong>低买高卖</strong>：在价格低时购买，价格高时卖出，赚取差价。</li>
                <li><strong>关注特色商品</strong>：每个地点都有特色商品，价格更优惠。</li>
                <li><strong>利用价格趋势</strong>：根据价格趋势做出买卖决策。</li>
                <li><strong>多地点比较</strong>：不同地点的同一商品价格可能不同，可以利用这一点赚取差价。</li>
              </ul>
            </div>

            <!-- 事件系统 -->
            <div v-if="activeHelpTab === 'events'" class="help-section">
              <h3>事件类型</h3>
              <p>游戏中会随机触发各种事件，这些事件可能会影响商品价格、你的资金或其他游戏状态。事件类型包括：</p>
              <ul>
                <li><strong>随机事件</strong>：任何时候都可能触发的普通事件。</li>
                <li><strong>故事事件</strong>：与游戏剧情相关的事件，可能会连锁触发。</li>
                <li><strong>地点事件</strong>：在特定地点才会触发的事件。</li>
                <li><strong>市场事件</strong>：影响商品价格的事件。</li>
                <li><strong>个人事件</strong>：与玩家状态相关的事件。</li>
              </ul>

              <h3>事件选择</h3>
              <p>大多数事件会提供多个选择，不同的选择会导致不同的结果。选择时要考虑当前的游戏状态和长期目标。</p>
            </div>

            <!-- 游戏设置 -->
            <div v-if="activeHelpTab === 'settings'" class="help-section">
              <h3>游戏存档</h3>
              <p>你可以通过游戏菜单保存游戏进度，以便稍后继续。游戏也会在某些关键时刻自动保存。</p>

              <h3>游戏设置</h3>
              <p>在设置菜单中，你可以调整游戏音量、显示设置等。</p>

              <h3>{{ $t('tutorial.help.shortcuts.title') }}</h3>
              <ul>
                <li><strong>空格</strong>：{{ $t('tutorial.help.shortcuts.space') }}</li>
                <li><strong>Tab</strong>：{{ $t('tutorial.help.shortcuts.tab') }}</li>
                <li><strong>Esc</strong>：{{ $t('tutorial.help.shortcuts.esc') }}</li>
                <li><strong>H</strong>：{{ $t('tutorial.help.shortcuts.h') }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, type Ref } from 'vue';
import { useGameCoreStore } from '@/stores/gameCore';
import { useI18n } from 'vue-i18n';

// ==================== 类型定义 ====================

interface Location {
  id: string;
  [key: string]: any;
}

interface TutorialTip {
  id: string;
  title: string;
  content: string;
  trigger: {
    week?: number;
    location?: string | null;
    tab?: string | null;
    onlyOnce?: boolean;
  };
  seen: boolean;
}

interface HelpTab {
  id: string;
  name: string;
}

// ==================== Props ====================

interface Props {
  currentWeek: number;
  currentLocation: Location;
  activeTab: string;
}

const props = withDefaults(defineProps<Props>(), {});

// ==================== Composables ====================

const gameStore = useGameCoreStore();
const { t } = useI18n();

// ==================== 响应式状态 ====================

// 教程提示状态
const showTutorialTip: Ref<boolean> = ref(false);
const currentTipIndex: Ref<number> = ref(0);
const minimized: Ref<boolean> = ref(false);
const dontShowAgain: Ref<boolean> = ref(false);

// 帮助面板状态
const showHelpPanel: Ref<boolean> = ref(false);
const activeHelpTab: Ref<string> = ref('basics');

// 帮助标签页
const helpTabs: HelpTab[] = [
  { id: 'basics', name: t('tutorial.help.basics') },
  { id: 'trading', name: t('tutorial.help.trading') },
  { id: 'events', name: t('tutorial.help.events') },
  { id: 'settings', name: t('tutorial.help.settings') }
];

// 教程提示数据
const tutorialTips: TutorialTip[] = [
  // 游戏开始提示
  {
    id: 'welcome',
    title: t('tutorial.tips.welcome.title'),
    content: t('tutorial.tips.welcome.content'),
    trigger: { week: 1, location: null, tab: null, onlyOnce: true },
    seen: false
  },
  {
    id: 'market_intro',
    title: t('tutorial.tips.market_intro.title'),
    content: t('tutorial.tips.market_intro.content'),
    trigger: { week: 1, location: null, tab: 'market' },
    seen: false
  },
  {
    id: 'inventory_intro',
    title: t('tutorial.tips.inventory_intro.title'),
    content: t('tutorial.tips.inventory_intro.content'),
    trigger: { week: 1, location: null, tab: 'inventory' },
    seen: false
  }
];

// ==================== 计算属性 ====================

// 过滤当前可显示的提示
const filteredTips = computed(() => {
  return tutorialTips.filter(tip => {
    // 检查周数条件
    const weekMatch = !tip.trigger.week || props.currentWeek >= tip.trigger.week;

    // 检查地点条件
    const locationMatch = !tip.trigger.location ||
      (props.currentLocation && props.currentLocation.id === tip.trigger.location);

    // 检查标签页条件
    const tabMatch = !tip.trigger.tab || props.activeTab === tip.trigger.tab;

    // 检查是否是只显示一次的提示（如欢迎提示）
    if (tip.trigger.onlyOnce && tip.id === 'welcome') {
      // 如果是欢迎提示且已经看过了游戏中的任何提示，则不再显示
      const anyTipSeen = tutorialTips.some(t => t.seen);
      if (anyTipSeen) {
        return false;
      }

      // 获取本地存储中的标记
      const welcomeShown = localStorage.getItem('welcome_tutorial_shown');
      if (welcomeShown) {
        return false;
      }
    }

    return weekMatch && locationMatch && tabMatch && !tip.seen;
  });
});

// 当前显示的提示
const currentTip = computed(() => {
  return filteredTips.value[currentTipIndex.value] || null;
});

// ==================== 方法 ====================

/**
 * 检查是否有新的教程提示需要显示
 */
const checkForTutorialTips = (): void => {
  if (dontShowAgain.value) return;

  if (filteredTips.value.length > 0 && !showTutorialTip.value) {
    showTutorialTip.value = true;
    currentTipIndex.value = 0;
    minimized.value = false;
  }
};

/**
 * 显示下一个提示
 */
const showNextTip = (): void => {
  if (currentTipIndex.value < filteredTips.value.length - 1) {
    currentTipIndex.value++;
  }
};

/**
 * 显示上一个提示
 */
const showPreviousTip = (): void => {
  if (currentTipIndex.value > 0) {
    currentTipIndex.value--;
  }
};

/**
 * 确认当前提示
 */
const acknowledgeTip = (): void => {
  if (currentTip.value) {
    // 标记当前提示为已读
    const index = tutorialTips.findIndex(tip => tip.id === currentTip.value!.id);
    if (index !== -1) {
      tutorialTips[index].seen = true;

      // 如果是欢迎提示，保存到本地存储
      if (tutorialTips[index].id === 'welcome') {
        localStorage.setItem('welcome_tutorial_shown', 'true');
      }
    }

    // 检查是否有下一个提示
    if (currentTipIndex.value < filteredTips.value.length - 1) {
      currentTipIndex.value++;
    } else {
      showTutorialTip.value = false;
    }
  }
};

/**
 * 关闭提示
 */
const closeTip = (): void => {
  showTutorialTip.value = false;
};

/**
 * 切换最小化状态
 */
const toggleMinimize = (): void => {
  minimized.value = !minimized.value;
};

/**
 * 切换帮助面板
 */
const toggleHelpPanel = (): void => {
  showHelpPanel.value = !showHelpPanel.value;
};

/**
 * 关闭帮助面板
 */
const closeHelpPanel = (): void => {
  showHelpPanel.value = false;
};

// ==================== 监听器 ====================

// 监听属性变化，检查是否需要显示新的教程提示
watch(() => props.currentWeek, checkForTutorialTips);
watch(() => props.activeTab, checkForTutorialTips);
watch(() => props.currentLocation, (newLocation, oldLocation) => {
  // 对于地点变化，我们不希望欢迎提示再次显示
  // 如果有其他适合在地点变化时显示的提示，可以在这里检查
  const nonWelcomeTips = tutorialTips.filter(tip =>
    tip.id !== 'welcome' && !tip.seen &&
    (!tip.trigger.tab || tip.trigger.tab === props.activeTab) &&
    (!tip.trigger.location || tip.trigger.location === newLocation?.id)
  );

  if (nonWelcomeTips.length > 0) {
    checkForTutorialTips();
  }
}, { deep: true });

// ==================== 生命周期 ====================

// 初始化时检查是否有教程提示
onMounted(() => {
  checkForTutorialTips();
});
</script>

<style scoped>
.tutorial-system {
  position: relative;
  z-index: 100;
}

/* 教程提示样式 */
.tutorial-tip {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 380px;
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.18),
              0 1px 1px rgba(255, 255, 255, 0.3) inset,
              0 -1px 1px rgba(0, 0, 0, 0.05) inset;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 1000;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transform-origin: bottom right;
  animation: tipEntrance 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes tipEntrance {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(30px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.tutorial-tip.minimized {
  width: 220px;
  height: auto;
  transform: scale(0.9);
  opacity: 0.9;
}

.tip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #1a2a6c, #3498db);
  color: white;
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tip-header:hover {
  background: linear-gradient(135deg, #1a2a6c, #2980b9);
}

.tip-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.tip-icon {
  font-size: 1.2rem;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.tip-controls {
  display: flex;
  gap: 8px;
}

.minimize-btn, .close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.minimize-btn:hover, .close-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.minimize-icon {
  display: block;
  width: 12px;
  height: 2px;
  background-color: white;
  border-radius: 1px;
}

.tip-content {
  padding: 18px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.tip-body {
  margin-bottom: 18px;
  line-height: 1.6;
  color: #2c3e50;
  font-size: 15px;
}

.tip-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-btn {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  padding: 5px 8px;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background-color: rgba(52, 152, 219, 0.1);
}

.nav-btn:disabled {
  color: #ccc;
  cursor: not-allowed;
}

.tip-counter {
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 500;
}

.tip-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.dont-show-again {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #7f8c8d;
  cursor: pointer;
}

.dont-show-again input[type="checkbox"] {
  cursor: pointer;
  width: 16px;
  height: 16px;
  accent-color: #3498db;
}

.got-it-btn {
  background: linear-gradient(to bottom, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.got-it-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  background: linear-gradient(to bottom, #2980b9, #2573a7);
}

.got-it-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 帮助按钮样式 */
.help-button-container {
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 900;
}

.help-button {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a2a6c, #3498db);
  color: white;
  border: none;
  font-size: 1.3rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2),
              0 1px 1px rgba(255, 255, 255, 0.15) inset;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.help-button:hover {
  transform: scale(1.1) translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25),
              0 1px 1px rgba(255, 255, 255, 0.15) inset;
}

.help-button:active {
  transform: scale(0.95);
}

/* 帮助面板样式 */
.help-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.help-panel {
  background-color: white;
  border-radius: 12px;
  width: 85%;
  max-width: 850px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25),
              0 1px 1px rgba(255, 255, 255, 0.5) inset;
  animation: panelEntrance 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes panelEntrance {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid #eee;
  background: linear-gradient(to right, #f8f9fa, white);
}

.help-header h2 {
  margin: 0;
  color: #1a2a6c;
  font-size: 24px;
  font-weight: 600;
}

.help-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.help-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  background-color: #f8f9fa;
  padding: 0 10px;
}

.tab-btn {
  padding: 15px 22px;
  border: none;
  background: none;
  font-size: 1rem;
  cursor: pointer;
  color: #7f8c8d;
  position: relative;
  transition: all 0.3s ease;
}

.tab-btn.active {
  color: #3498db;
  font-weight: 600;
}

.tab-btn:hover:not(.active) {
  color: #34495e;
  background-color: rgba(0, 0, 0, 0.03);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: #3498db;
  transform: scaleX(0.8);
  transition: transform 0.3s ease;
}

.tab-btn.active:hover::after {
  transform: scaleX(1);
}

.tab-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.help-section {
  margin-bottom: 24px;
}

.help-section h3 {
  color: #1a2a6c;
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 20px;
  font-weight: 600;
}

.help-section p {
  margin-bottom: 16px;
  line-height: 1.6;
  color: #2c3e50;
}

.help-section ul {
  padding-left: 24px;
  margin-bottom: 16px;
}

.help-section li {
  margin-bottom: 8px;
  line-height: 1.6;
  color: #2c3e50;
}

@media (max-width: 768px) {
  .tutorial-tip {
    width: calc(100% - 40px);
    max-width: 380px;
  }

  .tutorial-tip.minimized {
    width: 180px;
  }

  .help-panel {
    width: 95%;
    max-height: 90vh;
  }

  .help-tabs {
    overflow-x: auto;
  }

  .tab-btn {
    padding: 12px 15px;
    font-size: 0.9rem;
  }
}
</style>
