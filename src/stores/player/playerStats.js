import { usePlayerStore } from './playerState';

/**
 * 玩家统计数据管理
 * 提供统计数据计算和操作功能
 */
export const usePlayerStats = () => {
  const playerStore = usePlayerStore();
  
  /**
   * 获取总利润率
   * @returns {number} 利润率(百分比)
   */
  const getProfitRate = () => {
    // 避免除以零
    const totalTransactions = playerStore.statistics.transactionCount;
    if (totalTransactions === 0) return 0;
    
    // 计算平均每笔交易的利润
    return (playerStore.statistics.totalProfit / totalTransactions) * 100;
  };
  
  /**
   * 获取游戏进度相关统计
   * @param {number} maxWeeks - 游戏最大周数
   * @returns {Object} 进度统计数据
   */
  const getProgressStats = (maxWeeks) => {
    const currentWeek = playerStore.statistics.weekCount;
    const progress = Math.floor((currentWeek / maxWeeks) * 100);
    const remainingWeeks = maxWeeks - currentWeek;
    
    return {
      currentWeek,
      progress,
      remainingWeeks,
      isLastWeek: remainingWeeks <= 1
    };
  };
  
  /**
   * 获取房产投资统计
   * @returns {Object} 房产统计数据
   */
  const getHousingStats = () => {
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
    const totalValue = houses.reduce((sum, house) => sum + house.purchasePrice, 0);
    const highestLevel = Math.max(...houses.map(house => house.level));
    const mostExpensiveHouse = houses.reduce(
      (most, house) => house.purchasePrice > most.purchasePrice ? house : most,
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
   * @returns {Object} 财务状况数据
   */
  const getFinancialStats = () => {
    // 计算净资产（包含库存、房产和债务）
    const netWorth = playerStore.netWorth;
    
    // 计算资产比例
    const totalAssets = playerStore.money + playerStore.getTotalInventoryValue + getHousingStats().totalValue;
    const debtRatio = totalAssets > 0 ? (playerStore.debt / totalAssets) * 100 : 0;
    
    // 计算财务健康指数 (满分100)
    // 多种因素影响: 净资产、负债比率、总交易次数、最高现金
    const wealthFactor = Math.min(netWorth / 10000, 50); // 净资产贡献最多50分
    const debtFactor = Math.max(0, 30 - debtRatio * 0.6); // 低负债贡献最多30分
    const transactionFactor = Math.min(playerStore.statistics.transactionCount / 10, 10); // 交易经验贡献最多10分
    const cashFactor = Math.min(playerStore.statistics.maxMoney / 20000, 10); // 资金管理贡献最多10分
    
    const financialHealth = Math.floor(wealthFactor + debtFactor + transactionFactor + cashFactor);
    
    return {
      netWorth,
      debtRatio: parseFloat(debtRatio.toFixed(1)),
      financialHealth: Math.min(100, financialHealth),
      maxMoney: playerStore.statistics.maxMoney
    };
  };
  
  /**
   * 获取区域探索统计
   * @param {Array} allLocations - 所有地点列表
   * @returns {Object} 探索统计数据
   */
  const getExplorationStats = (allLocations) => {
    const visitedCount = playerStore.statistics.visitedLocations.length;
    const totalLocations = allLocations.length;
    const explorationRate = totalLocations > 0 ? 
      Math.floor((visitedCount / totalLocations) * 100) : 0;
      
    const unexploredLocations = allLocations.filter(
      loc => !playerStore.statistics.visitedLocations.includes(loc.id)
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
   * @param {number} profit - 交易利润
   */
  const recordTransaction = (profit) => {
    playerStore.statistics.transactionCount++;
    playerStore.statistics.totalProfit += profit;
  };
  
  return {
    getProfitRate,
    getProgressStats,
    getHousingStats,
    getFinancialStats,
    getExplorationStats,
    recordTransaction
  };
}; 