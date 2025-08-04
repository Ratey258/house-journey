/**
 * 事件系统
 * 管理游戏中的随机事件触发和处理
 */
import { EventType } from '../models/event';
import eventEmitter from '@/infrastructure/eventEmitter';
import { getGameConfig, getGamePhaseMultipliers } from './gameConfigService';

// 游戏事件类型常量
export const GameEventType = {
  EVENT_TRIGGERED: 'event:triggered',
  EVENT_COMPLETED: 'event:completed',
  EVENT_OPTION_SELECTED: 'event:option_selected',
  EVENT_EFFECTS_APPLIED: 'event:effects_applied'
};

// 事件效果类型
export const EventEffectType = {
  POSITIVE: 'positive',
  NEGATIVE: 'negative',
  NEUTRAL: 'neutral'
};

// 事件阶段
export const EventStage = {
  EARLY: 'early',    // 游戏前期（1-15周）
  MID: 'mid',        // 游戏中期（16-35周）
  LATE: 'late'       // 游戏后期（36-52周）
};

export class EventSystem {
  /**
   * 创建事件系统
   * @param {Array} events 所有事件列表
   */
  constructor(events) {
    this.events = events || [];
    this.triggeredEvents = new Set(); // 已触发过的事件ID
    this.activeEvents = []; // 当前活跃的事件效果
    this.eventHistory = []; // 事件历史记录
    this.cooldowns = {}; // 事件冷却时间
    this.difficultyLevel = 'normal'; // 默认难度
  }

  /**
   * 设置游戏难度
   * @param {string} difficulty 难度级别
   */
  setDifficulty(difficulty) {
    this.difficultyLevel = difficulty;
  }

  /**
   * 根据游戏阶段生成适当的事件
   * @param {Object} gameState 游戏状态
   * @returns {Object|null} 生成的事件，如果没有则返回null
   */
  generateStageAppropriateEvent(gameState) {
    console.log('尝试生成阶段适当的事件，当前周数:', gameState.currentWeek);

    const { currentWeek, maxWeeks = 52 } = gameState;

    // 计算游戏进度百分比
    const gameProgress = currentWeek / maxWeeks;

    // 确定游戏阶段
    let currentStage;
    if (gameProgress < 0.3) {
      currentStage = EventStage.EARLY;
    } else if (gameProgress < 0.7) {
      currentStage = EventStage.MID;
    } else {
      currentStage = EventStage.LATE;
    }
    console.log('当前游戏阶段:', currentStage, '进度:', gameProgress);

    // 获取游戏配置和阶段修正
    const config = getGameConfig(this.difficultyLevel);
    const phaseMultipliers = getGamePhaseMultipliers(currentWeek, maxWeeks);

    // 计算事件触发概率
    const baseEventChance = config.events.eventFrequency * 1.8; // 提高基础事件频率1.8倍
    const stageMultiplier = phaseMultipliers.eventMultiplier * 1.3; // 提高阶段乘数1.3倍
    const finalEventChance = Math.min(0.95, baseEventChance * stageMultiplier); // 限制最大概率为95%

    console.log('事件触发概率计算:', {
      baseEventChance,
      stageMultiplier,
      finalEventChance
    });

    // 决定是否触发事件
    const randomValue = Math.random();
    const shouldTriggerEvent = randomValue <= finalEventChance;
    console.log(`随机值: ${randomValue}, 是否触发事件: ${shouldTriggerEvent}`);

    if (!shouldTriggerEvent) {
      return null;
    }

    // 调整正面/负面事件比例和地点事件概率
    let positiveChance = config.events.positiveEventChance;

    // 游戏前期增加正面事件概率，后期增加负面事件概率
    if (currentStage === EventStage.EARLY) {
      positiveChance *= 1.3; // 增加30%正面事件概率
    } else if (currentStage === EventStage.LATE) {
      positiveChance *= 0.8; // 减少20%正面事件概率
    }

    // 获取当前地点已触发的事件数量
    const currentLocation = gameState.currentLocation?.id;
    if (currentLocation) {
      const locationEvents = this.eventHistory.filter(record => {
        const event = this.getEventById(record.id);
        return event?.conditions?.locations?.includes(currentLocation);
      });

      // 如果地点事件过多，降低该地点事件的触发概率
      if (locationEvents.length > 3) {
        const locationEventReduction = Math.min(0.8, Math.pow(0.9, locationEvents.length - 3));
        eventProbability *= locationEventReduction;
      }
    }

    // 根据玩家资金情况额外调整事件类型
    if (gameState.player.money < 5000) {
      positiveChance *= 1.2; // 玩家资金少时增加正面事件机会
    } else if (gameState.player.money > 100000) {
      positiveChance *= 0.9; // 玩家资金多时略微降低正面事件机会
    }

    // 根据玩家是否拥有房产调整房产相关事件概率
    let houseEventModifier = 1.0;
    const hasHouse = gameState.player.attributes?.hasHouse || false;
    const propertyValue = gameState.player.attributes?.propertyValue || 0;

    if (!hasHouse && propertyValue < 1000 && currentWeek > 20) {
      // 游戏中后期还没有房产，增加房产事件概率
      houseEventModifier = 1.5;
    } else if (hasHouse || propertyValue > 50000) {
      // 已经有房产或投资，降低房产事件概率
      houseEventModifier = 0.7;
    }

    // 确定事件效果类型
    const eventEffectType = Math.random() < positiveChance ?
      EventEffectType.POSITIVE : EventEffectType.NEGATIVE;

    console.log('事件类型确定:', {
      positiveChance,
      eventEffectType
    });

    // 筛选适合当前阶段的事件
    const eligibleEvents = this.events.filter(event => {
      // 检查是否在冷却中
      if (this.isEventInCooldown(event.id, currentWeek)) {
        return false;
      }

      // 检查是否已触发过且不可重复
      if (event.repeatable === false && this.triggeredEvents.has(event.id)) {
        return false;
      }

      // 根据事件类型筛选
      if (eventEffectType === EventEffectType.POSITIVE && event.effectType === EventEffectType.NEGATIVE) {
        return false;
      }
      if (eventEffectType === EventEffectType.NEGATIVE && event.effectType === EventEffectType.POSITIVE) {
        return false;
      }

      // 根据游戏阶段筛选
      if (event.gameStage) {
        if (event.gameStage === EventStage.EARLY && currentStage !== EventStage.EARLY) return false;
        if (event.gameStage === EventStage.MID && currentStage !== EventStage.MID) return false;
        if (event.gameStage === EventStage.LATE && currentStage !== EventStage.LATE) return false;
      }

      // 应用房产事件调整
      if (event.id.startsWith('property_') && Math.random() > houseEventModifier) {
        return false;
      }

      // 检查事件触发条件
      return this.checkEventConditions(event, gameState);
    });

    console.log(`筛选后的符合条件事件数量: ${eligibleEvents.length}`);

    if (eligibleEvents.length === 0) {
      return null;
    }

    // 使用权重选择事件
    const selectedEvent = this.selectEventByWeight(eligibleEvents, gameProgress);
    console.log('选择的事件:', selectedEvent ? selectedEvent.id : 'null');

    return selectedEvent;
  }

