/**
 * 玩家服务 Composable
 * 基于依赖注入的玩家数据访问层
 */
import { ref, computed, inject, type Ref, type ComputedRef } from 'vue';
import type { DIContainer } from '../../infrastructure/di/container';
import type { IPlayerRepository } from '../../core/interfaces/repositories';

// 类型定义
interface Player {
  id: string;
  name: string;
  money: number;
  debt?: number;
  inventory: any[];
  currentLocation?: string;
  statistics: PlayerStatistics;
  [key: string]: any;
}

interface PlayerStatistics {
  transactionCount: number;
  totalProfit: number;
  averageProfit: number;
  bestDeal: number;
  worstDeal: number;
}

interface UsePlayerServiceReturn {
  // 状态
  player: Ref<Player | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  
  // 计算属性
  playerMoney: ComputedRef<number>;
  playerDebt: ComputedRef<number>;
  playerInventory: ComputedRef<any[]>;
  playerStatistics: ComputedRef<PlayerStatistics | null>;
  
  // 方法
  loadPlayer: () => Promise<void>;
  savePlayer: () => Promise<void>;
  refreshPlayer: () => Promise<void>;
  
  // 工具方法
  clearError: () => void;
}

/**
 * 玩家服务 Composable
 * 通过依赖注入获取PlayerRepository，提供类型安全的玩家数据操作
 */
export function usePlayerService(): UsePlayerServiceReturn {
  // 通过依赖注入获取服务
  const container = inject<DIContainer>('diContainer');
  if (!container) {
    throw new Error('DI容器未正确配置。请确保在应用根部提供了diContainer。');
  }

  const playerRepository = container.resolve<IPlayerRepository>('playerRepository');
  
  // 响应式状态
  const player = ref<Player | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  // 计算属性
  const playerMoney = computed(() => player.value?.money || 0);
  const playerDebt = computed(() => player.value?.debt || 0);
  const playerInventory = computed(() => player.value?.inventory || []);
  const playerStatistics = computed(() => player.value?.statistics || null);
  
  /**
   * 加载玩家数据
   */
  const loadPlayer = async (): Promise<void> => {
    isLoading.value = true;
    error.value = null;

    try {
      player.value = await playerRepository.getPlayer();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载玩家数据失败';
      error.value = errorMessage;
      console.error('Failed to load player:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 保存玩家数据
   */
  const savePlayer = async (): Promise<void> => {
    if (!player.value) {
      error.value = '没有玩家数据可保存';
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      await playerRepository.savePlayer(player.value);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '保存玩家数据失败';
      error.value = errorMessage;
      console.error('Failed to save player:', err);
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 刷新玩家数据 - 重新加载
   */
  const refreshPlayer = async (): Promise<void> => {
    await loadPlayer();
  };

  /**
   * 清除错误信息
   */
  const clearError = (): void => {
    error.value = null;
  };

  /**
   * 银行操作方法
   */
  
  // 存款到银行
  const depositToBank = async (amount: number): Promise<boolean> => {
    if (!player.value) return false;
    
    // 检查资金是否足够
    if (player.value.money < amount) {
      return false;
    }
    
    // 保存原始值，以便在失败时回滚
    const originalMoney = player.value.money;
    const originalDeposit = player.value.bankDeposit || 0;
    
    try {
      // 先修改数据
      player.value.money -= amount;
      player.value.bankDeposit = originalDeposit + amount;
      
      // 保存到存储
      await savePlayer();
      return true;
    } catch (err) {
      // 回滚数据
      player.value.money = originalMoney;
      player.value.bankDeposit = originalDeposit;
      
      error.value = err instanceof Error ? err.message : '存款失败';
      return false;
    }
  };

  // 从银行取款
  const withdrawFromBank = async (amount: number): Promise<boolean> => {
    if (!player.value) return false;
    
    try {
      const bankDeposit = player.value.bankDeposit || 0;
      if (bankDeposit >= amount) {
        player.value.money += amount;
        player.value.bankDeposit = bankDeposit - amount;
        await savePlayer();
        return true;
      }
      return false;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '取款失败';
      return false;
    }
  };

  // 贷款
  const takeLoan = async (amount: number): Promise<boolean> => {
    if (!player.value) return false;
    
    try {
      const availableLoan = player.value.availableLoanAmount || 0;
      if (availableLoan >= amount) {
        player.value.money += amount;
        player.value.debt = (player.value.debt || 0) + amount;
        player.value.availableLoanAmount = availableLoan - amount;
        await savePlayer();
        return true;
      }
      return false;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '贷款失败';
      return false;
    }
  };

  // 还债
  const repayDebt = async (amount: number): Promise<boolean> => {
    if (!player.value) return false;
    
    try {
      const debt = player.value.debt || 0;
      if (player.value.money >= amount && debt >= amount) {
        player.value.money -= amount;
        player.value.debt = debt - amount;
        player.value.availableLoanAmount = (player.value.availableLoanAmount || 0) + amount;
        await savePlayer();
        return true;
      }
      return false;
    } catch (err) {
      error.value = err instanceof Error ? err.message : '还债失败';
      return false;
    }
  };

  return {
    // 状态
    player,
    isLoading,
    error,
    
    // 计算属性
    playerMoney,
    playerDebt,
    playerInventory,
    playerStatistics,
    
    // 方法
    loadPlayer,
    savePlayer,
    refreshPlayer,
    
    // 银行操作方法
    depositToBank,
    withdrawFromBank,
    takeLoan,
    repayDebt,
    
    // 工具方法
    clearError
  };
}