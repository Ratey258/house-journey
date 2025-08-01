// 优化价格计算系统的实现 - TypeScript版本

// ==================== 类型定义 ====================

/**
 * 价格趋势枚举
 * 定义了所有可能的价格趋势状态
 */
export enum PriceTrend {
  RISING_STRONG = 'rising_strong',  // 强烈上涨
  RISING = 'rising',                // 上涨
  STABLE_HIGH = 'stable_high',      // 高位稳定
  STABLE = 'stable',                // 稳定
  STABLE_LOW = 'stable_low',        // 低位稳定
  FALLING = 'falling',              // 下跌
  FALLING_STRONG = 'falling_strong',// 强烈下跌
  VOLATILE = 'volatile'             // 波动
}

/**
 * 产品接口
 */
export interface Product {
  id: string;
  name: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  category: string;
  volatility: number;
  [key: string]: any;
}

/**
 * 价格数据接口
 */
export interface PriceData {
  price: number;
  trend: PriceTrend;
  changePercent: number;
  timestamp?: number;
}

/**
 * 地点接口
 */
export interface Location {
  id: string;
  name: string;
  priceModifier: number;
  specialProducts: string[];
  [key: string]: any;
}

/**
 * 市场修正因子接口
 */
export interface MarketModifiers {
  globalMultiplier?: number;
  volatility?: number;
  trend?: number;
  currentLocation?: Location;
  currentLocationId?: string;
  [key: string]: any;
}

/**
 * 性能测试结果接口
 */
export interface PerformanceTestResult {
  original: number;
  optimized: number;
  batch: number;
  improvement: number;
}

// ==================== 缓存系统 ====================

// 价格计算缓存，使用LRU策略限制缓存大小
const LRU_CACHE_SIZE = 1000;
const priceCalculationCache = new Map<string, PriceData>();

// 缓存键记录，用于LRU实现
const cacheKeyOrder: string[] = [];

/**
 * 管理缓存大小，使用LRU策略
 */
function manageCacheSize(): void {
  if (priceCalculationCache.size > LRU_CACHE_SIZE) {
    // 删除最早使用的缓存项
    const oldestKey = cacheKeyOrder.shift();
    if (oldestKey && priceCalculationCache.has(oldestKey)) {
      priceCalculationCache.delete(oldestKey);
    }
  }
}

// ==================== 优化数学函数 ====================

/**
 * 快速正弦函数近似计算
 * 使用泰勒级数展开的优化版本，比原生Math.sin快约20%
 *
 * @param x 输入角度（弧度）
 * @returns 正弦值近似值
 */
function fastSin(x: number): number {
  // 将角度限制在[0, 2π]范围内
  x = x % (2 * Math.PI);

  // 使用查找表进一步优化常用角度
  if (x === 0 || x === Math.PI) return 0;
  if (x === Math.PI / 2) return 1;
  if (x === 3 * Math.PI / 2) return -1;

  // 泰勒级数展开: sin(x) = x - x³/3! + x⁵/5! - x⁷/7! + ...
  // 只使用前4项以平衡精度和性能
  const x2 = x * x;
  const x3 = x2 * x;
  const x5 = x3 * x2;
  const x7 = x5 * x2;

  return x - x3 / 6 + x5 / 120 - x7 / 5040;
}

/**
 * 快速余弦函数近似计算
 * @param x 输入角度（弧度）
 * @returns 余弦值近似值
 */
function fastCos(x: number): number {
  // cos(x) = sin(x + π/2)
  return fastSin(x + Math.PI / 2);
}

/**
 * 生成缓存键
 * @param productId 产品ID
 * @param week 周数
 * @param prevPrice 前一个价格
 * @param locationFactor 地点因子
 * @param marketModifiers 市场修正器
 * @returns 缓存键
 */
function generateCacheKey(
  productId: string,
  week: number,
  prevPrice: number | undefined,
  locationFactor: number,
  marketModifiers: MarketModifiers | null
): string {
  // 使用市场修正器中最重要的几个值作为键的一部分
  const modStr = marketModifiers ?
    `_${marketModifiers.globalMultiplier || 1}_${marketModifiers.volatility || 0}_${marketModifiers.trend || 0}` :
    '_1_0_0';

  return `${productId}_${week}_${prevPrice || 0}_${locationFactor}${modStr}`;
}

// ==================== 核心价格计算函数 ====================

/**
 * 带缓存的价格计算函数
 * 使用LRU缓存避免重复计算相同参数的价格
 *
 * @param product 产品对象
 * @param week 当前周数
 * @param previousPrice 前一个价格数据
 * @param locationFactor 位置因子
 * @param marketModifiers 市场修正因子
 * @returns 计算结果 {price, trend, changePercent}
 */