  /**
   * 检查当前是否应该触发事件
   * @param {Object} gameState 游戏状态
   * @param {string} eventType 事件类型，如果不指定则检查所有类型
   * @returns {Object|null} 触发的事件，如果没有则返回null
   */
  checkForEvents(gameState, eventType = null) {
    console.log('事件系统 - 检查是否触发事件, 当前周数:', gameState.currentWeek);
    console.log('事件系统 - 当前地点:', gameState.currentLocation ? gameState.currentLocation.id : '未知');

    // 根据地点获取事件触发概率
    let eventProbability = 0.6; // 提高默认概率从0.3到0.6
    if (gameState.currentLocation && gameState.currentLocation.eventProbability) {
      eventProbability = gameState.currentLocation.eventProbability * 1.5; // 增加地点事件概率的1.5倍
      console.log(`事件系统 - 当前地点事件触发概率: ${eventProbability}`);
    }

    // 根据游戏进度增加事件概率
    const gameProgress = Math.min(1.0, (gameState.currentWeek || 1) / 52);
    const progressBonus = gameProgress * 0.2; // 提高游戏后期加成从0.1到0.2
    eventProbability += progressBonus;

    // 确保概率不超过0.95
    eventProbability = Math.min(0.95, eventProbability);

    // 随机数决定是否触发事件
    const roll = Math.random();
    console.log(`事件系统 - 事件随机检定: ${roll.toFixed(2)} vs ${eventProbability.toFixed(2)} (触发阈值)`);

    // 如果指定了事件类型，使用传统方式检查
    if (eventType) {
      // 获取符合条件的事件
      const eligibleEvents = this.getEligibleEvents(gameState, eventType);
      console.log(`事件系统 - 找到 ${eligibleEvents.length} 个符合条件的 ${eventType} 类型事件`);

      if (eligibleEvents.length === 0) return null;

      // 按权重选择事件
      const selectedEvent = this.selectEventByWeight(eligibleEvents, gameProgress);

      if (selectedEvent) {
        console.log('事件系统 - 已选择事件:', selectedEvent.id, selectedEvent.title);
        this.recordEvent(selectedEvent.id, gameState.currentWeek);

        eventEmitter.emit(GameEventType.EVENT_TRIGGERED, {
          event: selectedEvent,
          week: gameState.currentWeek
        });
      }

      return selectedEvent;
    }

    // 否则使用新的基于阶段的事件生成
    let event;

    // 根据概率决定是否生成事件
    if (roll < eventProbability && this.events.length > 0) {
      // 获取所有符合条件的事件
      const allEligibleEvents = this.getEligibleEvents(gameState);
      console.log(`事件系统 - 找到 ${allEligibleEvents.length} 个符合条件的事件`);

      if (allEligibleEvents.length > 0) {
        // 按权重选择事件
        event = this.selectEventByWeight(allEligibleEvents, gameProgress);
        console.log('事件系统 - 选择事件:', event ? event.id : '无');
      } else {
        console.log('事件系统 - 没有找到符合条件的事件');
        return null;
      }
    } else {
      console.log(`事件系统 - 随机检定未通过，本周不触发事件`);
      return null;
    }

    if (event) {
      console.log('事件系统 - 生成事件成功:', event.id, event.title);
      this.recordEvent(event.id, gameState.currentWeek);

      eventEmitter.emit(GameEventType.EVENT_TRIGGERED, {
        event: event,
        week: gameState.currentWeek
      });
    } else {
      console.log('事件系统 - 没有生成事件');
    }

    return event;
  }

