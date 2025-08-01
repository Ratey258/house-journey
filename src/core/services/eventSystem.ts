/**
 * 事件系统 - TypeScript版本
 * 管理游戏中的随机事件触发和处理
 */
import { EventType, Event, EventOption, GameState } from '../models/event';
import { getGameConfig, getGamePhaseMultipliers } from './gameConfigService';

// 导入TypeScript版本的EventEmitter
import eventEmitter, { type EventListener, type UnsubscribeFunction } from '@/infrastructure/eventEmitter';

// ==================== 类型定义 ====================

/**
 * 游戏事件类型常量
 */
export enum GameEventType {
  EVENT_TRIGGERED = 'event:triggered',
  EVENT_COMPLETED = 'event:completed',
  EVENT_OPTION_SELECTED = 'event:option_selected',
  EVENT_EFFECTS_APPLIED = 'event:effects_applied'
}

/**
 * 事件效果类型
 */
export enum EventEffectType {
  POSITIVE = 'positive',
  NEGATIVE = 'negative',
  NEUTRAL = 'neutral'
}

/**
 * 事件阶段
 */
export enum EventStage {
  EARLY = 'early',    // 游戏前期（1-15周）
  MID = 'mid',        // 游戏中期（16-35周）
  LATE = 'late'       // 游戏后期（36-52周）
}

/**
 * 事件历史记录接口
 */
export interface EventHistoryRecord {
  id: string;
  triggeredAt: number;
  selectedOption?: number;
  result?: string;
  effects?: any;
  location?: string;
}

/**
 * 活跃事件效果接口
 */
export interface ActiveEventEffect {
  id: string;
  duration: number;
  effects: any;
  source: string;
}

/**
 * 事件冷却时间接口
 */
export interface EventCooldowns {
  [eventId: string]: number;
}

/**
 * 事件系统保存状态接口
 */
export interface EventSystemSaveState {
  triggeredEvents: string[];
  activeEvents: ActiveEventEffect[];
  eventHistory: EventHistoryRecord[];
  cooldowns: EventCooldowns;
}

/**
 * 难度级别类型
 */
export type DifficultyLevel = 'easy' | 'normal' | 'hard';

// ==================== 事件系统类 ====================

export class EventSystem {
  events: Event[];
  triggeredEvents: Set<string>;
  activeEvents: ActiveEventEffect[];
  eventHistory: EventHistoryRecord[];
  cooldowns: EventCooldowns;
  difficultyLevel: DifficultyLevel;

  /**
   * 创建事件系统
   * @param events 所有事件列表
   */
  constructor(events: Event[] = []) {
    this.events = events || [];
    this.triggeredEvents = new Set<string>(); // 已触发过的事件ID
    this.activeEvents = []; // 当前活跃的事件效果
    this.eventHistory = []; // 事件历史记录
    this.cooldowns = {}; // 事件冷却时间
    this.difficultyLevel = 'normal'; // 默认难度
  }

  /**
   * 设置游戏难度
   * @param difficulty 难度级别
   */
  setDifficulty(difficulty: DifficultyLevel): void {
    this.difficultyLevel = difficulty;
  }

  /**
   * 根据游戏阶段生成适当的事件
   * @param gameState 游戏状态
   * @returns 生成的事件，如果没有则返回null
   */
  generateStageAppropriateEvent(gameState: GameState): Event | null {
    console.log('尝试生成阶段适当的事件，当前周数:', gameState.currentWeek);

    const { currentWeek, maxWeeks = 52 } = gameState;

    // 计算游戏进度百分比
    const gameProgress = currentWeek / maxWeeks;

    // 确定游戏阶段
    let currentStage: EventStage;
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
    const currentLocation = (gameState.currentLocation as any)?.id;
    if (currentLocation) {
      const locationEvents = this.eventHistory.filter(record => {
        const event = this.getEventById(record.id);
        return event?.conditions?.locations?.includes(currentLocation);
      });

      // 如果地点事件过多，降低该地点事件的触发概率
      if (locationEvents.length > 3) {
        const locationEventReduction = Math.min(0.8, Math.pow(0.9, locationEvents.length - 3));
        // Note: eventProbability is not defined in the scope, this might be a bug in original code
        // Let's assume it should affect finalEventChance
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
      eventEffectType,
      houseEventModifier
    });

    // 过滤可用事件
    const availableEvents = this.getAvailableEventsForStage(gameState, currentStage, eventEffectType);

    if (availableEvents.length === 0) {
      console.log('没有可用的事件');
      return null;
    }

    // 随机选择一个事件
    const selectedEvent = this.selectRandomEvent(availableEvents);
    console.log('选择的事件:', selectedEvent?.id);

    return selectedEvent;
  }

