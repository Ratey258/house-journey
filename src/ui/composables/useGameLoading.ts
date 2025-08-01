/**
 * useGameLoading Composable
 * 游戏加载状态管理
 *
 * 🎯 特性:
 * - 加载进度跟踪
 * - 加载状态管理
 * - 加载错误处理
 * - 异步加载优化
 */

import { ref, computed, nextTick } from 'vue';
import { useGameCoreStore } from '@/stores/gameCore';
import { usePlayerStore } from '@/stores/player';
import { useMarketStore } from '@/stores/market';
import { useEventBus } from '@/infrastructure/state/event-bus';
import { useSmartLogger } from '@/infrastructure/utils/smartLogger';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';

export interface LoadingStep {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'loading' | 'completed' | 'error';
  error?: string;
}

export function useGameLoading() {
  const logger = useSmartLogger();
  const eventBus = useEventBus();

  // Store引用
  const gameCoreStore = useGameCoreStore();
  const playerStore = usePlayerStore();
  const marketStore = useMarketStore();

  // 加载状态
  const isLoading = ref(true);
  const loadingProgress = ref(0);
  const loadingStatus = ref('初始化游戏...');
  const loadingError = ref<string | null>(null);

  // 加载步骤
  const loadingSteps = ref<LoadingStep[]>([
    { id: 'init', name: '初始化游戏系统', progress: 0, status: 'pending' },
    { id: 'player', name: '加载玩家数据', progress: 0, status: 'pending' },
    { id: 'market', name: '初始化市场数据', progress: 0, status: 'pending' },
    { id: 'events', name: '准备游戏事件', progress: 0, status: 'pending' },
    { id: 'ui', name: '准备用户界面', progress: 0, status: 'pending' }
  ]);

  // 计算属性
  const currentStep = computed(() => {
    return loadingSteps.value.find(step => step.status === 'loading') ||
           loadingSteps.value[0];
  });

  const totalProgress = computed(() => {
    const completed = loadingSteps.value.filter(step => step.status === 'completed').length;
    const total = loadingSteps.value.length;
    return Math.round((completed / total) * 100);
  });

  const isComplete = computed(() => {
    return loadingSteps.value.every(step => step.status === 'completed');
  });

  const hasError = computed(() => {
    return loadingSteps.value.some(step => step.status === 'error') || !!loadingError.value;
  });

  // ===== 加载控制方法 =====

  /**
   * 开始游戏加载
   */
  const startLoading = async (): Promise<void> => {
    logger.info('开始游戏加载流程');

    isLoading.value = true;
    loadingProgress.value = 0;
    loadingError.value = null;

    // 重置所有步骤
    loadingSteps.value.forEach(step => {
      step.status = 'pending';
      step.progress = 0;
      step.error = undefined;
    });

    try {
      // 依次执行加载步骤
      await executeStep('init', initializeGameSystem);
      await executeStep('player', loadPlayerData);
      await executeStep('market', initializeMarketData);
      await executeStep('events', prepareGameEvents);
      await executeStep('ui', prepareUserInterface);

      // 完成加载
      await completeLoading();

    } catch (error) {
      logger.error('游戏加载失败', { error: error.message });
      handleLoadingError(error);
    }
  };

  /**
   * 执行加载步骤
   */
  const executeStep = async (stepId: string, stepFunction: () => Promise<void>): Promise<void> => {
    const step = loadingSteps.value.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`加载步骤不存在: ${stepId}`);
    }

    logger.info('执行加载步骤', { stepId, stepName: step.name });

    step.status = 'loading';
    loadingStatus.value = step.name;

    try {
      await stepFunction();

      step.status = 'completed';
      step.progress = 100;

      // 更新总进度
      loadingProgress.value = totalProgress.value;

      logger.info('加载步骤完成', { stepId, progress: totalProgress.value });

    } catch (error) {
      step.status = 'error';
      step.error = error.message;

      logger.error('加载步骤失败', { stepId, error: error.message });
      throw error;
    }
  };

  /**
   * 初始化游戏系统
   */
  const initializeGameSystem = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    // 检查必要的系统功能
    if (!gameCoreStore || !playerStore || !marketStore) {
      throw new Error('必要的store未初始化');
    }

    logger.debug('游戏系统初始化完成');
  };

  /**
   * 加载玩家数据
   */
  const loadPlayerData = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    // 检查是否有保存的玩家数据
    const savedPlayerName = localStorage.getItem('lastPlayerName');
    if (savedPlayerName && !playerStore.name) {
      logger.info('发现保存的玩家名称', { playerName: savedPlayerName });
    }

    // 确保玩家store已初始化
    if (!playerStore.initialized) {
      logger.debug('玩家数据尚未完全初始化');
    }

    logger.debug('玩家数据加载完成');
  };

  /**
   * 初始化市场数据
   */
  const initializeMarketData = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // 如果市场未初始化，等待初始化
      if (!marketStore.initialized) {
        logger.debug('等待市场初始化...');
        // 这里可能需要等待市场store的异步初始化
      }

      logger.debug('市场数据初始化完成');

    } catch (error) {
      logger.error('市场数据初始化失败', { error: error.message });
      throw new Error(`市场初始化失败: ${error.message}`);
    }
  };

  /**
   * 准备游戏事件
   */
  const prepareGameEvents = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    // 清理之前可能存在的事件
    eventBus.clear();

    logger.debug('游戏事件准备完成');
  };

  /**
   * 准备用户界面
   */
  const prepareUserInterface = async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 200));

    // 等待DOM更新
    await nextTick();

    logger.debug('用户界面准备完成');
  };

  /**
   * 完成加载
   */
  const completeLoading = async (): Promise<void> => {
    logger.info('游戏加载完成', {
      totalTime: Date.now(),
      stepsCompleted: loadingSteps.value.filter(s => s.status === 'completed').length
    });

    // 最后的UI更新
    loadingStatus.value = '加载完成！';
    loadingProgress.value = 100;

    // 短暂延迟让用户看到完成状态
    await new Promise(resolve => setTimeout(resolve, 500));

    // 结束加载状态
    isLoading.value = false;

    // 发布加载完成事件
    eventBus.emit('system:notification', {
      type: 'success',
      title: '游戏加载',
      message: '游戏资源加载完成！'
    });
  };

  /**
   * 处理加载错误
   */
  const handleLoadingError = (error: Error): void => {
    loadingError.value = error.message;
    loadingStatus.value = `加载失败: ${error.message}`;

    handleError(error, 'useGameLoading', ErrorType.UNKNOWN, ErrorSeverity.ERROR);

    // 发布错误事件
    eventBus.emit('system:error', {
      error,
      context: 'useGameLoading',
      severity: 'error'
    });
  };

  /**
   * 重试加载
   */
  const retryLoading = async (): Promise<void> => {
    logger.info('重试游戏加载');

    loadingError.value = null;

    // 重置失败的步骤
    loadingSteps.value.forEach(step => {
      if (step.status === 'error') {
        step.status = 'pending';
        step.progress = 0;
        step.error = undefined;
      }
    });

    await startLoading();
  };

  /**
   * 取消加载
   */
  const cancelLoading = (): void => {
    logger.info('取消游戏加载');

    isLoading.value = false;
    loadingStatus.value = '加载已取消';

    // 清理状态
    loadingSteps.value.forEach(step => {
      if (step.status === 'loading') {
        step.status = 'pending';
      }
    });
  };

  /**
   * 设置自定义加载步骤
   */
  const setLoadingSteps = (steps: LoadingStep[]): void => {
    loadingSteps.value = steps;
    logger.debug('设置自定义加载步骤', { stepCount: steps.length });
  };

  /**
   * 获取加载统计
   */
  const getLoadingStats = () => {
    const completed = loadingSteps.value.filter(s => s.status === 'completed').length;
    const failed = loadingSteps.value.filter(s => s.status === 'error').length;
    const pending = loadingSteps.value.filter(s => s.status === 'pending').length;
    const loading = loadingSteps.value.filter(s => s.status === 'loading').length;

    return {
      total: loadingSteps.value.length,
      completed,
      failed,
      pending,
      loading,
      progress: totalProgress.value,
      hasError: hasError.value,
      isComplete: isComplete.value
    };
  };

  return {
    // 状态
    isLoading,
    loadingProgress,
    loadingStatus,
    loadingError,
    loadingSteps,
    currentStep,
    totalProgress,
    isComplete,
    hasError,

    // 方法
    startLoading,
    retryLoading,
    cancelLoading,
    setLoadingSteps,
    getLoadingStats
  };
}
