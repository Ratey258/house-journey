import { useEventStore } from './eventState';
import { usePlayerStore } from '../player';
import { useMarketStore } from '../market';

/**
 * 事件操作模块
 * 提供事件相关操作功能
 */
export const useEventActions = () => {
  const eventStore = useEventStore();
  const playerStore = usePlayerStore();
  const marketStore = useMarketStore();
  
  /**
   * 生成随机事件
   * @param {number} currentWeek - 当前周数
   * @returns {Object|null} 生成的事件或null
   */
  const generateRandomEvent = (currentWeek) => {
    // 获取需要的数据
    const playerData = {
      money: playerStore.money,
      debt: playerStore.debt,
      inventory: playerStore.inventory,
      statistics: playerStore.statistics,
      purchasedHouses: playerStore.purchasedHouses
    };
    
    const marketData = {
      marketModifiers: marketStore.marketModifiers,
      currentLocation: marketStore.currentLocation ? marketStore.currentLocation.id : null,
      productPrices: marketStore.productPrices
    };
    
    // 生成事件
    return eventStore.generateRandomEvent(currentWeek, playerData, marketData);
  };
  
  /**
   * 处理事件选项
   * @param {Object|number} option - 选项对象或选项索引
   * @returns {Object} 处理结果
   */
  const handleEventOption = (option) => {
    // 获取当前事件
    const currentEvent = eventStore.currentEvent;
    if (!currentEvent) {
      return { success: false, message: '没有活跃事件' };
    }
    
    // 如果传入索引，获取对应的选项
    let selectedOption = option;
    if (typeof option === 'number') {
      if (option < 0 || option >= currentEvent.options.length) {
        return { success: false, message: '无效的选项索引' };
      }
      selectedOption = currentEvent.options[option];
    }
    
    // 如果没有提供有效的选项
    if (!selectedOption) {
      return { success: false, message: '无效的选项' };
    }
    
    // 获取需要的数据
    const playerData = playerStore;
    const marketData = marketStore;
    
    // 处理选项前记录状态
    const beforeState = {
      money: playerStore.money,
      debt: playerStore.debt,
      capacity: playerStore.capacity,
      inventoryUsed: playerStore.inventoryUsed,
      inventoryCount: playerStore.inventory.length
    };
    
    console.log('EventActions - 处理选项前状态:', beforeState);
    
    // 处理选项
    const result = eventStore.handleEventOption(selectedOption, playerData, marketData);
    
    // 处理选项后记录状态
    const afterState = {
      money: playerStore.money,
      debt: playerStore.debt,
      capacity: playerStore.capacity,
      inventoryUsed: playerStore.inventoryUsed,
      inventoryCount: playerStore.inventory.length
    };
    
    console.log('EventActions - 处理选项后状态:', afterState);
    
    // 计算变化
    const changes = {
      money: afterState.money - beforeState.money,
      debt: afterState.debt - beforeState.debt,
      capacity: afterState.capacity - beforeState.capacity,
      inventoryUsed: afterState.inventoryUsed - beforeState.inventoryUsed,
      inventoryCount: afterState.inventoryCount - beforeState.inventoryCount
    };
    
    console.log('EventActions - 状态变化:', changes);
    
    // 确保result是一个对象
    const processedResult = result || { success: true };
    
    // 处理结果
    if (processedResult.success !== false) {
      // 标记为成功
      processedResult.success = true;
      
      // 确保result有appliedEffects属性
      if (!processedResult.appliedEffects) {
        processedResult.appliedEffects = [];
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
      
      // 处理强制地点变更
      if (processedResult.effects && processedResult.effects.locationChanged && eventStore.needsLocationChange) {
        const targetLocation = eventStore.targetLocationId;
        if (targetLocation) {
          marketStore.changeLocation(targetLocation);
          eventStore.clearForceLocationChange();
        }
      }
      
      // 如果没有应用任何效果，添加一个空效果
      if (processedResult.appliedEffects.length === 0) {
        processedResult.appliedEffects.push({
          type: 'info',
          description: '选项已执行',
          success: true
        });
      }
    }
    
    return processedResult;
  };
  
  /**
   * 触发特定事件
   * @param {string} eventId - 事件ID
   * @returns {Object|null} 触发的事件
   */
  const triggerSpecificEvent = (eventId) => {
    // 获取需要的数据
    const playerData = {
      money: playerStore.money,
      debt: playerStore.debt,
      inventory: playerStore.inventory,
      statistics: playerStore.statistics,
      purchasedHouses: playerStore.purchasedHouses
    };
    
    const marketData = {
      marketModifiers: marketStore.marketModifiers,
      currentLocation: marketStore.currentLocation ? marketStore.currentLocation.id : null,
      productPrices: marketStore.productPrices
    };
    
    // 触发特定事件
    return eventStore.triggerSpecificEvent(eventId, playerData, marketData);
  };
  
  /**
   * 触发教程事件
   * @param {string} tutorialStep - 教程步骤
   * @returns {Object|null} 触发的教程事件
   */
  const triggerTutorialEvent = (tutorialStep) => {
    return eventStore.triggerTutorialEvent(tutorialStep);
  };
  
  /**
   * 获取当前活跃事件
   * @returns {Object|null} 当前事件
   */
  const getCurrentEvent = () => {
    return eventStore.currentEvent;
  };
  
  /**
   * 检查是否有待处理的事件
   * @returns {boolean} 是否有待处理事件
   */
  const hasPendingEvent = () => {
    return eventStore.currentEvent !== null;
  };
  
  /**
   * 获取事件统计数据
   * @returns {Object} 事件统计
   */
  const getEventStatistics = () => {
    return eventStore.eventStatistics;
  };
  
  return {
    generateRandomEvent,
    handleEventOption,
    triggerSpecificEvent,
    triggerTutorialEvent,
    getCurrentEvent,
    hasPendingEvent,
    getEventStatistics
  };
}; 