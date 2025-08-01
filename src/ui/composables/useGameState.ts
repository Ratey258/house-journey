/**
 * useGameState Composable
 * 游戏状态管理逻辑抽取
 *
 * 🎯 特性:
 * - 游戏状态统一管理
 * - 计算属性优化
 * - 响应式状态监听
 * - 类型安全的状态访问
 */

import { computed, watch, nextTick } from 'vue';
import { useGameCoreStore } from '@/stores/gameCore';
import { usePlayerStore } from '@/stores/player';
import { useMarketStore } from '@/stores/market';
import { useEventStore } from '@/stores/events';
import { useEventBus } from '@/infrastructure/state/event-bus';
import { useSmartLogger } from '@/infrastructure/utils/smartLogger';

export function useGameState() {
  const logger = useSmartLogger();
  const eventBus = useEventBus();

  // Store引用
  const gameCoreStore = useGameCoreStore();
  const playerStore = usePlayerStore();
  const marketStore = useMarketStore();
  const eventStore = useEventStore();

  // ===== 基础状态计算属性 =====
  const currentWeek = computed(() => gameCoreStore.currentWeek);
  const maxWeeks = computed(() => gameCoreStore.maxWeeks);
  const gameOver = computed(() => gameCoreStore.gameOver);
  const gameStarted = computed(() => gameCoreStore.gameStarted);
  const gamePaused = computed(() => gameCoreStore.gamePaused);
  const gameResult = computed(() => gameCoreStore.gameResult);
  const notifications = computed(() => gameCoreStore.notifications);

  // 玩家状态
  const player = computed(() => ({
    name: playerStore.name,
    money: playerStore.money,
    debt: playerStore.debt,
    netWorth: playerStore.netWorth,
    inventory: playerStore.inventory,
    purchasedHouses: playerStore.purchasedHouses,
    statistics: playerStore.statistics,
    level: playerStore.level
  }));

  // 市场状态
  const currentLocation = computed(() => marketStore.currentLocation);
  const availableProducts = computed(() => marketStore.availableProducts);

  // 游戏进度
  const gameProgress = computed(() => {
    if (maxWeeks.value === 0) return 0;
    return Math.min(100, (currentWeek.value / maxWeeks.value) * 100);
  });

  const isEndlessMode = computed(() => maxWeeks.value === Infinity || maxWeeks.value > 1000);

  // 游戏状态摘要
  const gameState = computed(() => ({
    currentWeek: currentWeek.value,
    maxWeeks: maxWeeks.value,
    gameOver: gameOver.value,
    gameStarted: gameStarted.value,
    gamePaused: gamePaused.value,
    progress: gameProgress.value,
    isEndlessMode: isEndlessMode.value
  }));

  // ===== 游戏控制方法 =====

  /**
   * 进入下一周
   */
  const advanceWeek = (): boolean => {
    try {
      logger.info('用户触发进入下一周', {
        currentWeek: currentWeek.value,
        gameOver: gameOver.value
      });

      if (gameOver.value) {
        logger.warn('游戏已结束，无法进入下一周');
        return false;
      }

      const success = gameCoreStore.advanceWeek();

      if (success) {
        // 发布事件通知
        eventBus.emit('game:week:advanced', {
          newWeek: currentWeek.value,
          oldWeek: currentWeek.value - 1
        });

        logger.info('成功进入下一周', {
          newWeek: currentWeek.value,
          playerNetWorth: player.value.netWorth
        });
      }

      return success;
    } catch (error) {
      logger.error('进入下一周失败', { error: error.message });
      return false;
    }
  };

  /**
   * 暂停/恢复游戏
   */
  const togglePause = (): void => {
    gameCoreStore.togglePause();

    eventBus.emit('game:paused', {
      paused: gamePaused.value
    });

    logger.info(`游戏${gamePaused.value ? '暂停' : '恢复'}`, {
      week: currentWeek.value
    });
  };

  /**
   * 检查游戏结束条件
   */
  const checkGameEndConditions = (): void => {
    gameCoreStore.checkGameEndConditions();
  };

  // ===== 监听器设置 =====

  /**
   * 监听游戏结束状态
   */
  const watchGameOver = (callback: (gameOver: boolean) => void) => {
    return watch(() => gameCoreStore.gameOver, (newValue) => {
      if (newValue) {
        logger.info('游戏结束', {
          finalWeek: currentWeek.value,
          finalNetWorth: player.value.netWorth,
          gameResult: gameResult.value
        });

        // 发布游戏结束事件
        eventBus.emit('game:ended', {
          victory: gameResult.value?.victory || false,
          finalWeek: currentWeek.value,
          finalNetWorth: player.value.netWorth
        });

        nextTick(() => {
          callback(newValue);
        });
      }
    });
  };

  /**
   * 监听周数变化
   */
  const watchWeekChange = (callback: (newWeek: number, oldWeek: number) => void) => {
    return watch(currentWeek, (newWeek, oldWeek) => {
      if (oldWeek && newWeek !== oldWeek) {
        logger.debug('周数变化', { from: oldWeek, to: newWeek });
        callback(newWeek, oldWeek);
      }
    });
  };

  /**
   * 监听玩家资产变化
   */
  const watchPlayerWealth = (callback: (netWorth: number) => void) => {
    return watch(() => player.value.netWorth, (newNetWorth, oldNetWorth) => {
      if (oldNetWorth !== undefined && newNetWorth !== oldNetWorth) {
        logger.debug('玩家净资产变化', {
          from: oldNetWorth,
          to: newNetWorth,
          change: newNetWorth - oldNetWorth
        });
        callback(newNetWorth);
      }
    });
  };

  // ===== 游戏初始化和验证 =====

  /**
   * 检查游戏是否已初始化
   */
  const isGameInitialized = computed(() => {
    return gameCoreStore.initialized &&
           playerStore.initialized &&
           marketStore.initialized;
  });

  /**
   * 获取游戏统计信息
   */
  const getGameStats = () => {
    return {
      totalWeeks: currentWeek.value,
      totalTransactions: player.value.statistics?.transactionCount || 0,
      totalProfit: player.value.netWorth - (2000 - 5000), // 初始净资产
      housesOwned: player.value.purchasedHouses?.length || 0,
      currentLocation: currentLocation.value?.name || '未知',
      gameProgress: gameProgress.value
    };
  };

  /**
   * 重置游戏状态
   */
  const resetGame = (): void => {
    logger.info('重置游戏状态');
    gameCoreStore.resetGame();
  };

  return {
    // 状态
    currentWeek,
    maxWeeks,
    gameOver,
    gameStarted,
    gamePaused,
    gameResult,
    notifications,
    player,
    currentLocation,
    availableProducts,
    gameProgress,
    isEndlessMode,
    gameState,
    isGameInitialized,

    // 方法
    advanceWeek,
    togglePause,
    checkGameEndConditions,
    resetGame,
    getGameStats,

    // 监听器
    watchGameOver,
    watchWeekChange,
    watchPlayerWealth
  };
}
