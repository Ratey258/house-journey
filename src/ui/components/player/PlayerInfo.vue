<template>
  <div class="player-info">
    <div class="player-header">
      <div class="avatar-container">
        <div class="avatar">{{ getPlayerInitials() }}</div>
      </div>
      <div class="player-name-container">
        <h2 class="player-name">{{ player.name }}</h2>
        <div class="player-week">第 {{ currentWeek }} / 52 周</div>
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
    <div v-if="showRepayModal" class="modal-backdrop">
      <div class="modal-content">
        <h3>{{ $t('repayModal.title') }}</h3>
        <p>{{ $t('repayModal.currentDebt') }}: ¥{{ formatNumber(player.debt) }}</p>
        <p>{{ $t('repayModal.availableMoney') }}: ¥{{ formatNumber(player.money) }}</p>
        
        <div class="slider-container">
          <input 
            type="range" 
            min="0" 
            :max="Math.min(player.money, player.debt)" 
            v-model="repayAmount" 
            step="100"
          />
          <p>{{ $t('repayModal.repayAmount') }}: ¥{{ formatNumber(Number(repayAmount)) }}</p>
        </div>
        
        <div class="modal-actions">
          <button @click="repayDebt" class="btn confirm-btn">{{ $t('common.confirm') }}</button>
          <button @click="showRepayModal = false" class="btn cancel-btn">{{ $t('common.cancel') }}</button>
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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
}

.slider-container {
  margin: 20px 0;
}

.slider-container input {
  width: 100%;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.confirm-btn {
  background-color: #2ecc71;
  color: white;
}

.cancel-btn {
  background-color: #e74c3c;
  color: white;
}
</style> 