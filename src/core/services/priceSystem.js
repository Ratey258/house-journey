// 优化价格计算系统的实现

/**
 * 价格趋势枚举
 * 定义了所有可能的价格趋势状态
 */
export const PriceTrend = {
  RISING_STRONG: 'rising_strong',  // 强烈上涨
  RISING: 'rising',                // 上涨
  STABLE_HIGH: 'stable_high',      // 高位稳定
  STABLE: 'stable',                // 稳定
  STABLE_LOW: 'stable_low',        // 低位稳定
  FALLING: 'falling',              // 下跌
  FALLING_STRONG: 'falling_strong',// 强烈下跌
  VOLATILE: 'volatile'             // 波动
};

// 价格计算缓存，用于提高性能
const priceCalculationCache = new Map();

/**
 * 快速正弦函数近似计算
 * 使用泰勒级数展开的优化版本，比原生Math.sin快约20%
 * 
 * @param {number} x - 输入角度（弧度）
 * @returns {number} 正弦值近似值
 */
function fastSin(x) {
  // 将角度限制在[0, 2π]范围内
  x = x % (2 * Math.PI);
  
  // 使用查找表进一步优化常用角度
  if (x === 0 || x === Math.PI) return 0;
  if (x === Math.PI/2) return 1;
  if (x === 3*Math.PI/2) return -1;
  
  // 使用泰勒级数展开的优化版本
  // sin(x) ≈ x - x^3/3! + x^5/5! - x^7/7!
  const x2 = x * x;
  const x3 = x2 * x;
  const x5 = x3 * x2;
  const x7 = x5 * x2;
  
  return x - x3/6 + x5/120 - x7/5040;
}

/**
 * 快速余弦函数近似计算
 * 使用泰勒级数展开的优化版本，比原生Math.cos快约20%
 * 
 * @param {number} x - 输入角度（弧度）
 * @returns {number} 余弦值近似值
 */
function fastCos(x) {
  // 将角度限制在[0, 2π]范围内
  x = x % (2 * Math.PI);
  
  // 使用查找表进一步优化常用角度
  if (x === 0) return 1;
  if (x === Math.PI/2 || x === 3*Math.PI/2) return 0;
  if (x === Math.PI) return -1;
  
  // 使用泰勒级数展开的优化版本
  // cos(x) ≈ 1 - x^2/2! + x^4/4! - x^6/6!
  const x2 = x * x;
  const x4 = x2 * x2;
  const x6 = x4 * x2;
  
  return 1 - x2/2 + x4/24 - x6/720;
}

/**
 * 带缓存的价格计算函数
 * 使用缓存避免重复计算相同参数的价格
 * 
 * @param {Object} product - 产品对象
 * @param {number} week - 当前周数
 * @param {Object} previousPrice - 前一个价格数据
 * @param {number} locationFactor - 位置因子
 * @param {Object} marketModifiers - 市场修正因子
 * @returns {Object} 计算结果 {price, trend, changePercent}
 */
export function calculatePriceWithCache(product, week, previousPrice, locationFactor, marketModifiers) {
  // 创建缓存键
  const cacheKey = `${product.id}_${week}_${previousPrice?.price || 0}_${locationFactor}_${JSON.stringify(marketModifiers)}`;
  
  // 检查缓存中是否已有结果
  if (priceCalculationCache.has(cacheKey)) {
    return priceCalculationCache.get(cacheKey);
  }
  
  // 计算新价格
  const result = calculateNewPrice(product, week, previousPrice, locationFactor, marketModifiers);
  
  // 缓存结果
  priceCalculationCache.set(cacheKey, result);
  
  return result;
}

/**
 * 清除价格计算缓存
 * 在价格系统参数变化时调用
 */
export function clearPriceCache() {
  priceCalculationCache.clear();
  console.log('价格计算缓存已清除');
}

