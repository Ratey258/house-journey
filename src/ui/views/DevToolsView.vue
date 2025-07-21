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
      <h2>当前游戏状态</h2>
      
      <div class="status-grid">
        <div class="status-item">
          <strong>当前周数:</strong> {{ gameStore.currentWeek }}/{{ gameStore.maxWeeks }}
        </div>
        <div class="status-item">
          <strong>玩家资金:</strong> ¥{{ formatNumber(gameStore.player.money) }}
        </div>
        <div class="status-item">
          <strong>玩家债务:</strong> ¥{{ formatNumber(gameStore.player.debt) }}
        </div>
        <div class="status-item">
          <strong>背包使用:</strong> {{ gameStore.player.inventoryUsed }}/{{ gameStore.player.capacity }}
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
import { runPriceSystemTests } from '@/infrastructure/utils/priceSystemTest';
import { formatNumber } from '@/infrastructure/utils';

const gameStore = useGameStore();
const router = useRouter();

// 响应式状态
const testResults = ref('');
const moneyAmount = ref(1000);
const modifierType = ref('global');
const modifierValue = ref(1.2);
const modifierDuration = ref(3);
const selectedCategory = ref('DAILY');
const selectedProductId = ref(null);

// 计算属性
const products = computed(() => gameStore.products);

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
    gameStore.player.money += moneyAmount.value;
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

// 设置初始产品ID
onMounted(() => {
  if (products.value.length > 0) {
    selectedProductId.value = products.value[0].id;
  }
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