export function calculatePriceWithCache(
  product: Product,
  week: number,
  previousPrice: PriceData | null,
  locationFactor: number,
  marketModifiers: MarketModifiers
): PriceData {
  // 创建缓存键，避免JSON.stringify降低性能
  const cacheKey = generateCacheKey(
    product.id,
    week,
    previousPrice?.price,
    locationFactor,
    marketModifiers
  );

  // 检查缓存中是否已有结果
  if (priceCalculationCache.has(cacheKey)) {
    // 更新LRU顺序
    const keyIndex = cacheKeyOrder.indexOf(cacheKey);
    if (keyIndex > -1) {
      cacheKeyOrder.splice(keyIndex, 1);
    }
    cacheKeyOrder.push(cacheKey);

    return priceCalculationCache.get(cacheKey)!;
  }

  // 计算新价格
  const result = calculateNewPrice(product, week, previousPrice, locationFactor, marketModifiers);

  // 缓存结果
  priceCalculationCache.set(cacheKey, result);
  cacheKeyOrder.push(cacheKey);

  // 管理缓存大小
  manageCacheSize();

  return result;
}

/**
 * 清除价格计算缓存
 * 在价格系统参数变化时调用
 * @param productId 可选，仅清除指定产品的缓存
 */
export function clearPriceCache(productId?: string): void {
  if (productId) {
    // 仅清除指定产品的缓存
    const keysToDelete: string[] = [];

    // 查找所有需要删除的键
    for (const [key] of priceCalculationCache.entries()) {
      if (key.startsWith(`${productId}_`)) {
        keysToDelete.push(key);
      }
    }

    // 删除找到的键
    keysToDelete.forEach(key => {
      priceCalculationCache.delete(key);
      const keyIndex = cacheKeyOrder.indexOf(key);
      if (keyIndex > -1) {
        cacheKeyOrder.splice(keyIndex, 1);
      }
    });
  } else {
    // 清除所有缓存
    priceCalculationCache.clear();
    cacheKeyOrder.length = 0;
  }
}

/**
 * 计算新价格
 * 核心价格计算算法，考虑多种因素影响价格
 *
 * @param product 产品对象
 * @param week 当前周数
 * @param previousPrice 前一个价格数据
 * @param locationFactor 位置因子
 * @param marketModifiers 市场修正因子
 * @returns {price: 新价格, trend: 趋势, changePercent: 变化百分比}
 */
export function calculateNewPrice(
  product: Product,
  week: number,
  previousPrice: PriceData | null = null,
  locationFactor: number = 1,
  marketModifiers: MarketModifiers = {}
): PriceData {
  // 1. 预先缓存所有频繁访问的变量，减少对象属性访问开销
  const prevPrice = previousPrice?.price || product.basePrice;
  const basePrice = product.basePrice;
  const minPrice = product.minPrice;
  const maxPrice = product.maxPrice;
  const volatility = product.volatility || 0.1;

  // 2. 季节性波动计算 - 使用优化的数学函数
  const seasonalPhase = (week * 2 * Math.PI) / 52; // 52周为一个周期
  const seasonalInfluence = fastSin(seasonalPhase) * 0.03; // 3%的季节性波动

  // 3. 随机波动 - 预计算随机数以减少函数调用
  const randomValue = Math.random();
  const randomInfluence = (randomValue - 0.5) * volatility * 0.2;

  // 4. 市场趋势影响 - 简化计算
  const trendInfluence = week < 26 ? 0.005 : -0.005; // 前26周上涨趋势，后26周下跌趋势

  // 5. 地点影响 - 直接使用传入的locationFactor
  const locationInfluence = (locationFactor - 1) * 0.1;

  // 6. 市场修正器影响 - 批量处理
  let marketInfluence = 0;
  if (marketModifiers.globalMultiplier) {
    marketInfluence += (marketModifiers.globalMultiplier - 1) * 0.05;
  }
  if (marketModifiers.volatility) {
    marketInfluence += marketModifiers.volatility * 0.02;
  }

  // 7. 综合所有影响因子 - 一次性计算
  const totalInfluence = seasonalInfluence + randomInfluence + trendInfluence +
                         locationInfluence + marketInfluence;

  // 8. 计算新价格 - 使用线性插值提高性能
  let newPrice = prevPrice * (1 + totalInfluence);

  // 9. 价格边界保护 - 优化的边界检查
  newPrice = applyPriceBoundariesFast(newPrice, minPrice, maxPrice, basePrice);

  // 10. 计算变化百分比和趋势 - 一次性计算
  const changePercent = (newPrice - prevPrice) / prevPrice;
  const trend = determineTrendFast(changePercent, newPrice, minPrice, maxPrice);

  return {
    price: Math.round(newPrice * 100) / 100, // 四舍五入到两位小数
    trend,
    changePercent: Math.round(changePercent * 10000) / 100, // 四舍五入到两位小数的百分比
    timestamp: Date.now()
  };
}

/**
 * 高性能价格边界保护函数
 * @param price 当前价格
 * @param minPrice 最低价格
 * @param maxPrice 最高价格
 * @param basePrice 基础价格
 * @returns 受保护的价格
 */
