<template>
  <div class="game-view">
    <!-- 加载动画 -->
    <GameLoader
      v-if="isLoading"
      :title="'正在加载游戏资源'"
      :status="loadingStatus"
      :progress="loadingProgress"
      @complete="onLoadingComplete"
    />

    <!-- 顶部信息栏 -->
    <header v-if="!isLoading" class="game-header">
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
        <button class="menu-button" @click="showGameMenu">
          <span class="menu-icon">≡</span>
          <span class="menu-text">{{ $t('game.menu') }}</span>
        </button>
      </div>
    </header>

    <!-- 通知区域 -->
    <div v-if="!isLoading" class="notifications-container">
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
          <button class="close-btn" @click="dismissNotification(notification.id)">×</button>
        </div>
      </transition-group>
    </div>

    <!-- 主游戏区域 -->
    <div class="game-content">
      <!-- 左侧玩家信息面板 -->
      <div class="left-panel">
        <PlayerInfo />

        <!-- 优化背包显示 -->
        <div class="mini-inventory">
          <div class="mini-header">
            <h3 class="mini-title">{{ $t('inventory.title') }}</h3>
            <button
              class="view-all-btn"
              @click="activeTab = 'inventory'"
              title="查看完整背包"
            >
              <i class="icon-expand">⤢</i>
            </button>
          </div>
          <div class="inventory-items">
            <div v-if="playerInventory.length === 0" class="empty-inventory">
              {{ $t('inventory.empty') }}
            </div>
            <div v-else class="inventory-list">
              <div v-for="item in playerInventory" :key="item.productId" class="inventory-item">
                <div class="item-name">{{ item.name }}</div>
                <div class="item-details">
                  <span class="item-quantity">x{{ item.quantity }}</span>
                  <span class="item-price">¥{{ formatNumber(item.purchasePrice) }}</span>
                </div>
              </div>
              <!-- 移除了更多物品提示，现在显示所有物品 -->
            </div>
          </div>

          <!-- 移除了容量进度条显示 -->
        </div>

        <!-- 删除进入下一周按钮 -->
      </div>

      <!-- 中央内容区域 -->
      <div class="main-content">
        <div class="tab-buttons">
          <button
            :class="['tab-button', { active: activeTab === 'market' }]"
            @click="activeTab = 'market'"
          >
            {{ $t('game.tabs.market') }}
          </button>
          <button
            :class="['tab-button', { active: activeTab === 'inventory' }]"
            @click="activeTab = 'inventory'"
          >
            {{ $t('game.tabs.inventory') }}
          </button>
          <button
            :class="['tab-button', { active: activeTab === 'houses' }]"
            @click="activeTab = 'houses'"
          >
            {{ $t('game.tabs.houses') }}
          </button>
        </div>

        <div class="tab-content">
          <transition name="tab-fade" mode="out-in">
            <!-- 市场标签页 -->
            <div v-if="activeTab === 'market'" class="market-tab" key="market">
              <Market />
            </div>

            <!-- 背包标签页 -->
            <div v-else-if="activeTab === 'inventory'" class="inventory-tab" key="inventory">
              <Inventory />
            </div>

            <!-- 房屋标签页 -->
            <div v-else-if="activeTab === 'houses'" class="houses-tab" key="houses">
              <HouseMarket />
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- 教程系统 -->
    <TutorialSystem
      :current-week="currentWeek"
      :current-location="currentLocation"
      :active-tab="activeTab"
      ref="tutorialSystem"
    />

    <!-- 事件模态框 -->
    <EventModal ref="eventModal" />

    <!-- 游戏菜单对话框 -->
    <transition name="fade">
      <div v-if="showMenu" class="dialog-overlay" @click.self="hideGameMenu">
        <transition name="zoom-bounce">
          <div class="dialog game-menu-dialog">
            <h2 class="dialog-title">{{ $t('gameMenu.title') }}</h2>
            <div class="menu-options">
              <transition-group name="menu-item">
                <button class="menu-option" @click="saveGame" key="save">
                  <span class="menu-icon">💾</span>
                  {{ $t('gameMenu.save') }}
                </button>
                <button class="menu-option" @click="goToMainMenu" key="main">
                  <span class="menu-icon">🏠</span>
                  {{ $t('gameMenu.mainMenu') }}
                </button>
                <button class="menu-option" @click="hideGameMenu" key="continue">
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
      <div v-if="showSaveDialog" class="dialog-overlay" @click.self="cancelSave">
        <transition name="slide-up">
          <div class="dialog save-dialog">
            <h2 class="dialog-title">{{ $t('saveDialog.title') }}</h2>
            <div class="save-form">
              <input
                v-model="saveName"
                type="text"
                class="save-input"
                :placeholder="$t('saveDialog.namePlaceholder')"
                ref="saveInput"
                @keyup.enter="confirmSave"
              />
              <div class="dialog-buttons">
                <button class="dialog-button confirm" @click="confirmSave" :disabled="!saveName">
                  {{ $t('common.confirm') }}
                </button>
                <button class="dialog-button cancel" @click="cancelSave">
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
            :gameStats="gameResult"
            @return-to-main="goToMainMenu"
            @restart-game="restartGame"
            @continue-game="continueFromVictory"
          />
        </transition>
      </div>
    </transition>

    <!-- 移除详细统计对话框 -->
  </div>

  <!-- 添加交易Toast提示 -->
  <transition name="fade">
    <div v-if="showTransactionToast" class="transaction-toast" :class="transactionToastClass">
      <div class="toast-content">
        <span class="toast-icon">{{ transactionToastIcon }}</span>
        <span class="toast-message">{{ transactionToastMessage }}</span>
      </div>
      <div class="toast-progress-bar"></div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGameCoreStore } from '@/stores/gameCore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import { usePlayerStore } from '@/stores/player';
