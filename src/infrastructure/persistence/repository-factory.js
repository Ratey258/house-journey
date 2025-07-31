/**
 * 仓储工厂
 * 用于创建和管理仓储实例
 */
import storageService from './storageService';
import { PlayerRepositoryEnhanced, createPlayerRepository } from './player-repository-enhanced';

/**
 * 仓储工厂类
 * 负责创建和管理仓储实例
 */
class RepositoryFactory {
  /**
   * 构造函数
   */
  constructor() {
    this._repositories = new Map();
    this._storageService = storageService;
  }

  /**
   * 获取玩家仓储
   * @returns {PlayerRepositoryEnhanced} 玩家仓储实例
   */
  getPlayerRepository() {
    const key = 'player';
    if (!this._repositories.has(key)) {
      const repository = createPlayerRepository(this._storageService);
      this._repositories.set(key, repository);
    }
    return this._repositories.get(key);
  }

  /**
   * 获取产品仓储
   * @returns {Object} 产品仓储实例
   */
  getProductRepository() {
    const key = 'product';
    if (!this._repositories.has(key)) {
      // 暂时使用旧版产品仓储
      // TODO: 实现增强版产品仓储
      const repository = require('./productRepository').default;
      this._repositories.set(key, repository);
    }
    return this._repositories.get(key);
  }

  /**
   * 获取市场仓储
   * @returns {Object} 市场仓储实例
   */
  getMarketRepository() {
    const key = 'market';
    if (!this._repositories.has(key)) {
      // 暂时使用旧版市场仓储
      // TODO: 实现增强版市场仓储
      const repository = require('./marketRepository').default;
      this._repositories.set(key, repository);
    }
    return this._repositories.get(key);
  }

  /**
   * 获取存储服务
   * @returns {Object} 存储服务实例
   */
  getStorageService() {
    return this._storageService;
  }

  /**
   * 初始化所有仓储
   * @returns {Promise<void>}
   */
  async initializeAll() {
    // 获取所有仓储，触发它们的创建和初始化
    const repositories = [
      this.getPlayerRepository(),
      this.getProductRepository(),
      this.getMarketRepository()
    ];

    // 并行初始化所有仓储
    await Promise.all(repositories.map(repo => {
      return repo.initialize ? repo.initialize() : Promise.resolve();
    }));
  }
}

// 创建仓储工厂单例
const repositoryFactory = new RepositoryFactory();

export default repositoryFactory;
