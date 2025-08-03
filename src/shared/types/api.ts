/**
 * API相关类型定义
 */

// HTTP方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// HTTP状态码
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

// 请求配置
export interface RequestConfig {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  retries?: number;
}

// API错误
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// 搜索参数
export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
}

// API端点接口
export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  authenticated?: boolean;
}

// 批量操作
export interface BatchRequest<T> {
  items: T[];
  operation: 'create' | 'update' | 'delete';
}

export interface BatchResponse<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: ApiError;
  }>;
}