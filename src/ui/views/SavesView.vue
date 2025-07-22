<template>
  <div class="saves-view">
    <div class="game-particles"></div>
    <div class="saves-container">
      <div class="header">
        <h1><span class="title-icon">💾</span> 游戏存档</h1>
        <button class="back-button" @click="goBack">返回</button>
      </div>
      
      <div class="saves-content">
        <div v-if="isLoading" class="loading">
          <div class="loading-spinner-mini"></div>
          <p>正在加载存档列表...</p>
        </div>
        
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button class="button" @click="fetchSaves">重试</button>
        </div>
        
        <div v-else-if="saves.length === 0" class="empty-state">
          <div class="empty-icon">📁</div>
          <h3>暂无游戏存档</h3>
          <p>开始新游戏并保存进度后，存档将显示在这里</p>
          <div class="empty-actions">
            <button class="button primary" @click="goToMainMenu">返回主菜单</button>
            <button class="button new-game" @click="startNewGame">开始新游戏</button>
          </div>
        </div>
        
        <div v-else class="saves-list">
          <transition-group name="save-item">
            <div 
              v-for="(save, index) in saves" 
              :key="save.name" 
              class="save-item"
              :class="{ 
                'selected': selectedSave === save.name,
                'autosave': isAutoSave(save.name)
              }"
              @click="selectSave(save.name)"
              :style="{'--delay': index * 0.05 + 's'}"
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
                <button class="load-button" @click.stop="loadSave(save.name)">
                  <span class="button-icon">▶️</span>读取
                </button>
                <button class="delete-button" @click.stop="confirmDelete(save.name)">
                  <span class="button-icon">🗑️</span>删除
                </button>
              </div>
            </div>
          </transition-group>
        </div>
      </div>
    </div>
    
    <!-- 删除确认对话框 -->
    <transition name="fade">
      <div v-if="showDeleteConfirm" class="dialog-overlay" @click.self="cancelDelete">
        <transition name="zoom">
          <div class="dialog">
            <h2 class="dialog-title">确认删除</h2>
            <p>您确定要删除存档"{{ saveToDelete }}"吗？此操作不可撤销。</p>
            <div class="dialog-actions">
              <button class="button danger" @click="deleteSave">
                <span class="button-icon">🗑️</span>删除
              </button>
              <button class="button" @click="cancelDelete">
                <span class="button-icon">❌</span>取消
              </button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
    
    <!-- 加载指示器 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">正在加载游戏，请稍候...</p>
        <p class="loading-tip">{{ loadingTips[currentTipIndex] }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useGameStore } from '@/stores';
import { useUiStore } from '@/stores/uiStore';
import { useSaveStore } from '@/stores/persistence';
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
const currentTipIndex = ref(0);

// 加载提示
const loadingTips = [
  "正在读取存档数据...",
  "正在加载市场信息...",
  "正在恢复玩家状态...",
  "正在准备游戏环境...",
  "准备进入游戏世界..."
];

