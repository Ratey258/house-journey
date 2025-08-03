/**
 * 游戏侧边栏相关类型定义
 */

export interface PlayerInfo {
  name: string;
  money: number;
  debt: number;
  netWorth: number;
  currentWeek: number;
  inventoryUsed: number;
  inventoryCapacity: number;
}

export interface GameStats {
  transactionCount: number;
  totalProfit: number;
  visitedLocations: string[];
  housesOwned: number;
}

export interface SidebarSection {
  id: string;
  title: string;
  collapsed: boolean;
  component?: any;
}