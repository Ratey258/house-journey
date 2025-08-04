/**
 * 游戏状态快照系统
 * 负责创建、管理和恢复游戏状态快照，用于错误恢复和紧急状态还原
 */
import { withErrorHandling } from '../utils/errorHandler';
import { ElectronStorageService } from './storageService';
import { handleError, ErrorType, ErrorSeverity } from '../utils/errorHandler';

// 存储键
const SNAPSHOT_STORAGE_KEY = 'game_state_snapshot';
const EMERGENCY_SNAPSHOT_KEY = 'game_state_emergency';

// 存储服务实例
let storageService = null;

// 内存中的快照列表
const stateSnapshots = [];

// 上次快照时间
let lastSnapshotTime = 0;

// 最小快照间隔 (毫秒)
const MIN_SNAPSHOT_INTERVAL = 60000; // 1分钟

// 最大快照数量
const MAX_SNAPSHOTS = 5;

// 存储服务初始化状态
let storageInitPromise = null;

/**
 * 初始化存储服务
 */
async function initStorageService() {
  // 如果已经有初始化过程在进行中，直接返回该Promise
  if (storageInitPromise) {
    return storageInitPromise;
  }

  // 创建新的初始化Promise
  storageInitPromise = new Promise((resolve, reject) => {
    try {
      storageService = new ElectronStorageService();
      storageService.initializeElectronAPI()
        .then(() => {
          console.log('状态快照存储服务初始化成功');
          resolve(storageService);
        })
        .catch((error) => {
          handleError(error, 'stateSnapshot (persistence)', ErrorType.STORAGE, ErrorSeverity.ERROR);
          console.error('初始化存储服务失败:', error);

          // 创建一个内存中的备用存储
          storageService = {
            async getData(key) {
              try {
                const data = localStorage.getItem(key);
                return data ? JSON.parse(data) : null;
              } catch (e) {
                console.error('从localStorage获取数据失败:', e);
                return null;
              }
            },

            async setData(key, value) {
              try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
              } catch (e) {
                handleError(e, 'stateSnapshot (persistence)', ErrorType.STORAGE, ErrorSeverity.ERROR);
                console.error('保存数据到localStorage失败:', e);
                return false;
              }
            },

            async removeData(key) {
              try {
                localStorage.removeItem(key);
                return true;
              } catch (e) {
                handleError(e, 'stateSnapshot (persistence)', ErrorType.STORAGE, ErrorSeverity.ERROR);
                console.error('从localStorage删除数据失败:', e);
                return false;
              }
            }
          };
          console.log('使用备用存储服务');
          resolve(storageService);
        });
    } catch (error) {
      handleError(error, 'stateSnapshot (persistence)', ErrorType.STORAGE, ErrorSeverity.ERROR);
      console.error('创建存储服务实例失败:', error);
      reject(error);
    }
  });

  return storageInitPromise;
}

/**
 * 创建游戏状态快照
 *
 * @param {Object} gameStore - 游戏状态存储
 * @returns {Promise<Object|null>} 创建的快照对象，如果失败则返回null
 */
