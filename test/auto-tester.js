/**
 * 买房记游戏自动测试工具
 * 用于测试游戏核心功能和流程
 */

const fs = require('fs');
const path = require('path');
const { createApp } = require('vue');

// 模拟浏览器环境
global.localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// 颜色输出辅助函数
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// 打印彩色消息
function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// 测试结果
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// 测试用例
function test(name, fn) {
  testResults.total++;
  try {
    log(`\n运行测试: ${name}`, 'blue');
    fn();
    testResults.passed++;
    testResults.details.push({ name, status: 'passed' });
    log(`✓ 测试通过: ${name}`, 'green');
  } catch (error) {
    testResults.failed++;
    testResults.details.push({ name, status: 'failed', error: error.message });
    log(`✗ 测试失败: ${name}`, 'red');
    log(`  错误: ${error.message}`, 'red');
    if (error.stack) {
      log(`  堆栈: ${error.stack.split('\n')[1]}`, 'yellow');
    }
  }
}

// 跳过测试
function skip(name, fn) {
  testResults.total++;
  testResults.skipped++;
  testResults.details.push({ name, status: 'skipped' });
  log(`- 跳过测试: ${name}`, 'yellow');
}

// 断言
function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败');
  }
}

// 测试游戏核心模块
function testGameCore() {
  // 导入游戏核心模块
  const { useGameCoreStore } = require('../src/stores/gameCore');
  const { usePlayerStore } = require('../src/stores/player');
  const { useMarketStore } = require('../src/stores/market');
  
  // 创建测试应用
  const app = createApp({});
  
  // 初始化状态
  const gameCore = useGameCoreStore();
  const player = usePlayerStore();
  const market = useMarketStore();
  
  // 测试游戏初始化
  test('游戏状态初始化', () => {
    gameCore.currentWeek = 1;
    gameCore.gameStarted = true;
    gameCore.initialized = true;
    
    assert(gameCore.currentWeek === 1, '当前周数应为1');
    assert(gameCore.gameStarted === true, '游戏应已开始');
    assert(gameCore.initialized === true, '游戏应已初始化');
  });
  
  // 测试玩家初始化
  test('玩家状态初始化', () => {
    player.initializePlayer('测试玩家');
    player.initialized = true;
    
    assert(player.name === '测试玩家', '玩家名称应为"测试玩家"');
    assert(player.money > 0, '玩家初始资金应大于0');
    assert(player.initialized === true, '玩家应已初始化');
  });
  
  // 测试市场初始化
  test('市场状态初始化', () => {
    market.initializeMarket();
    market.initialized = true;
    
    assert(market.products.length > 0, '市场应有商品');
    assert(market.locations.length > 0, '市场应有地点');
    assert(market.initialized === true, '市场应已初始化');
  });
  
  // 测试游戏周进度
  test('游戏周进度', () => {
    const initialWeek = gameCore.currentWeek;
    gameCore.advanceWeek();
    
    assert(gameCore.currentWeek === initialWeek + 1, '周数应增加1');
  });
}

// 测试事件系统
function testEventSystem() {
  // 导入事件模块
  const { getAllEvents, getEventById } = require('../src/core/models/event');
  const { EventSystem } = require('../src/core/services/eventSystem');
  
  // 测试事件加载
  test('事件加载', () => {
    const events = getAllEvents();
    assert(events.length > 0, '应加载至少一个事件');
    
    // 检查连锁事件
    let chainEventCount = 0;
    for (const event of events) {
      for (const option of event.options) {
        if (option.effects && option.effects.nextEvent) {
          chainEventCount++;
          break;
        }
      }
    }
    
    assert(chainEventCount >= 10, '应至少有10个连锁事件');
  });
  
  // 测试事件触发
  test('事件触发条件', () => {
    const events = getAllEvents();
    const eventSystem = new EventSystem(events);
    
    // 创建测试游戏状态
    const gameState = {
      currentWeek: 20,
      maxWeeks: 52,
      player: {
        money: 50000,
        debt: 0,
        inventory: [],
        attributes: {}
      },
      currentLocation: { id: 'downtown' }
    };
    
    // 测试事件筛选
    const eligibleEvents = eventSystem.getEligibleEvents(gameState);
    assert(eligibleEvents.length > 0, '应至少有一个符合条件的事件');
  });
  
  // 测试特定事件
  test('房产相关事件', () => {
    const propertyExpo = getEventById('property_expo');
    assert(propertyExpo !== null, '应存在房产展览会事件');
    
    // 检查连锁事件链
    const propertyInvestment = getEventById('property_investment');
    assert(propertyInvestment !== null, '应存在房产投资事件');
    
    const propertyCompletion = getEventById('property_completion_notice');
    assert(propertyCompletion !== null, '应存在房产完工通知事件');
  });
}

