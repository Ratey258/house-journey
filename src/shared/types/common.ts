/**
 * 通用类型定义
 */

// 基础ID类型
export type ID = string | number;

// 键值对
export type KeyValuePair<T = any> = Record<string, T>;

// 通用状态
export type Status = 'active' | 'inactive' | 'pending' | 'archived';

// 排序方向
export type SortDirection = 'asc' | 'desc';

// 排序配置
export interface SortConfig {
  field: string;
  direction: SortDirection;
}

// 过滤器
export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startswith' | 'endswith';
  value: any;
}

// 查询选项
export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: SortConfig[];
  filters?: Filter[];
  search?: string;
}

// 操作结果
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

// 统计信息
export interface Statistics {
  total: number;
  active: number;
  inactive: number;
  [key: string]: number;
}

// 地址信息
export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// 联系信息
export interface ContactInfo {
  email?: string;
  phone?: string;
  website?: string;
  address?: Address;
}

// 媒体文件
export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: number;
  filename: string;
  mimeType: string;
  alt?: string;
}

// 标签
export interface Tag {
  id: string;
  name: string;
  color?: string;
  category?: string;
}

// 评分
export interface Rating {
  value: number;
  maxValue: number;
  count: number;
}

// 时间戳
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}