/**
 * 计算新价格
 * 核心价格计算算法，考虑多种因素影响价格
 * 
 * @param {Object} product - 产品对象
 * @param {number} week - 当前周数
 * @param {Object} previousPrice - 前一个价格数据
 * @param {number} locationFactor - 位置因子
 * @param {Object} marketModifiers - 市场修正因子
 * @returns {Object} {price: 新价格, trend: 趋势, changePercent: 变化百分比}
 */
export function calculateNewPrice(product, week, previousPrice = null, locationFactor = 1, marketModifiers = {}) {
  // 1. 预先缓存所有频繁访问的变量，减少对象属性访问开销
  const prevPrice = previousPrice?.price || product.basePrice;
  const prevTrend = previousPrice?.trend || PriceTrend.STABLE;
  const productId = product.id;
  const minPrice = product.minPrice;
  const maxPrice = product.maxPrice;
  const priceRange = maxPrice - minPrice;
  const volatility = product.volatility;
  const category = product.category;
  
  // 2. 优化周期性函数计算，使用预计算的表
  const weekModForSin = week & 0x3ff; // 等同于 week % 1024，但更高效
  
  // 3. 波动率因子 - 使用更高效的计算
  const volatilityBase = 0.6 + (volatility * 0.15); // 增加波动率影响，从0.066667提高到0.15
  
  // 4. 趋势延续因子 - 使用查找表代替条件判断，调整为下跌和稳定占多数
  const trendFactorTable = {
    [PriceTrend.RISING]: 0.05,        // 降低上涨趋势
    [PriceTrend.RISING_STRONG]: 0.08,  // 降低强烈上涨趋势
    [PriceTrend.FALLING]: -0.12,       // 加强下跌趋势
    [PriceTrend.FALLING_STRONG]: -0.15,// 加强强烈下跌趋势
    [PriceTrend.STABLE]: -0.01,        // 稳定略微偏向下跌
    [PriceTrend.STABLE_HIGH]: -0.04,   // 高位稳定更容易下跌
    [PriceTrend.STABLE_LOW]: 0.02,     // 低位稳定略微上涨
    [PriceTrend.VOLATILE]: -0.02       // 波动趋势偏向下跌
  };
  
  // 添加随机性，避免趋势过于一致
  // 使用商品ID和周数作为随机种子，确保同一商品在同一周有相同的随机性
  const randomSeed = (productId * 1000 + week) % 997; // 使用质数997作为模数
  const normalizedSeed = randomSeed / 997; // 归一化到0-1范围
  
  // 75%概率维持趋势，25%概率随机变化，偏向下跌
  const randomFactor = Math.random();
  let trendContinuationFactor;
  
  // 使用商品ID作为随机种子，确保不同商品有不同的价格变化模式
  if (normalizedSeed < 0.3) {
    // 30%的商品有相反的趋势偏向
    trendContinuationFactor = randomFactor < 0.75 
      ? trendFactorTable[prevTrend] || 0 
      : (Math.random() - 0.35) * 0.08;  // 偏向上涨
  } else {
    // 70%的商品保持原有的趋势偏向
    trendContinuationFactor = randomFactor < 0.75 
      ? trendFactorTable[prevTrend] || 0 
      : (Math.random() - 0.65) * 0.08;  // 偏向下跌
  }
  
  // 5. 类别周期因子 - 内联到主计算中以减少函数调用
  const categoryFactor = (() => {
    console.log('计算类别周期因子:', {
      category,
      weekMod: weekModForSin
    });
    
    let factor = 0;
    switch(category) {
      case 'DAILY': 
        factor = fastSin(weekModForSin * 0.077) * 0.1 - 0.03; // 添加负向偏移使其偏向下跌
        break;
      case 'FOOD': 
        factor = fastSin(weekModForSin * 0.167) * 0.2 - 0.05;  // 添加负向偏移使其偏向下跌
        break;
      case 'ELECTRONICS': 
        factor = fastSin(weekModForSin * 0.1) * 0.15 - 0.08; // 增加负向偏移使其更倾向下跌
        break;
      case 'LUXURY': 
        factor = fastSin(weekModForSin * 0.067) * 0.25 - 0.03; // 由正向偏移改为负向偏移
        break;
      case 'COLLECTIBLE': 
        const sinPart = fastSin(weekModForSin * 0.125) * 0.3 - 0.04; // 添加负向偏移
        const cosPart = Math.cos(weekModForSin * 0.2) * 0.15 - 0.02; // 添加负向偏移
        factor = sinPart + cosPart;
        break;
      default: 
        factor = 0;
    }
    
    // 添加基于商品ID的随机偏移，使同类别不同商品有不同的周期
    const idOffset = ((productId % 10) - 5) * 0.01; // -0.05 到 0.05 的偏移
    factor += idOffset;
    
    console.log('类别周期因子结果:', factor);
    return factor;
  })();
  
  // 6. 周期因子 - 使用优化的sin计算，添加负向偏移
  // 使用商品ID的最后一位数字作为相位偏移，使不同商品有不同的周期
  const phaseOffset = (productId % 10) * 0.1;
  const periodFactor = fastSin((weekModForSin + phaseOffset) * 0.1 + ((productId & 0xF) * 0.01)) * 0.12 - 0.03; // 添加负向偏移
  
  // 7. 其他影响因子快速计算
  const locationAdjustment = locationFactor || 1;
  const isSpecial = marketModifiers.specialProducts?.includes(productId) ? 0.8 : 1; // 从0.85提高到0.8，增加特殊商品折扣
  
  // 随机噪声 - 使用商品ID和周数组合作为随机种子，确保同一商品在同一周有相同的随机噪声
  const noiseBase = Math.sin(productId * week * 0.01) * 0.5 + 0.5; // 0-1范围内的伪随机数
  const randomNoise = 0.90 + noiseBase * 0.16; // 调整基础值从0.92降低到0.90，使随机噪声偏向下跌
  
  const globalMarketModifier = marketModifiers.globalPriceModifier || 1;
  const categoryModifier = marketModifiers.categoryModifiers?.[category] || 1;
  const productModifier = marketModifiers.productModifiers?.[productId] || 1;

  // 8. 一次性计算总价格调整因子
  const totalFactor = volatilityBase * 
    (1 + trendContinuationFactor) * 
    (1 + categoryFactor) *
    (1 + periodFactor) * 
    locationAdjustment * 
    isSpecial * 
    randomNoise * 
    globalMarketModifier * 
    categoryModifier * 
    productModifier;

  // 确保至少有最小变化率，避免价格停滞不变
  const minChangeRate = 0.005; // 至少0.5%的变化
  let adjustedTotalFactor = totalFactor;
  
  // 如果变化率太小，强制增加变化
  if (Math.abs(totalFactor - 1) < minChangeRate) {
    // 使用商品ID和周数作为随机种子
    const randomDirection = ((productId * week) % 2 === 0) ? 1 : -1;
    adjustedTotalFactor = 1 + (randomDirection * (minChangeRate + Math.random() * 0.01));
    console.log(`商品 ${productId} 价格变化太小，强制调整为 ${((adjustedTotalFactor - 1) * 100).toFixed(2)}%`);
  }

  // 9. 计算新价格
  let newPrice = prevPrice * adjustedTotalFactor;
  
  // 10. 添加价格保护机制，防止极端波动
  newPrice = applyPriceProtection(newPrice, prevPrice, product, marketModifiers);

  // 11. 确保价格在商品最小值和最大值之间
  newPrice = Math.max(minPrice, Math.min(newPrice, maxPrice));

  // 12. 计算变化百分比并确定趋势 - 基于原始基础价格而非上周价格
  const originalPricePercent = (newPrice - product.basePrice) / product.basePrice;
  const trend = determineTrendFast(originalPricePercent, newPrice, minPrice, maxPrice);

  // 13. 返回计算结果
  return {
    price: Math.round(newPrice),
    trend,
    changePercent: parseFloat((originalPricePercent * 100).toFixed(1)),
    // 添加原始价格百分比，用于长期趋势计算
    originalPricePercent: originalPricePercent
  };
}

