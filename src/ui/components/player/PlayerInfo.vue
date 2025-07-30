<template>
  <div class="player-info">
    <!-- 顶部玩家信息 -->
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

    <!-- 主要财务信息：每个卡片单独一行 -->
    <div class="finance-list">
      <!-- 资金项 -->
      <div class="finance-item money-item">
        <span class="finance-icon">💰</span>
        <div class="finance-value money">¥{{ formatNumber(player.money) }}</div>
        <div class="finance-label">{{ $t('playerInfo.money') }}</div>
      </div>

      <!-- 债务项 -->
      <div class="finance-item debt-item">
        <span class="finance-icon">💸</span>
        <div class="finance-value debt">¥{{ formatNumber(player.debt) }}</div>
        <div class="finance-label">{{ $t('playerInfo.debt') }}</div>
      </div>

      <!-- 存款项 -->
      <div class="finance-item deposit-item">
        <span class="finance-icon">🏦</span>
        <div class="finance-value deposit">¥{{ formatNumber(player.bankDeposit) }}</div>
        <div class="finance-label">{{ $t('bank.currentDeposit') }}</div>
      </div>

      <!-- 可贷款额度项 -->
      <div class="finance-item loan-item">
        <span class="finance-icon">📊</span>
        <div class="finance-value loan">¥{{ formatNumber(player.availableLoanAmount) }}</div>
        <div class="finance-label">{{ $t('bank.availableLoan') }}</div>
      </div>
    </div>

    <!-- 背包容量 -->
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

    <!-- 银行和下一周按钮 -->
    <div class="action-buttons">
      <button
        class="btn next-week-btn"
        @click="advanceWeek"
      >
        <span class="btn-icon">⏭️</span>
        <span class="btn-text">下一周</span>
      </button>
      <button
        class="btn bank-btn"
        @click="showBankModal = true"
      >
        <span class="btn-icon">🏦</span>
        <span class="btn-text">银行</span>
      </button>
    </div>

    <!-- 移除独立还款模态框 -->

    <!-- 银行模态框 -->
    <BankModal
      v-model:show="showBankModal"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useGameStore, useGameCoreStore } from '@/stores';
import { formatNumber } from '@/infrastructure/utils';
import BankModal from './BankModal.vue';

const gameStore = useGameStore();
const gameCoreStore = useGameCoreStore();

const player = computed(() => gameStore.player);
const currentWeek = computed(() => gameStore.currentWeek);
const isEndlessMode = computed(() => gameStore.isEndlessMode);

// 银行相关
const showBankModal = ref(false);

// 进入下一周
const advanceWeek = () => {
  gameCoreStore.advanceWeek();
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
  border-radius: 12px;
  padding: 12px; /* 减少内边距 */
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
}

.player-info:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
}

/* 玩家头部信息样式 */
.player-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px; /* 减少下边距 */
  padding-bottom: 8px; /* 减少下内边距 */
  border-bottom: 1px solid #e0e6ed;
}

.avatar-container {
  margin-right: 10px;
}

.avatar {
  width: 36px; /* 减小头像大小 */
  height: 36px; /* 减小头像大小 */
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px; /* 减小字体大小 */
  font-weight: bold;
}

.player-name-container {
  flex: 1;
}

.player-name {
  font-size: 1.1rem; /* 减小字体大小 */
  margin: 0;
  color: #2c3e50;
  line-height: 1.2;
  font-weight: 600;
}

.player-week {
  font-size: 0.8rem; /* 减小字体大小 */
  color: #7f8c8d;
  margin-top: 1px;
}

/* 财务信息列表布局 */
.finance-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.finance-item {
  position: relative;
  background-color: #fff;
  border-radius: 8px;
  padding: 10px 16px 10px 40px; /* 增加左侧内边距给图标 */
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  transition: all 0.2s ease;
}

.finance-icon {
  font-size: 18px;
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
}

.finance-value {
  font-weight: bold;
  font-size: 1.2rem;
  margin-right: auto; /* 让金额靠左，标签靠右 */
  margin-left: 5px;
}

.finance-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-left: 10px;
  flex-shrink: 0; /* 防止标签被挤压 */
}

/* 货币颜色 */
.money {
  color: #2c9f2c;
}

.debt {
  color: #e74c3c;
}

.deposit {
  color: #2ecc71;
}

.loan {
  color: #f39c12;
}

/* 背包容量条 */
.capacity-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 8px 10px;
  margin-bottom: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}

.capacity-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 0.8rem;
}

.label {
  color: #7f8c8d;
}

.capacity-value {
  font-weight: bold;
  color: #2c3e50;
}

.capacity-bar {
  height: 6px; /* 减小高度 */
  background-color: #ecf0f1;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
}

.capacity-fill {
  height: 100%;
  background-color: #3498db;
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 4px rgba(52, 152, 219, 0.3);
}

.capacity-fill.nearly-full {
  background-color: #e74c3c;
}

/* 按钮样式 */
.action-buttons {
  display: flex;
  justify-content: space-between;
  gap: 6px;
  margin-top: 5px;
  margin-bottom: 3px;
}

.btn {
  flex: 1;
  padding: 5px 10px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  transition: all 0.2s;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  min-height: 36px;
}

.bank-btn {
  background-color: #2ecc71;
  color: white;
}

.bank-btn:hover {
  background-color: #27ae60;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.12);
}

.next-week-btn {
  background-color: #3498db;
  color: white;
}

.next-week-btn:hover {
  background-color: #2980b9;
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.12);
}

.btn-icon {
  font-size: 0.9rem;
  margin-right: 5px;
  line-height: 1;
}

.btn-text {
  font-size: 0.75rem;
  line-height: 1;
  white-space: nowrap;
}

/* 保持模态框样式不变 */
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
