/**
 * 玩家相关组合函数
 */

import { ref, computed, readonly, type Ref } from 'vue';
import { Player, type PlayerId, type PlayerCreateOptions } from '../model/Player';
import { playerApi } from '../api/player-api';
import type { AsyncState } from '../../../shared/lib/composables';

/**
 * 玩家管理组合函数
 */
export function usePlayer(playerId?: PlayerId) {
  // 状态
  const player = ref<Player | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const isLoaded = computed(() => player.value !== null);
  const netWorth = computed(() => player.value?.getNetWorth() || 0);
  const level = computed(() => player.value?.level || 1);
  const experience = computed(() => player.value?.experience || 0);
  const money = computed(() => player.value?.money || 0);
  const debt = computed(() => player.value?.bankAccount.debt || 0);
  const inventorySpace = computed(() => {
    if (!player.value) return { used: 0, total: 0, remaining: 0 };
    return {
      used: player.value.getUsedInventorySpace(),
      total: player.value.inventoryCapacity,
      remaining: player.value.getRemainingInventorySpace()
    };
  });

  // 方法
  const createPlayer = async (options: PlayerCreateOptions): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await playerApi.createPlayer(options);
      
      if (result.success && result.data) {
        player.value = result.data;
        return true;
      } else {
        error.value = result.error || '创建玩家失败';
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建玩家失败';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const loadPlayer = async (id: PlayerId): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await playerApi.getPlayer(id);
      
      if (result.success && result.data) {
        player.value = result.data;
        return true;
      } else {
        error.value = result.error || '加载玩家失败';
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载玩家失败';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const savePlayer = async (): Promise<boolean> => {
    if (!player.value) return false;

    loading.value = true;
    error.value = null;

    try {
      const result = await playerApi.savePlayerState(player.value);
      
      if (result.success) {
        return true;
      } else {
        error.value = result.error || '保存失败';
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存失败';
      return false;
    } finally {
      loading.value = false;
    }
  };

  const addMoney = (amount: number): boolean => {
    if (!player.value) return false;
    return player.value.addMoney(amount);
  };

  const spendMoney = (amount: number): boolean => {
    if (!player.value) return false;
    return player.value.spendMoney(amount);
  };

  const addExperience = (amount: number): void => {
    if (!player.value) return;
    player.value.addExperience(amount);
  };

  const purchaseHouse = (houseId: string, name: string, price: number, week: number): boolean => {
    if (!player.value) return false;
    return player.value.purchaseHouse(houseId, name, price, week);
  };

  const addToInventory = (
    productId: string,
    name: string,
    quantity: number,
    price: number,
    size: number
  ): boolean => {
    if (!player.value) return false;
    return player.value.addToInventory(productId, name, quantity, price, size);
  };

  const removeFromInventory = (productId: string, quantity: number): boolean => {
    if (!player.value) return false;
    return player.value.removeFromInventory(productId, quantity);
  };

  const depositToBank = (amount: number): boolean => {
    if (!player.value) return false;
    return player.value.depositToBank(amount);
  };

  const withdrawFromBank = (amount: number): boolean => {
    if (!player.value) return false;
    return player.value.withdrawFromBank(amount);
  };

  const repayDebt = (amount: number): boolean => {
    if (!player.value) return false;
    return player.value.repayDebt(amount);
  };

  const takeLoan = (amount: number): boolean => {
    if (!player.value) return false;
    return player.value.takeLoan(amount);
  };

  const visitLocation = (locationId: string): boolean => {
    if (!player.value) return false;
    return player.value.visitLocation(locationId);
  };

  const updateWeeklyState = (currentWeek: number): void => {
    if (!player.value) return;
    player.value.updateWeeklyState(currentWeek);
  };

  // 如果传入了playerId，自动加载
  if (playerId) {
    loadPlayer(playerId);
  }

  return {
    // 状态
    player: readonly(player),
    loading: readonly(loading),
    error: readonly(error),
    
    // 计算属性
    isLoaded,
    netWorth,
    level,
    experience,
    money,
    debt,
    inventorySpace,
    
    // 方法
    createPlayer,
    loadPlayer,
    savePlayer,
    addMoney,
    spendMoney,
    addExperience,
    purchaseHouse,
    addToInventory,
    removeFromInventory,
    depositToBank,
    withdrawFromBank,
    repayDebt,
    takeLoan,
    visitLocation,
    updateWeeklyState
  };
}

/**
 * 玩家统计组合函数
 */
export function usePlayerStats(playerId: PlayerId) {
  const stats = ref<any>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const loadStats = async (): Promise<boolean> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await playerApi.getPlayerStats(playerId);
      
      if (result.success && result.data) {
        stats.value = result.data;
        return true;
      } else {
        error.value = result.error || '获取统计失败';
        return false;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取统计失败';
      return false;
    } finally {
      loading.value = false;
    }
  };

  // 自动加载
  loadStats();

  return {
    stats: readonly(stats),
    loading: readonly(loading),
    error: readonly(error),
    loadStats
  };
}

/**
 * 玩家成就组合函数
 */
export function usePlayerAchievements(playerId: PlayerId) {
  const { player, loadPlayer } = usePlayer(playerId);
  
  const achievements = computed(() => player.value?.achievements || []);
  const achievementCount = computed(() => achievements.value.length);
  
  const unlockAchievement = async (achievementId: string): Promise<boolean> => {
    try {
      const result = await playerApi.unlockAchievement(playerId, achievementId);
      
      if (result.success && result.data) {
        // 重新加载玩家数据
        await loadPlayer(playerId);
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  const hasAchievement = (achievementId: string): boolean => {
    return achievements.value.some(a => a.id === achievementId);
  };

  const getAchievementsByCategory = (category: string) => {
    return computed(() => 
      achievements.value.filter(a => a.category === category)
    );
  };

  return {
    achievements,
    achievementCount,
    unlockAchievement,
    hasAchievement,
    getAchievementsByCategory
  };
}