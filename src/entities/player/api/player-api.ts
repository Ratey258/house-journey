/**
 * 玩家实体API接口
 */

import type { Player, PlayerId, PlayerCreateOptions } from '../model/Player';
import type { ApiResponse } from '../../../shared/types';

/**
 * 玩家API接口定义
 */
export interface IPlayerApi {
  /**
   * 创建玩家
   */
  createPlayer(options: PlayerCreateOptions): Promise<ApiResponse<Player>>;

  /**
   * 获取玩家信息
   */
  getPlayer(id: PlayerId): Promise<ApiResponse<Player>>;

  /**
   * 更新玩家信息
   */
  updatePlayer(id: PlayerId, updates: Partial<Player>): Promise<ApiResponse<Player>>;

  /**
   * 删除玩家
   */
  deletePlayer(id: PlayerId): Promise<ApiResponse<void>>;

  /**
   * 保存玩家游戏状态
   */
  savePlayerState(player: Player): Promise<ApiResponse<void>>;

  /**
   * 加载玩家游戏状态
   */
  loadPlayerState(id: PlayerId): Promise<ApiResponse<Player>>;

  /**
   * 获取玩家统计信息
   */
  getPlayerStats(id: PlayerId): Promise<ApiResponse<any>>;

  /**
   * 更新玩家经验
   */
  addExperience(id: PlayerId, amount: number): Promise<ApiResponse<Player>>;

  /**
   * 解锁成就
   */
  unlockAchievement(id: PlayerId, achievementId: string): Promise<ApiResponse<Player>>;
}

/**
 * 玩家API实现 (本地存储版本)
 */
export class PlayerLocalApi implements IPlayerApi {
  private readonly storageKey = 'house-journey:players';

  async createPlayer(options: PlayerCreateOptions): Promise<ApiResponse<Player>> {
    try {
      const player = new Player(options);
      await this.savePlayer(player);
      
      return {
        success: true,
        data: player,
        message: '玩家创建成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : '创建玩家失败'
      };
    }
  }

  async getPlayer(id: PlayerId): Promise<ApiResponse<Player>> {
    try {
      const players = this.loadPlayersFromStorage();
      const playerData = players[id];
      
      if (!playerData) {
        return {
          success: false,
          data: null,
          error: '玩家不存在'
        };
      }
      
      const player = Player.fromJSON(playerData);
      
      return {
        success: true,
        data: player,
        message: '获取玩家信息成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : '获取玩家信息失败'
      };
    }
  }

  async updatePlayer(id: PlayerId, updates: Partial<Player>): Promise<ApiResponse<Player>> {
    try {
      const getResult = await this.getPlayer(id);
      if (!getResult.success || !getResult.data) {
        return getResult;
      }
      
      const player = getResult.data;
      Object.assign(player, updates);
      
      await this.savePlayer(player);
      
      return {
        success: true,
        data: player,
        message: '玩家信息更新成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : '更新玩家信息失败'
      };
    }
  }

  async deletePlayer(id: PlayerId): Promise<ApiResponse<void>> {
    try {
      const players = this.loadPlayersFromStorage();
      delete players[id];
      this.savePlayersToStorage(players);
      
      return {
        success: true,
        data: undefined,
        message: '玩家删除成功'
      };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        error: error instanceof Error ? error.message : '删除玩家失败'
      };
    }
  }

  async savePlayerState(player: Player): Promise<ApiResponse<void>> {
    try {
      await this.savePlayer(player);
      
      return {
        success: true,
        data: undefined,
        message: '游戏状态保存成功'
      };
    } catch (error) {
      return {
        success: false,
        data: undefined,
        error: error instanceof Error ? error.message : '保存游戏状态失败'
      };
    }
  }

  async loadPlayerState(id: PlayerId): Promise<ApiResponse<Player>> {
    return this.getPlayer(id);
  }

  async getPlayerStats(id: PlayerId): Promise<ApiResponse<any>> {
    try {
      const getResult = await this.getPlayer(id);
      if (!getResult.success || !getResult.data) {
        return {
          success: false,
          data: null,
          error: '获取玩家统计失败'
        };
      }
      
      const player = getResult.data;
      const stats = {
        ...player.stats,
        netWorth: player.getNetWorth(),
        availableCredit: player.getAvailableLoanAmount(),
        inventoryUsage: {
          used: player.getUsedInventorySpace(),
          total: player.inventoryCapacity,
          remaining: player.getRemainingInventorySpace()
        }
      };
      
      return {
        success: true,
        data: stats,
        message: '获取统计信息成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : '获取统计信息失败'
      };
    }
  }

  async addExperience(id: PlayerId, amount: number): Promise<ApiResponse<Player>> {
    try {
      const getResult = await this.getPlayer(id);
      if (!getResult.success || !getResult.data) {
        return getResult;
      }
      
      const player = getResult.data;
      player.addExperience(amount);
      
      await this.savePlayer(player);
      
      return {
        success: true,
        data: player,
        message: '经验值添加成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : '添加经验值失败'
      };
    }
  }

  async unlockAchievement(id: PlayerId, achievementId: string): Promise<ApiResponse<Player>> {
    try {
      const getResult = await this.getPlayer(id);
      if (!getResult.success || !getResult.data) {
        return getResult;
      }
      
      const player = getResult.data;
      
      // 这里应该从成就数据库获取成就信息
      const achievement = {
        id: achievementId,
        name: '测试成就',
        description: '测试成就描述',
        icon: 'trophy',
        unlockedAt: new Date(),
        progress: 100,
        maxProgress: 100,
        category: 'general'
      };
      
      const unlocked = player.unlockAchievement(achievement);
      
      if (!unlocked) {
        return {
          success: false,
          data: player,
          error: '成就已解锁或解锁失败'
        };
      }
      
      await this.savePlayer(player);
      
      return {
        success: true,
        data: player,
        message: '成就解锁成功'
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : '解锁成就失败'
      };
    }
  }

  // 私有方法
  private async savePlayer(player: Player): Promise<void> {
    const players = this.loadPlayersFromStorage();
    players[player.id] = player.toJSON();
    this.savePlayersToStorage(players);
  }

  private loadPlayersFromStorage(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private savePlayersToStorage(players: Record<string, any>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(players));
    } catch (error) {
      console.error('保存玩家数据失败:', error);
    }
  }
}

// 导出默认API实例
export const playerApi = new PlayerLocalApi();