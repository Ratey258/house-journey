/**
 * 实体基础类型定义
 * 为所有实体提供基础接口和类型
 */

// === 基础实体接口 ===

/**
 * 基础实体接口
 * 所有实体都必须实现此接口
 */
export interface BaseEntity {
  readonly id: string | number;
}

/**
 * 时间戳接口
 * 跟踪实体的创建和更新时间
 */
export interface Timestamps {
  readonly createdAt: Date;
  updatedAt: Date;
}

// === 实体ID类型 ===

/**
 * 玩家ID类型
 */
export type PlayerId = string;

/**
 * 房屋ID类型
 */
export type HouseId = string;

/**
 * 产品ID类型
 */
export type ProductId = string | number;

/**
 * 市场ID类型
 */
export type MarketId = string;

// === 价格相关类型 ===

/**
 * 价格类型
 */
export type Price = number;

/**
 * 价格范围
 */
export interface PriceRange {
  min: Price;
  max: Price;
  range: Price;
}

// === 游戏时间类型 ===

/**
 * 游戏时间
 */
export interface GameTime {
  week: number;
  day: number;
  hour: number;
  minute: number;
}

// === 位置相关类型 ===

/**
 * 游戏位置
 */
export interface GameLocation {
  id: string;
  name: string;
  description?: string;
}

// === 其他通用类型 ===

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

/**
 * 排序参数
 */
export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

/**
 * 查询参数
 */
export interface QueryParams extends Partial<PaginationParams>, Partial<SortParams> {
  search?: string;
  filters?: Record<string, any>;
}