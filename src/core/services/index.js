/**
 * services 模块索引文件
 * 
 * 该文件导出 core/services 目录下的所有模块
 */

// 在此处导出模块
// 例如: export { default as SomeModule } from './someModule';

// 导出价格系统
export * from './priceSystem';

// 导出其他服务
export * from './eventSystem';
export * from './gameLoopService';
export * from './gameConfigService';

/**
 * @deprecated 兼容层已被移除，请直接使用 priceSystem。
 * 如果您看到此错误，说明您的代码仍在使用已废弃的 priceService。
 * 请将所有导入从 'priceService' 更改为 'priceSystem'，并使用函数式API。
 */
export default function deprecatedPriceService() {
  throw new Error('priceService已废弃，请使用priceSystem替代。');
}

