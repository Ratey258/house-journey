<template>
  <div class="dev-tools">
    <div class="header-with-back">
      <button class="back-button" @click="goBack">
        <span class="back-icon">←</span> 返回
      </button>
      <h1>开发工具</h1>
    </div>

    <div class="tool-section">
      <h2>价格系统测试</h2>
      <button @click="testPriceSystem" class="test-button">运行价格系统测试</button>
      <pre class="test-output" v-if="testResults">{{ testResults }}</pre>
    </div>

    <div class="tool-section">
      <h2>游戏操作</h2>

      <div class="tool-group">
        <h3>周数控制</h3>
        <div class="control-buttons">
          <button @click="advanceWeek" class="action-button">前进一周</button>
          <button @click="advanceMultipleWeeks(5)" class="action-button">前进5周</button>
          <button @click="advanceMultipleWeeks(10)" class="action-button">前进10周</button>
        </div>
      </div>

      <div class="tool-group">
        <h3>资金调整</h3>
        <div class="input-group">
          <input type="number" v-model.number="moneyAmount" placeholder="金额" />
          <button @click="addMoney" class="action-button">增加资金</button>
        </div>
      </div>

      <!-- 新增：玩家参数调整 -->
      <div class="tool-group">
        <h3>玩家参数调整</h3>
        <div class="input-group param-row">
          <label>当前资金:</label>
          <input type="number" v-model.number="playerParams.money" placeholder="资金" />
        </div>
        <div class="input-group param-row">
          <label>当前债务:</label>
          <input type="number" v-model.number="playerParams.debt" placeholder="债务" />
        </div>
        <div class="input-group param-row">
          <label>背包容量:</label>
          <input type="number" v-model.number="playerParams.capacity" placeholder="容量" />
        </div>
        <div class="input-group actions">
          <button @click="updatePlayerParams" class="action-button success">应用参数</button>
          <button @click="resetPlayerParams" class="action-button warning">重置参数</button>
        </div>

        <h4>库存操作</h4>
        <div class="input-group">
          <button @click="clearInventory" class="action-button warning">清空库存</button>
          <button @click="addRandomItems" class="action-button">添加随机物品</button>
          <input type="number" v-model.number="randomItemsCount" placeholder="物品数量" min="1" max="10" />
        </div>
      </div>

      <!-- 新增：游戏周数调整 -->
      <div class="tool-group">
        <h3>游戏周数调整</h3>
        <div class="input-group param-row">
          <label>设置周数:</label>
          <input type="number" v-model.number="weekToSet" placeholder="周数" min="1" :max="gameStore.maxWeeks" />
          <button @click="setCurrentWeek" class="action-button">设置周数</button>
        </div>
      </div>

      <div class="tool-group">
        <h3>市场修正</h3>
        <div class="input-group">
          <select v-model="modifierType">
            <option value="global">全局修正</option>
            <option value="category">类别修正</option>
            <option value="product">商品修正</option>
          </select>

          <template v-if="modifierType === 'category'">
            <select v-model="selectedCategory">
              <option value="DAILY">日常用品</option>
              <option value="FOOD">食品</option>
              <option value="ELECTRONICS">电子产品</option>
              <option value="LUXURY">奢侈品</option>
              <option value="COLLECTIBLE">收藏品</option>
            </select>
          </template>

          <template v-if="modifierType === 'product'">
            <select v-model="selectedProductId">
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.name }}
              </option>
            </select>
          </template>

          <input
            type="number"
            v-model.number="modifierValue"
            step="0.1"
            min="0.1"
            max="2.0"
            placeholder="修正值(0.1-2.0)"
          />

          <input
            type="number"
            v-model.number="modifierDuration"
            min="1"
            placeholder="持续周数"
          />

          <button @click="applyMarketModifier" class="action-button">应用修正</button>
        </div>
      </div>
    </div>

    <div class="tool-section">
      <h2>游戏场景预设</h2>
      <div class="scenarios">
        <div class="scenario-card" @click="applyScenario('early')">
          <h3>前期阶段</h3>
          <p>设置为游戏前期状态：</p>
          <ul>
            <li>周数：5周</li>
            <li>资金：3000元</li>
            <li>债务：4500元</li>
          </ul>
        </div>

        <div class="scenario-card" @click="applyScenario('mid')">
          <h3>中期阶段</h3>
          <p>设置为游戏中期状态：</p>
          <ul>
            <li>周数：20周</li>
            <li>资金：50000元</li>
            <li>债务：2000元</li>
          </ul>
        </div>

        <div class="scenario-card" @click="applyScenario('late')">
          <h3>后期阶段</h3>
          <p>设置为游戏后期状态：</p>
          <ul>
            <li>周数：35周</li>
            <li>资金：200000元</li>
            <li>债务：0元</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="tool-section">
      <h2>当前游戏状态</h2>

      <div class="status-grid">
        <div class="status-item">
          <strong>玩家名称:</strong> {{ playerStore.name }}
        </div>
        <div class="status-item">
          <strong>当前周数:</strong> {{ gameStore.currentWeek }}{{ isEndlessMode ? '' : '/' + gameStore.maxWeeks }}
        </div>
        <div class="status-item">
          <strong>玩家资金:</strong> ¥{{ formatNumber(playerStore.money) }}
        </div>
        <div class="status-item">
          <strong>玩家债务:</strong> ¥{{ formatNumber(playerStore.debt) }}
        </div>
        <div class="status-item">
          <strong>背包使用:</strong> {{ playerStore.inventoryUsed }}/{{ playerStore.capacity }}
        </div>
        <div class="status-item">
          <strong>当前地点:</strong> {{ gameStore.currentLocation?.name }}
        </div>
        <div class="status-item">
          <strong>市场状态:</strong> {{ gameStore.marketStatus }}
        </div>
      </div>

      <h3>市场调整因子</h3>
      <pre class="json-display">{{ JSON.stringify(gameStore.marketModifiers, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores';
import { useInventoryActions, usePlayerStore } from '@/stores/player';
import { runPriceSystemTests } from '@/infrastructure/utils/priceSystemTest';
import { formatNumber } from '@/infrastructure/utils';

const gameStore = useGameStore();
const playerStore = usePlayerStore();
const router = useRouter();

// 响应式状态
const testResults = ref('');
const moneyAmount = ref(1000);
const modifierType = ref('global');
const modifierValue = ref(1.2);
const modifierDuration = ref(3);
const selectedCategory = ref('DAILY');
const selectedProductId = ref(null);

// 新增：玩家参数调整
const playerParams = ref({
  money: 0,
  debt: 0,
  capacity: 0
});

// 新增：库存操作
const randomItemsCount = ref(1);

// 新增：游戏周数调整
const weekToSet = ref(gameStore.currentWeek);

// 计算属性
const products = computed(() => gameStore.products);

// 游戏状态
const isEndlessMode = computed(() => gameStore.isEndlessMode);

// 返回上一页
const goBack = () => {
  router.push('/');
};

// 测试价格系统
const testPriceSystem = () => {
  // 捕获控制台输出
  const originalConsoleLog = console.log;
  let output = '';

  console.log = (...args) => {
    output += args.join(' ') + '\n';
    originalConsoleLog(...args);
  };

  try {
    runPriceSystemTests();
    testResults.value = output;
  } finally {
    // 恢复原始console.log
    console.log = originalConsoleLog;
  }
};

// 前进一周
const advanceWeek = () => {
  gameStore.advanceWeek();
};

// 前进多周
const advanceMultipleWeeks = (weeks) => {
  for (let i = 0; i < weeks; i++) {
    if (!gameStore.gameOver) {
      gameStore.advanceWeek();
    } else {
      break;
    }
  }
};

// 增加资金
const addMoney = () => {
  if (moneyAmount.value) {
    // 使用updateMoney方法安全地更新金钱
    playerStore.updateMoney(moneyAmount.value);
  }
};

// 应用市场修正
const applyMarketModifier = () => {
  let data = {
    value: modifierValue.value,
    duration: modifierDuration.value
  };

  switch (modifierType.value) {
    case 'category':
      data.category = selectedCategory.value;
      break;
    case 'product':
      data.productId = selectedProductId.value;
      break;
  }

  gameStore.addMarketModifier(modifierType.value, data);
};

// 新增：更新玩家参数
const updatePlayerParams = () => {
  if (playerParams.value.money !== null && playerParams.value.money >= 0) {
    // 直接设置money的value属性
    if (playerStore.money && typeof playerStore.money === 'object' && 'value' in playerStore.money) {
      playerStore.money.value = playerParams.value.money;
    }
  }

  if (playerParams.value.debt !== null && playerParams.value.debt >= 0) {
    // 直接设置debt的value属性
    if (playerStore.debt && typeof playerStore.debt === 'object' && 'value' in playerStore.debt) {
      playerStore.debt.value = playerParams.value.debt;
    }
  }

  if (playerParams.value.capacity !== null && playerParams.value.capacity > 0) {
    // 直接设置capacity的value属性
    if (playerStore.capacity && typeof playerStore.capacity === 'object' && 'value' in playerStore.capacity) {
      playerStore.capacity.value = playerParams.value.capacity;
    }
  }
};

// 新增：重置玩家参数（回填当前值）
const resetPlayerParams = () => {
  playerParams.value = {
    money: playerStore.money,
    debt: playerStore.debt,
    capacity: playerStore.capacity
  };
};

// 清空库存
const clearInventory = () => {
  // 直接设置inventory和inventoryUsed的value属性
  if (playerStore.inventory && typeof playerStore.inventory === 'object' && 'value' in playerStore.inventory) {
    playerStore.inventory.value = [];
  }
  if (playerStore.inventoryUsed && typeof playerStore.inventoryUsed === 'object' && 'value' in playerStore.inventoryUsed) {
    playerStore.inventoryUsed.value = 0;
  }
};

// 添加随机物品
const addRandomItems = () => {
  const count = randomItemsCount.value;
  if (count < 1) return;

  // 获取所有产品
  const availableProducts = products.value;
  if (availableProducts.length === 0) return;

  // 随机选择一个产品
  const randomIndex = Math.floor(Math.random() * availableProducts.length);
  const randomProduct = availableProducts[randomIndex];

  // 使用库存操作API添加物品
  const inventoryActions = useInventoryActions();

  // 计算随机价格（在最低和最高价格之间）
  const minPrice = randomProduct.minPrice || randomProduct.basePrice * 0.7;
  const maxPrice = randomProduct.maxPrice || randomProduct.basePrice * 1.3;
  const randomPrice = Math.floor(minPrice + Math.random() * (maxPrice - minPrice));

  // 添加到库存
  inventoryActions.addToInventory(randomProduct, count, randomPrice);
};

// 设置当前周数
const setCurrentWeek = () => {
  if (weekToSet.value !== null && weekToSet.value >= 1 && weekToSet.value <= gameStore.maxWeeks) {
    gameStore.currentWeek = weekToSet.value;
  }
};

// 设置预定义场景
const applyScenario = (scenario) => {
  switch (scenario) {
    case 'early':
      gameStore.currentWeek = 5;
      if (playerStore.money && typeof playerStore.money === 'object' && 'value' in playerStore.money) {
        playerStore.money.value = 3000;
      }
      if (playerStore.debt && typeof playerStore.debt === 'object' && 'value' in playerStore.debt) {
        playerStore.debt.value = 4500;
      }
      break;
    case 'mid':
      gameStore.currentWeek = 20;
      if (playerStore.money && typeof playerStore.money === 'object' && 'value' in playerStore.money) {
        playerStore.money.value = 50000;
      }
      if (playerStore.debt && typeof playerStore.debt === 'object' && 'value' in playerStore.debt) {
        playerStore.debt.value = 2000;
      }
      break;
    case 'late':
      gameStore.currentWeek = 35;
      if (playerStore.money && typeof playerStore.money === 'object' && 'value' in playerStore.money) {
        playerStore.money.value = 200000;
      }
      if (playerStore.debt && typeof playerStore.debt === 'object' && 'value' in playerStore.debt) {
        playerStore.debt.value = 0;
      }
      break;
  }
};

// 设置初始产品ID
onMounted(() => {
  if (products.value.length > 0) {
    selectedProductId.value = products.value[0].id;
  }

  // 初始化玩家参数
  resetPlayerParams();
});
</script>

<style scoped>
.dev-tools {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-with-back {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.back-button {
  position: absolute;
  left: 0;
  display: flex;
  align-items: center;
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.back-button:hover {
  background-color: #3182ce;
}

.back-icon {
  font-size: 18px;
  margin-right: 6px;
}

h1 {
  color: #2c3e50;
  border-bottom: 2px solid #4299e1;
  padding-bottom: 10px;
  margin: 0 auto;
  text-align: center;
  flex-grow: 1;
}

.tool-section {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #2c3e50;
  margin-top: 0;
  font-size: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

h3 {
  color: #4a5568;
  margin-top: 15px;
  font-size: 1.2rem;
}

.tool-group {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #e2e8f0;
}

.test-button {
  background-color: #805ad5;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 500;
}

.test-button:hover {
  background-color: #6b46c1;
}

.test-output {
  margin-top: 15px;
  padding: 10px;
  background-color: #2d3748;
  color: #e2e8f0;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.control-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.action-button {
  background-color: #4299e1;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 500;
}

.action-button:hover {
  background-color: #3182ce;
}

.input-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.input-group input,
.input-group select {
  padding: 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* 新增样式 */
.param-row {
  margin-bottom: 8px;
  align-items: center;
}

.param-row label {
  min-width: 100px;
  font-weight: 500;
  color: #4a5568;
}

.actions {
  margin-top: 16px;
  justify-content: flex-end;
}

.action-button.success {
  background-color: #38a169;
}

.action-button.success:hover {
  background-color: #2f855a;
}

.action-button.warning {
  background-color: #e53e3e;
}

.action-button.warning:hover {
  background-color: #c53030;
}

.scenarios {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-top: 15px;
}

.scenario-card {
  background-color: #e2e8f0;
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  text-align: center;
}

.scenario-card:hover {
  background-color: #d6d6d6;
  transform: translateY(-3px);
}

.scenario-card h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 8px;
}

.scenario-card p {
  color: #4a5568;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.scenario-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
  font-size: 0.9rem;
  color: #555;
}

.scenario-card li {
  margin-bottom: 3px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.status-item {
  background-color: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.json-display {
  background-color: #2d3748;
  color: #e2e8f0;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  white-space: pre-wrap;
  max-height: 200px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .status-grid {
    grid-template-columns: 1fr;
  }

  .input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .input-group input,
  .input-group select,
  .input-group button {
    width: 100%;
  }
}
</style>
