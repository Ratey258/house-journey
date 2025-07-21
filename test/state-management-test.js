/**
 * 状态管理优化测试脚本
 * 用于测试状态管理优化后的性能提升
 */

// 注意：为了测试目的，我们在这里模拟Pinia环境
// 在实际生产环境中，这些store会在Vue应用中正常使用
import { defineStore, createPinia, setActivePinia } from '../node_modules/pinia/dist/pinia.mjs';

// 模拟状态管理环境
class MockStore {
  constructor(id, options) {
    this.id = id;
    this.state = typeof options.state === 'function' ? options.state() : options.state;
    this.getters = options.getters || {};
    this.actions = options.actions || {};
    
    // 绑定actions
    Object.keys(this.actions).forEach(key => {
      this[key] = this.actions[key].bind(this);
    });
    
    // 处理getters
    Object.keys(this.getters).forEach(key => {
      Object.defineProperty(this, key, {
        get: () => this.getters[key].call(this),
        enumerable: true
      });
    });
  }
}

// 创建批量更新工具
function createBatchUpdater() {
  let batchMode = false;
  let pendingUpdates = [];
  
  const executePendingUpdates = () => {
    pendingUpdates.forEach(update => update());
    pendingUpdates = [];
  };
  
  return {
    batchUpdates: (fn) => {
      batchMode = true;
      try {
        fn();
      } finally {
        batchMode = false;
        executePendingUpdates();
      }
    },
    
    queueUpdate: (update) => {
      if (batchMode) {
        pendingUpdates.push(update);
      } else {
        update();
      }
    }
  };
}

// 模拟stores
const useGameProgressStore = () => new MockStore('gameProgress', {
  state: () => ({
    currentWeek: 1,
    maxWeeks: 52,
    gameStarted: false,
    gamePaused: false,
    notifications: []
  }),
  getters: {
    remainingWeeks() {
      return this.maxWeeks - this.currentWeek;
    }
  },
  actions: {
    advanceWeek() {
      this.currentWeek++;
      return true;
    },
    initializeProgress() {
      this.currentWeek = 1;
      this.notifications = [];
    }
  }
});

const usePriceSystemStore = () => new MockStore('priceSystem', {
  state: () => ({
    productPrices: {},
    priceHistory: {},
    marketModifiers: {
      global: 1.0,
      categories: {},
      products: {}
    },
    priceCache: {},
    trendCache: {}
  }),
  actions: {
    initializePriceSystem() {
      this.productPrices = {};
      this.priceHistory = {};
    },
    updatePrices(week, products) {
      products.forEach(product => {
        this.calculateNewPrice(product, this.productPrices[product.id]?.price || product.basePrice, week);
      });
    },
    calculateNewPrice(product, currentPrice, week) {
      const basePrice = product.basePrice || 100;
      const volatility = product.volatility || 0.1;
      const periodFactor = Math.sin(week / (product.period || 8)) * 0.1;
      const randomFactor = (Math.random() - 0.5) * volatility;
      const newPrice = Math.round(currentPrice * (1 + periodFactor + randomFactor));
      
      // 更新价格
      if (!this.productPrices[product.id]) {
        this.productPrices[product.id] = {};
      }
      this.productPrices[product.id].price = newPrice;
      return newPrice;
    },
    getProductPriceTrend() {
      return 'up';
    },
    cleanupCache() {
      this.priceCache = {};
      this.trendCache = {};
    }
  }
});

const useGameCoreStore = () => new MockStore('gameCore', {
  state: () => ({
    playerName: '',
    gameActive: false
  }),
  actions: {
    startNewGame(playerName) {
      this.playerName = playerName;
      this.gameActive = true;
    },
    checkGameEnd() {
      // 游戏结束检查逻辑
      return false;
    }
  }
});

const usePlayerStore = () => new MockStore('player', {
  state: () => ({
    money: 10000,
    debt: 0,
    inventory: {},
    statistics: {
      maxMoney: 10000,
      transactions: 0,
      profits: 0
    }
  }),
  actions: {
    updateWeeklyPlayerState() {
      // 更新玩家周期状态
    },
    addMoney(amount) {
      this.money += amount;
      if (this.money > this.statistics.maxMoney) {
        this.statistics.maxMoney = this.money;
      }
    },
    removeMoney(amount) {
      this.money -= amount;
    }
  }
});