export async function createStateSnapshot(gameStore) {
  // 验证gameStore是否有效
  if (!gameStore || !gameStore.currentWeek) {
    console.warn('无法创建快照：游戏存储无效');
    return null;
  }

  // 检查是否需要创建新快照 (时间间隔)
  const now = Date.now();
  if (now - lastSnapshotTime < MIN_SNAPSHOT_INTERVAL) {
    return null;
  }

  // 创建游戏状态快照
  const gameState = {
    timestamp: now,
    currentWeek: gameStore.currentWeek,
    gameStarted: gameStore.gameStarted,
    gameOver: gameStore.gameOver,
    player: gameStore.player ? {
      name: gameStore.player.name,
      money: gameStore.player.money,
      debt: gameStore.player.debt,
      inventory: Array.isArray(gameStore.player.inventory) ? [...gameStore.player.inventory] : []
    } : null,
    marketState: gameStore.currentLocation ? {
      currentLocation: gameStore.currentLocation.id,
      productPrices: { ...(gameStore.productPrices || {}) }
    } : null
  };

  // 添加到内存快照列表
  stateSnapshots.unshift(gameState);

  // 限制快照数量
  if (stateSnapshots.length > MAX_SNAPSHOTS) {
    stateSnapshots.length = MAX_SNAPSHOTS;
  }

  // 保存到存储服务
  try {
    const service = await initStorageService();
    await service.setData(SNAPSHOT_STORAGE_KEY, gameState);
    lastSnapshotTime = now;
  } catch (e) {
    handleError(e, 'stateSnapshot (persistence)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
    console.warn('保存快照到存储服务失败:', e);
  }

  return gameState;
}

/**
 * 创建紧急状态快照
 * 当检测到可能的异常情况时调用，同步创建
 *
 * @param {Object} gameStore - 游戏状态存储
 * @returns {boolean} 是否成功创建紧急快照
 */
export function createEmergencySnapshot(gameStore) {
  try {
    // 验证gameStore是否有效
    if (!gameStore || !gameStore.currentWeek) {
      return false;
    }

    // 创建精简的紧急快照
    const emergencyData = {
      timestamp: Date.now(),
      currentWeek: gameStore.currentWeek,
      playerName: gameStore.player?.name,
      playerMoney: gameStore.player?.money,
      playerDebt: gameStore.player?.debt,
      inventoryCount: gameStore.player?.inventory?.length || 0,
      currentLocation: gameStore.currentLocation?.id,
      gameStarted: gameStore.gameStarted,
      gameOver: gameStore.gameOver
    };

    // 同步保存到localStorage (更可靠，适用于紧急情况)
    localStorage.setItem(EMERGENCY_SNAPSHOT_KEY, JSON.stringify(emergencyData));

    return true;
  } catch (e) {
    handleError(e, 'stateSnapshot (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('创建紧急快照失败:', e);
    return false;
  }
}

/**
 * 获取最近的状态快照
 *
 * @returns {Object|null} 最近的状态快照，如果没有则返回null
 */
export function getLatestSnapshot() {
  return stateSnapshots[0] || null;
}

/**
 * 加载上次保存的快照
 *
 * @returns {Promise<Object|null>} 加载的快照对象，如果没有则返回null
 */
export async function loadLatestSnapshot() {
  try {
    // 优先使用内存中的快照
    if (stateSnapshots.length > 0) {
      return stateSnapshots[0];
    }

    // 尝试从存储服务读取
    try {
      const service = await initStorageService();
      const savedSnapshot = await service.getData(SNAPSHOT_STORAGE_KEY);
      if (savedSnapshot) {
        stateSnapshots.unshift(savedSnapshot);
        return savedSnapshot;
      }
    } catch (e) {
      handleError(e, 'stateSnapshot (persistence)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
      console.warn('从存储服务加载快照失败:', e);
    }

    // 尝试加载紧急快照（从localStorage）
    try {
      const emergencyData = localStorage.getItem(EMERGENCY_SNAPSHOT_KEY);
      if (emergencyData) {
        const parsedData = JSON.parse(emergencyData);
        return parsedData;
      }
    } catch (e) {
      handleError(e, 'stateSnapshot (persistence)', ErrorType.UNKNOWN, ErrorSeverity.WARNING);
      console.warn('加载紧急快照失败:', e);
    }

    return null;
  } catch (error) {
    console.error('加载最新快照时出错:', error);
    return null;
  }
}

/**
 * 应用快照恢复游戏状态
 *
 * @param {Object} gameStore - 游戏状态存储
 * @param {Object} snapshot - 快照对象
 * @returns {Promise<boolean>} 是否成功应用快照
 */
export async function applySnapshot(gameStore, snapshot) {
  try {
    if (!snapshot || !gameStore) {
      return false;
    }

    // 恢复基本游戏状态
    gameStore.currentWeek = snapshot.currentWeek || 1;
    gameStore.gameStarted = snapshot.gameStarted || false;
    gameStore.gameOver = snapshot.gameOver || false;

    // 恢复玩家状态
    if (snapshot.player) {
      if (!gameStore.player) {
        gameStore.player = {};
      }

      // 兼容Vue 3响应式系统的属性设置
      _setReactiveValue(gameStore.player, 'name', snapshot.player.name || '');
      _setReactiveValue(gameStore.player, 'money', snapshot.player.money || 0);
      _setReactiveValue(gameStore.player, 'debt', snapshot.player.debt || 0);

      // 恢复库存
      if (snapshot.player.inventory && Array.isArray(snapshot.player.inventory)) {
        gameStore.player.inventory = [...snapshot.player.inventory];
      }
    }

    // 恢复市场状态
    if (snapshot.marketState) {
      // 设置当前位置
      if (snapshot.marketState.currentLocation && gameStore.locations) {
        const location = gameStore.locations.find(
          loc => loc.id === snapshot.marketState.currentLocation
        );
        if (location) {
          gameStore.currentLocation = location;
        }
      }

      // 恢复价格
      if (snapshot.marketState.productPrices) {
        gameStore.productPrices = { ...snapshot.marketState.productPrices };
      }
    }

    return true;
  } catch (error) {
    handleError(error, 'stateSnapshot (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('应用快照时出错:', error);
    return false;
  }
}

/**
 * 清除所有快照
 *
 * @returns {Promise<boolean>} 是否成功清除所有快照
 */
export async function clearAllSnapshots() {
  try {
    // 清除内存中的快照
    stateSnapshots.length = 0;

    // 清除存储中的快照
    const service = await initStorageService();
    await service.removeData(SNAPSHOT_STORAGE_KEY);
    localStorage.removeItem(EMERGENCY_SNAPSHOT_KEY);

    return true;
  } catch (error) {
    handleError(error, 'stateSnapshot (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('清除快照时出错:', error);
    return false;
  }
}

/**
 * 初始化快照系统
 *
 * @returns {Promise<boolean>} 是否成功初始化
 */
export async function initSnapshotSystem() {
  try {
    console.log('初始化快照系统...');
    await initStorageService();
    await loadLatestSnapshot();
    console.log('快照系统初始化完成');
    return true;
  } catch (error) {
    handleError(error, 'stateSnapshot (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('初始化快照系统时出错:', error);
    return false;
  }
}

/**
 * 设置响应式值 - 兼容Vue 3的ref和reactive
 * @param {Object} target 目标对象
 * @param {string} key 属性名
 * @param {any} newValue 新值
 */
function _setReactiveValue(target, key, newValue) {
  const property = target[key];

  // 检查是否是Vue 3的ref对象
  if (property && typeof property === 'object' && 'value' in property && typeof property.value !== 'undefined') {
    property.value = newValue;
  } else {
    // 普通对象或reactive对象
    target[key] = newValue;
  }
}
