<!-- 
  价格趋势组件
  遵循UI设计规范中的价格趋势组件设计
-->
<template>
  <div class="price-trend" :class="[trendClass, { 'with-animation': animate }]" :title="trendDescription">
    <i :class="['trend-icon', trendIcon]"></i>
    <span class="trend-value">{{ formattedPercent }}</span>
    <div v-if="showTrendLine" class="trend-line" :class="trendClass"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  trend: {
    type: String,
    default: 'stable',
    validator: (value) => ['rising_strong', 'rising', 'stable_high', 'stable', 'stable_low', 'falling', 'falling_strong', 'volatile'].includes(value)
  },
  percent: {
    type: Number,
    default: 0
  },
  animate: {
    type: Boolean,
    default: true
  },
  showTrendLine: {
    type: Boolean,
    default: false
  }
});

// 根据趋势类型确定图标
const trendIcon = computed(() => {
  const icons = {
    'rising_strong': 'icon-arrow-up-double',
    'rising': 'icon-arrow-up',
    'stable_high': 'icon-arrow-right-up',
    'stable': 'icon-arrow-right',
    'stable_low': 'icon-arrow-right-down',
    'falling': 'icon-arrow-down',
    'falling_strong': 'icon-arrow-down-double',
    'volatile': 'icon-volatile'
  };
  
  return icons[props.trend] || 'icon-arrow-right';
});

// 根据趋势确定样式类
const trendClass = computed(() => {
  if (props.trend.includes('rising_strong')) return 'trend-up-strong';
  if (props.trend.includes('rising')) return 'trend-up';
  if (props.trend.includes('stable_high')) return 'trend-stable-high';
  if (props.trend.includes('stable_low')) return 'trend-stable-low';
  if (props.trend.includes('falling_strong')) return 'trend-down-strong';
  if (props.trend.includes('falling')) return 'trend-down';
  if (props.trend.includes('volatile')) return 'trend-volatile';
  return 'trend-stable';
});

// 格式化百分比
const formattedPercent = computed(() => {
  const prefix = props.percent > 0 ? '+' : '';
  return `${prefix}${props.percent.toFixed(1)}%`;
});

// 获取趋势描述
const trendDescription = computed(() => {
  const descriptions = {
    'rising_strong': '价格大幅上涨',
    'rising': '价格上涨',
    'stable_high': '高位稳定',
    'stable': '价格稳定',
    'stable_low': '低位稳定',
    'falling': '价格下跌',
    'falling_strong': '价格大幅下跌',
    'volatile': '价格波动'
  };
  
  return `${descriptions[props.trend] || '价格稳定'} (${formattedPercent.value})`;
});
</script>

<style scoped>
.price-trend {
  display: inline-flex;
  align-items: center;
  gap: 4px; /* 替换var(--space-1)变量 */
  font-size: 0.875rem; /* 替换var(--font-size-sm)变量 */
  font-weight: 500; /* 替换var(--font-weight-medium)变量 */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; /* 替换var(--font-family-numbers)变量 */
  padding: 4px 8px; /* 替换var(--space-1) var(--space-2)变量 */
  border-radius: 4px; /* 替换var(--radius-md)变量 */
  transition: all 0.2s ease; /* 替换var(--transition-fast) var(--ease-default)变量 */
  white-space: nowrap;
}

/* 趋势样式 */
.trend-up-strong {
  color: #2ecc71; /* 替换var(--color-success-green)变量 */
  background-color: rgba(46, 204, 113, 0.1);
}

.trend-up {
  color: #2ecc71; /* 替换var(--color-success-green)变量 */
}

.trend-stable-high {
  color: #3498db; /* 替换var(--color-info-blue)变量 */
}

.trend-stable {
  color: #7f8c8d; /* 替换var(--color-gray-500)变量 */
}

.trend-stable-low {
  color: #3498db; /* 替换var(--color-info-blue)变量 */
}

.trend-down {
  color: #f39c12; /* 替换var(--color-warning-orange)变量 */
}

.trend-down-strong {
  color: #e74c3c; /* 替换var(--color-error-red)变量 */
  background-color: rgba(231, 76, 60, 0.1);
}

.trend-volatile {
  color: #9b59b6; /* 替换var(--color-purple-500)变量 */
  background-color: rgba(155, 89, 182, 0.1);
}

/* 趋势线 */
.trend-line {
  display: inline-block;
  width: 20px;
  height: 3px;
  border-radius: 9999px; /* 替换var(--radius-full)变量 */
  margin-left: 4px; /* 替换var(--space-1)变量 */
  position: relative;
}

