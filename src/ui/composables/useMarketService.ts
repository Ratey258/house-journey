/**
 * 现代化市场服务 Composable
 * 基于依赖注入的市场服务访问层
 */
import { ref, computed, inject, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue';
import type { DIContainer } from '../../infrastructure/di/container';
import type { MarketService } from '../../application/services/marketService';
import type { TradeResult } from '../../application/interfaces/services';
import { withErrorHandling } from '../../infrastructure/utils/errorHandler';
import { ErrorType } from '../../infrastructure/utils/errorTypes';

// 类型定义
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  basePrice: number;
  [key: string]: any;
}

interface Location {
  id: string;
  name: string;
  factor: number;
  [key: string]: any;
}

interface PriceInfo {
  price: number;
  trend: string;
  confidence: number;
  lastUpdated: Date;
}

interface UseMarketServiceReturn {
  // 状态
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  
  // 方法
  buyProduct: (productId: string, quantity: number) => Promise<TradeResult>;
  sellProduct: (productId: string, quantity: number) => Promise<TradeResult>;
  updateMarketPrices: (weekNumber: number) => Promise<any>;
  changeLocation: (locationId: string, weekNumber: number) => Promise<any>;
  getMarketStatus: () => Promise<any>;
  
  // 工具方法
  clearError: () => void;
}

/**
 * 现代化市场服务 Composable
 * 通过依赖注入获取MarketService，提供类型安全的市场操作
 */
export function useMarketService(): UseMarketServiceReturn {
  // 通过依赖注入获取服务
  const container = inject<DIContainer>('diContainer');
  if (!container) {
    throw new Error('DI容器未正确配置。请确保在应用根部提供了diContainer。');
  }

  const marketService = container.resolve<MarketService>('marketService');
  
  // 响应式状态
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  /**
   * 购买商品
   */
  const buyProduct = async (productId: string, quantity: number): Promise<TradeResult> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await marketService.tradeProduct(productId, quantity, true);
      
      if (!result.success) {
        error.value = result.message || '购买失败';
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '购买过程中发生错误';
      error.value = errorMessage;
      
      return {
        success: false,
        message: errorMessage,
        newBalance: 0
      };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 销售商品
   */
  const sellProduct = async (productId: string, quantity: number): Promise<TradeResult> => {
    isLoading.value = true;
    error.value = null;

    try {
      const result = await marketService.tradeProduct(productId, quantity, false);
      
      if (!result.success) {
        error.value = result.message || '销售失败';
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '销售过程中发生错误';
      error.value = errorMessage;
      
      return {
        success: false,
        message: errorMessage,
        newBalance: 0
      };
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 更新市场价格
   */
  const updateMarketPrices = async (weekNumber: number): Promise<any> => {
    isLoading.value = true;
    error.value = null;

    try {
      return await marketService.updateMarketPrices(weekNumber);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新价格失败';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 变更当前地点
   */
  const changeLocation = async (locationId: string, weekNumber: number): Promise<any> => {
    isLoading.value = true;
    error.value = null;

    try {
      return await marketService.changeLocation(locationId, weekNumber);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '地点切换失败';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 获取市场状态
   */
  const getMarketStatus = async (): Promise<any> => {
    isLoading.value = true;
    error.value = null;

    try {
      return await marketService.getMarketStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取市场状态失败';
      error.value = errorMessage;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 清除错误信息
   */
  const clearError = (): void => {
    error.value = null;
  };

  return {
    // 状态
    isLoading,
    error,
    
    // 方法
    buyProduct,
    sellProduct,
    updateMarketPrices,
    changeLocation,
    getMarketStatus,
    
    // 工具方法
    clearError
  };
}