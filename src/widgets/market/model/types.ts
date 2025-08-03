/**
 * 市场Widget相关类型定义
 */

export interface ProductBasic {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number;
  category: string;
  size: number;
  icon: string;
  availableAt: string[];
}

export interface MarketProduct {
  product: ProductBasic;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  trend: 'up' | 'down' | 'stable';
  available: boolean;
}

export interface MarketLocation {
  id: string;
  name: string;
  description: string;
  products: MarketProduct[];
}

export interface TradeAction {
  type: 'buy' | 'sell';
  productId: string;
  quantity: number;
  price: number;
}

export interface MarketState {
  currentLocation: string;
  availableLocations: MarketLocation[];
  selectedProduct: MarketProduct | null;
  tradeAmount: number;
  isTrading: boolean;
  error: string | null;
}