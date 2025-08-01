/**
 * 依赖注入容器配置 - TypeScript版本
 * 此文件负责创建和配置依赖注入容器
 */

import { EnhancedDIContainer, Inject } from './enhanced-container';
import { IMarketService } from '@/application/interfaces/services';
import { IPlayerRepository, IProductRepository, IMarketRepository } from '@/core/interfaces/repositories';

// 导入实现类
import { MarketService } from '@/application/services/marketService';
import playerRepository from '../persistence/playerRepository';
import productRepository from '../persistence/productRepository';
import marketRepository from '../persistence/marketRepository';
import storageService from '../persistence/storageService';
import eventEmitter from '../eventEmitter';

// ==================== 类型定义 ====================

/**
 * 服务接口映射
 */
export interface ServiceMap {
  IEventEmitter: typeof eventEmitter;
  IStorageService: typeof storageService;
  IPlayerRepository: typeof playerRepository;
  IProductRepository: typeof productRepository;
  IMarketRepository: typeof marketRepository;
  IMarketService: MarketService;
}

/**
 * 服务名称类型
 */
export type ServiceName = keyof ServiceMap;

// ==================== 容器配置函数 ====================

/**
 * 创建并配置增强版容器
 * @returns 配置好的容器实例
 */
export function createEnhancedContainer(): EnhancedDIContainer {
  const container = new EnhancedDIContainer();

  // 注册基础设施服务
  container.register<ServiceMap['IEventEmitter']>('IEventEmitter', eventEmitter).asSingleton();
  container.register<ServiceMap['IStorageService']>('IStorageService', storageService).asSingleton();

  // 注册仓储
  container.register<ServiceMap['IPlayerRepository']>('IPlayerRepository', playerRepository).asSingleton();
  container.register<ServiceMap['IProductRepository']>('IProductRepository', productRepository).asSingleton();
  container.register<ServiceMap['IMarketRepository']>('IMarketRepository', marketRepository).asSingleton();

  // 注册应用服务
  container.registerFactory<ServiceMap['IMarketService']>('IMarketService', (container) => {
    return new MarketService(
      container.resolveSync('IPlayerRepository'),
      container.resolveSync('IProductRepository'),
      container.resolveSync('IMarketRepository'),
      container.resolveSync('IEventEmitter')
    );
  }).asSingleton();

  return container;
}

// ==================== 增强服务类示例 ====================

/**
 * 使用依赖装饰器的示例
 * 这演示了如何使用新的依赖注入系统
 */
@Inject(['IPlayerRepository', 'IProductRepository', 'IMarketRepository', 'IEventEmitter'])
export class EnhancedMarketService implements IMarketService {
  private playerRepository: IPlayerRepository;
  private productRepository: IProductRepository;
  private marketRepository: IMarketRepository;
  private eventEmitter: typeof eventEmitter;

  /**
   * 构造函数
   * 依赖将自动注入
   */
  constructor(
    playerRepository: IPlayerRepository,
    productRepository: IProductRepository,
    marketRepository: IMarketRepository,
    eventEmitter: typeof eventEmitter
  ) {
    this.playerRepository = playerRepository;
    this.productRepository = productRepository;
    this.marketRepository = marketRepository;
    this.eventEmitter = eventEmitter;
  }

  // 实现应用服务接口方法
  // TODO: 实现具体的业务逻辑方法
  
  /**
   * 获取市场数据
   */
  getMarketData(): Promise<any> {
    // 实现具体逻辑
    throw new Error('Method not implemented.');
  }

  /**
   * 更新市场价格
   */
  updateMarketPrices(): Promise<void> {
    // 实现具体逻辑
    throw new Error('Method not implemented.');
  }
}

// ==================== 工具函数 ====================

/**
 * 类型安全的服务解析函数
 * @param container 容器实例
 * @param serviceName 服务名称
 * @returns 服务实例
 */
export function resolveService<T extends ServiceName>(
  container: EnhancedDIContainer,
  serviceName: T
): Promise<ServiceMap[T]> {
  return container.resolve<ServiceMap[T]>(serviceName);
}

/**
 * 同步服务解析函数
 * @param container 容器实例
 * @param serviceName 服务名称
 * @returns 服务实例
 */
export function resolveServiceSync<T extends ServiceName>(
  container: EnhancedDIContainer,
  serviceName: T
): ServiceMap[T] {
  return container.resolveSync<ServiceMap[T]>(serviceName);
}

// ==================== 默认容器实例 ====================

/**
 * 创建单例容器
 */
const enhancedContainer = createEnhancedContainer();

export default enhancedContainer;