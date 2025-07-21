import { useSaveStore } from './saveSystem';
import { useGameCoreStore } from '../gameCore';
import { usePlayerStore } from '../player';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';

/**
 * 自动存档模块
 * 提供自动存档相关功能
 */
export const useAutoSave = () => {
  const saveStore = useSaveStore();
  const gameCore = useGameCoreStore();
  const player = usePlayerStore();
  
  /**
   * 检查是否需要执行周期性自动保存
   * @returns {Promise<boolean>} 是否执行了自动保存
   */
  const checkPeriodicAutoSave = async () => {
    // 只有游戏处于活跃状态时才执行自动保存
    if (!gameCore.isGameActive) {
      return false;
    }
    
    return await saveStore.checkAutoSave(gameCore.currentWeek);
  };
  
  /**
   * 执行紧急自动保存（例如检测到异常情况时）
   * @returns {Promise<Object>} 保存结果
   */
  const performEmergencySave = async () => {
    const saveName = `紧急保存 (第${gameCore.currentWeek}周, ${player.name})`;
    return await saveStore.saveGame(saveName, true);
  };
  
  /**
   * 执行重要操作后的自动保存
   * @param {string} actionType - 操作类型
   * @param {number} moneyThreshold - 大额交易阈值（金钱变动超过此值时触发）
   * @returns {Promise<Object|null>} 保存结果，如果未触发则返回null
   */
  const checkActionAutoSave = async (actionType, moneyThreshold = 5000) => {
    // 房屋购买自动触发保存
    if (actionType === 'house_purchase') {
      return await saveStore.triggerImportantActionAutoSave('house_purchase');
    }
    
    // 大宗交易（金额超过阈值）触发保存
    if (actionType === 'trade' && Math.abs(player.money) >= moneyThreshold) {
      return await saveStore.triggerImportantActionAutoSave('major_trade');
    }
    
    // 事件相关保存
    if (actionType === 'event') {
      return await saveStore.triggerImportantActionAutoSave('event');
    }
    
    return null;
  };
  
  /**
   * 执行游戏暂停时的自动保存
   * @returns {Promise<Object>} 保存结果
   */
  const performPauseSave = async () => {
    const saveName = `暂停保存 (第${gameCore.currentWeek}周, ${player.name})`;
    return await saveStore.saveGame(saveName, true);
  };
  
  /**
   * 尝试恢复未正常退出的游戏
   * @returns {Promise<Object|null>} 恢复结果，如果没有可恢复的存档则返回null
   */
  const tryRecoverGame = async () => {
    // 检查是否有最新的自动存档
    const latestAutoSave = saveStore.autoSaves[0];
    if (!latestAutoSave) {
      return null;
    }
    
    try {
      const result = await saveStore.loadGame(latestAutoSave.id);
      if (result.success) {
        return {
          success: true,
          saveInfo: latestAutoSave
        };
      }
    } catch (error) {
      handleError(error, 'AutoSave.tryRecoverGame', ErrorType.STORAGE, ErrorSeverity.ERROR);
      console.error('恢复游戏失败', error);
    }
    
    return null;
  };
  
  /**
   * 设置自动保存间隔
   * @param {number} weeks - 周数间隔
   */
  const setAutoSaveInterval = (weeks) => {
    if (weeks < 1) weeks = 1;
    if (weeks > 20) weeks = 20;
    
    saveStore.autoSaveInterval = weeks;
  };
  
  /**
   * 设置最大自动存档数量
   * @param {number} count - 存档数量
   */
  const setMaxAutoSaves = (count) => {
    if (count < 1) count = 1;
    if (count > 10) count = 10;
    
    saveStore.maxAutoSaves = count;
    
    // 立即清理多余的存档
    saveStore.cleanupOldAutoSaves();
  };
  
  return {
    checkPeriodicAutoSave,
    performEmergencySave,
    checkActionAutoSave,
    performPauseSave,
    tryRecoverGame,
    setAutoSaveInterval,
    setMaxAutoSaves
  };
}; 