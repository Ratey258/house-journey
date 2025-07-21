/**
 * 核心领域层索引文件
 * 导出所有核心领域模型和服务
 */

// 导出模型
export * from './models/player';
export * from './models/product';
export * from './models/location';
export * from './models/house';
export * from './models/event';

// 导出服务
export * from './services/gameLoopService';
export * from './services/priceSystem';

// 导出事件系统
export * from './services/eventSystem';
