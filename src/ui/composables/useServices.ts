/**
 * 统一服务访问 Composable
 * 提供所有业务服务的统一访问入口
 */
import { inject } from 'vue';
import type { DIContainer } from '../../infrastructure/di/container';
import type { MarketService } from '../../application/services/marketService';
import type { 
  IPlayerRepository, 
  IProductRepository, 
  IMarketRepository 
} from '../../core/interfaces/repositories';

// 类型定义
interface UseServicesReturn {
  // 应用服务
  marketService: MarketService;
  
  // 仓储服务
  playerRepository: IPlayerRepository;
  productRepository: IProductRepository;
  marketRepository: IMarketRepository;
  
  // 基础设施服务
  eventEmitter: any;
  logger: any;
  
  // 工具方法
  resolve: <T>(serviceName: string) => T;
}

/**
 * 统一服务访问 Composable
 * 通过依赖注入容器提供所有注册服务的访问
 */
export function useServices(): UseServicesReturn {
  // 通过依赖注入获取服务容器
  const container = inject<DIContainer>('diContainer');
  if (!container) {
    throw new Error('DI容器未正确配置。请确保在应用根部提供了diContainer。');
  }

  // 解析常用服务
  const marketService = container.resolve<MarketService>('marketService');
  const playerRepository = container.resolve<IPlayerRepository>('playerRepository');
  const productRepository = container.resolve<IProductRepository>('productRepository');
  const marketRepository = container.resolve<IMarketRepository>('marketRepository');
  const eventEmitter = container.resolve('eventEmitter');
  const logger = container.resolve('logger');

  /**
   * 通用服务解析方法
   * @param serviceName 服务名称
   * @returns 解析的服务实例
   */
  const resolve = <T>(serviceName: string): T => {
    try {
      return container.resolve<T>(serviceName);
    } catch (error) {
      throw new Error(`无法解析服务 "${serviceName}": ${error.message}`);
    }
  };

  return {
    // 应用服务
    marketService,
    
    // 仓储服务
    playerRepository,
    productRepository,
    marketRepository,
    
    // 基础设施服务
    eventEmitter,
    logger,
    
    // 工具方法
    resolve
  };
}

/**
 * 服务类型检查辅助函数
 */
export function isServiceAvailable(container: DIContainer, serviceName: string): boolean {
  try {
    container.resolve(serviceName);
    return true;
  } catch {
    return false;
  }
}

/**
 * 批量检查服务可用性
 */
export function checkServicesAvailability(
  container: DIContainer, 
  serviceNames: string[]
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  
  serviceNames.forEach(serviceName => {
    result[serviceName] = isServiceAvailable(container, serviceName);
  });
  
  return result;
}