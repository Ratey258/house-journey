import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { getAllProducts } from '../../core/models/product';
import { getAllLocations } from '../../core/models/location';
import { getAllHouses } from '../../core/models/house';
import { PriceTrend } from '../../core/services/priceSystem';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';
import { usePriceActions } from './priceActions';

/**
 * 价格信息类型
 */
export interface PriceInfo {
  price: number;
  trend: typeof PriceTrend[keyof typeof PriceTrend];
  history: number[];
  changePercent: number;
}

/**
 * 产品类型（与core models兼容）
 */
export interface Product {
  id: string | number;
  name: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  basePrice: number;
  description?: string;
  volatility?: number;
  size?: number;
  icon?: string;
  availableAt?: string[];
  level?: number;
}

/**
 * 地点类型
 */
export interface Location {
  id: string;
  name: string;
  description?: string;
  priceModifier?: number;
  availableProducts?: string[];
}

/**
 * 房屋类型（与core models兼容）
 */
export interface House {
  id: string;
  name: string;
  price: number;
  level?: number;
  description?: string;
  specialFeature?: string;
  purchaseCondition?: string;
  image?: string;
}

/**
 * 市场调整因子类型
 */
export interface MarketModifiers {
  globalPriceModifier: number;
  categoryModifiers: Record<string, number>;
  productModifiers: Record<string, number>;
  locationModifiers: Record<string, number>;
  locationProductModifiers: Record<string, Record<string, number>>;
  weeksSinceLastGlobalChange: number;
  categoryUnchangedWeeks: Record<string, number>;
  productUnchangedWeeks: Record<string, number>;
  locationUnchangedWeeks: Record<string, number>;
  locationProductUnchangedWeeks: Record<string, Record<string, number>>;
  currentLocation?: Location;
}

/**
 * 市场状态类型
 */
export interface MarketState {
  locations: Location[];
  currentLocation: Location | null;
  productPrices: Record<string, PriceInfo>;
  products: Product[];
  availableProducts: Product[];
  houses: House[];
  marketModifiers: MarketModifiers;
  initialized: boolean;
}

/**
 * 市场状态管理 - TypeScript Setup Store版本
 * 负责市场价格、地点、房屋等数据的管理
 *
 * 🎯 特性:
 * - 完整的TypeScript类型安全
 * - Setup Store现代化语法
 * - 智能日志集成
 * - 价格动态调整系统
 * - 地区差异化定价
 * - 响应式状态保护
 */
