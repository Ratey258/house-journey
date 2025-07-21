<!-- 
  基础按钮组件
  遵循UI设计规范中的按钮设计
-->
<template>
  <button 
    :class="['game-button', size, variant, { disabled, hoverable }]" 
    :disabled="disabled"
    @click="onClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <i v-if="icon" :class="['button-icon', `icon-${icon}`]"></i>
    <span class="button-text"><slot></slot></span>
    <span v-if="loading" class="button-loader"></span>
  </button>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'secondary', 'outline', 'text', 'success', 'danger', 'warning'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  icon: String,
  disabled: Boolean,
  loading: Boolean,
  hoverable: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['click']);

// 点击事件
const onClick = (event) => {
  if (!props.disabled && !props.loading) {
    // 创建点击波纹效果
    createRippleEffect(event);
    emit('click', event);
  }
};

// 鼠标进入事件
const handleMouseEnter = () => {
  if (!props.disabled && !props.loading && props.hoverable) {
    // 可以添加悬停效果
  }
};

// 鼠标离开事件
const handleMouseLeave = () => {
  if (!props.disabled && !props.loading && props.hoverable) {
    // 可以移除悬停效果
  }
};

// 创建波纹效果
const createRippleEffect = (event) => {
  const button = event.currentTarget;
  const ripple = document.createElement('span');
  const rect = button.getBoundingClientRect();
  
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  
  ripple.className = 'ripple';
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  
  button.appendChild(ripple);
  
  // 动画结束后移除元素
  ripple.addEventListener('animationend', () => {
    ripple.remove();
  });
};
</script>

<style scoped>
.game-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-md);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  transition: all var(--transition-normal) var(--ease-out);
  cursor: pointer;
  user-select: none;
  border: none;
  padding: 0 var(--space-4);
  position: relative;
  overflow: hidden;
}

.game-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.game-button:active {
  transform: translateY(0);
}

/* 主要按钮 */
.game-button.primary {
  background: var(--gradient-primary);
  color: var(--color-white);
  box-shadow: var(--shadow-sm);
}

/* 次要按钮 */
.game-button.secondary {
  background: var(--color-white);
  color: var(--color-brand-blue);
  border: 1px solid var(--color-gray-200);
}

/* 轮廓按钮 */
.game-button.outline {
  background: transparent;
  color: var(--color-brand-blue);
  border: 1px solid var(--color-brand-blue);
}

/* 文本按钮 */
.game-button.text {
  background: transparent;
  color: var(--color-brand-blue);
  padding: var(--space-1) var(--space-2);
}

.game-button.text:hover {
  background-color: rgba(52, 152, 219, 0.05);
  transform: none;
  box-shadow: none;
}

/* 成功按钮 */
.game-button.success {
  background: linear-gradient(135deg, var(--color-success-green), #27ae60);
  color: var(--color-white);
}

/* 危险按钮 */
.game-button.danger {
  background: linear-gradient(135deg, var(--color-error-red), #c0392b);
  color: var(--color-white);
}

/* 警告按钮 */
.game-button.warning {
  background: linear-gradient(135deg, var(--color-warning-orange), #d35400);
  color: var(--color-white);
}

/* 按钮尺寸 */
.game-button.small {
  height: 32px;
  font-size: var(--font-size-sm);
}

.game-button.medium {
  height: 40px;
  font-size: var(--font-size-md);
}

.game-button.large {
  height: 48px;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

/* 禁用状态 */
.game-button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
  transform: none !important;
  box-shadow: none !important;
}

/* 加载状态 */
.button-loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: var(--color-white);
  animation: spin 1s linear infinite;
  margin-left: var(--space-2);
}

/* 图标 */
.button-icon {
  font-size: 1.2em;
}

/* 波纹效果 */
.ripple {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.4);
  transform: scale(0);
  animation: ripple 0.6s linear;
}

@keyframes ripple {
  to {
    transform: scale(2);
    opacity: 0;
  }
}
</style> 