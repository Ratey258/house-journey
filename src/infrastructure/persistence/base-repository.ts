/**
 * 基础仓储实现 - TypeScript版本
 * 为所有仓储提供标准化实现
 */

import { IRepository } from '@/core/interfaces/repositories';
import { withErrorHandling } from '@/infrastructure/utils/errorHandler';
import { ErrorType } from '@/infrastructure/utils/errorTypes';

// ==================== 类型定义 ====================

/**
 * 存储服务接口
 */
export interface IStorageService {
  load<T = any>(key: string): Promise<T | null>;
  save<T = any>(key: string, data: T): Promise<void>;
  remove(key: string): Promise<boolean>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * 数据传输对象类型
 */
export type DTO<T = any> = Record<string, any> & Partial<T>;

/**
 * 实体ID类型
 */
export type EntityId = string | number;

// ==================== 基础仓储抽象类 ====================

/**
 * 基础仓储抽象类
 * 提供所有仓储共享的基础功能
 * @template T 实体类型
 * @template TId 实体ID类型
 */
export abstract class BaseRepository<T, TId extends EntityId = string> implements IRepository<T, TId> {
  protected storageService: IStorageService;
  protected collectionName: string;
  
  // 实体映射缓存
  protected _entityCache: Map<TId, T> = new Map();
  protected _initialized: boolean = false;

  /**
   * 构造函数
   * @param storageService 存储服务
   * @param collectionName 集合名称
   */
  constructor(storageService: IStorageService, collectionName: string) {
    this.storageService = storageService;
    this.collectionName = collectionName;
  }

  /**
   * 初始化仓储
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    if (this._initialized) return;

    try {
      // 加载所有实体到缓存
      const entities = await this.storageService.load<Record<string, DTO<T>>>(this.collectionName) || {};

      // 清空现有缓存
      this._entityCache.clear();

      // 将实体添加到缓存
      for (const [id, entity] of Object.entries(entities)) {
        this._entityCache.set(id as TId, this.mapToEntity(entity));
      }

      this._initialized = true;
    } catch (error) {
      console.warn(`Failed to initialize repository ${this.collectionName}:`, error);
      this._entityCache.clear();
      this._initialized = true;
    }
  }

  /**
   * 确保仓储已初始化
   * @returns Promise<void>
   * @private
   */
  protected async _ensureInitialized(): Promise<void> {
    if (!this._initialized) {
      await this.initialize();
    }
  }

  /**
   * 获取实体
   * @param id 实体ID
   * @returns 实体对象，不存在时返回null
   */
  async getById(id: TId): Promise<T | null> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();

      if (this._entityCache.has(id)) {
        return this._entityCache.get(id) || null;
      }