  /**
   * 获取符合当前条件的事件列表
   * @param {Object} gameState 游戏状态
   * @param {string} eventType 事件类型，如果不指定则检查所有类型
   * @returns {Array} 符合条件的事件列表
   */
  getEligibleEvents(gameState, eventType = null) {
    return this.events.filter(event => {
      // 如果指定了事件类型，只选择该类型的事件
      if (eventType && event.type !== eventType) {
        return false;
      }

      // 检查事件是否在冷却中
      if (this.isEventInCooldown(event.id, gameState.currentWeek)) {
        return false;
      }

      // 检查事件是否已触发过且不可重复
      if (event.repeatable === false && this.triggeredEvents.has(event.id)) {
        return false;
      }

      // 统计该事件在最近10周内出现的次数
      const recentOccurrences = this.eventHistory.filter(
        record => record.id === event.id &&
        (gameState.currentWeek - record.week) <= 10
      ).length;

      // 如果最近出现次数过多，大幅降低其再次出现的概率
      if (recentOccurrences >= 2 && Math.random() > 0.3) {
        return false;
      }

      // 检查事件触发条件
      return this.checkEventConditions(event, gameState);
    });
  }

  /**
   * 检查事件是否满足触发条件
   * @param {Object} event 事件对象
   * @param {Object} gameState 游戏状态
   * @returns {boolean} 是否满足触发条件
   */
  checkEventConditions(event, gameState) {
    const conditions = event.conditions || {};

    // 检查周数条件
    if (conditions.minWeek && gameState.currentWeek < conditions.minWeek) {
      return false;
    }
    if (conditions.maxWeek && gameState.currentWeek > conditions.maxWeek) {
      return false;
    }

    // 检查地点条件
    if (conditions.locations &&
        gameState.currentLocation &&
        !conditions.locations.includes(gameState.currentLocation.id)) {
      return false;
    }

    // 检查玩家金钱条件
    if (conditions.playerMoney) {
      const { min, max } = conditions.playerMoney;
      if (min !== undefined && gameState.player.money < min) return false;
      if (max !== undefined && gameState.player.money > max) return false;
    }

    // 检查玩家债务条件
    if (conditions.playerDebt) {
      const { min, max } = conditions.playerDebt;
      if (min !== undefined && gameState.player.debt < min) return false;
      if (max !== undefined && gameState.player.debt > max) return false;
    }

    // 检查物品条件
    if (conditions.inventoryItems) {
      for (const itemCond of conditions.inventoryItems) {
        const inventoryItem = gameState.player.inventory.find(
          item => item.productId === itemCond.productId
        );

        const quantity = inventoryItem ? inventoryItem.quantity : 0;

        if (itemCond.minQuantity !== undefined && quantity < itemCond.minQuantity) return false;
        if (itemCond.maxQuantity !== undefined && quantity > itemCond.maxQuantity) return false;
      }
    }

    // 检查属性条件
    if (conditions.attributes) {
      for (const [attr, { min, max }] of Object.entries(conditions.attributes)) {
        const value = gameState.player.attributes?.[attr] || 0;
        if (min !== undefined && value < min) return false;
        if (max !== undefined && value > max) return false;
      }
    }

    // 检查必需的前置事件
    if (conditions.requiredEvents) {
      for (const requiredEvent of conditions.requiredEvents) {
        if (!this.triggeredEvents.has(requiredEvent)) return false;
      }
    }

    // 检查排除的事件
    if (conditions.excludedEvents) {
      for (const excludedEvent of conditions.excludedEvents) {
        if (this.triggeredEvents.has(excludedEvent)) return false;
      }
    }

    // 检查自定义条件
    if (conditions.customCondition && !conditions.customCondition(gameState)) {
      return false;
    }

    // 概率筛选 - 提高通过概率
    if (conditions.probability !== undefined) {
      // 未触发过的事件增加通过概率
      let adjustedProbability = conditions.probability;
      const hasTriggered = this.triggeredEvents.has(event.id);

      if (!hasTriggered) {
        // 未触发过的事件，概率提高50%，但不超过0.95
        adjustedProbability = Math.min(0.95, adjustedProbability * 1.5);
      }

      if (Math.random() > adjustedProbability) {
        return false;
      }
    }

    return true;
  }

