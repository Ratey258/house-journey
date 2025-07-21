import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useGameCoreStore } from '../../../src/stores/gameCore';

// 模拟依赖的store
vi.mock('../../../src/stores/player', () => {
  const playerStore = {
    initializePlayer: vi.fn(),
    updateWeeklyPlayerState: vi.fn(),
    netWorth: 10000,
    money: 5000,
    debt: 2000,
    hasHighestHouse: false
  };
  
  return {
    usePlayerStore: vi.fn(() => playerStore)
  };
});

vi.mock('../../../src/stores/market', () => {
  const marketStore = {
    initializeMarket: vi.fn(),
    updateMarketState: vi.fn()
  };
  
  return {
    useMarketStore: vi.fn(() => marketStore)
  };
});

vi.mock('../../../src/stores/events', () => {
  const eventStore = {
    resetEvents: vi.fn(),
    generateRandomEvent: vi.fn()
  };
  
  return {
    useEventStore: vi.fn(() => eventStore)
  };
});

describe('GameCore Store', () => {
  beforeEach(() => {
    // 创建新的Pinia实例用于测试
    setActivePinia(createPinia());
    
    // 重置所有模拟
    vi.clearAllMocks();
  });
  
  describe('初始状态', () => {
    it('应该有正确的默认值', () => {
      const store = useGameCoreStore();
      
      expect(store.currentWeek).toBe(1);
      expect(store.maxWeeks).toBe(52);
      expect(store.gameStarted).toBe(false);
      expect(store.gamePaused).toBe(false);
      expect(store.gameOver).toBe(false);
      expect(store.gameResult).toBe(null);
      expect(store.notifications).toEqual([]);
    });
  });
  
  describe('startNewGame', () => {
    it('应正确初始化游戏状态', () => {
      const store = useGameCoreStore();
      const playerStore = require('../../../src/stores/player').usePlayerStore();
      const marketStore = require('../../../src/stores/market').useMarketStore();
      const eventStore = require('../../../src/stores/events').useEventStore();
      
      store.startNewGame('测试玩家');
      
      // 验证游戏状态
      expect(store.currentWeek).toBe(1);
      expect(store.gameStarted).toBe(true);
      expect(store.gamePaused).toBe(false);
      expect(store.gameOver).toBe(false);
      expect(store.gameResult).toBe(null);
      
      // 验证依赖store的方法被调用
      expect(playerStore.initializePlayer).toHaveBeenCalledWith('测试玩家');
      expect(marketStore.initializeMarket).toHaveBeenCalled();
      expect(eventStore.resetEvents).toHaveBeenCalled();
    });
  });
  
  describe('advanceWeek', () => {
    it('应递增周数并更新游戏状态', () => {
      const store = useGameCoreStore();
      const playerStore = require('../../../src/stores/player').usePlayerStore();
      const marketStore = require('../../../src/stores/market').useMarketStore();
      const eventStore = require('../../../src/stores/events').useEventStore();
      
      // 初始化游戏
      store.startNewGame('测试玩家');
      
      // 清除初始化时的调用记录
      vi.clearAllMocks();
      
      // 进入下一周
      const result = store.advanceWeek();
      
      // 验证结果
      expect(result).toBe(true);
      expect(store.currentWeek).toBe(2);
      
      // 验证依赖store的方法被调用
      expect(playerStore.updateWeeklyPlayerState).toHaveBeenCalledWith(2);
      expect(marketStore.updateMarketState).toHaveBeenCalledWith(2);
      expect(eventStore.generateRandomEvent).toHaveBeenCalledWith(2);
    });
    
    it('当达到最大周数时应结束游戏', () => {
      const store = useGameCoreStore();
      
      // 初始化游戏
      store.startNewGame('测试玩家');
      
      // 设置周数接近最大值
      store.currentWeek = 51;
      
      // 进入下一周
      const result = store.advanceWeek();
      
      // 验证结果
      expect(result).toBe(true);
      expect(store.currentWeek).toBe(52);
      
      // 再次尝试进入下一周
      const finalResult = store.advanceWeek();
      
      // 验证游戏结束
      expect(finalResult).toBe(false);
      expect(store.gameOver).toBe(true);
      expect(store.gameResult).not.toBe(null);
      expect(store.gameResult.reason).toBe('timeLimit');
    });
  });
  
  describe('checkGameEnd', () => {
    it('当玩家资产达到要求时应结束游戏', () => {
      const store = useGameCoreStore();
      const playerStore = require('../../../src/stores/player').usePlayerStore();
      
      // 初始化游戏
      store.startNewGame('测试玩家');
      
      // 模拟玩家拥有最高级别房屋
      playerStore.hasHighestHouse = true;
      
      // 检查游戏结束条件
      store.checkGameEnd();
      
      // 验证游戏结束
      expect(store.gameOver).toBe(true);
      expect(store.gameResult).not.toBe(null);
      expect(store.gameResult.reason).toBe('victory');
    });
    
    it('当玩家破产时应结束游戏', () => {
      const store = useGameCoreStore();
      const playerStore = require('../../../src/stores/player').usePlayerStore();
      
      // 初始化游戏
      store.startNewGame('测试玩家');
      
      // 模拟玩家破产状态
      playerStore.netWorth = -5000;
      playerStore.debt = 10000;
      playerStore.money = 0;
      
      // 检查游戏结束条件
      store.checkGameEnd();
      
      // 验证游戏结束
      expect(store.gameOver).toBe(true);
      expect(store.gameResult).not.toBe(null);
      expect(store.gameResult.reason).toBe('bankruptcy');
    });
  });
  
  describe('addNotification', () => {
    it('应正确添加通知', () => {
      const store = useGameCoreStore();
      
      store.addNotification('info', '测试通知');
      
      // 验证通知被添加
      expect(store.notifications.length).toBe(1);
      expect(store.notifications[0].type).toBe('info');
      expect(store.notifications[0].message).toBe('测试通知');
    });
    
    it('应限制通知数量', () => {
      const store = useGameCoreStore();
      
      // 添加超过限制的通知
      for (let i = 0; i < 15; i++) {
        store.addNotification('info', `通知 ${i}`);
      }
      
      // 验证通知数量被限制
      expect(store.notifications.length).toBe(10);
      
      // 验证最新的通知在前面（索引0），而不是在后面
      expect(store.notifications[0].message).toBe('通知 14');
    });
  });
  
  describe('计算属性', () => {
    it('gameProgress应返回正确的进度百分比', () => {
      const store = useGameCoreStore();
      
      store.startNewGame('测试玩家');
      store.currentWeek = 26;
      
      expect(store.gameProgress).toBe(50);
    });
    
    it('isGameActive应正确反映游戏状态', () => {
      const store = useGameCoreStore();
      
      // 初始状态
      expect(store.isGameActive).toBe(false);
      
      // 开始游戏
      store.startNewGame('测试玩家');
      expect(store.isGameActive).toBe(true);
      
      // 暂停游戏
      store.gamePaused = true;
      expect(store.isGameActive).toBe(false);
      
      // 恢复游戏
      store.gamePaused = false;
      expect(store.isGameActive).toBe(true);
      
      // 结束游戏
      store.gameOver = true;
      expect(store.isGameActive).toBe(false);
    });
  });
}); 