/**
 * 价格系统测试脚本
 * 用于验证价格波动系统的正确性
 */

import { calculateNewPrice, PriceTrend } from '@/core/services/priceSystem';

/**
 * 测试不同商品类别的价格波动
 */
function testPriceFluctuations() {
  console.log('===== 价格波动系统测试 =====');
  
  // 创建测试商品
  const testProducts = [
    {
      id: 101,
      name: '日常用品测试',
      category: 'DAILY',
      minPrice: 10,
      maxPrice: 30,
      basePrice: 15,
      volatility: 2
    },
    {
      id: 201,
      name: '食品测试',
      category: 'FOOD',
      minPrice: 20,
      maxPrice: 60,
      basePrice: 35,
      volatility: 4
    },
    {
      id: 301,
      name: '电子产品测试',
      category: 'ELECTRONICS',
      minPrice: 1000,
      maxPrice: 3000,
      basePrice: 1800,
      volatility: 6
    },
    {
      id: 401,
      name: '奢侈品测试',
      category: 'LUXURY',
      minPrice: 5000,
      maxPrice: 15000,
      basePrice: 8000,
      volatility: 8
    },
    {
      id: 501,
      name: '收藏品测试',
      category: 'COLLECTIBLE',
      minPrice: 500,
      maxPrice: 5000,
      basePrice: 1500,
      volatility: 10
    }
  ];
  
  // 测试不同周数的价格变化
  const testWeeks = [1, 5, 10, 20, 30, 40, 52];
  
  // 记录每个商品的价格历史
  const priceHistory = {};
  testProducts.forEach(product => {
    priceHistory[product.id] = {
      price: product.basePrice,
      trend: PriceTrend.STABLE,
      history: [product.basePrice]
    };
  });
  
  // 模拟价格波动
  testWeeks.forEach(week => {
    console.log(`\n--- 第 ${week} 周价格 ---`);
    
    testProducts.forEach(product => {
      const prevPriceData = priceHistory[product.id];
      
      // 计算新价格
      const newPriceData = calculateNewPrice(
        product,
        week,
        prevPriceData
      );
      
      // 更新价格历史
      priceHistory[product.id] = {
        price: newPriceData.price,
        trend: newPriceData.trend,
        history: [...prevPriceData.history, newPriceData.price].slice(-10)
      };
      
      // 输出结果
      console.log(
        `${product.name}:`,
        `¥${newPriceData.price}`,
        `(${newPriceData.changePercent > 0 ? '+' : ''}${newPriceData.changePercent.toFixed(1)}%)`,
        `趋势: ${newPriceData.trend}`,
        `价格范围: ${(100 * (newPriceData.price - product.minPrice) / (product.maxPrice - product.minPrice)).toFixed(1)}%`
      );
    });
  });
  
  // 验证价格是否在范围内
  console.log('\n--- 价格范围验证 ---');
  let allInRange = true;
  
  testProducts.forEach(product => {
    const history = priceHistory[product.id].history;
    const minPrice = Math.min(...history);
    const maxPrice = Math.max(...history);
    
    const isMinInRange = minPrice >= product.minPrice;
    const isMaxInRange = maxPrice <= product.maxPrice;
    const inRange = isMinInRange && isMaxInRange;
    
    console.log(
      `${product.name}:`,
      `范围检查: ${inRange ? '通过' : '失败'}`,
      `最低: ¥${minPrice}`,
      `最高: ¥${maxPrice}`,
      `(预期范围: ¥${product.minPrice}-¥${product.maxPrice})`
    );
    
    if (!inRange) allInRange = false;
  });
  
  console.log(`\n总结: 价格范围测试 ${allInRange ? '全部通过' : '存在失败'}`);
  
  return allInRange;
}

/**
 * 测试地点价格修正
 */
function testLocationModifiers() {
  console.log('\n===== 地点价格修正测试 =====');
  
  // 创建测试商品
  const testProduct = {
    id: 101,
    name: '测试商品',
    category: 'DAILY',
    minPrice: 100,
    maxPrice: 300,
    basePrice: 200,
    volatility: 5
  };
  
  // 创建测试地点
  const testLocations = [
    { id: 'loc1', name: '便宜地点', priceModifier: 0.8, specialProducts: [] },
    { id: 'loc2', name: '普通地点', priceModifier: 1.0, specialProducts: [] },
    { id: 'loc3', name: '昂贵地点', priceModifier: 1.2, specialProducts: [] },
    { id: 'loc4', name: '特价地点', priceModifier: 1.0, specialProducts: [101] }
  ];
  
  // 初始价格数据
  const initialPriceData = {
    price: testProduct.basePrice,
    trend: PriceTrend.STABLE
  };
  
  // 测试不同地点的价格影响
  testLocations.forEach(location => {
    // 准备市场修正因子
    const marketModifiers = {
      specialProducts: location.specialProducts
    };
    
    // 计算新价格
    const newPriceData = calculateNewPrice(
      testProduct,
      10, // 假设第10周
      initialPriceData,
      location.priceModifier,
      marketModifiers
    );
    
    // 计算价格比例（相对于基础价格）
    const priceRatio = newPriceData.price / testProduct.basePrice;
    
    // 输出结果
    console.log(
      `${location.name}:`,
      `¥${newPriceData.price}`,
      `(基础价格比例: ${priceRatio.toFixed(2)})`,
      `修正系数: ${location.priceModifier}`,
      `特价商品: ${location.specialProducts.includes(testProduct.id) ? '是' : '否'}`
    );
  });
}

/**
 * 测试市场修正因子
 */
function testMarketModifiers() {
  console.log('\n===== 市场修正因子测试 =====');
  
  // 创建测试商品
  const testProduct = {
    id: 201,
    name: '测试商品',
    category: 'FOOD',
    minPrice: 100,
    maxPrice: 300,
    basePrice: 200,
    volatility: 5
  };
  
  // 初始价格数据
  const initialPriceData = {
    price: testProduct.basePrice,
    trend: PriceTrend.STABLE
  };
  
  // 测试不同市场修正因子的影响
  const testCases = [
    { name: '无修正', modifiers: {} },
    { name: '全局上涨', modifiers: { globalPriceModifier: 1.2 } },
    { name: '全局下跌', modifiers: { globalPriceModifier: 0.8 } },
    { name: '类别修正', modifiers: { categoryModifier: 'FOOD', modifier: 1.3 } },
    { name: '商品修正', modifiers: { productModifiers: { 201: 1.5 } } },
    { name: '组合修正', modifiers: { 
      globalPriceModifier: 1.1,
      categoryModifier: 'FOOD',
      modifier: 1.2,
      productModifiers: { 201: 1.1 }
    }}
  ];
  
  testCases.forEach(testCase => {
    // 计算新价格
    const newPriceData = calculateNewPrice(
      testProduct,
      10, // 假设第10周
      initialPriceData,
      1.0, // 默认地点修正
      testCase.modifiers
    );
    
    // 计算价格比例（相对于基础价格）
    const priceRatio = newPriceData.price / testProduct.basePrice;
    
    // 输出结果
    console.log(
      `${testCase.name}:`,
      `¥${newPriceData.price}`,
      `(基础价格比例: ${priceRatio.toFixed(2)})`
    );
  });
}

/**
 * 运行所有测试
 */
export function runPriceSystemTests() {
  const inRangeResult = testPriceFluctuations();
  testLocationModifiers();
  testMarketModifiers();
  
  console.log(`\n===== 测试完成 =====`);
  return inRangeResult;
}

// 如果直接执行此文件，运行测试
if (typeof window !== 'undefined' && window.runTest) {
  runPriceSystemTests();
} 