  /**
   * 检查事件是否在冷却中
   * @param {string} eventId 事件ID
   * @param {number} currentWeek 当前周数
   * @returns {boolean} 是否在冷却中
   */
  isEventInCooldown(eventId, currentWeek) {
    if (!this.cooldowns[eventId]) return false;
    return this.cooldowns[eventId] > currentWeek;
  }

  /**
   * 设置事件冷却期
   * @param {string} eventId 事件ID
   * @param {number} currentWeek 当前周数
   * @param {number} cooldownWeeks 冷却周数
   */
  setEventCooldown(eventId, currentWeek, cooldownWeeks = 5) { // 增加默认冷却时间从3周到5周
    this.cooldowns[eventId] = currentWeek + cooldownWeeks;
  }

  /**
   * 记录事件触发
   * @param {string} eventId 事件ID
   * @param {number} week 触发周数
   */
  recordEvent(eventId, week) {
    // 添加到已触发事件集合
    this.triggeredEvents.add(eventId);

    // 添加到历史记录
    this.eventHistory.push({
      id: eventId,
      week,
      timestamp: new Date().toISOString()
    });

    // 设置冷却期
    const event = this.getEventById(eventId);
    let cooldownWeeks;

    // 根据事件类型设置不同的冷却时间
    switch (event?.type) {
      case EventType.PERSONAL:
        cooldownWeeks = 6; // 个人事件冷却从8周减少到6周
        break;
      case EventType.MARKET:
        cooldownWeeks = 3; // 市场事件冷却从4周减少到3周
        break;
      case EventType.LOCATION:
        cooldownWeeks = 2; // 地点事件冷却从3周减少到2周
        break;
      default:
        cooldownWeeks = 4; // 其他事件默认冷却从6周减少到4周
    }

    // 非重复事件标记为永久冷却
    if (event && !event.repeatable) {
      cooldownWeeks = 999;
    }

    this.setEventCooldown(eventId, week, cooldownWeeks);
  }

  /**
   * 根据权重选择一个事件
   * @param {Array} events 可选事件列表
   * @param {number} gameProgress 游戏进度百分比
   * @returns {Object} 选中的事件
   */
  selectEventByWeight(events, gameProgress = 0.5) {
    if (!events || events.length === 0) return null;

    // 总权重计算
    let totalWeight = 0;
    const eventWeights = events.map(event => {
      // 基础权重
      let weight = event.weight || 1;

      // 根据事件类型调整权重
      if (event.type === EventType.STORY) {
        weight *= 1.2; // 提高故事事件权重
      } else if (event.type === EventType.MARKET) {
        weight *= 1.1; // 略微提高市场事件权重
      }

      // 根据游戏阶段调整特定事件类型权重
      if (event.id.startsWith('property_') && gameProgress > 0.4) {
        weight *= 1 + gameProgress; // 游戏后期增加房产事件权重
      }

      // 为连锁事件增加权重
      if (event.options && event.options.some(opt => opt.effects && opt.effects.nextEvent)) {
        weight *= 1.3; // 连锁事件有更高权重
      }

      // 彩蛋事件已禁用
      if (event.id === 'meet_mucs') {
        return 0; // 直接返回0权重，确保彩蛋事件不会被触发
      }

      // 检查事件是否已触发过
      if (this.triggeredEvents.has(event.id)) {
        // 已触发过的事件权重大幅降低
        weight *= 0.2; // 从0.3降低到0.2，进一步降低已触发过事件的权重
      } else {
        // 从未触发过的事件权重增加
        weight *= 2.0; // 从1.2提高到2.0，大幅提高未触发事件的权重
      }

      // 记录当前事件在历史记录中出现的次数
      const occurrenceCount = this.eventHistory.filter(record => record.id === event.id).length;

      // 根据历史出现次数和重复属性调整权重
      if (occurrenceCount > 0) {
        // 不可重复的事件直接返回0权重
        if (!event.repeatable) {
          return 0;
        }

        // 可重复事件根据出现次数调整权重
        const baseReduction = 0.5; // 基础衰减率从0.4提高到0.5，减少重复事件的衰减
        const maxReduction = 0.2; // 最低保留权重比例从0.1提高到0.2

        // 使用指数衰减，但保留最低权重
        const reduction = Math.max(maxReduction, Math.pow(baseReduction, occurrenceCount));
        weight *= reduction;
      }

      console.log(`事件权重计算 - ${event.id}: ${weight.toFixed(2)}`);

      totalWeight += weight;
      return weight;
    });

    // 如果总权重为0，可能所有事件都不适合触发
    if (totalWeight <= 0) {
      return null;
    }

    // 随机选择
    let random = Math.random() * totalWeight;
    for (let i = 0; i < events.length; i++) {
      random -= eventWeights[i];
      if (random <= 0) {
        return events[i];
      }
    }

    // 默认返回第一个
    return events[0];
  }

