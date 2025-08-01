/**
 * persistence 模块索引文件 - TypeScript版本
 * 
 * 该文件导出 infrastructure/persistence 目录下的所有模块
 */

// ==================== 存储服务 ====================
export * from './storageService';

// ==================== 基础仓储 ====================
export * from './base-repository';

// ==================== 具体仓储实现 ====================
export * from './playerRepository';
export * from './productRepository';

// 导出默认仓储实例
export { default as playerRepository } from './playerRepository';
export { default as productRepository } from './productRepository';

// ==================== 临时导出说明 ====================
// 注意：由于持久化层模块正在逐步现代化中，
// 某些模块可能暂时不可用。请检查具体文件的TypeScript版本是否已完成。