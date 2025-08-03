/**
 * 市场页面相关类型定义
 */

export interface MarketPageState {
  currentLocation: string;
  selectedProduct: string | null;
  isTrading: boolean;
  error: string | null;
}

export interface MarketPageMeta {
  title: string;
  description: string;
  currentLocationName: string;
}