  /**
   * 根据ID获取事件
   * @param {string} eventId 事件ID
   * @returns {Object|null} 事件对象，如果不存在则返回null
   */
  getEventById(eventId) {
    const event = this.events.find(event => event.id === eventId);
    return event ? this.prepareEvent(event) : null;
  }

  /**
   * 触发特定事件
   * @param {string} eventId 事件ID
   * @param {Object} gameState 游戏状态
   * @returns {Object|null} 事件对象，如果不存在则返回null
   */
  triggerSpecificEvent(eventId, gameState) {
    const event = this.getEventById(eventId);
    if (!event) return null;

    this.recordEvent(eventId, gameState.currentWeek);

    // 使用eventEmitter通知事件触发
    eventEmitter.emit(GameEventType.EVENT_TRIGGERED, {
      event,
      week: gameState.currentWeek,
      isSpecific: true
    });

    return event;
  }

  /**
   * 准备事件，添加必要的计算属性
   * @param {Object} event 原始事件对象
   * @returns {Object} 准备好的事件对象
   */
  prepareEvent(event) {
    if (!event) return null;

    // 创建事件副本，避免修改原始数据
    const preparedEvent = { ...event };

    // 处理选项
    if (preparedEvent.options) {
      preparedEvent.options = preparedEvent.options.map(option => {
        // 处理选项文本
        if (typeof option.text === 'function') {
          option.displayText = option.text();
        } else {
          option.displayText = option.text;
        }

        return option;
      });
    }

    return preparedEvent;
  }

  /**
   * 更新活跃事件状态
   * @returns {Array} 当前活跃的事件效果
   */
  updateActiveEvents() {
    // 移除已过期的事件效果
    this.activeEvents = this.activeEvents.filter(effect => !effect.expired);

    // 检查事件是否已过期
    const now = Date.now();
    this.activeEvents.forEach(effect => {
      if (effect.expiryTime && now > effect.expiryTime) {
        effect.expired = true;
      }
    });

    return this.activeEvents;
  }

  /**
   * 获取当前活跃的市场修正因子
   * @returns {Object} 市场修正因子
   */
  getActiveMarketModifiers() {
    // 更新活跃事件
    this.updateActiveEvents();

    // 初始化修正因子
    const modifiers = {
      globalPriceModifier: 1,
      categoryModifiers: {},
      productModifiers: {},
      specialProducts: []
    };

    // 应用所有活跃事件的修正因子
    this.activeEvents.forEach(effect => {
      if (effect.expired) return;

      // 全局价格修正
      if (effect.globalPriceModifier) {
        modifiers.globalPriceModifier *= effect.globalPriceModifier;
      }

      // 类别价格修正
      if (effect.categoryModifiers) {
        Object.entries(effect.categoryModifiers).forEach(([category, modifier]) => {
          modifiers.categoryModifiers[category] = (modifiers.categoryModifiers[category] || 1) * modifier;
        });
      }

      // 产品价格修正
      if (effect.productModifiers) {
        Object.entries(effect.productModifiers).forEach(([productId, modifier]) => {
          modifiers.productModifiers[productId] = (modifiers.productModifiers[productId] || 1) * modifier;
        });
      }

      // 特殊产品
      if (effect.specialProducts) {
        modifiers.specialProducts = [...modifiers.specialProducts, ...effect.specialProducts];
      }
    });

    return modifiers;
  }