import { useMarketStore } from '@/stores/market';
import { useEventStore } from '@/stores/events';
import { useSaveStore } from '@/stores/persistence';
import eventEmitter from '@/infrastructure/eventEmitter';

// ✅ 引入Service Composables（用于少数需要的业务操作）
import { useGameState } from '@/ui/composables';

// Vue 3.5 性能优化：组件异步加载策略
// 核心游戏组件 - 立即加载（用户立即可见）
import PlayerInfo from '@/ui/components/player/PlayerInfo.vue';
import Market from '@/ui/components/market/Market.vue';

// 功能扩展组件 - 异步加载（延迟加载）
import { defineAsyncComponent } from 'vue';
const Inventory = defineAsyncComponent(() => import('@/ui/components/player/Inventory.vue'));
const HouseMarket = defineAsyncComponent(() => import('@/ui/components/market/HouseMarket.vue'));
const EventModal = defineAsyncComponent(() => import('@/ui/components/common/EventModal.vue'));
const GameOverView = defineAsyncComponent(() => import('@/ui/views/GameOverView.vue'));
const TutorialSystem = defineAsyncComponent(() => import('@/ui/components/common/TutorialSystem.vue'));
const GameLoader = defineAsyncComponent(() => import('@/ui/components/common/GameLoader.vue'));
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler'; // 导入GameLoader组件

const router = useRouter();
const gameCoreStore = useGameCoreStore(); // 游戏核心存储
const playerStore = usePlayerStore(); // 玩家存储
const marketStore = useMarketStore(); // 市场存储
const eventStore = useEventStore(); // 事件存储
const settingsStore = useSettingsStore();
const uiStore = useUiStore();
const { t } = useI18n();

// ✅ Service Composables - 用于统一状态管理
const { 
  currentWeek: currentWeekFromService, 
  maxWeeks: maxWeeksFromService,
  gameOver: gameOverFromService 
} = useGameState();
// Vue 3.5 新特性：类型安全的模板引用
const eventModal = useTemplateRef('eventModal');
const tutorialSystem = useTemplateRef('tutorialSystem');
const saveInput = useTemplateRef('saveInput');

// 组件初始化完成

// 游戏状态
const activeTab = ref('market');
const showMenu = ref(false);
const showSaveDialog = ref(false);
const showGameOverDialog = ref(false);
const saveName = ref('');
const isDevelopmentMode = ref(false); // 开发模式标志

// 加载状态
const isLoading = ref(true);
const loadingStatus = ref('初始化游戏...');
const loadingProgress = ref(0);

// 获取游戏状态
const currentWeek = computed(() => gameCoreStore.currentWeek);
const maxWeeks = computed(() => gameCoreStore.maxWeeks);
const gameOver = computed(() => gameCoreStore.gameOver);
const notifications = computed(() => gameCoreStore.notifications);
const gameResult = computed(() => gameCoreStore.gameResult);
const player = computed(() => playerStore);
const currentLocation = computed(() => marketStore.currentLocation);
// 修复：使用正确的方式获取playerInventory
const playerInventory = computed(() => playerStore.inventory || []);
const gameState = computed(() => ({
  currentWeek: currentWeek.value,
  maxWeeks: maxWeeks.value,
  gameOver: gameOver.value
}));

// 获取游戏相关状态
const gameProgress = computed(() => gameCoreStore.gameProgress);
const isEndlessMode = computed(() => gameCoreStore.isEndlessMode);

// 当游戏结束时显示结束对话框
watch(() => gameCoreStore.gameOver, (newValue) => {
  if (newValue) {
    // 添加详细调试日志
    // 游戏结束处理
    console.log('详细游戏结果数据:', {
      gameResult: gameCoreStore.gameResult,
      score: gameCoreStore.gameResult?.score,
      scoreDetails: gameCoreStore.gameResult?.scoreDetails,
      endReason: gameCoreStore.gameResult?.endReason,
      playerNetWorth: playerStore.netWorth,
      purchasedHouses: playerStore.purchasedHouses?.length || 0
    });

    nextTick(() => {
      showGameOverDialog.value = true;
    });
  }
});

// 交易提示相关状态
const showTransactionToast = ref(false);
const transactionToastMessage = ref('');
const transactionToastClass = ref('');
const transactionToastIcon = ref('');

