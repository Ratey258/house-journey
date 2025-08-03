/**
 * 依赖注入模块导出
 */

export { DIContainer, container } from './container';
export { configureContainer, cleanupContainer, SERVICE_IDENTIFIERS } from './bindings';
export type { ServiceConstructor, ServiceFactory, ServiceBinding } from './container';