  /**
   * 应用事件效果
   * @param {Object} gameState 游戏状态
   * @param {Object} effects 效果对象
   * @returns {Object} 应用后的效果结果
   */
  applyEventEffects(gameState, effects) {
    const result = {
      appliedEffects: [],
      failedEffects: []
    };

    console.log("应用事件效果:", effects);

        // 处理金钱效果
    if (effects.money !== undefined) {
      const moneyChange = effects.money;

      // 检查是否为百分比变化（大于-1且小于1的小数）
      if (moneyChange > -1 && moneyChange < 1 && moneyChange !== 0) {
        // 百分比变化
        if (moneyChange > 0) {
          // 按百分比增加金钱 - 兼容Vue 3响应式系统
          const currentMoney = this._getReactiveValue(gameState.player.money);
          const percentChange = moneyChange * currentMoney;
          this._setReactiveValue(gameState.player, 'money', currentMoney + percentChange);

          result.appliedEffects.push({
            type: 'money',
            value: percentChange,
            isPercentage: true,
            percentage: moneyChange * 100,
            success: true
          });
        } else {
          // 按百分比减少金钱 - 兼容Vue 3响应式系统
          const currentMoney = this._getReactiveValue(gameState.player.money);
          const percentChange = moneyChange * currentMoney;

          if (currentMoney + percentChange < 0) {
            // 金钱不足，扣除全部
            this._setReactiveValue(gameState.player, 'money', 0);

            result.appliedEffects.push({
              type: 'money',
              value: -currentMoney,
              isPercentage: true,
              percentage: Math.abs(moneyChange) * 100,
              success: true
            });
          } else {
            // 金钱足够，正常扣款
            this._setReactiveValue(gameState.player, 'money', currentMoney + percentChange);
            result.appliedEffects.push({
              type: 'money',
              value: percentChange,
              isPercentage: true,
              percentage: Math.abs(moneyChange) * 100,
              success: true
            });
          }
        }
      } else {
        // 固定金额变化
        if (moneyChange > 0) {
          // 增加金钱 - 兼容Vue 3响应式系统
          const currentMoney = this._getReactiveValue(gameState.player.money);
          this._setReactiveValue(gameState.player, 'money', currentMoney + moneyChange);

          result.appliedEffects.push({
            type: 'money',
            value: moneyChange,
            success: true
          });
        } else if (moneyChange < 0) {
          // 减少金钱 - 兼容Vue 3响应式系统
          const currentMoney = this._getReactiveValue(gameState.player.money);
          if (currentMoney + moneyChange < 0) {
            // 金钱不足，放弃扣款，事件处理失败
            console.warn('EventSystem - 金钱不足，无法扣款', {
              required: Math.abs(moneyChange),
              available: currentMoney
            });

            result.failedEffects.push({
              type: 'money',
              value: moneyChange,
              reason: 'insufficient_funds'
            });
          } else {
            // 金钱足够，正常扣款
            this._setReactiveValue(gameState.player, 'money', currentMoney + moneyChange);
            result.appliedEffects.push({
              type: 'money',
              value: moneyChange,
              success: true
            });
          }
        }
      }
    }

    // 处理债务效果
    if (effects.debt !== undefined) {
      const debtChange = effects.debt;

      if (debtChange > 0) {
        // 增加债务 - 兼容Vue 3响应式系统
        const currentDebt = this._getReactiveValue(gameState.player.debt);
        this._setReactiveValue(gameState.player, 'debt', currentDebt + debtChange);

        result.appliedEffects.push({
          type: 'debt',
          value: debtChange,
          success: true
        });
      } else if (debtChange < 0) {
        // 减少债务 - 兼容Vue 3响应式系统
        const currentDebt = this._getReactiveValue(gameState.player.debt);

        // 检查是否为百分比减免（小于1的负数）
        if (debtChange > -1 && debtChange < 0) {
          // 计算百分比减免金额
          const percentReduction = Math.abs(debtChange) * currentDebt;
          const actualReduction = Math.min(currentDebt, percentReduction);
          this._setReactiveValue(gameState.player, 'debt', currentDebt - actualReduction);

          result.appliedEffects.push({
            type: 'debt',
            value: -actualReduction,
            isPercentage: true,
            percentage: Math.abs(debtChange) * 100,
            success: true
          });
        } else {
          // 固定金额减免
          const actualReduction = Math.min(currentDebt, Math.abs(debtChange));
          this._setReactiveValue(gameState.player, 'debt', currentDebt - actualReduction);

          result.appliedEffects.push({
            type: 'debt',
            value: -actualReduction,
            success: true
          });
        }
      }
    }

    // 处理物品效果
    if (effects.items) {
      // 注意：这里不直接操作库存，而是通过eventItemHandler来处理
      // 物品处理逻辑已移至src/stores/events/eventItemHandler.js
      // 在eventState.js中会调用eventItemHandler来处理物品
      effects.items.forEach(item => {
        if (item.quantity > 0) {
          // 添加物品 - 在eventState.js中处理
          // 这里只记录需要添加的物品信息
          console.log('EventSystem - 处理物品添加:', {
            productId: item.productId,
            quantity: item.quantity,
            price: item.price || 0,
            gameStateProducts: gameState.products ? `包含${gameState.products.length}个产品` : '无产品列表'
          });

          // 尝试将productId转换为数字
          const productIdNum = Number(item.productId);
          const productIdStr = String(item.productId);

          // 尝试多种方式查找产品
          let product = null;
          if (gameState.products) {
            // 尝试精确匹配
            product = gameState.products.find(p => p.id === item.productId);

            // 尝试数字匹配
            if (!product && !isNaN(productIdNum)) {
              product = gameState.products.find(p => p.id === productIdNum);
            }

            // 尝试字符串匹配
            if (!product) {
              product = gameState.products.find(p => String(p.id) === productIdStr);
            }
          }

          console.log('EventSystem - 找到产品:', product ? {
            id: product.id,
            name: product.name,
            category: product.category
          } : 'null');

          if (product) {
            // 检查背包容量
            const requiredSpace = product.size * item.quantity;
            if (gameState.player.inventoryUsed + requiredSpace <= gameState.player.capacity) {
              // 记录需要添加的物品
              console.log('EventSystem - 添加物品效果:', {
                type: 'item_add',
                productId: product.id, // 使用找到的产品ID
                quantity: item.quantity,
                price: item.price || 0
              });

              result.appliedEffects.push({
                type: 'item_add',
                productId: product.id, // 使用找到的产品ID
                quantity: item.quantity,
                price: item.price || 0,
                success: true
              });
            } else {
              // 背包容量不足
              result.failedEffects.push({
                type: 'item_add',
                productId: item.productId,
                quantity: item.quantity,
                reason: 'inventory_full'
              });
            }
          } else {
            // 商品不存在
            result.failedEffects.push({
              type: 'item_add',
              productId: item.productId,
              quantity: item.quantity,
              reason: 'product_not_found'
            });
          }
        } else if (item.quantity < 0) {
          // 移除物品 - 在eventState.js中处理
          // 这里只记录需要移除的物品信息
          if (item.productId) {
            // 记录需要移除的物品
            result.appliedEffects.push({
              type: 'item_remove',
              productId: item.productId,
              quantity: Math.abs(item.quantity),
              success: true
            });
          } else if (item.category) {
            // 记录需要按类别移除的物品
            result.appliedEffects.push({
              type: 'item_remove_category',
              category: item.category,
              quantity: Math.abs(item.quantity),
              success: true
            });
          }
        }
      });
    }

    // 处理背包容量效果
    if (effects.capacity) {
      // 增加背包容量 - 兼容Vue 3响应式系统
      const currentCapacity = this._getReactiveValue(gameState.player.capacity);
      this._setReactiveValue(gameState.player, 'capacity', currentCapacity + effects.capacity);

      result.appliedEffects.push({
        type: 'capacity',
        value: effects.capacity,
        success: true
      });
    }

    // 处理属性效果
    if (effects.attributes && Object.keys(effects.attributes).length > 0) {
      // 确保属性对象存在 - 兼容Vue 3响应式系统
      let currentAttributes = this._getReactiveValue(gameState.player.attributes);
      if (!currentAttributes) {
        currentAttributes = {};
        this._setReactiveValue(gameState.player, 'attributes', currentAttributes);
      }

      // 应用每个属性变化
      for (const [key, value] of Object.entries(effects.attributes)) {
        const oldValue = currentAttributes[key] || 0;

        // 如果attributes是响应式对象，直接设置属性
        if (currentAttributes && typeof currentAttributes === 'object') {
          currentAttributes[key] = value;
        } else {
          // 重新设置整个attributes对象
          const newAttributes = { ...currentAttributes, [key]: value };
          this._setReactiveValue(gameState.player, 'attributes', newAttributes);
        }

        result.appliedEffects.push({
          type: 'attribute',
          attribute: key,
          oldValue: oldValue,
          newValue: value,
          success: true
        });
      }
    }

    // 处理市场效果
    if (effects.market) {
      // 添加临时市场修正因子
      const marketEffect = {
        ...effects.market,
        startTime: Date.now(),
        // 将持续时间从周转换为毫秒，如果没有指定持续时间，默认为两周
        expiryTime: effects.market.duration ?
          Date.now() + effects.market.duration * 7 * 24 * 60 * 60 * 1000 : // 周转毫秒
          Date.now() + 1209600000, // 默认两周(14天 * 24小时 * 60分 * 60秒 * 1000毫秒)
        expired: false
      };

      this.activeEvents.push(marketEffect);

      // 立即应用市场效果到当前价格
      if (gameState.market && gameState.market.productPrices) {
        // 应用全局修正因子
        if (marketEffect.globalPriceModifier) {
          console.log(`应用全局价格修正: ${marketEffect.globalPriceModifier}`);

          // 修改所有产品价格
          for (const [productId, price] of Object.entries(gameState.market.productPrices)) {
            gameState.market.productPrices[productId] *= marketEffect.globalPriceModifier;
          }
        }

        // 应用类别修正因子
        if (marketEffect.categoryModifiers) {
          for (const [category, modifier] of Object.entries(marketEffect.categoryModifiers)) {
            console.log(`应用类别 ${category} 价格修正: ${modifier}`);

            // 找到该类别的所有产品
            const categoryProducts = gameState.products?.filter(p => p.category === category) || [];

            // 修改这些产品的价格
            for (const product of categoryProducts) {
              if (gameState.market.productPrices[product.id]) {
                gameState.market.productPrices[product.id] *= modifier;
              }
            }
          }
        }

        // 应用产品修正因子
        if (marketEffect.productModifiers) {
          for (const [productId, modifier] of Object.entries(marketEffect.productModifiers)) {
            console.log(`应用产品 ${productId} 价格修正: ${modifier}`);

            if (gameState.market.productPrices[productId]) {
              gameState.market.productPrices[productId] *= modifier;
            }
          }
        }
      }

      // 确保只添加一次市场效果
      if (!result.appliedEffects.some(effect => effect.type === 'market')) {
        result.appliedEffects.push({
          type: 'market',
          effect: {
            globalPriceModifier: marketEffect.globalPriceModifier,
            categoryModifiers: marketEffect.categoryModifiers,
            productModifiers: marketEffect.productModifiers,
            locationModifiers: marketEffect.locationModifiers,
            locationProductModifiers: marketEffect.locationProductModifiers,
            duration: marketEffect.duration
          },
          success: true
        });
      }
    }

    // 处理后续事件
    if (effects.nextEvent) {
      result.appliedEffects.push({
        type: 'next_event',
        eventId: effects.nextEvent,
        success: true
      });
    }

    // 处理地点变更
    if (effects.locationChange) {
      result.appliedEffects.push({
        type: 'location_change',
        locationId: effects.locationChange,
        success: true
      });
    }

    // 使用eventEmitter通知事件效果已应用
    eventEmitter.emit(GameEventType.EVENT_EFFECTS_APPLIED, {
      effects: result.appliedEffects,
      failedEffects: result.failedEffects
    });

    return result;
  }

