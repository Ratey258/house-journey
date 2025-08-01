<template>
  <div v-if="show" class="modal-backdrop" @click.self="closeModal">
    <!-- 操作结果提示-->
    <transition name="bank-notification">
      <div v-if="notification.show" :class="['bank-notification', `notification-${notification.type}`]">
        <div class="notification-icon">
          <span v-if="notification.type === 'success'">✓</span>
          <span v-else-if="notification.type === 'error'">✖</span>
        </div>
        <div class="notification-message">{{ notification.message }}</div>
      </div>
    </transition>

    <div class="modal-content">
      <!-- 移除这里的通知组件 -->

      <div class="modal-header bank-header">
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
                <span class="card-icon sparkle">💹</span>
                <span class="card-title">{{ $t('bank.currentDeposit') }}</span>
              </div>
              <div class="card-amount deposit-value">¥{{ formatNumber(playerStore.bankDeposit) }}</div>
              <div class="card-info">{{ $t('bank.depositInterest') }}: {{ formatPercent(playerStore.depositInterestRate) }}</div>
            </div>

            <div class="overview-card debt-card">
              <div class="card-header">
                <span class="card-icon sparkle">💸</span>
                <span class="card-title">{{ $t('playerInfo.debt') }}</span>
              </div>
              <div class="card-amount debt-value">¥{{ formatNumber(playerStore.debt) }}</div>
              <div class="card-info">{{ $t('bank.loanInterest') }}: {{ formatPercent(playerStore.loanInterestRate) }}</div>
            </div>
          </div>

          <!-- 次要信息展示 -->
          <div class="info-grid">
            <div class="info-item pulse-hover">
              <span class="info-icon">💰</span>
              <span class="info-label">{{ $t('playerInfo.money') }}:</span>
              <span class="info-value money-value">¥{{ formatNumber(playerStore.money) }}</span>
            </div>
            <div class="info-item pulse-hover">
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
              <span class="tab-icon">💰</span>
              {{ $t('bank.withdraw') }}
            </button>
            <button
              :class="['tab-button', { active: activeTab === 'loan' }]"
              @click="activeTab = 'loan'"
            >
              <span class="tab-icon">💸</span>
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
                  step="1"
                  class="styled-slider deposit-slider"
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

              <div class="button-row">
                <button @click="closeModal" class="cancel-btn">{{ $t('common.cancel') }}</button>
                <button
                  @click="makeDeposit"
                  class="confirm-btn"
                  :disabled="Number(depositAmount) <= 0"
                >
                  {{ $t('bank.confirmDeposit') }}
                </button>
              </div>
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
                  :max="Math.max(playerStore.bankDeposit, 1)"
                  v-model="withdrawAmount"
                  step="1"
                  class="styled-slider withdraw-slider"
                  :disabled="playerStore.bankDeposit <= 0"
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

              <div class="button-row">
                <button @click="closeModal" class="cancel-btn">{{ $t('common.cancel') }}</button>
                <button
                  @click="makeWithdrawal"
                  class="confirm-btn"
                  :disabled="Number(withdrawAmount) <= 0"
                >
                  {{ $t('bank.confirmWithdraw') }}
                </button>
              </div>
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
                  :max="Math.max(playerStore.availableLoanAmount, 1)"
                  v-model="loanAmount"
                  step="1"
                  class="styled-slider loan-slider"
                  :disabled="playerStore.availableLoanAmount <= 0"
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

              <div class="button-row">
                <button @click="closeModal" class="cancel-btn">{{ $t('common.cancel') }}</button>
                <button
                  @click="takeLoan"
                  class="confirm-btn"
                  :disabled="Number(loanAmount) <= 0"
                >
                  {{ $t('bank.confirmLoan') }}
                </button>
              </div>
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
                  step="1"
                  class="styled-slider repay-slider"
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

              <div class="button-row">
                <button @click="closeModal" class="cancel-btn">{{ $t('common.cancel') }}</button>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { useI18n } from 'vue-i18n';
import { formatNumber } from '@/infrastructure/utils';

// 获取需要的store和工具
const playerStore = usePlayerStore();
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

// 通知状态
const notification = ref({
  show: false,
  type: 'success',
  message: '',
  timeout: null
});

// 显示通知
const showNotification = (type, message, duration = 2500) => {
  // 显示通知

  // 立即显示通知
  notification.value = {
    show: true,
    type,
    message,
    timeout: null
  };

  // 清除任何现有的超时
  if (notification.value.timeout) {
    clearTimeout(notification.value.timeout);
  }

  // 设置新的超时来隐藏通知
  notification.value.timeout = setTimeout(() => {
    hideNotification();
  }, duration);
};

