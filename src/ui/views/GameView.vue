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
          <span class="label">{{ $t('game.week') }}:</span>
          <span class="value">{{ currentWeek }} / {{ maxWeeks }}</span>
          <div class="progress-bar">
            <div class="progress" :style="{ width: `${(currentWeek / maxWeeks) * 100}%` }"></div>
          </div>
        </div>
      </div>
      
      <div class="center-info">
        <h1 class="game-title">{{ $t('game.title') }}</h1>
      </div>
      
      <div class="right-info">
        <button class="menu-button" @click="showGameMenu">
          {{ $t('game.menu') }}
        </button>
      </div>
    </header>
    
    <!-- 通知区域 -->
    <div v-if="!isLoading && notifications.length > 0" class="notifications-container">
      <div 
        v-for="notification in notifications" 
        :key="notification.id" 
        class="notification"
        :class="notification.type"
      >
        {{ notification.message }}
        <button class="close-btn" @click="dismissNotification(notification.id)">×</button>
      </div>
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
          <!-- 市场标签页 -->
          <div v-if="activeTab === 'market'" class="market-tab">
            <Market />
          </div>
          
          <!-- 背包标签页 -->
          <div v-else-if="activeTab === 'inventory'" class="inventory-tab">
            <Inventory />
          </div>
          
          <!-- 房屋标签页 -->
          <div v-else-if="activeTab === 'houses'" class="houses-tab">
            <HouseMarket />
          </div>
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
    <div v-if="showMenu" class="dialog-overlay">
      <div class="dialog game-menu-dialog">
        <h2 class="dialog-title">{{ $t('gameMenu.title') }}</h2>
        <div class="menu-options">
          <button class="menu-option" @click="saveGame">{{ $t('gameMenu.save') }}</button>
          <button class="menu-option" @click="goToMainMenu">{{ $t('gameMenu.mainMenu') }}</button>
          <button class="menu-option" @click="hideGameMenu">{{ $t('gameMenu.continue') }}</button>
        </div>
      </div>
    </div>
    
    <!-- 保存游戏对话框 -->
    <div v-if="showSaveDialog" class="dialog-overlay">
      <div class="dialog save-dialog">
        <h2 class="dialog-title">{{ $t('saveDialog.title') }}</h2>
        <div class="save-form">
          <input 
            v-model="saveName" 
            type="text" 
            class="save-input" 
            :placeholder="$t('saveDialog.namePlaceholder')"
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
    </div>
    
    <!-- 游戏结束对话框 -->
    <div v-if="gameOver && showGameOverDialog" class="dialog-overlay">
      <GameOverView 
        :gameState="gameState"
        :player="player"
        :gameStats="gameResult"
        @return-to-main="goToMainMenu"
        @restart-game="restartGame"
        @show-detailed-stats="toggleDetailedStats"
      />
    </div>

    <!-- 详细统计对话框 -->
    <GameStatsDetail
      v-if="showDetailedStats"
      :show="showDetailedStats"
      :gameStats="gameResult"
      :player="player"
      :gameState="gameState"
      @close="toggleDetailedStats"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useGameCoreStore } from '@/stores/gameCore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';
import { usePlayerStore } from '@/stores/player';
import { useMarketStore } from '@/stores/market';
import { useEventStore } from '@/stores/events';

// 导入组件
import PlayerInfo from '@/ui/components/player/PlayerInfo.vue';
import Market from '@/ui/components/market/Market.vue';
import Inventory from '@/ui/components/player/Inventory.vue';
import HouseMarket from '@/ui/components/market/HouseMarket.vue';
import EventModal from '@/ui/components/common/EventModal.vue';
import GameOverView from '@/ui/views/GameOverView.vue';
import GameStatsDetail from '@/ui/components/player/GameStatsDetail.vue';
import TutorialSystem from '@/ui/components/common/TutorialSystem.vue';
import GameLoader from '@/ui/components/common/GameLoader.vue';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler'; // 导入GameLoader组件

const router = useRouter();
const gameCoreStore = useGameCoreStore(); // 游戏核心存储
const playerStore = usePlayerStore(); // 玩家存储
const marketStore = useMarketStore(); // 市场存储
const eventStore = useEventStore(); // 事件存储
const settingsStore = useSettingsStore();
const uiStore = useUiStore();
const { t } = useI18n();
const eventModal = ref(null);
const tutorialSystem = ref(null);

