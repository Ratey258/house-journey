<template>
  <div class="error-log-viewer">
    <div class="error-log-header">
      <h2>{{ $t('system.errorLogs') }}</h2>
      <div class="error-log-actions">
        <button @click="exportLogs" class="export-button">
          {{ $t('system.exportLogs') }}
        </button>
        <button @click="clearLogs" class="clear-button">
          {{ $t('system.clearLogs') }}
        </button>
      </div>
    </div>

    <div class="error-log-filters">
      <div class="filter-group">
        <label>{{ $t('system.severity') }}:</label>
        <select v-model="filterSeverity">
          <option value="all">{{ $t('system.all') }}</option>
          <option value="fatal">{{ $t('errors.severity.fatal') }}</option>
          <option value="error">{{ $t('errors.severity.error') }}</option>
          <option value="warning">{{ $t('errors.severity.warning') }}</option>
          <option value="info">{{ $t('errors.severity.info') }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>{{ $t('system.type') }}:</label>
        <select v-model="filterType">
          <option value="all">{{ $t('system.all') }}</option>
          <option value="validation">{{ $t('system.errorType.validation') }}</option>
          <option value="network">{{ $t('system.errorType.network') }}</option>
          <option value="storage">{{ $t('system.errorType.storage') }}</option>
          <option value="gameLogic">{{ $t('system.errorType.gameLogic') }}</option>
          <option value="system">{{ $t('system.errorType.system') }}</option>
          <option value="unknown">{{ $t('system.errorType.unknown') }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>{{ $t('system.search') }}:</label>
        <input type="text" v-model="searchQuery" placeholder="搜索错误消息..." />
      </div>
    </div>

    <div class="error-log-stats">
      {{ $t('system.showing') }}: {{ filteredLogs.length }} / {{ logs.length }} {{ $t('system.logs') }}
    </div>

    <div class="error-log-list" v-if="filteredLogs.length > 0">
      <div
        v-for="(log, index) in filteredLogs"
        :key="`log-${index}`"
        class="error-log-item"
        :class="getSeverityClass(log.severity)"
      >
        <div class="error-log-summary" @click="toggleDetails(index)">
          <div class="error-meta">
            <span class="error-time">{{ formatDate(log.timestamp) }}</span>
            <span class="error-severity">{{ log.severity }}</span>
            <span class="error-type">{{ log.type }}</span>
          </div>
          <div class="error-message">{{ log.message }}</div>
          <div class="error-context" v-if="log.context">{{ log.context }}</div>
        </div>

        <div class="error-log-details" v-if="expandedLog === index">
          <div v-if="log.error">
            <h4>{{ $t('system.errorDetails') }}:</h4>
            <pre>{{ log.error }}</pre>
          </div>
          <div v-if="log.stack">
            <h4>{{ $t('system.stackTrace') }}:</h4>
            <pre>{{ log.stack }}</pre>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-log-empty">
      {{ $t('system.noLogsFound') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { formatDate } from '../../../infrastructure/utils/formatUtils';

// ==================== 类型定义 ====================

/**
 * 错误严重程度
 */
type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/**
 * 错误类型
 */
type ErrorType = 'validation' | 'network' | 'storage' | 'gameLogic' | 'system' | 'unknown';

/**
 * 筛选选项
 */
type FilterOption = 'all' | ErrorSeverity | ErrorType;

/**
 * 错误日志接口
 */
interface ErrorLog {
  id?: string;
  timestamp: string | Date;
  severity: ErrorSeverity;
  type: ErrorType;
  message: string;
  context?: string;
  error?: string;
  stack?: string;
  [key: string]: any;
}

// 临时声明错误处理函数（待errorHandler.ts导入路径修复后更新）
declare function loadErrorLogs(): Promise<ErrorLog[]>;
declare function clearErrorLogs(): void;
declare function exportErrorLogs(): Promise<boolean>;

// 临时require导入
const { loadErrorLogs: loadLogs, clearErrorLogs: clearLogs, exportErrorLogs: exportLogs } =
  require('../../../infrastructure/utils/errorHandler');

// ==================== 响应式状态 ====================

/**
 * 错误日志数据
 */
const logs = ref<ErrorLog[]>([]);

/**
 * 当前展开的日志索引
 */
const expandedLog = ref<number | null>(null);

/**
 * 严重程度筛选
 */
const filterSeverity = ref<FilterOption>('all');

/**
 * 类型筛选
 */
const filterType = ref<FilterOption>('all');

/**
 * 搜索查询
 */
const searchQuery = ref('');

// ==================== 计算属性 ====================

/**
 * 筛选后的日志列表
 */
const filteredLogs = computed((): ErrorLog[] => {
  return logs.value.filter(log => {
    // 按严重程度筛选
    if (filterSeverity.value !== 'all' && log.severity !== filterSeverity.value) {
      return false;
    }

    // 按类型筛选
    if (filterType.value !== 'all' && log.type !== filterType.value) {
      return false;
    }

    // 搜索查询
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      return (
        (log.message && log.message.toLowerCase().includes(query)) ||
        (log.context && log.context.toLowerCase().includes(query))
      );
    }

    return true;
  });
});

// ==================== 方法 ====================

/**
 * 加载错误日志
 */
const loadErrorLogs = async (): Promise<void> => {
  try {
    logs.value = await loadLogs();
  } catch (error) {
    console.error('加载错误日志失败:', error);
    logs.value = [];
  }
};

/**
 * 根据严重程度获取CSS类
 * @param severity 严重程度
 * @returns CSS类名
 */
const getSeverityClass = (severity: ErrorSeverity): string => {
  switch (severity) {
    case 'fatal': return 'severity-fatal';
    case 'error': return 'severity-error';
    case 'warning': return 'severity-warning';
    case 'info': return 'severity-info';
    default: return '';
  }
};

/**
 * 切换详情显示
 * @param index 日志索引
 */
const toggleDetails = (index: number): void => {
  if (expandedLog.value === index) {
    expandedLog.value = null;
  } else {
    expandedLog.value = index;
  }
};

/**
 * 导出日志
 */
const exportErrorLogs = async (): Promise<void> => {
  try {
    const result = await exportLogs();
    if (result) {
      // 这里应该使用toast或更好的通知方式替代alert
      alert('错误日志导出成功');
    } else {
      alert('错误日志导出失败');
    }
  } catch (error) {
    console.error('导出错误日志失败:', error);
    alert('错误日志导出失败');
  }
};

/**
 * 清空日志
 */
const clearErrorLogs = (): void => {
  if (confirm('确定要清空所有错误日志吗？')) {
    try {
      clearLogs();
      logs.value = [];
      expandedLog.value = null;
    } catch (error) {
      console.error('清空错误日志失败:', error);
      alert('清空错误日志失败');
    }
  }
};

/**
 * 刷新日志列表
 */
const refreshLogs = (): void => {
  loadErrorLogs();
};

/**
 * 重置筛选条件
 */
const resetFilters = (): void => {
  filterSeverity.value = 'all';
  filterType.value = 'all';
  searchQuery.value = '';
  expandedLog.value = null;
};

// ==================== 生命周期 ====================

/**
 * 组件挂载时初始加载
 */
onMounted(() => {
  loadErrorLogs();
});
</script>

<style scoped>
.error-log-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background-color: #f7f8fa;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.error-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.error-log-header h2 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.error-log-actions {
  display: flex;
  gap: 8px;
}

.export-button,
.clear-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.export-button {
  background-color: #409eff;
  color: white;
}

.export-button:hover {
  background-color: #337ecc;
}

.clear-button {
  background-color: #f56c6c;
  color: white;
}

.clear-button:hover {
  background-color: #e74c3c;
}

.error-log-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: white;
  border-radius: 6px;
  border: 1px solid #e0e6ed;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.filter-group select,
.filter-group input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-group input {
  min-width: 200px;
}

.error-log-stats {
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.error-log-list {
  flex: 1;
  overflow-y: auto;
  border-radius: 6px;
  border: 1px solid #e0e6ed;
  background-color: white;
}

.error-log-item {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;
}

.error-log-item:last-child {
  border-bottom: none;
}

.error-log-item:hover {
  background-color: #f9f9f9;
}

.error-log-summary {
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
}

.error-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: 12px;
}

.error-time {
  color: #666;
  font-family: monospace;
}

.error-severity,
.error-type {
  padding: 2px 6px;
  border-radius: 3px;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 10px;
}

.error-severity {
  background-color: #f0f0f0;
  color: #666;
}

.error-type {
  background-color: #e6f7ff;
  color: #1890ff;
}

.error-message {
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
  line-height: 1.4;
}

.error-context {
  font-size: 14px;
  color: #666;
  font-style: italic;
}

.error-log-details {
  padding: 16px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.error-log-details h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.error-log-details pre {
  background-color: #f1f3f4;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-log-empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #999;
  font-size: 16px;
  font-style: italic;
}

/* 严重程度样式 */
.severity-fatal {
  border-left: 4px solid #d32f2f;
}

.severity-fatal .error-severity {
  background-color: #ffebee;
  color: #d32f2f;
}

.severity-error {
  border-left: 4px solid #f56c6c;
}

.severity-error .error-severity {
  background-color: #fef0f0;
  color: #f56c6c;
}

.severity-warning {
  border-left: 4px solid #e6a23c;
}

.severity-warning .error-severity {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.severity-info {
  border-left: 4px solid #409eff;
}

.severity-info .error-severity {
  background-color: #ecf5ff;
  color: #409eff;
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .error-log-viewer {
    background-color: #2d3748;
    color: #e2e8f0;
  }

  .error-log-header h2 {
    color: #e2e8f0;
  }

  .error-log-filters {
    background-color: #4a5568;
    border-color: #2d3748;
  }

  .filter-group label {
    color: #a0aec0;
  }

  .filter-group select,
  .filter-group input {
    background-color: #2d3748;
    border-color: #4a5568;
    color: #e2e8f0;
  }

  .error-log-list {
    background-color: #4a5568;
    border-color: #2d3748;
  }

  .error-log-item {
    border-color: #2d3748;
  }

  .error-log-item:hover {
    background-color: #2d3748;
  }

  .error-log-details {
    background-color: #2d3748;
    border-color: #4a5568;
  }

  .error-log-details pre {
    background-color: #1a202c;
    color: #e2e8f0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .error-log-viewer {
    padding: 12px;
  }

  .error-log-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .error-log-filters {
    flex-direction: column;
    gap: 12px;
  }

  .filter-group input {
    min-width: auto;
    width: 100%;
  }

  .error-meta {
    flex-direction: column;
    gap: 4px;
  }

  .error-log-summary {
    padding: 10px 12px;
  }
}
</style>
