<template>
  <div class="floating-dev-tools" :class="{ 'minimized': isMinimized }" :style="positionStyle">
    <!-- 标题栏 - 可拖动区域 -->
    <div class="tool-header" @mousedown="startDrag">
      <h3>游戏开发工具</h3>
      <div class="header-buttons">
        <button class="minimize-btn" @click="toggleMinimize">{{ isMinimized ? '↗' : '↘' }}</button>
        <button class="close-btn" @click="closeTools">✕</button>
      </div>
    </div>

    <!-- 工具内容区域 -->
    <div class="tool-content" v-show="!isMinimized">
      <!-- 选项卡 -->
      <div class="tab-buttons">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="{ 'active': activeTab === tab.id }"
          class="tab-btn"
        >
          {{ tab.name }}
        </button>
      </div>

      <!-- 基础工具选项卡 -->
      <div v-if="activeTab === 'basic'" class="tab-panel">
        <div class="tool-group">
          <h4>玩家资金</h4>
          <div class="input-group">
            <input type="number" v-model.number="moneyAmount" placeholder="金额" />
            <button @click="addMoney" class="action-button">增加</button>
            <button @click="setMoney" class="action-button">设置</button>
          </div>
        </div>

        <div class="tool-group">
          <h4>玩家债务</h4>
          <div class="input-group">
            <input type="number" v-model.number="debtAmount" placeholder="债务" />
            <button @click="setDebt" class="action-button">设置</button>
          </div>
        </div>

        <div class="tool-group">
          <h4>游戏周数</h4>
          <div class="input-group">
            <button @click="advanceWeek" class="action-button">+1周</button>
            <button @click="advanceMultipleWeeks(5)" class="action-button">+5周</button>
            <input type="number" v-model.number="weekToSet" min="1" :max="isEndlessMode ? 999999 : gameStore.maxWeeks" placeholder="周数" />
            <button @click="setCurrentWeek" class="action-button">设置</button>
          </div>
        </div>
      </div>

      <!-- 库存工具选项卡 -->
      <div v-if="activeTab === 'inventory'" class="tab-panel">
        <div class="tool-group">
          <h4>背包容量</h4>
          <div class="input-group">
            <input type="number" v-model.number="capacityValue" placeholder="容量" min="1" />
            <button @click="setCapacity" class="action-button">设置</button>
          </div>
        </div>

        <div class="tool-group">
          <h4>库存操作</h4>
          <div class="input-group">
            <button @click="clearInventory" class="action-button warning">清空库存</button>
            <input type="number" v-model.number="randomItemsCount" placeholder="物品数量" min="1" max="10" />
            <button @click="addRandomItems" class="action-button">添加随机物品</button>
          </div>
        </div>
      </div>

      <!-- 新增：市场操作选项卡 -->
      <div v-if="activeTab === 'market'" class="tab-panel">
        <div class="tool-group">
          <h4>全局市场修正</h4>
          <div class="input-group">
            <input type="number" v-model.number="priceModifier" step="0.1" min="0.5" max="2.0" placeholder="修正值" />
            <input type="number" v-model.number="marketModifierDuration" min="1" max="10" placeholder="持续周数" />
            <button @click="applyGlobalModifier" class="action-button">应用全局修正</button>
          </div>
        </div>

        <div class="tool-group">
          <h4>商品分类修正</h4>
          <div class="input-group">
            <select v-model="selectedCategory">
              <option value="">-- 选择分类 --</option>
              <option v-for="category in availableCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            <input type="number" v-model.number="priceModifier" step="0.1" min="0.5" max="2.0" placeholder="修正值" />
            <button @click="applyCategoryModifier" class="action-button">应用修正</button>
          </div>
        </div>

        <div class="tool-group">
          <h4>单个商品修正</h4>
          <div class="input-group">
            <select v-model="selectedProduct">
              <option value="">-- 选择商品 --</option>
              <option v-for="product in availableProducts" :key="product.id" :value="product.id">
                {{ product.name }}
              </option>
            </select>
            <input type="number" v-model.number="priceModifier" step="0.1" min="0.5" max="2.0" placeholder="修正值" />
            <button @click="applyProductPriceModifier" class="action-button">应用修正</button>
          </div>
        </div>

        <div class="tool-group">
          <div class="input-group">
            <button @click="refreshMarket" class="action-button">刷新市场价格</button>
          </div>
        </div>
      </div>

      <!-- 新增：房屋操作选项卡 -->
      <div v-if="activeTab === 'house'" class="tab-panel">
        <div class="tool-group">
          <h4>房产操作</h4>
          <div class="house-list">
            <div v-if="availableHouses.length === 0" class="empty-message">
              无可用房产
            </div>
            <div v-else v-for="house in availableHouses" :key="house.id" class="house-item">
              <div class="house-info">
                <div class="house-name">{{ house.name }}</div>
                <div class="house-price">¥{{ formatNumber(house.price) }}</div>
              </div>
              <button @click="() => { selectedHouse = house.id; buySelectedHouse(); }" class="action-button">
                购买
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 新增：事件触发选项卡 -->
      <div v-if="activeTab === 'events'" class="tab-panel">
        <div class="tool-group">
          <h4>触发事件</h4>
          <div class="event-list">
            <div v-for="event in availableEvents" :key="event.id" class="event-item">
              <div class="event-info">
                <div class="event-name">{{ event.name }}</div>
                <div class="event-desc">{{ event.description }}</div>
              </div>
              <button
                @click="() => { selectedEvent = event.id; triggerSelectedEvent(); }"
                class="action-button"
              >
                触发
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 新增：存档操作选项卡 -->
      <div v-if="activeTab === 'save'" class="tab-panel">
        <div class="tool-group">
          <h4>快速保存</h4>
          <div class="input-group">
            <input type="text" v-model="saveGameName" placeholder="存档名称" />
            <button @click="quickSaveGame" class="action-button">保存游戏</button>
          </div>
        </div>

        <div class="tool-group">
          <h4>存档列表</h4>
          <button @click="loadGameList" class="action-button">刷新列表</button>

          <div class="save-list">
            <div v-if="savedGames.length === 0" class="empty-message">
              无可用存档
            </div>
            <div v-else v-for="save in savedGames" :key="save.id" class="save-item">
              <div class="save-info">
                <div class="save-name">{{ save.name }}</div>
                <div class="save-date">{{ new Date(save.date).toLocaleString() }}</div>
              </div>
              <button @click="() => loadSavedGame(save.id)" class="action-button">
                加载
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 状态面板选项卡 -->
      <div v-if="activeTab === 'status'" class="tab-panel">
        <div class="tool-group">
          <h4>游戏状态</h4>
          <div class="status-info">
            <div class="status-row">
              <span class="status-label">当前周数:</span>
              <span class="status-value">{{ gameStore.currentWeek }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">资金:</span>
              <span class="status-value">¥{{ formatNumber(gameStore.player.money) }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">债务:</span>
              <span class="status-value">¥{{ formatNumber(gameStore.player.debt) }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">库存用量:</span>
              <span class="status-value">{{ gameStore.player.inventoryUsed || 0 }}/{{ gameStore.player.capacity || 100 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 调整大小手柄 -->
    <div class="resize-handle" @mousedown="startResize" v-show="!isMinimized"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useGameStore } from '@/stores';
import { usePlayerStore } from '@/stores/player';
import { useMarketStore } from '@/stores/market';
import { useInventoryActions } from '@/stores/player/inventoryActions';
import { useEventStore } from '@/stores/events'; // 新增导入
import { useEventActions } from '@/stores/events/eventActions'; // 新增导入
import { formatNumber } from '@/infrastructure/utils';

// 状态
const gameStore = useGameStore();
const isMinimized = ref(false);
const posX = ref(20);
const posY = ref(80);
const width = ref(320);
const height = ref(400);
const activeTab = ref('basic');
const isDragging = ref(false);
const isResizing = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const resizeStartWidth = ref(0);
const resizeStartHeight = ref(0);

// 工具状态
const moneyAmount = ref(1000);
const debtAmount = ref(0);
const weekToSet = ref(1);
const capacityValue = ref(100);
const randomItemsCount = ref(1);

// 新增：市场相关状态
const selectedProduct = ref(null);
const priceModifier = ref(1.0);
const selectedCategory = ref(null);
const marketModifierDuration = ref(3);

// 新增：房屋相关状态
const selectedHouse = ref(null);

// 新增：事件相关状态
const selectedEvent = ref(null);
const eventParams = ref({});

// 新增：存档相关状态
const saveGameName = ref('快速存档');
const savedGames = ref([]);

// 选项卡定义
const tabs = [
  { id: 'basic', name: '基础' },
  { id: 'inventory', name: '库存' },
  { id: 'market', name: '市场' },
  { id: 'house', name: '房产' },
  { id: 'events', name: '事件' },
  { id: 'status', name: '状态' },
  { id: 'save', name: '存档' },
];

// 计算属性
const positionStyle = computed(() => {
  return {
    left: `${posX.value}px`,
    top: `${posY.value}px`,
    width: `${width.value}px`,
    height: isMinimized.value ? 'auto' : `${height.value}px`,
  };
});

const currentPlayer = computed(() => playerStore.player);
const isEndlessMode = computed(() => gameStore.isEndlessMode);

// 方法
// 拖动相关
const startDrag = (e) => {
  // 忽略非左键点击
  if (e.button !== 0) return;

  isDragging.value = true;
  dragStartX.value = e.clientX - posX.value;
  dragStartY.value = e.clientY - posY.value;

  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);

  // 防止事件冒泡
  e.preventDefault();
};

const onDrag = (e) => {
  if (isDragging.value) {
    posX.value = e.clientX - dragStartX.value;
    posY.value = e.clientY - dragStartY.value;

    // 确保不会拖出屏幕
    posX.value = Math.max(0, Math.min(window.innerWidth - width.value, posX.value));
    posY.value = Math.max(0, Math.min(window.innerHeight - 40, posY.value));
  }
};

const stopDrag = () => {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
};

// 调整大小相关
const startResize = (e) => {
  isResizing.value = true;
  resizeStartWidth.value = width.value;
  resizeStartHeight.value = height.value;
  dragStartX.value = e.clientX;
  dragStartY.value = e.clientY;

  document.addEventListener('mousemove', onResize);
  document.addEventListener('mouseup', stopResize);

  e.preventDefault();
};

const onResize = (e) => {
  if (isResizing.value) {
    // 计算新尺寸
    const newWidth = resizeStartWidth.value + (e.clientX - dragStartX.value);
    const newHeight = resizeStartHeight.value + (e.clientY - dragStartY.value);

    // 限制最小尺寸
    width.value = Math.max(300, newWidth);
    height.value = Math.max(200, newHeight);
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
};

// 窗口操作
const toggleMinimize = () => {
  isMinimized.value = !isMinimized.value;
};

const closeTools = () => {
  // 发送事件通知父组件关闭工具
  const event = new CustomEvent('close-dev-tools');
  window.dispatchEvent(event);
};

// 工具功能
const addMoney = () => {
  if (moneyAmount.value) {
    gameStore.player.money += moneyAmount.value;
  }
};

const setMoney = () => {
  if (moneyAmount.value !== null && moneyAmount.value >= 0) {
    gameStore.player.money = moneyAmount.value;
  }
};

const setDebt = () => {
  if (debtAmount.value !== null && debtAmount.value >= 0) {
    gameStore.player.debt = debtAmount.value;
  }
};

const advanceWeek = () => {
  gameStore.advanceWeek();
};

const advanceMultipleWeeks = (weeks) => {
  for (let i = 0; i < weeks; i++) {
    if (!gameStore.gameOver) {
      gameStore.advanceWeek();
    } else {
      break;
    }
  }
};

// 周数操作
const setCurrentWeek = () => {
  if (weekToSet.value !== null && weekToSet.value >= 1 && 
      (isEndlessMode.value || weekToSet.value <= gameStore.maxWeeks)) {
    gameStore.currentWeek = weekToSet.value;
    toast.success(`已将当前周数设置为 ${weekToSet.value}`);
  } else {
    toast.error('无效的周数值');
  }
};

const setCapacity = () => {
  if (capacityValue.value !== null && capacityValue.value > 0) {
    gameStore.player.capacity = capacityValue.value;
  }
};

const clearInventory = () => {
  gameStore.player.inventory = [];
  gameStore.player.inventoryUsed = 0;
};

const addRandomItems = () => {
  const count = randomItemsCount.value;
  if (count < 1) return;

  // 获取所有产品
  const availableProducts = gameStore.products;
  if (!availableProducts || availableProducts.length === 0) return;

  // 随机选择一个产品
  const randomIndex = Math.floor(Math.random() * availableProducts.length);
  const randomProduct = availableProducts[randomIndex];

  // 使用库存操作API添加物品
  const inventoryActions = useInventoryActions();

  // 计算随机价格
  const minPrice = randomProduct.minPrice || randomProduct.basePrice * 0.7;
  const maxPrice = randomProduct.maxPrice || randomProduct.basePrice * 1.3;
  const randomPrice = Math.floor(minPrice + Math.random() * (maxPrice - minPrice));

  // 添加到库存
  inventoryActions.addToInventory(randomProduct, count, randomPrice);
};

const applyScenario = (scenario) => {
  // 已删除场景系统
};

// 新增：市场操作方法
const applyProductPriceModifier = () => {
  if (selectedProduct.value) {
    gameStore.addMarketModifier('product', {
      productId: selectedProduct.value,
      value: priceModifier.value,
      duration: marketModifierDuration.value
    });
  }
};

const applyCategoryModifier = () => {
  if (selectedCategory.value) {
    gameStore.addMarketModifier('category', {
      category: selectedCategory.value,
      value: priceModifier.value,
      duration: marketModifierDuration.value
    });
  }
};

const applyGlobalModifier = () => {
  gameStore.addMarketModifier('global', {
    value: priceModifier.value,
    duration: marketModifierDuration.value
  });
};

const refreshMarket = () => {
  // 强制刷新市场价格
  gameStore.updateMarketState(gameStore.currentWeek);
};

// 新增：房屋操作方法
const buySelectedHouse = () => {
  if (selectedHouse.value) {
    gameStore.buyHouse(selectedHouse.value);
  }
};

// 新增：事件触发方法
const triggerSelectedEvent = () => {
  if (selectedEvent.value) {
    // 使用eventActions中的触发特定事件方法
    const eventActions = useEventActions();
    const event = eventActions.triggerSpecificEvent(selectedEvent.value);

    if (event) {
      console.log('成功触发事件:', event.id, event.title);
    } else {
      console.error('触发事件失败:', selectedEvent.value);
    }
  }
};

// 新增：存档操作方法
const quickSaveGame = () => {
  gameStore.saveGame(saveGameName.value || '快速存档', false);
};

const loadSavedGame = (saveId) => {
  gameStore.loadGame(saveId);
};

const loadGameList = async () => {
  const saves = await gameStore.getSaves();
  savedGames.value = saves || [];
};

// 组件生命周期
onMounted(() => {
  // 初始化周数设置
  weekToSet.value = gameStore.currentWeek;
  debtAmount.value = gameStore.player.debt;
  capacityValue.value = gameStore.player.capacity;
});

// 新增：计算属性
const availableProducts = computed(() => {
  return gameStore.products || [];
});

const availableCategories = computed(() => {
  return ['DAILY', 'FOOD', 'ELECTRONICS', 'LUXURY', 'COLLECTIBLE'];
});

const availableHouses = computed(() => {
  return gameStore.houses || [];
});

const availableEvents = computed(() => {
  // 获取所有预定义事件
  try {
    // 使用事件store获取所有事件
    const eventStore = useEventStore();
    if (eventStore.eventSystem && eventStore.eventSystem.events) {
      return eventStore.eventSystem.events.map(event => ({
        id: event.id,
        name: event.title || event.id,
        description: event.description || ''
      }));
    }
  } catch (error) {
    console.error('获取事件列表失败:', error);
  }

  // 如果无法获取实际事件，返回示例事件
  return [
    { id: 'market_crash', name: '市场崩盘', description: '商品价格大幅下降' },
    { id: 'market_boom', name: '市场繁荣', description: '商品价格大幅上涨' },
    { id: 'debt_collector', name: '讨债人', description: '债务催收事件' },
    { id: 'lucky_find', name: '幸运发现', description: '获得随机奖励' }
  ];
});

onBeforeUnmount(() => {
  // 清理事件监听器
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('mousemove', onResize);
  document.removeEventListener('mouseup', stopResize);
});
</script>

<style scoped>
.floating-dev-tools {
  position: fixed;
  background-color: #f0f4f8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  z-index: 9999;
  font-size: 14px;
  border: 1px solid #cfd8dc;
  user-select: none;
  transition: height 0.2s ease;
  overflow: hidden;
}

.floating-dev-tools.minimized {
  height: auto !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to right, #4a6fa5, #5d8bc3);
  padding: 8px 12px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  cursor: move;
  color: white;
}

.tool-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.header-buttons {
  display: flex;
  gap: 8px;
}

.header-buttons button {
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.header-buttons button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.close-btn:hover {
  background-color: rgba(231, 76, 60, 0.7) !important;
}

.tool-content {
  padding: 10px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 12px;
}

.tab-btn {
  padding: 6px 12px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 13px;
  color: #4a5568;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #4a6fa5;
  border-bottom-color: #4a6fa5;
  font-weight: 600;
}

.tab-btn:hover:not(.active) {
  background-color: #edf2f7;
}

.tab-panel {
  padding: 10px;
  height: calc(100% - 50px);
  overflow-y: auto;
}

.tool-group {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #e2e8f0;
}

.tool-group h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #4a5568;
  font-weight: 600;
}

.input-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.input-group input {
  padding: 6px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  font-size: 13px;
  width: 80px;
}

.action-button {
  background-color: #4a6fa5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.action-button:hover {
  background-color: #3d5d8a;
}

.action-button.warning {
  background-color: #e53e3e;
}

.action-button.warning:hover {
  background-color: #c53030;
}

.resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 15px;
  height: 15px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, #a0aec0 50%, #a0aec0 60%, transparent 60%);
  border-bottom-right-radius: 8px;
}

/* 新增：房屋列表和事件列表样式 */
.house-list, .event-list, .save-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.house-item, .event-item, .save-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #edf2f7;
  border-radius: 4px;
  gap: 10px;
}

.house-info, .event-info, .save-info {
  flex: 1;
}

.house-name, .event-name, .save-name {
  font-weight: 600;
  font-size: 13px;
  color: #2d3748;
}

.house-price, .event-desc, .save-date {
  font-size: 12px;
  color: #718096;
  margin-top: 2px;
}

.empty-message {
  text-align: center;
  padding: 15px;
  color: #a0aec0;
  font-style: italic;
  background-color: #f7fafc;
  border-radius: 4px;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.status-label {
  font-weight: 600;
  color: #2d3748;
}

.status-value {
  color: #4a5568;
}
</style>