console.log('GameView组件初始化，游戏状态:', {
  gameStarted: gameCoreStore.gameStarted,
  currentWeek: gameCoreStore.currentWeek,
  playerInitialized: playerStore.initialized
});

// 游戏状态
const activeTab = ref('market');
const showMenu = ref(false);
const showSaveDialog = ref(false);
const showGameOverDialog = ref(false);
const saveName = ref('');
const showDetailedStats = ref(false);
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
const playerInventory = computed(() => playerStore.inventory || []);
const gameState = computed(() => ({
  currentWeek: currentWeek.value,
  maxWeeks: maxWeeks.value,
  gameOver: gameOver.value
}));

// 当游戏结束时显示结束对话框
watch(() => gameCoreStore.gameOver, (newValue) => {
  if (newValue) {
    nextTick(() => {
      showGameOverDialog.value = true;
    });
  }
});

// 组件挂载时
onMounted(() => {
  console.log('GameView组件挂载');
  
  // 初始化加载状态
  isLoading.value = true;
  loadingProgress.value = 0;
  
  // 检查是否为开发模式
  try {
    isDevelopmentMode.value = true; // 默认设为开发模式
    console.log('GameView - 当前模式: 开发模式');
  } catch (error) {
    console.warn('GameView - 无法检测环境模式:', error);
    isDevelopmentMode.value = true; // 默认为开发模式
  }
  
  // 检查游戏是否已经初始化
  if (!gameCoreStore.gameStarted) {
    console.log('游戏未初始化，尝试从本地存储获取玩家名称');
    const savedPlayerName = localStorage.getItem('lastPlayerName') || '玩家';
    console.log('获取到玩家名称:', savedPlayerName);
    
    // 设置玩家名称
    playerStore.name = savedPlayerName;
  }
  
  // 确保游戏不会在初始状态下显示为结束
  if (gameCoreStore.gameOver) {
    console.log('重置游戏结束状态');
    gameCoreStore.gameOver = false;
    showGameOverDialog.value = false;
  }
  
  // 加载游戏资源
  loadGameResources();
  
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeyDown);
  
  // 添加beforeunload事件监听
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // 设置定时器，定期检查是否有活跃事件需要显示
  setInterval(() => {
    checkActiveEvents();
  }, 2000); // 每2秒检查一次
});

onBeforeUnmount(() => {
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeyDown);
  
  // 移除关闭前保存事件
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

// 处理键盘快捷键
const handleKeyDown = (event) => {
  // 如果有模态框打开，不处理快捷键
  if (showMenu.value || showSaveDialog.value || showGameOverDialog.value || showDetailedStats.value) {
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
};

const confirmSave = async () => {
  if (!saveName.value) return;
  
  const success = await gameCoreStore.saveGame(saveName.value);
  if (success) {
    showSaveDialog.value = false;
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

// 切换详细统计视图
const toggleDetailedStats = () => {
  showDetailedStats.value = !showDetailedStats.value;
};

// 重新开始游戏
const restartGame = () => {
  // 创建一个新游戏
  gameCoreStore.startNewGame(player.value.name);
  showGameOverDialog.value = false;
};

// 加载游戏资源
const loadGameResources = async () => {
 try {
    // 定义加载步骤
    const loadSteps = [
      { name: '游戏核心', weight: 20, action: () => gameCoreStore.initializeGameCore() },
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
  padding: 0 4px; /* 添加水平内边距 */
}

/* 顶部信息栏 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
    padding: 10px 20px;
    background-color: #3498db;
    color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 10;
  }
  
  .left-info, .right-info {
    flex: 1;
  }
  
  .center-info {
    flex: 2;
    text-align: center;
  }
  
  .game-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: 1px;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
}

.week-indicator {
  display: flex;
  align-items: center;
    gap: 10px;
}

.week-indicator .label {
    font-weight: 500;
}

.week-indicator .value {
    font-weight: 600;
    background-color: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 12px;
}

.progress-bar {
  width: 100px;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #2ecc71;
    border-radius: 3px;
  transition: width 0.3s ease;
}

.menu-button {
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
    color: white;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
    transition: background-color 0.2s;
    float: right;
}

.menu-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 通知区域 */
.notifications-container {
    padding: 10px 20px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e9ecef;
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
  margin: 0 8px; /* 添加水平边距 */
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
</style> 