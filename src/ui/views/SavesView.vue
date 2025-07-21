<template>
  <div class="saves-view">
    <div class="saves-container">
      <div class="header">
        <h1>游戏存档</h1>
        <button class="back-button" @click="goBack">返回</button>
      </div>
      
      <div class="saves-content">
        <div v-if="isLoading" class="loading">
          <p>正在加载存档列表...</p>
        </div>
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button class="button" @click="fetchSaves">重试</button>
        </div>
        
        <div v-else-if="saves.length === 0" class="empty-state">
          <p>暂无存档</p>
          <button class="button" @click="goToMainMenu">返回主菜单</button>
        </div>
        
        <div v-else class="saves-list">
          <div 
            v-for="save in saves" 
            :key="save.name" 
            class="save-item"
            :class="{ 
              'selected': selectedSave === save.name,
              'autosave': isAutoSave(save.name)
            }"
            @click="selectSave(save.name)"
          >
            <div class="save-info">
              <div class="save-header">
                <h3>{{ formatSaveName(save.name) }}</h3>
                <span v-if="isAutoSave(save.name)" class="autosave-badge">自动</span>
              </div>
              <p class="save-date">{{ formatDate(save.lastModified) }}</p>
              <p v-if="saveDetails[save.name]" class="save-details">
                第{{ saveDetails[save.name].currentWeek }}周 | 
                金钱: {{ formatCurrency(saveDetails[save.name].playerMoney) }} | 
                地点: {{ saveDetails[save.name].locationName || '未知' }}
              </p>
            </div>
            
            <div class="save-actions">
              <button class="load-button" @click.stop="loadSave(save.name)">读取</button>
              <button class="delete-button" @click.stop="confirmDelete(save.name)">删除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="dialog-overlay">
      <div class="dialog">
        <h2 class="dialog-title">确认删除</h2>
        <p>您确定要删除存档"{{ saveToDelete }}"吗？此操作不可撤销。</p>
        <div class="dialog-actions">
          <button class="button danger" @click="deleteSave">删除</button>
          <button class="button" @click="cancelDelete">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores';
import { useUiStore } from '@/stores/uiStore';
import { formatDate, formatNumber, formatCurrency } from '@/infrastructure/utils';
import { handleError, ErrorType, ErrorSeverity } from '../../infrastructure/utils/errorHandler';

const router = useRouter();
const gameStore = useGameStore();
const uiStore = useUiStore();

// 响应式状态
const saves = ref([]);
const selectedSave = ref(null);
const isLoading = ref(false);
const error = ref(null);
const saveDetails = ref({});
const showDeleteConfirm = ref(false);
const saveToDelete = ref('');

