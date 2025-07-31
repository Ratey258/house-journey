/**
 * 仓储接口定义
 * 这个文件定义了领域仓储的标准接口
 */

/**
 * 基础仓储接口
 * @template T 实体类型
 * @template TId 实体ID类型
 */
export class IRepository {
  /**
   * 根据ID获取实体
   * @param {TId} id 实体ID
   * @returns {Promise<T>} 实体对象，不存在时返回null
   */
  async getById(id) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取所有实体
   * @returns {Promise<T[]>} 实体列表
   */
  async getAll() {
    throw new Error('Method not implemented');
  }

  /**
   * 保存实体
   * @param {T} entity 实体对象
   * @returns {Promise<void>}
   */
  async save(entity) {
    throw new Error('Method not implemented');
  }

  /**
   * 删除实体
   * @param {TId} id 实体ID
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(id) {
    throw new Error('Method not implemented');
  }
}

/**
 * 玩家仓储接口
 */
export class IPlayerRepository extends IRepository {
  /**
   * 获取当前玩家
   * @returns {Promise<Object>} 玩家实体
   */
  async getPlayer() {
    throw new Error('Method not implemented');
  }

  /**
   * 保存玩家状态
   * @param {Object} player 玩家实体
   * @returns {Promise<void>}
   */
  async savePlayer(player) {
    throw new Error('Method not implemented');
  }

  /**
   * 重置玩家状态
   * @returns {Promise<Object>} 重置后的玩家实体
   */
  async resetPlayer() {
    throw new Error('Method not implemented');
  }
}

/**
 * 产品仓储接口
 */
export class IProductRepository extends IRepository {
  /**
   * 根据类别获取产品
   * @param {string} category 产品类别
   * @returns {Promise<Object[]>} 产品列表
   */
  async getProductsByCategory(category) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取所有产品类别
   * @returns {Promise<string[]>} 类别列表
   */
  async getCategories() {
    throw new Error('Method not implemented');
  }
}

/**
 * 市场仓储接口
 */
export class IMarketRepository extends IRepository {
  /**
   * 获取当前市场状态
   * @returns {Promise<Object>} 市场状态对象
   */
  async getMarketState() {
    throw new Error('Method not implemented');
  }

  /**
   * 获取当前商品价格
   * @param {string} productId 产品ID
   * @returns {Promise<Object>} 价格对象
   */
  async getCurrentPrice(productId) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取价格历史
   * @param {string} productId 产品ID
   * @param {number} limit 限制条数
   * @returns {Promise<Object[]>} 价格历史记录
   */
  async getPriceHistory(productId, limit) {
    throw new Error('Method not implemented');
  }

  /**
   * 更新价格
   * @param {Object} priceData 价格数据
   * @returns {Promise<void>}
   */
  async updatePrices(priceData) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取所有地点
   * @returns {Promise<Object[]>} 地点列表
   */
  async getLocations() {
    throw new Error('Method not implemented');
  }

  /**
   * 获取地点
   * @param {string} locationId 地点ID
   * @returns {Promise<Object>} 地点对象
   */
  async getLocation(locationId) {
    throw new Error('Method not implemented');
  }
}
