/**
 * 存储服务
 * 提供数据持久化功能
 */
import { storageError } from '@/infrastructure/utils/errorTypes';
import { handleError, ErrorType, ErrorSeverity } from '../utils/errorHandler';

/**
 * 存档验证与修复工具
 * 提供验证、修复和升级存档数据的功能
 */

/**
 * 验证存档结构完整性
 * @param {Object} saveData 存档数据
 * @returns {Object} 验证结果 {isValid, issues}
 */
export function validateSaveData(saveData) {
  const issues = [];

  // 基本有效性检查
  if (!saveData || typeof saveData !== 'object') {
    return { isValid: false, issues: ['存档数据无效或已损坏'] };
  }

  // 检查版本
  if (!saveData.version) {
    issues.push('缺少版本信息');
  }

  // 检查基本结构
  const requiredSections = ['gameCore', 'player', 'market', 'event'];
  for (const section of requiredSections) {
    if (!saveData[section]) {
      issues.push(`缺少${section}部分`);
    }
  }

  // 检查游戏核心数据
  if (saveData.gameCore) {
    if (typeof saveData.gameCore.currentWeek !== 'number') {
      issues.push('游戏周数无效');
    }
    if (typeof saveData.gameCore.maxWeeks !== 'number') {
      issues.push('最大周数无效');
    }
    if (saveData.gameCore.currentWeek > saveData.gameCore.maxWeeks) {
      issues.push('游戏周数超过最大周数');
    }
  }

  // 检查玩家数据
  if (saveData.player) {
    if (typeof saveData.player.name !== 'string') {
      issues.push('玩家名称无效');
    }
    if (typeof saveData.player.money !== 'number') {
      issues.push('玩家金钱无效');
    }
    if (saveData.player.money < 0) {
      issues.push('玩家金钱为负数');
    }
    if (!Array.isArray(saveData.player.inventory)) {
      issues.push('库存数据无效');
    }
    if (!Array.isArray(saveData.player.purchasedHouses)) {
      issues.push('房产数据无效');
    }

    // 检查玩家统计数据
    if (!saveData.player.statistics || typeof saveData.player.statistics !== 'object') {
      issues.push('玩家统计数据无效');
    } else {
      // 检查统计数据的完整性
      const requiredStats = ['weekCount', 'transactionCount', 'totalProfit', 'maxMoney'];
      for (const stat of requiredStats) {
        if (typeof saveData.player.statistics[stat] !== 'number') {
          issues.push(`统计数据 ${stat} 无效或缺失`);
        }
      }
    }
  }

  // 检查市场数据
  if (saveData.market) {
    if (!Array.isArray(saveData.market.locations)) {
      issues.push('地点数据无效');
    }
    if (!saveData.market.productPrices || typeof saveData.market.productPrices !== 'object') {
      issues.push('价格数据无效');
    }

    // 检查产品数据完整性
    if (Array.isArray(saveData.market.products)) {
      const hasDuplicateProducts = saveData.market.products.length !==
        new Set(saveData.market.products).size;

      if (hasDuplicateProducts) {
        issues.push('产品数据包含重复项');
      }
    }
  }

  // 检查事件数据
  if (saveData.event) {
    if (saveData.event.activeEvent && typeof saveData.event.activeEvent !== 'object') {
      issues.push('活动事件数据无效');
    }

    if (!Array.isArray(saveData.event.triggeredEvents)) {
      issues.push('触发事件记录无效');
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * 尝试修复存档数据
 * @param {Object} saveData 可能损坏的存档数据
 * @param {Object} template 模板数据（可选，用于填充缺失部分）
 * @returns {Object} 修复后的存档数据
 */
export function repairSaveData(saveData, template = null) {
  // 如果saveData完全损坏，使用空对象
  const repairedData = saveData || {};
  let repairLog = [];

  // 使用默认模板如果没有提供
  if (!template) {
    template = createDefaultTemplate();
    repairLog.push('使用默认模板数据');
  }

  // 确保基本结构存在
      repairedData.version = repairedData.version || __APP_VERSION__;
  repairedData.timestamp = repairedData.timestamp || new Date().toISOString();
  repairLog.push(`设置版本为: ${repairedData.version}`);

  // 确保各部分存在
  repairedData.gameCore = repairedData.gameCore || {};
  repairedData.player = repairedData.player || {};
  repairedData.market = repairedData.market || {};
  repairedData.event = repairedData.event || {};

  // 修复游戏核心数据
  repairedData.gameCore.currentWeek = ensureNumber(repairedData.gameCore.currentWeek, 1);
  repairedData.gameCore.maxWeeks = ensureNumber(repairedData.gameCore.maxWeeks, 52);
  repairedData.gameCore.gameStarted = ensureBoolean(repairedData.gameCore.gameStarted, true);
  repairedData.gameCore.gamePaused = ensureBoolean(repairedData.gameCore.gamePaused, false);
  repairedData.gameCore.gameOver = ensureBoolean(repairedData.gameCore.gameOver, false);
  repairedData.gameCore.notifications = Array.isArray(repairedData.gameCore.notifications)
    ? repairedData.gameCore.notifications
    : [];
  repairedData.gameCore.gameGoals = repairedData.gameCore.gameGoals || {
    requiredNetWorth: 400000,
    targetWeeks: 30,
    debtRatio: 0.4
  };

  if (repairedData.gameCore.currentWeek > repairedData.gameCore.maxWeeks) {
    repairedData.gameCore.currentWeek = repairedData.gameCore.maxWeeks;
    repairLog.push('修复: 调整当前周数不超过最大周数');
  }

  // 修复玩家数据
  repairedData.player.name = repairedData.player.name || '玩家';
  repairedData.player.money = ensureNumber(repairedData.player.money, 5000);
  if (repairedData.player.money < 0) {
    repairedData.player.money = 0;
    repairLog.push('修复: 重置负数金钱为0');
  }
  repairedData.player.debt = ensureNumber(repairedData.player.debt, 2000);
  repairedData.player.capacity = ensureNumber(repairedData.player.capacity, 100);
  repairedData.player.inventoryUsed = ensureNumber(repairedData.player.inventoryUsed, 0);
  repairedData.player.inventory = Array.isArray(repairedData.player.inventory)
    ? repairedData.player.inventory
    : [];
  repairedData.player.purchasedHouses = Array.isArray(repairedData.player.purchasedHouses)
    ? repairedData.player.purchasedHouses
    : [];

  // 确保库存使用量与实际库存一致
  const calculatedInventoryUsed = repairedData.player.inventory.reduce(
    (total, item) => total + (item.quantity || 0), 0
  );

  if (repairedData.player.inventoryUsed !== calculatedInventoryUsed) {
    repairedData.player.inventoryUsed = calculatedInventoryUsed;
    repairLog.push('修复: 调整库存使用量以匹配实际库存');
  }

  // 确保玩家统计数据存在
  repairedData.player.statistics = repairedData.player.statistics || {};
  repairedData.player.statistics.weekCount = ensureNumber(
    repairedData.player.statistics.weekCount,
    repairedData.gameCore.currentWeek
  );
  repairedData.player.statistics.transactionCount = ensureNumber(
    repairedData.player.statistics.transactionCount, 0
  );
  repairedData.player.statistics.totalProfit = ensureNumber(
    repairedData.player.statistics.totalProfit, 0
  );
  repairedData.player.statistics.maxMoney = ensureNumber(
    repairedData.player.statistics.maxMoney,
    Math.max(repairedData.player.money, 5000)
  );

  // 如果有房产但没有购房记录，修复购房记录
  if (repairedData.player.purchasedHouses.length > 0 &&
      (!repairedData.player.statistics.housePurchases ||
        repairedData.player.statistics.housePurchases.length === 0)) {

    repairedData.player.statistics.housePurchases =
      repairedData.player.purchasedHouses.map(house => ({
        houseId: house.houseId,
        name: house.name || `${house.level}级房产`,
        level: house.level || 1,
        price: house.purchasePrice,
        week: house.purchaseWeek || repairedData.gameCore.currentWeek
      }));

    repairLog.push('修复: 重建房屋购买记录');
  } else if (!repairedData.player.statistics.housePurchases) {
    repairedData.player.statistics.housePurchases = [];
  }

  // 确保firstHousePurchaseWeek存在
  if (repairedData.player.purchasedHouses.length > 0 &&
      repairedData.player.statistics.firstHousePurchaseWeek === null) {

    // 找出最早购买的房屋
    const firstHouse = [...repairedData.player.purchasedHouses].sort(
      (a, b) => (a.purchaseWeek || Infinity) - (b.purchaseWeek || Infinity)
    )[0];

    repairedData.player.statistics.firstHousePurchaseWeek =
      firstHouse.purchaseWeek || Math.max(1, repairedData.gameCore.currentWeek - 1);

    repairLog.push('修复: 设置首次购房周数');
  }

  // 修复市场数据
  if (!Array.isArray(repairedData.market.locations) || repairedData.market.locations.length === 0) {
    // 如果有模板数据，使用模板的地点数据
    repairedData.market.locations = template.market && Array.isArray(template.market.locations)
      ? [...template.market.locations]
      : [];

    if (repairedData.market.locations.length > 0) {
      repairLog.push('修复: 从模板恢复地点数据');
    }
  }

  repairedData.market.productPrices = repairedData.market.productPrices || {};

  // 确保价格数据有效
  if (template && template.market && template.market.productPrices) {
    let pricesFixed = 0;

    for (const key in template.market.productPrices) {
      if (!repairedData.market.productPrices[key]) {
        // 如果缺少某产品的价格数据，从模板复制
        repairedData.market.productPrices[key] = template.market.productPrices[key];
        pricesFixed++;
      }
    }

    if (pricesFixed > 0) {
      repairLog.push(`修复: 从模板恢复${pricesFixed}个产品价格数据`);
    }
  }

  // 修复事件数据
  if (!Array.isArray(repairedData.event.triggeredEvents)) {
    repairedData.event.triggeredEvents = [];
    repairLog.push('修复: 初始化触发事件记录');
  }

  console.log('存档修复日志:', repairLog);

  return {
    data: repairedData,
    repairLog
  };
}

/**
 * 创建默认模板数据
 * 用于修复严重损坏的存档
 */
function createDefaultTemplate() {
  return {
    version: '0.1.0',
    gameCore: {
      currentWeek: 1,
      maxWeeks: 52,
      gameStarted: true,
      gamePaused: false,
      gameOver: false
    },
    player: {
      name: '玩家',
      money: 5000,
      debt: 2000,
      capacity: 100,
      inventory: [],
      purchasedHouses: []
    },
    market: {
      locations: [
        { id: 'location1', name: '市中心', specialProducts: ['product1', 'product2'] },
        { id: 'location2', name: '郊区', specialProducts: ['product3', 'product4'] },
        { id: 'location3', name: '商业区', specialProducts: ['product5', 'product6'] },
        { id: 'location4', name: '住宅区', specialProducts: ['product7', 'product8'] },
        { id: 'location5', name: '工业区', specialProducts: ['product9', 'product10'] }
      ],
      productPrices: {}
    },
    event: {
      activeEvent: null,
      triggeredEvents: []
    }
  };
}

/**
 * 确保值为有效的数字
 * @param {any} value 检查的值
 * @param {number} defaultValue 默认值
 * @returns {number} 有效的数字
 */
function ensureNumber(value, defaultValue) {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 确保值为有效的布尔值
 * @param {any} value 检查的值
 * @param {boolean} defaultValue 默认值
 * @returns {boolean} 有效的布尔值
 */
function ensureBoolean(value, defaultValue) {
  if (typeof value === 'boolean') return value;
  return defaultValue;
}

/**
 * 确保存档数据版本兼容性
 * @param {Object} saveData - 存档数据
 * @param {string} currentVersion - 当前游戏版本
 * @returns {Object} 修复后的存档数据
 */
export function ensureVersionCompatibility(saveData, currentVersion = __APP_VERSION__) {
  if (!saveData) return null;

  // 为旧版本没有版本号的存档添加版本号
  if (!saveData.version) {
    saveData.version = '0.1.0'; // 假设旧版本是0.1.0
  }

  // 如果版本一致，无需修复
  if (saveData.version === currentVersion) {
    return saveData;
  }

  // 不同版本间的兼容性处理
  let repairedData = { ...saveData };

  // 版本0.1.0+ -> 当前版本的兼容处理
  if (['0.1.0', '0.1.1', '0.1.2', '0.1.3'].includes(saveData.version) && currentVersion === __APP_VERSION__) {
    // 添加可能在新版本中新增的字段，默认值等
    if (!repairedData.gameState) repairedData.gameState = {};
    // 其他兼容性处理...
  }

  // 更新版本号
  repairedData.version = currentVersion;
  return repairedData;
}

/**
 * 比较两个版本号
 * @param {string} a 版本A
 * @param {string} b 版本B
 * @returns {number} 比较结果: -1(A<B), 0(A=B), 1(A>B)
 */
function compareVersions(a, b) {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const valueA = i < partsA.length ? partsA[i] : 0;
    const valueB = i < partsB.length ? partsB[i] : 0;

    if (valueA > valueB) return 1;
    if (valueA < valueB) return -1;
  }

  return 0;
}

/**
 * 存储服务基类
 * 定义存储服务的通用接口
 */
export class StorageService {
  /**
   * 获取数据
   * @param {string} key 存储键
   * @returns {Promise<any>} 存储的数据
   */
  async getData(key) {
    throw new Error('StorageService.getData must be implemented by subclass');
  }

  /**
   * 设置数据
   * @param {string} key 存储键
   * @param {any} data 要存储的数据
   * @returns {Promise<boolean>} 操作是否成功
   */
  async setData(key, data) {
    throw new Error('StorageService.setData must be implemented by subclass');
  }

  /**
   * 删除数据
   * @param {string} key 存储键
   * @returns {Promise<boolean>} 操作是否成功
   */
  async removeData(key) {
    throw new Error('StorageService.removeData must be implemented by subclass');
  }

  /**
   * 清除所有数据
   * @returns {Promise<boolean>} 操作是否成功
   */
  async clearAll() {
    throw new Error('StorageService.clearAll must be implemented by subclass');
  }
}

/**
 * 本地存储服务
 * 使用localStorage实现数据持久化
 */
export class LocalStorageService extends StorageService {
  /**
   * 构造函数
   * @param {string} prefix 存储键前缀
   */
  constructor(prefix = 'game_') {
    super();
    this.prefix = prefix;
  }

  /**
   * 获取完整存储键
   * @param {string} key 原始键
   * @returns {string} 添加前缀后的完整键
   */
  getFullKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * 获取数据
   * @param {string} key 存储键
   * @returns {Promise<any>} 存储的数据
   */
  async getData(key) {
    try {
      const fullKey = this.getFullKey(key);
      const data = localStorage.getItem(fullKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      handleError(error, 'storageService (persistence)', ErrorType.STORAGE, ErrorSeverity.ERROR);
      throw storageError(`Failed to get data for key ${key}`, { originalError: error.message });
    }
  }

  /**
   * 安全序列化数据
   * @param {any} data - 要序列化的数据
   * @returns {string} - JSON字符串
   * @private
   */
  _safeStringify(data) {
    try {
      // 尝试常规序列化
      return JSON.stringify(data);
    } catch (error) {
      console.warn('标准序列化失败，尝试手动序列化');

      // 创建一个安全的可序列化版本
      if (data === null || data === undefined) {
        return JSON.stringify(null);
      }

      // 处理基本类型
      if (typeof data !== 'object') {
        return JSON.stringify(data);
      }

      // 处理数组
      if (Array.isArray(data)) {
        const safeArray = [];
        for (let i = 0; i < data.length; i++) {
          try {
            const item = data[i];
            if (typeof item === 'object' && item !== null) {
              safeArray.push(JSON.parse(this._safeStringify(item)));
            } else {
              safeArray.push(item);
            }
          } catch (e) {
            safeArray.push(null);
          }
        }
        return JSON.stringify(safeArray);
      }

      // 处理对象
      const safeObj = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          try {
            const value = data[key];
            if (typeof value === 'object' && value !== null) {
              safeObj[key] = JSON.parse(this._safeStringify(value));
            } else if (typeof value === 'function') {
              safeObj[key] = '[函数]';
            } else {
              safeObj[key] = value;
            }
          } catch (e) {
            console.warn(`无法序列化属性 ${key}`);
            safeObj[key] = null;
          }
        }
      }

      return JSON.stringify(safeObj);
    }
  }

  /**
   * 设置数据
   * @param {string} key 存储键
   * @param {any} data 要存储的数据
   * @returns {Promise<boolean>} 操作是否成功
   */
  async setData(key, data) {
    try {
      console.log(`LocalStorage: 保存数据到 ${key}`);
      const fullKey = this.getFullKey(key);

      // 使用安全序列化
      let serializedData;
      try {
        serializedData = this._safeStringify(data);
      } catch (serializeError) {
        console.warn('序列化失败，使用基本数据', serializeError);
        // 如果序列化失败，保存一个基本对象
        serializedData = JSON.stringify({
          _simplified: true,
          timestamp: new Date().toISOString(),
          key
        });
      }

      localStorage.setItem(fullKey, serializedData);
      return true;
    } catch (error) {
      handleError(error, 'storageService (persistence)', ErrorType.STORAGE, ErrorSeverity.ERROR);
      console.error(`保存数据到本地存储失败: ${key}`, error);
      // 不抛出错误，而是返回失败状态
      return false;
    }
  }

  /**
   * 删除数据
   * @param {string} key 存储键
   * @returns {Promise<boolean>} 操作是否成功
   */
  async removeData(key) {
    try {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      handleError(error, 'storageService (persistence)', ErrorType.STORAGE, ErrorSeverity.ERROR);
      throw storageError(`Failed to remove data for key ${key}`, { originalError: error.message });
    }
  }

  /**
   * 清除所有数据
   * @returns {Promise<boolean>} 操作是否成功
   */
  async clearAll() {
    try {
      // 只清除带有前缀的项
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      handleError(error, 'storageService (persistence)', ErrorType.STORAGE, ErrorSeverity.ERROR);
      throw storageError('Failed to clear all data', { originalError: error.message });
    }
  }
}

/**
 * Electron存储服务
 * 使用Electron API进行数据持久化
 */
export class ElectronStorageService extends StorageService {
  /**
   * 构造函数
   * @param {string} prefix 键前缀
   */
  constructor(prefix = 'game_') {
    super();
    this.prefix = prefix;
    this.isInitialized = false;
    this.fallbackStorage = new LocalStorageService();
    // 检查Electron API是否可用
    this.initializeElectronAPI();
  }

  /**
   * 初始化Electron API
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async initializeElectronAPI() {
    try {
      if (window.electronAPI && window.electronAPI.getConfig) {
        await window.electronAPI.getConfig();
        this.isInitialized = true;
        console.log('ElectronStorageService初始化成功');
      } else {
        console.warn('Electron API不可用，将使用LocalStorage作为备用');
      }
    } catch (error) {
      handleError(error, 'storageService (persistence)', ErrorType.STORAGE, ErrorSeverity.ERROR);
      console.error('初始化ElectronStorageService失败:', error);
    }

    return this.isInitialized;
  }

  /**
   * 获取数据
   * @param {string} key 存储键
   * @returns {Promise<any>} 存储的数据
   */
  async getData(key) {
    try {
      if (!this.isInitialized) {
        return await this.fallbackStorage.getData(key);
      }

      if (!window.electronAPI || !window.electronAPI.getConfig) {
        throw new Error('Electron API不可用');
      }

      const fullKey = this.prefix + key;
      const config = await window.electronAPI.getConfig();

      if (config && config[fullKey] !== undefined) {
        return config[fullKey];
      }

      return null;
    } catch (error) {
      handleError(error, 'storageService (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error(`获取数据失败 [${key}]:`, error);
      return await this.fallbackStorage.getData(key);
    }
  }

  /**
   * 安全序列化数据，处理循环引用和特殊对象
   * @param {any} data - 要序列化的数据
   * @returns {any} - 可安全序列化的数据
   * @private
   */
  _safeSerialize(data) {
    try {
      console.log('尝试安全序列化数据');
      // 尝试使用JSON序列化和反序列化来创建一个纯数据对象，移除所有函数和循环引用
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.warn('标准JSON序列化失败，尝试手动序列化', error);

      // 如果JSON序列化失败，进行手动序列化
      if (data === null || data === undefined) {
        return data;
      }

      // 处理基本类型
      if (typeof data !== 'object') {
        return data;
      }

      // 处理数组
      if (Array.isArray(data)) {
        return data.map(item => this._safeSerialize(item));
      }

      // 处理普通对象
      const result = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          try {
            result[key] = this._safeSerialize(data[key]);
          } catch (e) {
            console.warn(`无法序列化属性 ${key}:`, e);
            // 对于无法序列化的属性，设置为null或基本类型表示
            if (typeof data[key] === 'function') {
              result[key] = '[函数]';
            } else if (typeof data[key] === 'object') {
              result[key] = '[复杂对象]';
            } else {
              result[key] = null;
            }
          }
        }
      }
      return result;
    }
  }

  /**
   * 设置数据
   * @param {string} key 存储键
   * @param {any} data 数据
   * @returns {Promise<boolean>} 操作是否成功
   */
  async setData(key, data) {
    try {
      console.log(`正在保存数据 [${key}]...`);

      // 首先尝试备用存储，以防主存储失败
      const fallbackSuccess = await this.fallbackStorage.setData(key, data);
      console.log(`备用存储保存${fallbackSuccess ? '成功' : '失败'}`);

      if (!this.isInitialized) {
        console.log('ElectronAPI未初始化，仅使用备用存储');
        return fallbackSuccess;
      }

      if (!window.electronAPI || !window.electronAPI.setConfig) {
        throw new Error('Electron API不可用');
      }

      // 安全序列化数据，处理潜在的循环引用
      const safeData = this._safeSerialize(data);
      console.log('数据已安全序列化');

      const fullKey = this.prefix + key;
      const config = { [fullKey]: safeData };

      await window.electronAPI.setConfig(config);
      console.log(`数据成功保存到 [${key}]`);
      return true;
    } catch (error) {
      handleError(error, 'storageService (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error(`设置数据失败 [${key}]:`, error);

      // 尝试直接使用文件系统API保存游戏数据
      if (key.includes('Save_') && window.electronAPI && window.electronAPI.saveGame) {
        try {
          console.log('尝试使用saveGame API保存...');
          const saveName = key.replace(this.prefix, '').replace('Save_', '');

          const result = await window.electronAPI.saveGame({
            name: saveName,
            gameState: data
          });

          if (result && result.success) {
            console.log('使用saveGame API保存成功');
            return true;
          }
        } catch (saveGameError) {
          console.error('saveGame API保存失败', saveGameError);
        }
      }

      // 尝试使用备用存储
      return await this.fallbackStorage.setData(key, data);
    }
  }

  /**
   * 删除数据
   * @param {string} key 存储键
   * @returns {Promise<boolean>} 操作是否成功
   */
  async removeData(key) {
    try {
      if (!this.isInitialized) {
        return await this.fallbackStorage.removeData(key);
      }

      if (!window.electronAPI || !window.electronAPI.setConfig) {
        throw new Error('Electron API不可用');
      }

      const fullKey = this.prefix + key;
      const config = { [fullKey]: undefined };

      await window.electronAPI.setConfig(config);
      return true;
    } catch (error) {
      handleError(error, 'storageService (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error(`删除数据失败 [${key}]:`, error);
      return await this.fallbackStorage.removeData(key);
    }
  }

  /**
   * 清除所有数据
   * @returns {Promise<boolean>} 操作是否成功
   */
  async clearAll() {
    try {
      if (!this.isInitialized) {
        return await this.fallbackStorage.clearAll();
      }

      if (!window.electronAPI || !window.electronAPI.clearConfig) {
        throw new Error('Electron API不可用');
      }

      // 只清除带有前缀的配置项
      const config = await window.electronAPI.getConfig();
      const keysToRemove = Object.keys(config).filter(key => key.startsWith(this.prefix));

      if (keysToRemove.length === 0) {
        return true;
      }

      // 创建要清除的配置对象
      const clearConfig = {};
      keysToRemove.forEach(key => {
        clearConfig[key] = undefined;
      });

      await window.electronAPI.setConfig(clearConfig);
      return true;
    } catch (error) {
      handleError(error, 'storageService (persistence)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error('清除所有数据失败:', error);
      return await this.fallbackStorage.clearAll();
    }
  }
}

// 创建默认存储服务实例
const storageService = new ElectronStorageService();

export default storageService;