  /**
   * 获取特定阶段可用的事件
   * @param gameState 游戏状态
   * @param stage 游戏阶段
   * @param effectType 效果类型
   * @returns 可用事件列表
   */
  getAvailableEventsForStage(gameState: GameState, stage: EventStage, effectType: EventEffectType): Event[] {
    return this.events.filter(event => {
      // 检查事件是否满足触发条件
      if (!event.canTrigger(gameState, Array.from(this.triggeredEvents))) {
        return false;
      }

      // 检查冷却时间
      if (this.cooldowns[event.id] && this.cooldowns[event.id] > gameState.currentWeek) {
        return false;
      }

      // 根据游戏阶段筛选
      const conditions = event.conditions;
      if (conditions.minWeek !== null && gameState.currentWeek < conditions.minWeek) {
        return false;
      }
      if (conditions.maxWeek !== null && gameState.currentWeek > conditions.maxWeek) {
        return false;
      }

      // 这里可以根据 effectType 进一步筛选事件
      // 目前简化处理，返回所有满足基本条件的事件
      return true;
    });
  }

  /**
   * 从可用事件中随机选择一个
   * @param events 可用事件列表
   * @returns 选中的事件
   */
  selectRandomEvent(events: Event[]): Event {
    // 根据权重进行加权随机选择
    const totalWeight = events.reduce((sum, event) => sum + event.weight, 0);
    let randomWeight = Math.random() * totalWeight;

    for (const event of events) {
      randomWeight -= event.weight;
      if (randomWeight <= 0) {
        return event;
      }
    }

    // 如果由于浮点精度问题没有选中，返回最后一个
    return events[events.length - 1];
  }

  /**
   * 触发事件
   * @param event 要触发的事件
   * @param gameState 游戏状态
   */
  triggerEvent(event: Event, gameState: GameState): void {
    console.log('触发事件:', event.id, event.title);

    // 记录事件触发
    this.triggeredEvents.add(event.id);
    this.eventHistory.push({
      id: event.id,
      triggeredAt: gameState.currentWeek,
      location: gameState.currentLocation as string
    });

    // 发送事件通知
    eventEmitter.emit(GameEventType.EVENT_TRIGGERED, {
      event,
      gameState
    });
  }

  /**
   * 处理事件选项选择
   * @param event 事件对象
   * @param optionIndex 选择的选项索引
   * @param gameState 游戏状态
   */
  processEventOption(event: Event, optionIndex: number, gameState: GameState): void {
    const option = event.options[optionIndex];
    if (!option) {
      console.error('无效的选项索引:', optionIndex);
      return;
    }

    console.log('处理事件选项:', option.text);

    // 更新事件历史
    const historyRecord = this.eventHistory.find(record => record.id === event.id);
    if (historyRecord) {
      historyRecord.selectedOption = optionIndex;
      historyRecord.result = option.result;
      historyRecord.effects = option.effects;
    }

    // 应用效果
    this.applyEventEffects(option.effects, gameState);

    // 设置冷却时间（如果事件不可重复）
    if (!event.repeatable) {
      this.cooldowns[event.id] = gameState.currentWeek + 10; // 10周冷却
    }

    // 发送事件完成通知
    eventEmitter.emit(GameEventType.EVENT_COMPLETED, {
      event,
      option,
      gameState
    });
  }

