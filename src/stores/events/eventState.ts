import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAllEvents, type Event, type EventOption, type GameState } from '../../core/models/event';
import { EventSystem, GameEventType } from '../../core/services/eventSystem';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';
import { useEventItemHandler } from './eventItemHandler';

// ==================== 类型定义 ====================

/**
 * 触发事件记录接口
 */
export interface TriggeredEventRecord {
  id: string;
  week: number;
  [key: string]: any;
}

/**
 * 事件统计接口
 */
export interface EventStatistics {
  total: number;
  byType: Record<string, number>;
}

/**
 * 事件状态接口
 */
export interface EventState {
  activeEvents: Event[];
  activeEvent: Event | null;
  forceLocationChange: boolean;
  targetLocation: string | null;
  nextEventId: string | null;
  triggeredEvents: TriggeredEventRecord[];
  eventSystem: EventSystem | null;
}

// 导入TypeScript版本的EventEmitter
import eventEmitter from '@/infrastructure/eventEmitter';

// ==================== Store定义 ====================

/**
 * 事件状态管理Store
 * 负责事件的触发和处理 - TypeScript版本
 */
export const useEventStore = defineStore('event', () => {
  // ==================== 状态 ====================

  const activeEvents = ref<Event[]>([]);
  const activeEvent = ref<Event | null>(null);
  const forceLocationChange = ref(false);
  const targetLocation = ref<string | null>(null);
  const nextEventId = ref<string | null>(null);
  const triggeredEvents = ref<TriggeredEventRecord[]>([]);
  const eventSystem = ref<EventSystem | null>(null);

  // ==================== 计算属性 ====================

  /**
   * 获取当前事件
   */
  const currentEvent = computed(() => activeEvent.value);

  /**
   * 是否需要地点变更
   */
  const needsLocationChange = computed(() => forceLocationChange.value);

  /**
   * 目标地点ID
   */
  const targetLocationId = computed(() => targetLocation.value);

  /**
   * 事件统计信息
   */
  const eventStatistics = computed((): EventStatistics => {
    if (!eventSystem.value) return { total: 0, byType: {} };

    const total = triggeredEvents.value.length;
    const byType: Record<string, number> = {};

    // 按类型统计事件
    triggeredEvents.value.forEach(event => {
      const fullEvent = eventSystem.value!.getEventById(event.id);
      if (fullEvent) {
        const type = fullEvent.type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      }
    });

    return { total, byType };
  });

  // ==================== 方法 ====================

  /**
   * 初始化事件系统
   * @returns 初始化完成的Promise
   */
  const initializeEvents = (): Promise<void> => {
    console.log('EventStore - 初始化事件系统');

    return new Promise((resolve) => {
      // 模拟加载过程
      setTimeout(() => {
        initEventSystem();
        console.log('EventStore - 事件系统初始化完成');
        resolve();
      }, 300);
    });
  };

  /**
   * 初始化事件系统
   */
  const initEventSystem = (): void => {
    eventSystem.value = new EventSystem(getAllEvents());
    activeEvents.value = [];
    activeEvent.value = null;
    forceLocationChange.value = false;
    targetLocation.value = null;
    nextEventId.value = null;
  };

  /**
   * 生成随机事件
   * @param currentWeek 当前周数
   * @param playerData 玩家数据
   * @param marketData 市场数据
   * @returns 生成的事件，如果没有生成则返回null
   */
  const generateRandomEvent = (
    currentWeek: number,
    playerData: any,
    marketData: any
  ): Event | null => {
    console.log('EventStore - 尝试生成随机事件, 当前周数:', currentWeek);

    // 已经有待处理的事件，优先处理
    if (activeEvent.value !== null) {
      console.log('EventStore - 已有待处理事件，跳过生成:', activeEvent.value.id);
      return null;
    }

    // 如果有预设的下一个事件，优先触发
    if (nextEventId.value) {
      console.log('EventStore - 检测到预设的下一个事件:', nextEventId.value);
      const nextEvent = eventSystem.value?.getEventById(nextEventId.value);
      nextEventId.value = null;

      if (nextEvent) {
        console.log('EventStore - 触发预设事件:', nextEvent.id, nextEvent.title);
        // 记录事件触发
        triggeredEvents.value.push({
          id: nextEvent.id,
          week: currentWeek
        });

        // 将事件加入活跃事件列表
        activeEvent.value = nextEvent;
        return nextEvent;
      }
    }

    // 创建游戏状态对象
    console.log('EventStore - 创建游戏状态对象');
    console.log('EventStore - playerData:', playerData ? '已提供' : '未提供');
    console.log('EventStore - marketData:', marketData ? '已提供' : '未提供');

    try {
      const gameState: GameState = {
        currentWeek,
        maxWeeks: 52,
        player: playerData,
        market: marketData,
        currentLocation: marketData.currentLocation
      };

      console.log('EventStore - 游戏状态对象创建成功');
      console.log('EventStore - 当前地点:', gameState.currentLocation ?
        (gameState.currentLocation as any).id : '未知');

      // 特殊处理：尝试触发彩蛋事件
      const randomValue = Math.random();
      const easterEggChance = 0.15; // 15%的概率尝试触发彩蛋事件

      if (randomValue < easterEggChance) {
        console.log('EventStore - 尝试触发彩蛋事件');
        const easterEggEvent = eventSystem.value?.getEventById('meet_mucs');

        if (easterEggEvent && easterEggEvent.canTrigger(gameState, triggeredEvents.value.map(e => e.id))) {
          console.log('EventStore - 成功触发彩蛋事件:', easterEggEvent.id, easterEggEvent.title);

          // 记录触发的事件
          triggeredEvents.value.push({
            id: easterEggEvent.id,
            week: currentWeek
          });

          // 将事件设置为活跃事件
          activeEvent.value = easterEggEvent;
          return easterEggEvent;
        }
      }

      // 计算额外的事件触发概率
      const extraEventChance = Math.min(0.3, currentWeek * 0.01); // 随着游戏周数增加，额外增加事件概率

      // 使用事件系统检查是否应该触发事件
      console.log('EventStore - 调用事件系统检查事件，额外概率:', extraEventChance);
      let randomEvent = eventSystem.value?.generateStageAppropriateEvent(gameState) || null;

      // 如果没有生成事件，但随机数小于额外概率，则强制生成一个事件
      if (!randomEvent && Math.random() < extraEventChance) {
        console.log('EventStore - 应用额外概率，强制尝试生成事件');
        // 再次尝试生成事件，使用更宽松的条件
        randomEvent = eventSystem.value?.generateStageAppropriateEvent(gameState) || null;
      }

      if (randomEvent) {
        console.log('EventStore - 生成随机事件成功:', randomEvent.id, randomEvent.title);

        // 记录触发的事件
        triggeredEvents.value.push({
          id: randomEvent.id,
          week: currentWeek
        });

        // 将事件设置为活跃事件
        activeEvent.value = randomEvent;

        // 发送事件触发通知
        eventEmitter.emit(GameEventType.EVENT_TRIGGERED, {
          event: randomEvent,
          week: currentWeek
        });

        return randomEvent;
      } else {
        console.log('EventStore - 没有生成随机事件');
        return null;
      }

    } catch (error) {
      handleError(error as Error, 'EventStore (generateRandomEvent)');
      console.error('EventStore - 生成随机事件时发生错误:', error);
      return null;
    }
  };

  /**
   * 处理事件选项
   * @param eventId 事件ID
   * @param optionIndex 选项索引
   * @param playerData 玩家数据
   * @param marketData 市场数据
   * @returns 处理结果
   */
  const processEventOption = (
    eventId: string,
    optionIndex: number,
    playerData: any,
    marketData: any
  ): any => {
    console.log('EventStore - 处理事件选项:', eventId, '选项索引:', optionIndex);

    try {
      const event = eventSystem.value?.getEventById(eventId);
      if (!event) {
        console.error('EventStore - 找不到事件:', eventId);
        return null;
      }

      const option = event.options[optionIndex];
      if (!option) {
        console.error('EventStore - 找不到事件选项:', eventId, optionIndex);
        return null;
      }

      console.log('EventStore - 选择的选项:', option.text);

      // 创建游戏状态对象
      const gameState: GameState = {
        currentWeek: 0, // 这里应该从其他地方获取当前周数
        maxWeeks: 52,
        player: playerData,
        market: marketData,
        currentLocation: marketData.currentLocation
      };

      // 应用事件效果
      const effects = applyEventEffects(option, gameState);

      // 清除当前事件
      activeEvent.value = null;

      // 发送事件完成通知
      eventEmitter.emit(GameEventType.EVENT_COMPLETED, {
        event,
        option,
        effects
      });

      console.log('EventStore - 事件选项处理完成');
      return effects;

    } catch (error) {
      handleError(error as Error, 'EventStore (processEventOption)');
      console.error('EventStore - 处理事件选项时发生错误:', error);
      return null;
    }
  };

  /**
   * 应用事件效果
   * @param option 事件选项
   * @param gameState 游戏状态
   * @returns 应用的效果
   */
  const applyEventEffects = (option: EventOption, gameState: GameState): any => {
    console.log('EventStore - 应用事件效果:', option.effects);

    try {
      const effects = option.effects;
      const result: any = {};

      // 处理金钱变化
      if (effects.money) {
        result.money = effects.money;
        console.log('EventStore - 金钱变化:', effects.money);
      }

      // 处理债务变化
      if (effects.debt) {
        result.debt = effects.debt;
        console.log('EventStore - 债务变化:', effects.debt);
      }

      // 处理物品变化
      if (effects.inventory && Array.isArray(effects.inventory)) {
        result.inventory = effects.inventory;
        console.log('EventStore - 物品变化:', effects.inventory);
      }

      // 处理属性变化
      if (effects.attributes) {
        result.attributes = effects.attributes;
        console.log('EventStore - 属性变化:', effects.attributes);
      }

      // 处理地点变更
      if (effects.location) {
        forceLocationChange.value = true;
        targetLocation.value = effects.location;
        result.forceLocationChange = true;
        result.targetLocation = effects.location;
        console.log('EventStore - 强制地点变更到:', effects.location);
      }

      // 处理下一个事件
      if (effects.nextEvent) {
        nextEventId.value = effects.nextEvent;
        result.nextEvent = effects.nextEvent;
        console.log('EventStore - 设置下一个事件:', effects.nextEvent);
      }

      // 处理市场效果
      if (effects.market) {
        result.marketEffects = effects.market;
        console.log('EventStore - 市场效果:', effects.market);
      }

      return result;

    } catch (error) {
      handleError(error as Error, 'EventStore (applyEventEffects)');
      console.error('EventStore - 应用事件效果时发生错误:', error);
      return {};
    }
  };

  /**
   * 重置事件状态
   */
  const resetEvents = (): void => {
    console.log('EventStore - 重置事件状态');

    if (!eventSystem.value) {
      initEventSystem();
    }

    activeEvents.value = [];
    activeEvent.value = null;
    forceLocationChange.value = false;
    targetLocation.value = null;
    nextEventId.value = null;
    triggeredEvents.value = [];
  };

  /**
   * 获取活跃的市场修正因子
   * @returns 市场修正因子
   */
  const getActiveMarketModifiers = (): any => {
    if (!eventSystem.value) return {};
    // 这里应该调用EventSystem的相应方法
    return {};
  };

  /**
   * 清除强制地点变更标记
   */
  const clearForceLocationChange = (): void => {
    forceLocationChange.value = false;
    targetLocation.value = null;
  };

  /**
   * 清除下一个事件标记
   */
  const clearNextEvent = (): void => {
    nextEventId.value = null;
  };

  /**
   * 检查事件是否已触发
   * @param eventId 事件ID
   * @returns 是否已触发
   */
  const hasTriggeredEvent = (eventId: string): boolean => {
    return triggeredEvents.value.some(event => event.id === eventId);
  };

  /**
   * 获取事件历史
   * @returns 事件历史记录
   */
  const getEventHistory = (): TriggeredEventRecord[] => {
    return [...triggeredEvents.value];
  };

  // ==================== 返回 ====================

  return {
    // 状态
    activeEvents,
    activeEvent,
    forceLocationChange,
    targetLocation,
    nextEventId,
    triggeredEvents,
    eventSystem,

    // 计算属性
    currentEvent,
    needsLocationChange,
    targetLocationId,
    eventStatistics,

    // 方法
    initializeEvents,
    initEventSystem,
    generateRandomEvent,
    processEventOption,
    applyEventEffects,
    resetEvents,
    getActiveMarketModifiers,
    clearForceLocationChange,
    clearNextEvent,
    hasTriggeredEvent,
    getEventHistory
  };
});
