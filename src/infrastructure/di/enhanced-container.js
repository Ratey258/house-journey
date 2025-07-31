/**
 * 增强版依赖注入容器
 * 提供更强大的依赖注入能力，包括生命周期管理和自动依赖解析
 */

/**
 * 服务描述符
 * 用于描述服务的配置和生命周期
 */
class ServiceDescriptor {
  /**
   * 构造函数
   * @param {string} name 服务名称
   * @param {Object} implementation 服务实现或工厂函数
   * @param {string} lifetime 服务生命周期
   */
  constructor(name, implementation, lifetime = 'transient') {
    this.name = name;
    this.implementation = implementation;
    this.lifetime = lifetime;
    this.dependencies = [];
    this.instance = null;
  }

  /**
   * 设置为单例模式
   * @returns {ServiceDescriptor} 当前描述符
   */
  asSingleton() {
    this.lifetime = 'singleton';
    return this;
  }

  /**
   * 设置为瞬态模式
   * @returns {ServiceDescriptor} 当前描述符
   */
  asTransient() {
    this.lifetime = 'transient';
    return this;
  }

  /**
   * 设置依赖
   * @param {string[]} dependencies 依赖服务名称数组
   * @returns {ServiceDescriptor} 当前描述符
   */
  withDependencies(dependencies) {
    this.dependencies = dependencies;
    return this;
  }

  /**
   * 检查是否为工厂函数
   * @returns {boolean} 是否为工厂函数
   */
  isFactory() {
    return typeof this.implementation === 'function';
  }
}

/**
 * 增强版依赖注入容器
 */
export class EnhancedDIContainer {
  /**
   * 构造函数
   */
  constructor() {
    this._services = new Map();
    this._resolving = new Set();
  }

  /**
   * 注册服务
   * @param {string} name 服务名称
   * @param {any} implementation 服务实现
   * @returns {ServiceDescriptor} 服务描述符
   */
  register(name, implementation) {
    const descriptor = new ServiceDescriptor(name, implementation);
    this._services.set(name, descriptor);
    return descriptor;
  }

  /**
   * 注册服务工厂
   * @param {string} name 服务名称
   * @param {Function} factory 工厂函数
   * @returns {ServiceDescriptor} 服务描述符
   */
  registerFactory(name, factory) {
    const descriptor = new ServiceDescriptor(name, factory);
    this._services.set(name, descriptor);
    return descriptor;
  }

  /**
   * 注册接口实现
   * @param {string} interfaceName 接口名称
   * @param {Function} implementationClass 实现类
   * @returns {ServiceDescriptor} 服务描述符
   */
  registerType(interfaceName, implementationClass) {
    const descriptor = new ServiceDescriptor(
      interfaceName,
      (container) => {
        // 自动解析构造函数依赖
        const paramTypes = this._getConstructorParamTypes(implementationClass);
        const resolvedDeps = paramTypes.map(type => container.resolve(type));
        return new implementationClass(...resolvedDeps);
      }
    );
    this._services.set(interfaceName, descriptor);
    return descriptor;
  }

  /**
   * 解析服务
   * @param {string} name 服务名称
   * @returns {any} 解析的服务实例
   */
  resolve(name) {
    const descriptor = this._services.get(name);

    if (!descriptor) {
      throw new Error(`Service '${name}' not registered`);
    }

    // 检测循环依赖
    if (this._resolving.has(name)) {
      throw new Error(`Circular dependency detected while resolving '${name}'`);
    }

    // 单例模式下，如果已有实例则直接返回
    if (descriptor.lifetime === 'singleton' && descriptor.instance) {
      return descriptor.instance;
    }

    // 标记为正在解析
    this._resolving.add(name);

    try {
      let instance;

      if (descriptor.isFactory()) {
        // 解析依赖
        const deps = descriptor.dependencies.map(dep => this.resolve(dep));
        // 调用工厂函数
        instance = descriptor.implementation(this, ...deps);
      } else {
        // 直接使用实现
        instance = descriptor.implementation;
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
   * 异步解析服务
   * @param {string} name 服务名称
   * @returns {Promise<any>} 解析的服务实例
   */
  async resolveAsync(name) {
    const descriptor = this._services.get(name);

    if (!descriptor) {
      throw new Error(`Service '${name}' not registered`);
    }

    // 检测循环依赖
    if (this._resolving.has(name)) {
      throw new Error(`Circular dependency detected while resolving '${name}'`);
    }

    // 单例模式下，如果已有实例则直接返回
    if (descriptor.lifetime === 'singleton' && descriptor.instance) {
      return descriptor.instance;
    }

    // 标记为正在解析
    this._resolving.add(name);

    try {
      let instance;

      if (descriptor.isFactory()) {
        // 解析依赖
        const deps = await Promise.all(descriptor.dependencies.map(dep => this.resolveAsync(dep)));
        // 调用工厂函数
        instance = await Promise.resolve(descriptor.implementation(this, ...deps));
      } else {
        // 直接使用实现
        instance = descriptor.implementation;
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
   * @param {Function} ctor 构造函数
   * @returns {string[]} 参数类型名称数组
   * @private
   */
  _getConstructorParamTypes(ctor) {
    // 注意：这只是一个示例，实际上需要通过反射或其他方式获取
    // JavaScript没有内置类型反射，可能需要通过装饰器或者显式指定
    return ctor.inject || [];
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
 * @returns {EnhancedDIContainer} 配置好的容器实例
 */
export function createContainer() {
  return new EnhancedDIContainer();
}

/**
 * 依赖项装饰器
 * 用于标记类的依赖项
 * @param {string[]} dependencies 依赖项名称数组
 * @returns {Function} 装饰器函数
 */
export function Inject(dependencies) {
  return function(target) {
    target.inject = dependencies;
    return target;
  };
}
