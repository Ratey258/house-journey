<template>
  <div v-if="show" class="modal-backdrop" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title-container">
          <span class="bank-icon">🏦</span>
          <h3 class="modal-title">{{ $t('bank.title') }}</h3>
        </div>
        <button class="modal-close" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <!-- 银行信息概览 -->
        <div class="bank-overview">
          <!-- 主要信息卡片 -->
          <div class="overview-cards">
            <div class="overview-card deposit-card">
              <div class="card-header">
                <span class="card-icon">💹</span>
                <span class="card-title">{{ $t('bank.currentDeposit') }}</span>
              </div>
              <div class="card-amount deposit-value">¥{{ formatNumber(playerStore.bankDeposit) }}</div>
              <div class="card-info">{{ $t('bank.depositInterest') }}: {{ formatPercent(playerStore.depositInterestRate) }}</div>
            </div>

            <div class="overview-card debt-card">
              <div class="card-header">
                <span class="card-icon">💸</span>
                <span class="card-title">{{ $t('playerInfo.debt') }}</span>
              </div>
              <div class="card-amount debt-value">¥{{ formatNumber(playerStore.debt) }}</div>
              <div class="card-info">{{ $t('bank.loanInterest') }}: {{ formatPercent(playerStore.loanInterestRate) }}</div>
            </div>
          </div>

          <!-- 次要信息展示 -->
          <div class="info-grid">
            <div class="info-item">
              <span class="info-icon">💰</span>
              <span class="info-label">{{ $t('playerInfo.money') }}:</span>
              <span class="info-value money-value">¥{{ formatNumber(playerStore.money) }}</span>
            </div>
            <div class="info-item">
              <span class="info-icon">📊</span>
              <span class="info-label">{{ $t('bank.availableLoan') }}:</span>
              <span class="info-value available-loan-value">¥{{ formatNumber(playerStore.availableLoanAmount) }}</span>
            </div>
          </div>

          <!-- 移除每周结算利息的提示卡片 -->
        </div>

        <!-- 操作选项卡 -->
        <div class="bank-tabs">
          <div class="tab-buttons">
            <button
              :class="['tab-button', { active: activeTab === 'deposit' }]"
              @click="activeTab = 'deposit'"
            >
              <span class="tab-icon">💹</span>
              {{ $t('bank.deposit') }}
            </button>
            <button
              :class="['tab-button', { active: activeTab === 'withdraw' }]"
              @click="activeTab = 'withdraw'"
            >
              <span class="tab-icon">💸</span>
              {{ $t('bank.withdraw') }}
            </button>
            <button
              :class="['tab-button', { active: activeTab === 'loan' }]"
              @click="activeTab = 'loan'"
            >
              <span class="tab-icon">💰</span>
              {{ $t('bank.loan') }}
            </button>
            <button
              :class="['tab-button', { active: activeTab === 'repay' }]"
              @click="activeTab = 'repay'"
            >
              <span class="tab-icon">💳</span>
              {{ $t('bank.repay') }}
            </button>
          </div>

          <div class="tab-content">
            <!-- 存款标签内容 -->
            <div v-if="activeTab === 'deposit'" class="operation-tab">
              <div class="amount-control">
                <div class="amount-header">
                  <span>{{ $t('bank.amountToDeposit') }}</span>
                  <span class="amount-value">¥{{ formatNumber(Number(depositAmount)) }}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  :max="playerStore.money"
                  v-model="depositAmount"
                  step="100"
                  class="styled-slider"
                />
                <div class="amount-actions">
                  <button class="amount-btn" @click="depositAmount = 0">0</button>
                  <button class="amount-btn" @click="depositAmount = Math.floor(playerStore.money / 2)">50%</button>
                  <button class="amount-btn" @click="depositAmount = playerStore.money">全部</button>
                </div>
              </div>

              <div class="summary-info no-border">
                <div class="summary-row">
                  <div>{{ $t('bank.weeklyInterest') }}</div>
                  <div>¥{{ formatNumber(Math.floor(Number(depositAmount) * playerStore.depositInterestRate)) }}</div>
                </div>
                <div class="summary-row">
                  <div>{{ $t('bank.remainingMoney') }}</div>
                  <div>¥{{ formatNumber(playerStore.money - Number(depositAmount)) }}</div>
                </div>
              </div>

              <button
                @click="makeDeposit"
                class="confirm-btn"
                :disabled="Number(depositAmount) <= 0"
              >
                {{ $t('bank.confirmDeposit') }}
              </button>
            </div>

            <!-- 取款标签内容 -->
            <div v-if="activeTab === 'withdraw'" class="operation-tab">
              <div class="amount-control">
                <div class="amount-header">
                  <span>{{ $t('bank.amountToWithdraw') }}</span>
                  <span class="amount-value">¥{{ formatNumber(Number(withdrawAmount)) }}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  :max="playerStore.bankDeposit"
                  v-model="withdrawAmount"
                  step="100"
                  class="styled-slider"
                />
                <div class="amount-actions">
                  <button class="amount-btn" @click="withdrawAmount = 0">0</button>
                  <button class="amount-btn" @click="withdrawAmount = Math.floor(playerStore.bankDeposit / 2)">50%</button>
                  <button class="amount-btn" @click="withdrawAmount = playerStore.bankDeposit">全部</button>
                </div>
              </div>

              <div class="summary-info no-border">
                <div class="summary-row">
                  <div>{{ $t('bank.remainingDeposit') }}</div>
                  <div>¥{{ formatNumber(playerStore.bankDeposit - Number(withdrawAmount)) }}</div>
                </div>
                <div class="summary-row">
                  <div>{{ $t('bank.remainingMoney') }}</div>
                  <div>¥{{ formatNumber(playerStore.money + Number(withdrawAmount)) }}</div>
                </div>
              </div>

              <button
                @click="makeWithdrawal"
                class="confirm-btn"
                :disabled="Number(withdrawAmount) <= 0"
              >
                {{ $t('bank.confirmWithdraw') }}
              </button>
            </div>

            <!-- 贷款标签内容 -->
            <div v-if="activeTab === 'loan'" class="operation-tab">
              <div class="amount-control">
                <div class="amount-header">
                  <span>{{ $t('bank.amountToLoan') }}</span>
                  <span class="amount-value">¥{{ formatNumber(Number(loanAmount)) }}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  :max="playerStore.availableLoanAmount"
                  v-model="loanAmount"
                  step="100"
                  class="styled-slider"
                />
                <div class="amount-actions">
                  <button class="amount-btn" @click="loanAmount = 0">0</button>
                  <button class="amount-btn" @click="loanAmount = Math.floor(playerStore.availableLoanAmount / 2)">50%</button>
                  <button class="amount-btn" @click="loanAmount = playerStore.availableLoanAmount">全部</button>
                </div>
              </div>

              <div class="summary-info no-border">
                <div class="summary-row">
                  <div>{{ $t('bank.weeklyInterest') }}</div>
                  <div>¥{{ formatNumber(Math.floor(Number(loanAmount) * playerStore.loanInterestRate)) }}</div>
                </div>
                <div class="summary-row">
                  <div>{{ $t('bank.remainingLoan') }}</div>
                  <div>¥{{ formatNumber(playerStore.debt + Number(loanAmount)) }}</div>
                </div>
              </div>

              <button
                @click="takeLoan"
                class="confirm-btn"
                :disabled="Number(loanAmount) <= 0"
              >
                {{ $t('bank.confirmLoan') }}
              </button>
            </div>

            <!-- 还款标签内容 -->
            <div v-if="activeTab === 'repay'" class="operation-tab">
              <div class="amount-control">
                <div class="amount-header">
                  <span>{{ $t('bank.amountToRepay') }}</span>
                  <span class="amount-value">¥{{ formatNumber(Number(repayAmount)) }}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  :max="Math.min(playerStore.money, playerStore.debt)"
                  v-model="repayAmount"
                  step="100"
                  class="styled-slider"
                />
                <div class="amount-actions">
                  <button class="amount-btn" @click="repayAmount = 0">0</button>
                  <button class="amount-btn" @click="repayAmount = Math.floor(Math.min(playerStore.money, playerStore.debt) / 2)">50%</button>
                  <button class="amount-btn" @click="repayAmount = Math.min(playerStore.money, playerStore.debt)">全部</button>
                </div>
              </div>

              <div class="summary-info no-border">
                <div class="summary-row">
                  <div>{{ $t('bank.remainingDebt') }}</div>
                  <div>¥{{ formatNumber(Math.max(0, playerStore.debt - Number(repayAmount))) }}</div>
                </div>
                <div class="summary-row">
                  <div>{{ $t('bank.remainingMoney') }}</div>
                  <div>¥{{ formatNumber(Math.max(0, playerStore.money - Number(repayAmount))) }}</div>
                </div>
              </div>

              <button
                @click="repayLoan"
                class="confirm-btn"
                :disabled="Number(repayAmount) <= 0"
              >
                {{ $t('bank.confirmRepay') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 优化取消按钮位置和大小 -->
      <div class="modal-footer">
        <button @click="closeModal" class="cancel-btn">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { useUiStore } from '@/stores/uiStore';
import { useI18n } from 'vue-i18n';
import { formatNumber } from '@/infrastructure/utils';

// 获取需要的store和工具
const playerStore = usePlayerStore();
const uiStore = useUiStore();
const { t } = useI18n();

// 定义组件属性和事件
defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:show']);

// 组件状态
const activeTab = ref('deposit'); // 默认显示存款标签
const depositAmount = ref(0);
const withdrawAmount = ref(0);
const loanAmount = ref(0);
const repayAmount = ref(0); // 新增还款金额

// 关闭模态框
const closeModal = () => {
  emit('update:show', false);
  // 重置所有金额
  depositAmount.value = 0;
  withdrawAmount.value = 0;
  loanAmount.value = 0;
  repayAmount.value = 0; // 重置还款金额
};

// 格式化百分比
const formatPercent = (value) => {
  return `${(value * 100).toFixed(1)}%`;
};

// 存款操作
const makeDeposit = () => {
  const amount = Number(depositAmount.value);
  if (amount <= 0) return;

  if (playerStore.depositToBank(amount)) {
    uiStore.showToast({
      type: 'success',
      message: t('bank.depositSuccess'),
      duration: 3000
    });
    depositAmount.value = 0;
  } else {
    uiStore.showToast({
      type: 'error',
      message: t('bank.notEnoughMoney'),
      duration: 3000
    });
  }
};

// 取款操作
const makeWithdrawal = () => {
  const amount = Number(withdrawAmount.value);
  if (amount <= 0) return;

  if (playerStore.withdrawFromBank(amount)) {
    uiStore.showToast({
      type: 'success',
      message: t('bank.withdrawSuccess'),
      duration: 3000
    });
    withdrawAmount.value = 0;
  } else {
    uiStore.showToast({
      type: 'error',
      message: t('bank.notEnoughMoney'),
      duration: 3000
    });
  }
};

// 贷款操作
const takeLoan = () => {
  const amount = Number(loanAmount.value);
  if (amount <= 0) return;

  if (playerStore.takeLoan(amount)) {
    uiStore.showToast({
      type: 'success',
      message: t('bank.loanSuccess'),
      duration: 3000
    });
    loanAmount.value = 0;
  } else {
    uiStore.showToast({
      type: 'error',
      message: t('common.error'),
      duration: 3000
    });
  }
};

// 还款操作
const repayLoan = () => {
  const amount = Number(repayAmount.value);
  if (amount <= 0) return;

  if (playerStore.repayDebt(amount)) {
    uiStore.showToast({
      type: 'success',
      message: t('bank.repaySuccess'),
      duration: 3000
    });
    repayAmount.value = 0;
  } else {
    uiStore.showToast({
      type: 'error',
      message: t('bank.notEnoughMoney'),
      duration: 3000
    });
  }
};
</script>

<style scoped>
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
  border-radius: 16px;
  width: 95%;
  max-width: 460px;
  max-height: 85vh; /* 添加最大高度限制 */
  overflow-y: auto; /* 添加垂直滚动 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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
  padding: 12px 16px; /* 减小内边距 */
  background-color: #2ecc71;
  color: white;
}

.modal-title-container {
  display: flex;
  align-items: center;
}

.bank-icon {
  font-size: 1.5rem;
  margin-right: 10px;
}

.modal-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.modal-body {
  padding: 15px; /* 减小内边距 */
}

.bank-overview {
  margin-bottom: 15px; /* 减小外边距 */
}

/* 更紧凑的卡片布局 */
.overview-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px; /* 减小间距 */
  margin-bottom: 10px; /* 减小间距 */
}

