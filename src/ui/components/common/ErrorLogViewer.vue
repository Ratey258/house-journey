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
        :key="index" 
        class="error-log-item"
        :class="getSeverityClass(log.severity)"
        @click="toggleDetails(index)"
      >
        <div class="error-log-summary">
          <div class="error-time">
            {{ formatDate(log.timestamp) }}
          </div>
          <div class="error-tags">
            <span class="error-severity">{{ log.severity }}</span>
            <span class="error-type">{{ log.type }}</span>
          </div>
          <div class="error-message">{{ log.message }}</div>
          <div class="error-context">{{ log.context }}</div>
          <div class="toggle-details">
            {{ expandedLog === index ? '▼' : '▶' }}
          </div>
        </div>
        
        <div v-if="expandedLog === index" class="error-details">
          <div v-if="log.metadata && Object.keys(log.metadata).length > 0" class="error-metadata">
            <h4>{{ $t('system.metadata') }}:</h4>
            <pre>{{ JSON.stringify(log.metadata, null, 2) }}</pre>
          </div>
          
          <div v-if="log.stack" class="error-stack">
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

<script>
import { ref, computed } from 'vue';
import { loadErrorLogs, clearErrorLogs, exportErrorLogs } from '@/infrastructure/utils/errorHandler';
import { formatDate } from '@/infrastructure/utils';

export default {
  name: 'ErrorLogViewer',
  setup() {
    // 错误日志数据
    const logs = ref([]);
    const expandedLog = ref(null);
    
    // 筛选条件
    const filterSeverity = ref('all');
    const filterType = ref('all');
    const searchQuery = ref('');
    
    // 加载日志
    async function loadLogs() {
      logs.value = await loadErrorLogs();
    }
    
    // 筛选日志
    const filteredLogs = computed(() => {
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
    
    // 根据严重程度获取CSS类
    function getSeverityClass(severity) {
      switch (severity) {
        case 'fatal': return 'severity-fatal';
        case 'error': return 'severity-error';
        case 'warning': return 'severity-warning';
        case 'info': return 'severity-info';
        default: return '';
      }
    }
    
    // 切换详情显示
    function toggleDetails(index) {
      if (expandedLog.value === index) {
        expandedLog.value = null;
      } else {
        expandedLog.value = index;
      }
    }
    
    // 导出日志
    async function exportLogs() {
      const result = await exportErrorLogs();
      if (result) {
        alert('错误日志导出成功');
      } else {
        alert('错误日志导出失败');
      }
    }
    
    // 清空日志
    function clearLogs() {
      if (confirm('确定要清空所有错误日志吗？')) {
        clearErrorLogs();
        logs.value = [];
        expandedLog.value = null;
      }
    }
    
    // 初始加载
    loadLogs();
    
    return {
      logs,
      filteredLogs,
      expandedLog,
      filterSeverity,
      filterType,
      searchQuery,
      formatDate,
      getSeverityClass,
      toggleDetails,
      exportLogs,
      clearLogs
    };
  }
};
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

.error-log-actions {
  display: flex;
  gap: 8px;
}

.export-button, .clear-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.export-button {
  background-color: #409eff;
  color: white;
}

.clear-button {
  background-color: #f56c6c;
  color: white;
}

.error-log-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-group select, .filter-group input {
  padding: 6px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.error-log-stats {
  margin-bottom: 8px;
  font-size: 0.9em;
  color: #606266;
}

.error-log-list {
  overflow-y: auto;
  flex-grow: 1;
}

.error-log-item {
  margin-bottom: 8px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.error-log-summary {
  display: grid;
  grid-template-columns: 150px auto 1fr auto 20px;
  align-items: center;
  padding: 10px;
  gap: 10px;
  background-color: white;
}

.error-log-item:hover .error-log-summary {
  background-color: #f5f7fa;
}

.error-time {
  font-size: 0.85em;
  color: #606266;
}

.error-tags {
  display: flex;
  gap: 4px;
}

.error-severity, .error-type {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.8em;
  text-transform: uppercase;
}

.error-severity {
  background-color: #f0f0f0;
}

.error-type {
  background-color: #e6f7ff;
  color: #1890ff;
}

.error-message {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.error-context {
  font-size: 0.85em;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.toggle-details {
  font-size: 0.8em;
  color: #909399;
}

.error-details {
  padding: 12px;
  background-color: #f5f7fa;
  border-top: 1px solid #ebeef5;
}

.error-metadata, .error-stack {
  margin-bottom: 12px;
}

.error-metadata h4, .error-stack h4 {
  margin: 0 0 4px 0;
  font-size: 1em;
  color: #606266;
}

.error-metadata pre, .error-stack pre {
  margin: 0;
  padding: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.9em;
  color: #303133;
}

.error-log-empty {
  padding: 24px;
  text-align: center;
  color: #909399;
}

/* 严重程度样式 */
.severity-fatal .error-log-summary {
  border-left: 4px solid #ff4d4f;
}

.severity-error .error-log-summary {
  border-left: 4px solid #f56c6c;
}

.severity-warning .error-log-summary {
  border-left: 4px solid #e6a23c;
}

.severity-info .error-log-summary {
  border-left: 4px solid #909399;
}

.severity-fatal .error-severity {
  background-color: #fff1f0;
  color: #ff4d4f;
}

.severity-error .error-severity {
  background-color: #fef0f0;
  color: #f56c6c;
}

.severity-warning .error-severity {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.severity-info .error-severity {
  background-color: #f4f4f5;
  color: #909399;
}
</style> 