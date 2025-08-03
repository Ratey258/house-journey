/**
 * 市场组合函数
 */

import { ref, computed, watch } from 'vue';
import { useMarketService } from '../../../features/market-trading';
import { getAllProducts } from '../../../entities/product';
import { getPredefinedMarkets } from '../../../entities/market';
import type { MarketState, MarketLocation, MarketProduct, TradeAction } from './types';

export function useMarket() {
  // 状态管理
  const state = ref<MarketState>({
    currentLocation: 'commodity_market',
    availableLocations: [],
    selectedProduct: null,
    tradeAmount: 1,
    isTrading: false,
    error: null
  });

  // 市场服务
  const marketService = useMarketService();

  // 初始化数据
  const initializeMarket = () => {
    try {
      const markets = getPredefinedMarkets();
      const products = getAllProducts();
      
      state.value.availableLocations = markets.map(market => ({
        id: market.id,
        name: market.name,
        description: market.description,
        products: products
          .filter(product => product.availableAt.includes(market.id))
          .map(product => ({
            product: {
              id: String(product.id),
              name: product.name,
              description: product.description,
              basePrice: product.basePrice,
              minPrice: product.minPrice,
              maxPrice: product.maxPrice,
              volatility: product.volatility,
              category: product.category,
              size: product.size,
              icon: product.icon,
              availableAt: product.availableAt
            },
            currentPrice: product.basePrice,
            priceChange: 0,
            priceChangePercent: 0,
            trend: 'stable' as const,
            available: true
          }))
      }));
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '初始化市场失败';
    }
  };

  // 计算属性
  const currentLocationData = computed(() => 
    state.value.availableLocations.find(loc => loc.id === state.value.currentLocation)
  );

  const availableProducts = computed(() => 
    currentLocationData.value?.products || []
  );

  const canTrade = computed(() => 
    !state.value.isTrading && 
    state.value.selectedProduct?.available && 
    state.value.tradeAmount > 0
  );

  // 方法
  const changeLocation = (locationId: string) => {
    const location = state.value.availableLocations.find(loc => loc.id === locationId);
    if (location) {
      state.value.currentLocation = locationId;
      state.value.selectedProduct = null;
      state.value.tradeAmount = 1;
    }
  };

  const selectProduct = (product: MarketProduct) => {
    state.value.selectedProduct = product;
    state.value.tradeAmount = 1;
  };

  const setTradeAmount = (amount: number) => {
    if (amount > 0) {
      state.value.tradeAmount = amount;
    }
  };

  const executeTrade = async (action: TradeAction) => {
    if (!canTrade.value) return false;

    state.value.isTrading = true;
    state.value.error = null;

    try {
      const result = await marketService.executeTrade(action);
      if (result.success) {
        // 更新产品价格（模拟市场波动）
        updateProductPrices();
        state.value.selectedProduct = null;
        state.value.tradeAmount = 1;
        return true;
      } else {
        state.value.error = result.error || '交易失败';
        return false;
      }
    } catch (error) {
      state.value.error = error instanceof Error ? error.message : '交易出错';
      return false;
    } finally {
      state.value.isTrading = false;
    }
  };

  const buyProduct = async () => {
    if (!state.value.selectedProduct) return false;

    return await executeTrade({
      type: 'buy',
      productId: String(state.value.selectedProduct.product.id),
      quantity: state.value.tradeAmount,
      price: state.value.selectedProduct.currentPrice
    });
  };

  const sellProduct = async () => {
    if (!state.value.selectedProduct) return false;

    return await executeTrade({
      type: 'sell',
      productId: String(state.value.selectedProduct.product.id),
      quantity: state.value.tradeAmount,
      price: state.value.selectedProduct.currentPrice
    });
  };

  const updateProductPrices = () => {
    // 模拟价格波动
    state.value.availableLocations.forEach(location => {
      location.products.forEach(marketProduct => {
        const product = marketProduct.product;
        const volatility = product.volatility / 100;
        const change = (Math.random() - 0.5) * volatility * product.basePrice;
        
        const oldPrice = marketProduct.currentPrice;
        const newPrice = Math.max(
          product.minPrice,
          Math.min(product.maxPrice, oldPrice + change)
        );
        
        marketProduct.currentPrice = Math.round(newPrice);
        marketProduct.priceChange = marketProduct.currentPrice - oldPrice;
        marketProduct.priceChangePercent = oldPrice > 0 ? 
          (marketProduct.priceChange / oldPrice) * 100 : 0;
        
        if (marketProduct.priceChange > 0) {
          marketProduct.trend = 'up';
        } else if (marketProduct.priceChange < 0) {
          marketProduct.trend = 'down';
        } else {
          marketProduct.trend = 'stable';
        }
      });
    });
  };

  const refreshPrices = () => {
    updateProductPrices();
  };

  // 初始化
  initializeMarket();

  return {
    // 状态
    state: computed(() => state.value),
    currentLocationData,
    availableProducts,
    canTrade,

    // 方法
    changeLocation,
    selectProduct,
    setTradeAmount,
    buyProduct,
    sellProduct,
    refreshPrices
  };
}