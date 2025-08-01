/**
 * 玩家统计数据管理 - TypeScript版本
 * 提供统计数据计算和操作功能
 */

import { usePlayerStore } from './playerState';

// ==================== 类型定义 ====================

/**
 * 游戏进度统计接口
 */
export interface ProgressStats {
  currentWeek: number;
  progress: number;
  remainingWeeks: number;
  isLastWeek: boolean;
}

/**
 * 房产统计接口
 */
export interface HousingStats {
  count: number;
  totalValue: number;
  highestLevel: number;
  mostExpensiveHouse: any | null;
}

/**
 * 财务状况统计接口
 */
export interface FinancialStats {
  netWorth: number;
  debtRatio: number;
  financialHealth: number;
  maxMoney: number;
}

/**
 * 探索统计接口
 */
export interface ExplorationStats {
  visitedCount: number;
  totalLocations: number;
  explorationRate: number;
  unexploredLocations: any[];
}

/**
 * 地点接口（简化版）
 */
export interface Location {
  id: string;
  [key: string]: any;
}

// ==================== 玩家统计服务 ====================

/**
 * 玩家统计数据管理服务
 */
export const usePlayerStats = () => {
  const playerStore = usePlayerStore();
  
  /**
   * 获取总利润率
   * @returns 利润率(百分比)
   */
  const getProfitRate = (): number => {
    // 避免除以零
    const totalTransactions: number = playerStore.statistics.transactionCount;
    if (totalTransactions === 0) return 0;
    
    // 计算平均每笔交易的利润
    return (playerStore.statistics.totalProfit / totalTransactions) * 100;
  };
  
  /**
   * 获取游戏进度相关统计
   * @param maxWeeks 游戏最大周数
   * @returns 进度统计数据
   */
  const getProgressStats = (maxWeeks: number): ProgressStats => {
    const currentWeek: number = playerStore.statistics.weekCount;
    const progress: number = Math.floor((currentWeek / maxWeeks) * 100);
    const remainingWeeks: number = maxWeeks - currentWeek;
    
    return {
      currentWeek,
      progress,
      remainingWeeks,
      isLastWeek: remainingWeeks <= 1
    };
  };
  
  /**
   * 获取房产投资统计
   * @returns 房产统计数据
   */
  const getHousingStats = (): HousingStats => {
    const houses = playerStore.purchasedHouses;
    
    // 如果没有房子，返回默认数据
    if (!houses || houses.length === 0) {
      return {
        count: 0,
        totalValue: 0,
        highestLevel: 0,
        mostExpensiveHouse: null
      };
    }
    
    // 计算房产相关数据
    const totalValue: number = houses.reduce((sum: number, house: any) => sum + house.purchasePrice, 0);
    const highestLevel: number = Math.max(...houses.map((house: any) => house.level));
    const mostExpensiveHouse = houses.reduce(
      (most: any, house: any) => house.purchasePrice > most.purchasePrice ? house : most,
      houses[0]
    );
    
    return {
      count: houses.length,
      totalValue,
      highestLevel,
      mostExpensiveHouse
    };
  };
  
  /**
   * 获取财务状况统计
   * @returns 财务状况数据
   */
  const getFinancialStats = (): FinancialStats => {
    // 计算净资产（包含库存、房产和债务）
    const netWorth: number = playerStore.netWorth;
    
    // 计算资产比例
    const totalAssets: number = playerStore.money + playerStore.getTotalInventoryValue + getHousingStats().totalValue;
    const debtRatio: number = totalAssets > 0 ? (playerStore.debt / totalAssets) * 100 : 0;
    
    // 计算财务健康指数 (满分100)
    // 多种因素影响: 净资产、负债比率、总交易次数、最高现金
    const wealthFactor: number = Math.min(netWorth / 10000, 50); // 净资产贡献最多50分
    const debtFactor: number = Math.max(0, 30 - debtRatio * 0.6); // 低负债贡献最多30分
    const transactionFactor: number = Math.min(playerStore.statistics.transactionCount / 10, 10); // 交易经验贡献最多10分
    const cashFactor: number = Math.min(playerStore.statistics.maxMoney / 20000, 10); // 资金管理贡献最多10分
    
    const financialHealth: number = Math.floor(wealthFactor + debtFactor + transactionFactor + cashFactor);
    
    return {
      netWorth,
      debtRatio: parseFloat(debtRatio.toFixed(1)),
      financialHealth: Math.min(100, financialHealth),
      maxMoney: playerStore.statistics.maxMoney
    };
  };
  
  /**
   * 获取区域探索统计
   * @param allLocations 所有地点列表
   * @returns 探索统计数据
   */
  const getExplorationStats = (allLocations: Location[]): ExplorationStats => {
    const visitedCount: number = playerStore.statistics.visitedLocations.length;
    const totalLocations: number = allLocations.length;
    const explorationRate: number = totalLocations > 0 ? 
      Math.floor((visitedCount / totalLocations) * 100) : 0;
      
    const unexploredLocations: Location[] = allLocations.filter(
      (loc: Location) => !playerStore.statistics.visitedLocations.includes(loc.id)
    );
    
    return {
      visitedCount,
      totalLocations,
      explorationRate,
      unexploredLocations
    };
  };
  
  /**
   * 记录交易统计
   * @param profit 交易利润
   */
  const recordTransaction = (profit: number): void => {
    playerStore.statistics.transactionCount++;
    playerStore.statistics.totalProfit += profit;
  };
  
  // ==================== 返回服务接口 ====================
  
  return {
    getProfitRate,
    getProgressStats,
    getHousingStats,
    getFinancialStats,
    getExplorationStats,
    recordTransaction
  };
};

// ==================== 服务类型导出 ====================

/**
 * 玩家统计服务返回类型
 */
export type PlayerStatsService = ReturnType<typeof usePlayerStats>; 