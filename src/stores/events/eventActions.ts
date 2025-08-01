import { useEventStore } from './eventState';
import { usePlayerStore } from '../player';
import { useMarketStore } from '../market';
import type { Event } from '../../core/models/event';

// ==================== 类型定义 ====================

/**
 * 玩家数据接口
 */
export interface PlayerData {
  money: number;
  debt: number;
  inventory: any[];
  statistics: any;
  purchasedHouses: any[];
  [key: string]: any;
}

/**
 * 市场数据接口
 */
export interface MarketData {
  marketModifiers: any;
  currentLocation: string | null;
  productPrices: any;
  products: any[];
  [key: string]: any;
}

/**
 * 事件处理结果接口
 */
export interface EventHandleResult {
  success: boolean;
  message?: string;
  appliedEffects?: EffectResult[];
  failedEffects?: EffectResult[];
  effects?: any;
  [key: string]: any;
}

/**
 * 效果结果接口
 */
export interface EffectResult {
  type: string;
  value?: any;
  effect?: any;
  success: boolean;
  message?: string;
}

/**
 * 状态变化接口
 */
export interface StateChanges {
  money: number;
  debt: number;
  capacity: number;
  inventoryUsed: number;
  inventoryCount: number;
}

/**
 * 状态快照接口
 */
export interface StateSnapshot {
  money: number;
  debt: number;
  capacity: number;
  inventoryUsed: number;
  inventoryCount: number;
}

// ==================== 事件操作模块 ====================

/**
 * 事件操作模块 - TypeScript版本
 * 提供事件相关操作功能
 */
