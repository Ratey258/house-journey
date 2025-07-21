/**
 * 简化版状态管理优化测试脚本
 */

// 模拟批量更新工具
function createBatchUpdater() {
  let batchMode = false;
  let pendingUpdates = [];
  
  const executePendingUpdates = () => {
    console.log(`执行 ${pendingUpdates.length} 个批量更新`);
    pendingUpdates.forEach(update => update());
    pendingUpdates = [];
  };
  
  return {
    batchUpdates: (fn) => {
      console.log('开始批量更新');
      batchMode = true;
      try {
        fn();
      } finally {
        batchMode = false;
        executePendingUpdates();
        console.log('批量更新完成');
      }
    },
    
    queueUpdate: (update) => {
      if (batchMode) {
        pendingUpdates.push(update);
        console.log('更新已加入队列');
      } else {
        console.log('直接执行更新');
        update();
      }
    }
  };
}

// 模拟游戏进度Store
class GameProgressStore {
  constructor() {
    this.state = {
      currentWeek: 1,
      maxWeeks: 52,
      notifications: []
    };
  }
  
  get currentWeek() {
    return this.state.currentWeek;
  }
  
  set currentWeek(value) {
    console.log(`设置当前周: ${value}`);
    this.state.currentWeek = value;
  }
  
  advanceWeek() {
    this.state.currentWeek++;
    console.log(`推进到第 ${this.state.currentWeek} 周`);
    return true;
  }
  
  addNotification(message) {
    this.state.notifications.push({
      message,
      timestamp: Date.now()
    });
    console.log(`添加通知: ${message}`);
  }
}

// 模拟价格系统Store
class PriceSystemStore {
  constructor() {
    this.state = {
      productPrices: {},
      priceHistory: {}
    };
  }
  
  get productPrices() {
    return this.state.productPrices;
  }
  
  updatePrices(week, products) {
    console.log(`批量更新 ${products.length} 个商品价格`);
    products.forEach(product => {
      this.calculateNewPrice(product, week);
    });
  }
  
  calculateNewPrice(product, week) {
    const oldPrice = this.state.productPrices[product.id]?.price || product.basePrice;
    const volatility = product.volatility || 0.1;
    const periodFactor = Math.sin(week / (product.period || 8)) * 0.1;
    const randomFactor = (Math.random() - 0.5) * volatility;
    const newPrice = Math.round(oldPrice * (1 + periodFactor + randomFactor));
    
    if (!this.state.productPrices[product.id]) {
      this.state.productPrices[product.id] = {};
    }
    
    this.state.productPrices[product.id].price = newPrice;
    this.updatePriceHistory(product.id, newPrice, week);
    
    return newPrice;
  }
  
  updatePriceHistory(productId, price, week) {
    if (!this.state.priceHistory[productId]) {
      this.state.priceHistory[productId] = [];
    }
    
    this.state.priceHistory[productId].push({
      week,
      price,
      timestamp: Date.now()
    });
  }
}

// 模拟玩家Store
class PlayerStore {
  constructor() {
    this.state = {
      money: 10000,
      debt: 0,
      inventory: {},
      statistics: {
        maxMoney: 10000,
        transactions: 0
      }
    };
  }
  
  get money() {
    return this.state.money;
  }
  
  set money(value) {
    console.log(`设置玩家资金: ${value}`);
    this.state.money = value;
    if (value > this.state.statistics.maxMoney) {
      this.state.statistics.maxMoney = value;
    }
  }
  
  addMoney(amount) {
    this.money += amount;
    console.log(`增加资金: ${amount}, 当前资金: ${this.money}`);
  }
  
  removeMoney(amount) {
    this.money -= amount;
    console.log(`减少资金: ${amount}, 当前资金: ${this.money}`);
  }
}

// 模拟兼容层
class GameStore {
  constructor(gameProgress, priceSystem, player) {
    this.gameProgress = gameProgress;
    this.priceSystem = priceSystem;
    this.player = player;
  }
  
