/**
 * Application Services 模块索引文件
 * 
 * 该文件导出 application/services 目录下的所有服务模块
 * 提供统一的服务访问入口
 */

// 导出市场服务
export { MarketService } from './marketService';
export { default as MarketServiceDefault } from './marketService';

// 类型导出
export type { 
  TradeResult, 
  MarketUpdateResult, 
  LocationProducts,
  MarketState,
  IMarketService,
  IGameService,
  IEventService
} from '../interfaces/services';