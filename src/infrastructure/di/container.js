/**
 * 依赖注入容器
 * 管理服务实例和依赖关系
 */
import storageService from '../persistence/storageService';
import playerRepository from '../persistence/playerRepository';
import productRepository from '../persistence/productRepository';
import marketRepository from '../persistence/marketRepository';
import eventEmitter from '../events/eventEmitter';
import { MarketService } from '../../application/services/marketService';

/**
 * 简易依赖注入容器
 */
class DIContainer {
  /**
   * 构造函数
   */
  constructor() {
    this._services = new Map();
  }
  
  /**
   * 注册服务实例
   * @param {string} name 服务名称
   * @param {any} instance 服务实例
   * @returns {DIContainer} 容器实例
   */
  register(name, instance) {
    this._services.set(name, instance);
    return this;
  }
  
  /**
   * 注册服务工厂
   * @param {string} name 服务名称
   * @param {Function} factory 工厂函数
   * @returns {DIContainer} 容器实例
   */
  registerFactory(name, factory) {
    this._services.set(name, { factory });
    return this;
  }
  
  /**
   * 解析服务
   * @param {string} name 服务名称
   * @returns {any} 服务实例
   */
  resolve(name) {
    const service = this._services.get(name);
    
    if (!service) {
      throw new Error(`Service ${name} not registered`);
    }
    
    if (service.factory) {
      return service.factory(this);
    }
    
    return service;
  }
  
  /**
   * 检查服务是否已注册
   * @param {string} name 服务名称
   * @returns {boolean} 是否已注册
   */
  has(name) {
    return this._services.has(name);
  }
  
  /**
   * 移除服务
   * @param {string} name 服务名称
   * @returns {boolean} 操作是否成功
   */
  remove(name) {
    return this._services.delete(name);
  }
  
  /**
   * 清除所有服务
   */
  clear() {
    this._services.clear();
  }
}

/**
 * 创建并配置容器
 * @returns {DIContainer} 配置好的容器实例
 */
export function createContainer() {
  const container = new DIContainer();
  
  // 基础设施服务
  container.register('eventEmitter', eventEmitter);
  container.register('storageService', storageService);
  
  // 仓储
  container.register('playerRepository', playerRepository);
  container.register('productRepository', productRepository);
  container.register('marketRepository', marketRepository);
  
  // 应用服务
  container.registerFactory('marketService', (c) => 
    new MarketService(
      c.resolve('playerRepository'),
      c.resolve('productRepository'),
      c.resolve('marketRepository'),
      c.resolve('eventEmitter')
    )
  );
  
  return container;
}

// 创建容器单例
const container = createContainer();

export default container; 