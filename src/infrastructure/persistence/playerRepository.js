/**
 * 玩家仓储
 * 负责玩家数据的存取
 */
import { createPlayer, Player } from '../../core/models/player';
import { withErrorHandling } from '@/infrastructure/utils/errorHandler';
import { ErrorType } from '@/infrastructure/utils/errorTypes';
import storageService from './storageService';

/**
 * 玩家仓储类
 */
export class PlayerRepository {
  /**
   * 构造函数
   * @param {Object} storageService 存储服务
   */
  constructor(storageService) {
    this.storageService = storageService;
    this.storageKey = 'player_data';
    this._cachedPlayer = null;
  }
  
  /**
   * 获取玩家数据
   * @returns {Promise<Player|null>} 玩家对象或null
   */
  async getPlayer() {
    return withErrorHandling(async () => {
      if (this._cachedPlayer) {
        return this._cachedPlayer;
      }
      
      const data = await this.storageService.getData(this.storageKey);
      if (!data) {
        return null;
      }
      
      const player = createPlayer(data);
      this._cachedPlayer = player;
      return player;
    }, 'PlayerRepository.getPlayer', ErrorType.STORAGE);
  }
  
  /**
   * 保存玩家数据
   * @param {Player} player 玩家对象
   * @returns {Promise<boolean>} 操作是否成功
   */
  async savePlayer(player) {
    return withErrorHandling(async () => {
      if (!(player instanceof Player)) {
        throw new Error('Invalid player object');
      }
      
      await this.storageService.setData(this.storageKey, {
        name: player.name,
        money: player.money,
        debt: player.debt,
        capacity: player.capacity,
        inventoryUsed: player.inventoryUsed,
        inventory: [...player.inventory],
        purchasedHouses: [...player.purchasedHouses],
        statistics: { ...player.statistics }
      });
      
      this._cachedPlayer = player;
      return true;
    }, 'PlayerRepository.savePlayer', ErrorType.STORAGE);
  }
  
  /**
   * 创建新玩家
   * @param {string} name 玩家名称
   * @param {Object} options 其他初始化选项
   * @returns {Promise<Player>} 新创建的玩家对象
   */
  async createNewPlayer(name, options = {}) {
    return withErrorHandling(async () => {
      const player = createPlayer({
        name,
        ...options
      });
      
      await this.savePlayer(player);
      return player;
    }, 'PlayerRepository.createNewPlayer', ErrorType.STORAGE);
  }
  
  /**
   * 删除玩家数据
   * @returns {Promise<boolean>} 操作是否成功
   */
  async deletePlayer() {
    return withErrorHandling(async () => {
      await this.storageService.removeData(this.storageKey);
      this._cachedPlayer = null;
      return true;
    }, 'PlayerRepository.deletePlayer', ErrorType.STORAGE);
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    this._cachedPlayer = null;
  }
}

// 创建默认实例
const playerRepository = new PlayerRepository(storageService);

export default playerRepository; 