export const useEventActions = () => {
  const eventStore = useEventStore();
  const playerStore = usePlayerStore();
  const marketStore = useMarketStore();

  /**
   * 生成随机事件
   * @param currentWeek 当前周数
   * @returns 生成的事件或null
   */
  const generateRandomEvent = (currentWeek: number): Event | null => {
    // 获取需要的数据
    const playerData: PlayerData = {
      money: (playerStore as any).money,
      debt: (playerStore as any).debt,
      inventory: (playerStore as any).inventory,
      statistics: (playerStore as any).statistics,
      purchasedHouses: (playerStore as any).purchasedHouses
    };

    const marketData: MarketData = {
      marketModifiers: (marketStore as any).marketModifiers,
      currentLocation: (marketStore as any).currentLocation ? (marketStore as any).currentLocation.id : null,
      productPrices: (marketStore as any).productPrices,
      products: (marketStore as any).products // 添加products属性
    };

    // 生成事件
    return eventStore.generateRandomEvent(currentWeek, playerData, marketData);
  };

  /**
   * 处理事件选项
   * @param option 选项对象或选项索引
   * @returns 处理结果
   */
  const handleEventOption = (option: any): EventHandleResult => {
    // 获取当前事件
    const currentEvent = eventStore.currentEvent;
    if (!currentEvent) {
      return { success: false, message: '没有活跃事件' };
    }

    // 确定选项索引
    let selectedOption: number;
    if (typeof option === 'number') {
      selectedOption = option;
    } else if (option && typeof option === 'object' && option.index !== undefined) {
      selectedOption = option.index;
    } else {
      return { success: false, message: '无效的选项参数' };
    }

    // 检查选项是否有效
    if (selectedOption < 0 || selectedOption >= currentEvent.options.length) {
      return { success: false, message: '选项索引超出范围' };
    }

    const selectedEventOption = currentEvent.options[selectedOption];
    const effects = selectedEventOption.effects;

    console.log('EventActions - 处理事件选项:', {
      eventId: currentEvent.id,
      optionIndex: selectedOption,
      optionText: selectedEventOption.text,
      effects: effects
    });

    // 记录处理选项前的状态
    const beforeState: StateSnapshot = {
      money: (playerStore as any).money,
      debt: (playerStore as any).debt,
      capacity: (playerStore as any).capacity,
      inventoryUsed: (playerStore as any).inventoryUsed,
      inventoryCount: (playerStore as any).inventory.length
    };

    console.log('EventActions - 处理选项前状态:', beforeState);

    // 获取玩家和市场数据
    const playerData: PlayerData = {
      money: (playerStore as any).money,
      debt: (playerStore as any).debt,
      inventory: (playerStore as any).inventory,
      statistics: (playerStore as any).statistics,
      purchasedHouses: (playerStore as any).purchasedHouses
    };

    const marketData: MarketData = {
      marketModifiers: (marketStore as any).marketModifiers,
      currentLocation: (marketStore as any).currentLocation,
      productPrices: (marketStore as any).productPrices,
      products: (marketStore as any).products
    };

    // 处理选项
    const result = eventStore.processEventOption(currentEvent.id, selectedOption, playerData, marketData);

    // 处理选项后记录状态
    const afterState: StateSnapshot = {
      money: (playerStore as any).money,
      debt: (playerStore as any).debt,
      capacity: (playerStore as any).capacity,
      inventoryUsed: (playerStore as any).inventoryUsed,
      inventoryCount: (playerStore as any).inventory.length
    };

    console.log('EventActions - 处理选项后状态:', afterState);

    // 计算变化
    const changes: StateChanges = {
      money: afterState.money - beforeState.money,
      debt: afterState.debt - beforeState.debt,
      capacity: afterState.capacity - beforeState.capacity,
      inventoryUsed: afterState.inventoryUsed - beforeState.inventoryUsed,
      inventoryCount: afterState.inventoryCount - beforeState.inventoryCount
    };

    console.log('EventActions - 状态变化:', changes);

    // 确保result是一个对象
    const processedResult: EventHandleResult = result || { success: true };

    // 处理结果
    if (processedResult.success !== false) {
      // 标记为成功
      processedResult.success = true;

      // 确保result有appliedEffects属性
      if (!processedResult.appliedEffects) {
        processedResult.appliedEffects = [];
      }

      // 确保保留失败效果信息
      if (result && (result as any).failedEffects && !processedResult.failedEffects) {
        processedResult.failedEffects = (result as any).failedEffects;
      }

      // 添加状态变化到效果列表
      if (changes.money !== 0 && !processedResult.appliedEffects.some(e => e.type === 'money')) {
        processedResult.appliedEffects.push({
          type: 'money',
          value: changes.money,
          success: true
        });
      }

      if (changes.debt !== 0 && !processedResult.appliedEffects.some(e => e.type === 'debt')) {
        processedResult.appliedEffects.push({
          type: 'debt',
          value: changes.debt,
          success: true
        });
      }

      if (changes.capacity !== 0 && !processedResult.appliedEffects.some(e => e.type === 'capacity')) {
        processedResult.appliedEffects.push({
          type: 'capacity',
          value: changes.capacity,
          success: true
        });
      }

      // 处理市场效果，提供更详细的市场效果信息
      if (effects.market) {
        // 检查是否已经添加了市场效果，避免重复
        if (!processedResult.appliedEffects.some(e => e.type === 'market')) {
          const marketEffect: EffectResult = {
            type: 'market',
            effect: { ...effects.market },
            success: true
          };

          // 确保显示所有市场修改类型
          if (effects.market.modifier ||
              effects.market.categoryModifier ||
              effects.market.locationModifiers ||
              effects.market.duration) {

            processedResult.appliedEffects.push(marketEffect);
          }
        }
      }

      // 处理强制地点变更
      if (processedResult.effects && processedResult.effects.locationChanged && eventStore.needsLocationChange) {
        const targetLocation = eventStore.targetLocationId;
        if (targetLocation) {
          (marketStore as any).changeLocation(targetLocation);
          eventStore.clearForceLocationChange();

          // 添加地点变更效果
          if (!processedResult.appliedEffects.some(e => e.type === 'location')) {
            processedResult.appliedEffects.push({
              type: 'location',
              value: targetLocation,
              success: true
            });
          }
        }
      }
    }

    return processedResult;
  };

  /**
   * 触发特定事件
   * @param eventId 事件ID
   * @param currentWeek 当前周数
   * @returns 是否成功触发
   */
  const triggerSpecificEvent = (eventId: string, currentWeek: number = 1): boolean => {
    try {
      // 检查是否有待处理的事件
      if (eventStore.currentEvent) {
        console.log('EventActions - 已有待处理事件，无法触发新事件');
        return false;
      }

      // 使用eventStore的方法设置下一个事件
      eventStore.nextEventId = eventId;

      // 获取必要的数据
      const playerData: PlayerData = {
        money: (playerStore as any).money,
        debt: (playerStore as any).debt,
        inventory: (playerStore as any).inventory,
        statistics: (playerStore as any).statistics,
        purchasedHouses: (playerStore as any).purchasedHouses
      };

      const marketData: MarketData = {
        marketModifiers: (marketStore as any).marketModifiers,
        currentLocation: (marketStore as any).currentLocation,
        productPrices: (marketStore as any).productPrices,
        products: (marketStore as any).products
      };

      // 生成事件（会优先处理设置的nextEventId）
      const event = eventStore.generateRandomEvent(currentWeek, playerData, marketData);

      return event !== null;
    } catch (error) {
      console.error('EventActions - 触发特定事件失败:', error);
      return false;
    }
  };

  /**
   * 触发教程事件
   * @param currentWeek 当前周数
   * @returns 是否成功触发
   */
  const triggerTutorialEvent = (currentWeek: number = 1): boolean => {
    return triggerSpecificEvent('tutorial_trading', currentWeek);
  };

  /**
   * 获取当前事件
   * @returns 当前事件
   */
  const getCurrentEvent = (): Event | null => {
    return eventStore.currentEvent;
  };

  /**
   * 检查是否有待处理事件
   * @returns 是否有待处理事件
   */
  const hasPendingEvent = (): boolean => {
    return eventStore.currentEvent !== null;
  };

  /**
   * 获取事件统计信息
   * @returns 事件统计信息
   */
  const getEventStatistics = (): any => {
    return eventStore.eventStatistics;
  };

  /**
   * 清除当前事件
   */
  const clearCurrentEvent = (): void => {
    eventStore.activeEvent = null;
  };

  /**
   * 重置事件系统
   */
  const resetEventSystem = (): void => {
    eventStore.resetEvents();
  };

  /**
   * 检查事件是否已触发
   * @param eventId 事件ID
   * @returns 是否已触发
   */
  const hasTriggeredEvent = (eventId: string): boolean => {
    return eventStore.hasTriggeredEvent(eventId);
  };

  /**
   * 获取事件历史记录
   * @returns 事件历史记录
   */
  const getEventHistory = (): any[] => {
    return eventStore.getEventHistory();
  };

  return {
    generateRandomEvent,
    handleEventOption,
    triggerSpecificEvent,
    triggerTutorialEvent,
    getCurrentEvent,
    hasPendingEvent,
    getEventStatistics,
    clearCurrentEvent,
    resetEventSystem,
    hasTriggeredEvent,
    getEventHistory
  };
};