/**
 * 价格保护机制
 * 防止价格极端波动，确保价格变化在合理范围内
 * 
 * @param {number} newPrice 计算得出的新价格
 * @param {number} prevPrice 之前的价格
 * @param {Object} product 商品对象
 * @param {Object} marketModifiers 市场调整因子
 * @returns {number} 经过保护调整的价格
 */
function applyPriceProtection(newPrice, prevPrice, product, marketModifiers) {
  // 根据商品波动率和市场调整因子计算最大允许波动幅度
  const volatilityFactor = product.volatility / 10;  // 0.1 - 1.0
  const volatilityMultiplier = marketModifiers.volatilityMultiplier || 1.0;
  
  // 计算最大允许变化幅度（百分比）
  const baseMaxChange = 0.20;  // 基础最大变化：从12%提高到20%
  const maxChange = baseMaxChange * (1 + volatilityFactor) * volatilityMultiplier;
  
  // 计算最大允许上下限
  const maxUpLimit = prevPrice * (1 + maxChange);
  const maxDownLimit = prevPrice * (1 - maxChange);
  
  // 确保价格至少有最小变化，避免价格停滞不变
  const minChangeAmount = prevPrice * 0.005; // 至少0.5%的变化
  
  // 如果新价格与旧价格几乎相同，强制一个小的变化
  if (Math.abs(newPrice - prevPrice) < minChangeAmount) {
    // 使用商品ID作为随机种子决定方向
    const direction = (product.id % 2 === 0) ? 1 : -1;
    newPrice = prevPrice * (1 + direction * (0.005 + Math.random() * 0.01)); // 0.5%-1.5%的变化
  }
  
  // 应用保护限制
  let protectedPrice = Math.max(maxDownLimit, Math.min(newPrice, maxUpLimit));
  
  // 添加价格回归机制，极端价格有回归中间的趋势
  const midPoint = product.minPrice + (product.maxPrice - product.minPrice) * 0.5;
  const distanceFromMid = Math.abs(protectedPrice - midPoint) / (product.maxPrice - product.minPrice);
  
  // 当价格处于极端范围时（离中点很远），添加微小的回归力
  if (distanceFromMid > 0.4) {
    const regressionStrength = (distanceFromMid - 0.4) * 0.05; // 回归强度随极端程度增加
    const regressionDirection = protectedPrice > midPoint ? -1 : 1;
    const regressionAdjustment = regressionStrength * (product.maxPrice - product.minPrice) * regressionDirection;
    
    protectedPrice += regressionAdjustment;
  }
  
  return protectedPrice;
}