// 组件挂载时
onMounted(() => {
  // 组件挂载

  // 初始化加载状态
  isLoading.value = true;
  loadingProgress.value = 0;

  // 检查是否为开发模式
  try {
    isDevelopmentMode.value = true; // 默认设为开发模式
    // 开发模式标记
  } catch (error) {
    console.warn('GameView - 无法检测环境模式:', error);
    isDevelopmentMode.value = true; // 默认为开发模式
  }

  // 检查游戏是否已经初始化
  if (!gameCoreStore.gameStarted) {
    // 尝试从本地存储获取玩家信息
    const savedPlayerName = localStorage.getItem('lastPlayerName') || '玩家';
    console.log('获取到玩家名称:', savedPlayerName);

    // 设置玩家名称 - 安全检查
    const currentName = typeof playerStore.name === 'object' && 'value' in playerStore.name 
      ? playerStore.name.value 
      : playerStore.name;
    
    if (!currentName && savedPlayerName) {
      if (typeof playerStore.name === 'object' && 'value' in playerStore.name) {
        playerStore.name.value = savedPlayerName;
      }
    }
  }

  // 确保游戏不会在初始状态下显示为结束
  if (gameCoreStore.gameOver) {
    console.log('重置游戏结束状态');
    gameCoreStore.gameOver = false;
    showGameOverDialog.value = false;

    // 同时重置事件系统，防止事件重新触发
    const eventStore = useEventStore();
    eventStore.resetEvents();
    eventStore.activeEvent = null;
    eventStore.activeEvents = [];
  }

  // 加载游戏资源
  loadGameResources();

  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown);

  // 添加beforeunload事件监听
  window.addEventListener('beforeunload', handleBeforeUnload);

  // 设置定时器，定期检查是否有活跃事件需要显示
  setInterval(() => {
    // 只在游戏未结束时检查事件
    if (!gameCoreStore.gameOver) {
      checkActiveEvents();
    }
  }, 2000); // 每2秒检查一次

  // 添加交易提示事件监听
  eventEmitter.on('show:transaction_toast', handleTransactionToast);
});

onBeforeUnmount(() => {
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown);

  // 移除关闭前保存事件
  window.removeEventListener('beforeunload', handleBeforeUnload);

  // 移除交易提示事件监听
  eventEmitter.off('show:transaction_toast', handleTransactionToast);
});

// 处理键盘快捷键
const handleKeyDown = (event) => {
  // 如果有模态框打开，不处理快捷键
  if (showMenu.value || showSaveDialog.value || showGameOverDialog.value) {
    return;
  }

  switch (event.key) {
    case ' ': // 空格键
      // 进入下一周
      advanceWeek();
      break;
    case 'Tab': // Tab键
      // 切换标签页
      event.preventDefault(); // 阻止默认Tab行为
      if (event.shiftKey) {
        // Shift+Tab 向前切换
        if (activeTab.value === 'market') activeTab.value = 'houses';
        else if (activeTab.value === 'inventory') activeTab.value = 'market';
        else if (activeTab.value === 'houses') activeTab.value = 'inventory';
      } else {
        // Tab 向后切换
        if (activeTab.value === 'market') activeTab.value = 'inventory';
        else if (activeTab.value === 'inventory') activeTab.value = 'houses';
        else if (activeTab.value === 'houses') activeTab.value = 'market';
      }
      break;
    case 'Escape': // Esc键
      // 打开/关闭菜单
      if (showMenu.value) {
        hideGameMenu();
      } else {
        showGameMenu();
      }
      break;
    case 'h': // H键
    case 'H':
      // 打开帮助面板
      if (tutorialSystem.value) {
        tutorialSystem.value.toggleHelpPanel();
      }
      break;
  }
};

// 方法
const formatNumber = (num) => {
  return num.toLocaleString('zh-CN');
};

