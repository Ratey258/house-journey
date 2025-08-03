/**
 * 应用层索引文件
 * 导出所有应用服务和接口
 */

// 导出服务实现
export * from './services';

// 导出接口定义
export * from './interfaces/services';

// 重新导出主要服务类
export { MarketService } from './services/marketService';