// 隐藏通知
const hideNotification = () => {
  // 隐藏通知
  notification.value.show = false;

  // 清除超时
  if (notification.value.timeout) {
    clearTimeout(notification.value.timeout);
    notification.value.timeout = null;
  }
};

// 关闭模态框前确保隐藏任何通知
const closeModal = () => {
  hideNotification(); // 先隐藏通知
  emit('update:show', false);
  // 重置所有金额
  depositAmount.value = 0;
  withdrawAmount.value = 0;
  loanAmount.value = 0;
  repayAmount.value = 0;
};

// 格式化百分比
const formatPercent = (value) => {
  return `${(value * 100).toFixed(1)}%`;
};

// 添加数字变化动画效果
const animateNumberChange = (element, startValue, endValue, duration = 500) => {
  if (!element) return;

  const startTime = performance.now();
  const animateFrame = (currentTime) => {
    const elapsedTime = currentTime - startTime;
    if (elapsedTime >= duration) {
      element.textContent = formatNumber(endValue);
      return;
    }

    const progress = elapsedTime / duration;
    const currentValue = startValue + (endValue - startValue) * progress;
    element.textContent = formatNumber(Math.floor(currentValue));
    requestAnimationFrame(animateFrame);
  };

  requestAnimationFrame(animateFrame);
};

// 增强存款操作，添加动画反馈
const makeDeposit = () => {
  const amount = Number(depositAmount.value);
  if (amount <= 0) return;

  // 获取相关元素
  const depositValueEl = document.querySelector('.deposit-value');
  const moneyValueEl = document.querySelector('.money-value');
  const oldDepositValue = playerStore.bankDeposit;
  const oldMoneyValue = playerStore.money;

  if (playerStore.depositToBank(amount)) {
    // 动画过渡数值变化
    animateNumberChange(depositValueEl, oldDepositValue, playerStore.bankDeposit);
    animateNumberChange(moneyValueEl, oldMoneyValue, playerStore.money);

    // 添加成功反馈动画
    depositValueEl.classList.add('value-change-success');
    setTimeout(() => {
      depositValueEl.classList.remove('value-change-success');
    }, 1000);

    // 显示成功通知
    // 存款操作成功
    showNotification('success', t('bank.depositSuccess'));

    // 重置存款金额
    depositAmount.value = 0;
  } else {
    // 显示错误通知
    // 存款操作失败
    showNotification('error', t('bank.notEnoughMoney'));
  }
};

// 增强取款操作，添加动画反馈
const makeWithdrawal = () => {
  const amount = Number(withdrawAmount.value);
  if (amount <= 0) return;

  // 获取相关元素
  const depositValueEl = document.querySelector('.deposit-value');
  const moneyValueEl = document.querySelector('.money-value');
  const oldDepositValue = playerStore.bankDeposit;
  const oldMoneyValue = playerStore.money;

  if (playerStore.withdrawFromBank(amount)) {
    // 动画过渡数值变化
    animateNumberChange(depositValueEl, oldDepositValue, playerStore.bankDeposit);
    animateNumberChange(moneyValueEl, oldMoneyValue, playerStore.money);

    // 添加成功反馈动画
    moneyValueEl.classList.add('value-change-success');
    setTimeout(() => {
      moneyValueEl.classList.remove('value-change-success');
    }, 1000);

    // 显示成功通知
    console.log('取款操作成功，调用showNotification');
    showNotification('success', t('bank.withdrawSuccess'));

    // 重置取款金额
    withdrawAmount.value = 0;
  } else {
    // 显示错误通知
    console.log('取款操作失败，调用showNotification');
    showNotification('error', t('bank.notEnoughMoney'));
  }
};

// 增强贷款操作，添加动画反馈
const takeLoan = () => {
  const amount = Number(loanAmount.value);
  if (amount <= 0) return;

  // 获取相关元素
  const debtValueEl = document.querySelector('.debt-value');
  const moneyValueEl = document.querySelector('.money-value');
  const oldDebtValue = playerStore.debt;
  const oldMoneyValue = playerStore.money;

  if (playerStore.takeLoan(amount)) {
    // 动画过渡数值变化
    animateNumberChange(debtValueEl, oldDebtValue, playerStore.debt);
    animateNumberChange(moneyValueEl, oldMoneyValue, playerStore.money);

    // 添加成功反馈动画
    moneyValueEl.classList.add('value-change-success');
    setTimeout(() => {
      moneyValueEl.classList.remove('value-change-success');
    }, 1000);

    // 显示成功通知
    console.log('贷款操作成功，调用showNotification');
    showNotification('success', t('bank.loanSuccess'));

    // 重置贷款金额
    loanAmount.value = 0;
  } else {
    // 显示错误通知
    console.log('贷款操作失败，调用showNotification');
    showNotification('error', t('common.error'));
  }
};

