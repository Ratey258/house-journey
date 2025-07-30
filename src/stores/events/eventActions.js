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
      productPrices: marketStore.productPrices,
      products: marketStore.products // 添加products属性
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
      console.warn('EventActions - 无法处理空选项');
      return { success: false, message: '无效的选项' };
    }

    try {
      console.log('EventActions - 处理选项:', selectedOption);

      // 获取选项的效果
      const effects = selectedOption.effects || {};

      // 获取需要的数据
      const playerData = playerStore;
      const marketData = {
        ...marketStore,
        products: marketStore.products // 确保传递products属性
      };

      // 调试信息：检查marketData
      console.log('EventActions - 传递的marketData:', {
        hasProducts: !!marketData.products,
        productsCount: marketData.products ? marketData.products.length : 0,
        currentLocation: marketData.currentLocation,
        hasLocations: !!marketData.locations,
        locationsCount: marketData.locations ? marketData.locations.length : 0
      });

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

        // 确保保留失败效果信息
        if (result && result.failedEffects && !processedResult.failedEffects) {
          processedResult.failedEffects = result.failedEffects;
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
            const marketEffect = {
              type: 'market',
              effect: { ...effects.market },
              success: true
            };

            // 确保显示所有市场修改类型
            if (effects.market.globalPriceModifier ||
                effects.market.categoryModifiers ||
                effects.market.productModifiers ||
                effects.market.locationModifiers ||
                effects.market.locationProductModifiers) {

              // 如果需要添加更多详细信息，比如影响的具体商品名称等，可以在这里处理
              // 但要避免信息过多导致UI显示问题

              processedResult.appliedEffects.push(marketEffect);
            }
          }
        }

        // 处理强制地点变更
        if (processedResult.effects && processedResult.effects.locationChanged && eventStore.needsLocationChange) {
          const targetLocation = eventStore.targetLocationId;
          if (targetLocation) {
            marketStore.changeLocation(targetLocation);
            eventStore.clearForceLocationChange();

            // 添加地点变更效果
            processedResult.appliedEffects.push({
              type: 'info',
              description: `已前往${getLocationName(targetLocation)}`,
              success: true
            });
          }
        }

        // 如果没有应用任何效果，添加一个空效果
        if (processedResult.appliedEffects.length === 0) {
          processedResult.appliedEffects.push({
            type: 'info',
            description: '选项已执行，但没有产生直接效果',
            success: true
          });
        }
      }

      return processedResult;
    } catch (error) {
      console.error('EventActions - 处理选项出错:', error);
      return {
        success: false,
        message: '处理选项时出错: ' + (error.message || '未知错误'),
        appliedEffects: [{
          type: 'error',
          description: '处理选项失败: ' + (error.message || '未知错误'),
          success: false
        }]
      };
    }
  };

  // 获取地点名称
  const getLocationName = (locationId) => {
    const locationMap = {
      'commodity_market': '大宗商品市场',
      'second_hand_market': '二手市场',
      'premium_mall': '高端商场',
      'electronics_hub': '电子产品中心',
      'black_market': '黑市'
    };
    return locationMap[locationId] || locationId;
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
      productPrices: marketStore.productPrices,
      products: marketStore.products // 添加products属性
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
