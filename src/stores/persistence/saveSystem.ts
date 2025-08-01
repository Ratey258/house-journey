import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useGameCoreStore } from '../gameCore';
import { usePlayerStore } from '../player';
import { useMarketStore } from '../market';
import { useEventStore } from '../events';
import { withErrorHandling } from '../../infrastructure/utils/errorHandler';
import storageService, { validateSaveData, repairSaveData, ensureVersionCompatibility, type SaveData } from '../../infrastructure/persistence/storageService';
import { useUiStore } from '../uiStore';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';

// ==================== 类型定义 ====================

/**
 * 存档项接口
 */
export interface SaveItem {
  id: string;
  name: string;
  isAuto: boolean;
  timestamp: number;
  lastModified?: string;
  size?: number;
  description?: string;
  gameWeek?: number;
  playerMoney?: number;
  playerName?: string;
}

/**
 * 存档列表状态接口
 */
export interface SaveSystemState {
  saveList: SaveItem[];
  isLoading: boolean;
  lastAutoSaveWeek: number;
  autoSaveEnabled: boolean;
  saveTemplate: SaveData | null;
  lastValidatedSave: string | null;
}

// ==================== 常量 ====================

const SAVE_LIST_KEY = 'saveList';
const SAVE_PREFIX = 'houseJourneySave_';
const MAX_AUTO_SAVES = 3;
const AUTO_SAVE_INTERVAL = 5; // 每5周自动保存一次

// 从全局变量获取版本号（由Vite构建时自动注入）
declare const __APP_VERSION__: string;
const CURRENT_GAME_VERSION = __APP_VERSION__;

// ==================== Store定义 ====================

/**
 * 存档系统存储
 * 管理游戏存档的保存、加载和删除
 */