export const useMarketStore = defineStore('market', () => {
  const logger = useSmartLogger();

  // ===== 状态定义 =====
  const locations = ref<Location[]>([]);
  const currentLocation = ref<Location | null>(null);
  const productPrices = ref<Record<string, PriceInfo>>({});
  const products = ref<Product[]>([]);
  const availableProducts = ref<Product[]>([]);
  const houses = ref<House[]>([]);
  const initialized = ref<boolean>(false);

  const marketModifiers = ref<MarketModifiers>({
    globalPriceModifier: 1,
    categoryModifiers: {},
    productModifiers: {},
    locationModifiers: {},
    locationProductModifiers: {},
    weeksSinceLastGlobalChange: 0,
    categoryUnchangedWeeks: {},
    productUnchangedWeeks: {},
    locationUnchangedWeeks: {},
    locationProductUnchangedWeeks: {}
  });

  // ===== 计算属性 =====
  const currentLocationProducts = computed((): Product[] => {
    if (!currentLocation.value || !products.value.length) {
      return [];
    }

    // 如果地点有指定可用产品，则只返回这些产品
        if (currentLocation.value.availableProducts?.length) {
      return products.value.filter(p =>
        currentLocation.value!.availableProducts?.includes(String(p.id))
      );
    }

    // 否则返回所有产品
    return products.value;
  });

  const marketSummary = computed(() => {
    const totalProducts = products.value.length;
    const averagePrice = Object.values(productPrices.value)
      .reduce((sum, info) => sum + info.price, 0) / totalProducts || 0;

    const trendCounts = Object.values(productPrices.value)
      .reduce((counts, info) => {
        counts[info.trend] = (counts[info.trend] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

    return {
      totalProducts,
      totalLocations: locations.value.length,
      totalHouses: houses.value.length,
      averagePrice,
      trendCounts,
      currentLocationName: currentLocation.value?.name || '未选择',
      availableProductCount: availableProducts.value.length
    };
  });

  const priceStatistics = computed(() => {
    const prices = Object.values(productPrices.value).map(info => info.price);
    if (prices.length === 0) return null;

    const sorted = [...prices].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    return { min, max, median, avg };
  });

  // ===== 方法定义 =====

  /**
   * 初始化市场数据
   */
  const initializeMarket = async (): Promise<void> => {
    try {
      logger.info('开始初始化市场数据');

      // 模拟异步加载过程
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          // 获取地点数据
          locations.value = getAllLocations();
          logger.debug('地点数据加载完成', { count: locations.value.length });

          // 获取商品数据
          products.value = getAllProducts();
          logger.info('商品数据加载完成', {
            count: products.value.length,
            categories: [...new Set(products.value.map(p => p.category))]
          });

          // 获取房屋数据
          houses.value = getAllHouses();
          logger.debug('房屋数据加载完成', { count: houses.value.length });

          // 初始化价格
          initializeProductPrices();

          // 重置市场调整因子
          resetMarketModifiers();

          // 设置初始地点
          if (locations.value.length > 0) {
            setCurrentLocation(locations.value[0].id);
          }

          initialized.value = true;
          resolve();
        }, 500);
      });

      logger.info('市场初始化完成', {
        locations: locations.value.length,
        products: products.value.length,
        houses: houses.value.length,
        currentLocation: currentLocation.value?.name
      });

    } catch (error) {
      handleError(error, 'marketState (initializeMarket)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      logger.error('市场初始化失败', { error: error.message });
      throw error;
    }
  };

  /**
   * 初始化产品价格
   */
  const initializeProductPrices = (): void => {
    logger.debug('初始化产品价格');

    const newPrices: Record<string, PriceInfo> = {};

    products.value.forEach(product => {
      // 初始价格设置在最低价和最高价之间的随机值
      const initialPrice = Math.floor(
        Math.random() * (product.maxPrice - product.minPrice) + product.minPrice
      );

      newPrices[product.id] = {
        price: initialPrice,
        trend: PriceTrend.STABLE,
        history: [initialPrice],
        changePercent: 0
      };
    });

    productPrices.value = newPrices;

    logger.info('产品价格初始化完成', {
      productCount: Object.keys(newPrices).length,
      averagePrice: Object.values(newPrices).reduce((sum, info) => sum + info.price, 0) / Object.keys(newPrices).length
    });
  };

  /**
   * 重置市场调整因子
   */
  const resetMarketModifiers = (): void => {
    marketModifiers.value = {
      globalPriceModifier: 1,
      categoryModifiers: {},
      productModifiers: {},
      locationModifiers: {},
      locationProductModifiers: {},
      weeksSinceLastGlobalChange: 0,
      categoryUnchangedWeeks: {},
      productUnchangedWeeks: {},
      locationUnchangedWeeks: {},
      locationProductUnchangedWeeks: {}
    };

    logger.debug('市场调整因子已重置');
  };

  /**
   * 更新市场状态
   */
  const updateMarketState = (currentWeek: number): void => {
    logger.info('更新市场状态', { week: currentWeek });

    try {
      // 更新市场修正因子
      updateMarketModifiers();

      // 更新商品价格
      const { updateProductPrices } = usePriceActions();

      if (typeof updateProductPrices !== 'function') {
        logger.error('updateProductPrices 不是函数');
        return;
      }

      // 添加当前地点信息到市场修正因子
      if (currentLocation.value) {
        marketModifiers.value.currentLocation = currentLocation.value;
      }

      // 更新商品价格
      updateProductPrices(currentWeek);

      // 更新当前地点的商品
      updateLocationProducts();

      logger.info('市场状态更新完成', {
        week: currentWeek,
        location: currentLocation.value?.name,
        availableProducts: availableProducts.value.length
      });

    } catch (error) {
      handleError(error, 'marketState (updateMarketState)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      logger.error('市场状态更新失败', { week: currentWeek, error: error.message });
    }
  };

  /**
   * 更新市场调整因子
   * 随机波动市场价格调整因子，使市场更加动态
   */
  const updateMarketModifiers = (): void => {
    const modifiers = marketModifiers.value;
    logger.debug('更新市场调整因子');

    // 全局价格修正因子波动
    modifiers.weeksSinceLastGlobalChange++;

    if (modifiers.weeksSinceLastGlobalChange >= Math.max(4, Math.floor(Math.random() * 5) + 4)) {
      modifiers.weeksSinceLastGlobalChange = 0;

      if (Math.random() < 0.7) {
        const oldModifier = modifiers.globalPriceModifier;
        const variance = (Math.random() - 0.5) * 0.2;
        modifiers.globalPriceModifier = Math.max(0.8, Math.min(1.2, oldModifier + variance));

        logger.info('全局价格修正因子更新', {
          from: oldModifier.toFixed(2),
          to: modifiers.globalPriceModifier.toFixed(2)
        });
      }
    }

    // 类别价格修正因子波动
    const categories = ['food', 'electronics', 'luxury', 'daily', 'collectible'];
    categories.forEach(category => {
      modifiers.categoryUnchangedWeeks[category] = (modifiers.categoryUnchangedWeeks[category] || 0) + 1;

      if (modifiers.categoryUnchangedWeeks[category] >= 4 || Math.random() < 0.3) {
        modifiers.categoryUnchangedWeeks[category] = 0;

        if (Math.random() < 0.6) {
          const oldModifier = modifiers.categoryModifiers[category] || 1;
          const variance = (Math.random() - 0.5) * 0.15;
          modifiers.categoryModifiers[category] = Math.max(0.85, Math.min(1.15, oldModifier + variance));

          logger.debug('类别价格修正因子更新', {
            category,
            from: oldModifier.toFixed(2),
            to: modifiers.categoryModifiers[category].toFixed(2)
          });
        }
      }
    });

    // 地区价格修正因子波动
    locations.value.forEach(location => {
      modifiers.locationUnchangedWeeks[location.id] = (modifiers.locationUnchangedWeeks[location.id] || 0) + 1;

      if (modifiers.locationUnchangedWeeks[location.id] >= 5 || Math.random() < 0.2) {
        modifiers.locationUnchangedWeeks[location.id] = 0;

        if (Math.random() < 0.4) {
          const oldModifier = modifiers.locationModifiers[location.id] || 1;
          const variance = (Math.random() - 0.5) * 0.1;
          modifiers.locationModifiers[location.id] = Math.max(0.9, Math.min(1.1, oldModifier + variance));

          logger.debug('地区价格修正因子更新', {
            location: location.name,
            from: oldModifier.toFixed(2),
            to: modifiers.locationModifiers[location.id].toFixed(2)
          });
        }
      }
    });
  };

  /**
   * 切换当前地点
   */
  const changeLocation = (locationId: string): boolean => {
    const location = locations.value.find(l => l.id === locationId);

    if (!location) {
      logger.warn('地点不存在', { locationId });
      return false;
    }

    const oldLocation = currentLocation.value;
    currentLocation.value = location;

    // 更新当前地点的可用商品
    updateLocationProducts();

    logger.info('切换地点', {
      from: oldLocation?.name || '无',
      to: location.name,
      availableProducts: availableProducts.value.length
    });

    return true;
  };

  /**
   * 设置当前地点
   */
  const setCurrentLocation = (locationId: string): void => {
    changeLocation(locationId);
  };

  /**
   * 更新当前地点的商品列表
   */
  const updateLocationProducts = (): void => {
    if (!currentLocation.value) {
      availableProducts.value = [];
      return;
    }

    availableProducts.value = currentLocationProducts.value;

    logger.debug('更新地点商品', {
      location: currentLocation.value.name,
      availableCount: availableProducts.value.length,
      totalCount: products.value.length
    });
  };

  /**
   * 获取产品当前价格
   */
  const getProductPrice = (productId: string): number => {
    const priceInfo = productPrices.value[productId];
    if (!priceInfo) {
      logger.warn('产品价格信息不存在', { productId });
      return 0;
    }

    return Math.round(priceInfo.price * (marketModifiers.value.globalPriceModifier || 1));
  };

  /**
   * 获取产品价格趋势
   */
  const getProductTrend = (productId: string): string => {
    const priceInfo = productPrices.value[productId];
    return priceInfo?.trend || PriceTrend.STABLE;
  };

  /**
   * 获取产品价格历史
   */
  const getProductHistory = (productId: string): number[] => {
    const priceInfo = productPrices.value[productId];
    return priceInfo?.history || [];
  };

  /**
   * 获取产品详细信息
   */
  const getProduct = (productId: string): Product | undefined => {
    return products.value.find(p => p.id === productId);
  };

  /**
   * 获取地点信息
   */
  const getLocation = (locationId: string): Location | undefined => {
    return locations.value.find(l => l.id === locationId);
  };

  /**
   * 获取房屋信息
   */
  const getHouse = (houseId: string): House | undefined => {
    return houses.value.find(h => h.id === houseId);
  };

  /**
   * 根据类别筛选产品
   */
  const getProductsByCategory = (category: string): Product[] => {
    return products.value.filter(p => p.category === category);
  };

  /**
   * 搜索产品
   */
  const searchProducts = (keyword: string): Product[] => {
    const lowerKeyword = keyword.toLowerCase();
    return products.value.filter(p =>
      p.name.toLowerCase().includes(lowerKeyword) ||
      p.category.toLowerCase().includes(lowerKeyword) ||
      p.description?.toLowerCase().includes(lowerKeyword)
    );
  };

  /**
   * 获取价格变化百分比
   */
  const getPriceChangePercent = (productId: string): number => {
    const priceInfo = productPrices.value[productId];
    return priceInfo?.changePercent || 0;
  };

  /**
   * 检查是否为好时机购买
   */
  const isGoodTimeToBuy = (productId: string): boolean => {
    const priceInfo = productPrices.value[productId];
    if (!priceInfo) return false;

    return priceInfo.trend === PriceTrend.DOWN ||
           (priceInfo.trend === PriceTrend.STABLE && priceInfo.changePercent < -5);
  };

  /**
   * 检查是否为好时机出售
   */
  const isGoodTimeToSell = (productId: string): boolean => {
    const priceInfo = productPrices.value[productId];
    if (!priceInfo) return false;

    return priceInfo.trend === PriceTrend.UP ||
           (priceInfo.trend === PriceTrend.STABLE && priceInfo.changePercent > 5);
  };

  /**
   * 重置市场状态
   */
  const resetMarket = (): void => {
    locations.value = [];
    currentLocation.value = null;
    productPrices.value = {};
    products.value = [];
    availableProducts.value = [];
    houses.value = [];
    initialized.value = false;
    resetMarketModifiers();

    logger.info('市场状态已重置');
  };

  // ===== 返回状态和方法 =====
  return {
    // 状态 (只读)
    locations: readonly(locations),
    currentLocation: readonly(currentLocation),
    productPrices: readonly(productPrices),
    products: readonly(products),
    availableProducts: readonly(availableProducts),
    houses: readonly(houses),
    marketModifiers: readonly(marketModifiers),
    initialized: readonly(initialized),

    // 计算属性
    currentLocationProducts,
    marketSummary,
    priceStatistics,

    // 方法
    initializeMarket,
    updateMarketState,
    changeLocation,
    setCurrentLocation,
    updateLocationProducts,
    getProductPrice,
    getProductTrend,
    getProductHistory,
    getProduct,
    getLocation,
    getHouse,
    getProductsByCategory,
    searchProducts,
    getPriceChangePercent,
    isGoodTimeToBuy,
    isGoodTimeToSell,
    resetMarket,

    // 内部方法（用于价格系统）
    initializeProductPrices,
    updateMarketModifiers,
    resetMarketModifiers
  };
});

// 类型导出（避免重复导出）
