import { useMarketStore } from './marketState';

/**
 * 地点系统模块
 * 提供地点相关功能
 */
export const useLocationSystem = () => {
  const marketStore = useMarketStore();
  
  /**
   * 获取所有可访问地点
   * @returns {Array} 可访问地点列表
   */
  const getAllLocations = () => {
    return marketStore.locations;
  };

  /**
   * 获取当前地点
   * @returns {Object|null} 当前地点
   */
  const getCurrentLocation = () => {
    return marketStore.currentLocation;
  };

  /**
   * 移动到指定地点
   * @param {string} locationId - 地点ID
   * @returns {boolean} 是否移动成功
   */
  const moveToLocation = (locationId) => {
    return marketStore.changeLocation(locationId);
  };

  /**
   * 获取地点之间的距离
   * @param {string} fromLocationId - 起始地点ID
   * @param {string} toLocationId - 目标地点ID
   * @returns {number} 距离值（如果地点不存在则返回-1）
   */
  const getLocationDistance = (fromLocationId, toLocationId) => {
    const fromLocation = marketStore.locations.find(loc => loc.id === fromLocationId);
    const toLocation = marketStore.locations.find(loc => loc.id === toLocationId);

    if (!fromLocation || !toLocation) {
      return -1;
    }

    // 简单距离计算示例，实际可以基于地点的坐标或预设的距离矩阵
    if (fromLocation.region === toLocation.region) {
      return 1; // 同区域
    } else {
      return 2; // 跨区域
    }
  };

  /**
   * 获取地点特性
   * @param {string} locationId - 地点ID
   * @returns {Object} 地点特性，包括调整因子、特色商品等
   */
  const getLocationFeatures = (locationId) => {
    const location = marketStore.locations.find(loc => loc.id === locationId);
    if (!location) return null;

    return {
      name: location.name,
      priceFactor: location.modifiers?.priceFactor || 1,
      specialProducts: location.specialProducts || [],
      availableProducts: location.availableProducts || [],
      region: location.region,
      description: location.description
    };
  };

  /**
   * 检查地点是否有特色商品
   * @param {string} locationId - 地点ID
   * @returns {boolean} 是否有特色商品
   */
  const hasSpecialProducts = (locationId) => {
    const location = marketStore.locations.find(loc => loc.id === locationId);
    return location && location.specialProducts && location.specialProducts.length > 0;
  };

  /**
   * 获取推荐地点列表（基于当前库存和市场情况）
   * @param {Array} inventory - 玩家库存
   * @returns {Array} 推荐地点及原因
   */
  const getRecommendedLocations = (inventory) => {
    // 创建推荐列表
    const recommendations = [];

    // 如果玩家有库存物品，找出可以高价销售的地点
    if (inventory && inventory.length > 0) {
      // 找出库存中拥有的产品ID
      const playerProductIds = [...new Set(inventory.map(item => item.productId))];

      // 检查每个地点的价格情况
      marketStore.locations.forEach(location => {
        // 跳过当前地点
        if (marketStore.currentLocation && location.id === marketStore.currentLocation.id) {
          return;
        }

        // 检查这个地点的价格是否对玩家有利
        let totalProfit = 0;
        let profitableProducts = 0;

        playerProductIds.forEach(productId => {
          const product = marketStore.products.find(p => p.id === productId);
          if (!product) return;

          // 如果该地点支持这个产品
          if (location.availableProducts.includes(productId)) {
            // 计算预期价格（考虑地点因子）
            const basePriceData = marketStore.productPrices[productId];
            if (!basePriceData) return;

            // 考虑地点价格调整因子
            const locationPriceFactor = location.modifiers?.priceFactor || 1;
            const estimatedPrice = basePriceData.price * locationPriceFactor;

            // 找出玩家拥有的这种商品
            const inventoryItems = inventory.filter(item => item.productId === productId);

            // 计算潜在利润
            inventoryItems.forEach(item => {
              const potentialProfit = (estimatedPrice - item.purchasePrice) * item.quantity;
              if (potentialProfit > 0) {
                totalProfit += potentialProfit;
                profitableProducts++;
              }
            });
          }
        });

        // 如果有盈利机会，添加到推荐
        if (profitableProducts > 0) {
          recommendations.push({
            locationId: location.id,
            name: location.name,
            estimatedProfit: Math.round(totalProfit),
            profitableProducts,
            reason: `可获利商品: ${profitableProducts}种，预计利润: ${Math.round(totalProfit)}`
          });
        }
      });
    }

    // 添加其他推荐原因（如特色商品）
    marketStore.locations.forEach(location => {
      // 跳过当前地点和已推荐的地点
      if ((marketStore.currentLocation && location.id === marketStore.currentLocation.id) ||
          recommendations.some(r => r.locationId === location.id)) {
        return;
      }

      // 如果有特色商品，添加推荐
      if (location.specialProducts && location.specialProducts.length > 0) {
        recommendations.push({
          locationId: location.id,
          name: location.name,
          specialProducts: location.specialProducts.length,
          reason: `有${location.specialProducts.length}种特色商品`
        });
      }
    });

    // 按预计利润或特色商品排序
    return recommendations.sort((a, b) => {
      // 首先按预计利润排序
      if (a.estimatedProfit && b.estimatedProfit) {
        return b.estimatedProfit - a.estimatedProfit;
      }
      // 其次按特色商品数量排序
      if (a.specialProducts && b.specialProducts) {
        return b.specialProducts - a.specialProducts;
      }
      // 有预计利润的优先
      if (a.estimatedProfit) return -1;
      if (b.estimatedProfit) return 1;
      // 有特色商品的优先
      if (a.specialProducts) return -1;
      if (b.specialProducts) return 1;
      // 默认保持原顺序
      return 0;
    });
  };

  return {
    getAllLocations,
    getCurrentLocation,
    moveToLocation,
    getLocationDistance,
    getLocationFeatures,
    hasSpecialProducts,
    getRecommendedLocations
  };
};