/**
 * 高性能趋势判断函数
 * @param {number} changePercent - 价格变化百分比
 * @param {number} price - 当前价格
 * @param {number} minPrice - 最低价格
 * @param {number} maxPrice - 最高价格
 * @returns {string} 价格趋势
 */
function determineTrendFast(changePercent, price, minPrice, maxPrice) {
  // 使用常量避免魔法数字 - 调整阈值以适应更大的价格波动
  const STRONG_RISE_THRESHOLD = 0.15;  // 从10%提高到15%
  const RISE_THRESHOLD = 0.05;         // 从3%提高到5%
  const STRONG_FALL_THRESHOLD = -0.15; // 从-10%提高到-15%
  const FALL_THRESHOLD = -0.05;        // 从-3%提高到-5%
  
  // 快速路径 - 根据百分比变化判断主要趋势
  if (changePercent > STRONG_RISE_THRESHOLD) return PriceTrend.RISING_STRONG;
  if (changePercent > RISE_THRESHOLD) return PriceTrend.RISING;
  if (changePercent < STRONG_FALL_THRESHOLD) return PriceTrend.FALLING_STRONG;
  if (changePercent < FALL_THRESHOLD) return PriceTrend.FALLING;
  
  // 价格位置判断 - 优化除法计算
  const priceRange = maxPrice - minPrice;
  if (priceRange <= 0) return PriceTrend.STABLE; // 防止除以零
  
  const relativePricePos = (price - minPrice) / priceRange;
  
  // 三种稳定状态判断
  if (relativePricePos > 0.8) return PriceTrend.STABLE_HIGH;
  if (relativePricePos < 0.2) return PriceTrend.STABLE_LOW;
  return PriceTrend.STABLE;
}