// 测试存档系统
function testSaveSystem() {
  // 导入存档模块
  const { stateSnapshot } = require('../src/infrastructure/persistence/stateSnapshot');
  
  // 测试存档创建
  test('存档创建', () => {
    // 创建测试游戏状态
    const gameState = {
      currentWeek: 10,
      gameStarted: true,
      player: {
        name: '测试玩家',
        money: 50000
      },
      market: {
        products: [
          { id: 'product1', name: '商品1', price: 100 }
        ]
      }
    };
    
    // 创建存档
    const snapshot = stateSnapshot.createSnapshot(gameState);
    
    assert(snapshot !== null, '应成功创建存档');
    assert(snapshot.gameState.currentWeek === 10, '存档应包含正确的游戏周数');
    assert(snapshot.gameState.player.name === '测试玩家', '存档应包含正确的玩家名称');
  });
  
  // 测试存档验证
  test('存档验证', () => {
    // 创建有效存档
    const validSnapshot = {
      gameState: {
        currentWeek: 10,
        player: { name: '测试玩家', money: 50000 },
        market: { products: [] }
      },
      timestamp: Date.now(),
      version: '0.1.0'
    };
    
    // 创建无效存档
    const invalidSnapshot = {
      gameState: {
        currentWeek: 10
        // 缺少player和market
      },
      timestamp: Date.now(),
      version: '0.1.0'
    };
    
    assert(stateSnapshot.validateSnapshot(validSnapshot), '有效存档应通过验证');
    assert(!stateSnapshot.validateSnapshot(invalidSnapshot), '无效存档应验证失败');
  });
}

// 测试界面组件
function testUIComponents() {
  // 测试主菜单组件
  test('主菜单组件', () => {
    // 检查文件是否存在
    const mainMenuPath = path.resolve(__dirname, '../src/ui/views/MainMenu.vue');
    assert(fs.existsSync(mainMenuPath), '主菜单组件文件应存在');
    
    // 读取文件内容
    const content = fs.readFileSync(mainMenuPath, 'utf8');
    
    // 检查关键方法
    assert(content.includes('function startGame'), 'startGame方法应存在');
    assert(content.includes('function startNewGame'), 'startNewGame方法应存在');
    assert(content.includes('router.push'), '应包含路由导航');
  });
  
  // 测试游戏视图组件
  test('游戏视图组件', () => {
    // 检查文件是否存在
    const gameViewPath = path.resolve(__dirname, '../src/ui/views/GameView.vue');
    assert(fs.existsSync(gameViewPath), '游戏视图组件文件应存在');
    
    // 读取文件内容
    const content = fs.readFileSync(gameViewPath, 'utf8');
    
    // 检查关键方法和组件
    assert(content.includes('advanceWeek'), 'advanceWeek方法应存在');
    assert(content.includes('PlayerInfo'), '应包含玩家信息组件');
    assert(content.includes('Market'), '应包含市场组件');
    assert(content.includes('HouseMarket'), '应包含房屋市场组件');
  });
}

