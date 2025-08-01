import { useSaveStore } from './saveSystem';
import { useGameCoreStore } from '../gameCore';
import { usePlayerStore } from '../player';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';

// ==================== 类型定义 ====================

/**
 * 自动保存结果接口
 */
export interface AutoSaveResult {
  success: boolean;
  message?: string;
  saveId?: string;
  [key: string]: any;
}

/**
 * 恢复游戏结果接口
 */
export interface RecoverGameResult {
  success: boolean;
  saveInfo?: any;
  message?: string;
}

/**
 * 操作类型
 */
export type ActionType = 'house_purchase' | 'trade' | 'weekly_end' | 'manual' | string;

// ==================== 自动存档模块 ====================

/**
 * 自动存档模块 - TypeScript版本
 * 提供自动存档相关功能
 */
export const useAutoSave = () => {
  const saveStore = useSaveStore();
  const gameCore = useGameCoreStore();
  const player = usePlayerStore();

  /**
   * 检查是否需要执行周期性自动保存
   * @returns 是否执行了自动保存
   */
    const checkPeriodicAutoSave = async (): Promise<boolean> => {
    // 只有游戏处于活跃状态时才执行自动保存
    if (!(gameCore as any).isGameActive) {
      return false;
    }

    const result = await saveStore.checkAutoSave((gameCore as any).currentWeek);
    return result !== undefined ? true : false;
  };

  /**
   * 执行紧急自动保存（例如检测到异常情况时）
   * @returns 保存结果
   */
  const performEmergencySave = async (): Promise<AutoSaveResult> => {
    const saveName = `紧急保存 (第${(gameCore as any).currentWeek}周, ${(player as any).name})`;
    const result = await saveStore.saveGame(saveName, true);
    return result ? { success: true, saveId: saveName } : { success: false };
  };

  /**
   * 执行重要操作后的自动保存
   * @param actionType 操作类型
   * @param moneyThreshold 大额交易阈值（金钱变动超过此值时触发）
   * @returns 保存结果，如果未触发则返回null
   */
  const checkActionAutoSave = async (
    actionType: ActionType,
    moneyThreshold: number = 5000
  ): Promise<AutoSaveResult | null> => {
    // 房屋购买自动触发保存
    if (actionType === 'house_purchase') {
            const result = await (saveStore as any).triggerImportantActionAutoSave('house_purchase');
      return result ? { success: true } : { success: false };
    }

    // 大宗交易（金额超过阈值）触发保存
    if (actionType === 'trade' && Math.abs((player as any).money) >= moneyThreshold) {
      const result = await (saveStore as any).triggerImportantActionAutoSave('large_trade');
      return result ? { success: true } : { success: false };
    }

    // 周末结束时的保存
    if (actionType === 'weekly_end') {
      const result = await saveStore.checkAutoSave((gameCore as any).currentWeek);
      return result !== undefined ? { success: true } : { success: false };
    }

    return null;
  };

  /**
   * 执行游戏暂停时的自动保存
   * @returns 保存结果
   */
  const performPauseSave = async (): Promise<AutoSaveResult> => {
    const saveName = `暂停保存 (第${(gameCore as any).currentWeek}周, ${(player as any).name})`;
    const result = await saveStore.saveGame(saveName, true);
    return result ? { success: true, saveId: saveName } : { success: false };
  };

  /**
   * 尝试恢复未正常退出的游戏
   * @returns 恢复结果，如果没有可恢复的存档则返回null
   */
  const tryRecoverGame = async (): Promise<RecoverGameResult | null> => {
    // 检查是否有最新的自动存档
    const latestAutoSave = (saveStore as any).autoSaves[0];
    if (!latestAutoSave) {
      return null;
    }

    try {
      const result = await saveStore.loadGame(latestAutoSave.id);
      if (result) {
        return {
          success: true,
          saveInfo: latestAutoSave
        };
      }
    } catch (error) {
      handleError(error as Error, 'AutoSave.tryRecoverGame', ErrorType.STORAGE, ErrorSeverity.ERROR);
      console.error('恢复游戏失败', error);
    }

    return null;
  };

  /**
   * 设置自动保存间隔
   * @param weeks 周数间隔
   */
  const setAutoSaveInterval = (weeks: number): void => {
    if (weeks < 1) weeks = 1;
    if (weeks > 20) weeks = 20;

    (saveStore as any).autoSaveInterval = weeks;
  };

  /**
   * 设置最大自动存档数量
   * @param count 存档数量
   */
  const setMaxAutoSaves = (count: number): void => {
    if (count < 1) count = 1;
    if (count > 10) count = 10;

    (saveStore as any).maxAutoSaves = count;

    // 立即清理多余的存档
    (saveStore as any).cleanupOldAutoSaves();
  };

  /**
   * 获取自动保存配置
   * @returns 自动保存配置信息
   */
  const getAutoSaveConfig = (): { interval: number; maxSaves: number; enabled: boolean } => {
    return {
      interval: (saveStore as any).autoSaveInterval || 3,
      maxSaves: (saveStore as any).maxAutoSaves || 5,
      enabled: (saveStore as any).autoSaveEnabled || true
    };
  };

  /**
   * 启用或禁用自动保存
   * @param enabled 是否启用
   */
  const setAutoSaveEnabled = (enabled: boolean): void => {
    (saveStore as any).autoSaveEnabled = enabled;
  };

  /**
   * 检查是否应该提示用户进行重要操作的保存
   * @param actionType 操作类型
   * @returns 是否应该提示保存
   */
  const shouldPromptSave = (actionType: ActionType): boolean => {
    const config = getAutoSaveConfig();
    if (!config.enabled) return false;

    // 房屋购买等重要操作总是提示
    if (actionType === 'house_purchase') return true;

    // 检查距离上次保存的时间
    const lastSaveWeek = (saveStore as any).lastAutoSaveWeek || 0;
    const currentWeek = (gameCore as any).currentWeek || 0;

    return (currentWeek - lastSaveWeek) >= config.interval;
  };

  /**
   * 清理所有自动存档
   * @returns 清理结果
   */
  const clearAllAutoSaves = async (): Promise<boolean> => {
    try {
      const autoSaves = (saveStore as any).autoSaves || [];
      for (const save of autoSaves) {
        await saveStore.deleteSave(save.id);
      }
      return true;
    } catch (error) {
      handleError(error as Error, 'AutoSave.clearAllAutoSaves', ErrorType.STORAGE, ErrorSeverity.ERROR);
      console.error('清理自动存档失败', error);
      return false;
    }
  };

  return {
    checkPeriodicAutoSave,
    performEmergencySave,
    checkActionAutoSave,
    performPauseSave,
    tryRecoverGame,
    setAutoSaveInterval,
    setMaxAutoSaves,
    getAutoSaveConfig,
    setAutoSaveEnabled,
    shouldPromptSave,
    clearAllAutoSaves
  };
};
