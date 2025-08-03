/**
 * 市场实体 - 重构自原项目中的市场概念
 * 保持原项目的简洁设计，提供基本的市场数据结构
 */

import { BaseEntity, Timestamps } from '../../../shared/types/entities';

// ==================== 类型定义 ====================

/**
 * 市场ID类型
 */
export type MarketId = string;

/**
 * 市场数据接口
 */
export interface MarketData {
  id: MarketId;
  name: string;
  description: string;
  availableProducts: string[];
}

// ==================== 市场类 ====================

/**
 * 市场类
 * 表示游戏中的交易地点
 */
export class Market implements BaseEntity, Timestamps {
  public readonly id: MarketId;
  public readonly createdAt: Date;
  public updatedAt: Date;

  /** 市场名称 */
  public readonly name: string;
  /** 市场描述 */
  public readonly description: string;
  /** 可用产品列表 */
  public readonly availableProducts: string[];

  constructor(data: MarketData) {
    this.id = data.id;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    
    this.name = data.name;
    this.description = data.description;
    this.availableProducts = [...data.availableProducts];
  }

  /**
   * 检查是否支持指定产品
   */
  public supportsProduct(productId: string): boolean {
    return this.availableProducts.includes(productId);
  }

  private updateTimestamp(): void {
    this.updatedAt = new Date();
  }
}

// ==================== 导出函数 ====================

/**
 * 创建市场工厂函数
 */
export function createMarket(data: MarketData): Market {
  return new Market(data);
}

/**
 * 获取预定义市场列表
 */
export function getPredefinedMarkets(): Market[] {
  const markets: MarketData[] = [
    {
      id: 'commodity_market',
      name: '商品市场',
      description: '销售日用品和食品的市场',
      availableProducts: ['daily', 'food']
    },
    {
      id: 'second_hand_market',
      name: '二手市场',
      description: '各种二手商品交易的地方',
      availableProducts: ['daily', 'electronics']
    },
    {
      id: 'electronics_hub',
      name: '电子产品中心',
      description: '专门销售电子产品的商场',
      availableProducts: ['electronics']
    },
    {
      id: 'premium_mall',
      name: '高端商城',
      description: '奢侈品和高端商品的购物中心',
      availableProducts: ['luxury', 'electronics']
    },
    {
      id: 'black_market',
      name: '黑市',
      description: '收藏品和稀有物品的交易场所',
      availableProducts: ['collectible']
    }
  ];

  return markets.map(createMarket);
}