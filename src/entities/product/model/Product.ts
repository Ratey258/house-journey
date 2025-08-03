/**
 * 产品实体 - 重构自 src/core/models/product.ts
 * 保持原项目的完整逻辑和数据结构
 */

import { BaseEntity, Timestamps } from '../../../shared/types/entities';

// ==================== 类型定义 ====================

/**
 * 产品类别枚举
 */
export enum ProductCategory {
  DAILY = 'DAILY',           // 日用品
  FOOD = 'FOOD',             // 食品
  ELECTRONICS = 'ELECTRONICS', // 电子产品
  LUXURY = 'LUXURY',         // 奢侈品
  COLLECTIBLE = 'COLLECTIBLE' // 收藏品
}

/**
 * 产品ID类型
 */
export type ProductId = string | number;

/**
 * 价格范围接口
 */
export interface PriceRange {
  min: number;
  max: number;
  range: number;
}

/**
 * 产品初始化选项接口
 */
export interface ProductOptions {
  /** 产品ID */
  id: ProductId;
  /** 产品名称 */
  name: string;
  /** 产品描述 */
  description?: string;
  /** 基础价格 */
  basePrice: number;
  /** 最低价格 */
  minPrice: number;
  /** 最高价格 */
  maxPrice: number;
  /** 价格波动性(1-10) */
  volatility?: number;
  /** 产品类别 */
  category?: ProductCategory;
  /** 产品大小(库存占用) */
  size?: number;
  /** 产品图标 */
  icon?: string;
  /** 可获得的地点 */
  availableAt?: string[];
}

/**
 * 产品数据接口（用于预定义产品列表）
 */
export interface ProductData {
  id: ProductId;
  name: string;
  description: string;
  basePrice: number;
  minPrice: number;
  maxPrice: number;
  volatility: number;
  category: ProductCategory;
  size: number;
  icon: string;
  availableAt: string[];
}

/**
 * 地点接口（用于类型约束）
 */
export interface Location {
  id: string;
  name: string;
}

// ==================== 产品类 ====================

/**
 * 产品类
 * 封装产品的属性和行为
 */
export class Product implements BaseEntity, Timestamps {
  public readonly id: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  /** 产品名称 */
  public readonly name: string;
  /** 产品描述 */
  public readonly description: string;
  /** 基础价格 */
  public readonly basePrice: number;
  /** 最低价格 */
  public readonly minPrice: number;
  /** 最高价格 */
  public readonly maxPrice: number;
  /** 价格波动性(1-10) */
  public readonly volatility: number;
  /** 产品类别 */
  public readonly category: ProductCategory;
  /** 产品大小(库存占用) */
  public readonly size: number;
  /** 产品图标 */
  public readonly icon: string;
  /** 可获得的地点 */
  public readonly availableAt: string[];

  /**
   * 创建产品实例
   */
  constructor({
    id,
    name,
    description = '',
    basePrice,
    minPrice,
    maxPrice,
    volatility = 5,
    category = ProductCategory.DAILY,
    size = 1,
    icon = 'box',
    availableAt = []
  }: ProductOptions) {
    this.id = String(id); // 转换为字符串以符合BaseEntity接口
    this.createdAt = new Date();
    this.updatedAt = new Date();

    this.name = name;
    this.description = description;
    this.basePrice = basePrice;
    this.minPrice = minPrice;
    this.maxPrice = maxPrice;
    this.volatility = Math.min(Math.max(volatility, 1), 10); // 限制在1-10之间
    this.category = category;
    this.size = size;
    this.icon = icon;
    this.availableAt = availableAt;
  }

  /**
   * 获取价格范围
   */
  getPriceRange(): PriceRange {
    return {
      min: this.minPrice,
      max: this.maxPrice,
      range: this.maxPrice - this.minPrice
    };
  }

  /**
   * 检查价格是否在有效范围内
   */
  isValidPrice(price: number): boolean {
    return price >= this.minPrice && price <= this.maxPrice;
  }

  /**
   * 调整价格到有效范围
   */
  adjustPriceToRange(price: number): number {
    return Math.max(this.minPrice, Math.min(price, this.maxPrice));
  }

  private updateTimestamp(): void {
    this.updatedAt = new Date();
  }
}

// ==================== 工厂函数 ====================

/**
 * 创建产品工厂函数 - 类型1（OOP风格）
 */
export function createProduct(options: ProductOptions): Product {
  return new Product(options);
}

/**
 * 创建产品工厂函数 - 类型2（函数式风格，兼容旧版）
 */
export function createProductLegacy(
  id: ProductId,
  name: string,
  category: ProductCategory,
  minPrice: number,
  maxPrice: number,
  basePrice: number
): Product {
  return new Product({
    id,
    name,
    category,
    minPrice,
    maxPrice,
    basePrice,
    volatility: calculateVolatility(category),
    availableAt: getAvailableLocations(category)
  });
}

// ==================== 工具函数 ====================

/**
 * 根据类别计算商品价格波动率
 */
function calculateVolatility(category: ProductCategory): number {
  switch(category) {
    case ProductCategory.DAILY: return 2; // 日用品波动小
    case ProductCategory.FOOD: return 4;  // 食品中等波动
    case ProductCategory.ELECTRONICS: return 6; // 电子产品波动较大
    case ProductCategory.LUXURY: return 8; // 奢侈品大波动
    case ProductCategory.COLLECTIBLE: return 10; // 收藏品极大波动
    default: return 5;
  }
}

/**
 * 根据商品类别获取可用地点ID列表
 */
function getAvailableLocations(category: ProductCategory): string[] {
  switch(category) {
    case ProductCategory.DAILY:
      return ['second_hand_market', 'commodity_market'];
    case ProductCategory.FOOD:
      return ['commodity_market'];
    case ProductCategory.ELECTRONICS:
      return ['electronics_hub', 'premium_mall'];
    case ProductCategory.LUXURY:
      return ['premium_mall'];
    case ProductCategory.COLLECTIBLE:
      return ['black_market'];
    default:
      return ['second_hand_market'];
  }
}

/**
 * 获取指定地点可用的商品
 */
export function getAvailableProducts(location: Location, allProducts: Product[]): Product[] {
  if (!location || !allProducts) return [];

  return allProducts.filter(product =>
    product.availableAt.includes(location.id)
  );
}

// ==================== 导出函数 ====================

/**
 * 获取所有产品列表
 */
export function getAllProducts(): Product[] {
  // 动态导入预定义数据，避免循环依赖
  const { predefinedProducts } = require('../data/predefined-products');
  return predefinedProducts.map((productData: ProductData) => createProduct(productData));
}

/**
 * 根据ID获取产品
 */
export function getProductById(id: ProductId): Product | null {
  // 动态导入预定义数据，避免循环依赖
  const { predefinedProducts } = require('../data/predefined-products');
  const productData = predefinedProducts.find((p: ProductData) => p.id == id);
  return productData ? createProduct(productData) : null;
}