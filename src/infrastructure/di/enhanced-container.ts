/**
 * 增强版依赖注入容器 - TypeScript版本
 * 提供更强大的依赖注入能力，包括生命周期管理和自动依赖解析
 */

// ==================== 类型定义 ====================

/**
 * 服务生命周期类型
 */
export type ServiceLifetime = 'singleton' | 'transient';

/**
 * 服务工厂函数类型
 */
export type ServiceFactory<T = any> = (container: EnhancedDIContainer, ...deps: any[]) => T | Promise<T>;

/**
 * 服务实现类型
 */
export type ServiceImplementation<T = any> = T | ServiceFactory<T>;

/**
 * 构造函数类型
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * 带依赖注入信息的构造函数
 */
export interface InjectableConstructor<T = any> extends Constructor<T> {
  inject?: string[];
}

// ==================== 服务描述符类 ====================

/**
 * 服务描述符
 * 用于描述服务的配置和生命周期
 */
export class ServiceDescriptor<T = any> {
  public name: string;
  public implementation: ServiceImplementation<T>;
  public lifetime: ServiceLifetime;
  public dependencies: string[];
  public instance: T | null;

  /**
   * 构造函数
   * @param name 服务名称
   * @param implementation 服务实现或工厂函数
   * @param lifetime 服务生命周期
   */
  constructor(name: string, implementation: ServiceImplementation<T>, lifetime: ServiceLifetime = 'transient') {
    this.name = name;
    this.implementation = implementation;
    this.lifetime = lifetime;
    this.dependencies = [];
    this.instance = null;
  }

  /**
   * 设置为单例模式
   * @returns 当前描述符
   */
  asSingleton(): ServiceDescriptor<T> {
    this.lifetime = 'singleton';
    return this;
  }

  /**
   * 设置为瞬态模式
   * @returns 当前描述符
   */
  asTransient(): ServiceDescriptor<T> {
    this.lifetime = 'transient';
    return this;
  }

  /**
   * 设置依赖
   * @param dependencies 依赖服务名称数组
   * @returns 当前描述符
   */
  withDependencies(dependencies: string[]): ServiceDescriptor<T> {
    this.dependencies = dependencies;
    return this;
  }

  /**
   * 检查是否为工厂函数
   * @returns 是否为工厂函数
   */
  isFactory(): boolean {
    return typeof this.implementation === 'function';
  }
}

// ==================== 增强版依赖注入容器 ====================

/**
 * 增强版依赖注入容器
 */
export class EnhancedDIContainer {
  private _services: Map<string, ServiceDescriptor> = new Map();
  private _resolving: Set<string> = new Set();

  /**
   * 注册服务
   * @param name 服务名称
   * @param implementation 服务实现
   * @returns 服务描述符
   */
  register<T>(name: string, implementation: ServiceImplementation<T>): ServiceDescriptor<T> {
    const descriptor = new ServiceDescriptor(name, implementation);
    this._services.set(name, descriptor);
    return descriptor;
  }

  /**
   * 注册工厂函数
   * @param name 服务名称
   * @param factory 工厂函数
   * @returns 服务描述符
   */
  registerFactory<T>(name: string, factory: ServiceFactory<T>): ServiceDescriptor<T> {
    const descriptor = new ServiceDescriptor(name, factory);
    this._services.set(name, descriptor);
    return descriptor;
  }

  /**
   * 注册构造函数
   * @param name 服务名称
   * @param constructor 构造函数
   * @returns 服务描述符
   */
  registerConstructor<T>(name: string, constructor: Constructor<T>): ServiceDescriptor<T> {
    const factory: ServiceFactory<T> = (container) => {
      const paramTypes = this._getConstructorParamTypes(constructor as InjectableConstructor<T>);
      const deps = paramTypes.map(dep => container.resolve(dep));
      return new constructor(...deps);
    };

    const descriptor = new ServiceDescriptor(name, factory);
    this._services.set(name, descriptor);
    return descriptor;
  }

