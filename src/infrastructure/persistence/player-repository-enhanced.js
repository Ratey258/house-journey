/**
 * 增强版玩家仓储实现
 * 使用标准化的仓储模式
 */
import { BaseRepository } from './base-repository';
import { IPlayerRepository } from '../../core/interfaces/repositories';
import { withErrorHandling } from '../utils/errorHandler';
import { ErrorType } from '../utils/errorTypes';

/**
 * 玩家实体
 * @typedef {Object} Player
 * @property {string} id 玩家ID
 * @property {string} name 玩家姓名
 * @property {number} money 玩家资金
 * @property {Object[]} inventory 物品库存
 * @property {Object} statistics 统计数据
 */

/**
 * 增强版玩家仓储实现
 */
export class PlayerRepositoryEnhanced extends BaseRepository {
  /**
   * 构造函数
   * @param {Object} storageService 存储服务
   */
  constructor(storageService) {
    super(storageService, 'player');

    // 玩家单例缓存
    this._currentPlayer = null;
    this._defaultPlayer = this._createDefaultPlayer();
  }

  /**
   * 获取实体ID
   * @param {Player} entity 玩家实体
   * @returns {string} 玩家ID
   * @override
   */
  getEntityId(entity) {
    return entity.id;
  }

  /**
   * 将DTO映射为实体对象
   * @param {Object} dto 数据传输对象
   * @returns {Player} 玩家实体
   * @override
   */
  mapToEntity(dto) {
    return {
      ...dto,
      // 添加任何必要的转换或验证
    };
  }

  /**
   * 将实体映射为DTO
   * @param {Player} entity 玩家实体
   * @returns {Object} 数据传输对象
   * @override
   */
  mapToDTO(entity) {
    return {
      ...entity,
      // 添加任何必要的转换或序列化
    };
  }

  /**
   * 创建默认玩家
   * @returns {Player} 默认玩家实体
   * @private
   */
  _createDefaultPlayer() {
    return {
      id: 'current-player',
      name: '玩家',
      money: 10000,
      inventory: [],
      statistics: {
        weeksPlayed: 0,
        transactionCount: 0,
        totalProfit: 0,
        highestBalance: 10000
      }
    };
  }

  /**
   * 获取当前玩家
   * @returns {Promise<Player>} 玩家实体
   */
  async getPlayer() {
    return withErrorHandling(async () => {
      // 如果已经加载，直接返回缓存
      if (this._currentPlayer) {
        return this._currentPlayer;
      }

      // 尝试从存储中获取
      const player = await this.getById('current-player');

      // 如果不存在，使用默认玩家
      if (!player) {
        this._currentPlayer = this._defaultPlayer;
        await this.save(this._currentPlayer);
      } else {
        this._currentPlayer = player;
      }

      return this._currentPlayer;
    }, 'PlayerRepositoryEnhanced.getPlayer', ErrorType.DATA_ACCESS);
  }

  /**
   * 保存玩家状态
   * @param {Player} player 玩家实体
   * @returns {Promise<void>}
   */
  async savePlayer(player) {
    return withErrorHandling(async () => {
      // 更新缓存
      this._currentPlayer = player;

      // 更新统计数据
      if (player.money > player.statistics.highestBalance) {
        player.statistics.highestBalance = player.money;
      }

      // 保存到存储
      await this.save(player);
    }, 'PlayerRepositoryEnhanced.savePlayer', ErrorType.DATA_ACCESS);
  }

  /**
   * 重置玩家状态
   * @param {Object} [options] 重置选项
   * @returns {Promise<Player>} 重置后的玩家实体
   */
  async resetPlayer(options = {}) {
    return withErrorHandling(async () => {
      const defaultPlayer = this._createDefaultPlayer();

      // 应用自定义选项
      if (options.initialMoney !== undefined) {
        defaultPlayer.money = options.initialMoney;
        defaultPlayer.statistics.highestBalance = options.initialMoney;
      }

      if (options.name) {
        defaultPlayer.name = options.name;
      }

      // 更新缓存和存储
      this._currentPlayer = defaultPlayer;
      await this.save(defaultPlayer);

      return defaultPlayer;
    }, 'PlayerRepositoryEnhanced.resetPlayer', ErrorType.DATA_ACCESS);
  }
}

// 创建单例实例
let instance = null;

/**
 * 创建玩家仓储
 * @param {Object} storageService 存储服务
 * @returns {PlayerRepositoryEnhanced} 玩家仓储实例
 */
export function createPlayerRepository(storageService) {
  if (!instance) {
    instance = new PlayerRepositoryEnhanced(storageService);
  }
  return instance;
}
