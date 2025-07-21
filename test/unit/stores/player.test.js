import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePlayerStore } from '../../../src/stores/player';
import { useInventoryActions } from '../../../src/stores/player';

describe('Player Store', () => {
  beforeEach(() => {
    // 创建新的Pinia实例用于测试
    setActivePinia(createPinia());
  });
  
  describe('初始状态', () => {
    it('应该有正确的默认值', () => {
      const store = usePlayerStore();
      
      expect(store.name).toBe('');
      expect(store.money).toBe(5000);
      expect(store.debt).toBe(2000);
      expect(store.capacity).toBe(100);
      expect(store.inventoryUsed).toBe(0);
      expect(store.inventory).toEqual([]);
      expect(store.purchasedHouses).toEqual([]);
    });
  });
  
  describe('initializePlayer', () => {
    it('应正确初始化玩家状态', () => {
      const store = usePlayerStore();
      
      store.initializePlayer('测试玩家');
      
      expect(store.name).toBe('测试玩家');
      expect(store.money).toBe(5000);
      expect(store.debt).toBe(2000);
      expect(store.capacity).toBe(100);
      expect(store.inventoryUsed).toBe(0);
      expect(store.inventory).toEqual([]);
      expect(store.purchasedHouses).toEqual([]);
      expect(store.statistics.weekCount).toBe(1);
      expect(store.statistics.transactionCount).toBe(0);
      expect(store.statistics.totalProfit).toBe(0);
      expect(store.statistics.maxMoney).toBe(5000);
      expect(store.statistics.visitedLocations).toEqual([]);
    });
    
    it('当未提供名称时应使用默认名称', () => {
      const store = usePlayerStore();
      
      store.initializePlayer();
      
      // 注意：实际测试中应该检查i18n的默认名称，这里简化处理
      expect(store.name).not.toBe('');
    });
  });
  
  describe('updateWeeklyPlayerState', () => {
    it('应更新周数统计', () => {
      const store = usePlayerStore();
      store.initializePlayer('测试玩家');
      
      store.updateWeeklyPlayerState(5);
      
      expect(store.statistics.weekCount).toBe(5);
    });
    
    it('应增加债务利息', () => {
      const store = usePlayerStore();
      store.initializePlayer('测试玩家');
      const initialDebt = store.debt;
      
      store.updateWeeklyPlayerState(2);
      
      // 债务应增加0.5%的利息
      const expectedInterest = Math.floor(initialDebt * 0.005);
      expect(store.debt).toBe(initialDebt + expectedInterest);
    });
    
    it('当资金创新高时应更新最大资金记录', () => {
      const store = usePlayerStore();
      store.initializePlayer('测试玩家');
      
      // 设置更高的资金
      store.money = 10000;
      
      store.updateWeeklyPlayerState(2);
      
      expect(store.statistics.maxMoney).toBe(10000);
    });
  });
  
  describe('addVisitedLocation', () => {
    it('应添加新访问的地点', () => {
      const store = usePlayerStore();
      store.initializePlayer('测试玩家');
      
      store.addVisitedLocation('location1');
      
      expect(store.statistics.visitedLocations).toContain('location1');
    });
    
    it('不应重复添加已访问的地点', () => {
      const store = usePlayerStore();
      store.initializePlayer('测试玩家');
      
      store.addVisitedLocation('location1');
      store.addVisitedLocation('location1');
      
      expect(store.statistics.visitedLocations.length).toBe(1);
    });
  });
});

