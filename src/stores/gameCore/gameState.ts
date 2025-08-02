import { defineStore } from 'pinia';
import { ref, computed, readonly } from 'vue';
import { usePlayerStore } from '../player';
import { useMarketStore } from '../market';
import { useEventStore } from '../events';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';
import { useSmartLogger } from '../../infrastructure/utils/smartLogger';

/**
 * 游戏结果类型
 */
export interface GameResult {
  victory: boolean;
  finalWeek: number;
  finalNetWorth: number;
  debtPaid: boolean;
  totalProfit: number;
  message: string;
  achievement?: string;
}

/**
 * 游戏通知类型
 */
export interface GameNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  duration?: number;
  persistent?: boolean;
}

/**
 * 游戏目标类型
 */
export interface GameGoals {
  requiredNetWorth: number;
  targetWeeks: number;
  description?: string;
}

/**
 * 游戏进度类型
 */
export interface GameProgress {
  currentNetWorth: number;
  netWorthProgress: number; // 0-1
  weekProgress: number; // 0-1
  overallProgress: number; // 0-1
  isOnTrack: boolean;
  daysRemaining: number;
}

/**
 * 游戏核心状态类型
 */
export interface GameCoreState {
  currentWeek: number;
  maxWeeks: number;
  gameStarted: boolean;
  gamePaused: boolean;
  gameOver: boolean;
  victoryAchieved: boolean;
  gameResult: GameResult | null;
  notifications: GameNotification[];
  initialized: boolean;
  gameGoals: GameGoals;
}

/**
 * 游戏核心状态管理 - TypeScript Setup Store版本
 * 负责管理游戏流程、周数和全局游戏状态
 *
 * 🎯 特性:
 * - 完整的TypeScript类型安全
 * - Setup Store现代化语法
 * - 智能日志集成
 * - 事件驱动架构准备
 * - 响应式状态保护
 */
