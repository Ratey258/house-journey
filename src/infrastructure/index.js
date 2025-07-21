/**
 * 基础设施层索引文件
 * 导出所有基础设施服务和工具
 */

// 导出存储服务
export * from './persistence/storageService';

// 导出事件发射器
export { default as eventEmitter } from './eventEmitter';

// 导出工具函数
export * from '@/infrastructure/utils/errorHandler';

// 导出依赖注入容器
export { default as container } from './di/container';
