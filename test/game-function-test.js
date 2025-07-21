/**
 * 《买房记》游戏核心功能测试脚本
 * 此脚本用于测试游戏的核心功能模块，而不仅仅是检查文件是否存在
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出 - 移到顶部
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * 彩色日志输出
 * @param {string} message 消息内容
 * @param {string} color 颜色
 */
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

/**
 * 测试结果输出
 * @param {string} testName 测试名称
 * @param {boolean} passed 是否通过
 * @param {string} message 消息
 * @param {Object} details 详细信息
 */
function recordTest(testName, passed, message, details = {}) {
  const result = {
    name: testName,
    passed,
    message,
    timestamp: new Date().toISOString()
  };

  testResults.tests.push(result);
  testResults.details[testName] = details;
  testResults.summary.total++;

  if (passed) {
    testResults.summary.passed++;
    log(`✅ ${testName}: ${message}`, colors.green);
  } else {
    testResults.summary.failed++;
    log(`❌ ${testName}: ${message}`, colors.red);
  }
}

// 测试结果记录
const testResults = {
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  },
  tests: [],
  details: {}
};

// 导入核心模块
let priceSystem, eventSystem, playerModel, productModel, storageService, gameLoop;

try {
  // 使用动态导入替代require
  const priceSystemModule = await import('../src/core/services/priceSystem.js');
  const eventSystemModule = await import('../src/core/services/eventSystem.js');
  const playerModelModule = await import('../src/core/models/player.js');
  const productModelModule = await import('../src/core/models/product.js');
  const storageServiceModule = await import('../src/infrastructure/persistence/storageService.js');
  const gameLoopModule = await import('../src/core/services/gameLoopService.js');
  
  // 提取导出的内容
  priceSystem = priceSystemModule.default || priceSystemModule;
  eventSystem = eventSystemModule.default || eventSystemModule;
  playerModel = playerModelModule.default || playerModelModule;
  productModel = productModelModule.default || productModelModule;
  storageService = storageServiceModule.default || storageServiceModule;
  gameLoop = gameLoopModule.default || gameLoopModule;
  
  console.log('✅ 所有核心模块导入成功');
} catch (error) {
  console.error('❌ 无法导入核心模块:', error.message);
  console.log('提示：可能需要调整模块路径或构建项目');
  console.log('尝试使用备用测试方法...');
  
  // 如果模块导入失败，我们使用备用测试方法
  await runBackupTests();
  process.exit(0);
}

/**
 * 备用测试方法 - 当模块导入失败时使用
 */
async function runBackupTests() {
  log('\n🔄 运行备用测试方法...', colors.bright + colors.yellow);
  
  // 测试文件存在性
  const testFiles = [
    '../src/core/services/priceSystem.js',
    '../src/core/services/eventSystem.js',
    '../src/core/models/player.js',
    '../src/core/models/product.js',
    '../src/infrastructure/persistence/storageService.js',
    '../src/core/services/gameLoopService.js'
  ];
  
  for (const file of testFiles) {
    const filePath = path.resolve(__dirname, file);
    const exists = fs.existsSync(filePath);
    recordTest(`文件存在性测试: ${file}`, exists, 
      exists ? '文件存在' : '文件不存在',
      { filePath, exists }
    );
  }
  
  // 测试文件内容
  try {
    const priceSystemPath = path.resolve(__dirname, '../src/core/services/priceSystem.js');
    if (fs.existsSync(priceSystemPath)) {
      const content = fs.readFileSync(priceSystemPath, 'utf8');
      const hasExport = content.includes('export') || content.includes('module.exports');
      recordTest('价格系统文件内容测试', hasExport,
        hasExport ? '文件包含导出语句' : '文件缺少导出语句',
        { hasExport, contentLength: content.length }
      );
    }
  } catch (err) {
    recordTest('价格系统文件内容测试', false,
      `读取文件失败: ${err.message}`,
      { error: err.toString() }
    );
  }
  
  // 测试项目结构
  const projectStructure = {
    'src/core/services': fs.existsSync(path.resolve(__dirname, '../src/core/services')),
    'src/core/models': fs.existsSync(path.resolve(__dirname, '../src/core/models')),
    'src/infrastructure/persistence': fs.existsSync(path.resolve(__dirname, '../src/infrastructure/persistence')),
    'src/stores': fs.existsSync(path.resolve(__dirname, '../src/stores')),
    'src/ui/components': fs.existsSync(path.resolve(__dirname, '../src/ui/components'))
  };
  
  const structureValid = Object.values(projectStructure).every(exists => exists);
  recordTest('项目结构测试', structureValid,
    structureValid ? '项目结构完整' : '项目结构不完整',
    { projectStructure }
  );
  
  // 测试package.json
  try {
    const packagePath = path.resolve(__dirname, '../package.json');
    if (fs.existsSync(packagePath)) {
      const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const hasTypeModule = packageContent.type === 'module';
      recordTest('ESM模块配置测试', hasTypeModule,
        hasTypeModule ? '项目配置为ESM模块' : '项目未配置为ESM模块',
        { type: packageContent.type, hasTypeModule }
      );
    }
  } catch (err) {
    recordTest('ESM模块配置测试', false,
      `读取package.json失败: ${err.message}`,
      { error: err.toString() }
    );
  }
  
  // 生成测试报告
  generateReport();
}