// 增强还款操作，添加动画反馈
const repayLoan = () => {
  const amount = Number(repayAmount.value);
  if (amount <= 0) return;

  // 获取相关元素
  const debtValueEl = document.querySelector('.debt-value');
  const moneyValueEl = document.querySelector('.money-value');
  const oldDebtValue = playerStore.debt;
  const oldMoneyValue = playerStore.money;

  if (playerStore.repayDebt(amount)) {
    // 动画过渡数值变化
    animateNumberChange(debtValueEl, oldDebtValue, playerStore.debt);
    animateNumberChange(moneyValueEl, oldMoneyValue, playerStore.money);

    // 添加成功反馈动画
    debtValueEl.classList.add('value-change-success');
    setTimeout(() => {
      debtValueEl.classList.remove('value-change-success');
    }, 1000);

    // 显示成功通知
    console.log('还款操作成功，调用showNotification');
    showNotification('success', t('bank.repaySuccess'));

    // 重置还款金额
    repayAmount.value = 0;
  } else {
    // 显示错误通知
    console.log('还款操作失败，调用showNotification');
    showNotification('error', t('bank.notEnoughMoney'));
  }
};

// 监听滑块值变化，更新滑块背景

// 更新滑块背景进度，根据不同操作类型应用不同颜色
const updateSliderBackground = (slider, value, max, type = 'default') => {
  if (!slider) return;

  // 根据操作类型选择颜色
  let color;
  switch (type) {
  case 'deposit':
    color = '#2ecc71'; // 绿色 - 存款
    break;
  case 'withdraw':
    color = '#3498db'; // 蓝色 - 取款
    break;
  case 'loan':
    color = '#f39c12'; // 橙色 - 贷款
    break;
  case 'repay':
    color = '#e74c3c'; // 红色 - 还款
    break;
  default:
    color = '#3498db'; // 默认蓝色
  }

  // 处理禁用状态
  if (max <= 0) {
    // 使用浅色表示禁用状态
    const disabledColor = type === 'withdraw' ? '#a0c8e7' :
      type === 'loan' ? '#f8d29b' :
        type === 'repay' ? '#f5b7b1' : '#a0c8e7';
    slider.style.background = disabledColor;
    return;
  }

  const percentage = Math.min((value / max) * 100, 100);
  slider.style.background = `linear-gradient(to right, ${color} ${percentage}%, #e9ecef ${percentage}%)`;
};

// 为存款滑块添加监听
watch(() => depositAmount.value, (newValue) => {
  nextTick(() => {
    const slider = document.querySelector('.deposit-slider');
    if (slider) {
      updateSliderBackground(slider, Number(newValue), playerStore.money, 'deposit');
    }
  });
});

// 为取款滑块添加监听
watch(() => withdrawAmount.value, (newValue) => {
  nextTick(() => {
    const slider = document.querySelector('.withdraw-slider');
    if (slider) {
      updateSliderBackground(slider, Number(newValue), playerStore.bankDeposit, 'withdraw');
    }
  });
});

// 为贷款滑块添加监听
watch(() => loanAmount.value, (newValue) => {
  nextTick(() => {
    const slider = document.querySelector('.loan-slider');
    if (slider) {
      updateSliderBackground(slider, Number(newValue), playerStore.availableLoanAmount, 'loan');
    }
  });
});

// 为还款滑块添加监听
watch(() => repayAmount.value, (newValue) => {
  nextTick(() => {
    const slider = document.querySelector('.repay-slider');
    if (slider) {
      const maxAmount = Math.min(playerStore.money, playerStore.debt);
      updateSliderBackground(slider, Number(newValue), maxAmount, 'repay');
    }
  });
});