.overview-card {
  border-radius: 12px;
  padding: 10px; /* 减小内边距 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

.deposit-card {
  background-color: #e8f8f0;
  border-radius: 12px;
  /* 移除左侧边框 */
}

.debt-card {
  background-color: #fef1f0;
  border-radius: 12px;
  /* 移除左侧边框 */
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 3px; /* 减小间距 */
}

.card-icon {
  font-size: 1.3rem;
  margin-right: 8px;
}

.card-title {
  font-size: 0.9rem;
  color: #555;
  font-weight: 500;
}

.card-amount {
  font-size: 1.3rem; /* 减小字体 */
  font-weight: 700;
  margin: 3px 0; /* 减小间距 */
}

.card-info {
  font-size: 0.8rem;
  color: #666;
  margin-top: auto;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px; /* 减小间距 */
}

.info-item {
  display: flex;
  align-items: center;
  background-color: #f5f7fa;
  padding: 8px; /* 减小内边距 */
  border-radius: 8px;
  flex: 1;
  margin: 0 5px;
}

.info-label {
  font-size: 0.85rem;
  color: #6c757d;
  margin-right: 8px;
}

.info-value {
  font-weight: 600;
  font-size: 1.1rem;
}

.deposit-value {
  color: #2ecc71;
}

.debt-value {
  color: #e74c3c;
}

