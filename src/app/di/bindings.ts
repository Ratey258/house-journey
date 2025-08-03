/**
 * 依赖注入绑定配置
 * 配置所有服务的依赖关系
 */

import { container } from './container';
import { TradingApplicationService } from '../../features/market-trading/application/services/TradingApplicationService';

/**
 * 服务标识符常量
 */
export const SERVICE_IDENTIFIERS = {
  // 应用服务
  TRADING_APPLICATION_SERVICE: 'TradingApplicationService',
  
  // 领域服务
  EXECUTE_TRADE_USE_CASE: 'ExecuteTradeUseCase',
  CALCULATE_PRICE_USE_CASE: 'CalculatePriceUseCase',
  
  // 基础设施服务
  TRADING_REPOSITORY: 'TradingRepository',
  PLAYER_REPOSITORY: 'PlayerRepository',
  PRODUCT_REPOSITORY: 'ProductRepository',
  
  // 工具服务
  EVENT_EMITTER: 'EventEmitter',
  LOGGER: 'Logger',
  STORAGE_SERVICE: 'StorageService'
} as const;

/**
 * 配置所有服务绑定
 */
export function configureContainer(): void {
  // === 应用服务绑定 ===
  container.bind<TradingApplicationService>(SERVICE_IDENTIFIERS.TRADING_APPLICATION_SERVICE)
    .to(TradingApplicationService)
    .asSingleton();

  // TODO: 添加其他服务绑定
  // container.bind<ExecuteTradeUseCase>(SERVICE_IDENTIFIERS.EXECUTE_TRADE_USE_CASE)
  //   .to(ExecuteTradeUseCase)
  //   .asSingleton();

  // container.bind<CalculatePriceUseCase>(SERVICE_IDENTIFIERS.CALCULATE_PRICE_USE_CASE)
  //   .to(CalculatePriceUseCase)
  //   .asSingleton();

  // === 工具服务绑定 ===
  
  // 事件发射器
  container.bind<EventTarget>(SERVICE_IDENTIFIERS.EVENT_EMITTER)
    .toFactory(() => new EventTarget())
    .asSingleton();

  // 简单日志服务
  container.bind<Console>(SERVICE_IDENTIFIERS.LOGGER)
    .toInstance(console);

  // 存储服务
  container.bind<Storage>(SERVICE_IDENTIFIERS.STORAGE_SERVICE)
    .toInstance(localStorage);

  console.log('✅ 依赖注入容器配置完成');
  console.log('📋 已注册服务:', container.getRegisteredServices());
}

/**
 * 清理容器配置
 */
export function cleanupContainer(): void {
  container.clear();
  console.log('🧹 依赖注入容器已清理');
}