/**
 * 依赖注入容器 - TypeScript版本
 * 管理服务实例和依赖关系
 */

import storageService from '../persistence/storageService';
import playerRepository from '../persistence/playerRepository';
import productRepository from '../persistence/productRepository';
import marketRepository from '../persistence/marketRepository';
import eventEmitter from '../eventEmitter';
import { MarketService } from '@/application/services/marketService';

// ==================== 类型定义 ====================

/**
 * 服务工厂函数类型
 */
export type ServiceFactory<T = any> = (container: DIContainer) => T;

/**
 * 服务实例或工厂
 */
export type ServiceEntry<T = any> = T | { factory: ServiceFactory<T> };

// ==================== 简易依赖注入容器 ====================

/**
 * 简易依赖注入容器
 */
export class DIContainer {
  private _services: Map<string, ServiceEntry> = new Map();

  /**
   * 注册服务实例
   * @param name 服务名称
   * @param instance 服务实例
   * @returns 容器实例
   */
  register<T>(name: string, instance: T): DIContainer {
    this._services.set(name, instance);
    return this;
  }

  /**
   * 注册服务工厂
   * @param name 服务名称
   * @param factory 工厂函数
   * @returns 容器实例
   */
  registerFactory<T>(name: string, factory: ServiceFactory<T>): DIContainer {
    this._services.set(name, { factory });
    return this;
  }

  /**
   * 解析服务
   * @param name 服务名称
   * @returns 服务实例
   */
  resolve<T = any>(name: string): T {
    const service = this._services.get(name);

    if (!service) {
      throw new Error(`Service ${name} not registered`);
    }

    if (typeof service === 'object' && service !== null && 'factory' in service) {
      return service.factory(this);
    }

    return service as T;
  }

  /**
   * 检查服务是否已注册
   * @param name 服务名称
   * @returns 是否已注册
   */
  has(name: string): boolean {
    return this._services.has(name);
  }

  /**
   * 移除服务
   * @param name 服务名称
   * @returns 操作是否成功
   */
  remove(name: string): boolean {
    return this._services.delete(name);
  }

  /**
   * 清除所有服务
   */
  clear(): void {
    this._services.clear();
  }

  /**
   * 获取所有已注册的服务名称
   * @returns 服务名称数组
   */
  getRegisteredServices(): string[] {
    return Array.from(this._services.keys());
  }
}

// ==================== 容器工厂函数 ====================

/**
 * 创建并配置容器
 * @returns 配置好的容器实例
 */
export function createContainer(): DIContainer {
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

// ==================== 默认容器实例 ====================

/**
 * 创建容器单例
 */
const container = createContainer();

export default container;