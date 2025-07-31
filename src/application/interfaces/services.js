/**
 * 应用服务接口定义
 * 这个文件定义了应用层服务的标准接口
 */

/**
 * 市场应用服务接口
 * 负责协调市场相关的业务流程
 */
export class IMarketService {
  /**
   * 交易商品
   * @param {string} productId 产品ID
   * @param {number} quantity 数量
   * @param {boolean} isBuying 是否为购买操作
   * @returns {Promise<Object>} 交易结果
   */
  async tradeProduct(productId, quantity, isBuying) {
    throw new Error('Method not implemented');
  }

  /**
   * 更新市场价格
   * @param {number} weekNumber 周数
   * @returns {Promise<Object>} 更新结果
   */
  async updateMarketPrices(weekNumber) {
    throw new Error('Method not implemented');
  }

  /**
   * 更新地点商品价格
   * @param {string} locationId 地点ID
   * @param {number} weekNumber 周数
   * @returns {Promise<Array>} 更新后的商品列表
   */
  async updateLocationProducts(locationId, weekNumber) {
    throw new Error('Method not implemented');
  }

  /**
   * 切换地点
   * @param {string} locationId 目标地点ID
   * @param {number} weekNumber 当前周数
   * @returns {Promise<Object>} 切换结果
   */
  async changeLocation(locationId, weekNumber) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取市场状态
   * @returns {Promise<Object>} 市场状态
   */
  async getMarketStatus() {
    throw new Error('Method not implemented');
  }
}

/**
 * 游戏应用服务接口
 * 负责协调游戏主流程
 */
export class IGameService {
  /**
   * 初始化游戏
   * @param {Object} config 游戏配置
   * @returns {Promise<Object>} 初始化结果
   */
  async initialize(config) {
    throw new Error('Method not implemented');
  }

  /**
   * 开始新游戏
   * @param {Object} config 游戏配置
   * @returns {Promise<Object>} 游戏状态
   */
  async startNewGame(config) {
    throw new Error('Method not implemented');
  }

  /**
   * 加载游戏
   * @param {string} saveName 存档名称
   * @returns {Promise<Object>} 加载结果
   */
  async loadGame(saveName) {
    throw new Error('Method not implemented');
  }

  /**
   * 保存游戏
   * @param {string} saveName 存档名称
   * @returns {Promise<Object>} 保存结果
   */
  async saveGame(saveName) {
    throw new Error('Method not implemented');
  }

  /**
   * 处理游戏周期
   * @returns {Promise<Object>} 处理结果
   */
  async processWeek() {
    throw new Error('Method not implemented');
  }

  /**
   * 结束游戏
   * @returns {Promise<Object>} 游戏结果
   */
  async endGame() {
    throw new Error('Method not implemented');
  }
}

/**
 * 事件应用服务接口
 * 负责协调游戏事件的处理
 */
export class IEventService {
  /**
   * 生成游戏事件
   * @param {Object} gameState 游戏状态
   * @returns {Promise<Object>} 生成的事件
   */
  async generateEvent(gameState) {
    throw new Error('Method not implemented');
  }

  /**
   * 处理事件选择
   * @param {string} eventId 事件ID
   * @param {string} choiceId 选择ID
   * @returns {Promise<Object>} 选择结果
   */
  async handleEventChoice(eventId, choiceId) {
    throw new Error('Method not implemented');
  }

  /**
   * 关闭事件
   * @param {string} eventId 事件ID
   * @returns {Promise<void>}
   */
  async closeEvent(eventId) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取当前活跃事件
   * @returns {Promise<Object>} 活跃事件
   */
  async getActiveEvent() {
    throw new Error('Method not implemented');
  }
}