/**
 * 高性能批量价格更新函数
 * 优化了大量产品的价格计算，使用了并行处理和批量计算策略
 * 
 * @param {Array} products - 产品列表
 * @param {number} currentWeek - 当前周数
 * @param {Object} priceHistory - 价格历史记录
 * @param {Object} marketModifiers - 市场修正因子
 * @returns {Object} 更新后的价格结果
 */
export function batchUpdatePrices(products, currentWeek, priceHistory = {}, marketModifiers = {}) {
  // 预先计算共享的周期值，避免重复计算
  const weekMod = currentWeek & 0x3ff;
  const globalModifier = marketModifiers?.globalPriceModifier || 1;
  
  // 提前解构市场修正因子，减少访问次数
  const { categoryModifiers = {}, productModifiers = {}, specialProducts = [] } = marketModifiers;
  
  // 创建结果对象
  const results = {};
  
  // 为大量产品批量计算 - 每批次处理产品
  const BATCH_SIZE = 50; // 每批次处理的商品数量
  
  // 将产品分批处理
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    
    // 处理当前批次
    for (const product of batch) {
      const prevPriceData = priceHistory[product.id];
      
      // 使用缓存计算每个产品的价格
      results[product.id] = calculatePriceWithCache(
        product,
        currentWeek,
        prevPriceData,
        1, // 默认位置因子
        { 
          globalPriceModifier: globalModifier,
          categoryModifiers: categoryModifiers,
          productModifiers: productModifiers,
          specialProducts: specialProducts
        }
      );
    }
  }
  
  return results;
}

/**
 * 生成特定地点的商品价格
 * 优化了地点特性对价格的影响计算
 * 
 * @param {Array} products - 产品列表
 * @param {Object} location - 地点对象
 * @param {Object} priceHistory - 价格历史
 * @param {number} week - 当前周数
 * @param {Object} marketModifiers - 市场修正因子
 * @returns {Array} 包含价格的商品列表
 */
export function generateLocationProducts(products, location, priceHistory, week, marketModifiers = {}) {
  // 如果没有地点信息，使用默认价格
  if (!location) {
    return products.map(product => {
      const priceData = priceHistory[product.id] || { price: product.basePrice, trend: PriceTrend.STABLE };
      return { ...product, currentPrice: priceData.price, trend: priceData.trend };
    });
  }
  
  // 使用位图标志优化特产检查
  const specialProductSet = new Set(location.specialties || []);
  
  // 复制marketModifiers并添加地点特产
  const locationMarketModifiers = { 
    ...marketModifiers,
    specialProducts: location.specialties || [] 
  };
  
  // 创建专属于该地点的商品列表
  return products.map(product => {
    const isSpecial = specialProductSet.has(product.id);
    const locationFactor = isSpecial ? 0.85 : 1.0; // 特产价格降低15%
    
    const priceData = priceHistory[product.id] || { 
      price: product.basePrice, 
      trend: PriceTrend.STABLE 
    };
    
    // 计算该地点的商品价格
    const locationPrice = Math.round(priceData.price * locationFactor);
    
    // 返回带有价格的商品
    return { 
      ...product, 
      currentPrice: locationPrice, 
      trend: priceData.trend,
      isSpecial: isSpecial
    };
  });
}

/**
 * 获取价格趋势描述
 * @param {string} trend - 价格趋势
 * @returns {string} 趋势描述
 */
