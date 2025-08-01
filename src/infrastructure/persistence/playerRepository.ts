/**
 * 玩家仓储 - TypeScript版本
 * 负责玩家数据的存取
 */

import { createPlayer, Player, type PlayerOptions } from '@/core/models/player';
import { BaseRepository, type DTO, type IStorageService } from './base-repository';
import { withErrorHandling } from '@/infrastructure/utils/errorHandler';
import { ErrorType } from '@/infrastructure/utils/errorTypes';
import storageService from './storageService';

// ==================== 类型定义 ====================

/**
 * 玩家数据传输对象
 */
export interface PlayerDTO extends DTO<Player> {
  id: string;
  name: string;
  money: number;
  debt: number;
  capacity: number;
  inventoryUsed: number;
  inventory: any[];
  purchasedHouses: any[];
  statistics: Record<string, any>;
}

/**
 * 创建玩家选项
 */
export interface CreatePlayerOptions extends PlayerOptions {
  name: string;
}

// ==================== 玩家仓储类 ====================

/**
 * 玩家仓储类
 * 继承基础仓储类，提供类型安全的玩家数据管理
 */
export class PlayerRepository extends BaseRepository<Player, string> {
  private _cachedPlayer: Player | null = null;

  /**
   * 构造函数
   * @param storageService 存储服务
   */
  constructor(storageService: IStorageService) {
    super(storageService, 'player_data');
  }

  /**
   * 获取玩家数据
   * @returns 玩家对象或null
   */
  async getPlayer(): Promise<Player | null> {
    return withErrorHandling(async () => {
      if (this._cachedPlayer) {
        return this._cachedPlayer;
      }

      const players = await this.getAll();
      if (players.length === 0) {
        return null;
      }

      // 假设每次只有一个活跃玩家
      this._cachedPlayer = players[0];
      return this._cachedPlayer;
    }, 'PlayerRepository.getPlayer', ErrorType.DATA_ACCESS);
  }

  /**
   * 保存玩家数据
   * @param player 玩家对象
   * @returns 操作是否成功
   */
  async savePlayer(player: Player): Promise<boolean> {
    return withErrorHandling(async () => {
      if (!player || typeof player !== 'object') {
        throw new Error('Invalid player object');
      }

      await this.save(player);
      this._cachedPlayer = player;
      return true;
    }, 'PlayerRepository.savePlayer', ErrorType.DATA_ACCESS);
  }

  /**
   * 创建新玩家
   * @param name 玩家名称
   * @param options 其他初始化选项
   * @returns 新创建的玩家对象
   */
  async createNewPlayer(name: string, options: Partial<PlayerOptions> = {}): Promise<Player> {
    return withErrorHandling(async () => {
      const player = createPlayer({
        name,
        ...options
      });

      await this.savePlayer(player);
      return player;
    }, 'PlayerRepository.createNewPlayer', ErrorType.DATA_ACCESS);
  }

  /**
   * 删除玩家数据
   * @returns 操作是否成功
   */
  async deletePlayer(): Promise<boolean> {
    return withErrorHandling(async () => {
      if (this._cachedPlayer) {
        const playerId = this.getEntityId(this._cachedPlayer);
        await this.delete(playerId);
      } else {
        // 清除所有玩家数据
        await this.clear();
      }
      
      this._cachedPlayer = null;
      return true;
    }, 'PlayerRepository.deletePlayer', ErrorType.DATA_ACCESS);
  }

  /**
   * 获取玩家统计信息
   * @returns 玩家统计信息或null
   */
  async getPlayerStatistics(): Promise<Player['statistics'] | null> {
    const player = await this.getPlayer();
    return player ? player.statistics : null;
  }

  /**
   * 更新玩家统计信息
   * @param statistics 新的统计信息
   * @returns 操作是否成功
   */
  async updatePlayerStatistics(statistics: Partial<Player['statistics']>): Promise<boolean> {
    const player = await this.getPlayer();
    if (!player) {
      return false;
    }

    player.statistics = { ...player.statistics, ...statistics };
    return this.savePlayer(player);
  }

  /**
   * 检查玩家是否存在
   * @returns 玩家是否存在
   */
  async hasPlayer(): Promise<boolean> {
    const player = await this.getPlayer();
    return player !== null;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this._cachedPlayer = null;
  }

  /**
   * 刷新缓存（重新从存储加载）
   */
  async refreshCache(): Promise<void> {
    this._cachedPlayer = null;
    await super.refreshCache();
  }

  // ==================== BaseRepository 抽象方法实现 ====================

  /**
   * 获取实体ID
   * @param entity 玩家实体
   * @returns 玩家ID
   */
  getEntityId(entity: Player): string {
    return entity.name || 'default_player';
  }

  /**
   * 将DTO映射为玩家实体
   * @param dto 数据传输对象
   * @returns 玩家实体
   */
  mapToEntity(dto: PlayerDTO): Player {
    return createPlayer({
      name: dto.name,
      money: dto.money,
      debt: dto.debt,
      capacity: dto.capacity,
      inventory: dto.inventory || [],
      purchasedHouses: dto.purchasedHouses || [],
      statistics: dto.statistics || {}
    });
  }

  /**
   * 将玩家实体映射为DTO
   * @param entity 玩家实体
   * @returns 数据传输对象
   */
  mapToDTO(entity: Player): PlayerDTO {
    return {
      id: this.getEntityId(entity),
      name: entity.name,
      money: entity.money,
      debt: entity.debt,
      capacity: entity.capacity,
      inventoryUsed: entity.inventoryUsed,
      inventory: [...(entity.inventory || [])],
      purchasedHouses: [...(entity.purchasedHouses || [])],
      statistics: { ...(entity.statistics || {}) }
    };
  }
}

// ==================== 默认实例 ====================

/**
 * 创建默认玩家仓储实例
 */
const playerRepository = new PlayerRepository(storageService);

export default playerRepository;