const useMarketStore = () => new MockStore('market', {
  state: () => ({
    products: [],
    locations: [],
    currentLocation: 'city_1'
  }),
  actions: {
    updateMarketState() {
      // 更新市场状态
    },
    updateLocationProducts() {
      // 更新位置商品
    }
  }
});

const useGameStore = () => {
  const gameCore = useGameCoreStore();
  const gameProgress = useGameProgressStore();
  const player = usePlayerStore();
  const market = useMarketStore();
  const priceSystem = usePriceSystemStore();
  
  return {
    // 游戏核心状态
    get currentWeek() { return gameProgress.currentWeek; },
    set currentWeek(value) { gameProgress.currentWeek = value; },
    get player() { return player; },
    get products() { return market.products; },
    get currentLocation() { return market.currentLocation; },
    get productPrices() { return priceSystem.productPrices; },
    get marketModifiers() { return priceSystem.marketModifiers; },
    
    // 方法
    startNewGame(playerName) {
      gameCore.startNewGame(playerName);
      gameProgress.initializeProgress();
      priceSystem.initializePriceSystem();
    },
    advanceWeek() {
      if (gameProgress.advanceWeek()) {
        player.updateWeeklyPlayerState(gameProgress.currentWeek);
        market.updateMarketState(gameProgress.currentWeek);
        gameCore.checkGameEnd();
        return true;
      }
      return false;
    },
    buyProduct(productId, quantity) {
      const product = market.products.find(p => p.id === productId);
      if (!product) return { success: false, reason: 'product_not_found' };
      
      const price = priceSystem.productPrices[productId]?.price || product.basePrice;
      const totalCost = price * quantity;
      
      if (player.money < totalCost) {
        return { success: false, reason: 'insufficient_funds' };
      }
      
      // 扣除资金
      player.removeMoney(totalCost);
      
      // 添加到库存
      if (!player.inventory[productId]) {
        player.inventory[productId] = 0;
      }
      player.inventory[productId] += quantity;
      
      return { success: true };
    },
    sellProduct(productId, quantity) {
      if (!player.inventory[productId] || player.inventory[productId] < quantity) {
        return { success: false, reason: 'insufficient_inventory' };
      }
      
      const product = market.products.find(p => p.id === productId);
      if (!product) return { success: false, reason: 'product_not_found' };
      
      const price = priceSystem.productPrices[productId]?.price || product.basePrice;
      const totalProfit = price * quantity;
      
      // 增加资金
      player.addMoney(totalProfit);
      
      // 从库存中移除
      player.inventory[productId] -= quantity;
      
      return { success: true };
    },
    getProductPriceTrend: (productId) => priceSystem.getProductPriceTrend(productId)
  };
};

// 测试配置
const TEST_ITERATIONS = 1000;
const PRODUCT_COUNT = 50;
const WEEKS_TO_SIMULATE = 52;

// 创建批量更新工具
const { batchUpdates } = createBatchUpdater();