      return null;
    }, `${this.constructor.name}.getById`, ErrorType.DATA_ACCESS);
  }

  /**
   * 获取所有实体
   * @returns 实体列表
   */
  async getAll(): Promise<T[]> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();
      return Array.from(this._entityCache.values());
    }, `${this.constructor.name}.getAll`, ErrorType.DATA_ACCESS);
  }

  /**
   * 根据条件查找实体
   * @param predicate 查找条件
   * @returns 匹配的实体列表
   */
  async findWhere(predicate: (entity: T) => boolean): Promise<T[]> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();
      return Array.from(this._entityCache.values()).filter(predicate);
    }, `${this.constructor.name}.findWhere`, ErrorType.DATA_ACCESS);
  }

  /**
   * 根据条件查找第一个匹配的实体
   * @param predicate 查找条件
   * @returns 第一个匹配的实体或null
   */
  async findFirst(predicate: (entity: T) => boolean): Promise<T | null> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();
      return Array.from(this._entityCache.values()).find(predicate) || null;
    }, `${this.constructor.name}.findFirst`, ErrorType.DATA_ACCESS);
  }

  /**
   * 检查实体是否存在
   * @param id 实体ID
   * @returns 是否存在
   */
  async exists(id: TId): Promise<boolean> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();
      return this._entityCache.has(id);
    }, `${this.constructor.name}.exists`, ErrorType.DATA_ACCESS);
  }

  /**
   * 获取实体数量
   * @returns 实体数量
   */
  async count(): Promise<number> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();
      return this._entityCache.size;
    }, `${this.constructor.name}.count`, ErrorType.DATA_ACCESS);
  }

  /**
   * 保存实体
   * @param entity 实体对象
   * @returns Promise<void>
   */
  async save(entity: T): Promise<void> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();

      const id = this.getEntityId(entity);
      if (id === null || id === undefined) {
        throw new Error('Entity ID cannot be null or undefined');
      }

      // 更新缓存
      this._entityCache.set(id, entity);

      // 持久化到存储
      await this._persistCache();
    }, `${this.constructor.name}.save`, ErrorType.DATA_ACCESS);
  }

  /**
   * 批量保存实体
   * @param entities 实体对象数组
   * @returns Promise<void>
   */
  async saveAll(entities: T[]): Promise<void> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();

      // 更新缓存
      for (const entity of entities) {
        const id = this.getEntityId(entity);
        if (id === null || id === undefined) continue;

        this._entityCache.set(id, entity);
      }

      // 持久化到存储
      await this._persistCache();
    }, `${this.constructor.name}.saveAll`, ErrorType.DATA_ACCESS);
  }

  /**
   * 删除实体
   * @param id 实体ID
   * @returns 是否删除成功
   */
  async delete(id: TId): Promise<boolean> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();

      const deleted = this._entityCache.delete(id);

      if (deleted) {
        await this._persistCache();
      }

      return deleted;
    }, `${this.constructor.name}.delete`, ErrorType.DATA_ACCESS);
  }

  /**
   * 批量删除实体
   * @param ids 实体ID数组
   * @returns 删除的实体数量
   */
  async deleteMany(ids: TId[]): Promise<number> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();

      let deletedCount = 0;
      for (const id of ids) {
        if (this._entityCache.delete(id)) {
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        await this._persistCache();
      }

      return deletedCount;
    }, `${this.constructor.name}.deleteMany`, ErrorType.DATA_ACCESS);
  }

  /**
   * 清除所有实体
   * @returns Promise<void>
   */
  async clear(): Promise<void> {
    return withErrorHandling(async () => {
      await this._ensureInitialized();

      this._entityCache.clear();
      await this._persistCache();
    }, `${this.constructor.name}.clear`, ErrorType.DATA_ACCESS);
  }

  /**
   * 获取缓存状态
   * @returns 缓存信息
   */
  getCacheInfo(): { size: number; initialized: boolean; collectionName: string } {
    return {
      size: this._entityCache.size,
      initialized: this._initialized,
      collectionName: this.collectionName
    };
  }

  /**
   * 刷新缓存（重新从存储加载）
   * @returns Promise<void>
   */
  async refreshCache(): Promise<void> {
    this._initialized = false;
    this._entityCache.clear();
    await this.initialize();
  }

  /**
   * 持久化缓存到存储
   * @returns Promise<void>
   * @private
   */
  protected async _persistCache(): Promise<void> {
    const entities: Record<string, DTO<T>> = {};

    // 将实体转换为存储格式
    for (const [id, entity] of this._entityCache.entries()) {
      entities[String(id)] = this.mapToDTO(entity);
    }

    await this.storageService.save(this.collectionName, entities);
  }

  // ==================== 抽象方法 ====================

  /**
   * 获取实体ID
   * 子类需要实现此方法以提供实体ID的获取逻辑
   * @param entity 实体对象
   * @returns 实体ID
   */
  abstract getEntityId(entity: T): TId;

  /**
   * 将DTO映射为实体对象
   * 子类需要实现此方法以提供DTO到实体的映射逻辑
   * @param dto 数据传输对象
   * @returns 实体对象
   */
  abstract mapToEntity(dto: DTO<T>): T;

  /**
   * 将实体映射为DTO
   * 子类需要实现此方法以提供实体到DTO的映射逻辑
   * @param entity 实体对象
   * @returns 数据传输对象
   */
  abstract mapToDTO(entity: T): DTO<T>;
}