// 加载存档列表
async function fetchSaves() {
  try {
    isLoading.value = true;
    error.value = null;
    
    const result = await window.electronAPI.listSaves();
    
    if (result.success) {
      saves.value = result.saves || [];
      console.log('已加载存档列表:', saves.value);
      
      // 获取每个存档的详细信息
      for (const save of saves.value) {
        await fetchSaveDetails(save.name);
      }
    } else {
      error.value = result.error || '加载存档失败';
      console.error('加载存档列表失败:', result.error);
    }
  } catch (err) {
    handleError(err, 'SavesView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('加载存档列表时出错:', err);
    error.value = '加载存档时发生错误: ' + (err.message || '未知错误');
  } finally {
    isLoading.value = false;
  }
}

// 选择存档
function selectSave(saveName) {
  selectedSave.value = saveName;
}

// 启动加载提示轮播
function startLoadingTips() {
  currentTipIndex.value = 0;
  const interval = setInterval(() => {
    currentTipIndex.value = (currentTipIndex.value + 1) % loadingTips.length;
    if (!isLoading.value) {
      clearInterval(interval);
    }
  }, 1500);
}

// 加载存档
async function loadSave(saveName) {
  try {
    console.log('尝试加载存档:', saveName);
    isLoading.value = true;
    // 启动提示轮播
    startLoadingTips();
    
    // 显示加载中的提示
    uiStore.showToast({
      type: 'info',
      message: '正在加载存档...',
      duration: 2000
    });
    
    // 延迟一下，让加载界面显示出来
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 先尝试直接使用Electron API加载存档
    try {
      console.log('使用Electron API加载存档:', saveName);
      const electronResult = await window.electronAPI.loadGame(saveName);
      
      if (electronResult && electronResult.success && electronResult.gameState) {
        console.log('存档从Electron加载成功，数据:', electronResult.gameState);
        
        // 创建保存系统
        const saveStore = useSaveStore();
        
        // 加载状态到游戏
        await saveStore.loadStoresFromSaveData(electronResult.gameState);
        
        // 标记游戏已开始
        gameStore.gameStarted = true;
        
        uiStore.showToast({
          type: 'success',
          message: '存档加载成功！',
          duration: 2000
        });
        
        // 跳转到游戏页面
        router.push('/game');
        return;
      }
    } catch (electronError) {
      console.warn('Electron API加载存档失败，尝试备用方法:', electronError);
    }
    
    // 如果Electron加载失败，尝试使用保存系统的方法
    // 查找存档ID
    const savesStore = useSaveStore();
    await savesStore.loadSaveList();
    
    const saveInfo = savesStore.saveList.find(save => save.name === saveName);
    
    if (!saveInfo) {
      throw new Error('找不到存档信息，无法加载');
    }
    
    console.log('找到存档信息:', saveInfo);
    
    // 使用ID调用loadGame方法
    const result = await savesStore.loadGame(saveInfo.id);
    
    if (result.success) {
      uiStore.showToast({
        type: 'success',
        message: '存档加载成功！',
        duration: 2000
      });
      
      // 跳转到游戏页面
      router.push('/game');
    } else {
      uiStore.showToast({
        type: 'error',
        message: `加载失败: ${result.message || '未知错误'}`,
        duration: 3000
      });
      isLoading.value = false;
    }
  } catch (err) {
    handleError(err, 'SavesView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('加载存档时出错:', err);
    uiStore.showToast({
      type: 'error',
      message: `加载存档时发生错误: ${err.message || '未知错误'}`,
      duration: 3000
    });
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
      uiStore.showToast({
        type: 'success',
        message: '存档已成功删除',
        duration: 2000
      });
    } else {
      uiStore.showToast({
        type: 'error',
        message: `删除存档失败: ${result.error || '未知错误'}`,
        duration: 3000
      });
    }
  } catch (err) {
    handleError(err, 'SavesView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error('删除存档时出错:', err);
    uiStore.showToast({
      type: 'error',
      message: `删除存档时发生错误: ${err.message || '未知错误'}`,
      duration: 3000
    });
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
      // 提取存档中的关键信息
      let locationName = '未知位置';
      let currentWeek = '?';
      let playerMoney = 0;

      // 根据存档结构提取数据
      if (result.gameState.gameCore) {
        currentWeek = result.gameState.gameCore.currentWeek || '?';
      }
      
      if (result.gameState.player) {
        playerMoney = result.gameState.player.money || 0;
      }
      
      if (result.gameState.market && result.gameState.market.currentLocation) {
        // 如果存储的是ID，尝试找到位置名称
        const locationId = result.gameState.market.currentLocation;
        if (typeof locationId === 'string' && result.gameState.market.locations) {
          const location = result.gameState.market.locations.find(loc => loc.id === locationId);
          if (location) {
            locationName = location.name || '未知位置';
          }
        } else if (typeof locationId === 'object' && locationId.name) {
          // 如果是对象，直接获取名称
          locationName = locationId.name;
        }
      }
      
      // 保存提取的数据
      saveDetails.value[saveName] = {
        currentWeek,
        playerMoney,
        locationName
      };
      
      console.log(`加载存档 ${saveName} 详情:`, saveDetails.value[saveName]);
    } else {
      console.warn(`无法获取存档 ${saveName} 的详情:`, result.error || '未知错误');
    }
  } catch (error) {
    handleError(error, 'SavesView (views)', ErrorType.UNKNOWN, ErrorSeverity.ERROR);
    console.error(`获取存档 ${saveName} 详情失败:`, error);
  }
}

// 返回主菜单
function goToMainMenu() {
  router.push('/');
}

// 开始新游戏（跳转到主菜单的新游戏对话框）
function startNewGame() {
  // 通过查询参数告诉主菜单页面应该直接打开新游戏对话框
  router.push({ path: '/', query: { action: 'new-game' } });
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
  background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
  background-size: 400% 400%;
  animation: gradient 15s ease infinite;
  padding: 20px;
}

@keyframes gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.saves-container {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 700px;
  max-width: 100%;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: linear-gradient(to right, rgba(26, 42, 108, 0.05), transparent);
}

.header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: bold;
  color: #1a2a6c;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.back-button {
  background-color: #3498db;
  border: none;
  border-radius: 4px;
  padding: 10px 18px;
  font-size: 15px;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.saves-content {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 60px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.loading {
  animation: fade-in 0.5s ease;
}

.loading-spinner-mini {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(52, 152, 219, 0.1);
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading p {
  font-size: 16px;
  color: #555;
  margin-bottom: 20px;
}

.error {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.05);
  border-radius: 8px;
  padding: 20px;
  margin: 20px;
}

.error p {
  margin-bottom: 20px;
  font-size: 16px;
}

.empty-state {
  color: #7f8c8d;
  font-size: 16px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  color: #3498db;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.1);
  animation: float 3s ease-in-out infinite;
}

.empty-state h3 {
  font-size: 24px;
  color: #2c3e50;
  margin: 0 0 10px 0;
}

.empty-state p {
  margin-bottom: 30px;
  font-size: 16px;
  color: #7f8c8d;
  line-height: 1.5;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 15px;
}

.button.primary {
  background-color: #3498db;
  color: white;
}

.button.new-game {
  background-color: #2ecc71;
  color: white;
}

.button.new-game:hover {
  background-color: #27ae60;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.saves-list {
  margin-top: 20px;
}

.save-item {
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-left: 4px solid transparent;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  z-index: 0; /* 确保伪元素在下方 */
}

.save-item:hover {
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  border-left-color: #4caf50;
}

.save-item.selected {
  border-left-color: #2196f3;
  background-color: rgba(33, 150, 243, 0.08);
}

.save-item.autosave {
  border-left-color: #ff9800;
}

.save-item.autosave.selected {
  border-left-color: #ff5722;
}

.save-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 0;
  background: linear-gradient(to right, rgba(33, 150, 243, 0.1), transparent);
  transition: height 0.3s ease;
  z-index: 0;
}

.save-item:hover::before {
  height: 100%;
}

.save-item.selected::before {
  height: 100%;
  background: linear-gradient(to right, rgba(33, 150, 243, 0.15), transparent 80%);
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
  position: relative;
  z-index: 10; /* 确保按钮在顶层 */
}

.load-button, .delete-button, .button {
  padding: 10px 18px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.load-button {
  background-color: #3498db;
  color: white;
}

.load-button:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.delete-button {
  background-color: #e74c3c;
  color: white;
}

.delete-button:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
}

.button {
  background-color: #7f8c8d;
  color: white;
}

.button:hover {
  background-color: #6c7a7a;
  transform: translateY(-1px);
  box-shadow: 0 3px 5px rgba(0, 0, 0, 0.12);
}

.button.danger {
  background-color: #e74c3c;
  color: white;
}

.button.danger:hover {
  background-color: #c0392b;
  transform: translateY(-1px);
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

/* 加载指示器样式 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.loading-container {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 400px;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(255, 255, 255, 0.2);
  border-top-color: #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: white;
  font-size: 20px;
  margin-bottom: 15px;
  text-align: center;
}

.loading-tip {
  color: #3498db;
  font-size: 16px;
  text-align: center;
  min-height: 20px;
}

/* 粒子背景效果 */
.game-particles {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.game-particles::before,
.game-particles::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.game-particles::before {
  background: radial-gradient(circle at 80% 10%, rgba(255, 255, 255, 0.1) 0%, transparent 10%),
              radial-gradient(circle at 10% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 10%);
  animation: particle-move 20s linear infinite;
}

.game-particles::after {
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 5%),
    radial-gradient(circle at 90% 80%, rgba(255, 255, 255, 0.05) 0%, transparent 5%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 8%);
  animation: particle-pulse 15s ease-in-out infinite alternate;
}

@keyframes particle-move {
  0% { background-position: 0% 0%; }
  50% { background-position: 100% 100%; }
  100% { background-position: 0% 0%; }
}

@keyframes particle-pulse {
  0% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
  100% { opacity: 0.5; transform: scale(1); }
}

.title-icon {
  display: inline-block;
  margin-right: 10px;
  animation: icon-spin 10s linear infinite;
  vertical-align: middle;
}



@keyframes icon-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 改善滚动条样式 */
.saves-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(52, 152, 219, 0.5) rgba(255, 255, 255, 0.1);
}

.saves-content::-webkit-scrollbar {
  width: 8px;
}

.saves-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.saves-content::-webkit-scrollbar-thumb {
  background-color: rgba(52, 152, 219, 0.5);
  border-radius: 4px;
}

/* 增强版存档容器 */
.saves-container {
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 在样式块的末尾添加这些动画CSS */

/* 存档项动画 */
.save-item-enter-active {
  animation: save-item-in 0.5s ease-out;
  animation-delay: var(--delay, 0s);
  animation-fill-mode: backwards;
}
.save-item-leave-active {
  animation: save-item-out 0.3s ease-in;
}
@keyframes save-item-in {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes save-item-out {
  0% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(20px);
  }
}

/* 渐入淡出效果 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 缩放动画 - 用于确认对话框 */
.zoom-enter-active {
  animation: zoom-in 0.3s;
}
.zoom-leave-active {
  animation: zoom-out 0.2s;
}
@keyframes zoom-in {
  0% {
    transform: scale(0.9);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes zoom-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.9);
    opacity: 0;
  }
}

/* 按钮图标样式 */
.button-icon {
  display: inline-block;
  margin-right: 6px;
  font-size: 0.9em;
}

/* 按钮悬停效果 */
.load-button, .delete-button, .button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.load-button:hover, .delete-button:hover, .button:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
}

.load-button:active, .delete-button:active, .button:active {
  transform: translateY(-1px);
}

/* 波纹效果 */
.load-button::after, .delete-button::after, .button::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.3);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.load-button:focus:not(:active)::after, 
.delete-button:focus:not(:active)::after, 
.button:focus:not(:active)::after {
  animation: ripple 0.6s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20);
    opacity: 0;
  }
}

/* 增强粒子效果 */
.game-particles::after {
  animation: particle-float 15s ease-in-out infinite alternate;
}

@keyframes particle-float {
  0% {
    background-position: 0% 0%;
  }
  100% {
    background-position: 100% 100%;
  }
}

/* 标题图标动画 */
.title-icon {
  display: inline-block;
  margin-right: 10px;
  animation: icon-float 3s ease-in-out infinite alternate;
}

@keyframes icon-float {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-6px);
  }
}

/* 滚动条美化 */
.saves-content::-webkit-scrollbar {
  width: 8px;
}

.saves-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.saves-content::-webkit-scrollbar-thumb {
  background-color: rgba(52, 152, 219, 0.5);
  border-radius: 4px;
}

.saves-content::-webkit-scrollbar-thumb:hover {
  background-color: rgba(52, 152, 219, 0.8);
}
</style> 