/**
 * 基础设施工具函数索引
 * 导出所有工具函数，便于统一引用
 */

// 导出错误处理工具
export * from './errorHandler';
export * from './errorTypes';

// 导出格式化工具函数
export * from './formatUtils';

// 其他工具函数
// ... 可能的其他工具函数导出

/**
 * 创建状态变更日志中间件
 * 用于跟踪Store的状态变更，便于调试
 * @param {Object} store - Pinia Store实例
 * @param {Object} options - 配置选项
 * @returns {void}
 */
export function createStateLogger(store, options = {}) {
  const {
    collapsed = true,
    logActions = true,
    logMutations = true,
    logPatchOperations = true,
    filter = null,
    actionNameFilter = null
  } = options;
  
  // 如果不是开发环境或用户明确禁用，则不执行日志
  if (process.env.NODE_ENV !== 'development' && !options.forceEnable) {
    return;
  }
  
  // 记录操作
  if (logActions) {
    store.$onAction(({
      name, // action名称
      args, // 参数数组
      after, // 操作成功时的钩子
      onError // 操作失败时的钩子
    }) => {
      // 如果有过滤器且不满足条件，则跳过日志
      if (actionNameFilter && !actionNameFilter(name)) {
        return;
      }
      
      // 分组显示更整洁
      const groupMethod = collapsed ? console.groupCollapsed : console.group;
      
      // 打印开始信息
      groupMethod(
        `%c Action %c ${name} %c`,
        'background: #9E9E9E; color: #fff; padding: 2px; border-radius: 2px;',
        'background: #4CAF50; color: #fff; padding: 2px; border-radius: 2px;',
        'background: transparent'
      );
      
      console.log('%c参数: ', 'color: #9E9E9E; font-weight: bold;', ...args);
      
      // 操作后执行
      after((result) => {
        console.log('%c结果: ', 'color: #4CAF50; font-weight: bold;', result);
        console.groupEnd();
      });
      
      // 错误处理
      onError((error) => {
        console.log('%c错误: ', 'color: #F44336; font-weight: bold;', error);
        console.groupEnd();
      });
    });
  }
  
  // 记录状态变更
  if (logMutations) {
    // 用于状态比较的工具函数
    const getStateSnapshot = (state) => JSON.parse(JSON.stringify(state));
    
    // 保存初始状态
    let prevState = getStateSnapshot(store.$state);
    
    // 监听状态变化
    store.$subscribe((mutation, state) => {
      // 如果有过滤器且不满足条件，则跳过日志
      if (filter && !filter(mutation)) {
        return;
      }
      
      // 获取当前状态快照
      const nextState = getStateSnapshot(state);
      
      // 比较状态变化
      const stateChanges = compareStates(prevState, nextState);
      
      // 如果有变化，则输出日志
      if (Object.keys(stateChanges).length > 0) {
        const groupMethod = collapsed ? console.groupCollapsed : console.group;
        
        groupMethod(
          `%c State Change %c ${store.$id} %c`,
          'background: #9E9E9E; color: #fff; padding: 2px; border-radius: 2px;',
          'background: #2196F3; color: #fff; padding: 2px; border-radius: 2px;',
          'background: transparent'
        );
        
        console.log('%c变更前: ', 'color: #9E9E9E; font-weight: bold;', prevState);
        console.log('%c变更后: ', 'color: #4CAF50; font-weight: bold;', nextState);
        console.log('%c变更内容: ', 'color: #2196F3; font-weight: bold;', stateChanges);
        
        console.groupEnd();
      }
      
      // 更新前一状态
      prevState = nextState;
    });
  }
}

/**
 * 比较两个状态对象，返回变化的部分
 * @param {Object} prevState - 变更前状态
 * @param {Object} nextState - 变更后状态
 * @returns {Object} 变化的属性
 */
function compareStates(prevState, nextState) {
  const changes = {};
  
  // 遍历新状态，检查值是否变化
  for (const key in nextState) {
    // 跳过函数和Symbol
    if (typeof nextState[key] === 'function' || typeof key === 'symbol') {
      continue;
    }
    
    // 如果是对象且不是数组，递归比较
    if (
      typeof nextState[key] === 'object' && 
      nextState[key] !== null && 
      !Array.isArray(nextState[key]) &&
      typeof prevState[key] === 'object' && 
      prevState[key] !== null
    ) {
      const nestedChanges = compareStates(prevState[key], nextState[key]);
      if (Object.keys(nestedChanges).length > 0) {
        changes[key] = nestedChanges;
      }
    } 
    // 对于数组和基本类型，直接比较
    else if (JSON.stringify(prevState[key]) !== JSON.stringify(nextState[key])) {
      changes[key] = nextState[key];
    }
  }
  
  return changes;
}

/**
 * 创建批量更新函数
 * 用于将多个状态更新合并为一次操作，减少重渲染次数
 */
export function createBatchUpdater() {
  let isBatching = false;
  const pendingEffects = [];
  
  /**
   * 批量执行更新操作
   * @param {Function} fn - 包含多个状态更新的函数
   */
  function batchUpdates(fn) {
    const prevIsBatching = isBatching;
    isBatching = true;
    
    try {
      fn();
    } finally {
      isBatching = prevIsBatching;
      
      // 如果这是最外层批处理，执行所有效果
      if (!isBatching) {
        const effects = [...pendingEffects];
        pendingEffects.length = 0;
        effects.forEach(effect => effect());
      }
    }
  }
  
  /**
   * 注册一个更新效果
   * @param {Function} effect - 更新效果函数
   */
  function registerEffect(effect) {
    if (isBatching) {
      pendingEffects.push(effect);
    } else {
      effect();
    }
  }
  
  return { batchUpdates, registerEffect };
}

