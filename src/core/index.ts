/**
 * 核心领域层索引文件 - TypeScript版本
 * 导出所有核心领域模型和服务
 */

// ==================== 领域模型导出 ====================
// 导出所有核心领域模型（已全部TypeScript化）
export * from './models/player';
export * from './models/product';
export * from './models/location';
export * from './models/house';
export * from './models/event';

// 从模型入口文件重新导出
export * from './models';

// ==================== 核心服务导出 ====================
// 导出核心业务服务（已全部TypeScript化）
export * from './services/gameLoopService';
export * from './services/priceSystem';
export * from './services/eventSystem';
export * from './services/gameConfigService';

// 从服务入口文件重新导出
export * from './services';

// ==================== 接口导出 ====================
export * from './interfaces';