  /**
   * 解析服务
   * @param name 服务名称
   * @returns 服务实例
   */
  async resolve<T = any>(name: string): Promise<T> {
    const descriptor = this._services.get(name);

    if (!descriptor) {
      throw new Error(`Service '${name}' not registered`);
    }

    // 检查循环依赖
    if (this._resolving.has(name)) {
      throw new Error(`Circular dependency detected for service '${name}'`);
    }

    // 如果是单例模式且已有实例，直接返回
    if (descriptor.lifetime === 'singleton' && descriptor.instance) {
      return descriptor.instance as T;
    }

    // 标记正在解析
    this._resolving.add(name);

    try {
      let instance: T;

      if (descriptor.isFactory()) {
        // 解析依赖
        const deps = await Promise.all(
          descriptor.dependencies.map(dep => this.resolve(dep))
        );

        // 调用工厂函数
        instance = await Promise.resolve((descriptor.implementation as ServiceFactory<T>)(this, ...deps));
      } else {
        // 直接使用实现
        instance = descriptor.implementation as T;
      }

      // 如果是单例模式，保存实例
      if (descriptor.lifetime === 'singleton') {
        descriptor.instance = instance;
      }

      return instance;
    } finally {
      // 无论成功失败，都移除正在解析标记
      this._resolving.delete(name);
    }
  }

  /**
   * 同步解析服务（仅适用于非异步工厂）
   * @param name 服务名称
   * @returns 服务实例
   */
  resolveSync<T = any>(name: string): T {
    const descriptor = this._services.get(name);

    if (!descriptor) {
      throw new Error(`Service '${name}' not registered`);
    }

    // 检查循环依赖
    if (this._resolving.has(name)) {
      throw new Error(`Circular dependency detected for service '${name}'`);
    }

    // 如果是单例模式且已有实例，直接返回
    if (descriptor.lifetime === 'singleton' && descriptor.instance) {
      return descriptor.instance as T;
    }

    // 标记正在解析
    this._resolving.add(name);

    try {
      let instance: T;

      if (descriptor.isFactory()) {
        // 解析依赖（同步）
        const deps = descriptor.dependencies.map(dep => this.resolveSync(dep));

        // 调用工厂函数（假设是同步的）
        const result = (descriptor.implementation as ServiceFactory<T>)(this, ...deps);
        
        if (result instanceof Promise) {
          throw new Error(`Cannot synchronously resolve async factory for service '${name}'`);
        }
        
        instance = result;
      } else {
        // 直接使用实现
        instance = descriptor.implementation as T;
      }

      // 如果是单例模式，保存实例
      if (descriptor.lifetime === 'singleton') {
        descriptor.instance = instance;
      }

      return instance;
    } finally {
      // 无论成功失败，都移除正在解析标记
      this._resolving.delete(name);
    }
  }

  /**
   * 获取构造函数参数类型
   * @param ctor 构造函数
   * @returns 参数类型名称数组
   * @private
   */
  private _getConstructorParamTypes(ctor: InjectableConstructor): string[] {
    // 注意：这只是一个示例，实际上需要通过反射或其他方式获取
    // JavaScript没有内置类型反射，可能需要通过装饰器或者显式指定
    return ctor.inject || [];
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

  /**
   * 获取服务描述符
   * @param name 服务名称
   * @returns 服务描述符或undefined
   */
  getDescriptor<T = any>(name: string): ServiceDescriptor<T> | undefined {
    return this._services.get(name) as ServiceDescriptor<T> | undefined;
  }
}

// ==================== 工厂函数和装饰器 ====================

/**
 * 创建并配置容器
 * @returns 配置好的容器实例
 */
export function createContainer(): EnhancedDIContainer {
  return new EnhancedDIContainer();
}

/**
 * 依赖项装饰器
 * 用于标记类的依赖项
 * @param dependencies 依赖项名称数组
 * @returns 装饰器函数
 */
export function Inject(dependencies: string[]) {
  return function<T extends Constructor>(target: T): T {
    (target as any).inject = dependencies;
    return target;
  };
}

/**
 * 自动解析装饰器
 * 用于自动从容器解析依赖
 * @param container 容器实例
 * @returns 装饰器函数
 */
export function AutoResolve(container: EnhancedDIContainer) {
  return function<T extends Constructor>(target: T): T {
    return class extends target {
      constructor(...args: any[]) {
        const paramTypes = (target as any).inject || [];
        const resolvedDeps = paramTypes.map((dep: string) => container.resolveSync(dep));
        super(...resolvedDeps, ...args);
      }
    } as T;
  };
}

// ==================== 默认导出 ====================

/**
 * 默认容器实例
 */
const defaultContainer = createContainer();

export default defaultContainer;