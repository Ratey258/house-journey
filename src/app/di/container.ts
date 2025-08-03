/**
 * 依赖注入容器实现
 * 基于简单的服务定位器模式
 */

export interface ServiceConstructor<T = any> {
  new (...args: any[]): T;
}

export interface ServiceFactory<T = any> {
  (): T;
}

export interface ServiceBinding<T = any> {
  type: 'constructor' | 'factory' | 'instance';
  target: ServiceConstructor<T> | ServiceFactory<T> | T;
  singleton: boolean;
  dependencies?: string[];
}

export class DIContainer {
  private services = new Map<string, ServiceBinding>();
  private instances = new Map<string, any>();

  /**
   * 绑定构造函数
   */
  bind<T>(identifier: string): {
    to: (constructor: ServiceConstructor<T>) => {
      asSingleton: () => void;
      asTransient: () => void;
    };
    toFactory: (factory: ServiceFactory<T>) => {
      asSingleton: () => void;
      asTransient: () => void;
    };
    toInstance: (instance: T) => void;
  } {
    return {
      to: (constructor: ServiceConstructor<T>) => ({
        asSingleton: () => {
          this.services.set(identifier, {
            type: 'constructor',
            target: constructor,
            singleton: true
          });
        },
        asTransient: () => {
          this.services.set(identifier, {
            type: 'constructor',
            target: constructor,
            singleton: false
          });
        }
      }),
      toFactory: (factory: ServiceFactory<T>) => ({
        asSingleton: () => {
          this.services.set(identifier, {
            type: 'factory',
            target: factory,
            singleton: true
          });
        },
        asTransient: () => {
          this.services.set(identifier, {
            type: 'factory',
            target: factory,
            singleton: false
          });
        }
      }),
      toInstance: (instance: T) => {
        this.services.set(identifier, {
          type: 'instance',
          target: instance,
          singleton: true
        });
        this.instances.set(identifier, instance);
      }
    };
  }

  /**
   * 解析服务
   */
  resolve<T>(identifier: string): T {
    const binding = this.services.get(identifier);
    if (!binding) {
      throw new Error(`Service "${identifier}" not found in container`);
    }

    // 单例模式检查缓存
    if (binding.singleton && this.instances.has(identifier)) {
      return this.instances.get(identifier);
    }

    let instance: T;

    switch (binding.type) {
      case 'instance':
        instance = binding.target as T;
        break;
      
      case 'factory':
        instance = (binding.target as ServiceFactory<T>)();
        break;
      
      case 'constructor':
        const Constructor = binding.target as ServiceConstructor<T>;
        instance = new Constructor();
        break;
      
      default:
        throw new Error(`Unknown binding type for "${identifier}"`);
    }

    // 单例模式缓存实例
    if (binding.singleton) {
      this.instances.set(identifier, instance);
    }

    return instance;
  }

  /**
   * 检查服务是否已绑定
   */
  has(identifier: string): boolean {
    return this.services.has(identifier);
  }

  /**
   * 移除服务绑定
   */
  unbind(identifier: string): void {
    this.services.delete(identifier);
    this.instances.delete(identifier);
  }

  /**
   * 清空容器
   */
  clear(): void {
    this.services.clear();
    this.instances.clear();
  }

  /**
   * 获取所有已注册的服务标识符
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}

// 全局容器实例
export const container = new DIContainer();