// 性能测试函数
async function runPerformanceTest() {
  console.log('开始状态管理性能测试...');
  
  // 初始化stores
  const gameStore = useGameStore();
  const gameCore = useGameCoreStore();
  const gameProgress = useGameProgressStore();
  const market = useMarketStore();
  const priceSystem = usePriceSystemStore();
  const player = usePlayerStore();
  
  // 测试1: 兼容层优化 - 使用getter/setter vs computed
  console.log('\n测试1: 兼容层优化性能测试');
  
  // 模拟商品数据
  const mockProducts = Array.from({ length: PRODUCT_COUNT }, (_, i) => ({
    id: `product-${i}`,
    name: `测试商品 ${i}`,
    basePrice: 100 + i * 10,
    volatility: 0.1 + (i % 5) * 0.02,
    period: 8 + (i % 4),
    category: `category-${i % 5}`
  }));
  
  // 初始化游戏状态
  await gameStore.startNewGame('测试玩家');
  player.money = 1000000; // 设置足够的资金
  
  // 更新市场商品
  market.products = mockProducts;
  
  // 测试兼容层访问性能
  console.time('兼容层访问性能');
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    // 使用兼容层访问状态
    const week = gameStore.currentWeek;
    const money = gameStore.player.money;
    const products = gameStore.products;
    const location = gameStore.currentLocation;
  }
  console.timeEnd('兼容层访问性能');
  
  // 测试2: 拆分Store性能 - 价格系统
  console.log('\n测试2: 价格系统性能测试');
  
  // 测试价格更新性能 - 旧方式
  console.time('旧价格更新方式');
  for (let i = 0; i < TEST_ITERATIONS / 10; i++) {
    // 模拟旧的价格更新方式
    const week = gameProgress.currentWeek + i;
    mockProducts.forEach(product => {
      const oldPrice = priceSystem.productPrices[product.id]?.price || product.basePrice;
      const volatility = product.volatility || 0.1;
      const periodFactor = Math.sin(week / (product.period || 8)) * 0.1;
      const randomFactor = (Math.random() - 0.5) * volatility;
      const newPrice = oldPrice * (1 + periodFactor + randomFactor);
      
      // 直接更新价格
      if (!priceSystem.productPrices[product.id]) {
        priceSystem.productPrices[product.id] = {};
      }
      priceSystem.productPrices[product.id].price = Math.round(newPrice);
    });
  }
  console.timeEnd('旧价格更新方式');
  
  // 初始化价格系统，确保每个商品都有初始价格
  priceSystem.productPrices = {};
  mockProducts.forEach(product => {
    if (!priceSystem.productPrices[product.id]) {
      priceSystem.productPrices[product.id] = { price: product.basePrice };
    }
  });
  
  // 测试价格更新性能 - 新方式
  console.time('新价格更新方式');
  for (let i = 0; i < TEST_ITERATIONS / 10; i++) {
    // 使用优化后的批量更新方式
    const week = gameProgress.currentWeek + i;
    priceSystem.updatePrices(week, mockProducts);
  }
  console.timeEnd('新价格更新方式');
  
  // 测试3: 批量更新性能
  console.log('\n测试3: 批量更新性能测试');
  
  // 不使用批量更新
  console.time('不使用批量更新');
  for (let i = 0; i < TEST_ITERATIONS / 100; i++) {
    // 模拟多个状态更新
    player.money += 100;
    player.statistics.maxMoney = Math.max(player.money, player.statistics.maxMoney);
    gameProgress.currentWeek += 1;
    if (gameProgress.currentWeek > gameProgress.maxWeeks) {
      gameProgress.currentWeek = 1;
    }
  }
  console.timeEnd('不使用批量更新');
  
  // 使用批量更新
  console.time('使用批量更新');
  for (let i = 0; i < TEST_ITERATIONS / 100; i++) {
    // 使用批量更新工具
    batchUpdates(() => {
      player.money += 100;
      player.statistics.maxMoney = Math.max(player.money, player.statistics.maxMoney);
      gameProgress.currentWeek += 1;
      if (gameProgress.currentWeek > gameProgress.maxWeeks) {
        gameProgress.currentWeek = 1;
      }
    });
  }
  console.timeEnd('使用批量更新');
  
  // 测试4: 游戏周期推进性能
  console.log('\n测试4: 游戏周期推进性能测试');
  
  // 重置游戏状态
  await gameStore.startNewGame('测试玩家');
  
  // 模拟游戏周期推进
  console.time('游戏周期推进');
  for (let i = 0; i < WEEKS_TO_SIMULATE; i++) {
    gameStore.advanceWeek();
  }
  console.timeEnd('游戏周期推进');
  
  console.log('\n性能测试完成!');
}

// 运行测试
runPerformanceTest().catch(error => {
  console.error('测试过程中出错:', error);
});

// 导出测试函数，便于从命令行调用
export { runPerformanceTest }; 