export const useGameCoreStore = defineStore('gameCore', () => {
  const logger = useSmartLogger();

  // ===== 状态定义 =====
  const currentWeek = ref<number>(1);
  const maxWeeks = ref<number>(52);
  const gameStarted = ref<boolean>(false);
  const gamePaused = ref<boolean>(false);
  const gameOver = ref<boolean>(false);
  const victoryAchieved = ref<boolean>(false);
  const gameResult = ref<GameResult | null>(null);
  const notifications = ref<GameNotification[]>([]);
  const initialized = ref<boolean>(false);

  const gameGoals = ref<GameGoals>({
    requiredNetWorth: 400000,
    targetWeeks: 30,
    description: '在30周内达到40万净资产'
  });

  // ===== 计算属性 =====
  const isGameActive = computed((): boolean => {
    return gameStarted.value && !gamePaused.value && !gameOver.value;
  });

  const gameProgress = computed((): GameProgress => {
    const playerStore = usePlayerStore();
    const currentNetWorth = playerStore.netWorth;
    const netWorthProgress = Math.min(currentNetWorth / gameGoals.value.requiredNetWorth, 1);
    const weekProgress = currentWeek.value / gameGoals.value.targetWeeks;
    const overallProgress = (netWorthProgress + (1 - weekProgress)) / 2;

    return {
      currentNetWorth,
      netWorthProgress,
      weekProgress,
      overallProgress,
      isOnTrack: netWorthProgress >= weekProgress,
      daysRemaining: Math.max(0, gameGoals.value.targetWeeks - currentWeek.value) * 7
    };
  });

  const isVictoryConditionMet = computed((): boolean => {
    const playerStore = usePlayerStore();
    return playerStore.netWorth >= gameGoals.value.requiredNetWorth;
  });

  const activeNotifications = computed((): GameNotification[] => {
    return notifications.value.filter(n => n.persistent ||
      (Date.now() - n.timestamp) < (n.duration || 5000)
    );
  });

  // ===== 方法定义 =====

  /**
   * 开始新游戏
   */
  const startNewGame = async (playerName: string): Promise<void> => {
    try {
      logger.info('开始新游戏', { playerName, week: 1 });

      // 重置游戏状态
      currentWeek.value = 1;
      gameStarted.value = true;
      gamePaused.value = false;
      gameOver.value = false;
      victoryAchieved.value = false;
      gameResult.value = null;
      clearNotifications();

      // 初始化其他模块
      const playerStore = usePlayerStore();
      const marketStore = useMarketStore();
      const eventStore = useEventStore();

      // 等待玩家初始化完成
      await playerStore.initializePlayer(playerName);

      // 确保名称已被设置 - Pinia会自动处理ref
      const currentName = typeof playerStore.name === 'object' && 'value' in playerStore.name 
        ? playerStore.name.value 
        : playerStore.name;
      
      if (!currentName && playerName) {
        if (typeof playerStore.name === 'object' && 'value' in playerStore.name) {
          playerStore.name.value = playerName;
        }
      }

      // 初始化市场
      await marketStore.initializeMarket();
      marketStore.updateLocationProducts();

      // 重置事件系统
      eventStore.resetEvents();

      // 保存玩家名称
      localStorage.setItem('lastPlayerName', playerName);

      initialized.value = true;

      logger.info('游戏初始化完成', {
        playerName,
        netWorth: playerStore.netWorth,
        location: marketStore.currentLocation?.name
      });

    } catch (error) {
      handleError(error, 'gameState (startNewGame)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      logger.error('游戏初始化失败', { error: error.message, playerName });
      throw error;
    }
  };

  /**
   * 进入下一周
   */
  const advanceWeek = (): boolean => {
    if (currentWeek.value <= maxWeeks.value && !gameOver.value) {
      const oldWeek = currentWeek.value;
      currentWeek.value++;

      logger.info('进入新的一周', {
        from: oldWeek,
        to: currentWeek.value,
        progress: `${currentWeek.value}/${maxWeeks.value}`
      });

      try {
        const playerStore = usePlayerStore();
        const marketStore = useMarketStore();
        const eventStore = useEventStore();

        // 更新玩家状态
        playerStore.incrementWeek();

        // 更新市场状态
        marketStore.updateMarketState(currentWeek.value);

        // 生成随机事件（如果需要）
        // eventStore.generateRandomEvent(currentWeek.value, playerData, marketData);

        // 检查游戏结束条件
        checkGameEndConditions();

        // 添加周数通知
        if (currentWeek.value % 5 === 0) {
          addNotification({
            type: 'info',
            title: `第${currentWeek.value}周`,
            message: `时间过得真快！净资产: ¥${playerStore.netWorth.toLocaleString()}`,
            duration: 2000
          });
        }

        return true;
      } catch (error) {
        handleError(error, 'gameState (advanceWeek)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
        logger.error('周数推进失败', { week: currentWeek.value, error: error.message });
        return false;
      }
    }

    logger.warn('无法推进周数', {
      currentWeek: currentWeek.value,
      maxWeeks: maxWeeks.value,
      gameOver: gameOver.value
    });

    return false;
  };

  /**
   * 检查游戏结束条件
   */
  const checkGameEndConditions = (): void => {
    const playerStore = usePlayerStore();

    // 检查胜利条件
    if (isVictoryConditionMet.value && !victoryAchieved.value) {
      victoryAchieved.value = true;
      logger.info('达成胜利条件！', {
        netWorth: playerStore.netWorth,
        required: gameGoals.value.requiredNetWorth,
        week: currentWeek.value
      });

      addNotification({
        type: 'success',
        title: '🎉 胜利达成！',
        message: `恭喜！你在第${currentWeek.value}周达到了${gameGoals.value.requiredNetWorth.toLocaleString()}的净资产目标！`,
        persistent: true
      });
    }

    // 检查失败条件 - 时间用完但未达成目标
    if (currentWeek.value > gameGoals.value.targetWeeks && !victoryAchieved.value) {
      endGame(false, '时间用完了！未能在规定时间内达成目标。');
      return;
    }

    // 检查失败条件 - 破产
    if (playerStore.netWorth < -100000) { // 负债超过10万
      endGame(false, '破产了！负债过多，游戏结束。');
      return;
    }

    // 检查最大周数限制
    if (currentWeek.value > maxWeeks.value) {
      const victory = victoryAchieved.value;
      const message = victory
        ? '游戏时间结束，你成功完成了目标！'
        : '游戏时间结束，未能完成目标。';
      endGame(victory, message);
    }
  };

  /**
   * 结束游戏
   */
  const endGame = (victory: boolean, message: string): void => {
    const playerStore = usePlayerStore();

    gameOver.value = true;
    gameStarted.value = false;

    const result: GameResult = {
      victory,
      finalWeek: currentWeek.value,
      finalNetWorth: playerStore.netWorth,
      debtPaid: playerStore.debt <= 0,
      totalProfit: playerStore.netWorth - (2000 - 5000), // 初始净资产是-3000
      message,
      achievement: victory ? getAchievement() : undefined
    };

    gameResult.value = result;

    logger.info('游戏结束', {
      victory,
      finalWeek: currentWeek.value,
      finalNetWorth: playerStore.netWorth,
      message
    });

    addNotification({
      type: victory ? 'success' : 'warning',
      title: victory ? '🏆 游戏胜利！' : '😞 游戏结束',
      message,
      persistent: true
    });
  };

  /**
   * 获取成就信息
   */
  const getAchievement = (): string => {
    const playerStore = usePlayerStore();
    const weeksTaken = currentWeek.value;
    const finalNetWorth = playerStore.netWorth;

    if (weeksTaken <= 20 && finalNetWorth >= 500000) {
      return '房地产大亨 - 20周内达到50万净资产！';
    } else if (weeksTaken <= 25) {
      return '投资高手 - 25周内完成目标！';
    } else if (finalNetWorth >= 600000) {
      return '财富积累者 - 净资产超过60万！';
    } else {
      return '稳健投资者 - 成功完成投资目标！';
    }
  };

  /**
   * 暂停/恢复游戏
   */
  const togglePause = (): void => {
    gamePaused.value = !gamePaused.value;
    logger.info(`游戏${gamePaused.value ? '暂停' : '恢复'}`, {
      week: currentWeek.value,
      paused: gamePaused.value
    });
  };

  /**
   * 添加通知
   */
  const addNotification = (notification: Omit<GameNotification, 'id' | 'timestamp'>): void => {
    const newNotification: GameNotification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    notifications.value.push(newNotification);

    // 限制通知数量
    if (notifications.value.length > 50) {
      notifications.value = notifications.value.slice(-30);
    }

    logger.debug('添加通知', {
      type: notification.type,
      title: notification.title,
      total: notifications.value.length
    });
  };

  /**
   * 移除通知
   */
  const removeNotification = (id: string): void => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
      logger.debug('移除通知', { id, remaining: notifications.value.length });
    }
  };

  /**
   * 清除所有通知
   */
  const clearNotifications = (): void => {
    const count = notifications.value.length;
    notifications.value = [];
    logger.debug('清除所有通知', { cleared: count });
  };

  /**
   * 清除过期通知
   */
  const clearExpiredNotifications = (): void => {
    const now = Date.now();
    const originalCount = notifications.value.length;

    notifications.value = notifications.value.filter(n =>
      n.persistent || (now - n.timestamp) < (n.duration || 5000)
    );

    const clearedCount = originalCount - notifications.value.length;
    if (clearedCount > 0) {
      logger.debug('清除过期通知', { cleared: clearedCount, remaining: notifications.value.length });
    }
  };

  /**
   * 重置游戏状态
   */
  const resetGame = (): void => {
    currentWeek.value = 1;
    gameStarted.value = false;
    gamePaused.value = false;
    gameOver.value = false;
    victoryAchieved.value = false;
    gameResult.value = null;
    initialized.value = false;
    clearNotifications();

    logger.info('游戏状态已重置');
  };

  /**
   * 设置游戏目标
   */
  const setGameGoals = (goals: Partial<GameGoals>): void => {
    gameGoals.value = { ...gameGoals.value, ...goals };
    logger.info('更新游戏目标', gameGoals.value);
  };

  /**
   * 设置最大周数
   */
  const setMaxWeeks = (weeks: number): void => {
    maxWeeks.value = weeks;
    logger.info('设置最大周数', { maxWeeks: weeks });
  };

  // 定期清理过期通知
  setInterval(() => {
    if (notifications.value.length > 0) {
      clearExpiredNotifications();
    }
  }, 10000);

  // ===== 返回状态和方法 =====
  return {
    // 状态 (只读)
    currentWeek: readonly(currentWeek),
    maxWeeks: readonly(maxWeeks),
    gameStarted: readonly(gameStarted),
    gamePaused: readonly(gamePaused),
    gameOver: readonly(gameOver),
    victoryAchieved: readonly(victoryAchieved),
    gameResult: readonly(gameResult),
    notifications: readonly(notifications),
    initialized: readonly(initialized),
    gameGoals: readonly(gameGoals),

    // 计算属性
    isGameActive,
    gameProgress,
    isVictoryConditionMet,
    activeNotifications,

    // 方法
    startNewGame,
    advanceWeek,
    checkGameEndConditions,
    endGame,
    togglePause,
    addNotification,
    removeNotification,
    clearNotifications,
    clearExpiredNotifications,
    resetGame,
    setGameGoals,
    setMaxWeeks
  };
});

// 类型导出（避免重复导出）
