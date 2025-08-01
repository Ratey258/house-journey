/**
 * 存储服务 - TypeScript版本
 * 提供数据持久化功能
 */
import { storageError } from '@/infrastructure/utils/errorTypes';
import { handleError, ErrorType, ErrorSeverity } from '../utils/errorHandler';

// ==================== 类型定义 ====================

/**
 * 存档验证结果接口
 */
export interface SaveDataValidationResult {
  isValid: boolean;
  issues: string[];
}

/**
 * 游戏核心数据接口
 */
export interface GameCoreData {
  currentWeek: number;
  maxWeeks: number;
  gameStarted: boolean;
  gamePaused: boolean;
  gameOver: boolean;
  [key: string]: any;
}

/**
 * 玩家统计数据接口
 */
export interface PlayerStatistics {
  weekCount: number;
  transactionCount: number;
  totalProfit: number;
  maxMoney: number;
  [key: string]: any;
}

/**
 * 玩家数据接口
 */
export interface PlayerData {
  name: string;
  money: number;
  debt: number;
  capacity: number;
  inventory: any[];
  purchasedHouses: any[];
  statistics: PlayerStatistics;
  [key: string]: any;
}

/**
 * 地点数据接口
 */
export interface LocationData {
  id: string;
  name: string;
  specialProducts: string[];
  [key: string]: any;
}

/**
 * 市场数据接口
 */
export interface MarketData {
  locations: LocationData[];
  productPrices: Record<string, any>;
  products?: any[];
  [key: string]: any;
}

/**
 * 事件数据接口
 */
export interface EventData {
  activeEvent: any;
  triggeredEvents: string[];
  [key: string]: any;
}

/**
 * 存档数据接口
 */
export interface SaveData {
  version?: string;
  timestamp?: string;
  gameCore: GameCoreData;
  player: PlayerData;
  market: MarketData;
  event: EventData;
  [key: string]: any;
}

/**
 * 存储接口
 */
export interface StorageInterface {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<boolean>;
  remove(key: string): Promise<boolean>;
  getAllKeys(): Promise<string[]>;
  clearAll(): Promise<boolean>;
}

// ==================== 全局变量 ====================

declare const __APP_VERSION__: string;

// ==================== 存档验证与修复工具 ====================

/**
 * 验证存档结构完整性
 * @param saveData 存档数据
 * @returns 验证结果 {isValid, issues}
 */