// 监听标签切换，触发动画效果
watch(() => activeTab.value, () => {
  nextTick(() => {
    // 初始化当前标签页的滑块
    const sliders = {
      deposit: { slider: '.deposit-slider', value: depositAmount.value, max: playerStore.money, type: 'deposit' },
      withdraw: { slider: '.withdraw-slider', value: withdrawAmount.value, max: playerStore.bankDeposit, type: 'withdraw' },
      loan: { slider: '.loan-slider', value: loanAmount.value, max: playerStore.availableLoanAmount, type: 'loan' },
      repay: { slider: '.repay-slider', value: repayAmount.value, max: Math.min(playerStore.money, playerStore.debt), type: 'repay' }
    };

    const current = sliders[activeTab.value];
    if (current) {
      const slider = document.querySelector(current.slider);
      if (slider) {
        updateSliderBackground(slider, Number(current.value), current.max, current.type);
      }
    }
  });
});

// 组件挂载时初始化
onMounted(() => {
  nextTick(() => {
    // 初始化当前标签页的滑块
    const sliders = {
      deposit: { slider: '.deposit-slider', value: depositAmount.value, max: playerStore.money, type: 'deposit' },
      withdraw: { slider: '.withdraw-slider', value: withdrawAmount.value, max: playerStore.bankDeposit, type: 'withdraw' },
      loan: { slider: '.loan-slider', value: loanAmount.value, max: playerStore.availableLoanAmount, type: 'loan' },
      repay: { slider: '.repay-slider', value: repayAmount.value, max: Math.min(playerStore.money, playerStore.debt), type: 'repay' }
    };

    const current = sliders[activeTab.value];
    if (current) {
      const slider = document.querySelector(current.slider);
      if (slider) {
        updateSliderBackground(slider, Number(current.value), current.max, current.type);
      }
    }

  });
});
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

/* 按钮行样式 */
.button-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}

.cancel-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.cancel-btn:hover {
  background-color: #c0392b;
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
  flex: 2;
}

.confirm-btn:hover:not(:disabled) {
  background-color: #2980b9;
}

.confirm-btn:disabled {
  background-color: #a0c8e7;
  cursor: not-allowed;
}

/* 增强的按钮和滑块动画 */
.confirm-btn, .cancel-btn, .amount-btn {
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.confirm-btn::after, .cancel-btn::after, .amount-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.confirm-btn:active::after, .cancel-btn:active::after, .amount-btn:active::after {
  animation: ripple 0.6s ease-out;
}

.confirm-btn:active, .cancel-btn:active, .amount-btn:active {
  transform: scale(0.95);
}

@keyframes ripple {
  0% {
    transform: scale(0, 0) translate(-50%, -50%);
    opacity: 0.5;
  }
  100% {
    transform: scale(20, 20) translate(-50%, -50%);
    opacity: 0;
  }
}

/* 滑块增强动画 */
.styled-slider::-webkit-slider-thumb {
  transform: scale(1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.styled-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.styled-slider::-webkit-slider-thumb:active {
  transform: scale(1.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

/* 滑块轨道动画效果 */
.styled-slider {
  position: relative;
  background: #e9ecef;
  border-radius: 4px;
  transition: background 0.3s ease;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  margin: 15px 0;
  cursor: pointer;
  --slider-thumb-color: #3498db;
  width: 100%;
}

.styled-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--slider-thumb-color, #3498db);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  transform: scale(1);
}

.styled-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3);
}

.styled-slider::-webkit-slider-thumb:active {
  transform: scale(1.1);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.deposit-slider {
  --slider-thumb-color: #2ecc71;
}

.withdraw-slider {
  --slider-thumb-color: #3498db;
}

.loan-slider {
  --slider-thumb-color: #f39c12;
}

.repay-slider {
  --slider-thumb-color: #e74c3c;
}

/* 添加tab切换动画 */
.tab-content {
  position: relative;
}

.operation-tab {
  animation: fadeSlideIn 0.3s ease-out;
}

@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 数值变化动画 */
.amount-value {
  transition: all 0.3s ease;
}

.amount-value:hover {
  transform: scale(1.05);
}

/* 增强卡片动画 */
.overview-card {
  transition: all 0.3s ease;
  transform: translateY(0);
}

.overview-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

/* 卡片图标动画 */
.card-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

.overview-card:hover .card-icon {
  transform: scale(1.2) rotate(5deg);
}

/* 按钮行激活状态 */
.button-row {
  transform-style: preserve-3d;
  perspective: 800px;
}

/* 模态框入场动画增强 */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 数值变化动画效果 */
@keyframes valueChange {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.15);
    color: #2ecc71;
    text-shadow: 0 0 8px rgba(46, 204, 113, 0.4);
  }
  100% {
    transform: scale(1);
  }
}

.value-change-success {
  animation: valueChange 1s ease-out;
}

/* 按钮点击波纹效果增强 */
.confirm-btn, .cancel-btn, .amount-btn {
  position: relative;
  overflow: hidden;
}

.confirm-btn::after, .cancel-btn::after, .amount-btn::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.7);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.confirm-btn:active::after, .cancel-btn:active::after, .amount-btn:active::after {
  animation: ripple 0.6s ease-out;
}

