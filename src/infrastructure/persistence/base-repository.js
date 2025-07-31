/**
 * 基础仓储实现
 * 为所有仓储提供标准化实现
 */
import { IRepository } from '../../core/interfaces/repositories';
import { withErrorHandling } from '../utils/errorHandler';
import { ErrorType } from '../utils/errorTypes';

/**
 * 基础仓储抽象类
 * 提供所有仓储共享的基础功能
 * @template T 实体类型
 * @template TId 实体ID类型
 */
export class BaseRepository {
  /**
   * 构造函数
   * @param {Object} storageService 存储服务
   * @param {string} collectionName 集合名称
   */
  constructor(storageService, collectionName) {
    this.storageService = storageService;
    this.collectionName = collectionName;

    // 实体映射缓存
    this._entityCache = new Map();
    this._initialized = false;
  }

  /**
   * 初始化仓储
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) return;

    try {
      // 加载所有实体到缓存
      const entities = await this.storageService.load(this.collectionName) || {};

      // 清空现有缓存
      this._entityCache.clear();

      // 将实体添加到缓存
      for (const [id, entity] of Object.entries(entities)) {
        this._entityCache.set(id, this.mapToEntity(entity));
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
   * @returns {Promise<void>}
   * @private
   */
  async _ensureInitialized() {
    if (!this._initialized) {
      await this.initialize();
    }
  }

  /**
   * 获取实体
   * @param {TId} id 实体ID
   * @returns {Promise<T>} 实体对象，不存在时返回null
   */
  async getById(id) {
    return withErrorHandling(async () => {
      await this._ensureInitialized();

      if (this._entityCache.has(id)) {
        return this._entityCache.get(id);
      }

      return null;
    }, `${this.constructor.name}.getById`, ErrorType.DATA_ACCESS);
  }

  /**
   * 获取所有实体
   * @returns {Promise<T[]>} 实体列表
   */
  async getAll() {
    return withErrorHandling(async () => {
      await this._ensureInitialized();
      return Array.from(this._entityCache.values());
    }, `${this.constructor.name}.getAll`, ErrorType.DATA_ACCESS);
  }

  /**
   * 保存实体
   * @param {T} entity 实体对象
   * @returns {Promise<void>}
   */
  async save(entity) {
    return withErrorHandling(async () => {
      await this._ensureInitialized();

      const id = this.getEntityId(entity);
      if (!id) {
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
   * @param {T[]} entities 实体对象数组
   * @returns {Promise<void>}
   */
  async saveAll(entities) {
    return withErrorHandling(async () => {
      await this._ensureInitialized();

      // 更新缓存
      for (const entity of entities) {
        const id = this.getEntityId(entity);
        if (!id) continue;

        this._entityCache.set(id, entity);
      }

      // 持久化到存储
      await this._persistCache();
    }, `${this.constructor.name}.saveAll`, ErrorType.DATA_ACCESS);
  }

  /**
   * 删除实体
   * @param {TId} id 实体ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
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
   * 清除所有实体
   * @returns {Promise<void>}
   */
  async clear() {
    return withErrorHandling(async () => {
      await this._ensureInitialized();

      this._entityCache.clear();
      await this._persistCache();
    }, `${this.constructor.name}.clear`, ErrorType.DATA_ACCESS);
  }

  /**
   * 持久化缓存到存储
   * @returns {Promise<void>}
   * @private
   */
  async _persistCache() {
    const entities = {};

    // 将实体转换为存储格式
    for (const [id, entity] of this._entityCache.entries()) {
      entities[id] = this.mapToDTO(entity);
    }

    await this.storageService.save(this.collectionName, entities);
  }

  /**
   * 获取实体ID
   * 子类需要实现此方法以提供实体ID的获取逻辑
   * @param {T} entity 实体对象
   * @returns {TId} 实体ID
   */
  getEntityId(entity) {
    throw new Error('Method not implemented');
  }

  /**
   * 将DTO映射为实体对象
   * 子类需要实现此方法以提供DTO到实体的映射逻辑
   * @param {Object} dto 数据传输对象
   * @returns {T} 实体对象
   */
  mapToEntity(dto) {
    throw new Error('Method not implemented');
  }

  /**
   * 将实体映射为DTO
   * 子类需要实现此方法以提供实体到DTO的映射逻辑
   * @param {T} entity 实体对象
   * @returns {Object} 数据传输对象
   */
  mapToDTO(entity) {
    throw new Error('Method not implemented');
  }
}