// 显示事件
const showEvent = (event) => {
  if (!event || !eventModal.value) return;

  eventModal.value.showEvent(event);

  // 尝试触发教程事件
  try {
    if (typeof gameCoreStore.triggerTutorialEvent === 'function') {
      gameCoreStore.triggerTutorialEvent('tutorial_trading');
    } else {
      console.warn('triggerTutorialEvent方法不存在');
    }
  } catch (error) {
    handleError(error, 'GameView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('触发教程事件时出错:', error);
  }
};

// 触发连锁事件
const triggerNextEvent = (eventId) => {
  if (!eventId) return;

  // 延迟一点时间再触发下一个事件，使UI有时间更新
  setTimeout(() => {
    gameCoreStore.triggerSpecificEvent(eventId);
  }, 500);
};

// 进入下一周
const advanceWeek = () => {
  if (gameCoreStore.advanceWeek()) {
    // 不需要再次调用generateRandomEvent，因为advanceWeek方法中已经调用了
    // gameCoreStore.generateRandomEvent();

    // 检查是否有活跃事件需要显示
    checkActiveEvents();
  }
};

const checkActiveEvents = () => {
  // 如果游戏已结束，不检查事件
  if (gameCoreStore.gameOver) {
    console.log('GameView - 游戏已结束，跳过事件检查');
    return;
  }

  console.log('GameView - 检查活跃事件');

  // 检查事件存储中是否有活跃事件
  const eventStore = useEventStore();
  if (eventStore.activeEvent) {
    console.log('GameView - 在EventStore中发现活跃事件:', eventStore.activeEvent.id, eventStore.activeEvent.title);

    // 显示事件对话框
    nextTick(() => {
      if (eventModal.value) {
        console.log('GameView - 显示EventStore中的活跃事件');
        eventModal.value.showEvent(eventStore.activeEvent);
      } else {
        console.error('GameView - 事件对话框组件未找到');
      }
    });
    return;
  }

  // 如果游戏已结束，不检查GameCore中的事件
  if (gameCoreStore.gameOver) {
    console.log('GameView - 游戏已结束，跳过GameCore事件检查');
    return;
  }

  // 检查游戏核心存储中是否有活跃事件
  console.log('GameView - 检查GameCore中的活跃事件队列:', gameCoreStore.activeEvents?.length || 0);
  if (gameCoreStore.activeEvents && gameCoreStore.activeEvents.length > 0) {
    // 获取第一个事件并显示
    const event = gameCoreStore.activeEvents[0];
    console.log('GameView - 在GameCore中发现活跃事件:', event.id, event.title);
    gameCoreStore.activeEvents.shift(); // 从队列移除

    // 显示事件对话框
    nextTick(() => {
      if (eventModal.value) {
        console.log('GameView - 显示GameCore中的活跃事件');

        // 确保事件模态框组件已经准备好
        if (typeof eventModal.value.showEvent !== 'function') {
          console.error('GameView - 事件模态框组件没有showEvent方法');
          return;
        }

        // 确保事件对象有必要的属性
        if (!event.options || !Array.isArray(event.options) || event.options.length === 0) {
          console.warn('GameView - 事件没有选项，添加默认选项');
          event.options = [
            {
              id: 'default_option',
              text: '确认',
              result: '你确认了这个事件。',
              effects: {}
            }
          ];
        }

        // 显示事件
        try {
          eventModal.value.showEvent(event);
          console.log('GameView - 事件显示请求已发送');
        } catch (error) {
          console.error('GameView - 显示事件时出错:', error);
        }
      } else {
        console.error('GameView - 事件对话框组件未找到');
      }
    });
  } else {
    console.log('GameView - 没有活跃事件需要显示');
  }
};

const showGameMenu = () => {
  showMenu.value = true;
};

const hideGameMenu = () => {
  showMenu.value = false;
};

const saveGame = () => {
  showMenu.value = false;
  showSaveDialog.value = true;
  // 默认使用当前日期作为存档名
  const now = new Date();
  saveName.value = `存档-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

  // 等待DOM更新后，聚焦输入框
  nextTick(() => {
    if (saveInput.value) {
      saveInput.value.focus();
      saveInput.value.select(); // 选择全部文字，方便用户直接修改
    }
  });
};

const confirmSave = async () => {
  if (!saveName.value) return;

  try {
    // 使用正确的保存方法 - saveStore.saveGame
    const saveStore = useSaveStore();
    const result = await saveStore.saveGame(saveName.value);

    if (result.success) {
      showSaveDialog.value = false;
    } else {
      uiStore.showToast({
        type: 'error',
        message: '保存游戏失败',
        duration: 3000
      });
    }
  } catch (err) {
    handleError(err, 'GameView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('保存游戏时出错:', err);
    uiStore.showToast({
      type: 'error',
      message: '保存游戏时出错: ' + (err.message || '未知错误'),
      duration: 3000
    });
  }
};

const cancelSave = () => {
  showSaveDialog.value = false;
  saveName.value = '';
};

const goToMainMenu = () => {
  router.push('/');
};

const dismissNotification = (id) => {
  gameCoreStore.notifications = gameCoreStore.notifications.filter(n => n.id !== id);
};

// 获取地点名称
const getLocationName = (locationId) => {
  const location = gameCoreStore.locations.find(loc => loc.id === locationId);
  return location ? location.name : '未知地点';
};

// 生成游戏结束建议
const generateGameEndSuggestions = () => {
  const suggestions = [];

  // 根据游戏结果生成建议
  if (gameCoreStore.gameResult?.endReason === 'bankruptcy') {
    suggestions.push('尝试减少债务，避免过度借贷');
    suggestions.push('关注商品价格趋势，避免在高价时购入');
  } else if (gameCoreStore.gameResult?.endReason === 'timeLimit') {
    suggestions.push('尝试更频繁地交易，增加交易量');
    suggestions.push('关注特色商品，它们通常有更大的利润空间');
  }

  // 根据交易数据生成建议
  if ((gameCoreStore.player.statistics.totalProfit || 0) / (gameCoreStore.player.statistics.transactionCount || 1) < 1000) {
    suggestions.push('提高每笔交易的平均利润，关注价格波动较大的商品');
  }

  // 根据地点访问数据生成建议
  const locationVisits = gameCoreStore.player.statistics.locationVisits || {};
  const visitCounts = Object.values(locationVisits);
  if (visitCounts.length > 0 && Math.max(...visitCounts) > 3 * Math.min(...visitCounts)) {
    suggestions.push('尝试探索更多不同的地点，每个地点都有独特的商品优势');
  }

  // 如果建议太少，添加一些通用建议
  if (suggestions.length < 3) {
    suggestions.push('关注市场趋势，在低价时购入，高价时卖出');
    suggestions.push('合理利用贷款，但要注意控制债务比例');
    suggestions.push('积极参与事件选择，可能带来意外收益');
  }

  return suggestions.slice(0, 5); // 最多返回5条建议
};

// 添加继续游戏方法
const continueFromVictory = () => {
  // 隐藏结算页面
  showGameOverDialog.value = false;
  // 通知游戏核心继续游戏
  gameCoreStore.continueGame();
};

// 重新开始游戏
const restartGame = () => {
  // 先重置事件系统
  const eventStore = useEventStore();
  eventStore.resetEvents();

  // 创建一个新游戏
  gameCoreStore.startNewGame(player.value.name);
  showGameOverDialog.value = false;

  // 清除所有活跃事件
  eventStore.activeEvent = null;
  eventStore.activeEvents = [];
};

// 加载游戏资源
const loadGameResources = async () => {
 try {
    // 定义加载步骤
    const loadSteps = [
      { name: '游戏核心', weight: 20, action: () => Promise.resolve(console.log('游戏核心已准备就绪')) },
      { name: '玩家数据', weight: 20, action: () => playerStore.initializePlayer(player.value.name) },
      { name: '市场数据', weight: 25, action: () => marketStore.initializeMarket() },
      { name: '事件系统', weight: 15, action: () => eventStore.initializeEvents() },
      { name: '教程事件', weight: 10, action: () => Promise.resolve(checkForTutorialEvents()) },
      { name: '游戏界面', weight: 10, action: () => new Promise(resolve => setTimeout(resolve, 200)) }
    ];

    let progressSoFar = 5; // 起始进度

    // 依次执行每个加载步骤
    for (const step of loadSteps) {
      loadingStatus.value = `加载中: ${step.name}`;
      console.log(`加载步骤: ${step.name}`);

      try {
        await step.action();
        progressSoFar += step.weight;
        loadingProgress.value = progressSoFar;
      } catch (error) {
        handleError(error, 'GameView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        console.error(`加载失败: ${step.name}`, error);
        // 继续执行下一步，不中断整个加载流程
      }
    }

    // 完成加载
    loadingStatus.value = '加载完成！';
    loadingProgress.value = 100;

    // 延迟一小段时间后隐藏加载界面
    setTimeout(() => {
      isLoading.value = false;
      console.log('游戏资源加载完成，隐藏加载界面');

      // 检查是否有活跃事件
      checkActiveEvents();
    }, 500);
  } catch (error) {
    console.error('加载游戏资源失败:', error);
    loadingStatus.value = '加载失败，请刷新页面重试';
  }
};

// 检查是否需要显示教程事件
const checkForTutorialEvents = () => {
  console.log('检查教程事件');
  try {
    if (tutorialSystem.value) {
      console.log('检查教程提示系统');
      return true;
    }

    // 触发初始教程事件
    if (gameCoreStore.currentWeek === 1 && typeof eventStore.triggerTutorialEvent === 'function') {
      console.log('尝试触发初始教程事件');
      eventStore.triggerTutorialEvent('tutorial_trading');
    }

    return true;
  } catch (error) {
    handleError(error, 'GameView (views)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
    console.warn('检查教程事件时出错:', error);
    return false;
  }
};

// 加载完成回调
const onLoadingComplete = () => {
  console.log('GameView - 加载完成回调');
  isLoading.value = false;

  // 检查是否有活跃事件
  checkActiveEvents();
};

// 处理页面关闭前的自动保存
const handleBeforeUnload = async (event) => {
  // 如果游戏已经开始但还未结束
  if (gameCoreStore.gameStarted && !gameCoreStore.gameOver) {
    // 获取设置
    const settings = settingsStore.gameSettings;

    // 检查是否开启自动保存功能
    if (settings && settings.autoSaveEnabled) {
      try {
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const saveName = `autoSave_exit_W${gameCoreStore.currentWeek}_${timestamp}`;

        // 进行保存
        await gameCoreStore.saveGame(saveName, true);
      } catch (error) {
        handleError(error, 'GameView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        console.error('退出时自动保存失败:', error);
      }
    }
  }
};

// 处理交易提示
const handleTransactionToast = (data) => {
  transactionToastMessage.value = data.message;
  transactionToastClass.value = data.class;
  transactionToastIcon.value = data.icon;

  // 重置之前的提示（如果存在）
  showTransactionToast.value = false;

  // 延迟一帧后显示，确保动画正确播放
  requestAnimationFrame(() => {
    showTransactionToast.value = true;

    // 弹窗将通过CSS动画自动淡出
    setTimeout(() => {
      showTransactionToast.value = false;
    }, 3000);
  });
};
</script>

<style scoped>
  /* 游戏视图容器 */
.game-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f0f2f5;
  color: #333;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  padding: 0; /* 移除水平内边距 */
}

/* 顶部信息栏 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: linear-gradient(135deg, #2980b9, #3498db);
  color: white;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
  width: 100%; /* 确保宽度为100% */
  margin: 0; /* 移除外边距 */
}

/* 添加一个背景装饰效果 */
.game-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 移除无效的背景图像 */
  background: rgba(0, 0, 0, 0.02);
  background-size: cover;
  opacity: 0.05;
  z-index: -1;
}

.left-info {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}

.right-info {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.week-indicator {
  display: flex;
  align-items: center;
    gap: 10px;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.week-indicator:hover {
  background-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}

.week-label {
    font-weight: 500;
  opacity: 0.8;
  font-size: 0.9rem;
}

.week-value {
  font-weight: 700;
    background-color: rgba(255, 255, 255, 0.2);
  padding: 3px 12px;
    border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
}

.progress {
  height: 100%;
  background-color: #2ecc71;
    border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 4px rgba(46, 204, 113, 0.5);
}

.menu-button {
  background-color: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
    float: right;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}

.menu-icon {
  font-size: 1.2rem;
  line-height: 1;
}

.menu-button:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.15);
}

.menu-button:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

/* 通知区域 */
.notifications-container {
  padding: 10px 24px; /* 与顶部导航栏的左右内边距保持一致 */
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  width: 100%; /* 确保宽度为100% */
}

.notification {
    padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    animation: slideIn 0.3s ease-out;
  }

  .notification:last-child {
    margin-bottom: 0;
  }

  .notification.info {
    background-color: #d1ecf1;
    border-left: 4px solid #17a2b8;
}

.notification.success {
  background-color: #d4edda;
  border-left: 4px solid #28a745;
}

  .notification.warning {
    background-color: #fff3cd;
    border-left: 4px solid #ffc107;
  }

.notification.error {
  background-color: #f8d7da;
  border-left: 4px solid #dc3545;
}

  .close-btn {
  background: none;
  border: none;
    font-size: 1.2rem;
  cursor: pointer;
    color: #6c757d;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #343a40;
}

  @keyframes slideIn {
  from {
      transform: translateY(-20px);
    opacity: 0;
  }
  to {
      transform: translateY(0);
    opacity: 1;
  }
}

/* 主游戏区域 */
.game-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  padding: 16px;
  gap: 16px;
  align-items: stretch; /* 拉伸对齐，确保左右两侧高度一致 */
  height: calc(100vh - 120px); /* 设置合适的高度，减去头部和其他元素的高度 */
  background-color: #f0f2f5; /* 设置背景色 */
  border-radius: 16px; /* 设置整体圆角 */
  margin: 0; /* 移除左右边距 */
  width: 100%; /* 确保宽度为100% */
}

/* 左侧面板 */
.left-panel {
    width: 280px;
    background-color: #f8f9fa;
    border-right: 1px solid #e9ecef;
    padding: 16px;
  display: flex;
  flex-direction: column;
    gap: 18px; /* 增加间距 */
    overflow-y: auto; /* 添加垂直滚动条 */
    height: 100%; /* 确保占满整个高度 */
    scrollbar-width: thin; /* Firefox 滚动条样式 */
    scrollbar-color: #cbd5e0 #f8f9fa; /* Firefox 滚动条颜色 */
    border-radius: 12px; /* 四周都添加圆角 */
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08); /* 添加阴影效果 */
    margin: 4px; /* 添加外边距，确保圆角效果可见 */
    min-height: calc(100vh - 140px); /* 设置最小高度，与右侧内容区域保持一致 */
  }

  /* 左侧面板滚动条样式 (Webkit浏览器) */
  .left-panel::-webkit-scrollbar {
    width: 6px;
  }

  .left-panel::-webkit-scrollbar-track {
    background: #f8f9fa;
  }

  .left-panel::-webkit-scrollbar-thumb {
    background-color: #cbd5e0;
    border-radius: 4px;
  }

  .mini-inventory {
    background-color: #f0f8ff; /* 与玩家信息卡片背景色一致 */
    border-radius: 12px; /* 增加圆角 */
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08); /* 增强阴影效果 */
    padding: 16px;
    display: flex;
    flex-direction: column;
    height: auto; /* 自动高度 */
    max-height: 400px; /* 设置合理的最大高度 */
    flex: 1; /* 占用剩余空间 */
    overflow: hidden; /* 防止整体溢出 */
    transition: box-shadow 0.3s ease;
  }

  .mini-inventory:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
  }

  .mini-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    /* 移除了分割线 */
  }

  .mini-title {
    font-size: 1.2rem;
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
  }

  .view-all-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.2rem;
    color: #3498db;
    transition: color 0.2s;
  }

  .view-all-btn:hover {
    color: #2980b9;
  }

  .inventory-items {
    height: auto; /* 自动高度 */
    max-height: 300px; /* 设置最大高度 */
    border-radius: 4px;
    margin-bottom: 8px; /* 底部间距 */
    overflow-y: auto; /* 添加垂直滚动条 */
    scrollbar-width: thin; /* Firefox 滚动条样式 */
    scrollbar-color: #cbd5e0 #f8f9fa; /* Firefox 滚动条颜色 */
  }

  /* 自定义滚动条样式 (Webkit浏览器) */
  .inventory-items::-webkit-scrollbar {
    width: 6px;
  }

  .inventory-items::-webkit-scrollbar-track {
    background: #f8f9fa;
  }

  .inventory-items::-webkit-scrollbar-thumb {
    background-color: #cbd5e0;
    border-radius: 4px;
  }

  .empty-inventory {
    color: #6c757d;
    font-style: italic;
    text-align: center;
    padding: 12px 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .inventory-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px;
  }

  .inventory-item {
    padding: 10px 12px; /* 增加内边距 */
    border-radius: 10px; /* 增加圆角 */
    background-color: #fff;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3px; /* 增加底部间距 */
  }

  .inventory-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0,0,0,0.08);
  }

  .inventory-item:hover {
    background-color: #e9ecef;
  }

  .item-name {
    font-weight: 500;
    font-size: 0.9rem;
    color: #343a40;
    margin: 0;
  }

  .item-details {
    display: flex;
    align-items: center;
    gap: 24px; /* 增加间距 */
    font-size: 0.85rem;
    color: #495057;
  }

  .item-quantity {
    font-weight: 600;
    color: #495057;
    min-width: 30px; /* 设置最小宽度 */
    text-align: left; /* 左对齐 */
  }

  .item-price {
    font-weight: bold;
    color: #2c9f2c;
    min-width: 45px; /* 设置最小宽度 */
    text-align: right; /* 右对齐 */
  }

  .more-items {
    text-align: center;
    font-size: 0.8rem;
    color: #6c757d;
    padding: 4px 0;
  }

  /* 移除了容量显示相关样式 */

.actions-panel {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

.action-button {
  background-color: #3498db;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.action-button:hover:not(:disabled) {
  background-color: #2980b9;
}

.action-button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
  color: #7f8c8d;
}

.next-week-icon {
  font-size: 1.2rem;
}

/* 中央内容区域 */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 保持外层隐藏溢出 */
  background-color: #fff;
  border-radius: 12px; /* 增加圆角与左侧面板一致 */
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08); /* 增强阴影效果与左侧面板一致 */
  height: 100%; /* 确保占满整个高度 */
  min-height: calc(100vh - 140px); /* 设置最小高度，与左侧面板保持一致 */
  margin: 4px; /* 添加外边距，确保圆角效果可见 */
  transition: box-shadow 0.3s ease;
}

.main-content:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.tab-buttons {
  display: flex;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
    padding: 0 16px;
}

.tab-button {
    padding: 12px 20px;
  background: none;
  border: none;
    border-bottom: 3px solid transparent;
  font-weight: 500;
    color: #6c757d;
    cursor: pointer;
    transition: all 0.2s ease;
  position: relative;
    overflow: hidden;
  }

  .tab-button:hover {
    color: #495057;
    background-color: rgba(0, 0, 0, 0.03);
}

.tab-button.active {
  color: #3498db;
    border-bottom-color: #3498db;
}

.tab-button.active::after {
  content: '';
  position: absolute;
    bottom: 0;
  left: 0;
    width: 100%;
    height: 3px;
  background-color: #3498db;
}

.tab-content {
  flex: 1;
  overflow-y: auto; /* 垂直方向滚动 */
    padding: 16px;
  height: 100%; /* 确保占满高度 */
  scrollbar-width: thin; /* Firefox 滚动条样式 */
  scrollbar-color: #cbd5e0 #f8f9fa; /* Firefox 滚动条颜色 */
}

/* 自定义滚动条样式 (Webkit浏览器) */
.tab-content::-webkit-scrollbar {
  width: 8px;
}

.tab-content::-webkit-scrollbar-track {
  background: #f8f9fa;
}

.tab-content::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 4px;
  }

  /* 标签页内容 */
  .market-tab, .inventory-tab, .houses-tab {
    min-height: 100%;
    height: 100%; /* 确保占满整个高度 */
    position: relative;
    display: flex; /* 使用flex布局 */
    flex-direction: column; /* 垂直方向排列 */
}

/* 对话框 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog-title {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.5rem;
  color: #2c3e50;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.menu-options {
  display: flex;
  flex-direction: column;
}

.menu-option {
  padding: 12px;
  margin-bottom: 10px;
  background-color: #f8f9fa;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.menu-option:hover {
  background-color: #e9ecef;
}

.save-form {
  display: flex;
  flex-direction: column;
}

.save-input {
  padding: 10px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.dialog-button.confirm {
  background-color: #3498db;
  color: white;
}

.dialog-button.confirm:hover:not(:disabled) {
  background-color: #2980b9;
}

.dialog-button.confirm:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.dialog-button.cancel {
  background-color: #f8f9fa;
  color: #333;
}

.dialog-button.cancel:hover {
  background-color: #e9ecef;
}

/* 游戏结束对话框 */
.game-over-dialog {
  max-width: 600px;
}

.game-result-header {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.game-score, .game-rank, .game-achievement {
  text-align: center;
}

.game-score .score-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: #3498db;
}

.game-score .score-label {
  font-size: 0.9rem;
  color: #555;
}

.game-rank {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
}

.game-rank.rank-s { color: #2ecc71; }
.game-rank.rank-a { color: #2980b9; }
.game-rank.rank-b { color: #f1c40f; }
.game-rank.rank-c { color: #e67e22; }
.game-rank.rank-d { color: #e74c3c; }
.game-rank.rank-e { color: #95a5a6; }

.game-achievement {
  display: flex;
  align-items: center;
  gap: 5px;
}

.game-achievement .achievement-badge {
  font-size: 1.5rem;
}

.game-achievement .achievement-name {
  font-size: 1rem;
  font-weight: bold;
  color: #2c3e50;
}

.game-stats {
  margin: 20px 0;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-bottom: 5px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  color: #3498db;
}

.stat-value.positive {
  color: #2ecc71;
}

.stat-value.negative {
  color: #e74c3c;
}

.purchased-houses {
  margin-top: 15px;
}

.purchased-houses h3 {
  margin-bottom: 10px;
  font-size: 1.1rem;
}

.houses-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.house-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

.house-item:last-child {
  border-bottom: none;
}

.house-name {
  flex-grow: 1;
  margin-right: 10px;
  font-weight: bold;
}

.house-price, .house-week {
  font-size: 0.9rem;
  color: #555;
}

.game-end-description {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
  font-size: 0.95rem;
  color: #555;
}

.game-end-description p {
  margin-bottom: 10px;
}

.game-end-description p:last-child {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .game-content {
    flex-direction: column;
  }

  .left-panel {
    width: 100%;
    padding: 10px;
  }
}

/* 在style块的末尾添加这些动画CSS */

/* 通用淡入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 缩放弹跳效果 - 用于菜单对话框 */
.zoom-bounce-enter-active {
  animation: zoom-bounce-in 0.5s;
}
.zoom-bounce-leave-active {
  animation: zoom-bounce-out 0.3s;
}
@keyframes zoom-bounce-in {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  70% {
    transform: scale(0.95);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes zoom-bounce-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.5);
    opacity: 0;
  }
}

/* 缩放弹跳效果 - 用于游戏结束对话框 */
.scale-bounce-enter-active {
  animation: scale-bounce-in 0.8s;
}
.scale-bounce-leave-active {
  animation: scale-bounce-out 0.4s;
}
@keyframes scale-bounce-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  60% {
    transform: scale(1.03);
    opacity: 1;
  }
  80% {
    transform: scale(0.97);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes scale-bounce-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

/* 菜单项动画 */
.menu-item-enter-active {
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transition-delay: calc(0.1s * var(--order));
}
.menu-item-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.menu-item-enter-from {
  opacity: 0;
  transform: translateY(15px);
}
.menu-item-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

/* 从下向上滑入效果 - 用于保存对话框 */
.slide-up-enter-active {
  animation: slide-up-in 0.4s;
}
.slide-up-leave-active {
  animation: slide-up-out 0.3s;
}
@keyframes slide-up-in {
  0% {
    transform: translateY(30px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes slide-up-out {
  0% {
    transform: translateY(0);
    opacity: 1;
  }
  100% {
    transform: translateY(30px);
    opacity: 0;
  }
}

/* 从左向右滑入效果 - 用于详细统计对话框 */
.slide-left-enter-active {
  animation: slide-left-in 0.4s;
}
.slide-left-leave-active {
  animation: slide-left-out 0.3s;
}
@keyframes slide-left-in {
  0% {
    transform: translateX(-50px);
    opacity: 0;
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes slide-left-out {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-50px);
    opacity: 0;
  }
}

/* 标签内容淡入淡出效果 */
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.tab-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* 通知动画 */
.notification-enter-active {
  animation: notification-in 0.5s ease-out;
}
.notification-leave-active {
  animation: notification-out 0.3s ease-in;
}
@keyframes notification-in {
  0% {
    transform: translateX(100%);
    opacity: 0;
  }
  60% {
    transform: translateX(-5%);
  }
  80% {
    transform: translateX(2%);
  }
  100% {
    transform: translateX(0);
    opacity: 1;
  }
}
@keyframes notification-out {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(110%);
    opacity: 0;
  }
}

/* 菜单图标样式 */
.menu-icon {
  display: inline-block;
  margin-right: 10px;
  font-size: 1.2em;
}

/* 改进通知样式 */
.notification {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 15px;
  margin-bottom: 10px;
  border-radius: 6px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  background-color: #fff;
  transition: all 0.3s ease;
  animation: notification-pulse 2s infinite alternate;
}

.notification-content {
  flex-grow: 1;
  padding-right: 10px;
}

@keyframes notification-pulse {
  0% {
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
  }
  100% {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.25);
  }
}

/* 为对话框添加阴影效果 */
.dialog {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25);
  border-radius: 10px;
  overflow: hidden;
}

/* 菜单选项悬停效果 */
.menu-option {
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.menu-option:hover {
  transform: translateX(5px);
  border-left-color: #3498db;
  background-color: #f8f9fa;
}

/* 游戏结束对话框样式 */
.game-over-overlay {
  padding: 0; /* 移除内边距 */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.75); /* 纯黑色半透明背景 */
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}

/* 移除game-over-frame相关样式 */

/* 结算动画效果 */
.scale-bounce-enter-active {
  animation: scale-bounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); /* 添加弹性曲线 */
}

.scale-bounce-leave-active {
  animation: scale-bounce 0.4s cubic-bezier(0.6, -0.28, 0.735, 0.045) reverse; /* 添加弹性曲线 */
}

@keyframes scale-bounce {
  0% { transform: scale(0.8); opacity: 0; }
  70% { transform: scale(1.03); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

/* 交易提示样式 */
.transaction-toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 10px;
  background-color: rgba(44, 62, 80, 0.9);
  color: white;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  z-index: 9999; /* 提高z-index确保在最上层 */
  min-width: 220px;
  backdrop-filter: blur(4px);
  animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  text-align: center;
  overflow: hidden;
  pointer-events: none; /* 防止提示框影响下方元素的交互 */
}

/* 进度条动画 */
.toast-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: rgba(255, 255, 255, 0.3);
}

.toast-progress-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: rgba(255, 255, 255, 0.7);
  animation: progress 3s linear forwards;
}

@keyframes progress {
  from { width: 100%; }
  to { width: 0%; }
}

@keyframes toast-in {
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

.toast-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.toast-icon {
  font-size: 18px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.toast-message {
  font-weight: 500;
  letter-spacing: 0.2px;
}

.purchase-success {
  border-top: 3px solid #2ecc71;
}

.purchase-success .toast-icon {
  background-color: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.purchase-failed {
  border-top: 3px solid #e74c3c;
}

.purchase-failed .toast-icon {
  background-color: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

.sale-success {
  border-top: 3px solid #3498db;
}

.sale-success .toast-icon {
  background-color: rgba(52, 152, 219, 0.2);
  color: #3498db;
}

.location-change {
  border-top: 3px solid #f39c12;
}

.location-change .toast-icon {
  background-color: rgba(243, 156, 18, 0.2);
  color: #f39c12;
}
</style>