  // 使用getter/setter代替computed
  get currentWeek() {
    return this.gameProgress.currentWeek;
  }
  
  set currentWeek(value) {
    this.gameProgress.currentWeek = value;
  }
  
  get productPrices() {
    return this.priceSystem.productPrices;
  }
  
  // 直接引用方法
  advanceWeek() {
    console.log('通过兼容层推进游戏周期');
    return this.gameProgress.advanceWeek();
  }
  
  // 包装方法
  buyProduct(productId, quantity, price) {
    console.log(`购买商品: ${productId}, 数量: ${quantity}, 价格: ${price}`);
    const totalCost = price * quantity;
    
    if (this.player.money < totalCost) {
      console.log('资金不足');
      return { success: false, reason: 'insufficient_funds' };
    }
    
    this.player.removeMoney(totalCost);
    console.log('购买成功');
    return { success: true };
  }
}

// 运行测试
function runTest() {
  console.log('开始状态管理优化测试...');
  
  // 创建stores
  const gameProgress = new GameProgressStore();
  const priceSystem = new PriceSystemStore();
  const player = new PlayerStore();
  const gameStore = new GameStore(gameProgress, priceSystem, player);
  
  // 创建批量更新工具
  const { batchUpdates } = createBatchUpdater();
  
  // 测试数据
  const mockProducts = [
    { id: 'product-1', name: '商品1', basePrice: 100, volatility: 0.1, period: 8 },
    { id: 'product-2', name: '商品2', basePrice: 200, volatility: 0.2, period: 10 },
    { id: 'product-3', name: '商品3', basePrice: 300, volatility: 0.15, period: 12 }
  ];
  
  // 测试1: 兼容层优化
  console.log('\n测试1: 兼容层优化');
  console.time('兼容层访问');
  for (let i = 0; i < 1000; i++) {
    const week = gameStore.currentWeek;
    const money = gameStore.player.money;
    const prices = gameStore.productPrices;
  }
  console.timeEnd('兼容层访问');
  
  // 测试2: 价格系统优化
  console.log('\n测试2: 价格系统优化');
  
  // 旧方式
  console.time('旧价格更新方式');
  for (let i = 0; i < 10; i++) {
    const week = gameProgress.currentWeek + i;
    mockProducts.forEach(product => {
      const oldPrice = priceSystem.productPrices[product.id]?.price || product.basePrice;
      const volatility = product.volatility || 0.1;
      const periodFactor = Math.sin(week / (product.period || 8)) * 0.1;
      const randomFactor = (Math.random() - 0.5) * volatility;
      const newPrice = oldPrice * (1 + periodFactor + randomFactor);
      
      if (!priceSystem.productPrices[product.id]) {
        priceSystem.productPrices[product.id] = {};
      }
      priceSystem.productPrices[product.id].price = Math.round(newPrice);
    });
  }
  console.timeEnd('旧价格更新方式');
  
  // 新方式
  console.time('新价格更新方式');
  for (let i = 0; i < 10; i++) {
    const week = gameProgress.currentWeek + i;
    priceSystem.updatePrices(week, mockProducts);
  }
  console.timeEnd('新价格更新方式');
  
  // 测试3: 批量更新优化
  console.log('\n测试3: 批量更新优化');
  
  // 不使用批量更新
  console.time('不使用批量更新');
  for (let i = 0; i < 10; i++) {
    player.money += 100;
    gameProgress.currentWeek += 1;
    gameProgress.addNotification(`第 ${gameProgress.currentWeek} 周更新`);
  }
  console.timeEnd('不使用批量更新');
  
  // 使用批量更新
  console.time('使用批量更新');
  batchUpdates(() => {
    for (let i = 0; i < 10; i++) {
      player.money += 100;
      gameProgress.currentWeek += 1;
      gameProgress.addNotification(`第 ${gameProgress.currentWeek} 周更新`);
    }
  });
  console.timeEnd('使用批量更新');
  
  console.log('\n测试完成!');
}

// 运行测试
runTest();

// 导出测试函数
export { runTest }; 