import { defineStore } from 'pinia';
import { useGameCoreStore } from '../gameCore';
import { usePlayerStore } from '../player';
import { useMarketStore } from '../market';
import { useEventStore } from '../events';
import { withErrorHandling } from '@/infrastructure/utils/errorHandler';
import storageService, { validateSaveData, repairSaveData, ensureVersionCompatibility } from '@/infrastructure/persistence/storageService';
import { useUiStore } from '../uiStore';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';

// 存档相关常量
const SAVE_LIST_KEY = 'saveList';
const SAVE_PREFIX = 'houseJourneySave_';
const MAX_AUTO_SAVES = 3;
const AUTO_SAVE_INTERVAL = 5; // 每5周自动保存一次
// 从全局变量获取版本号（由Vite构建时自动注入）
const CURRENT_GAME_VERSION = __APP_VERSION__;

/**
 * 存档系统存储
 * 管理游戏存档的保存、加载和删除
 */
export const useSaveStore = defineStore('save', {
  state: () => ({
    saveList: [],
    isLoading: false,
    lastAutoSaveWeek: 0,
    autoSaveEnabled: true,
    saveTemplate: null, // 用于存储模板数据，用于修复损坏的存档
    lastValidatedSave: null // 记录最后验证过的存档ID
  }),

  actions: {
    /**
     * 初始化存档系统
     */
    async init() {
      try {
        await this.loadSaveList();

        // 创建一个新游戏模板，用于修复损坏的存档
        this.createSaveTemplate();

        // 设置自动保存
        if (this.autoSaveEnabled) {
          // 每分钟检查一次是否需要自动保存
          setInterval(() => {
            const gameCore = useGameCoreStore();
            if (gameCore.gameStarted && !gameCore.gameOver && !gameCore.gamePaused) {
              this.checkAutoSave(gameCore.currentWeek);
            }
          }, 60000);
        }
      } catch (error) {
        handleError(error, 'saveSystem (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        console.error('初始化存档系统失败', error);
      }
    },

    /**
     * 创建存档模板
     * 用于修复损坏的存档
     */
    createSaveTemplate() {
      const gameCore = useGameCoreStore();
      const player = usePlayerStore();
      const market = useMarketStore();
      const event = useEventStore();

      // 创建一个基本模板数据结构
      this.saveTemplate = {
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
          locations: market.locations || [],
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
    },

    /**
     * 加载存档列表
     * @returns {Promise<Array>} 存档列表
     */
    async loadSaveList() {
      try {
        console.log('尝试加载存档列表...');

        // 使用存储服务加载存档列表
        const saveList = await storageService.getData(SAVE_LIST_KEY);

        // 如果存档列表为空，尝试从Electron API直接获取
        if (!saveList || !Array.isArray(saveList) || saveList.length === 0) {
          console.log('存档列表为空或无效，尝试从文件系统获取...');

          try {
            if (window.electronAPI && window.electronAPI.listSaves) {
              const result = await window.electronAPI.listSaves();

              if (result && result.success && Array.isArray(result.saves)) {
                console.log('从Electron API获取到', result.saves.length, '个存档');

                // 将文件系统返回的存档列表转换成我们需要的格式
                const formattedSaves = result.saves.map(save => ({
                  id: save.name,
                  name: save.name,
                  isAuto: save.name.startsWith('autosave_') || save.name.includes('自动存档'),
                  timestamp: save.lastModified ? new Date(save.lastModified).getTime() : Date.now(),
                  lastModified: save.lastModified
                }));

                // 更新存档列表
                this.saveList = formattedSaves;

                // 保存到存储服务
                await storageService.setData(SAVE_LIST_KEY, formattedSaves);

                return formattedSaves;
              }
            }
          } catch (electronError) {
            console.error('从Electron API获取存档列表失败', electronError);
          }

          // 如果Electron API也失败，使用空数组
          this.saveList = [];
        } else {
          console.log('成功从存储中加载存档列表，数量:', saveList.length);
          this.saveList = saveList;
        }
      } catch (error) {
        handleError(error, 'saveSystem (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        console.error('加载存档列表失败', error);
        this.saveList = [];
      }

      return this.saveList;
    },

    /**
     * 验证存档
     * @param {string} saveId - 存档ID
     * @returns {Promise<Object>} 验证结果
     */
    async validateSave(saveId) {
      try {
        // 如果没有指定saveId，使用最后验证过的存档
        const targetId = saveId || this.lastValidatedSave;
        if (!targetId) {
          return {
            success: false,
            message: '未指定存档ID'
          };
        }

        // 使用存储服务加载存档数据
        const saveData = await storageService.getData(`${SAVE_PREFIX}${targetId}`);
        if (!saveData) {
          return {
            success: false,
            message: '存档不存在或已损坏'
          };
        }

        // 验证存档数据
        const validationResult = validateSaveData(saveData);

        return {
          success: validationResult.isValid,
          issues: validationResult.issues,
          saveData,
          canRepair: validationResult.issues.length > 0
        };
      } catch (error) {
        handleError(error, 'saveSystem (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        console.error('验证存档失败', error);
        return {
          success: false,
          message: `验证失败: ${error.message}`,
          error
        };
      }
    },

    /**
     * 保存游戏
     * @param {string} saveName - 存档名称
     * @param {boolean} isAutoSave - 是否为自动保存
     * @returns {Promise<Object>} 保存结果
     */
    async saveGame(saveName, isAutoSave = false) {
      return withErrorHandling(async () => {
        const gameCore = useGameCoreStore();
        const player = usePlayerStore();
        const market = useMarketStore();
        const event = useEventStore();
        const uiStore = useUiStore();

        // 生成存档数据 - 安全处理可能包含循环引用的对象
        // 在外部声明变量，确保在try/catch外部可见
        let saveData = {
            version: CURRENT_GAME_VERSION,
            timestamp: new Date().toISOString()
        };

        try {
          console.log('准备存档数据...');

          // 安全地获取游戏核心数据
          const safeGameResult = gameCore.gameResult ? JSON.parse(JSON.stringify({
            reason: gameCore.gameResult.reason,
            week: gameCore.gameResult.week,
            score: gameCore.gameResult.score,
            endReason: gameCore.gameResult.endReason,
            victoryAchieved: gameCore.gameResult.victoryAchieved,
            firstVictoryWeek: gameCore.gameResult.firstVictoryWeek
          })) : null;

          // 安全地获取通知数据
          const safeNotifications = gameCore.notifications ? gameCore.notifications.map(n => ({
            id: n.id,
            type: n.type,
            message: n.message,
            timestamp: n.timestamp
          })) : [];

          // 安全地处理库存物品
          const safeInventory = player.inventory ? player.inventory.map(item => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            purchaseWeek: item.purchaseWeek
          })) : [];

          // 安全地处理已购买房屋
          const safePurchasedHouses = player.purchasedHouses ? player.purchasedHouses.map(house => ({
            houseId: house.houseId,
            name: house.name,
            level: house.level,
            purchasePrice: house.purchasePrice,
            purchaseWeek: house.purchaseWeek,
            location: typeof house.location === 'string' ? house.location : null
          })) : [];

          // 安全地处理事件数据
          let safeActiveEvent = null;
          if (event.activeEvent) {
            safeActiveEvent = {
              id: event.activeEvent.id,
              title: event.activeEvent.title,
              type: event.activeEvent.type
            };
          }

          // 创建安全的存档对象
          saveData = {
          version: CURRENT_GAME_VERSION,
          timestamp: new Date().toISOString(),
          gameCore: {
            currentWeek: gameCore.currentWeek,
            maxWeeks: gameCore.maxWeeks,
            gameStarted: gameCore.gameStarted,
            gamePaused: gameCore.gamePaused,
            gameOver: gameCore.gameOver,
              gameResult: safeGameResult,
              notifications: safeNotifications,
              gameGoals: JSON.parse(JSON.stringify(gameCore.gameGoals || {}))
          },
          player: {
            name: player.name,
            money: player.money,
            debt: player.debt,
            capacity: player.capacity,
            inventoryUsed: player.inventoryUsed,
              inventory: safeInventory,
              purchasedHouses: safePurchasedHouses,
              statistics: JSON.parse(JSON.stringify(player.statistics || {}))
          },
          market: {
              locations: JSON.parse(JSON.stringify(market.locations || [])),
            currentLocation: market.currentLocation ? market.currentLocation.id : null,
              productPrices: JSON.parse(JSON.stringify(market.productPrices || {})),
              products: market.products ? market.products.map(p => typeof p === 'object' ? p.id : p) : [],
              houses: market.houses ? market.houses.map(h => typeof h === 'object' ? h.id : h) : [],
              marketModifiers: JSON.parse(JSON.stringify(market.marketModifiers || {}))
          },
          event: {
              activeEvent: safeActiveEvent,
            forceLocationChange: event.forceLocationChange,
            targetLocation: event.targetLocation,
            nextEventId: event.nextEventId,
              triggeredEvents: JSON.parse(JSON.stringify(event.triggeredEvents || []))
          }
        };

          console.log('存档数据准备完成');
        } catch (error) {
          handleError(error, 'saveSystem (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
          console.error('准备存档数据时出错:', error);

          // 创建简化版的存档数据
          saveData = {
            version: CURRENT_GAME_VERSION,
            timestamp: new Date().toISOString(),
            gameCore: {
              currentWeek: gameCore.currentWeek,
              maxWeeks: gameCore.maxWeeks,
              gameStarted: true,
              gamePaused: false,
              gameOver: gameCore.gameOver
            },
            player: {
              name: player.name,
              money: player.money,
              debt: player.debt,
              capacity: 100,
              inventoryUsed: 0,
              inventory: [],
              purchasedHouses: []
            },
            market: {
              currentLocation: null,
              productPrices: {},
              products: [],
              houses: [],
              marketModifiers: {}
            },
            event: {
              triggeredEvents: []
            }
          };

          if (!isAutoSave) {
            uiStore.showToast({
              type: 'warning',
              message: '存档数据处理出错，使用简化版本',
              duration: 3000
            });
          }
        }

        // 验证存档数据
        const validationResult = validateSaveData(saveData);
        if (!validationResult.isValid) {
          console.warn('生成的存档数据有问题，尝试修复...', validationResult.issues);

          if (!isAutoSave) {
            // 如果不是自动存档，显示提示
            uiStore.showToast({
              type: 'warning',
              message: '存档数据有问题，正在修复...',
              duration: 3000
            });
          }

          // 修复数据
          const repairResult = repairSaveData(saveData, this.saveTemplate);
          // 使用修复后的数据
          saveData = repairResult.data;

          // 如果是用户手动保存，显示修复日志
          if (!isAutoSave && repairResult.repairLog.length > 0) {
            console.info('存档修复完成', repairResult.repairLog);
            uiStore.showToast({
              type: 'info',
              message: `存档已修复 (${repairResult.repairLog.length}项问题)`,
              duration: 3000
            });
          }
        }

        // 处理存档ID
        let saveId;
        let isNewSave = true;

        if (isAutoSave) {
          // 为自动存档生成ID
          const autoSaveId = `auto_${Date.now()}`;
          saveId = autoSaveId;
          saveName = `自动存档 - 第${gameCore.currentWeek}周 - ${new Date().toLocaleString()}`;
        } else {
          // 检查是否已存在同名存档
          const existingSave = this.saveList.find(save => save.name === saveName);
          if (existingSave) {
            // 如果存在同名存档，使用相同的ID进行覆盖
            saveId = existingSave.id;
            isNewSave = false;
          } else {
            // 生成新的存档ID
            saveId = `save_${Date.now()}`;
          }
        }

        // 创建存档元数据
        const saveInfo = {
          id: saveId,
          name: saveName,
          isAuto: isAutoSave,
          timestamp: Date.now(),
          week: gameCore.currentWeek,
          playerMoney: player.money,
          playerDebt: player.debt,
          location: market.currentLocation ? market.currentLocation.name : '未知位置',
          version: CURRENT_GAME_VERSION
        };

        try {
          console.log('正在保存游戏数据到存储...');

          // 保存游戏数据到本地存储
        await storageService.setData(`${SAVE_PREFIX}${saveId}`, saveData);
          console.log('游戏数据已保存到存储');

          // 尝试使用Electron API直接保存到文件系统
          if (window.electronAPI && window.electronAPI.saveGame) {
            console.log('尝试使用Electron API保存游戏...');
            const electronResult = await window.electronAPI.saveGame({
              name: saveName,
              gameState: saveData
            });

            if (electronResult && electronResult.success) {
              console.log('游戏已成功保存到文件系统:', electronResult.path);
            } else {
              console.warn('Electron保存可能失败:', electronResult?.error || '未知错误');
            }
          }

        // 更新存档列表
          console.log('更新存档列表...');
        if (isNewSave) {
          this.saveList.unshift(saveInfo);
        } else {
          // 更新已存在的存档信息
          const index = this.saveList.findIndex(save => save.id === saveId);
          if (index !== -1) {
            this.saveList[index] = saveInfo;
            }
          }
        } catch (storageError) {
          handleError(storageError, 'saveSystem (persistence)', ErrorType.STORAGE, ErrorSeverity.ERROR);
          console.error('保存游戏数据时出错:', storageError);

          // 尝试直接使用Electron API作为备份方案
          if (window.electronAPI && window.electronAPI.saveGame) {
            console.log('尝试使用备用方法保存游戏...');
            const backupResult = await window.electronAPI.saveGame({
              name: saveName,
              gameState: saveData
            });

            if (!backupResult || !backupResult.success) {
              throw storageError; // 如果备份方法也失败，重新抛出原始错误
            }

            console.log('已使用备用方法保存游戏');
          } else {
            throw storageError;
          }
        }

        // 限制自动存档数量
        if (isAutoSave) {
          const autoSaves = this.saveList.filter(save => save.isAuto);
          if (autoSaves.length > MAX_AUTO_SAVES) {
            const oldestAutoSaves = autoSaves
              .sort((a, b) => a.timestamp - b.timestamp)
              .slice(0, autoSaves.length - MAX_AUTO_SAVES);

            // 删除多余的自动存档
            for (const oldSave of oldestAutoSaves) {
              await this.deleteSave(oldSave.id, true);
            }
          }
        }

        // 保存存档列表
        await storageService.setData(SAVE_LIST_KEY, this.saveList);

        if (!isAutoSave) {
          // 显示保存成功提示
          uiStore.showToast({
            type: 'success',
            message: isNewSave ? '游戏已保存' : '存档已更新',
            duration: 2000
          });
        }

        // 更新最后自动保存的周数
        if (isAutoSave) {
          this.lastAutoSaveWeek = gameCore.currentWeek;
        }

        return {
          success: true,
          saveId,
          isNewSave
        };
      }, 'saveGame', ErrorType.STORAGE, ErrorSeverity.ERROR);
    },

    /**
     * 加载游戏
     * @param {string} saveId - 存档ID
     * @returns {Promise<Object>} 加载结果
     */
    async loadGame(saveId) {
      return withErrorHandling(async () => {
        const gameCore = useGameCoreStore();
        const player = usePlayerStore();
        const market = useMarketStore();
        const event = useEventStore();
        const uiStore = useUiStore();

        try {
          // 记录当前验证的存档ID，用于后续可能的修复操作
          this.lastValidatedSave = saveId;

          // 先验证存档完整性
          const validationResult = await this.validateSave(saveId);

          // 如果验证失败，尝试修复
          if (!validationResult.success) {
            uiStore.showToast({
              type: 'warning',
              message: '存档可能已损坏，正在尝试修复...',
              duration: 3000
            });

            // 尝试加载存档数据，即使可能已损坏
            const rawSaveData = await storageService.getData(`${SAVE_PREFIX}${saveId}`);

            if (!rawSaveData) {
              uiStore.showToast({
                type: 'error',
                message: '存档数据无法读取，无法修复',
                duration: 5000
              });
              this.isLoading = false;
              return { success: false, message: '存档数据无法读取' };
            }

            // 尝试修复数据
            const repairResult = repairSaveData(rawSaveData, this.saveTemplate);
            const saveData = repairResult.data;

            // 如果修复后数据依然有问题，返回错误
            const secondValidation = validateSaveData(saveData);
            if (!secondValidation.isValid) {
              uiStore.showToast({
                type: 'error',
                message: '存档损坏严重，无法修复',
                duration: 5000
              });
              this.isLoading = false;
              return { success: false, message: '存档无法修复' };
            }

            // 如果修复成功，显示提示并保存修复后的数据
            uiStore.showToast({
              type: 'success',
              message: `存档已成功修复 (${repairResult.repairLog.length}项问题)`,
              duration: 5000
            });

            // 覆盖保存修复后的数据
            await storageService.setData(`${SAVE_PREFIX}${saveId}`, saveData);
            console.info('已保存修复后的存档', saveData);

            // 使用修复后的数据进行加载
            await this.loadStoresFromSaveData(saveData);
          } else {
            // 验证成功，直接加载
            await this.loadStoresFromSaveData(validationResult.saveData);
          }

          // 查找并更新存档信息
          const saveInfo = this.saveList.find(save => save.id === saveId);
          if (saveInfo) {
            // 更新存档预览数据
            saveInfo.previewData = {
              purchasedHouses: player.purchasedHouses.length,
              debt: player.debt,
              inventory: player.inventory.length,
              netWorth: player.netWorth
            };

            // 保存更新后的存档列表
            await storageService.setData(SAVE_LIST_KEY, this.saveList);
          }

          // 加载完成
          this.isLoading = false;

          return {
            success: true,
            message: '加载成功'
          };
        } catch (error) {
          handleError(error, 'saveSystem (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
          console.error('加载游戏失败', error);
          this.isLoading = false;

          uiStore.showToast({
            type: 'error',
            message: '加载存档失败: ' + error.message,
            duration: 5000
          });

          return {
            success: false,
            error,
            message: '加载失败: ' + error.message
          };
        }
      }, 'loadGame', ErrorType.STORAGE, ErrorSeverity.ERROR);
    },

    /**
     * 从存档数据加载各个Store
     * @param {Object} saveData - 存档数据
     * @private
     */
    async loadStoresFromSaveData(saveData) {
      const gameCore = useGameCoreStore();
      const player = usePlayerStore();
      const market = useMarketStore();
      const event = useEventStore();

      // 确保数据兼容性
      saveData = ensureVersionCompatibility(saveData, CURRENT_GAME_VERSION);

      // 加载游戏核心数据
      if (saveData.gameCore) {
        gameCore.currentWeek = saveData.gameCore.currentWeek || 1;
        gameCore.maxWeeks = saveData.gameCore.maxWeeks || 52;
        gameCore.gameStarted = Boolean(saveData.gameCore.gameStarted);
        gameCore.gamePaused = Boolean(saveData.gameCore.gamePaused);
        gameCore.gameOver = Boolean(saveData.gameCore.gameOver);
        gameCore.gameResult = saveData.gameCore.gameResult || null;
        gameCore.notifications = Array.isArray(saveData.gameCore.notifications)
          ? saveData.gameCore.notifications
          : [];
        gameCore.gameGoals = saveData.gameCore.gameGoals || {
          requiredNetWorth: 400000,
          targetWeeks: 30,
          debtRatio: 0.4
        };
      }

      // 加载玩家数据
      if (saveData.player) {
        player.name = saveData.player.name || '玩家';
        player.money = saveData.player.money || 5000;
        player.debt = saveData.player.debt || 2000;
        player.capacity = saveData.player.capacity || 100;
        player.inventoryUsed = saveData.player.inventoryUsed || 0;
        player.inventory = Array.isArray(saveData.player.inventory)
          ? saveData.player.inventory
          : [];
        player.purchasedHouses = Array.isArray(saveData.player.purchasedHouses)
          ? saveData.player.purchasedHouses
          : [];
        player.statistics = saveData.player.statistics || {
          weekCount: saveData.gameCore.currentWeek || 1,
          transactionCount: 0,
          totalProfit: 0,
          maxMoney: player.money,
          visitedLocations: [],
          housePurchases: [],
          firstHousePurchaseWeek: null
        };
      }

      // 加载市场数据
      if (saveData.market) {
        market.locations = Array.isArray(saveData.market.locations)
          ? saveData.market.locations
          : [];
        market.productPrices = saveData.market.productPrices || {};

        // 如果有当前地点信息，设置当前地点
        if (saveData.market.currentLocation && market.locations.length > 0) {
          market.currentLocation = market.locations.find(
            location => location.id === saveData.market.currentLocation
          ) || market.locations[0];
        } else if (market.locations.length > 0) {
          market.currentLocation = market.locations[0];
        }

        // 加载产品和房屋数据
        market.loadProducts(saveData.market.products || []);
        market.loadHouses(saveData.market.houses || []);
        market.marketModifiers = saveData.market.marketModifiers || {};
      }

      // 加载事件数据
      if (saveData.event) {
        event.activeEvent = saveData.event.activeEvent || null;
        event.forceLocationChange = Boolean(saveData.event.forceLocationChange);
        event.targetLocation = saveData.event.targetLocation || null;
        event.nextEventId = saveData.event.nextEventId || null;
        event.triggeredEvents = Array.isArray(saveData.event.triggeredEvents)
          ? saveData.event.triggeredEvents
          : [];
      }
    },

    /**
     * 删除存档
     * @param {string} saveId - 存档ID
     * @param {boolean} [silent=false] - 是否静默删除（不显示提示）
     * @returns {Promise<boolean>} 是否删除成功
     */
    async deleteSave(saveId, silent = false) {
      return withErrorHandling(async () => {
        // 查找存档信息
        const saveIndex = this.saveList.findIndex(save => save.id === saveId);

        try {
          await storageService.removeData(`${SAVE_PREFIX}${saveId}`);

          // 更新存档列表
          if (saveIndex !== -1) {
            this.saveList.splice(saveIndex, 1);
          }

          // 保存更新后的存档列表
          await storageService.setData(SAVE_LIST_KEY, this.saveList);

          if (!silent) {
            // 显示删除成功提示
            const uiStore = useUiStore();
            uiStore.showToast({
              type: 'success',
              message: '存档已删除',
              duration: 2000
            });
          }

          return true;
        } catch (error) {
          handleError(error, 'saveSystem (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
          console.error('删除存档失败', error);

          if (!silent) {
            // 显示删除失败提示
            const uiStore = useUiStore();
            uiStore.showToast({
              type: 'error',
              message: '删除存档失败: ' + error.message,
              duration: 5000
            });
          }

          return false;
        }
      }, 'deleteSave', ErrorType.STORAGE, ErrorSeverity.WARNING);
    },

    /**
     * 清理过期的自动存档
     * 保留最新的MAX_AUTO_SAVES个自动存档
     */
    async cleanupOldAutoSaves() {
      // 获取所有自动存档
      const autoSaves = this.saveList.filter(save => save.isAuto);

      // 如果自动存档数量超过限制，删除最旧的
      if (autoSaves.length > MAX_AUTO_SAVES) {
        // 按日期排序
        autoSaves.sort((a, b) => b.timestamp - a.timestamp);

        // 删除多余的自动存档
        for (let i = MAX_AUTO_SAVES; i < autoSaves.length; i++) {
          await this.deleteSave(autoSaves[i].id, true);
        }
      }
    },

    /**
     * 检查是否需要自动保存
     * @param {number} currentWeek - 当前周数
     */
    async checkAutoSave(currentWeek) {
      if (!this.autoSaveEnabled) return;

      const gameCore = useGameCoreStore();

      // 如果游戏未开始或已结束，不自动保存
      if (!gameCore.gameStarted || gameCore.gameOver) return;

      // 每AUTO_SAVE_INTERVAL周自动保存一次
      if (currentWeek > this.lastAutoSaveWeek && currentWeek % AUTO_SAVE_INTERVAL === 0) {
        await this.autoSave();
      }
    },

    /**
     * 执行自动保存
     */
    async autoSave() {
      const gameCore = useGameCoreStore();
      const player = usePlayerStore();

      const saveName = `自动存档 (第${gameCore.currentWeek}周)`;
      await this.saveGame(saveName, true);

      console.log(`自动存档完成: ${saveName}`);
    },

    /**
     * 触发重要操作后的自动保存
     * @param {string} actionType - 操作类型
     */
    async triggerImportantActionAutoSave(actionType) {
      if (!this.autoSaveEnabled) return;

      const gameCore = useGameCoreStore();

      // 如果游戏未开始或已结束，不自动保存
      if (!gameCore.gameStarted || gameCore.gameOver) return;

      let saveName = '';

      switch (actionType) {
        case 'house_purchase':
          saveName = `购房存档 (第${gameCore.currentWeek}周)`;
          break;
        case 'major_transaction':
          saveName = `大额交易存档 (第${gameCore.currentWeek}周)`;
          break;
        case 'event_completed':
          saveName = `事件完成存档 (第${gameCore.currentWeek}周)`;
          break;
        case 'debt_repaid':
          saveName = `还清债务存档 (第${gameCore.currentWeek}周)`;
          break;
        default:
          saveName = `重要操作存档 (第${gameCore.currentWeek}周)`;
      }

      await this.saveGame(saveName, true);

      console.log(`重要操作自动存档完成: ${saveName}`);
    }
  },

  getters: {
    /**
     * 获取自动存档列表
     */
    autoSaves(state) {
      return state.saveList.filter(save => save.isAuto)
        .sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * 获取手动存档列表
     */
    manualSaves(state) {
      return state.saveList.filter(save => !save.isAuto)
        .sort((a, b) => b.timestamp - a.timestamp);
    },

    /**
     * 获取最新存档
     */
    latestSave(state) {
      if (state.saveList.length === 0) return null;

      return state.saveList.sort((a, b) => b.timestamp - a.timestamp)[0];
    }
  }
});