// 加载存档列表
async function fetchSaves() {
  try {
    isLoading.value = true;
    error.value = null;
    
    const result = await window.electronAPI.getSaves();
    
    if (result.success) {
      saves.value = result.saves || [];
      
      // 获取每个存档的详细信息
      for (const save of saves.value) {
        fetchSaveDetails(save.name);
      }
    } else {
      error.value = result.error || '加载存档失败';
    }
  } catch (err) {
    handleError(err, 'SavesView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('Error fetching saves:', err);
    error.value = '加载存档时发生错误';
  } finally {
    isLoading.value = false;
  }
}

// 选择存档
function selectSave(saveName) {
  selectedSave.value = saveName;
}

// 加载存档
async function loadSave(saveName) {
  try {
    isLoading.value = true;
    const result = await gameStore.loadGame(saveName);
    
    if (result.success) {
      router.push('/game');
    } else {
      uiStore.addNotification('加载存档失败', 'error');
    }
  } catch (err) {
    handleError(err, 'SavesView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('Error loading save:', err);
    uiStore.addNotification('加载存档时发生错误', 'error');
  } finally {
    isLoading.value = false;
  }
}

// 确认删除存档
function confirmDelete(saveName) {
  saveToDelete.value = saveName;
  showDeleteConfirm.value = true;
}

// 删除存档
async function deleteSave() {
  try {
    const result = await window.electronAPI.deleteSave(saveToDelete.value);
    
    if (result.success) {
      if (selectedSave.value === saveToDelete.value) {
        selectedSave.value = null;
      }
      
      // 重新加载存档列表
      await fetchSaves();
      uiStore.addNotification('存档已删除', 'success');
    } else {
      uiStore.addNotification('删除存档失败', 'error');
    }
  } catch (err) {
    handleError(err, 'SavesView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('Error deleting save:', err);
    uiStore.addNotification('删除存档时发生错误', 'error');
  } finally {
    // 关闭确认对话框
    showDeleteConfirm.value = false;
    saveToDelete.value = '';
  }
}

// 取消删除
function cancelDelete() {
  showDeleteConfirm.value = false;
  saveToDelete.value = '';
}

// 格式化存档名称显示
function formatSaveName(name) {
  // 如果是自动存档，提取关键信息
  if (isAutoSave(name)) {
    // 匹配自动存档的周数 (W后面的数字)
    const weekMatch = name.match(/W(\d+)/);
    const week = weekMatch ? weekMatch[1] : '?';
    
    // 提取类型 (exit表示退出时存档，其他情况)
    let type = '周期';
    if (name.includes('_exit_')) {
      type = '退出时';
    } else if (name.includes('_buyHouse_')) {
      type = '购房时';
    }
    
    return `自动存档 (${type}, 第${week}周)`;
  }
  
  // 手动存档直接显示名称
  return name;
}

// 判断是否为自动存档
function isAutoSave(name) {
  return name.startsWith('autosave_');
}

// 获取存档详细信息
async function fetchSaveDetails(saveName) {
  try {
    const result = await window.electronAPI.loadGame(saveName);
    if (result.success && result.gameState) {
      saveDetails.value[saveName] = {
        currentWeek: result.gameState.currentWeek || '?',
        playerMoney: result.gameState.gameData?.player?.money,
        locationName: result.gameState.gameData?.currentLocation?.name
      };
    }
  } catch (error) {
    handleError(error, 'SavesView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('Failed to fetch save details:', error);
  }
}

// 返回主菜单
function goToMainMenu() {
  router.push('/');
}

// 返回上一页
function goBack() {
  router.push('/');
}

// 组件挂载时加载存档列表
onMounted(() => {
  fetchSaves();
});
</script>

<style scoped>
.saves-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.saves-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 700px;
  max-width: 100%;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.header h1 {
  margin: 0;
  font-size: 24px;
  color: #333;
}

.back-button {
  background-color: transparent;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background-color: #f5f5f5;
}

.saves-content {
  padding: 20px;
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 40px 0;
}

.error {
  color: #e74c3c;
}

.saves-list {
  margin-top: 20px;
}

.save-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid transparent;
  transition: all 0.2s ease;
}

.save-item:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-left-color: #4caf50;
}

.save-item.selected {
  border-left-color: #2196f3;
  background-color: #f0f8ff;
}

.save-item.autosave {
  border-left-color: #ff9800;
}

.save-item.autosave.selected {
  border-left-color: #ff5722;
}

.save-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.save-info h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.autosave-badge {
  background-color: #ff9800;
  color: white;
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  font-weight: bold;
}

.save-date {
  margin: 0;
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.save-details {
  margin: 0;
  font-size: 14px;
  color: #555;
}

.save-actions {
  display: flex;
  gap: 8px;
}

.load-button, .delete-button, .button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.load-button {
  background-color: #3498db;
  color: white;
}

.load-button:hover {
  background-color: #2980b9;
}

.delete-button {
  background-color: #e74c3c;
  color: white;
}

.delete-button:hover {
  background-color: #c0392b;
}

.button {
  background-color: #7f8c8d;
  color: white;
}

.button:hover {
  background-color: #6c7a7a;
}

.button.danger {
  background-color: #e74c3c;
  color: white;
}

.button.danger:hover {
  background-color: #c0392b;
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.dialog {
  background-color: white;
  border-radius: 8px;
  width: 400px;
  padding: 24px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.dialog-title {
  font-size: 20px;
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.dialog-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 