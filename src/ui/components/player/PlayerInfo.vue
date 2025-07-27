<template>
  <div class="player-info">
    <div class="player-header">
      <div class="avatar-container">
        <div class="avatar">{{ getPlayerInitials() }}</div>
      </div>
      <div class="player-name-container">
        <h2 class="player-name">{{ player.name }}</h2>
        <div class="player-week">
          {{ isEndlessMode ? `第 ${currentWeek} / ∞ 周` : `第 ${currentWeek} / 52 周` }}
        </div>
      </div>
    </div>
    
    <div class="info-container">
      <div class="info-row">
        <div class="info-item money-item">
          <div class="info-icon">💰</div>
          <div class="info-content">
            <div class="label">{{ $t('playerInfo.money') }}</div>
            <div class="value money">¥{{ formatNumber(player.money) }}</div>
          </div>
        </div>
        
        <div class="info-item debt-item">
          <div class="info-icon">💸</div>
          <div class="info-content">
            <div class="label">{{ $t('playerInfo.debt') }}</div>
            <div class="value debt">¥{{ formatNumber(player.debt) }}</div>
          </div>
        </div>
      </div>
      
      <div class="capacity-container">
        <div class="capacity-label">
          <span class="label">{{ $t('playerInfo.capacity') }}</span>
          <span class="capacity-value">{{ player.inventoryUsed }} / {{ player.capacity }}</span>
        </div>
        <div class="capacity-bar">
          <div 
            class="capacity-fill" 
            :style="{ width: `${(player.inventoryUsed / player.capacity) * 100}%` }"
            :class="{ 'nearly-full': player.inventoryUsed / player.capacity > 0.8 }"
          ></div>
        </div>
      </div>
    </div>
    
    <div class="action-buttons">
      <button 
        class="btn repay-btn" 
        :disabled="player.money <= 0 || player.debt <= 0"
        @click="showRepayModal = true"
      >
        <span class="btn-icon">💳</span>
        {{ $t('playerInfo.repayDebt') }}
      </button>
    </div>

    <!-- 还款模态框 -->
    <div v-if="showRepayModal" class="modal-backdrop" @click.self="closeRepayModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">{{ $t('repayModal.title') }}</h3>
          <button class="modal-close" @click="closeRepayModal">×</button>
        </div>

        <div class="modal-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">{{ $t('repayModal.currentDebt') }}:</span>
              <span class="info-value debt-value">¥{{ formatNumber(player.debt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ $t('repayModal.availableMoney') }}:</span>
              <span class="info-value money-value">¥{{ formatNumber(player.money) }}</span>
            </div>
          </div>
          
          <div class="slider-container">
            <div class="slider-header">
              <span class="slider-label">{{ $t('repayModal.repayAmount') }}:</span>
              <span class="slider-value">¥{{ formatNumber(Number(repayAmount)) }}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              :max="Math.min(player.money, player.debt)" 
              v-model="repayAmount" 
              step="100"
              class="styled-slider"
            />
            <div class="slider-actions">
              <button class="slider-btn" @click="repayAmount = 0">0</button>
              <button class="slider-btn" @click="repayAmount = Math.floor(Math.min(player.money, player.debt) / 2)">50%</button>
              <button class="slider-btn" @click="repayAmount = Math.min(player.money, player.debt)">{{ $t('repayModal.fullRepay') }}</button>
            </div>
          </div>

          <div class="repayment-summary">
            <div class="summary-row">
              <span class="summary-label">{{ $t('repayModal.remainingDebt') }}:</span>
              <span class="summary-value">¥{{ formatNumber(Math.max(0, player.debt - Number(repayAmount))) }}</span>
            </div>
            <div class="summary-row">
              <span class="summary-label">{{ $t('repayModal.remainingMoney') }}:</span>
              <span class="summary-value">¥{{ formatNumber(Math.max(0, player.money - Number(repayAmount))) }}</span>
            </div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button @click="closeRepayModal" class="btn cancel-btn">{{ $t('common.cancel') }}</button>
          <button 
            @click="repayDebt" 
            class="btn confirm-btn"
            :disabled="Number(repayAmount) <= 0"
          >
            {{ $t('repayModal.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore } from '@/stores';
import { useI18n } from 'vue-i18n';
import { formatNumber, formatCurrency } from '@/infrastructure/utils';

const gameStore = useGameStore();
const { t } = useI18n();

const player = computed(() => gameStore.player);
const currentWeek = computed(() => gameStore.currentWeek);
// 确保这里正确获取无尽模式状态
const isEndlessMode = computed(() => gameStore.isEndlessMode);

console.log('PlayerInfo - 当前模式:', isEndlessMode.value ? '无尽模式' : '经典模式');
console.log('PlayerInfo - 当前周数:', currentWeek.value, '总周数:', isEndlessMode.value ? '∞' : '52');

// 还款相关
const showRepayModal = ref(false);
const repayAmount = ref(0);

const repayDebt = () => {
  if (repayAmount.value > 0) {
    gameStore.repayDebt(Number(repayAmount.value));
    showRepayModal.value = false;
    repayAmount.value = 0;
  }
};

const closeRepayModal = () => {
  showRepayModal.value = false;
  repayAmount.value = 0;
};

// 获取玩家名称首字母作为头像
const getPlayerInitials = () => {
  if (!player.value || !player.value.name) return '玩';
  
  const name = player.value.name.trim();
  if (!name) return '玩';
  
  // 如果是中文名，返回第一个字
  if (/[\u4e00-\u9fa5]/.test(name[0])) {
    return name[0];
  }
  
  // 如果是英文名，返回首字母大写
  return name[0].toUpperCase();
};
</script>

<style scoped>
.player-info {
  background-color: #f0f8ff;
  border-radius: 12px; /* 增加圆角 */
  padding: 16px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
}

.player-info:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

.player-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e6ed;
}

.avatar-container {
  margin-right: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}

.player-name-container {
  flex: 1;
}

.player-name {
  font-size: 1.2rem;
  margin: 0;
  color: #2c3e50;
  line-height: 1.2;
  font-weight: 600;
}

.player-week {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-top: 2px;
}

.info-container {
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap; /* 允许卡片在空间不够时换行 */
}

.info-item {
  flex: 1;
  min-width: 110px; /* 设置最小宽度以保证内容不挤压 */
  display: flex;
  align-items: center;
  background-color: #fff;
  border-radius: 10px; /* 增加圆角 */
  padding: 12px; /* 增加内边距 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.info-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
}

.info-icon {
  font-size: 20px;
  margin-right: 10px;
}

.info-content {
  flex: 1;
  min-width: 0; /* 允许内容在空间不够时缩小 */
}

.label {
  font-size: 0.85rem;
  color: #7f8c8d;
  margin-bottom: 2px;
}

.value {
  font-weight: bold;
  font-size: 1.1rem;
  white-space: nowrap; /* 防止数字换行 */
  overflow: hidden; /* 防止溢出 */
  text-overflow: ellipsis; /* 数字过长时显示省略号 */
}

.money {
  color: #2c9f2c;
}

.debt {
  color: #e74c3c;
}

.capacity-container {
  background-color: #fff;
  border-radius: 10px; /* 增加圆角 */
  padding: 12px; /* 增加内边距 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.capacity-container:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.08);
}

.capacity-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.capacity-value {
  font-weight: bold;
}

.capacity-bar {
  height: 8px; /* 增加高度 */
  background-color: #ecf0f1;
  border-radius: 4px; /* 增加圆角 */
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
}

.capacity-fill {
  height: 100%;
  background-color: #3498db;
  border-radius: 4px; /* 增加圆角 */
  transition: width 0.3s ease;
  box-shadow: 0 0 4px rgba(52, 152, 219, 0.3);
}

.capacity-fill.nearly-full {
  background-color: #e74c3c;
}

.action-buttons {
  display: flex;
  justify-content: center;
}

.btn {
  padding: 10px 18px;
  border-radius: 10px; /* 增加圆角 */
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-icon {
  margin-right: 6px;
}

.repay-btn {
  background-color: #3498db;
  color: white;
  border-radius: 10px; /* 增加圆角 */
  transition: all 0.2s ease;
}

.repay-btn:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.repay-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

/* 模态框样式 */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.modal-title {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #343a40;
}

.modal-body {
  padding: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.info-label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-bottom: 5px;
}

.info-value {
  font-weight: 600;
  font-size: 1.1rem;
}

.debt-value {
  color: #e74c3c;
}

.money-value {
  color: #2ecc71;
}

.slider-container {
  margin-bottom: 20px;
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
}

.slider-label {
  color: #495057;
  font-weight: 500;
}

.slider-value {
  color: #3498db;
  font-weight: 600;
  font-size: 1.1rem;
}

.styled-slider {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: #e9ecef;
  border-radius: 4px;
  margin: 15px 0;
  cursor: pointer;
}

.styled-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #3498db;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.styled-slider::-webkit-slider-thumb:hover {
  background: #2980b9;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
  transform: scale(1.1);
}

.slider-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.slider-btn {
  background-color: #e9ecef;
  border: none;
  padding: 6px 12px;
  border-radius: 5px;
  color: #495057;
  font-size: 0.85rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.slider-btn:hover {
  background-color: #dee2e6;
}

.repayment-summary {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 10px;
  border-left: 3px solid #3498db;
  margin-bottom: 20px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-label {
  color: #495057;
}

.summary-value {
  font-weight: 500;
  color: #2c3e50;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
}

.confirm-btn {
  background-color: #3498db;
  color: white;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.confirm-btn:disabled {
  background-color: #a0c8e7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.cancel-btn {
  background-color: #e74c3c;
  color: white;
}

.cancel-btn:hover {
  background-color: #c0392b;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style> 