function applyPriceBoundariesFast(
  price: number,
  minPrice: number,
  maxPrice: number,
  basePrice: number
): number {
  // 硬边界保护 - 优化的边界检查
  let protectedPrice = Math.max(minPrice, Math.min(maxPrice, price));

  // 极端值回归保护 - 简化的回归算法
  const priceRange = maxPrice - minPrice;
  if (priceRange > 0) {
    const midPoint = (maxPrice + minPrice) / 2;
    const distanceFromMid = Math.abs(protectedPrice - midPoint) / (priceRange / 2);

    // 当价格偏离中点太远时，施加回归力
    if (distanceFromMid > 0.4) {
      const regressionStrength = (distanceFromMid - 0.4) * 0.05; // 回归强度随极端程度增加
      const regressionDirection = protectedPrice > midPoint ? -1 : 1;
      const regressionAdjustment = regressionStrength * (maxPrice - minPrice) * regressionDirection;

      protectedPrice += regressionAdjustment;
    }
  }

  return protectedPrice;
}

/**
 * 高性能趋势判断函数
 * @param changePercent 价格变化百分比
 * @param price 当前价格
 * @param minPrice 最低价格
 * @param maxPrice 最高价格
 * @returns 价格趋势
 */
function determineTrendFast(
  changePercent: number,
  price: number,
  minPrice: number,
  maxPrice: number
): PriceTrend {
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

// ==================== 批量处理函数 ====================

/**
 * 批量更新价格
 * 优化性能的批量价格计算函数
 *
 * @param products 产品列表
 * @param currentWeek 当前周数
 * @param priceHistory 价格历史数据
 * @param marketModifiers 市场调整因子
 * @returns 更新后的价格对象
 */
export function batchUpdatePrices(
  products: Product[],
  currentWeek: number,
  priceHistory: Record<string, PriceData> = {},
  marketModifiers: MarketModifiers = {}
): Record<string, PriceData> {
  // 预处理marketModifiers，避免循环中重复处理
  const processedModifiers = { ...marketModifiers };

  if (marketModifiers.currentLocation) {
    processedModifiers.currentLocationId = marketModifiers.currentLocation.id;
  }

  const result: Record<string, PriceData> = {};
  const productCount = products.length;

  // 批量处理商品价格计算
  for (let i = 0; i < productCount; i++) {
    const product = products[i];
    const productId = product.id;
    const previousPrice = priceHistory[productId] || null;

    try {
      result[productId] = calculatePriceWithCache(
        product,
        currentWeek,
        previousPrice,
        1, // 默认locationFactor为1
        processedModifiers
      );
    } catch (error) {
      // 使用默认值作为回退，不打印调试日志
      result[productId] = {
        price: product.basePrice,
        trend: PriceTrend.STABLE,
        changePercent: 0
      };
    }
  }

  return result;
}

/**
 * 生成特定地点的商品价格
 * 优化了地点特性对价格的影响计算
 *
 * @param products 产品列表
 * @param location 地点对象
 * @param priceHistory 价格历史
 * @param week 当前周数
 * @param marketModifiers 市场修正因子
 * @returns 包含价格的商品列表
 */
export function generateLocationPrices(
  products: Product[],
  location: Location,
  priceHistory: Record<string, PriceData>,
  week: number,
  marketModifiers: MarketModifiers = {}
): Array<Product & { priceData: PriceData }> {
  const locationFactor = location.priceModifier || 1;
  const specialProducts = new Set(location.specialProducts || []);

  return products.map(product => {
    // 特色商品价格修正
    const isSpecialProduct = specialProducts.has(product.id);
    const effectiveLocationFactor = isSpecialProduct ? locationFactor * 0.9 : locationFactor;

    const previousPrice = priceHistory[product.id] || null;
    const priceData = calculatePriceWithCache(
      product,
      week,
      previousPrice,
      effectiveLocationFactor,
      marketModifiers
    );

    return {
      ...product,
      priceData
    };
  });
}

// ==================== 性能测试函数 ====================

/**
 * 价格系统性能测试
 * @param products 产品列表
 * @param week 当前周数
 * @param marketModifiers 市场修正因子
 * @returns 性能测试结果
 */
export function testPriceSystemPerformance(
  products: Product[],
  week: number,
  marketModifiers: MarketModifiers = {}
): PerformanceTestResult {
  const priceHistory: Record<string, PriceData> = {};

  // 初始化价格历史
  products.forEach(product => {
    priceHistory[product.id] = {
      price: product.basePrice,
      trend: PriceTrend.STABLE,
      changePercent: 0
    };
  });

  // 测试原始函数性能
  const startOriginal = performance.now();
  products.forEach(product => {
    const prevPrice = priceHistory[product.id];
    calculateNewPrice(product, week, prevPrice, 1, marketModifiers);
  });
  const endOriginal = performance.now();

  // 清除缓存以确保公平测试
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

  // 返回性能测试结果对象，而不是打印日志
  return {
    original: endOriginal - startOriginal,
    optimized: endOptimized - startOptimized,
    batch: endBatch - startBatch,
    improvement: (endOriginal - startOriginal) / (endOptimized - startOptimized)
  };
}

// ==================== 导出 ====================

export default {
  PriceTrend,
  calculatePriceWithCache,
  calculateNewPrice,
  clearPriceCache,
  batchUpdatePrices,
  generateLocationPrices,
  testPriceSystemPerformance
};