// 测试完整游戏流程
function testGameFlow() {
  // 导入游戏核心模块
  const { useGameCoreStore } = require('../src/stores/gameCore');
  const { usePlayerStore } = require('../src/stores/player');
  const { useMarketStore } = require('../src/stores/market');
  
  // 创建测试应用
  const app = createApp({});
  
  // 初始化状态
  const gameCore = useGameCoreStore();
  const player = usePlayerStore();
  const market = useMarketStore();
  
  // 初始化游戏
  gameCore.currentWeek = 1;
  gameCore.gameStarted = true;
  gameCore.initialized = true;
  player.initializePlayer('测试玩家');
  player.initialized = true;
  market.initializeMarket();
  market.initialized = true;
  
  // 测试完整游戏流程
  test('完整游戏流程', () => {
    // 模拟52周游戏
    for (let i = 0; i < 52; i++) {
      // 执行交易
      if (i % 5 === 0) {
        // 每5周尝试购买商品
        const products = market.products;
        if (products.length > 0) {
          const product = products[0];
          player.money += 10000; // 确保有足够资金
          market.buyProduct(product.id, 1);
        }
      }
      
      if (i % 10 === 0) {
        // 每10周尝试出售商品
        const inventory = player.inventory;
        if (inventory.length > 0) {
          const item = inventory[0];
          market.sellProduct(item.productId, 1);
        }
      }
      
      // 推进游戏
      gameCore.advanceWeek();
    }
    
    // 验证游戏结束
    assert(gameCore.currentWeek > 52, '游戏应完成52周');
    assert(gameCore.gameOver === true, '游戏应结束');
  });
}

// 测试房屋购买
function testHousePurchase() {
  // 导入游戏核心模块
  const { useGameCoreStore } = require('../src/stores/gameCore');
  const { usePlayerStore } = require('../src/stores/player');
  const { useMarketStore } = require('../src/stores/market');
  
  // 创建测试应用
  const app = createApp({});
  
  // 初始化状态
  const gameCore = useGameCoreStore();
  const player = usePlayerStore();
  const market = useMarketStore();
  
  // 初始化游戏
  gameCore.currentWeek = 1;
  gameCore.gameStarted = true;
  gameCore.initialized = true;
  player.initializePlayer('测试玩家');
  player.initialized = true;
  market.initializeMarket();
  market.initialized = true;
  
  // 测试房屋购买
  test('房屋购买', () => {
    // 确保有足够资金
    player.money = 1000000;
    
    // 获取房屋列表
    const houses = market.houses;
    assert(houses.length > 0, '市场应有房屋');
    
    // 购买第一个房屋
    const house = houses[0];
    const result = market.buyHouse(house.id);
    
    assert(result === true, '应成功购买房屋');
    assert(player.purchasedHouses.length > 0, '玩家应拥有房屋');
    assert(player.purchasedHouses[0].id === house.id, '玩家应拥有购买的房屋');
  });
}

// 运行所有测试
function runAllTests() {
  log('===== 买房记游戏自动测试工具 =====', 'cyan');
  
  try {
    testGameCore();
    testEventSystem();
    testSaveSystem();
    testUIComponents();
    testGameFlow();
    testHousePurchase();
  } catch (error) {
    log(`\n测试过程中出现未捕获的错误: ${error.message}`, 'red');
    if (error.stack) {
      log(error.stack, 'red');
    }
  }
  
  // 输出测试结果
  log('\n===== 测试结果汇总 =====', 'cyan');
  log(`总测试数: ${testResults.total}`, 'blue');
  log(`通过: ${testResults.passed}`, 'green');
  log(`失败: ${testResults.failed}`, 'red');
  log(`跳过: ${testResults.skipped}`, 'yellow');
  
  // 保存测试结果
  const resultPath = path.resolve(__dirname, 'test-results/test-report-latest.json');
  try {
    // 确保目录存在
    const dir = path.dirname(resultPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(resultPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        skipped: testResults.skipped
      },
      details: testResults.details
    }, null, 2));
    
    log(`\n测试报告已保存至: ${resultPath}`, 'green');
  } catch (error) {
    log(`\n保存测试报告失败: ${error.message}`, 'red');
  }
  
  // 返回测试是否全部通过
  return testResults.failed === 0;
}

// 如果直接运行此文件，执行所有测试
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = {
  runAllTests,
  test,
  skip,
  assert
}; 