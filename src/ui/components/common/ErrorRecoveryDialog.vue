<template>
  <div v-if="show" class="error-recovery-dialog">
    <div class="dialog-backdrop" @click="cancelIfAllowed"></div>
    <div class="dialog-content">
      <h2>{{ title || defaultTitle }}</h2>

      <div class="recovery-info" v-if="snapshot">
        <div class="info-row">
          <span class="label">{{ $t('recovery.date') }}:</span>
          <span class="value">{{ formatDate(snapshot.timestamp) }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ $t('recovery.gameWeek') }}:</span>
          <span class="value">{{ $t('recovery.weekNumber', { week: snapshot.currentWeek }) }}</span>
        </div>
        <div class="info-row" v-if="snapshot.player?.name">
          <span class="label">{{ $t('recovery.playerName') }}:</span>
          <span class="value">{{ snapshot.player.name }}</span>
        </div>
        <div class="info-row" v-if="snapshot.player?.money !== undefined">
          <span class="label">{{ $t('recovery.money') }}:</span>
          <span class="value">{{ formatMoney(snapshot.player.money) }}</span>
        </div>
      </div>

      <div class="message">
        <p v-if="message">{{ message }}</p>
        <p v-else>{{ $t('recovery.defaultMessage') }}</p>
      </div>

      <div class="button-group">
        <button class="btn-recover" @click="handleRecover">{{ $t('recovery.recover') }}</button>
        <button class="btn-cancel" v-if="allowCancel" @click="handleCancel">{{ $t('recovery.cancel') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatDate, formatCurrency } from '@/infrastructure/utils';

// ==================== 类型定义 ====================

interface Snapshot {
  timestamp: string | number | Date;
  currentWeek: number;
  player?: {
    name?: string;
    money?: number;
  };
  [key: string]: any;
}

// ==================== Props ====================

interface Props {
  show?: boolean;
  snapshot?: Snapshot | null;
  message?: string;
  title?: string;
  allowCancel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  snapshot: null,
  message: '',
  title: '',
  allowCancel: true
});

// ==================== Emits ====================

const emit = defineEmits<{
  recover: [];
  cancel: [];
}>();

// ==================== Composables ====================

const { t } = useI18n();

// ==================== 计算属性 ====================

const defaultTitle = computed(() => {
  return t('recovery.title', '游戏恢复');
});

// ==================== 方法 ====================

/**
 * 格式化金额
 */
const formatMoney = (amount: number | undefined): string => {
  if (amount === undefined) return '';
  return formatCurrency(amount);
};

/**
 * 恢复操作
 */
const handleRecover = (): void => {
  emit('recover');
};

/**
 * 取消操作
 */
const handleCancel = (): void => {
  emit('cancel');
};

/**
 * 点击背景时取消
 */
const cancelIfAllowed = (): void => {
  if (props.allowCancel) {
    handleCancel();
  }
};
</script>

<style scoped>
.error-recovery-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  position: relative;
  width: 450px;
  max-width: 90%;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 20px;
  z-index: 1;
  color: #333;
}

h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  color: #d32f2f;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.recovery-info {
  background-color: #f5f5f5;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  font-weight: 600;
}

.message {
  margin-bottom: 20px;
}

.message p {
  margin: 0;
  line-height: 1.5;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-recover, .btn-cancel {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-recover {
  background-color: #4caf50;
  color: white;
}

.btn-recover:hover {
  background-color: #43a047;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #333;
}

.btn-cancel:hover {
  background-color: #e0e0e0;
}
</style>