/* Tab切换增强动画 */
.tab-button {
  position: relative;
  overflow: hidden;
}

.tab-button::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 3px;
  background-color: #2ecc71;
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.tab-button:hover::before {
  width: 40%;
}

.tab-button.active::before {
  width: 100%;
}

/* 选项卡图标悬浮动画 */
.tab-icon {
  display: inline-block;
  transition: all 0.3s ease;
}

.tab-button:hover .tab-icon {
  transform: translateY(-2px);
}

.tab-button.active .tab-icon {
  animation: bounceIcon 0.5s ease-out;
}

@keyframes bounceIcon {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

/* 银行图标动画 */
.bank-icon {
  display: inline-block;
  transition: all 0.3s ease;
}

.modal-title-container:hover .bank-icon {
  transform: rotate(10deg);
}

/* 银行标题栏渐变效果 */
.bank-header {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  position: relative;
  overflow: hidden;
}

.bank-header::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 70%);
  transform: rotate(45deg);
  animation: shineEffect 6s infinite linear;
}

@keyframes shineEffect {
  0% {
    left: -100%;
    top: -100%;
  }
  100% {
    left: 100%;
    top: 100%;
  }
}

/* 闪烁图标效果 */
.sparkle {
  position: relative;
}

.sparkle::after {
  content: '✨';
  position: absolute;
  font-size: 0.7em;
  top: -5px;
  right: -5px;
  opacity: 0;
  transform: scale(0);
  animation: twinkle 5s infinite;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 0;
    transform: scale(0) rotate(0deg);
  }
  50% {
    opacity: 0;
  }
  55% {
    opacity: 1;
    transform: scale(1) rotate(15deg);
  }
  60% {
    opacity: 0;
    transform: scale(0) rotate(30deg);
  }
}

/* 脉冲悬停效果 */
.pulse-hover {
  transition: all 0.3s ease;
}

.pulse-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0.4);
  }
  70% {
    box-shadow: 0 0 0 5px rgba(52, 152, 219, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(52, 152, 219, 0);
  }
}

/* 按钮动画增强 */
.amount-btn:hover {
  background-color: #d4d4d4;
  transform: translateY(-1px);
}

.tab-button {
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.tab-button:hover {
  transform: translateY(-2px);
}

.tab-button.active {
  transform: translateY(0);
}

/* 模态框整体动画增强 */
.modal-content {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
  transform-origin: center top;
}

/* 禁用滑块的样式 */
.styled-slider:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.styled-slider:disabled::-webkit-slider-thumb {
  background-color: #b0b0b0;
  cursor: not-allowed;
  transform: scale(0.8);
}

/* 禁用状态下禁止悬停效果 */
.styled-slider:disabled::-webkit-slider-thumb:hover {
  transform: scale(0.8);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

/* 添加禁用状态的提示信息 */
.amount-control {
  position: relative;
}

.disabled-notice {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.8rem;
  color: #e74c3c;
  animation: fadeIn 0.5s forwards;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 操作结果提示样式 */
.bank-notification {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  padding: 12px 20px;
  z-index: 10000; /* 确保在最顶层 */
  width: 50%;    /* 从80%减小到50% */
  max-width: 240px; /* 从320px减小到240px */
  pointer-events: none; /* 防止弹窗阻挡点击事件 */
}

.notification-success {
  background-color: #f0fff4;
  border-left: 4px solid #2ecc71;
}

.notification-error {
  background-color: #fff5f5;
  border-left: 4px solid #e74c3c;
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  width: 24px;
  height: 24px;
  font-size: 18px;
  font-weight: bold;
}

.notification-success .notification-icon {
  color: #2ecc71;
}

.notification-error .notification-icon {
  color: #e74c3c;
}

.notification-message {
  font-size: 14px;
  color: #333;
  flex-grow: 1;
  font-weight: 500;
}

/* 操作结果提示动画 */
.bank-notification-enter-active {
  animation: notificationIn 0.5s ease-out forwards;
}

.bank-notification-leave-active {
  animation: notificationOut 0.3s ease-in forwards;
}

@keyframes notificationIn {
  0% {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes notificationOut {
  0% {
    opacity: 1;
    transform: translate(-50%, 0);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -20px);
  }
}

</style>