describe('Inventory Actions', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  
  describe('addToInventory', () => {
    it('应正确添加商品到库存', () => {
      const playerStore = usePlayerStore();
      const inventoryActions = useInventoryActions();
      
      playerStore.initializePlayer('测试玩家');
      
      const product = {
        id: 'test_product',
        name: '测试商品',
        size: 10
      };
      
      const result = inventoryActions.addToInventory(product, 2, 100);
      
      expect(result.success).toBe(true);
      expect(playerStore.inventory.length).toBe(1);
      expect(playerStore.inventory[0].productId).toBe('test_product');
      expect(playerStore.inventory[0].quantity).toBe(2);
      expect(playerStore.inventory[0].purchasePrice).toBe(100);
      expect(playerStore.inventoryUsed).toBe(20); // 2 * 10
    });
    
    it('当背包空间不足时应返回失败', () => {
      const playerStore = usePlayerStore();
      const inventoryActions = useInventoryActions();
      
      playerStore.initializePlayer('测试玩家');
      playerStore.capacity = 30;
      
      const product = {
        id: 'test_product',
        name: '测试商品',
        size: 10
      };
      
      // 先添加一些商品
      inventoryActions.addToInventory(product, 2, 100);
      
      // 尝试添加超出容量的商品
      const result = inventoryActions.addToInventory(product, 2, 100);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
      expect(playerStore.inventoryUsed).toBe(20); // 仍然是 2 * 10
    });
    
    it('应合并相同价格的相同商品', () => {
      const playerStore = usePlayerStore();
      const inventoryActions = useInventoryActions();
      
      playerStore.initializePlayer('测试玩家');
      
      const product = {
        id: 'test_product',
        name: '测试商品',
        size: 10
      };
      
      // 添加商品两次
      inventoryActions.addToInventory(product, 2, 100);
      inventoryActions.addToInventory(product, 3, 100);
      
      // 应该合并为一个条目
      expect(playerStore.inventory.length).toBe(1);
      expect(playerStore.inventory[0].quantity).toBe(5);
      expect(playerStore.inventoryUsed).toBe(50); // 5 * 10
    });
    
    it('不同价格的相同商品应分开存储', () => {
      const playerStore = usePlayerStore();
      const inventoryActions = useInventoryActions();
      
      playerStore.initializePlayer('测试玩家');
      
      const product = {
        id: 'test_product',
        name: '测试商品',
        size: 10
      };
      
      // 添加不同价格的商品
      inventoryActions.addToInventory(product, 2, 100);
      inventoryActions.addToInventory(product, 3, 150);
      
      // 应该是两个条目
      expect(playerStore.inventory.length).toBe(2);
      expect(playerStore.inventory[0].purchasePrice).toBe(100);
      expect(playerStore.inventory[0].quantity).toBe(2);
      expect(playerStore.inventory[1].purchasePrice).toBe(150);
      expect(playerStore.inventory[1].quantity).toBe(3);
    });
  });
  
  describe('removeFromInventory', () => {
    it('应正确从库存移除商品', () => {
      const playerStore = usePlayerStore();
      const inventoryActions = useInventoryActions();
      
      playerStore.initializePlayer('测试玩家');
      
      const product = {
        id: 'test_product',
        name: '测试商品',
        size: 10
      };
      
      // 添加商品
      inventoryActions.addToInventory(product, 5, 100);
      
      // 移除部分商品
      const result = inventoryActions.removeFromInventory(0, 2);
      
      expect(result.success).toBe(true);
      expect(playerStore.inventory[0].quantity).toBe(3);
      expect(playerStore.inventoryUsed).toBe(30); // 3 * 10
    });
    
    it('当移除全部数量时应删除条目', () => {
      const playerStore = usePlayerStore();
      const inventoryActions = useInventoryActions();
      
      playerStore.initializePlayer('测试玩家');
      
      const product = {
        id: 'test_product',
        name: '测试商品',
        size: 10
      };
      
      // 添加商品
      inventoryActions.addToInventory(product, 5, 100);
      
      // 移除所有商品
      const result = inventoryActions.removeFromInventory(0, 5);
      
      expect(result.success).toBe(true);
      expect(playerStore.inventory.length).toBe(0);
      expect(playerStore.inventoryUsed).toBe(0);
    });
    
    it('当索引无效时应返回失败', () => {
      const playerStore = usePlayerStore();
      const inventoryActions = useInventoryActions();
      
      playerStore.initializePlayer('测试玩家');
      
      // 尝试从空库存移除
      const result = inventoryActions.removeFromInventory(0, 1);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });
    
    it('当数量不足时应返回失败', () => {
      const playerStore = usePlayerStore();
      const inventoryActions = useInventoryActions();
      
      playerStore.initializePlayer('测试玩家');
      
      const product = {
        id: 'test_product',
        name: '测试商品',
        size: 10
      };
      
      // 添加商品
      inventoryActions.addToInventory(product, 2, 100);
      
      // 尝试移除更多商品
      const result = inventoryActions.removeFromInventory(0, 3);
      
      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
      expect(playerStore.inventory[0].quantity).toBe(2); // 数量应保持不变
    });
  });
}); 