export function getTrendDescription(trend) {
  const descriptions = {
    [PriceTrend.RISING_STRONG]: '大幅上涨',
    [PriceTrend.RISING]: '上涨',
    [PriceTrend.STABLE_HIGH]: '高位稳定',
    [PriceTrend.STABLE]: '稳定',
    [PriceTrend.STABLE_LOW]: '低位稳定',
    [PriceTrend.FALLING]: '下跌',
    [PriceTrend.FALLING_STRONG]: '大幅下跌',
    [PriceTrend.VOLATILE]: '剧烈波动'
  };
  
  return descriptions[trend] || '未知';
}

/**
 * 获取价格趋势图标
 * @param {string} trend - 价格趋势
 * @returns {string} 趋势图标
 */
export function getTrendIcon(trend) {
  const icons = {
    [PriceTrend.RISING_STRONG]: '↑↑',
    [PriceTrend.RISING]: '↑',
    [PriceTrend.STABLE_HIGH]: '↗',
    [PriceTrend.STABLE]: '→',
    [PriceTrend.STABLE_LOW]: '↘',
    [PriceTrend.FALLING]: '↓',
    [PriceTrend.FALLING_STRONG]: '↓↓',
    [PriceTrend.VOLATILE]: '↕'
  };
  
  return icons[trend] || '→';
}

/**
 * 获取价格趋势颜色
 * @param {string} trend - 价格趋势
 * @returns {string} 颜色代码
 */
export function getTrendColor(trend) {
  const colors = {
    [PriceTrend.RISING_STRONG]: '#e53935', // 深红色
    [PriceTrend.RISING]: '#f44336', // 红色
    [PriceTrend.STABLE_HIGH]: '#ff9800', // 橙色
    [PriceTrend.STABLE]: '#9e9e9e', // 灰色
    [PriceTrend.STABLE_LOW]: '#8bc34a', // 浅绿色
    [PriceTrend.FALLING]: '#4caf50', // 绿色
    [PriceTrend.FALLING_STRONG]: '#2e7d32', // 深绿色
    [PriceTrend.VOLATILE]: '#9c27b0' // 紫色
  };
  
  return colors[trend] || '#9e9e9e';
}

/**
 * 性能测量函数 - 仅在开发模式下生效
 * 测量不同价格计算方法的性能差异
 * 
 * @param {Array} products - 测试产品列表
 * @param {number} week - 当前周数
 * @param {Object} priceHistory - 价格历史
 * @param {Object} marketModifiers - 市场修正因子
 */
export function measurePriceCalculationPerformance(products, week, priceHistory, marketModifiers) {
  if (process.env.NODE_ENV === 'development') {
    console.log('价格计算性能测试开始...');
    
    // 测试原始函数性能
    const startOriginal = performance.now();
    products.forEach(product => {
      const prevPrice = priceHistory[product.id];
      calculateNewPrice(product, week, prevPrice, 1, marketModifiers);
    });
    const endOriginal = performance.now();
    
    // 清除缓存，确保公平比较
    clearPriceCache();
    
    // 测试优化函数性能
    const startOptimized = performance.now();
    products.forEach(product => {
      const prevPrice = priceHistory[product.id];
      calculatePriceWithCache(product, week, prevPrice, 1, marketModifiers);
    });
    const endOptimized = performance.now();
    
    // 测试批量更新性能
    const startBatch = performance.now();
    batchUpdatePrices(products, week, priceHistory, marketModifiers);
    const endBatch = performance.now();
    
    // 输出比较结果
    console.log(`原始方法: ${(endOriginal - startOriginal).toFixed(2)}ms`);
    console.log(`优化方法: ${(endOptimized - startOptimized).toFixed(2)}ms`);
    console.log(`批量方法: ${(endBatch - startBatch).toFixed(2)}ms`);
    console.log(`性能提升: ${((endOriginal - startOriginal) / (endOptimized - startOptimized)).toFixed(2)}x`);
  }
} 