/**
 * Store相关类型定义 - TypeScript版本
 * 集中管理所有Store相关的接口和类型
 */

import type { ComputedRef } from 'vue';
import type { PlayerStore } from './player';

/**
 * 交易结果接口
 */
export interface TransactionResult {
  success: boolean;
  message?: string;
  income?: number;
  profit?: number;
  profitPercent?: string | number;
  amountRepaid?: number;
}

/**
 * 产品购买/销售基本参数
 */
export interface ProductTransactionParams {
  productId: string | number;
  quantity: number;
}

/**
 * 房屋购买参数
 */
export interface HousePurchaseParams {
  houseId: string | number;
}

/**
 * 通知类型
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/**
 * 兼容层Store接口 - 保持与原有gameStore.js相同的API
 */
export interface GameStore {
  // === 状态属性 ===
  currentWeek: ComputedRef<number>;
  maxWeeks: ComputedRef<number>;
  gameStarted: ComputedRef<boolean>;
  gamePaused: ComputedRef<boolean>;
  gameOver: ComputedRef<boolean>;
  gameResult: ComputedRef<any>;
  notifications: ComputedRef<any[]>;
  gameGoals: ComputedRef<any>;
  gameProgress: ComputedRef<any>;
  isGameActive: ComputedRef<boolean>;
  player: ComputedRef<PlayerStore>;
  locations: ComputedRef<any[]>;
  currentLocation: ComputedRef<any>;
  productPrices: ComputedRef<Record<string, any>>;
  products: ComputedRef<any[]>;
  availableProducts: ComputedRef<any[]>;
  houses: ComputedRef<any[]>;
  marketModifiers: ComputedRef<any>;
  currentEvent: ComputedRef<any>;
  eventHistory: ComputedRef<any[]>;

  // === 核心游戏方法 ===
  startNewGame: (playerName: string) => void;
  advanceWeek: () => boolean;
  checkGameEnd: () => void;
  addNotification: (type: NotificationType, message: string) => void;

  // === 位置和市场方法 ===
  changeLocation: (locationId: string | number) => boolean;
  updateProductPrices: () => void;
  updateLocationProducts: () => void;
  getCurrentProductPrice: (productId: string | number) => number;
  getProductPriceTrend: (productId: string | number) => any;

  // === 交易方法 ===
  buyProduct: (productId: string | number, quantity: number) => TransactionResult;
  sellProduct: (productId: string | number, quantity: number) => TransactionResult;
  buyHouse: (houseId: string | number) => TransactionResult;
  repayDebt: (amount: number) => TransactionResult;

  // === 事件方法 ===
  generateRandomEvent: () => void;

  // === 存档方法 ===
  saveGame: (saveName: string, isAutoSave?: boolean) => any;
  loadGame: (saveId: string) => any;
  getSaves: () => any[];
}