export const useSaveStore = defineStore('save', () => {
  // ==================== 状态 ====================

  const saveList = ref<SaveItem[]>([]);
  const isLoading = ref(false);
  const lastAutoSaveWeek = ref(0);
  const autoSaveEnabled = ref(true);
  const saveTemplate = ref<SaveData | null>(null);
  const lastValidatedSave = ref<string | null>(null);

  // ==================== 计算属性 ====================

  /**
   * 获取自动存档列表
   */
  const autoSaves = computed(() => {
    return saveList.value
      .filter(save => save.isAuto)
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  /**
   * 获取手动存档列表
   */
  const manualSaves = computed(() => {
    return saveList.value
      .filter(save => !save.isAuto)
      .sort((a, b) => b.timestamp - a.timestamp);
  });

  /**
   * 获取最新存档
   */
  const latestSave = computed(() => {
    if (saveList.value.length === 0) return null;
    return saveList.value.sort((a, b) => b.timestamp - a.timestamp)[0];
  });

  // ==================== 方法 ====================

  /**
   * 初始化存档系统
   */
  const init = async (): Promise<void> => {
    try {
      await loadSaveList();

      // 创建一个新游戏模板，用于修复损坏的存档
      createSaveTemplate();

      // 设置自动保存
      if (autoSaveEnabled.value) {
        // 每分钟检查一次是否需要自动保存
        setInterval(() => {
          const gameCore = useGameCoreStore();
          if (gameCore.gameStarted && !gameCore.gameOver && !gameCore.gamePaused) {
            checkAutoSave(gameCore.currentWeek);
          }
        }, 60000);
      }
    } catch (error) {
              handleError(error as Error, 'saveSystem (persistence)');
      console.error('初始化存档系统失败', error);
    }
  };

  /**
   * 创建存档模板
   * 用于修复损坏的存档
   */
  const createSaveTemplate = (): void => {
    const gameCore = useGameCoreStore();
    const player = usePlayerStore();
    const market = useMarketStore();
    const event = useEventStore();

    // 创建一个基本模板数据结构
    saveTemplate.value = {
      version: CURRENT_GAME_VERSION,
      timestamp: new Date().toISOString(),
      gameCore: {
        currentWeek: 1,
        maxWeeks: 52,
        gameStarted: true,
        gamePaused: false,
        gameOver: false,
        gameResult: null,
        notifications: [],
        gameGoals: {
          requiredNetWorth: 400000,
          targetWeeks: 30,
          debtRatio: 0.4
        }
      },
      player: {
        name: '玩家',
        money: 5000,
        debt: 2000,
        capacity: 100,
        inventoryUsed: 0,
        inventory: [],
        purchasedHouses: [],
        statistics: {
          weekCount: 1,
          transactionCount: 0,
          totalProfit: 0,
          maxMoney: 5000,
          visitedLocations: []
        }
      },
      market: {
        locations: (market as any).locations || [],
        currentLocation: null,
        productPrices: {},
        products: [],
        houses: [],
        marketModifiers: {}
      },
      event: {
        activeEvent: null,
        forceLocationChange: false,
        targetLocation: null,
        nextEventId: null,
        triggeredEvents: []
      }
    };
  };

  /**
   * 加载存档列表
   * @returns 存档列表
   */
  const loadSaveList = async (): Promise<SaveItem[]> => {
    try {
      console.log('尝试加载存档列表...');

      // 使用存储服务加载存档列表
      const savedList = await (storageService as any).getData(SAVE_LIST_KEY);

      // 如果存档列表为空，尝试从Electron API直接获取
      if (!savedList || !Array.isArray(savedList) || savedList.length === 0) {
        console.log('存档列表为空或无效，尝试从文件系统获取...');

        try {
          if ((window as any).electronAPI && (window as any).electronAPI.listSaves) {
            const result = await (window as any).electronAPI.listSaves();

            if (result && result.success && Array.isArray(result.saves)) {
              console.log('从Electron API获取到', result.saves.length, '个存档');

              // 将文件系统返回的存档列表转换成我们需要的格式
              const formattedSaves: SaveItem[] = result.saves.map((save: any) => ({
                id: save.name,
                name: save.name,
                isAuto: save.name.startsWith('autosave_') || save.name.includes('自动存档'),
                timestamp: save.lastModified ? new Date(save.lastModified).getTime() : Date.now(),
                lastModified: save.lastModified,
                size: save.size
              }));

              saveList.value = formattedSaves;

              // 保存到本地存储以供下次使用
              await (storageService as any).setData(SAVE_LIST_KEY, formattedSaves);

              return formattedSaves;
            }
          }
        } catch (electronError) {
          console.log('从Electron API获取存档失败，使用本地存储:', electronError);
        }

        // 如果都失败了，使用空数组
        saveList.value = [];
        return [];
      }

      saveList.value = savedList;
      console.log('成功加载存档列表，共', savedList.length, '个存档');
      return savedList;
    } catch (error) {
      handleError(error as Error, 'saveSystem (loadSaveList)');
      console.error('加载存档列表失败:', error);
      saveList.value = [];
      return [];
    }
  };

  /**
   * 保存游戏
   * @param saveName 存档名称
   * @param isAuto 是否为自动存档
   * @returns 是否成功
   */
  const saveGame = async (saveName: string, isAuto: boolean = false): Promise<boolean> => {
    const wrappedFunction = withErrorHandling(async () => {
      isLoading.value = true;

      try {
        const gameCore = useGameCoreStore();
        const player = usePlayerStore();
        const market = useMarketStore();
        const event = useEventStore();

        const saveData: SaveData = {
          version: CURRENT_GAME_VERSION,
          timestamp: new Date().toISOString(),
          gameCore: {
            currentWeek: gameCore.currentWeek,
            maxWeeks: gameCore.maxWeeks,
            gameStarted: gameCore.gameStarted,
            gamePaused: gameCore.gamePaused,
            gameOver: gameCore.gameOver,
            ...(gameCore as any)
          },
          player: {
            ...(player as any)
          },
          market: {
            ...(market as any)
          },
          event: {
            ...(event as any)
          }
        };

        // 验证数据
        const validation = validateSaveData(saveData);
        if (!validation.isValid) {
          console.warn('存档数据验证失败:', validation.issues);
          // 尝试修复数据
          const repairedData = repairSaveData(saveData, saveTemplate.value);
          if (repairedData) {
            Object.assign(saveData, repairedData);
          }
        }

        // 保存数据
        const saveKey = SAVE_PREFIX + saveName;
        const success = await (storageService as any).setData(saveKey, saveData);

        if (success) {
          // 更新存档列表
          const saveItem: SaveItem = {
            id: saveName,
            name: saveName,
            isAuto,
            timestamp: Date.now(),
            gameWeek: gameCore.currentWeek,
            playerMoney: player.money,
            playerName: player.name || '玩家'
          };

          // 检查是否是已存在的存档
          const existingIndex = saveList.value.findIndex(save => save.id === saveName);
          if (existingIndex >= 0) {
            saveList.value[existingIndex] = saveItem;
          } else {
            saveList.value.push(saveItem);
          }

          // 如果是自动存档，清理旧的自动存档
          if (isAuto) {
            await cleanupAutoSaves();
          }

          // 保存存档列表
          await (storageService as any).setData(SAVE_LIST_KEY, saveList.value);

          console.log(`存档保存成功: ${saveName}`);
          lastValidatedSave.value = saveName;

          return true;
        } else {
          throw new Error('存储服务保存失败');
        }
      } catch (error) {
        console.error('保存游戏失败:', error);
        throw error;
      } finally {
        isLoading.value = false;
      }
        }, 'saveSystem (saveGame)');

    const result = wrappedFunction();
    return result !== undefined ? result : false;
  };

  /**
   * 加载游戏
   * @param saveName 存档名称
   * @returns 是否成功
   */
  const loadGame = async (saveName: string): Promise<boolean> => {
    const wrappedFunction = withErrorHandling(async () => {
      isLoading.value = true;

      try {
        const saveKey = SAVE_PREFIX + saveName;
        let saveData = await (storageService as any).getData(saveKey);

        if (!saveData) {
          throw new Error('存档不存在');
        }

        // 版本兼容性检查
        saveData = ensureVersionCompatibility(saveData, CURRENT_GAME_VERSION);
        if (!saveData) {
          throw new Error('存档版本不兼容');
        }

        // 验证存档数据
        const validation = validateSaveData(saveData);
        if (!validation.isValid) {
          console.warn('存档数据验证失败，尝试修复:', validation.issues);

          // 尝试修复数据
          const repairedData = repairSaveData(saveData, saveTemplate.value);
          if (repairedData) {
            saveData = repairedData;

            // 保存修复后的数据
            await (storageService as any).setData(saveKey, saveData);
            console.log('存档数据已修复并重新保存');
          } else {
            throw new Error('存档数据损坏且无法修复');
          }
        }

        // 恢复各个store的状态
        const gameCore = useGameCoreStore();
        const player = usePlayerStore();
        const market = useMarketStore();
        const event = useEventStore();

        // 恢复游戏核心状态
        Object.assign(gameCore, saveData.gameCore);

        // 恢复玩家状态
        Object.assign(player, saveData.player);

        // 恢复市场状态
        Object.assign(market, saveData.market);

        // 恢复事件状态
        Object.assign(event, saveData.event);

        console.log(`存档加载成功: ${saveName}`);
        lastValidatedSave.value = saveName;

        return true;
      } catch (error) {
        console.error('加载游戏失败:', error);
        throw error;
      } finally {
        isLoading.value = false;
      }
        }, 'saveSystem (loadGame)');

    const result = wrappedFunction();
    return result !== undefined ? result : false;
  };

  /**
   * 删除存档
   * @param saveName 存档名称
   * @returns 是否成功
   */
  const deleteSave = async (saveName: string): Promise<boolean> => {
    const wrappedFunction = withErrorHandling(async () => {
      try {
        const saveKey = SAVE_PREFIX + saveName;
        const success = await (storageService as any).removeData(saveKey);

        if (success) {
          // 从存档列表中移除
          const index = saveList.value.findIndex(save => save.id === saveName);
          if (index >= 0) {
            saveList.value.splice(index, 1);
          }

          // 更新存档列表
          await (storageService as any).setData(SAVE_LIST_KEY, saveList.value);

          console.log(`存档删除成功: ${saveName}`);
          return true;
        }

        return false;
      } catch (error) {
        console.error('删除存档失败:', error);
        throw error;
      }
        }, 'saveSystem (deleteSave)');

    const result = wrappedFunction();
    return result !== undefined ? result : false;
  };

  /**
   * 检查是否需要自动保存
   * @param currentWeek 当前周数
   */
  const checkAutoSave = async (currentWeek: number): Promise<void> => {
    if (!autoSaveEnabled.value) return;

    // 检查是否达到自动保存间隔
    if (currentWeek - lastAutoSaveWeek.value >= AUTO_SAVE_INTERVAL) {
      const autoSaveName = `autosave_week_${currentWeek}`;
      const success = await saveGame(autoSaveName, true);

      if (success) {
        lastAutoSaveWeek.value = currentWeek;
        console.log(`自动保存完成: ${autoSaveName}`);
      }
    }
  };

  /**
   * 清理旧的自动存档
   */
  const cleanupAutoSaves = async (): Promise<void> => {
    try {
      const currentAutoSaves = autoSaves.value;

      // 如果自动存档数量超过限制，删除最老的
      if (currentAutoSaves.length > MAX_AUTO_SAVES) {
        const savesToDelete = currentAutoSaves.slice(MAX_AUTO_SAVES);

        for (const save of savesToDelete) {
          await deleteSave(save.id);
        }

        console.log(`清理了 ${savesToDelete.length} 个旧的自动存档`);
      }
    } catch (error) {
      console.error('清理自动存档失败:', error);
    }
  };

  /**
   * 设置自动保存开关
   * @param enabled 是否启用
   */
  const setAutoSaveEnabled = (enabled: boolean): void => {
    autoSaveEnabled.value = enabled;
  };

  /**
   * 清除所有存档
   * @returns 是否成功
   */
  const clearAllSaves = async (): Promise<boolean> => {
    const wrappedFunction = withErrorHandling(async () => {
      try {
        // 删除所有存档文件
        for (const save of saveList.value) {
          await deleteSave(save.id);
        }

        // 清空存档列表
        saveList.value = [];
        await (storageService as any).removeData(SAVE_LIST_KEY);

        console.log('所有存档已清除');
        return true;
      } catch (error) {
        console.error('清除所有存档失败:', error);
        throw error;
      }
        }, 'saveSystem (clearAllSaves)');

    const result = wrappedFunction();
    return result !== undefined ? result : false;
  };

  // ==================== 返回 ====================

  return {
    // 状态
    saveList,
    isLoading,
    lastAutoSaveWeek,
    autoSaveEnabled,
    saveTemplate,
    lastValidatedSave,

    // 计算属性
    autoSaves,
    manualSaves,
    latestSave,

    // 方法
    init,
    createSaveTemplate,
    loadSaveList,
    saveGame,
    loadGame,
    deleteSave,
    checkAutoSave,
    cleanupAutoSaves,
    setAutoSaveEnabled,
    clearAllSaves
  };
});