export function validateSaveData(saveData: any): SaveDataValidationResult {
  const issues: string[] = [];

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
 * @param saveData 可能损坏的存档数据
 * @param template 模板数据（可选，用于填充缺失部分）
 * @returns 修复后的存档数据
 */
export function repairSaveData(saveData: any, template: SaveData | null = null): SaveData {
  // 如果saveData完全损坏，使用空对象
  const repairedData: any = saveData || {};
  let repairLog: string[] = [];

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

  // 修复玩家数据
  repairedData.player.name = repairedData.player.name || template.player.name;
  repairedData.player.money = ensureNumber(repairedData.player.money, template.player.money);
  repairedData.player.debt = ensureNumber(repairedData.player.debt, template.player.debt);
  repairedData.player.capacity = ensureNumber(repairedData.player.capacity, template.player.capacity);
  repairedData.player.inventory = Array.isArray(repairedData.player.inventory)
    ? repairedData.player.inventory
    : [...template.player.inventory];
  repairedData.player.purchasedHouses = Array.isArray(repairedData.player.purchasedHouses)
    ? repairedData.player.purchasedHouses
    : [...template.player.purchasedHouses];

  // 修复玩家统计数据
  if (!repairedData.player.statistics || typeof repairedData.player.statistics !== 'object') {
    repairedData.player.statistics = {
      weekCount: 0,
      transactionCount: 0,
      totalProfit: 0,
      maxMoney: repairedData.player.money
    };
    repairLog.push('重建玩家统计数据');
  }

  // 修复市场数据
  repairedData.market.locations = Array.isArray(repairedData.market.locations)
    ? repairedData.market.locations
    : [...template.market.locations];
  repairedData.market.productPrices = repairedData.market.productPrices || template.market.productPrices;

  // 修复事件数据
  repairedData.event.activeEvent = repairedData.event.activeEvent || template.event.activeEvent;
  repairedData.event.triggeredEvents = Array.isArray(repairedData.event.triggeredEvents)
    ? repairedData.event.triggeredEvents
    : [...template.event.triggeredEvents];

  console.log('存档修复完成:', repairLog);
  return repairedData as SaveData;
}

/**
 * 创建默认模板数据
 * @returns 默认模板数据
 */
function createDefaultTemplate(): SaveData {
  return {
    version: __APP_VERSION__,
    timestamp: new Date().toISOString(),
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
      purchasedHouses: [],
      statistics: {
        weekCount: 0,
        transactionCount: 0,
        totalProfit: 0,
        maxMoney: 5000
      }
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
 * @param value 检查的值
 * @param defaultValue 默认值
 * @returns 有效的数字
 */
function ensureNumber(value: any, defaultValue: number): number {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * 确保值为有效的布尔值
 * @param value 检查的值
 * @param defaultValue 默认值
 * @returns 有效的布尔值
 */
function ensureBoolean(value: any, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value;
  return defaultValue;
}

/**
 * 确保存档数据版本兼容性
 * @param saveData 存档数据
 * @param currentVersion 当前游戏版本
 * @returns 修复后的存档数据
 */
export function ensureVersionCompatibility(saveData: any, currentVersion: string = __APP_VERSION__): SaveData | null {
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
  return repairedData as SaveData;
}

/**
 * 比较两个版本号
 * @param a 版本A
 * @param b 版本B
 * @returns 比较结果: -1(A<B), 0(A=B), 1(A>B)
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const valueA = i < partsA.length ? partsA[i] : 0;
    const valueB = i < partsB.length ? partsB[i] : 0;

    if (valueA < valueB) return -1;
    if (valueA > valueB) return 1;
  }

  return 0;
}

// ==================== Electron存储服务类 ====================

export class ElectronStorageService implements StorageInterface {
  private prefix: string;
  private fallbackStorage: FallbackStorage;

  constructor(prefix: string = 'houseJourney_') {
    this.prefix = prefix;
    this.fallbackStorage = new FallbackStorage(prefix);
  }

  /**
   * 获取数据
   * @param key 存储键
   * @returns 存储的数据
   */
  async get(key: string): Promise<any> {
    try {
      const fullKey = this.prefix + key;

      // 检查是否在Electron环境中
      if (typeof window !== 'undefined' && window.electronAPI) {
        const config = await window.electronAPI.getConfig();
        const data = config[fullKey];

        if (data !== undefined) {
          return typeof data === 'string' ? JSON.parse(data) : data;
        }
        return null;
      }

      // 回退到localStorage
      return await this.fallbackStorage.get(key);
    } catch (error) {
      handleError(error, 'storageService (get)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error('获取数据失败:', error);
      return await this.fallbackStorage.get(key);
    }
  }

  /**
   * 设置数据
   * @param key 存储键
   * @param value 要存储的数据
   * @returns 是否成功
   */
  async set(key: string, value: any): Promise<boolean> {
    try {
      const fullKey = this.prefix + key;
      const dataToStore = typeof value === 'object' ? JSON.stringify(value) : value;

      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.setConfig({ [fullKey]: dataToStore });
        return true;
      }

      return await this.fallbackStorage.set(key, value);
    } catch (error) {
      handleError(error, 'storageService (set)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error('设置数据失败:', error);
      return await this.fallbackStorage.set(key, value);
    }
  }

  /**
   * 删除数据
   * @param key 存储键
   * @returns 是否成功
   */
  async remove(key: string): Promise<boolean> {
    try {
      const fullKey = this.prefix + key;

      if (typeof window !== 'undefined' && window.electronAPI) {
        await window.electronAPI.setConfig({ [fullKey]: undefined });
        return true;
      }

      return await this.fallbackStorage.remove(key);
    } catch (error) {
      handleError(error, 'storageService (remove)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error('删除数据失败:', error);
      return await this.fallbackStorage.remove(key);
    }
  }

  /**
   * 获取所有键
   * @returns 所有存储键列表
   */
  async getAllKeys(): Promise<string[]> {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const config = await window.electronAPI.getConfig();
        return Object.keys(config)
          .filter(key => key.startsWith(this.prefix))
          .map(key => key.substring(this.prefix.length));
      }

      return await this.fallbackStorage.getAllKeys();
    } catch (error) {
      handleError(error, 'storageService (getAllKeys)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error('获取所有键失败:', error);
      return await this.fallbackStorage.getAllKeys();
    }
  }

  /**
   * 清除所有数据
   * @returns 是否成功
   */
  async clearAll(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const config = await window.electronAPI.getConfig();
        const keysToRemove = Object.keys(config).filter(key => key.startsWith(this.prefix));

        if (keysToRemove.length === 0) {
          return true;
        }

        // 创建要清除的配置对象
        const clearConfig: Record<string, undefined> = {};
        keysToRemove.forEach(key => {
          clearConfig[key] = undefined;
        });

        await window.electronAPI.setConfig(clearConfig);
        return true;
      }

      return await this.fallbackStorage.clearAll();
    } catch (error) {
      handleError(error, 'storageService (clearAll)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      console.error('清除所有数据失败:', error);
      return await this.fallbackStorage.clearAll();
    }
  }
}

// ==================== 回退存储类 ====================

class FallbackStorage implements StorageInterface {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  async get(key: string): Promise<any> {
    try {
      const fullKey = this.prefix + key;
      const data = localStorage.getItem(fullKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('localStorage get失败:', error);
      return null;
    }
  }

  async set(key: string, value: any): Promise<boolean> {
    try {
      const fullKey = this.prefix + key;
      localStorage.setItem(fullKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('localStorage set失败:', error);
      return false;
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      const fullKey = this.prefix + key;
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('localStorage remove失败:', error);
      return false;
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key.substring(this.prefix.length));
        }
      }
      return keys;
    } catch (error) {
      console.error('localStorage getAllKeys失败:', error);
      return [];
    }
  }

  async clearAll(): Promise<boolean> {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('localStorage clearAll失败:', error);
      return false;
    }
  }
}

// ==================== 默认实例 ====================

// 创建默认存储服务实例
const storageService = new ElectronStorageService();

export default storageService;