  /**
   * 应用事件效果
   * @param effects 事件效果
   * @param gameState 游戏状态
   */
  applyEventEffects(effects: any, gameState: GameState): void {
    console.log('应用事件效果:', effects);

    // 应用金钱变化
    if (effects.money) {
      gameState.player.money += effects.money;
    }

    // 应用债务变化
    if (effects.debt) {
      gameState.player.debt += effects.debt;
    }

    // 应用背包物品变化
    if (effects.inventory && Array.isArray(effects.inventory)) {
      effects.inventory.forEach((item: any) => {
        // 这里需要根据具体的背包系统实现来处理物品变化
        console.log('应用物品变化:', item);
      });
    }

    // 应用属性变化
    if (effects.attributes) {
      for (const [attr, value] of Object.entries(effects.attributes)) {
        if (!gameState.player.attributes) {
          gameState.player.attributes = {};
        }
        gameState.player.attributes[attr] = (gameState.player.attributes[attr] || 0) + (value as number);
      }
    }

    // 应用市场效果
    if (effects.market) {
      this.applyMarketEffects(effects.market, gameState);
    }

    // 处理下一个事件
    if (effects.nextEvent) {
      const nextEvent = this.getEventById(effects.nextEvent);
      if (nextEvent) {
        // 延迟触发下一个事件
        setTimeout(() => {
          this.triggerEvent(nextEvent, gameState);
        }, 1000);
      }
    }

    // 发送效果应用通知
    eventEmitter.emit(GameEventType.EVENT_EFFECTS_APPLIED, {
      effects,
      gameState
    });
  }

  /**
   * 应用市场效果
   * @param marketEffects 市场效果
   * @param gameState 游戏状态
   */
  applyMarketEffects(marketEffects: any, gameState: GameState): void {
    console.log('应用市场效果:', marketEffects);

    // 这里需要根据具体的市场系统实现来处理市场效果
    // 暂时只记录到活跃效果中
    if (marketEffects.duration) {
      this.activeEvents.push({
        id: `market_effect_${Date.now()}`,
        duration: marketEffects.duration,
        effects: marketEffects,
        source: 'event'
      });
    }
  }

  /**
   * 根据ID获取事件
   * @param eventId 事件ID
   * @returns 事件对象或null
   */
  getEventById(eventId: string): Event | null {
    return this.events.find(event => event.id === eventId) || null;
  }

  /**
   * 更新活跃事件效果（每周调用）
   * @param currentWeek 当前周数
   */
  updateActiveEffects(currentWeek: number): void {
    this.activeEvents = this.activeEvents.filter(effect => {
      effect.duration--;
      return effect.duration > 0;
    });

    // 清理过期的冷却时间
    for (const eventId in this.cooldowns) {
      if (this.cooldowns[eventId] <= currentWeek) {
        delete this.cooldowns[eventId];
      }
    }
  }

  /**
   * 获取事件历史记录
   * @param limit 限制返回数量
   * @returns 事件历史记录
   */
  getEventHistory(limit?: number): EventHistoryRecord[] {
    const history = [...this.eventHistory].reverse(); // 最新的在前
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * 清除所有数据（用于新游戏）
   */
  reset(): void {
    this.triggeredEvents.clear();
    this.activeEvents = [];
    this.eventHistory = [];
    this.cooldowns = {};
  }

  /**
   * 获取保存状态
   * @returns 保存状态对象
   */
  getSaveState(): EventSystemSaveState {
    return {
      triggeredEvents: Array.from(this.triggeredEvents),
      activeEvents: this.activeEvents,
      eventHistory: this.eventHistory,
      cooldowns: this.cooldowns
    };
  }

  /**
   * 从保存的状态中加载
   * @param saveState 保存的状态对象
   */
  loadFromSaveState(saveState: EventSystemSaveState): void {
    if (!saveState) return;

    this.triggeredEvents = new Set(saveState.triggeredEvents || []);
    this.activeEvents = saveState.activeEvents || [];
    this.eventHistory = saveState.eventHistory || [];
    this.cooldowns = saveState.cooldowns || {};
  }
}

// ==================== 导出 ====================

export default EventSystem;