.trend-line.trend-up-strong,
.trend-line.trend-up {
  background-color: #2ecc71; /* 替换var(--color-success-green)变量 */
  background-image: linear-gradient(90deg, transparent 0%, #2ecc71 100%);
}

.trend-line.trend-down-strong,
.trend-line.trend-down {
  background-color: #e74c3c; /* 替换var(--color-error-red)变量 */
  background-image: linear-gradient(90deg, transparent 0%, #e74c3c 100%);
}

.trend-line.trend-stable-high,
.trend-line.trend-stable,
.trend-line.trend-stable-low {
  background-color: #bdc3c7; /* 替换var(--color-gray-400)变量 */
}

.trend-line.trend-volatile {
  background-color: #9b59b6; /* 替换var(--color-purple-500)变量 */
  background-image: linear-gradient(90deg, transparent 0%, #9b59b6 100%);
}

.trend-line.trend-up-strong:before,
.trend-line.trend-up:before {
  content: "";
  position: absolute;
  top: -3px;
  right: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-bottom: 3px solid currentColor;
}

.trend-line.trend-down-strong:before,
.trend-line.trend-down:before {
  content: "";
  position: absolute;
  bottom: -3px;
  right: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-top: 3px solid currentColor;
}

/* 图标样式 */
.trend-icon {
  font-size: 1.2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
}

.trend-up-strong .trend-icon {
  background-color: rgba(46, 204, 113, 0.2);
}

.trend-down-strong .trend-icon {
  background-color: rgba(231, 76, 60, 0.2);
}

.trend-volatile .trend-icon {
  background-color: rgba(155, 89, 182, 0.2);
}

/* 带动画效果的价格趋势 */
.with-animation.trend-up,
.with-animation.trend-up-strong {
  animation: priceUp 0.3s ease-out forwards;
}

.with-animation.trend-down,
.with-animation.trend-down-strong {
  animation: priceDown 0.3s ease-out forwards;
}

.with-animation.trend-volatile {
  animation: priceVolatile 0.3s ease-in-out infinite;
}

/* 趋势线 */
.trend-line {
  display: inline-block;
  width: 20px;
  height: 3px;
  border-radius: 9999px; /* 替换var(--radius-full)变量 */
  margin-left: 4px; /* 替换var(--space-1)变量 */
  position: relative;
}

.trend-line.trend-up-strong,
.trend-line.trend-up {
  background-color: #2ecc71; /* 替换var(--color-success-green)变量 */
  background-image: linear-gradient(90deg, transparent 0%, #2ecc71 100%);
}

.trend-line.trend-down-strong,
.trend-line.trend-down {
  background-color: #e74c3c; /* 替换var(--color-error-red)变量 */
  background-image: linear-gradient(90deg, transparent 0%, #e74c3c 100%);
}

.trend-line.trend-stable-high,
.trend-line.trend-stable,
.trend-line.trend-stable-low {
  background-color: #bdc3c7; /* 替换var(--color-gray-400)变量 */
}

.trend-line.trend-volatile {
  background-color: #9b59b6; /* 替换var(--color-purple-500)变量 */
  background-image: linear-gradient(90deg, transparent 0%, #9b59b6 100%);
}

/* 图标替代 */
.icon-arrow-up-double:before { content: "⇈"; font-weight: 900; font-size: 1.3rem; }
.icon-arrow-up:before { content: "↑"; font-weight: 900; font-size: 1.3rem; }
.icon-arrow-right-up:before { content: "↗"; font-weight: 900; font-size: 1.3rem; }
.icon-arrow-right:before { content: "→"; font-weight: 900; font-size: 1.3rem; }
.icon-arrow-right-down:before { content: "↘"; font-weight: 900; font-size: 1.3rem; }
.icon-arrow-down:before { content: "↓"; font-weight: 900; font-size: 1.3rem; }
.icon-arrow-down-double:before { content: "⇊"; font-weight: 900; font-size: 1.3rem; }
.icon-volatile:before { content: "↯"; font-weight: 900; font-size: 1.3rem; }

/* 添加波动动画 */
@keyframes priceUp {
  0% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
  100% { transform: translateY(0); }
}

@keyframes priceDown {
  0% { transform: translateY(0); }
  50% { transform: translateY(3px); }
  100% { transform: translateY(0); }
}

@keyframes priceVolatile {
  0% { transform: translateY(0); }
  25% { transform: translateY(-2px); }
  50% { transform: translateY(0); }
  75% { transform: translateY(2px); }
  100% { transform: translateY(0); }
}

.trend-value {
  font-weight: 500;
}

.trend-up-strong .trend-value,
.trend-up .trend-value {
  color: var(--color-success-green);
}

.trend-down-strong .trend-value,
.trend-down .trend-value {
  color: var(--color-error-red);
}

.trend-volatile .trend-value {
  color: var(--color-purple-500);
}
</style> 