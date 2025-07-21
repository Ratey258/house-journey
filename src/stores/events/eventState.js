import { defineStore } from 'pinia';
import { getAllEvents } from '@/core/models/event';
import { EventSystem, GameEventType } from '@/core/services/eventSystem';
import eventEmitter from '@/infrastructure/eventEmitter';
import { handleError, ErrorType, ErrorSeverity } from '@/infrastructure/utils/errorHandler';

/**
 * 事件状态管理
 * 负责事件的触发和处理
 */
export const useEventStore = defineStore('event', {
  state: () => ({
    activeEvents: [],
    activeEvent: null,
    forceLocationChange: false,
    targetLocation: null,
    nextEventId: null,
    triggeredEvents: [],
    eventSystem: null
  }),
  
  actions: {
    /**
     * 初始化事件系统
     * @returns {Promise} 初始化完成的Promise
     */
    initializeEvents() {
      console.log('EventStore - 初始化事件系统');
      
      return new Promise((resolve) => {
        // 模拟加载过程
        setTimeout(() => {
          this.initEventSystem();
          console.log('EventStore - 事件系统初始化完成');
          resolve();
        }, 300);
      });
    },
    
    /**
     * 初始化事件系统
     */
    initEventSystem() {
      this.eventSystem = new EventSystem(getAllEvents());
      this.activeEvents = [];
      this.activeEvent = null;
      this.forceLocationChange = false;
      this.targetLocation = null;
      this.nextEventId = null;
      this.triggeredEvents = [];
      
      // 订阅事件系统的事件
      this.setupEventListeners();
    },
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
      // 监听事件触发
      eventEmitter.on(GameEventType.EVENT_TRIGGERED, (data) => {
        this.activeEvent = data.event;
      });
      
      // 监听事件完成
      eventEmitter.on(GameEventType.EVENT_COMPLETED, (data) => {
        this.activeEvent = null;
        
        // 处理后续事件
        if (data.nextEventId) {
          this.nextEventId = data.nextEventId;
        }
      });
      
      // 监听事件效果应用
      eventEmitter.on(GameEventType.EVENT_EFFECTS_APPLIED, (data) => {
        // 处理地点变更效果
        const locationChangeEffect = data.effects.find(effect => effect.type === 'location_change');
        if (locationChangeEffect) {
          this.forceLocationChange = true;
          this.targetLocation = locationChangeEffect.locationId;
        }
        
        // 处理后续事件
        const nextEventEffect = data.effects.find(effect => effect.type === 'next_event');
        if (nextEventEffect) {
          this.nextEventId = nextEventEffect.eventId;
        }
      });
    },
    
    /**
     * 重置事件状态
     */
    resetEvents() {
      if (this.eventSystem) {
        this.eventSystem.reset();
      } else {
        this.initEventSystem();
      }
      
      this.activeEvents = [];
      this.activeEvent = null;
      this.forceLocationChange = false;
      this.targetLocation = null;
      this.nextEventId = null;
      this.triggeredEvents = [];
    },
    
    /**
     * 生成随机事件
     * @param {number} currentWeek - 当前周数
     * @param {Object} playerData - 玩家数据
     * @param {Object} marketData - 市场数据
     * @returns {Object|null} 生成的事件，如果没有生成则返回null
     */
    generateRandomEvent(currentWeek, playerData, marketData) {
      console.log('EventStore - 尝试生成随机事件, 当前周数:', currentWeek);
      
      // 已经有待处理的事件，优先处理
      if (this.activeEvent !== null) {
        console.log('EventStore - 已有待处理事件，跳过生成:', this.activeEvent.id);
        return null;
      }
      
      // 如果有预设的下一个事件，优先触发
      if (this.nextEventId) {
        console.log('EventStore - 检测到预设的下一个事件:', this.nextEventId);
        const nextEvent = this.eventSystem.getEventById(this.nextEventId);
        this.nextEventId = null;
        
        if (nextEvent) {
          console.log('EventStore - 触发预设事件:', nextEvent.id, nextEvent.title);
          // 记录事件触发
          this.triggeredEvents.push({
            id: nextEvent.id,
            week: currentWeek
          });
          
          // 将事件加入活跃事件列表
          this.activeEvent = nextEvent;
          return nextEvent;
        }
      }
      
      // 创建游戏状态对象
      console.log('EventStore - 创建游戏状态对象');
      console.log('EventStore - playerData:', playerData ? '已提供' : '未提供');
      console.log('EventStore - marketData:', marketData ? '已提供' : '未提供');
      
      try {
        const gameState = {
          currentWeek,
          player: playerData,
          market: marketData,
          currentLocation: marketData.currentLocation
        };
          
        console.log('EventStore - 游戏状态对象创建成功');
        console.log('EventStore - 当前地点:', gameState.currentLocation ? gameState.currentLocation.id : '未知');
        
        // 特殊处理：尝试触发彩蛋事件
        const randomValue = Math.random();
        const easterEggChance = 0.15; // 15%的概率尝试触发彩蛋事件
        
        if (randomValue < easterEggChance) {
          console.log('EventStore - 尝试触发彩蛋事件');
          const easterEggEvent = this.eventSystem.getEventById('meet_mucs');
          
          if (easterEggEvent && this.eventSystem.checkEventConditions(easterEggEvent, gameState)) {
            console.log('EventStore - 成功触发彩蛋事件:', easterEggEvent.id, easterEggEvent.title);
            
            // 记录触发的事件
            this.triggeredEvents.push({
              id: easterEggEvent.id,
              week: currentWeek
            });
            
            // 将事件设置为活跃事件
            this.activeEvent = easterEggEvent;
            return easterEggEvent;
          }
        }
        
        // 计算额外的事件触发概率
        const extraEventChance = Math.min(0.3, currentWeek * 0.01); // 随着游戏周数增加，额外增加事件概率
      
        // 使用事件系统检查是否应该触发事件
        console.log('EventStore - 调用事件系统检查事件，额外概率:', extraEventChance);
        let randomEvent = this.eventSystem.checkForEvents(gameState);
        
        // 如果没有生成事件，但随机数小于额外概率，则强制生成一个事件
        if (!randomEvent && Math.random() < extraEventChance) {
          console.log('EventStore - 应用额外概率，强制尝试生成事件');
          // 再次尝试生成事件，使用更宽松的条件
          randomEvent = this.eventSystem.generateStageAppropriateEvent(gameState);
        }
      
        if (randomEvent) {
          console.log('EventStore - 成功生成事件:', randomEvent.id, randomEvent.title);
          
          // 记录触发的事件
          this.triggeredEvents.push({
            id: randomEvent.id,
            week: currentWeek
          });
        
          // 将事件设置为活跃事件
          this.activeEvent = randomEvent;
          return randomEvent;
        } else {
          console.log('EventStore - 没有生成事件');
          return null;
        }
      } catch (error) {
        handleError(error, 'EventState.generateRandomEvent', ErrorType.GAME_LOGIC, ErrorSeverity.ERROR);
        console.error('EventStore - 生成随机事件时出错:', error);
        return null;
      }
    },
    
    /**
     * 触发特定事件
     * @param {string} eventId - 事件ID
     * @param {Object} playerData - 玩家数据
     * @param {Object} marketData - 市场数据
     * @returns {Object|null} 触发的事件，如果事件不存在则返回null
     */
    triggerSpecificEvent(eventId, playerData, marketData) {
      // 创建游戏状态对象
      const gameState = {
        currentWeek: playerData.statistics.weekCount,
        player: playerData,
        market: marketData,
        currentLocation: marketData.currentLocation
      };
      
      // 使用事件系统触发特定事件
      const event = this.eventSystem.triggerSpecificEvent(eventId, gameState);
      
      if (event) {
        // 记录触发的事件
        this.triggeredEvents.push({
          id: event.id,
          week: playerData.statistics.weekCount
        });
        
        return event;
      }
      
      return null;
    },
    
    /**
     * 触发教程事件
     * @param {string} eventId - 教程事件ID
     * @returns {Object|null} 触发的事件，如果事件不存在则返回null
     */
    triggerTutorialEvent(eventId) {
      // 教程事件通常有特殊前缀
      const tutorialEventId = eventId.startsWith('tutorial_') ? eventId : `tutorial_${eventId}`;
      const event = this.eventSystem.getEventById(tutorialEventId);
      
      if (event) {
        this.activeEvent = event;
        return event;
      }
      
      return null;
    },
    
    /**
     * 通用事件触发方法
     * @param {string} eventId - 事件ID
     * @returns {boolean} 是否成功触发
     */
    triggerEvent(eventId) {
      try {
        // 如果是教程事件
        if (eventId.startsWith('tutorial_')) {
          const event = this.triggerTutorialEvent(eventId);
          return !!event;
        } 
        // 否则尝试作为普通事件触发
        else {
          // 由于没有playerData和marketData参数，我们只能简单地获取事件
          const event = this.eventSystem?.getEventById(eventId);
          if (event) {
            this.activeEvent = event;
            return true;
          }
        }
        return false;
      } catch (error) {
        handleError(error, 'EventState.triggerEvent', ErrorType.GAME_LOGIC, ErrorSeverity.WARNING);
        console.error('触发事件失败:', error);
        return false;
      }
    },
    
    /**
     * 处理事件选项选择
     * @param {Object} option - 选择的选项
     * @param {Object} playerData - 玩家数据
     * @param {Object} marketData - 市场数据
     * @returns {Object} 选项效果
     */
    handleEventOption(option, playerData, marketData) {
      if (!this.activeEvent || !option) {
        return { success: false, message: '无效的事件或选项', appliedEffects: [] };
      }
      
      console.log('EventState - 处理事件选项:', option);
      console.log('EventState - 当前事件:', this.activeEvent.id);
      
      // 创建游戏状态对象
      const gameState = {
        currentWeek: playerData.statistics.weekCount,
        player: playerData,
        market: marketData,
        currentLocation: marketData.currentLocation,
        products: marketData.products
      };
      
      // 使用事件系统应用效果
      let result;
      try {
        result = this.eventSystem.applyEventEffects(gameState, option.effects);
      console.log('EventState - 事件效果应用结果:', result);
      } catch (error) {
        console.error('EventState - 应用事件效果时出错:', error);
        handleError(error, 'EventState.handleEventOption', ErrorType.GAME_LOGIC, ErrorSeverity.ERROR);
        result = { 
          success: false, 
          message: '应用事件效果时出错',
          appliedEffects: []
        };
      }
      
      // 确保返回对象具有必要的属性
      const processedResult = result || { success: true, appliedEffects: [] };
      if (typeof processedResult.success === 'undefined') {
        processedResult.success = true;
      }
      if (!processedResult.appliedEffects) {
        processedResult.appliedEffects = [];
      }
      
      // 处理下一个事件
      if (option.effects && option.effects.nextEvent) {
        this.nextEventId = option.effects.nextEvent;
        console.log('EventState - 设置下一个事件:', this.nextEventId);
      }
      
      // 处理强制地点变更
      if (option.effects && option.effects.forceLocationChange) {
        this.forceLocationChange = true;
        this.targetLocation = option.effects.targetLocation;
        console.log('EventState - 设置强制地点变更:', this.targetLocation);
      }
      
      // 处理背包容量变化
      if (option.effects && option.effects.capacity && option.effects.capacity > 0) {
        console.log('EventState - 背包容量增加:', option.effects.capacity);
        playerData.capacity += option.effects.capacity;
        
        // 添加到应用效果列表
        if (!processedResult.appliedEffects.some(e => e.type === 'capacity')) {
          processedResult.appliedEffects.push({
            type: 'capacity',
            value: option.effects.capacity,
            success: true
          });
        }
      }
      
      // 处理属性变化
      if (option.effects && option.effects.attributes) {
        console.log('EventState - 玩家属性变化:', option.effects.attributes);
        if (!playerData.attributes) {
          playerData.attributes = {};
        }
        
        // 应用每个属性变化
        for (const [key, value] of Object.entries(option.effects.attributes)) {
          const oldValue = playerData.attributes[key];
          playerData.attributes[key] = value;
          
          // 添加到应用效果列表
          processedResult.appliedEffects.push({
            type: 'attribute',
            attribute: key,
            oldValue: oldValue,
            newValue: value,
            success: true
          });
        }
      }
      
      // 更新市场数据以反映事件效果
      if (marketData && processedResult.appliedEffects) {
        // 检查是否有市场效果
        const marketEffects = processedResult.appliedEffects.filter(effect => effect.type === 'market');
        if (marketEffects.length > 0) {
          console.log('EventState - 应用市场效果到市场数据');
          
          // 重新计算所有商品价格
          if (typeof marketData.calculateAllPrices === 'function') {
            marketData.calculateAllPrices();
          } else if (typeof marketData.updatePrices === 'function') {
            marketData.updatePrices();
          }
        }
      }
      
      // 事件处理完成，通知事件完成
      eventEmitter.emit(GameEventType.EVENT_COMPLETED, {
        eventId: this.activeEvent.id,
        optionId: option.id,
        nextEventId: this.nextEventId,
        effects: processedResult.appliedEffects
      });
      
      // 清除当前事件
      this.activeEvent = null;
      
      return processedResult;
    },
    
    /**
     * 获取当前活跃的市场修正因子
     * @returns {Object} 市场修正因子
     */
    getActiveMarketModifiers() {
      if (!this.eventSystem) return {};
      return this.eventSystem.getActiveMarketModifiers();
    },
    
    /**
     * 清除强制地点变更标记
     */
    clearForceLocationChange() {
      this.forceLocationChange = false;
      this.targetLocation = null;
    },
    
    /**
     * 清除下一个事件标记
     */
    clearNextEvent() {
      this.nextEventId = null;
    }
  },
  
  getters: {
    /**
     * 获取当前事件
     * @returns {Object|null} 当前事件
     */
    currentEvent(state) {
      return state.activeEvent;
    },
    
    /**
     * 是否需要地点变更
     * @returns {boolean} 是否需要地点变更
     */
    needsLocationChange(state) {
      return state.forceLocationChange;
    },
    
    /**
     * 目标地点ID
     * @returns {string|null} 目标地点ID
     */
    targetLocationId(state) {
      return state.targetLocation;
    },
    
    /**
     * 事件统计信息
     * @returns {Object} 事件统计信息
     */
    eventStatistics(state) {
      if (!state.eventSystem) return { total: 0, byType: {} };
      
      const total = state.triggeredEvents.length;
      const byType = {};
      
      // 按类型统计事件
      state.triggeredEvents.forEach(event => {
        const fullEvent = state.eventSystem.getEventById(event.id);
        if (fullEvent) {
          const type = fullEvent.type || 'unknown';
          byType[type] = (byType[type] || 0) + 1;
        }
      });
      
      return { total, byType };
    }
  }
}); 