/**
 * 市场组合式API
 * 提供市场功能的Vue组合式API
 */
import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue';
import { useGameStore } from '../../stores';
import container from '../../infrastructure/di/container';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';

// 类型定义
interface Product {
  id: string;
  name: string;
  price: number;
  [key: string]: any;
}

interface Location {
  id: string;
  name: string;
  [key: string]: any;
}

interface TradeResult {
  success: boolean;
  message?: string;
  [key: string]: any;
}

interface ProductPurchasedData {
  productId: string;
  quantity: number;
  price: number;
  [key: string]: any;
}

interface UseMarketReturn {
  // 状态
  availableProducts: ComputedRef<Product[]>;
  productPrices: ComputedRef<Record<string, number>>;
  playerInventory: ComputedRef<Product[]>;
  currentLocation: ComputedRef<Location>;
  buyQuantity: Ref<number>;
  sellQuantity: Ref<number>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  successMessage: Ref<string | null>;
  
  // 方法
  buyProduct: (productId: string) => Promise<boolean>;
  sellProduct: (productId: string) => Promise<boolean>;
  changeLocation: (locationId: string) => Promise<boolean>;
  getProductPrice: (productId: string) => number;
  getProductTrend: (productId: string) => string;
  calculateProfit: (productId: string, buyPrice: number, sellPrice: number) => number;
  canBuyProduct: (productId: string) => boolean;
  canSellProduct: (productId: string) => boolean;
  clearMessages: () => void;
}

/**
 * 市场组合式API
 * @returns 市场相关的状态和方法
 */