  /**
   * 重置事件系统
   */
  reset() {
    this.triggeredEvents.clear();
    this.activeEvents = [];
    this.eventHistory = [];
    this.cooldowns = {};
  }

  /**
   * 获取可保存的状态
   * @returns {Object} 可保存的状态对象
   */
  getSaveState() {
    return {
      triggeredEvents: Array.from(this.triggeredEvents),
      activeEvents: this.activeEvents,
      eventHistory: this.eventHistory,
      cooldowns: this.cooldowns
    };
  }

  /**
   * 从保存的状态中加载
   * @param {Object} saveState 保存的状态对象
   */
  loadFromSaveState(saveState) {
    if (!saveState) return;

    this.triggeredEvents = new Set(saveState.triggeredEvents || []);
    this.activeEvents = saveState.activeEvents || [];
    this.eventHistory = saveState.eventHistory || [];
    this.cooldowns = saveState.cooldowns || {};
  }

  /**
   * 获取响应式值 - 兼容Vue 3的ref和reactive
   * @param {any} value 可能是ref、reactive或普通值
   * @returns {any} 实际值
   */
  _getReactiveValue(value) {
    // 检查是否是Vue 3的ref对象
    if (value && typeof value === 'object' && 'value' in value && typeof value.value !== 'undefined') {
      return value.value;
    }
    // 普通值直接返回
    return value;
  }

  /**
   * 设置响应式值 - 兼容Vue 3的ref和reactive
   * @param {Object} target 目标对象
   * @param {string} key 属性名
   * @param {any} newValue 新值
   */
  _setReactiveValue(target, key, newValue) {
    const property = target[key];

    // 检查是否是Vue 3的ref对象
    if (property && typeof property === 'object' && 'value' in property && typeof property.value !== 'undefined') {
      property.value = newValue;
    } else {
      // 普通对象或reactive对象
      target[key] = newValue;
    }
  }
}
