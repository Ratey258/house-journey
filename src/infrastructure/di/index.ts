/**
 * di 模块索引文件 - TypeScript版本
 * 
 * 该文件导出 infrastructure/di 目录下的所有模块
 */

// ==================== 基础容器 ====================
export { DIContainer, createContainer as createBasicContainer } from './container';
export type { ServiceFactory, ServiceEntry } from './container';

// ==================== 增强容器 ====================
export {
  EnhancedDIContainer,
  ServiceDescriptor,
  createContainer,
  Inject,
  AutoResolve
} from './enhanced-container';

export type {
  ServiceLifetime,
  ServiceFactory as EnhancedServiceFactory,
  ServiceImplementation,
  Constructor,
  InjectableConstructor
} from './enhanced-container';

// ==================== 容器配置 ====================
export {
  createEnhancedContainer,
  EnhancedMarketService,
  resolveService,
  resolveServiceSync
} from './container-setup';

export type {
  ServiceMap,
  ServiceName
} from './container-setup';

// ==================== 默认导出 ====================

// 导出默认的基础容器
export { default as container } from './container';

// 导出默认的增强容器
export { default as enhancedContainer } from './container-setup';

// 导出默认的增强容器实例
export { default } from './enhanced-container';

// ==================== 便捷导出 ====================

/**
 * 重新导出常用类型和函数
 */
export type DIContainerType = DIContainer;
export type EnhancedDIContainerType = EnhancedDIContainer;