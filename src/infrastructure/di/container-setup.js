/**
 * 依赖注入容器配置
 * 此文件负责创建和配置依赖注入容器
 */
import { EnhancedDIContainer, Inject } from './enhanced-container';
import { IMarketService } from '../../application/interfaces/services';
import { IPlayerRepository, IProductRepository, IMarketRepository } from '../../core/interfaces/repositories';

// 导入实现类
import { MarketService } from '../../application/services/marketService';
import playerRepository from '../persistence/playerRepository';
import productRepository from '../persistence/productRepository';
import marketRepository from '../persistence/marketRepository';
import storageService from '../persistence/storageService';
import eventEmitter from '../eventEmitter';

/**
 * 创建并配置增强版容器
 * @returns {EnhancedDIContainer} 配置好的容器实例
 */
export function createEnhancedContainer() {
  const container = new EnhancedDIContainer();

  // 注册基础设施服务
  container.register('IEventEmitter', eventEmitter).asSingleton();
  container.register('IStorageService', storageService).asSingleton();

  // 注册仓储
  container.register('IPlayerRepository', playerRepository).asSingleton();
  container.register('IProductRepository', productRepository).asSingleton();
  container.register('IMarketRepository', marketRepository).asSingleton();

  // 注册应用服务
  container.registerFactory('IMarketService', (container) => {
    return new MarketService(
      container.resolve('IPlayerRepository'),
      container.resolve('IProductRepository'),
      container.resolve('IMarketRepository'),
      container.resolve('IEventEmitter')
    );
  }).asSingleton();

  return container;
}

/**
 * 使用依赖装饰器的示例
 * 这演示了如何使用新的依赖注入系统
 */
@Inject(['IPlayerRepository', 'IProductRepository', 'IMarketRepository', 'IEventEmitter'])
class EnhancedMarketService extends IMarketService {
  /**
   * 构造函数
   * 依赖将自动注入
   */
  constructor(playerRepository, productRepository, marketRepository, eventEmitter) {
    super();
    this.playerRepository = playerRepository;
    this.productRepository = productRepository;
    this.marketRepository = marketRepository;
    this.eventEmitter = eventEmitter;
  }

  // 实现应用服务接口方法
  // ...
}

// 创建单例容器
const enhancedContainer = createEnhancedContainer();

export default enhancedContainer;