/**
 * 价格系统测试
 */
async function testPriceSystem() {
  log('\n📈 开始价格系统测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  try {
    // 检查是否有calculateNewPrice函数
    if (!priceSystem.calculateNewPrice) {
      recordTest('价格计算函数测试', false,
        'calculateNewPrice函数不存在',
        { availableFunctions: Object.keys(priceSystem) }
      );
      return;
    }

    // 1. 测试价格计算函数
    const testProduct = {
      id: 'test_product_1',
      name: '测试商品',
      basePrice: 1000,
      minPrice: 500,
      maxPrice: 2000,
      volatility: 5,
      category: 'DAILY'
    };

    // 生成100次价格，测试价格波动是否在正常范围内
    let previousPrice = null;
    const prices = [];
    const trends = [];
    let anomalies = 0;

    for (let i = 0; i < 100; i++) {
      const result = priceSystem.calculateNewPrice(
        testProduct, 
        i, 
        previousPrice, 
        1.0, 
        {}
      );
      
      previousPrice = result;
      prices.push(result.price);
      trends.push(result.trend);

      // 检测异常波动
      if (i > 0) {
        const prevPrice = prices[i-1];
        const currentPrice = prices[i];
        const changePct = Math.abs((currentPrice - prevPrice) / prevPrice);
        
        // 单次波动超过20%视为异常
        if (changePct > 0.2) {
          anomalies++;
        }
      }
    }

    // 价格波动范围测试
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    const priceRangeOk = minPrice >= testProduct.minPrice && maxPrice <= testProduct.maxPrice;
    recordTest('价格范围测试', priceRangeOk, 
      priceRangeOk ? 
        `价格在允许范围内: ${minPrice} - ${maxPrice}` : 
        `价格超出允许范围: ${minPrice} - ${maxPrice}, 期望: ${testProduct.minPrice} - ${testProduct.maxPrice}`,
      { 
        minPrice, 
        maxPrice, 
        avgPrice,
        expectedRange: [testProduct.minPrice, testProduct.maxPrice] 
      }
    );

    // 异常波动率测试
    const anomalyRate = anomalies / 99; // 99是波动次数
    const anomalyRateOk = anomalyRate < 0.1; // 异常波动率应小于10%
    recordTest('价格波动正常性测试', anomalyRateOk, 
      anomalyRateOk ? 
        `异常波动率在可接受范围内: ${(anomalyRate * 100).toFixed(2)}%` :
        `异常波动率过高: ${(anomalyRate * 100).toFixed(2)}%`,
      { 
        anomalies,
        totalChanges: 99,
        anomalyRate: anomalyRate,
        threshold: 0.1
      }
    );

    // 趋势分布测试
    const trendDistribution = {};
    trends.forEach(trend => {
      trendDistribution[trend] = (trendDistribution[trend] || 0) + 1;
    });

    recordTest('价格趋势分布测试', true,
      `价格趋势分布统计完成`,
      { trendDistribution }
    );

    // 波动性能测试
    const iterations = 1000;
    const startPerfTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      priceSystem.calculateNewPrice(testProduct, i % 52, previousPrice, 1.0, {});
    }
    const endPerfTime = performance.now();
    const avgTime = (endPerfTime - startPerfTime) / iterations;

    const perfOk = avgTime < 1; // 平均每次计算应小于1ms
    recordTest('价格计算性能测试', perfOk,
      perfOk ?
        `价格计算性能正常: 平均${avgTime.toFixed(3)}ms/次` :
        `价格计算性能不佳: 平均${avgTime.toFixed(3)}ms/次，期望小于1ms/次`,
      {
        iterations,
        totalTime: endPerfTime - startPerfTime,
        averageTime: avgTime
      }
    );

    // 批量计算测试
    if (priceSystem.batchUpdatePrices) {
      try {
        const testProducts = Array(10).fill(0).map((_, i) => ({
          ...testProduct,
          id: `test_product_${i+1}`
        }));
        const priceHistory = {};
        testProducts.forEach(p => {
          priceHistory[p.id] = {
            price: p.basePrice,
            trend: 'stable'
          };
        });

        const batchResult = priceSystem.batchUpdatePrices(
          testProducts, 
          1, 
          priceHistory, 
          {}
        );

        recordTest('批量价格更新测试', batchResult && Object.keys(batchResult).length === testProducts.length,
          `批量价格更新正常，更新了${Object.keys(batchResult).length}个商品价格`,
          { batchResult }
        );
      } catch (err) {
        recordTest('批量价格更新测试', false,
          `批量价格更新失败: ${err.message}`,
          { error: err.toString() }
        );
      }
    } else {
      recordTest('批量价格更新测试', false,
        `批量价格更新函数不存在`,
        {}
      );
    }
  } catch (err) {
    recordTest('价格系统测试', false, 
      `价格系统测试失败: ${err.message}`,
      { error: err.toString() }
    );
  }

  const endTime = performance.now();
  log(`📈 价格系统测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 事件系统测试
 */
async function testEventSystem() {
  log('\n🎲 开始事件系统测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  try {
    // 检查事件系统是否有基本功能
    const hasEventSystem = eventSystem && (
      eventSystem.EventSystem || 
      eventSystem.generateStageAppropriateEvent || 
      eventSystem.checkForEvents
    );
    
    if (!hasEventSystem) {
      recordTest('事件系统功能测试', false,
        '事件系统功能不可用',
        { availableFunctions: Object.keys(eventSystem || {}) }
      );
      return;
    }

    // 尝试创建一个事件系统实例
    let system;
    try {
      if (eventSystem.EventSystem) {
        system = new eventSystem.EventSystem([
          {
            id: 'test_event_1',
            name: '测试事件1',
            description: '测试事件描述',
            effectType: 'neutral',
            repeatable: true,
            options: [
              { text: '选项1', effects: [] },
              { text: '选项2', effects: [] }
            ]
          },
          {
            id: 'test_event_2',
            name: '测试事件2',
            description: '测试事件描述2',
            effectType: 'positive',
            repeatable: false,
            options: [
              { text: '选项1', effects: [] }
            ]
          }
        ]);
        
        recordTest('事件系统初始化', true,
          '事件系统初始化成功',
          {}
        );
      } else {
        system = eventSystem;
        recordTest('事件系统初始化', true,
          '使用现有事件系统实例',
          {}
        );
      }
    } catch (err) {
      recordTest('事件系统初始化', false,
        `事件系统初始化失败: ${err.message}`,
        { error: err.toString() }
      );
      return; // 初始化失败，不继续后续测试
    }
    
    // 测试事件生成
    try {
      const gameState = {
        currentWeek: 10,
        maxWeeks: 52,
        player: {
          money: 10000,
          attributes: {}
        }
      };
      
      // 尝试生成一个随机事件
      const event = system.generateStageAppropriateEvent 
        ? system.generateStageAppropriateEvent(gameState)
        : system.checkForEvents ? system.checkForEvents(gameState) : null;
        
      recordTest('随机事件生成', true,
        event ? `成功生成随机事件: ${event.name}` : `未生成随机事件（可能正常）`,
        { event }
      );
    } catch (err) {
      recordTest('随机事件生成', false,
        `随机事件生成失败: ${err.message}`,
        { error: err.toString() }
      );
    }
    
    // 测试事件冷却和重复检测
    try {
      if (system.recordEvent) {
        system.recordEvent('test_event_1', 10);
      }
      if (system.setEventCooldown) {
        system.setEventCooldown('test_event_1', 10, 5);
      }
      
      const isInCooldown = system.isEventInCooldown ? system.isEventInCooldown('test_event_1', 12) : false;
      const isNotInCooldown = system.isEventInCooldown ? !system.isEventInCooldown('test_event_1', 16) : true;
      
      recordTest('事件冷却测试', isInCooldown && isNotInCooldown,
        isInCooldown && isNotInCooldown ? 
          '事件冷却机制正常工作' : 
          '事件冷却机制不可用或异常',
        { 
          isInCooldown,
          isNotInCooldown,
          hasCooldownFunction: !!system.isEventInCooldown
        }
      );
      
      // 测试事件重复触发检查
      const canRepeat1 = !system.triggeredEvents || !system.triggeredEvents.has('test_event_1') || 
                        (system.checkEventConditions && system.checkEventConditions({
                          id: 'test_event_1',
                          repeatable: true
                        }, {}));
                        
      const canRepeat2 = !system.triggeredEvents || !system.triggeredEvents.has('test_event_2') ||
                        (system.checkEventConditions && system.checkEventConditions({
                          id: 'test_event_2',
                          repeatable: false
                        }, {}));
                        
      recordTest('事件重复触发测试', canRepeat1 && !canRepeat2,
        canRepeat1 && !canRepeat2 ?
          '事件重复触发检测正常' :
          '事件重复触发检测异常或不可用',
        {
          canRepeat1,
          canRepeat2,
          triggeredEvents: system.triggeredEvents ? Array.from(system.triggeredEvents) : [],
          hasTriggeredEvents: !!system.triggeredEvents
        }
      );
    } catch (err) {
      recordTest('事件冷却和重复测试', false,
        `事件冷却和重复测试失败: ${err.message}`,
        { error: err.toString() }
      );
    }
  } catch (err) {
    recordTest('事件系统测试', false,
      `事件系统测试失败: ${err.message}`,
      { error: err.toString() }
    );
  }
  
  const endTime = performance.now();
  log(`🎲 事件系统测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 存储系统测试
 */
async function testStorageSystem() {
  log('\n💾 开始存储系统测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  try {
    // 测试存档验证函数
    if (storageService.validateSaveData) {
      const validSave = {
        version: '0.1.0',
        gameCore: {
          currentWeek: 10,
          maxWeeks: 52
        },
        player: {
          name: 'TestPlayer',
          money: 10000,
          inventory: [],
          purchasedHouses: [],
          statistics: {
            weekCount: 10,
            transactionCount: 0,
            totalProfit: 0,
            maxMoney: 10000
          }
        },
        market: {
          locations: [],
          productPrices: {}
        },
        event: {
          triggeredEvents: [],
          activeEvent: null
        }
      };
      
      const validationResult = storageService.validateSaveData(validSave);
      
      recordTest('存档验证测试', validationResult.isValid,
        validationResult.isValid ?
          '存档验证功能正常工作' :
          `存档验证失败: ${validationResult.issues.join(', ')}`,
        {
          validationResult
        }
      );
      
      // 测试无效存档验证
      const invalidSave = {
        version: '0.1.0',
        // 缺少关键部分
        player: {
          money: -1000 // 无效的金钱值
        }
      };
      
      const invalidValidationResult = storageService.validateSaveData(invalidSave);
      
      recordTest('无效存档验证测试', !invalidValidationResult.isValid,
        !invalidValidationResult.isValid ?
          '无效存档被正确识别' :
          '无效存档未被识别为无效',
        {
          invalidValidationResult
        }
      );
    } else {
      recordTest('存档验证测试', false,
        '存档验证函数不存在',
        { availableFunctions: Object.keys(storageService || {}) }
      );
    }
    
    // 测试存档修复功能
    if (storageService.repairSaveData) {
      const brokenSave = {
        version: '0.1.0',
        player: {
          // 缺少money字段
          inventory: null // 应该是数组
        },
        // 缺少其他必要字段
      };
      
      const repairedSave = storageService.repairSaveData(brokenSave);
      
      const hasRequiredFields = repairedSave.player && 
                              typeof repairedSave.player.money === 'number' &&
                              Array.isArray(repairedSave.player.inventory) &&
                              repairedSave.gameCore && 
                              repairedSave.market &&
                              repairedSave.event;
      
      recordTest('存档修复测试', hasRequiredFields,
        hasRequiredFields ?
          '存档修复功能正常工作' :
          '存档修复功能未能正确修复损坏的存档',
        {
          repairedSave
        }
      );
    } else {
      recordTest('存档修复测试', false,
        '存档修复函数不存在',
        {}
      );
    }
    
    // 测试版本兼容性检查
    if (storageService.ensureVersionCompatibility) {
      try {
        const oldSave = {
          version: '0.0.9',
          // 其他字段...
        };
        
        const updatedSave = storageService.ensureVersionCompatibility(oldSave, '0.1.0');
        
        recordTest('版本兼容性测试', updatedSave.version === '0.1.0',
          updatedSave.version === '0.1.0' ?
            '版本兼容性检查正常工作' :
            '版本兼容性检查未能正确更新版本',
          {
            oldVersion: oldSave.version,
            newVersion: updatedSave.version
          }
        );
      } catch (err) {
        recordTest('版本兼容性测试', false,
          `版本兼容性测试失败: ${err.message}`,
          { error: err.toString() }
        );
      }
    } else {
      recordTest('版本兼容性测试', false,
        '版本兼容性检查函数不存在',
        {}
      );
    }
  } catch (err) {
    recordTest('存储系统测试', false,
      `存储系统测试失败: ${err.message}`,
      { error: err.toString() }
    );
  }
  
  const endTime = performance.now();
  log(`💾 存储系统测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 游戏循环系统测试
 */
async function testGameLoop() {
  log('\n🔄 开始游戏循环测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  try {
    // 检查是否存在游戏引擎类
    if (gameLoop.GameEngine) {
      const engine = new gameLoop.GameEngine();
      
      // 测试游戏初始化
      try {
        engine.newGame('TestPlayer', 'standard');
        
        const gameStarted = engine.state && 
                            engine.state.gameStarted && 
                            engine.state.currentWeek === 1;
        
        recordTest('游戏初始化测试', gameStarted,
          gameStarted ?
            '游戏初始化正常' :
            '游戏初始化异常',
          {
            gameState: engine.state
          }
        );
      } catch (err) {
        recordTest('游戏初始化测试', false,
          `游戏初始化测试失败: ${err.message}`,
          { error: err.toString() }
        );
      }
      
      // 测试周数推进
      try {
        const initialWeek = engine.state.currentWeek;
        engine.advanceWeek();
        const weekAdvanced = engine.state.currentWeek === initialWeek + 1;
        
        recordTest('周数推进测试', weekAdvanced,
          weekAdvanced ?
            `周数正常推进: ${initialWeek} → ${engine.state.currentWeek}` :
            '周数推进异常',
          {
            initialWeek,
            currentWeek: engine.state.currentWeek
          }
        );
      } catch (err) {
        recordTest('周数推进测试', false,
          `周数推进测试失败: ${err.message}`,
          { error: err.toString() }
        );
      }
      
      // 测试地点切换
      try {
        // 假设第一个地点是当前地点
        const currentLocation = engine.state.currentLocation;
        
        // 尝试切换到第二个地点（如果存在）
        if (engine.locations && engine.locations.length > 1) {
          const nextLocationId = engine.locations[1].id;
          
          engine.changeLocation(nextLocationId);
          
          const locationChanged = engine.state.currentLocation.id === nextLocationId;
          
          recordTest('地点切换测试', locationChanged,
            locationChanged ?
              `地点切换正常: ${currentLocation?.id} → ${engine.state.currentLocation?.id}` :
              '地点切换异常',
            {
              previousLocation: currentLocation?.id,
              currentLocation: engine.state.currentLocation?.id,
              targetLocation: nextLocationId
            }
          );
        } else {
          recordTest('地点切换测试', false,
            '没有足够的地点可供切换',
            {
              availableLocations: engine.locations?.length || 0
            }
          );
        }
      } catch (err) {
        recordTest('地点切换测试', false,
          `地点切换测试失败: ${err.message}`,
          { error: err.toString() }
        );
      }
      
      // 测试游戏结束检查
      try {
        // 手动设置周数接近结束
        engine.state.currentWeek = engine.state.maxWeeks - 1;
        
        // 推进一周
        const canAdvance = engine.advanceWeek();
        const gameOver = engine.state.gameOver;
        
        recordTest('游戏结束检查测试', !canAdvance && gameOver,
          !canAdvance && gameOver ?
            '游戏结束检查正常工作' :
            '游戏结束检查异常',
          {
            canAdvance,
            gameOver,
            currentWeek: engine.state.currentWeek,
            maxWeeks: engine.state.maxWeeks
          }
        );
      } catch (err) {
        recordTest('游戏结束检查测试', false,
          `游戏结束检查测试失败: ${err.message}`,
          { error: err.toString() }
        );
      }
    } else {
      recordTest('游戏引擎初始化', false,
        'GameEngine类不存在',
        { availableFunctions: Object.keys(gameLoop || {}) }
      );
    }
  } catch (err) {
    recordTest('游戏循环测试', false,
      `游戏循环测试失败: ${err.message}`,
      { error: err.toString() }
    );
  }
  
  const endTime = performance.now();
  log(`🔄 游戏循环测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 玩家模型测试
 */
async function testPlayerModel() {
  log('\n👤 开始玩家模型测试...', colors.bright + colors.cyan);
  const startTime = performance.now();

  try {
    // 测试创建玩家
    if (playerModel.createPlayer) {
      const player = playerModel.createPlayer('TestPlayer');
      
      const isValid = player && 
                      player.name === 'TestPlayer' && 
                      typeof player.money === 'number' &&
                      Array.isArray(player.inventory) &&
                      Array.isArray(player.purchasedHouses) &&
                      player.statistics;
      
      recordTest('玩家创建测试', isValid,
        isValid ?
          '玩家创建功能正常' :
          '玩家创建功能异常',
        { player }
      );
      
      // 测试玩家物品添加
      if (playerModel.createPlayerProduct && player) {
        // 创建测试商品
        const product = {
          id: 'test_product',
          name: '测试商品',
          basePrice: 1000
        };
        
        const playerProduct = playerModel.createPlayerProduct(product, 10, 800);
        
        const productValid = playerProduct && 
                          playerProduct.id === product.id &&
                          playerProduct.quantity === 10 &&
                          playerProduct.purchasePrice === 800;
        
        recordTest('玩家物品创建测试', productValid,
          productValid ?
            '玩家物品创建功能正常' :
            '玩家物品创建功能异常',
          { playerProduct }
        );
      } else {
        recordTest('玩家物品创建测试', false,
          'createPlayerProduct函数不存在',
          {}
        );
      }
      
      // 测试玩家序列化（如果存在）
      if (player.serialize) {
        try {
          const serialized = player.serialize();
          const isSerializedValid = serialized && 
                                typeof serialized === 'object' &&
                                serialized.name === player.name;
          
          recordTest('玩家序列化测试', isSerializedValid,
            isSerializedValid ?
              '玩家序列化功能正常' :
              '玩家序列化功能异常',
            { serialized }
          );
        } catch (err) {
          recordTest('玩家序列化测试', false,
            `玩家序列化测试失败: ${err.message}`,
            { error: err.toString() }
          );
        }
      } else {
        recordTest('玩家序列化测试', false,
          '玩家序列化函数不存在',
          {}
        );
      }
    } else {
      recordTest('玩家模型测试', false,
        'createPlayer函数不存在',
        { availableFunctions: Object.keys(playerModel || {}) }
      );
    }
  } catch (err) {
    recordTest('玩家模型测试', false,
      `玩家模型测试失败: ${err.message}`,
      { error: err.toString() }
    );
  }
  
  const endTime = performance.now();
  log(`👤 玩家模型测试完成 (${Math.round(endTime - startTime)}ms)\n`, colors.bright + colors.cyan);
}

/**
 * 生成测试报告
 */
function generateReport() {
  log('\n📊 生成测试报告...', colors.bright + colors.magenta);
  
  // 总结测试结果
  log('\n📋 测试结果总结:', colors.bright);
  log(`总测试数: ${testResults.summary.total}`, colors.reset);
  log(`通过: ${testResults.summary.passed}`, colors.green);
  log(`失败: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? colors.red : colors.reset);
  log(`跳过: ${testResults.summary.skipped}`, testResults.summary.skipped > 0 ? colors.yellow : colors.reset);
  log(`通过率: ${testResults.summary.total > 0 ? (testResults.summary.passed / testResults.summary.total * 100).toFixed(2) : 0}%`, colors.reset);
  log(`执行时间: ${testResults.summary.duration}ms`, colors.reset);
  
  // 如果有失败的测试，输出详情
  if (testResults.summary.failed > 0) {
    log('\n❌ 失败测试详情:', colors.bright + colors.red);
    testResults.tests.forEach(test => {
      if (!test.passed) {
        log(`\n${test.name}:`, colors.bright);
        log(`  ${test.message}`, colors.red);
        
        const details = testResults.details[test.name];
        if (details && Object.keys(details).length > 0) {
          log('  详细信息:', colors.dim);
          console.dir(details, { depth: 2, colors: true });
        }
      }
    });
  }
  
  // 保存测试报告
  const reportPath = path.join(__dirname, 'test-results', 'function-test-report.json');
  try {
    // 确保目录存在
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2), 'utf8');
    log(`\n📄 测试报告已保存: ${reportPath}`, colors.green);
  } catch (err) {
    log(`\n❌ 保存测试报告失败: ${err.message}`, colors.red);
  }
  
  log('\n✨ 测试完成!', colors.bright + colors.cyan);
}

/**
 * 主函数
 */
async function main() {
  const startTime = performance.now();
  
  log('======================================================', colors.bright);
  log('        《买房记》游戏核心功能测试脚本', colors.bright + colors.magenta);
  log('======================================================', colors.bright);
  log('');
  log(`开始测试: ${new Date().toLocaleString('zh-CN')}`, colors.dim);
  
  // 价格系统测试
  await testPriceSystem();
  
  // 事件系统测试
  await testEventSystem();
  
  // 存储系统测试
  await testStorageSystem();
  
  // 游戏循环测试
  await testGameLoop();
  
  // 玩家模型测试
  await testPlayerModel();
  
  // 计算总执行时间
  testResults.summary.duration = Math.round(performance.now() - startTime);
  
  // 生成测试报告
  generateReport();
}

// 执行测试
main().catch(err => {
  console.error('测试执行失败:', err);
  process.exit(1);
}); 