export function useMarket(): UseMarketReturn {
  // 初始化智能日志系统
  const { game } = useSmartLogger();
  
  // 获取服务实例
  const marketService = container.resolve('marketService');
  const eventEmitter = container.resolve('eventEmitter');
  
  // 状态
  const gameStore = useGameStore();
  const buyQuantity = ref(1);
  const sellQuantity = ref(1);
  const isLoading = ref(false);
  const error = ref(null);
  const successMessage = ref(null);
  
  // 计算属性
  const availableProducts = computed(() => gameStore.availableProducts);
  const productPrices = computed(() => gameStore.productPrices);
  const playerInventory = computed(() => gameStore.player.inventory);
  const currentLocation = computed(() => gameStore.currentLocation);
  const playerMoney = computed(() => gameStore.player.money);
  
  /**
   * 购买商品
   * @param {string} productId 商品ID
   * @returns {Promise<boolean>} 操作是否成功
   */
  const buyProduct = async (productId) => {
 try {
      const quantity = buyQuantity.value;
      const result = await marketService.tradeProduct(
        productId, 
        quantity, 
        true // isBuying
      );
      
      if (!result.success) {
        error.value = result.message;
        return false;
      }
      
      // 获取商品名称
      const product = availableProducts.value.find(p => p.id === productId);
      const productName = product ? product.name : '商品';
      
      // 设置成功消息
      successMessage.value = `成功购买${quantity}个${productName}`;
      
      // 重置数量
      buyQuantity.value = 1;
      
      return true;
    } catch (err) {
    handleError(err, 'useMarket (composables)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    error.value = err.message;
      return false;}  return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * 销售商品
   * @param {string} productId 商品ID
   * @returns {Promise<boolean>} 操作是否成功
   */
  const sellProduct = async (productId) => {
 try {
      const quantity = sellQuantity.value;
      const result = await marketService.tradeProduct(
        productId, 
        quantity, 
        false // isBuying = false
      );
      
      if (!result.success) {
        error.value = result.message;
        return false;
      }
      
      // 获取商品名称
      const inventoryItem = playerInventory.value.find(item => item.productId === productId);
      const productName = inventoryItem ? inventoryItem.name : '商品';
      
      // 设置成功消息
      successMessage.value = `成功出售${quantity}个${productName}`;
      
      // 重置数量
      sellQuantity.value = 1;
      
      return true;
    } catch (err) {
    handleError(err, 'useMarket (composables)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    error.value = err.message;
      return false;}  return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * 变更地点
   * @param {string} locationId 地点ID
   * @returns {Promise<boolean>} 操作是否成功
   */
  const changeLoctry {
      await marketService.changeLocation(locationId, gameStore.currentWeek);
      return true;
    } catch (err) {
    handleError(err, 'useMarket (composables)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    error.value = err.message;
      return false;}  return true;
    } catch (err) {
      error.value = err.message;
      return false;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * 获取商品价格
   * @param {string} productId 商品ID
   * @returns {number} 商品价格
   */
  const getProductPrice = (productId) => {
    return productPrices.value[productId]?.price || 0;
  };
  
  /**
   * 获取商品趋势
   * @param {string} productId 商品ID
   * @returns {string} 商品趋势
   */
  const getProductTrend = (productId) => {
    return productPrices.value[productId]?.trend || 'stable';
  };
  
  /**
   * 计算利润
   * @param {Object} item 库存物品
   * @returns {number} 利润
   */
  const calculateProfit = (item) => {
    const currentPrice = getProductPrice(item.productId);
    return (currentPrice - item.purchasePrice) * item.quantity;
  };
  
  /**
   * 检查是否能够购买
   * @param {string} productId 商品ID
   * @param {number} quantity 数量
   * @returns {boolean} 是否能够购买
   */
  const canBuyProduct = (productId, quantity = 1) => {
    const price = getProductPrice(productId);
    const totalCost = price * (quantity || buyQuantity.value);
    
    // 检查资金是否足够
    if (playerMoney.value < totalCost) {
      return false;
    }
    
    // 检查背包空间
    const product = availableProducts.value.find(p => p.id === productId);
    if (!product) return false;
    
    const requiredSpace = product.size * (quantity || buyQuantity.value);
    const remainingSpace = gameStore.player.capacity - gameStore.player.inventoryUsed;
    
    return remainingSpace >= requiredSpace;
  };
  
  /**
   * 检查是否能够销售
   * @param {string} productId 商品ID
   * @param {number} quantity 数量
   * @returns {boolean} 是否能够销售
   */
  const canSellProduct = (productId, quantity = 1) => {
    const inventoryItem = playerInventory.value.find(item => item.productId === productId);
    return inventoryItem && inventoryItem.quantity >= (quantity || sellQuantity.value);
  };
  
  /**
   * 清除消息
   */
  const clearMessages = () => {
    error.value = null;
    successMessage.value = null;
  };
  
  // 事件处理
  const handleProductPurchased = (data: ProductPurchasedData) => {
    // 可以在这里添加额外的UI反馈
    game.debug('产品购买成功', data, 'product-purchased');
  };
  
  const handleProductSold = (data: ProductPurchasedData) => {
    // 可以在这里添加额外的UI反馈
    game.debug('产品售出成功', data, 'product-sold');
  };
  
  // 组件生命周期
  onMounted(() => {
    // 订阅事件
    eventEmitter.on('PRODUCT_PURCHASED', handleProductPurchased);
    eventEmitter.on('PRODUCT_SOLD', handleProductSold);
  });
  
  onUnmounted(() => {
    // 取消订阅
    eventEmitter.off('PRODUCT_PURCHASED', handleProductPurchased);
    eventEmitter.off('PRODUCT_SOLD', handleProductSold);
  });
  
  return {
    // 状态
    availableProducts,
    productPrices,
    playerInventory,
    currentLocation,
    buyQuantity,
    sellQuantity,
    isLoading,
    error,
    successMessage,
    
    // 方法
    buyProduct,
    sellProduct,
    changeLocation,
    getProductPrice,
    getProductTrend,
    calculateProfit,
    canBuyProduct,
    canSellProduct,
    clearMessages
  };
} 