.money-value {
  color: #3498db;
}

.available-loan-value {
  color: #f39c12;
}

.interest-note {
  text-align: center;
  font-size: 0.8rem;
  font-style: italic;
  color: #6c757d;
  margin: 8px 0; /* 减小间距 */
  padding: 6px; /* 减小内边距 */
  background-color: #f8f9fa;
  border-radius: 6px;
}

/* 选项卡样式优化 */
.bank-tabs {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  margin-top: 15px;
}

.tab-buttons {
  display: flex;
  background-color: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  overflow-x: auto;
}

.tab-button {
  padding: 8px 10px; /* 减小内边距 */
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-weight: 500;
  color: #6c757d;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font-size: 0.9rem; /* 减小字体 */
}

.tab-button:hover {
  color: #495057;
  background-color: rgba(0, 0, 0, 0.03);
}

.tab-button.active {
  color: #2ecc71;
  border-bottom-color: #2ecc71;
  background-color: rgba(46, 204, 113, 0.05);
}

.tab-button .tab-icon {
  margin-right: 6px;
  font-size: 1.1rem;
}

.tab-content {
  padding: 12px; /* 减小内边距 */
}

.deposit-tab, .withdraw-tab, .loan-tab, .repay-tab {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.slider-container {
  background-color: #f8f9fa;
  padding: 10px; /* 减小内边距 */
  border-radius: 8px;
  margin-bottom: 8px; /* 减小间距 */
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

.transaction-summary {
  background-color: #f8f9fa;
  padding: 10px; /* 减小内边距 */
  border-radius: 8px;
  border-left: 3px solid #3498db;
  margin-bottom: 8px; /* 减小间距 */
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

/* 修改模态框底部按钮 */
.modal-actions {
  padding: 10px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  text-align: right;
}

.btn {
  padding: 8px 16px; /* 减小按钮大小 */
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
  border: none;
  border-radius: 8px;
  padding: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.confirm-btn:disabled {
  background-color: #a0c8e7;
  cursor: not-allowed;
}

/* 修改模态框底部按钮 */
.modal-footer {
  padding: 10px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
  text-align: center;
}

.cancel-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 20px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background-color: #c0392b;
}

/* 新的次要信息网格样式 */
.info-grid {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.info-item {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f5f7fa;
  padding: 8px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.info-icon {
  margin-right: 5px;
  font-size: 0.9rem;
}

.info-label {
  color: #6c757d;
  margin-right: 5px;
}

.info-value {
  font-weight: 600;
  margin-left: auto;
}

/* 操作标签样式优化 */
.operation-tab {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.amount-control {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 8px;
}

.amount-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.amount-value {
  font-weight: 600;
  color: #3498db;
}

.styled-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e9ecef;
  border-radius: 3px;
  margin: 10px 0;
  cursor: pointer;
}

.styled-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #3498db;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.amount-actions {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.amount-btn {
  flex: 1;
  background-color: #e9ecef;
  border: none;
  padding: 4px 0;
  border-radius: 4px;
  color: #495057;
  font-size: 0.8rem;
  cursor: pointer;
}

.summary-info {
  background-color: #f8f9fa;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.9rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  align-items: center;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.no-border {
  border-left: none;
}
</style>
