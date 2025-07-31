/**
 * 基础设施服务接口定义
 * 这个文件定义了基础设施层服务的标准接口
 */

/**
 * 存储服务接口
 * 负责数据持久化
 */
export class IStorageService {
  /**
   * 保存数据
   * @param {string} key 键
   * @param {any} data 数据
   * @returns {Promise<void>}
   */
  async save(key, data) {
    throw new Error('Method not implemented');
  }

  /**
   * 读取数据
   * @param {string} key 键
   * @returns {Promise<any>} 数据
   */
  async load(key) {
    throw new Error('Method not implemented');
  }

  /**
   * 删除数据
   * @param {string} key 键
   * @returns {Promise<boolean>} 是否删除成功
   */
  async delete(key) {
    throw new Error('Method not implemented');
  }

  /**
   * 检查数据是否存在
   * @param {string} key 键
   * @returns {Promise<boolean>} 是否存在
   */
  async exists(key) {
    throw new Error('Method not implemented');
  }

  /**
   * 列出所有键
   * @param {string} [prefix] 前缀
   * @returns {Promise<string[]>} 键列表
   */
  async listKeys(prefix) {
    throw new Error('Method not implemented');
  }
}

/**
 * 日志服务接口
 * 负责日志记录
 */
export class ILogService {
  /**
   * 记录信息日志
   * @param {string} message 日志消息
   * @param {Object} [data] 附加数据
   */
  info(message, data) {
    throw new Error('Method not implemented');
  }

  /**
   * 记录警告日志
   * @param {string} message 日志消息
   * @param {Object} [data] 附加数据
   */
  warn(message, data) {
    throw new Error('Method not implemented');
  }

  /**
   * 记录错误日志
   * @param {string} message 日志消息
   * @param {Error} [error] 错误对象
   * @param {Object} [data] 附加数据
   */
  error(message, error, data) {
    throw new Error('Method not implemented');
  }

  /**
   * 记录调试日志
   * @param {string} message 日志消息
   * @param {Object} [data] 附加数据
   */
  debug(message, data) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取日志
   * @param {Date} [date] 日期
   * @param {string} [level] 日志级别
   * @returns {Promise<Object[]>} 日志列表
   */
  async getLogs(date, level) {
    throw new Error('Method not implemented');
  }
}

/**
 * 错误处理服务接口
 * 负责全局错误处理
 */
export class IErrorHandlerService {
  /**
   * 处理错误
   * @param {Error} error 错误对象
   * @param {string} context 错误上下文
   * @param {string} type 错误类型
   * @param {string} severity 错误严重程度
   * @returns {Object} 错误信息对象
   */
  handleError(error, context, type, severity) {
    throw new Error('Method not implemented');
  }

  /**
   * 带错误处理的函数包装
   * @param {Function} fn 待包装函数
   * @param {string} context 错误上下文
   * @param {string} type 错误类型
   * @param {string} severity 错误严重程度
   * @returns {Function} 包装后的函数
   */
  withErrorHandling(fn, context, type, severity) {
    throw new Error('Method not implemented');
  }

  /**
   * 获取错误日志
   * @returns {Object[]} 错误日志列表
   */
  getErrorLogs() {
    throw new Error('Method not implemented');
  }

  /**
   * 清除错误日志
   */
  clearErrorLogs() {
    throw new Error('Method not implemented');
  }
}

/**
 * 事件发射器接口
 * 负责事件通信
 */
export class IEventEmitter {
  /**
   * 注册事件监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听函数
   * @returns {Function} 取消注册函数
   */
  on(event, listener) {
    throw new Error('Method not implemented');
  }

  /**
   * 注册一次性事件监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听函数
   * @returns {Function} 取消注册函数
   */
  once(event, listener) {
    throw new Error('Method not implemented');
  }

  /**
   * 取消注册事件监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听函数
   */
  off(event, listener) {
    throw new Error('Method not implemented');
  }

  /**
   * 发射事件
   * @param {string} event 事件名称
   * @param {any} args 事件参数
   */
  emit(event, ...args) {
    throw new Error('Method not implemented');
  }
}
