/**
 * 应用配置文件入口
 * 统一导出所有配置模块
 */

export { gameConfig } from './game.config';
export { appConfig } from './app.config';
export { performanceConfig } from './performance.config';
export { uiConfig } from './ui.config';

// 重新导出配置类型
export type {
  GameConfig,
  PlayerConfig,
  MarketConfig,
  EventConfig
} from './game.config';

export type {
  AppConfig,
  ErrorHandlingConfig,
  LoggingConfig
} from './app.config';

export type {
  PerformanceConfig,
  CacheConfig,
  MonitoringConfig
} from './performance.config';

export type {
  UIConfig,
  ToastConfig,
  AnimationConfig
} from './ui.config';