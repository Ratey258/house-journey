/**
 * 智能日志系统使用示例
 * 展示如何替代项目中的console.log调用
 */
import { ref, onMounted, watch } from 'vue';
import { useSmartLogger, LogCategory } from '@/infrastructure/utils/smartLogger';

export function useSmartLoggerDemo() {
  const { game, ui, performance, storage, network } = useSmartLogger();

  // 演示：游戏状态变化日志
  const gameState = ref('initializing');
  
  // 替代：console.log('游戏状态变化:', newState)
  watch(gameState, (newState, oldState) => {
    game.info('游戏状态变化', { from: oldState, to: newState }, 'state-change');
  });

  // 演示：性能监控
  const measurePerformance = async (operationName: string, operation: () => Promise<any>) => {
    const startTime = performance.start();
    
    try {
      const result = await operation();
      performance.end(operationName, startTime, { success: true });
      return result;
    } catch (error) {
      performance.end(operationName, startTime, { success: false, error });
      throw error;
    }
  };

  // 演示：网络请求日志
  const fetchGameData = async (url: string) => {
    network.request(url, 'GET');
    
    try {
      const response = await fetch(url);
      network.response(url, response.status, { size: response.headers.get('content-length') });
      return response.json();
    } catch (error) {
      network.error(url, error);
      throw error;
    }
  };

  // 演示：存储操作日志
  const saveGameData = (data: any) => {
    try {
      localStorage.setItem('gameData', JSON.stringify(data));
      storage.save('gameData', { size: JSON.stringify(data).length });
    } catch (error) {
      storage.error('save gameData', error);
    }
  };

  // 演示：UI交互日志
  const handleUserAction = (action: string, details?: any) => {
    // 替代：console.log('用户操作:', action, details)
    ui.info(`用户操作: ${action}`, details, 'user-interaction');
  };

  // 演示：调试日志（生产环境自动移除）
  const debugComponentState = (componentName: string, state: any) => {
    // 替代：console.log('组件状态调试:', componentName, state)
    ui.debug(`${componentName}组件状态`, state, 'debug');
  };

  // 演示：错误处理
  const handleGameError = (error: Error, context: string) => {
    // 替代：console.error('游戏错误:', error)
    game.error(`游戏错误: ${context}`, { message: error.message, stack: error.stack }, 'error-handling');
  };

  return {
    // 状态
    gameState,
    
    // 方法
    measurePerformance,
    fetchGameData,
    saveGameData,
    handleUserAction,
    debugComponentState,
    handleGameError,
    
    // 日志器
    logger: { game, ui, performance, storage, network }
  };
}

/**
 * 使用示例：在Vue组件中替代console.log
 */
// 示例组件代码：
/*
<script setup>
import { onMounted, ref } from 'vue';
import { useSmartLogger } from '@/infrastructure/utils/smartLogger';

const { game, ui, performance } = useSmartLogger();

// ❌ 旧方式
// console.log('组件初始化');

// ✅ 新方式 - 开发环境显示，生产环境移除
ui.debug('GameView组件初始化');

// ❌ 旧方式
// console.log('游戏数据加载完成:', gameData);

// ✅ 新方式 - 保留重要业务信息
game.info('游戏数据加载完成', gameData, 'data-loading');

// ❌ 旧方式
// console.error('游戏保存失败:', error);

// ✅ 新方式 - 错误会自动发送到Electron和存储
game.error('游戏保存失败', error, 'save-error');

// 性能监控示例
const startTime = performance.start();
await loadGameData();
performance.end('游戏数据加载', startTime);
</script>
*/