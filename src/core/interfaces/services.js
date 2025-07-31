/**
 * 服务接口定义
 * 这个文件定义了领域服务的标准接口
 */

/**
 * 价格系统服务接口
 * 负责处理价格计算和趋势分析
 */
export class IPriceSystemService {
  /**
   * 计算新价格
   * @param {Object} product 产品对象
   * @param {number} week 当前周数
   * @param {Object} previousPrice 前一个价格数据
   * @param {number} locationFactor 位置因子
   * @param {Object} marketModifiers 市场修正因子
   * @returns {Object} {price: 新价格, trend: 趋势, changePercent: 变化百分比}
   */
  calculatePrice(product, week, previousPrice, locationFactor, marketModifiers) {
    throw new Error('Method not implemented');
  }

  /**
   * 批量更新所有商品的价格
   * @param {Array} products 商品列表
   * @param {number} currentWeek 当前周数
   * @param {Object} priceHistory 价格历史数据
   * @param {Object} marketModifiers 市场调整因子
   * @returns {Object} 更新后的价格对象
   */
  batchUpdatePrices(products, currentWeek, priceHistory, marketModifiers) {
    throw new Error('Method not implemented');
  }

  /**
   * 生成特定地点的商品价格
   * @param {Array} products - 产品列表
   * @param {Object} location - 地点对象
   * @param {Object} priceHistory - 价格历史
   * @param {number} week - 当前周数
   * @param {Object} marketModifiers - 市场修正因子
   * @returns {Array} 包含价格的商品列表
   */
  generateLocationProducts(products, location, priceHistory, week, marketModifiers) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取价格趋势描述
   * @param {string} trend 趋势代码
   * @returns {string} 趋势描述
   */
  getTrendDescription(trend) {
    throw new Error('Method not implemented');
  }

  /**
   * 清除价格缓存
   * @param {string} [productId] 产品ID，不提供则清除所有
   */
  clearPriceCache(productId) {
    throw new Error('Method not implemented');
  }
}

/**
 * 事件系统服务接口
 * 负责处理游戏事件的生成和执行
 */
export class IEventSystemService {
  /**
   * 初始化事件系统
   */
  initialize() {
    throw new Error('Method not implemented');
  }

  /**
   * 生成随机事件
   * @param {Object} gameState 游戏状态
   * @param {number} week 当前周数
   * @returns {Object} 生成的事件
   */
  generateEvent(gameState, week) {
    throw new Error('Method not implemented');
  }

  /**
   * 执行事件
   * @param {Object} event 事件对象
   * @param {Object} gameState 游戏状态
   * @returns {Object} 事件结果
   */
  executeEvent(event, gameState) {
    throw new Error('Method not implemented');
  }

  /**
   * 应用事件选择结果
   * @param {Object} event 事件对象
   * @param {string} choiceId 选择ID
   * @param {Object} gameState 游戏状态
   * @returns {Object} 选择结果
   */
  applyEventChoice(event, choiceId, gameState) {
    throw new Error('Method not implemented');
  }
}

/**
 * 游戏循环服务接口
 * 负责处理游戏主循环和游戏状态更新
 */
export class IGameLoopService {
  /**
   * 初始化游戏
   * @param {Object} config 游戏配置
   */
  initialize(config) {
    throw new Error('Method not implemented');
  }

  /**
   * 开始新游戏
   * @param {Object} config 游戏配置
   * @returns {Object} 初始游戏状态
   */
  startNewGame(config) {
    throw new Error('Method not implemented');
  }

  /**
   * 执行一周游戏循环
   * @param {Object} gameState 当前游戏状态
   * @returns {Object} 更新后的游戏状态
   */
  processWeek(gameState) {
    throw new Error('Method not implemented');
  }

  /**
   * 结束游戏
   * @param {Object} gameState 当前游戏状态
   * @returns {Object} 游戏结果
   */
  endGame(gameState) {
    throw new Error('Method not implemented');
  }
}
