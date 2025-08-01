/**
 * 持久化模块导出文件 - TypeScript版本
 * 统一导出存储相关模块
 */

export { useSaveStore } from './saveSystem';
export { useAutoSave } from './autoSave';

// 导出类型定义
// SaveData类型定义在storageService中，通过saveSystem间接导出

export type {
  AutoSaveResult,
  RecoverGameResult,
  ActionType
} from './autoSave';
