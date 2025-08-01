/**
 * useGameEvents Composable
 * 游戏事件处理逻辑抽取
 *
 * 🎯 特性:
 * - 事件显示和处理
 * - 事件队列管理
 * - 事件触发器集成
 * - 类型安全的事件处理
 */

import { ref, nextTick } from 'vue';
import { useEventStore } from '@/stores/events';
import { useGameCoreStore } from '@/stores/gameCore';
import { useEventBus } from '@/infrastructure/state/event-bus';
import { useSmartLogger } from '@/infrastructure/utils/smartLogger';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';

export function useGameEvents() {
  const logger = useSmartLogger();
  const eventBus = useEventBus();

  // Store引用
  const eventStore = useEventStore();
  const gameCoreStore = useGameCoreStore();

  // 事件Modal引用
  const eventModalRef = ref<any>(null);

  // ===== 事件显示和处理 =====

  /**
   * 显示事件
   */
  const showEvent = (event: any): void => {
    if (!event || !eventModalRef.value) {
      logger.warn('无法显示事件', {
        hasEvent: !!event,
        hasModal: !!eventModalRef.value
      });
      return;
    }

    logger.info('显示游戏事件', {
      eventId: event.id,
      eventTitle: event.title,
      hasOptions: event.options?.length || 0
    });

    try {
      eventModalRef.value.showEvent(event);

      // 发布事件显示通知
      eventBus.emit('ui:modal:open', {
        modalId: 'event-modal',
        data: { eventId: event.id, eventTitle: event.title }
      });

      // 尝试触发教程事件
      triggerTutorialEvent('tutorial_trading');

    } catch (error) {
      handleError(error, 'useGameEvents (showEvent)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
      logger.error('显示事件失败', {
        eventId: event.id,
        error: error.message
      });
    }
  };

  /**
   * 检查活跃事件
   */
  const checkActiveEvents = (): void => {
    // 如果游戏已结束，不检查事件
    if (gameCoreStore.gameOver) {
      logger.debug('游戏已结束，跳过事件检查');
      return;
    }

    logger.debug('检查活跃事件');

    // 首先检查事件存储中的活跃事件
    if (eventStore.activeEvent) {
      logger.info('发现EventStore活跃事件', {
        eventId: eventStore.activeEvent.id,
        eventTitle: eventStore.activeEvent.title
      });

      nextTick(() => {
        if (eventModalRef.value) {
          showEvent(eventStore.activeEvent);
        } else {
          logger.error('事件Modal组件未初始化');
        }
      });
      return;
    }

    // 检查游戏核心存储中的事件队列
    const activeEvents = gameCoreStore.activeEvents;
    if (activeEvents && activeEvents.length > 0) {
      const event = activeEvents[0];
      logger.info('发现GameCore活跃事件', {
        eventId: event.id,
        eventTitle: event.title,
        queueLength: activeEvents.length
      });

      // 从队列移除第一个事件
      gameCoreStore.activeEvents.shift();

      // 确保事件有必要的属性
      if (!event.options || !Array.isArray(event.options) || event.options.length === 0) {
        logger.warn('事件缺少选项，添加默认选项', { eventId: event.id });
        event.options = [
          {
            id: 'default_option',
            text: '确认',
            result: '你确认了这个事件。',
            effects: {}
          }
        ];
      }

      // 显示事件
      nextTick(() => {
        if (eventModalRef.value) {
          showEvent(event);
        } else {
          logger.error('事件Modal组件未初始化');
        }
      });
    } else {
      logger.debug('没有活跃事件需要显示');
    }
  };

  /**
   * 触发连锁事件
   */
  const triggerNextEvent = (eventId: string): void => {
    if (!eventId) {
      logger.warn('尝试触发空的事件ID');
      return;
    }

    logger.info('触发连锁事件', { eventId });

    // 延迟触发，让UI有时间更新
    setTimeout(() => {
      try {
        if (typeof gameCoreStore.triggerSpecificEvent === 'function') {
          gameCoreStore.triggerSpecificEvent(eventId);
        } else {
          logger.warn('triggerSpecificEvent方法不存在');
        }
      } catch (error) {
        logger.error('触发连锁事件失败', {
          eventId,
          error: error.message
        });
      }
    }, 500);
  };

  /**
   * 触发教程事件
   */
  const triggerTutorialEvent = (tutorialId: string): void => {
    try {
      if (typeof gameCoreStore.triggerTutorialEvent === 'function') {
        gameCoreStore.triggerTutorialEvent(tutorialId);
        logger.debug('触发教程事件', { tutorialId });
      } else {
        logger.debug('triggerTutorialEvent方法不存在');
      }
    } catch (error) {
      logger.error('触发教程事件失败', {
        tutorialId,
        error: error.message
      });
    }
  };

  /**
   * 处理事件选择
   */
  const handleEventChoice = (eventId: string, choiceId: string, effects: any): void => {
    logger.info('处理事件选择', {
      eventId,
      choiceId,
      effects
    });

    try {
      // 应用事件效果
      if (effects) {
        applyEventEffects(effects);
      }

      // 发布事件处理通知
      eventBus.emit('system:notification', {
        type: 'info',
        title: '事件处理',
        message: `事件 ${eventId} 已处理`
      });

      // 关闭事件Modal
      if (eventModalRef.value && typeof eventModalRef.value.closeEvent === 'function') {
        eventModalRef.value.closeEvent();
      }

      eventBus.emit('ui:modal:close', {
        modalId: 'event-modal'
      });

    } catch (error) {
      logger.error('处理事件选择失败', {
        eventId,
        choiceId,
        error: error.message
      });
    }
  };

  /**
   * 应用事件效果
   */
  const applyEventEffects = (effects: any): void => {
    if (!effects) return;

    logger.debug('应用事件效果', { effects });

    // 这里可以扩展各种事件效果的处理
    // 例如：金钱变化、物品获得、属性修改等

    if (effects.money) {
      eventBus.emit('player:money:changed', {
        amount: effects.money,
        previousAmount: 0, // 需要从playerStore获取
        reason: '事件效果'
      });
    }

    if (effects.notification) {
      eventBus.emit('system:notification', {
        type: effects.notification.type || 'info',
        title: effects.notification.title || '事件通知',
        message: effects.notification.message || ''
      });
    }
  };

  /**
   * 设置事件Modal引用
   */
  const setEventModalRef = (modalRef: any): void => {
    eventModalRef.value = modalRef;
    logger.debug('设置事件Modal引用', { hasRef: !!modalRef });
  };

  /**
   * 清理事件系统
   */
  const clearEvents = (): void => {
    logger.info('清理事件系统');

    // 清理事件队列
    if (gameCoreStore.activeEvents) {
      gameCoreStore.activeEvents.length = 0;
    }

    // 重置事件存储
    eventStore.resetEvents();

    // 关闭事件Modal
    if (eventModalRef.value && typeof eventModalRef.value.closeEvent === 'function') {
      eventModalRef.value.closeEvent();
    }
  };

  /**
   * 获取事件统计
   */
  const getEventStats = () => {
    return {
      activeEventCount: (gameCoreStore.activeEvents?.length || 0) + (eventStore.activeEvent ? 1 : 0),
      triggeredEventCount: eventStore.triggeredEvents?.length || 0,
      hasActiveEvent: !!(eventStore.activeEvent || (gameCoreStore.activeEvents?.length > 0))
    };
  };

  return {
    // 引用
    eventModalRef,

    // 方法
    showEvent,
    checkActiveEvents,
    triggerNextEvent,
    triggerTutorialEvent,
    handleEventChoice,
    applyEventEffects,
    setEventModalRef,
    clearEvents,
    getEventStats
  };
}
